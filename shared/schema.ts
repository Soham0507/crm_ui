import {
  pgTable,
  text,
  varchar,
  serial,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
  json,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  status: text("status").notNull().default("lead"), // lead, qualified, proposal, closed-won, closed-lost
  dealValue: real("deal_value").default(0),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  type: text("type").notNull(), // status_change, call, email, note_added, task_completed
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom Tables Schema
export const customTables = pgTable("custom_tables", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  schema: jsonb("schema").notNull(), // Store column definitions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Table Records
export const customTableRecords = pgTable("custom_table_records", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull().references(() => customTables.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(), // Store record data as JSON
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertCustomTableSchema = createInsertSchema(customTables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomTableRecordSchema = createInsertSchema(customTableRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type CustomTable = typeof customTables.$inferSelect;
export type InsertCustomTable = z.infer<typeof insertCustomTableSchema>;
export type CustomTableRecord = typeof customTableRecords.$inferSelect;
export type InsertCustomTableRecord = z.infer<typeof insertCustomTableRecordSchema>;

// Sales Outreach Agent schemas
export const icpProfiles = pgTable('icp_profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  config: jsonb('config').notNull(),
  narrative: text('narrative'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const leadLists = pgTable('lead_lists', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  icpId: integer('icp_id').references(() => icpProfiles.id),
  createdAt: timestamp('created_at').defaultNow()
});

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  listId: integer('list_id').references(() => leadLists.id),
  data: jsonb('data').notNull(),
  email: text('email'),
  status: text('status').notNull().default('new'),
  score: integer('score'),
  consent: boolean('consent').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  icpId: integer('icp_id').references(() => icpProfiles.id),
  listId: integer('list_id').references(() => leadLists.id),
  settings: jsonb('settings').notNull(),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const campaignSteps = pgTable('campaign_steps', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => campaigns.id),
  stepOrder: integer('step_order').notNull(),
  dayOffset: integer('day_offset').notNull(),
  channel: text('channel').notNull(), // email, linkedin
  templateId: text('template_id'),
  content: jsonb('content').notNull(),
  conditions: jsonb('conditions') // if no reply, etc
});

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  variables: text('variables').array(),
  category: text('category'), // cold, followup, etc
  createdAt: timestamp('created_at').defaultNow()
});

export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').references(() => leads.id),
  campaignId: integer('campaign_id').references(() => campaigns.id),
  stepId: integer('step_id').references(() => campaignSteps.id),
  status: text('status').notNull(), // queued, sent, opened, clicked, replied, bounced
  providerMessageId: text('provider_message_id'),
  sentAt: timestamp('sent_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  repliedAt: timestamp('replied_at'),
  createdAt: timestamp('created_at').defaultNow()
});

export const unsubscribes = pgTable('unsubscribes', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  source: text('source'),
  createdAt: timestamp('created_at').defaultNow()
});

// Emails - Sent emails history
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  campaignId: integer("campaign_id"),
  to: varchar("to", { length: 255 }).notNull(),
  cc: text("cc"),
  bcc: text("bcc"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  htmlBody: text("html_body"),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, sending, sent, failed
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  repliedAt: timestamp("replied_at"),
  messageId: varchar("message_id", { length: 255 }),
  threadId: varchar("thread_id", { length: 255 }),
  error: text("error"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types for Sales Outreach
export interface ICPConfig {
  company: {
    industries: string[];
    geo: string[];
    size: string[];
    tech: string[];
  };
  personas: {
    title: string[];
    seniority: string[];
    functions: string[];
  }[];
  pain_points: string[];
  triggers: string[];
  value_props: string[];
  keywords: string[];
}

export interface LeadData {
  fullName: string;
  title: string;
  linkedin?: string;
  email: {
    value: string;
    confidence: number;
    status: 'valid' | 'invalid' | 'pending';
  };
  company: {
    name: string;
    domain: string;
    size: string;
    industry: string;
  };
  geo: string;
  score: number;
  source: string;
  tags: string[];
}

export interface CampaignSettings {
  from: {
    name: string;
    email: string;
  };
  limits: {
    maxPerDay: number;
    window: string;
    timezone: string;
  };
  tracking: boolean;
  optOutFooter: boolean;
}

// Insert schemas
export const insertICPProfileSchema = createInsertSchema(icpProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLeadListSchema = createInsertSchema(leadLists).omit({
  id: true,
  createdAt: true
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true
});

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  createdAt: true
});

// Select types
export type ICPProfile = typeof icpProfiles.$inferSelect;
export type LeadList = typeof leadLists.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignStep = typeof campaignSteps.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type Delivery = typeof deliveries.$inferSelect;
export type Unsubscribe = typeof unsubscribes.$inferSelect;
export type Email = typeof emails.$inferSelect;

// Insert types
export type InsertICPProfile = z.infer<typeof insertICPProfileSchema>;
export type InsertLeadList = z.infer<typeof insertLeadListSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type InsertEmail = z.infer<typeof insertEmailSchema>;

export type ContactWithDetails = Contact & {
  notes: Note[];
  tasks: Task[];
  activities: Activity[];
};

// Custom Table Schema Types
export interface TableColumn {
  id: string;
  name: string;
  displayName: string;
  type: 'text' | 'longtext' | 'number' | 'currency' | 'date' | 'dropdown' | 'checkbox' | 'email' | 'phone' | 'url';
  required?: boolean;
  options?: string[]; // For dropdown type
  defaultValue?: any;
}

export interface CustomTableSchema {
  columns: TableColumn[];
  settings: {
    allowAdd: boolean;
    allowEdit: boolean;
    allowDelete: boolean;
  };
}

export type CustomTableWithRecords = CustomTable & {
  records: CustomTableRecord[];
};

// Email Provider Accounts (Gmail/Outlook OAuth)
export const emailProviderAccounts = pgTable('email_provider_accounts', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 20 }).notNull(), // 'gmail', 'outlook'
  email: varchar('email', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry'),
  isActive: boolean('is_active').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),
  dailyLimit: integer('daily_limit').notNull().default(500),
  sentToday: integer('sent_today').notNull().default(0),
  lastResetDate: timestamp('last_reset_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Email Sequences (Multi-step campaigns)
export const emailSequences = pgTable('email_sequences', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  templateId: integer('template_id').references(() => emailTemplates.id),
  delayDays: integer('delay_days').notNull().default(0),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Insert schemas for new tables
export const insertEmailProviderAccountSchema = createInsertSchema(emailProviderAccounts).omit({
  id: true,
  sentToday: true,
  createdAt: true,
  updatedAt: true
});

export const insertEmailSequenceSchema = createInsertSchema(emailSequences).omit({
  id: true,
  createdAt: true
});

// Select types for new tables
export type EmailProviderAccount = typeof emailProviderAccounts.$inferSelect;
export type EmailSequence = typeof emailSequences.$inferSelect;

// Insert types for new tables
export type InsertEmailProviderAccount = z.infer<typeof insertEmailProviderAccountSchema>;
export type InsertEmailSequence = z.infer<typeof insertEmailSequenceSchema>;
