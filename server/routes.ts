import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertContactSchema, insertNoteSchema, insertTaskSchema } from "@shared/schema";
import { generateContactInsights, generateBulkInsights } from "./aiInsights";
import { z } from "zod";
import multer from "multer";
import csvParser from "csv-parser";
import { Parser } from "json2csv";
import fs from "fs";

const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all contacts
  app.get("/api/contacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getContacts(userId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Get contact with details
  app.get("/api/contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const contact = await storage.getContactWithDetails(id, userId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  // Create contact
  app.post("/api/contacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData, userId);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  // Update contact
  app.patch("/api/contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData, userId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  // Delete contact
  app.delete("/api/contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteContact(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Create note
  app.post("/api/contacts/:id/notes", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const validatedData = insertNoteSchema.parse({ ...req.body, contactId });
      const note = await storage.createNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  // Create task
  app.post("/api/contacts/:id/tasks", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const validatedData = insertTaskSchema.parse({ ...req.body, contactId });
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Update task
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, validatedData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Get pipeline stats
  app.get("/api/pipeline/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getContacts(userId);
      const stats = {
        totalContacts: contacts.length,
        activeDeals: contacts.filter(c => !['closed-won', 'closed-lost'].includes(c.status)).length,
        pipeline: {
          lead: {
            count: contacts.filter(c => c.status === 'lead').length,
            value: contacts.filter(c => c.status === 'lead').reduce((sum, c) => sum + (c.dealValue || 0), 0)
          },
          qualified: {
            count: contacts.filter(c => c.status === 'qualified').length,
            value: contacts.filter(c => c.status === 'qualified').reduce((sum, c) => sum + (c.dealValue || 0), 0)
          },
          proposal: {
            count: contacts.filter(c => c.status === 'proposal').length,
            value: contacts.filter(c => c.status === 'proposal').reduce((sum, c) => sum + (c.dealValue || 0), 0)
          },
          closed: {
            count: contacts.filter(c => ['closed-won', 'closed-lost'].includes(c.status)).length,
            value: contacts.filter(c => c.status === 'closed-won').reduce((sum, c) => sum + (c.dealValue || 0), 0)
          }
        },
        totalValue: contacts.reduce((sum, c) => sum + (c.dealValue || 0), 0)
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pipeline stats" });
    }
  });

  // Export contacts as CSV
  app.get("/api/contacts/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getContacts(userId);
      const fields = ['name', 'email', 'phone', 'company', 'status', 'dealValue', 'tags'];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(contacts);
      
      res.header('Content-Type', 'text/csv');
      res.attachment('contacts.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export contacts" });
    }
  });

  // Import contacts from CSV
  app.post("/api/contacts/import", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const results: any[] = [];
      const errors: string[] = [];
      let processed = 0;
      let created = 0;

      // Process CSV file
      const stream = fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (data) => {
          processed++;
          try {
            // Clean and validate data with multiple column name variations
            const contactData = {
              name: data.name || data.Name || data.NAME || '',
              email: data.email || data.Email || data.EMAIL || '',
              phone: data.phone || data.Phone || data.PHONE || '',
              company: data.company || data.Company || data.COMPANY || '',
              status: (data.status || data.Status || data.STATUS || 'lead').toLowerCase(),
              dealValue: parseFloat(data.dealValue || data['Deal Value'] || data.dealvalue || data.DEALVALUE || '0') || 0,
              tags: data.tags || data.Tags || data.TAGS ? 
                (data.tags || data.Tags || data.TAGS).split(/[,;]/).map((tag: string) => tag.trim()).filter(Boolean) : 
                []
            };

            // Validate required fields
            if (!contactData.name.trim()) {
              errors.push(`Row ${processed}: Name is required`);
              return;
            }
            if (!contactData.email.trim()) {
              errors.push(`Row ${processed}: Email is required`);
              return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contactData.email)) {
              errors.push(`Row ${processed}: Invalid email format`);
              return;
            }

            // Validate status
            const validStatuses = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
            if (!validStatuses.includes(contactData.status)) {
              contactData.status = 'lead'; // Default to lead if invalid
            }

            results.push(contactData);
          } catch (error) {
            errors.push(`Row ${processed}: Invalid data format - ${error}`);
          }
        })
        .on('end', async () => {
          try {
            // Process valid contacts
            for (const contactData of results) {
              try {
                const validatedData = insertContactSchema.parse(contactData);
                await storage.createContact(validatedData, userId);
                created++;
              } catch (error) {
                console.error('Failed to create contact:', error);
                errors.push(`Failed to create contact: ${contactData.name} - ${error}`);
              }
            }

            // Clean up uploaded file
            if (fs.existsSync(req.file!.path)) {
              fs.unlinkSync(req.file!.path);
            }

            const response = {
              processed,
              created,
              errors: errors.length > 0 ? errors : undefined,
              message: `Successfully imported ${created} out of ${processed} contacts${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
            };

            console.log('Import result:', response);
            res.json(response);
          } catch (error) {
            console.error('Error processing import:', error);
            res.status(500).json({ message: "Failed to process import", error: error.toString() });
          }
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error);
          errors.push('Failed to parse CSV file: ' + error.message);
          res.status(400).json({ message: "Invalid CSV file", errors });
        });

    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ message: "Failed to import contacts", error: error.toString() });
    }
  });

  // Custom Tables routes
  app.get("/api/custom-tables", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tables = await storage.getCustomTables(userId);
      res.json(tables);
    } catch (error) {
      console.error("Error fetching custom tables:", error);
      res.status(500).json({ message: "Failed to fetch custom tables" });
    }
  });

  app.get("/api/custom-tables/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tableId = parseInt(req.params.id);
      const table = await storage.getCustomTableWithRecords(tableId, userId);
      
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(table);
    } catch (error) {
      console.error("Error fetching custom table:", error);
      res.status(500).json({ message: "Failed to fetch custom table" });
    }
  });

  app.post("/api/custom-tables", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tableData = { ...req.body, userId };
      const table = await storage.createCustomTable(tableData);
      res.json(table);
    } catch (error) {
      console.error("Error creating custom table:", error);
      res.status(500).json({ message: "Failed to create custom table" });
    }
  });

  app.patch("/api/custom-tables/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tableId = parseInt(req.params.id);
      
      const validatedData = insertCustomTableSchema.partial().parse(req.body);
      const table = await storage.updateCustomTable(tableId, validatedData, userId);
      
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(table);
    } catch (error) {
      console.error("Error updating custom table:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid table data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update custom table" });
    }
  });

  app.delete("/api/custom-tables/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tableId = parseInt(req.params.id);
      const success = await storage.deleteCustomTable(tableId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json({ message: "Table deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom table:", error);
      res.status(500).json({ message: "Failed to delete custom table" });
    }
  });

  // Custom Table Records routes
  app.post("/api/custom-tables/:tableId/records", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tableId = parseInt(req.params.tableId);
      const recordData = { ...req.body, tableId, userId };
      const record = await storage.createCustomTableRecord(recordData);
      res.json(record);
    } catch (error) {
      console.error("Error creating custom table record:", error);
      res.status(500).json({ message: "Failed to create custom table record" });
    }
  });

  app.patch("/api/custom-tables/:tableId/records/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recordId = parseInt(req.params.id);
      const record = await storage.updateCustomTableRecord(recordId, req.body, userId);
      
      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error updating custom table record:", error);
      res.status(500).json({ message: "Failed to update custom table record" });
    }
  });

  app.delete("/api/custom-tables/:tableId/records/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recordId = parseInt(req.params.id);
      const success = await storage.deleteCustomTableRecord(recordId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Record not found" });
      }
      
      res.json({ message: "Record deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom table record:", error);
      res.status(500).json({ message: "Failed to delete custom table record" });
    }
  });

  // AI Insights routes
  app.get("/api/contacts/:id/insights", isAuthenticated, async (req: any, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const contact = await storage.getContactWithDetails(contactId, userId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const insights = await generateContactInsights(contact);
      res.json(insights);
    } catch (error) {
      console.error("Error generating contact insights:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  app.get("/api/pipeline/insights", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getContacts(userId);
      
      const insights = await generateBulkInsights(contacts);
      res.json(insights);
    } catch (error) {
      console.error("Error generating pipeline insights:", error);
      res.status(500).json({ message: "Failed to generate pipeline insights" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
