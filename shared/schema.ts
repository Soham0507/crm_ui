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
