import { 
  contacts, 
  notes, 
  tasks, 
  activities,
  type Contact, 
  type InsertContact,
  type Note,
  type InsertNote,
  type Task,
  type InsertTask,
  type Activity,
  type InsertActivity,
  type ContactWithDetails
} from "@shared/schema";

export interface IStorage {
  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  getContactWithDetails(id: number): Promise<ContactWithDetails | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Notes
  getNotesByContactId(contactId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: number): Promise<boolean>;
  
  // Tasks
  getTasksByContactId(contactId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Activities
  getActivitiesByContactId(contactId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private contacts: Map<number, Contact>;
  private notes: Map<number, Note>;
  private tasks: Map<number, Task>;
  private activities: Map<number, Activity>;
  private currentContactId: number;
  private currentNoteId: number;
  private currentTaskId: number;
  private currentActivityId: number;

  constructor() {
    this.contacts = new Map();
    this.notes = new Map();
    this.tasks = new Map();
    this.activities = new Map();
    this.currentContactId = 1;
    this.currentNoteId = 1;
    this.currentTaskId = 1;
    this.currentActivityId = 1;
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactWithDetails(id: number): Promise<ContactWithDetails | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;

    const contactNotes = await this.getNotesByContactId(id);
    const contactTasks = await this.getTasksByContactId(id);
    const contactActivities = await this.getActivitiesByContactId(id);

    return {
      ...contact,
      notes: contactNotes,
      tasks: contactTasks,
      activities: contactActivities,
    };
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const now = new Date();
    const contact: Contact = {
      ...insertContact,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.contacts.set(id, contact);

    // Create initial activity
    await this.createActivity({
      contactId: id,
      type: "status_change",
      description: `Contact created with status: ${contact.status}`,
    });

    return contact;
  }

  async updateContact(id: number, updateData: Partial<InsertContact>): Promise<Contact | undefined> {
    const existing = this.contacts.get(id);
    if (!existing) return undefined;

    const updated: Contact = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.contacts.set(id, updated);

    // Track status changes
    if (updateData.status && updateData.status !== existing.status) {
      await this.createActivity({
        contactId: id,
        type: "status_change",
        description: `Status changed from ${existing.status} to ${updateData.status}`,
      });
    }

    return updated;
  }

  async deleteContact(id: number): Promise<boolean> {
    const deleted = this.contacts.delete(id);
    if (deleted) {
      // Clean up related data
      const contactNotes = Array.from(this.notes.values()).filter(note => note.contactId === id);
      const contactTasks = Array.from(this.tasks.values()).filter(task => task.contactId === id);
      const contactActivities = Array.from(this.activities.values()).filter(activity => activity.contactId === id);

      contactNotes.forEach(note => this.notes.delete(note.id));
      contactTasks.forEach(task => this.tasks.delete(task.id));
      contactActivities.forEach(activity => this.activities.delete(activity.id));
    }
    return deleted;
  }

  // Notes
  async getNotesByContactId(contactId: number): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => note.contactId === contactId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = {
      ...insertNote,
      id,
      createdAt: new Date(),
    };
    this.notes.set(id, note);

    // Create activity
    await this.createActivity({
      contactId: insertNote.contactId,
      type: "note_added",
      description: "Added a new note",
    });

    return note;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Tasks
  async getTasksByContactId(contactId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.contactId === contactId)
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
      });
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = {
      ...insertTask,
      id,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);

    return task;
  }

  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;

    const updated: Task = {
      ...existing,
      ...updateData,
    };
    this.tasks.set(id, updated);

    // Track task completion
    if (updateData.completed && !existing.completed) {
      await this.createActivity({
        contactId: existing.contactId,
        type: "task_completed",
        description: `Completed task: ${existing.title}`,
      });
    }

    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Activities
  async getActivitiesByContactId(contactId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.contactId === contactId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
