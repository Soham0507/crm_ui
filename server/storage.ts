import {
  contacts,
  notes,
  tasks,
  activities,
  users,
  customTables,
  customTableRecords,
  icpProfiles,
  leadLists,
  leads,
  campaigns,
  campaignSteps,
  emailTemplates,
  emails,
  emailProviderAccounts,
  emailSequences,
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
  type CustomTableWithRecords,
  type CustomTableSummary,
  type ICPProfile,
  type InsertICPProfile,
  type LeadList,
  type InsertLeadList,
  type Lead,
  type InsertLead,
  type Campaign,
  type InsertCampaign,
  type CampaignStep,
  type EmailTemplate,
  type InsertEmailTemplate,
  type Email,
  type InsertEmail,
  type EmailProviderAccount,
  type InsertEmailProviderAccount,
  type EmailSequence,
  type InsertEmailSequence,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, getTableColumns } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Contacts
  getContacts(userId: string): Promise<Contact[]>;
  getContact(id: number, userId: string): Promise<Contact | undefined>;
  getContactWithDetails(
    id: number,
    userId: string,
  ): Promise<ContactWithDetails | undefined>;
  createContact(contact: InsertContact, userId: string): Promise<Contact>;
  updateContact(
    id: number,
    contact: Partial<InsertContact>,
    userId: string,
  ): Promise<Contact | undefined>;
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
  getCustomTables(userId: string): Promise<CustomTableSummary[]>;
  getCustomTable(id: number, userId: string): Promise<CustomTable | undefined>;
  getCustomTableWithRecords(
    id: number,
    userId: string,
  ): Promise<CustomTableWithRecords | undefined>;
  createCustomTable(table: InsertCustomTable): Promise<CustomTable>;
  updateCustomTable(
    id: number,
    table: Partial<InsertCustomTable>,
    userId: string,
  ): Promise<CustomTable | undefined>;
  deleteCustomTable(id: number, userId: string): Promise<boolean>;

  // Custom Table Records
  getCustomTableRecords(
    tableId: number,
    userId: string,
  ): Promise<CustomTableRecord[]>;
  getCustomTableRecord(
    id: number,
    userId: string,
  ): Promise<CustomTableRecord | undefined>;
  createCustomTableRecord(
    record: InsertCustomTableRecord,
  ): Promise<CustomTableRecord>;
  updateCustomTableRecord(
    id: number,
    record: Partial<InsertCustomTableRecord>,
    userId: string,
  ): Promise<CustomTableRecord | undefined>;
  deleteCustomTableRecord(id: number, userId: string): Promise<boolean>;

  // Sales Outreach - ICP Profiles
  getICPProfiles(userId: string): Promise<ICPProfile[]>;
  getICPProfile(id: number, userId: string): Promise<ICPProfile | undefined>;
  createICPProfile(profile: InsertICPProfile): Promise<ICPProfile>;
  updateICPProfile(
    id: number,
    profile: Partial<InsertICPProfile>,
    userId: string,
  ): Promise<ICPProfile | undefined>;
  deleteICPProfile(id: number, userId: string): Promise<boolean>;

  // Sales Outreach - Lead Lists
  getLeadLists(userId: string): Promise<LeadList[]>;
  getLeadList(id: number, userId: string): Promise<LeadList | undefined>;
  createLeadList(list: InsertLeadList): Promise<LeadList>;
  updateLeadList(
    id: number,
    list: Partial<Omit<InsertLeadList, "userId">>,
    userId: string,
  ): Promise<LeadList | undefined>;
  deleteLeadList(id: number, userId: string): Promise<boolean>;

  // Sales Outreach - Leads
  getLeadsByList(listId: number, userId: string): Promise<Lead[]>;
  getLeadById(id: number, userId: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  createLeadsForList(
    listId: number,
    userId: string,
    leads: InsertLead[],
  ): Promise<Lead[]>;
  updateLead(
    id: number,
    updates: Partial<Omit<InsertLead, "listId">>,
    userId: string,
  ): Promise<Lead | undefined>;
  updateLeadsByIds(
    ids: number[],
    updates: Partial<Omit<InsertLead, "listId">>,
    userId: string,
  ): Promise<Lead[]>;
  enrichLeads(
    leadIds: number[],
    enrichmentData: { leadId: number; data: any }[],
    userId: string,
  ): Promise<void>;

  // Sales Outreach - Campaigns
  getCampaigns(userId: string): Promise<Campaign[]>;
  getCampaign(id: number, userId: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignStatus(
    id: number,
    userId: string,
    status: string,
  ): Promise<void>;

  // Sales Outreach - Campaign Steps
  createCampaignStep(step: any): Promise<CampaignStep>;

  // Sales Outreach - Email Templates
  getEmailTemplates(userId: string): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;

  // Emails - Sent emails management
  getEmails(userId: string): Promise<Email[]>;
  getEmailsByContact(contactId: number, userId: string): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmailStatus(
    id: number,
    userId: string,
    status: "draft" | "sending" | "sent" | "failed",
    error?: string,
  ): Promise<void>;

  // Email Provider Accounts
  createEmailProviderAccount(
    account: InsertEmailProviderAccount,
  ): Promise<EmailProviderAccount>;
  getEmailProviderAccounts(userId: string): Promise<EmailProviderAccount[]>;
  getEmailProviderAccountById(
    id: number,
    userId: string,
  ): Promise<EmailProviderAccount | null>;
  updateEmailProviderAccount(
    id: number,
    userId: string,
    updates: Partial<EmailProviderAccount>,
  ): Promise<EmailProviderAccount | null>;
  deleteEmailProviderAccount(id: number, userId: string): Promise<void>;

  // Email Sequences
  createEmailSequence(sequence: InsertEmailSequence): Promise<EmailSequence>;
  getEmailSequencesByCampaign(campaignId: number): Promise<EmailSequence[]>;
  updateEmailSequence(
    id: number,
    updates: Partial<EmailSequence>,
  ): Promise<EmailSequence | null>;
  deleteEmailSequence(id: number): Promise<void>;
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
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(contacts.createdAt);
  }

  async getContact(id: number, userId: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return contact || undefined;
  }

  async getContactWithDetails(
    id: number,
    userId: string,
  ): Promise<ContactWithDetails | undefined> {
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

  async createContact(
    insertContact: InsertContact,
    userId: string,
  ): Promise<Contact> {
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

  async updateContact(
    id: number,
    updateData: Partial<InsertContact>,
    userId: string,
  ): Promise<Contact | undefined> {
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

    const result = await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));

    return result.rowCount !== null && result.rowCount > 0;
  }

  // Notes
  async getNotesByContactId(contactId: number): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.contactId, contactId))
      .orderBy(notes.createdAt);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values(insertNote).returning();

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
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.contactId, contactId))
      .orderBy(tasks.completed, tasks.createdAt);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(
    id: number,
    updateData: Partial<InsertTask>,
  ): Promise<Task | undefined> {
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
    return await db
      .select()
      .from(activities)
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
  async getCustomTables(userId: string): Promise<CustomTableSummary[]> {
    return await db
      .select({
        ...getTableColumns(customTables),
        recordCount: count(customTableRecords.id),
      })
      .from(customTables)
      // A left join keeps tables that have no records yet.
      .leftJoin(
        customTableRecords,
        and(
          eq(customTableRecords.tableId, customTables.id),
          eq(customTableRecords.userId, userId),
        ),
      )
      .where(
        and(eq(customTables.userId, userId), eq(customTables.isActive, true)),
      )
      .groupBy(customTables.id)
      .orderBy(customTables.createdAt);
  }

  async getCustomTable(
    id: number,
    userId: string,
  ): Promise<CustomTable | undefined> {
    const [table] = await db
      .select()
      .from(customTables)
      .where(and(eq(customTables.id, id), eq(customTables.userId, userId)));
    return table;
  }

  async getCustomTableWithRecords(
    id: number,
    userId: string,
  ): Promise<CustomTableWithRecords | undefined> {
    const table = await this.getCustomTable(id, userId);
    if (!table) return undefined;

    const records = await this.getCustomTableRecords(id, userId);
    return { ...table, records };
  }

  async createCustomTable(
    insertTable: InsertCustomTable,
  ): Promise<CustomTable> {
    const [table] = await db
      .insert(customTables)
      .values(insertTable)
      .returning();
    return table;
  }

  async updateCustomTable(
    id: number,
    updateData: Partial<InsertCustomTable>,
    userId: string,
  ): Promise<CustomTable | undefined> {
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
  async getCustomTableRecords(
    tableId: number,
    userId: string,
  ): Promise<CustomTableRecord[]> {
    return await db
      .select()
      .from(customTableRecords)
      .where(
        and(
          eq(customTableRecords.tableId, tableId),
          eq(customTableRecords.userId, userId),
        ),
      )
      .orderBy(customTableRecords.createdAt);
  }

  async getCustomTableRecord(
    id: number,
    userId: string,
  ): Promise<CustomTableRecord | undefined> {
    const [record] = await db
      .select()
      .from(customTableRecords)
      .where(
        and(
          eq(customTableRecords.id, id),
          eq(customTableRecords.userId, userId),
        ),
      );
    return record;
  }

  async createCustomTableRecord(
    insertRecord: InsertCustomTableRecord,
  ): Promise<CustomTableRecord> {
    const [record] = await db
      .insert(customTableRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async updateCustomTableRecord(
    id: number,
    updateData: Partial<InsertCustomTableRecord>,
    userId: string,
  ): Promise<CustomTableRecord | undefined> {
    const [record] = await db
      .update(customTableRecords)
      .set({ ...updateData, updatedAt: new Date() })
      .where(
        and(
          eq(customTableRecords.id, id),
          eq(customTableRecords.userId, userId),
        ),
      )
      .returning();
    return record;
  }

  async deleteCustomTableRecord(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(customTableRecords)
      .where(
        and(
          eq(customTableRecords.id, id),
          eq(customTableRecords.userId, userId),
        ),
      );
    return result.rowCount > 0;
  }

  // Sales Outreach - ICP Profiles
  async getICPProfiles(userId: string): Promise<ICPProfile[]> {
    return await db
      .select()
      .from(icpProfiles)
      .where(eq(icpProfiles.userId, userId))
      .orderBy(icpProfiles.createdAt);
  }

  async getICPProfile(
    id: number,
    userId: string,
  ): Promise<ICPProfile | undefined> {
    const [profile] = await db
      .select()
      .from(icpProfiles)
      .where(and(eq(icpProfiles.id, id), eq(icpProfiles.userId, userId)));
    return profile;
  }

  async createICPProfile(profile: InsertICPProfile): Promise<ICPProfile> {
    const [newProfile] = await db
      .insert(icpProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateICPProfile(
    id: number,
    profile: Partial<InsertICPProfile>,
    userId: string,
  ): Promise<ICPProfile | undefined> {
    const [updated] = await db
      .update(icpProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(and(eq(icpProfiles.id, id), eq(icpProfiles.userId, userId)))
      .returning();
    return updated;
  }

  async deleteICPProfile(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(icpProfiles)
      .where(and(eq(icpProfiles.id, id), eq(icpProfiles.userId, userId)));
    return result.rowCount > 0;
  }

  // Sales Outreach - Lead Lists
  async getLeadLists(userId: string): Promise<LeadList[]> {
    return await db
      .select()
      .from(leadLists)
      .where(eq(leadLists.userId, userId))
      .orderBy(leadLists.createdAt);
  }

  async getLeadList(id: number, userId: string): Promise<LeadList | undefined> {
    const [list] = await db
      .select()
      .from(leadLists)
      .where(and(eq(leadLists.id, id), eq(leadLists.userId, userId)));
    return list;
  }

  async createLeadList(list: InsertLeadList): Promise<LeadList> {
    const [newList] = await db.insert(leadLists).values(list).returning();
    return newList;
  }

  async updateLeadList(
    id: number,
    list: Partial<Omit<InsertLeadList, "userId">>,
    userId: string,
  ): Promise<LeadList | undefined> {
    const [updated] = await db
      .update(leadLists)
      .set(list)
      .where(and(eq(leadLists.id, id), eq(leadLists.userId, userId)))
      .returning();
    return updated;
  }

  async deleteLeadList(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(leadLists)
      .where(and(eq(leadLists.id, id), eq(leadLists.userId, userId)));
    return result.rowCount > 0;
  }

  // Sales Outreach - Leads
  async getLeadsByList(listId: number, userId: string): Promise<Lead[]> {
    // Verify the list belongs to the user
    const [list] = await db
      .select()
      .from(leadLists)
      .where(and(eq(leadLists.id, listId), eq(leadLists.userId, userId)));

    if (!list) return [];

    return await db
      .select()
      .from(leads)
      .where(eq(leads.listId, listId))
      .orderBy(leads.createdAt);
  }

  async getLeadById(id: number, userId: string): Promise<Lead | undefined> {
    const [lead] = await db
      .select()
      .from(leads)
      .innerJoin(leadLists, eq(leads.listId, leadLists.id))
      .where(and(eq(leads.id, id), eq(leadLists.userId, userId)));

    return lead?.leads;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async createLeadsForList(
    listId: number,
    userId: string,
    leadsData: InsertLead[],
  ): Promise<Lead[]> {
    // Verify the list belongs to the user
    const [list] = await db
      .select()
      .from(leadLists)
      .where(and(eq(leadLists.id, listId), eq(leadLists.userId, userId)));

    if (!list) throw new Error("List not found or unauthorized");

    // Ensure all leads are for the correct list
    const leadsWithListId = leadsData.map((lead) => ({ ...lead, listId }));

    const newLeads = await db.insert(leads).values(leadsWithListId).returning();

    return newLeads;
  }

  async updateLead(
    id: number,
    updates: Partial<Omit<InsertLead, "listId">>,
    userId: string,
  ): Promise<Lead | undefined> {
    // Verify the lead belongs to the user through its list
    const [existingLead] = await db
      .select()
      .from(leads)
      .innerJoin(leadLists, eq(leads.listId, leadLists.id))
      .where(and(eq(leads.id, id), eq(leadLists.userId, userId)));

    if (!existingLead) return undefined;

    const [updated] = await db
      .update(leads)
      .set(updates)
      .where(eq(leads.id, id))
      .returning();

    return updated;
  }

  async updateLeadsByIds(
    ids: number[],
    updates: Partial<Omit<InsertLead, "listId">>,
    userId: string,
  ): Promise<Lead[]> {
    if (ids.length === 0) return [];

    // Verify all leads belong to the user through their lists
    const userLeads = await db
      .select()
      .from(leads)
      .innerJoin(leadLists, eq(leads.listId, leadLists.id))
      .where(and(eq(leadLists.userId, userId)));

    const userLeadIds = new Set(userLeads.map((l) => l.leads.id));
    const validIds = ids.filter((id) => userLeadIds.has(id));

    if (validIds.length === 0) return [];

    const updatedLeads = await db
      .update(leads)
      .set(updates)
      .where(eq(leads.id, validIds[0])) // This needs a better implementation for multiple IDs
      .returning();

    return updatedLeads;
  }

  async enrichLeads(
    leadIds: number[],
    enrichmentData: { leadId: number; data: any }[],
    userId: string,
  ): Promise<void> {
    // Verify all leads belong to the user
    const userLeads = await db
      .select()
      .from(leads)
      .innerJoin(leadLists, eq(leads.listId, leadLists.id))
      .where(eq(leadLists.userId, userId));

    const userLeadIds = new Set(userLeads.map((l) => l.leads.id));

    // Process each enrichment
    for (const enrichment of enrichmentData) {
      if (!userLeadIds.has(enrichment.leadId)) continue;

      // Merge enrichment data with existing lead data
      const [existingLead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, enrichment.leadId));

      if (existingLead) {
        const mergedData = {
          ...existingLead.data,
          ...enrichment.data,
        };

        await db
          .update(leads)
          .set({ data: mergedData })
          .where(eq(leads.id, enrichment.leadId));
      }
    }
  }

  // Sales Outreach - Campaigns
  async getCampaigns(userId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(campaigns.createdAt);
  }

  async getCampaign(id: number, userId: string): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db
      .insert(campaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateCampaignStatus(
    id: number,
    userId: string,
    status: string,
  ): Promise<void> {
    await db
      .update(campaigns)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
  }

  // Sales Outreach - Campaign Steps
  async createCampaignStep(step: any): Promise<CampaignStep> {
    const [newStep] = await db.insert(campaignSteps).values(step).returning();
    return newStep;
  }

  // Sales Outreach - Email Templates
  async getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
    return await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.userId, userId))
      .orderBy(emailTemplates.createdAt);
  }

  async createEmailTemplate(
    template: InsertEmailTemplate,
  ): Promise<EmailTemplate> {
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  // Emails - Sent emails management
  async getEmails(userId: string): Promise<Email[]> {
    return await db
      .select()
      .from(emails)
      .where(eq(emails.userId, userId))
      .orderBy(emails.createdAt);
  }

  async getEmailsByContact(
    contactId: number,
    userId: string,
  ): Promise<Email[]> {
    return await db
      .select()
      .from(emails)
      .where(and(eq(emails.contactId, contactId), eq(emails.userId, userId)))
      .orderBy(emails.createdAt);
  }

  async createEmail(email: InsertEmail): Promise<Email> {
    const [newEmail] = await db.insert(emails).values(email).returning();
    return newEmail;
  }

  async updateEmailStatus(
    id: number,
    userId: string,
    status: "draft" | "sending" | "sent" | "failed",
    error?: string,
  ): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "sent") {
      updateData.sentAt = new Date();
    }

    if (error) {
      updateData.error = error;
    }

    await db
      .update(emails)
      .set(updateData)
      .where(and(eq(emails.id, id), eq(emails.userId, userId)));
  }

  // Email Provider Accounts
  async createEmailProviderAccount(
    account: InsertEmailProviderAccount,
  ): Promise<EmailProviderAccount> {
    // Set other accounts as non-default if this is set as default
    if (account.isDefault) {
      await db
        .update(emailProviderAccounts)
        .set({ isDefault: false })
        .where(eq(emailProviderAccounts.userId, account.userId));
    }
    const [created] = await db
      .insert(emailProviderAccounts)
      .values(account)
      .returning();
    return created;
  }

  async getEmailProviderAccounts(
    userId: string,
  ): Promise<EmailProviderAccount[]> {
    return db
      .select()
      .from(emailProviderAccounts)
      .where(eq(emailProviderAccounts.userId, userId))
      .orderBy(
        desc(emailProviderAccounts.isDefault),
        desc(emailProviderAccounts.createdAt),
      );
  }

  async getEmailProviderAccountById(
    id: number,
    userId: string,
  ): Promise<EmailProviderAccount | null> {
    const [account] = await db
      .select()
      .from(emailProviderAccounts)
      .where(
        and(
          eq(emailProviderAccounts.id, id),
          eq(emailProviderAccounts.userId, userId),
        ),
      );
    return account || null;
  }

  async updateEmailProviderAccount(
    id: number,
    userId: string,
    updates: Partial<EmailProviderAccount>,
  ): Promise<EmailProviderAccount | null> {
    // If setting as default, unset others
    if (updates.isDefault) {
      await db
        .update(emailProviderAccounts)
        .set({ isDefault: false })
        .where(eq(emailProviderAccounts.userId, userId));
    }

    const [updated] = await db
      .update(emailProviderAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(
          eq(emailProviderAccounts.id, id),
          eq(emailProviderAccounts.userId, userId),
        ),
      )
      .returning();
    return updated || null;
  }

  async deleteEmailProviderAccount(id: number, userId: string): Promise<void> {
    await db
      .delete(emailProviderAccounts)
      .where(
        and(
          eq(emailProviderAccounts.id, id),
          eq(emailProviderAccounts.userId, userId),
        ),
      );
  }

  // Email Sequences
  async createEmailSequence(
    sequence: InsertEmailSequence,
  ): Promise<EmailSequence> {
    const [created] = await db
      .insert(emailSequences)
      .values(sequence)
      .returning();
    return created;
  }

  async getEmailSequencesByCampaign(
    campaignId: number,
  ): Promise<EmailSequence[]> {
    return db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.campaignId, campaignId))
      .orderBy(emailSequences.stepNumber);
  }

  async updateEmailSequence(
    id: number,
    updates: Partial<EmailSequence>,
  ): Promise<EmailSequence | null> {
    const [updated] = await db
      .update(emailSequences)
      .set(updates)
      .where(eq(emailSequences.id, id))
      .returning();
    return updated || null;
  }

  async deleteEmailSequence(id: number): Promise<void> {
    await db.delete(emailSequences).where(eq(emailSequences.id, id));
  }
}

export const storage = new DatabaseStorage();
