import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertNoteSchema, insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csvParser from "csv-parser";
import { Parser } from "json2csv";
import fs from "fs";

const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all contacts
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Get contact with details
  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContactWithDetails(id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  // Create contact
  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  // Update contact
  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData);
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
  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteContact(id);
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
  app.get("/api/pipeline/stats", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
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
  app.get("/api/contacts/export", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
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
  app.post("/api/contacts/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const results: any[] = [];
      const errors: string[] = [];
      let processed = 0;
      let created = 0;

      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (data) => {
          processed++;
          try {
            // Clean and validate data
            const contactData = {
              name: data.name || data.Name || '',
              email: data.email || data.Email || '',
              phone: data.phone || data.Phone || '',
              company: data.company || data.Company || '',
              status: (data.status || data.Status || 'lead').toLowerCase(),
              dealValue: parseFloat(data.dealValue || data['Deal Value'] || data.dealvalue || '0') || 0,
              tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : []
            };

            if (!contactData.name || !contactData.email) {
              errors.push(`Row ${processed}: Name and email are required`);
              return;
            }

            results.push(contactData);
          } catch (error) {
            errors.push(`Row ${processed}: Invalid data format`);
          }
        })
        .on('end', async () => {
          // Process valid contacts
          for (const contactData of results) {
            try {
              const validatedData = insertContactSchema.parse(contactData);
              await storage.createContact(validatedData);
              created++;
            } catch (error) {
              errors.push(`Failed to create contact: ${contactData.name}`);
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file!.path);

          res.json({
            processed,
            created,
            errors: errors.length > 0 ? errors : undefined,
            message: `Successfully imported ${created} out of ${processed} contacts`
          });
        })
        .on('error', (error) => {
          errors.push('Failed to parse CSV file');
          res.status(400).json({ message: "Invalid CSV file", errors });
        });
    } catch (error) {
      res.status(500).json({ message: "Failed to import contacts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
