import { 
  contacts, 
  notes, 
  tasks, 
  activities,
  users,
  customTables,
  customTableRecords,
  type Contact, 
  type InsertContact,
  type Note,
  type InsertNote,
  type Task,
  type InsertTask,
  type Activity,
  type InsertActivity,
  type ContactWithDetails,
  type User,
  type UpsertUser,
  type CustomTable,
  type InsertCustomTable,
  type CustomTableRecord,
  type InsertCustomTableRecord,
  type CustomTableWithRecords
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Contacts
  getContacts(userId: string): Promise<Contact[]>;
  getContact(id: number, userId: string): Promise<Contact | undefined>;
  getContactWithDetails(id: number, userId: string): Promise<ContactWithDetails | undefined>;
  createContact(contact: InsertContact, userId: string): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>, userId: string): Promise<Contact | undefined>;
  deleteContact(id: number, userId: string): Promise<boolean>;
  
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
  
  // Custom Tables
  getCustomTables(userId: string): Promise<CustomTable[]>;
  getCustomTable(id: number, userId: string): Promise<CustomTable | undefined>;
  getCustomTableWithRecords(id: number, userId: string): Promise<CustomTableWithRecords | undefined>;
  createCustomTable(table: InsertCustomTable): Promise<CustomTable>;
  updateCustomTable(id: number, table: Partial<InsertCustomTable>, userId: string): Promise<CustomTable | undefined>;
  deleteCustomTable(id: number, userId: string): Promise<boolean>;
  
  // Custom Table Records
  getCustomTableRecords(tableId: number, userId: string): Promise<CustomTableRecord[]>;
  getCustomTableRecord(id: number, userId: string): Promise<CustomTableRecord | undefined>;
  createCustomTableRecord(record: InsertCustomTableRecord): Promise<CustomTableRecord>;
  updateCustomTableRecord(id: number, record: Partial<InsertCustomTableRecord>, userId: string): Promise<CustomTableRecord | undefined>;
  deleteCustomTableRecord(id: number, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Contacts
  async getContacts(userId: string): Promise<Contact[]> {
    return await db.select().from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(contacts.createdAt);
  }

  async getContact(id: number, userId: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return contact || undefined;
  }

  async getContactWithDetails(id: number, userId: string): Promise<ContactWithDetails | undefined> {
    const contact = await this.getContact(id, userId);
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

  async createContact(insertContact: InsertContact, userId: string): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values({ ...insertContact, userId })
      .returning();

    // Create initial activity
    await this.createActivity({
      contactId: contact.id,
      type: "status_change",
      description: `Contact created with status: ${contact.status}`,
    });

    return contact;
  }

  async updateContact(id: number, updateData: Partial<InsertContact>, userId: string): Promise<Contact | undefined> {
    const existing = await this.getContact(id, userId);
    if (!existing) return undefined;

    const [updated] = await db
      .update(contacts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning();

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

  async deleteContact(id: number, userId: string): Promise<boolean> {
    const contact = await this.getContact(id, userId);
    if (!contact) return false;

    // Delete related data
    await db.delete(notes).where(eq(notes.contactId, id));
    await db.delete(tasks).where(eq(tasks.contactId, id));
    await db.delete(activities).where(eq(activities.contactId, id));
    
    const result = await db.delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Notes
  async getNotesByContactId(contactId: number): Promise<Note[]> {
    return await db.select().from(notes)
      .where(eq(notes.contactId, contactId))
      .orderBy(notes.createdAt);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values(insertNote)
      .returning();

    // Create activity
    await this.createActivity({
      contactId: insertNote.contactId,
      type: "note_added",
      description: "Added a new note",
    });

    return note;
  }

  async deleteNote(id: number): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Tasks
  async getTasksByContactId(contactId: number): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.contactId, contactId))
      .orderBy(tasks.completed, tasks.createdAt);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = await db.select().from(tasks).where(eq(tasks.id, id));
    if (existing.length === 0) return undefined;

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    // Track task completion
    if (updateData.completed && !existing[0].completed) {
      await this.createActivity({
        contactId: existing[0].contactId,
        type: "task_completed",
        description: `Completed task: ${existing[0].title}`,
      });
    }

    return updated;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Activities
  async getActivitiesByContactId(contactId: number): Promise<Activity[]> {
    return await db.select().from(activities)
      .where(eq(activities.contactId, contactId))
      .orderBy(activities.createdAt);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  // Custom Tables
  async getCustomTables(userId: string): Promise<CustomTable[]> {
    return await db
      .select()
      .from(customTables)
      .where(and(eq(customTables.userId, userId), eq(customTables.isActive, true)))
      .orderBy(customTables.createdAt);
  }

  async getCustomTable(id: number, userId: string): Promise<CustomTable | undefined> {
    const [table] = await db
      .select()
      .from(customTables)
      .where(and(eq(customTables.id, id), eq(customTables.userId, userId)));
    return table;
  }

  async getCustomTableWithRecords(id: number, userId: string): Promise<CustomTableWithRecords | undefined> {
    const table = await this.getCustomTable(id, userId);
    if (!table) return undefined;

    const records = await this.getCustomTableRecords(id, userId);
    return { ...table, records };
  }

  async createCustomTable(insertTable: InsertCustomTable): Promise<CustomTable> {
    const [table] = await db
      .insert(customTables)
      .values(insertTable)
      .returning();
    return table;
  }

  async updateCustomTable(id: number, updateData: Partial<InsertCustomTable>, userId: string): Promise<CustomTable | undefined> {
    try {
      console.log("Updating custom table:", { id, userId, updateData });
      const [table] = await db
        .update(customTables)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(eq(customTables.id, id), eq(customTables.userId, userId)))
        .returning();
      console.log("Updated table:", table);
      return table;
    } catch (error) {
      console.error("Error in updateCustomTable:", error);
      throw error;
    }
  }

  async deleteCustomTable(id: number, userId: string): Promise<boolean> {
    const result = await db
      .update(customTables)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(customTables.id, id), eq(customTables.userId, userId)));
    return result.rowCount > 0;
  }

  // Custom Table Records
  async getCustomTableRecords(tableId: number, userId: string): Promise<CustomTableRecord[]> {
    return await db
      .select()
      .from(customTableRecords)
      .where(and(eq(customTableRecords.tableId, tableId), eq(customTableRecords.userId, userId)))
      .orderBy(customTableRecords.createdAt);
  }

  async getCustomTableRecord(id: number, userId: string): Promise<CustomTableRecord | undefined> {
    const [record] = await db
      .select()
      .from(customTableRecords)
      .where(and(eq(customTableRecords.id, id), eq(customTableRecords.userId, userId)));
    return record;
  }

  async createCustomTableRecord(insertRecord: InsertCustomTableRecord): Promise<CustomTableRecord> {
    const [record] = await db
      .insert(customTableRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async updateCustomTableRecord(id: number, updateData: Partial<InsertCustomTableRecord>, userId: string): Promise<CustomTableRecord | undefined> {
    const [record] = await db
      .update(customTableRecords)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(customTableRecords.id, id), eq(customTableRecords.userId, userId)))
      .returning();
    return record;
  }

  async deleteCustomTableRecord(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(customTableRecords)
      .where(and(eq(customTableRecords.id, id), eq(customTableRecords.userId, userId)));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
