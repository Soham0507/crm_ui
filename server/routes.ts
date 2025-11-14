import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertContactSchema, 
  insertNoteSchema, 
  insertTaskSchema, 
  insertCustomTableSchema, 
  insertCustomTableRecordSchema, 
  insertICPProfileSchema,
  insertLeadListSchema,
  insertLeadSchema,
  type CustomTableSchema,
  type ICPProfile,
  type Lead 
} from "@shared/schema";
import { generateContactInsights, generateBulkInsights } from "./aiInsights";
import { searchLeads, enrichLead, verifyEmail } from "./services/mockLeadProvider";
import { z } from "zod";
import multer from "multer";
import csvParser from "csv-parser";
import { Parser } from "json2csv";
import fs from "fs";
import OpenAI from "openai";

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
    } catch (error: any) {
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
    } catch (error: any) {
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
  app.post("/api/contacts/:id/notes", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/contacts/:id/tasks", isAuthenticated, async (req: any, res) => {
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
  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
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
    } catch (error: any) {
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

  // Export custom table as CSV
  app.get("/api/custom-tables/:id/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tableId = parseInt(req.params.id);
      
      const table = await storage.getCustomTableWithRecords(tableId, userId);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      // Extract schema columns
      const schema = table.schema as CustomTableSchema;
      const columns = schema.columns || [];
      
      // Create fields array from column names
      const fields = columns.map((col: any) => col.name);
      
      // Transform records data
      const records = table.records.map(record => {
        const data: any = {};
        columns.forEach((col: any) => {
          const recordData = record.data as any;
          data[col.name] = recordData[col.name] || '';
        });
        return data;
      });

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(records);
      
      const fileName = `${table.tableName}_export_${new Date().toISOString().split('T')[0]}.csv`;
      res.header('Content-Type', 'text/csv');
      res.attachment(fileName);
      res.send(csv);
    } catch (error) {
      console.error("Error exporting custom table:", error);
      res.status(500).json({ message: "Failed to export custom table" });
    }
  });

  // Import CSV to custom table
  app.post("/api/custom-tables/:id/import", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const tableId = parseInt(req.params.id);
      
      // Get table schema
      const table = await storage.getCustomTable(tableId, userId);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      const schema = table.schema as CustomTableSchema;
      const columns = schema.columns || [];
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
            // Validate and transform data based on schema
            const recordData: any = {};
            let hasRequiredFields = true;
            
            columns.forEach((col: any) => {
              const value = data[col.name] || data[col.displayName] || '';
              
              // Check required fields
              if (col.required && !value) {
                hasRequiredFields = false;
                errors.push(`Row ${processed}: Missing required field "${col.displayName}"`);
                return;
              }
              
              // Type validation and conversion
              switch (col.type) {
                case 'number':
                  recordData[col.name] = value ? parseFloat(value) || 0 : 0;
                  break;
                case 'checkbox':
                  recordData[col.name] = value === 'true' || value === '1' || value === 'yes';
                  break;
                case 'date':
                  recordData[col.name] = value ? new Date(value).toISOString() : null;
                  break;
                default:
                  recordData[col.name] = value.toString();
              }
            });
            
            if (hasRequiredFields) {
              results.push(recordData);
            }
          } catch (error: any) {
            errors.push(`Row ${processed}: ${error.message}`);
          }
        })
        .on('end', async () => {
          // Clean up uploaded file
          fs.unlinkSync(req.file!.path);
          
          // Insert valid records
          for (const recordData of results) {
            try {
              await storage.createCustomTableRecord({
                tableId,
                userId,
                data: recordData
              });
              created++;
            } catch (error: any) {
              errors.push(`Failed to create record: ${error.message}`);
            }
          }
          
          res.json({
            success: true,
            processed,
            created,
            errors,
            message: `Imported ${created} out of ${processed} records`
          });
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error);
          fs.unlinkSync(req.file!.path);
          res.status(400).json({ message: "Invalid CSV file", error: error.message });
        });
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ message: "Failed to import custom table data" });
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

  // Sales Outreach Agent Routes
  
  // ICP Profiles
  app.get("/api/icp-profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profiles = await storage.getICPProfiles(userId);
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ICP profiles" });
    }
  });

  app.get("/api/icp-profiles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const profile = await storage.getICPProfile(id, userId);
      if (!profile) {
        return res.status(404).json({ message: "ICP profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ICP profile" });
    }
  });

  app.post("/api/icp-profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, config, narrative } = req.body;
      const profile = await storage.createICPProfile({
        userId,
        name,
        config,
        narrative
      });
      res.status(201).json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ICP profile" });
    }
  });

  app.post("/api/icp-profiles/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { prompt } = req.body;
      // Mock AI generation for now - would integrate with OpenAI
      const mockConfig = {
        company: {
          industries: ["FinTech", "SaaS"],
          geo: ["United States", "Canada"],
          size: ["51-200", "201-500"],
          tech: ["Stripe", "AWS"]
        },
        personas: [{
          title: ["Head of Operations", "COO", "VP Operations"],
          seniority: ["VP", "C-Level"],
          functions: ["Operations", "Finance"]
        }],
        pain_points: ["Manual reconciliation", "High processing costs", "Scaling challenges"],
        triggers: ["Series B funding", "Hiring operations team", "International expansion"],
        value_props: ["Reduce reconciliation time by 80%", "Save $100k+ annually", "Scale operations efficiently"],
        keywords: ["payment operations", "financial reconciliation", "automation"]
      };
      
      const narrative = `We target mid-stage fintech companies that are experiencing rapid growth and need to automate their payment operations. These companies typically have raised Series A or B funding, operate in multiple markets, and are looking to reduce manual processes while scaling their operations team.`;
      
      res.json({ config: mockConfig, narrative });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate ICP with AI" });
    }
  });

  // Lead Lists
  app.get("/api/lead-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lists = await storage.getLeadLists(userId);
      res.json(lists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead lists" });
    }
  });

  app.get("/api/lead-lists/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const list = await storage.getLeadList(id, userId);
      if (!list) {
        return res.status(404).json({ message: "Lead list not found" });
      }
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead list" });
    }
  });

  app.get("/api/lead-lists/:id/leads", isAuthenticated, async (req: any, res) => {
    try {
      const listId = parseInt(req.params.id);
      const leads = await storage.getLeadsByList(listId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/lead-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, icpId, leadIds } = req.body;
      const list = await storage.createLeadList({
        userId,
        name,
        icpId
      });
      
      // Add leads to list if provided
      if (leadIds && leadIds.length > 0) {
        // Would add leads to the list here
      }
      
      res.status(201).json({ ...list, leadCount: leadIds?.length || 0 });
    } catch (error) {
      res.status(500).json({ message: "Failed to create lead list" });
    }
  });

  // Lead Search & Enrichment
  app.post("/api/leads/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { icpId, provider } = req.body;
      
      // Mock lead search - would integrate with Apollo/Clearbit/etc
      const mockLeads = [
        {
          fullName: "Sarah Johnson",
          title: "Head of Operations",
          linkedin: "https://linkedin.com/in/sarahjohnson",
          email: { value: "sarah@fintech-startup.com", confidence: 0.95, status: "valid" },
          company: { name: "FinTech Startup Inc", domain: "fintech-startup.com", size: "51-200", industry: "Financial Services" },
          geo: "San Francisco, CA",
          score: 92,
          source: "apollo",
          tags: ["fintech", "operations", "series-b"]
        },
        {
          fullName: "Michael Chen",
          title: "COO",
          linkedin: "https://linkedin.com/in/michaelchen",
          email: { value: "mchen@paytech.io", confidence: 0.89, status: "valid" },
          company: { name: "PayTech Solutions", domain: "paytech.io", size: "201-500", industry: "Payments" },
          geo: "New York, NY",
          score: 88,
          source: "apollo",
          tags: ["payments", "scale-up", "operations"]
        }
      ];

      // Create a lead list
      const list = await storage.createLeadList({
        userId,
        name: `Search Results - ${new Date().toLocaleDateString()}`,
        icpId
      });

      // Add leads to database
      for (const leadData of mockLeads) {
        await storage.createLead({
          listId: list.id,
          data: leadData,
          email: leadData.email.value,
          status: 'new',
          score: leadData.score,
          consent: false
        });
      }

      res.json({ listId: list.id, count: mockLeads.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to search for leads" });
    }
  });

  app.post("/api/leads/enrich", isAuthenticated, async (req: any, res) => {
    try {
      const { leadIds, fields } = req.body;
      // Mock enrichment - would integrate with enrichment APIs
      res.json({ enriched: leadIds.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to enrich leads" });
    }
  });

  app.post("/api/leads/verify", isAuthenticated, async (req: any, res) => {
    try {
      const { leadIds } = req.body;
      // Mock verification - would integrate with email verification APIs
      res.json({ verified: leadIds.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify emails" });
    }
  });

  // Campaigns
  app.get("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, icpId, listId, settings, steps } = req.body;
      
      const campaign = await storage.createCampaign({
        userId,
        name,
        icpId,
        listId,
        settings,
        status: 'draft'
      });

      // Add campaign steps
      if (steps && steps.length > 0) {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          await storage.createCampaignStep({
            campaignId: campaign.id,
            stepOrder: i + 1,
            dayOffset: step.dayOffset,
            channel: step.channel,
            templateId: step.templateId,
            content: {
              subject: step.subject,
              body: step.body
            },
            conditions: step.conditions
          });
        }
      }

      res.status(201).json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.post("/api/campaigns/:id/launch", isAuthenticated, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Update campaign status to active
      await storage.updateCampaignStatus(campaignId, userId, 'active');
      
      res.json({ message: "Campaign launched successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to launch campaign" });
    }
  });

  app.patch("/api/campaigns/:id", isAuthenticated, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const { status } = req.body;
      
      await storage.updateCampaignStatus(campaignId, userId, status);
      
      res.json({ message: "Campaign updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.post("/api/campaigns/generate-email", isAuthenticated, async (req: any, res) => {
    try {
      const { stepId, context } = req.body;
      
      // Mock AI email generation - would integrate with OpenAI
      const mockEmail = {
        subject: "Streamline Your Payment Operations",
        body: `Hi {{firstName}},

I noticed {{company}} is scaling rapidly in the fintech space. Many companies at your stage struggle with manual payment reconciliation eating up valuable engineering time.

We help companies like yours automate reconciliation, reducing processing time by 80% and saving $100k+ annually in operational costs.

Would you be open to a brief 15-minute call next week to explore if we could help {{company}} scale operations more efficiently?

Best regards,
{{senderName}}`
      };
      
      res.json(mockEmail);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate email" });
    }
  });

  // Sales Outreach - ICP Profiles
  app.get("/api/icp-profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profiles = await storage.getICPProfiles(userId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching ICP profiles:", error);
      res.status(500).json({ message: "Failed to fetch ICP profiles" });
    }
  });

  app.get("/api/icp-profiles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const profile = await storage.getICPProfile(id, userId);
      if (!profile) {
        return res.status(404).json({ message: "ICP profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching ICP profile:", error);
      res.status(500).json({ message: "Failed to fetch ICP profile" });
    }
  });

  app.post("/api/icp-profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertICPProfileSchema.parse({ ...req.body, userId });
      const profile = await storage.createICPProfile(validatedData);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ICP profile data", errors: error.errors });
      }
      console.error("Error creating ICP profile:", error);
      res.status(500).json({ message: "Failed to create ICP profile" });
    }
  });

  // Generate ICP with AI
  app.post("/api/icp-profiles/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Initialize OpenAI client with Replit AI integration
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
      });

      const systemPrompt = `You are an expert sales strategist helping to define Ideal Customer Profiles (ICPs). 
        Generate a comprehensive ICP based on the user's description. Return a JSON object with the following structure:
        {
          "config": {
            "company": {
              "industries": ["array of target industries"],
              "geo": ["array of target locations"],
              "size": ["1-10", "11-50", "51-200", "201-500", "500+"],
              "tech": ["array of technologies they use"]
            },
            "personas": [{
              "title": ["array of job titles"],
              "seniority": ["C-Level", "VP", "Director", "Manager", "Individual"],
              "functions": ["array of job functions"]
            }],
            "pain_points": ["array of pain points"],
            "triggers": ["array of buying triggers"],
            "value_props": ["array of value propositions"],
            "keywords": ["array of relevant keywords"]
          },
          "narrative": "A comprehensive narrative description of the ideal customer"
        }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      res.json(result);
    } catch (error) {
      console.error("Error generating ICP with AI:", error);
      res.status(500).json({ message: "Failed to generate ICP with AI" });
    }
  });

  // Sales Outreach - Lead Lists
  app.get("/api/lead-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lists = await storage.getLeadLists(userId);
      res.json(lists);
    } catch (error) {
      console.error("Error fetching lead lists:", error);
      res.status(500).json({ message: "Failed to fetch lead lists" });
    }
  });

  app.get("/api/lead-lists/:id/leads", isAuthenticated, async (req: any, res) => {
    try {
      const listId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const leads = await storage.getLeadsByList(listId, userId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/lead-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, icpId, leadIds } = req.body;
      
      // Create the list
      const list = await storage.createLeadList({ name, icpId, userId });
      
      // If leadIds provided, create the leads for this list
      if (leadIds && leadIds.length > 0) {
        // This would need to move existing leads to the new list
        // For now, we'll skip this part
      }
      
      res.status(201).json({ ...list, leadCount: leadIds?.length || 0 });
    } catch (error) {
      console.error("Error creating lead list:", error);
      res.status(500).json({ message: "Failed to create lead list" });
    }
  });

  // Sales Outreach - Lead Search
  app.post("/api/leads/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { icpId, provider = "mock" } = req.body;
      
      if (!icpId) {
        return res.status(400).json({ message: "ICP ID is required" });
      }
      
      // Get the ICP profile
      const icpProfile = await storage.getICPProfile(icpId, userId);
      if (!icpProfile) {
        return res.status(404).json({ message: "ICP profile not found" });
      }
      
      // Search for leads using the mock provider
      const leadData = await searchLeads(icpProfile, 30);
      
      // Create a new list for these leads
      const list = await storage.createLeadList({
        name: `${icpProfile.name} - Search ${new Date().toLocaleDateString()}`,
        icpId,
        userId
      });
      
      // Bulk create the leads
      const leads = await storage.createLeadsForList(list.id, userId, leadData);
      
      res.json({ listId: list.id, count: leads.length });
    } catch (error) {
      console.error("Error searching leads:", error);
      res.status(500).json({ message: "Failed to search leads" });
    }
  });

  // Sales Outreach - Lead Enrichment
  app.post("/api/leads/enrich", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { leadIds, fields } = req.body;
      
      if (!leadIds || leadIds.length === 0) {
        return res.status(400).json({ message: "Lead IDs are required" });
      }
      
      let enrichedCount = 0;
      const enrichmentData = [];
      
      for (const leadId of leadIds) {
        const lead = await storage.getLeadById(leadId, userId);
        if (lead) {
          const enriched = await enrichLead(lead);
          enrichmentData.push({ leadId, data: enriched });
          enrichedCount++;
        }
      }
      
      // Update leads with enrichment data
      await storage.enrichLeads(leadIds, enrichmentData, userId);
      
      res.json({ enriched: enrichedCount });
    } catch (error) {
      console.error("Error enriching leads:", error);
      res.status(500).json({ message: "Failed to enrich leads" });
    }
  });

  // Sales Outreach - Email Verification
  app.post("/api/leads/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { leadIds } = req.body;
      
      if (!leadIds || leadIds.length === 0) {
        return res.status(400).json({ message: "Lead IDs are required" });
      }
      
      let verifiedCount = 0;
      
      for (const leadId of leadIds) {
        const lead = await storage.getLeadById(leadId, userId);
        if (lead && lead.email) {
          const status = await verifyEmail(lead.email);
          const data = lead.data as any;
          if (data.email) {
            data.email.status = status;
            await storage.updateLead(leadId, { data }, userId);
            if (status === 'valid') verifiedCount++;
          }
        }
      }
      
      res.json({ verified: verifiedCount });
    } catch (error) {
      console.error("Error verifying emails:", error);
      res.status(500).json({ message: "Failed to verify emails" });
    }
  });

  // Email Templates
  app.get("/api/email-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getEmailTemplates(userId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });
  
  // Email Operations
  app.get("/api/emails", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emails = await storage.getEmails(userId);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });
  
  app.get("/api/contacts/:contactId/emails", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contactId = parseInt(req.params.contactId);
      const emails = await storage.getEmailsByContact(contactId, userId);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact emails" });
    }
  });
  
  // Email sending with Nodemailer
  app.post("/api/emails/send", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { to, cc, bcc, subject, body, htmlBody, contactId } = req.body;
      
      // Create email record as "sending"
      const emailRecord = await storage.createEmail({
        userId,
        to,
        cc,
        bcc,
        subject,
        body,
        htmlBody: htmlBody || body,
        contactId,
        status: 'sending'
      });
      
      // For now, mock the email sending - in production, use Nodemailer
      // This is where you'd integrate with SMTP service
      setTimeout(async () => {
        await storage.updateEmailStatus(emailRecord.id, userId, 'sent');
      }, 1000);
      
      res.json({ 
        message: "Email queued for sending",
        emailId: emailRecord.id,
        status: 'sending'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send email" });
    }
  });
  
  // Save email as draft
  app.post("/api/emails/draft", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { to, cc, bcc, subject, body, htmlBody, contactId } = req.body;
      
      const emailRecord = await storage.createEmail({
        userId,
        to,
        cc,
        bcc,
        subject,
        body,
        htmlBody: htmlBody || body,
        contactId,
        status: 'draft'
      });
      
      res.json(emailRecord);
    } catch (error) {
      res.status(500).json({ message: "Failed to save draft" });
    }
  });
  
  // Generate email with AI (using OpenAI integration)
  app.post("/api/outreach/generate-email", isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, action, tone, context } = req.body;
      
      // Use the OpenAI integration we already set up
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
      });
      
      let systemPrompt = "You are an expert sales email writer. ";
      let userPrompt = "";
      
      switch (action) {
        case 'generate':
          systemPrompt += `Write a ${tone} email that accomplishes: ${prompt}. `;
          if (context.contactName) systemPrompt += `The recipient is ${context.contactName}. `;
          if (context.companyName) systemPrompt += `They work at ${context.companyName}. `;
          userPrompt = "Generate a subject line and email body. Format as JSON with 'subject' and 'body' fields.";
          break;
        case 'rewrite':
          systemPrompt += `Rewrite this email to be more ${tone}.`;
          userPrompt = `Current email:\nSubject: ${context.currentSubject}\nBody: ${context.currentBody}\n\nRewrite it. Format as JSON with 'subject' and 'body' fields.`;
          break;
        case 'summarize':
          systemPrompt += "Make this email shorter and more concise while keeping the main message.";
          userPrompt = `Current email:\nSubject: ${context.currentSubject}\nBody: ${context.currentBody}\n\nMake it shorter. Format as JSON with 'subject' and 'body' fields.`;
          break;
        case 'change_tone':
          systemPrompt += `Change the tone of this email to ${tone}.`;
          userPrompt = `Current email:\nSubject: ${context.currentSubject}\nBody: ${context.currentBody}\n\nChange tone. Format as JSON with 'subject' and 'body' fields.`;
          break;
      }
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0].message.content || '{}');
      res.json(result);
    } catch (error) {
      console.error("Error generating email with AI:", error);
      res.status(500).json({ message: "Failed to generate email with AI" });
    }
  });
  
  // Find contacts from company website (web scraping)
  app.post("/api/outreach/find-contacts", isAuthenticated, async (req: any, res) => {
    try {
      const { input, type, options } = req.body;
      const cheerio = await import('cheerio');
      const axios = (await import('axios')).default;
      
      // Determine the domain to scrape
      let domain = input;
      if (type === 'name') {
        // In production, you'd use a search API to find the domain
        // For now, we'll just format it as a domain
        domain = input.toLowerCase().replace(/\s+/g, '') + '.com';
      }
      
      // Ensure proper URL format
      if (!domain.startsWith('http')) {
        domain = `https://${domain}`;
      }
      
      try {
        // Fetch the website
        const response = await axios.get(domain, { 
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CRM-Bot/1.0)'
          }
        });
        
        const $ = cheerio.load(response.data);
        const contacts: any[] = [];
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        
        // Extract emails from the page
        const pageText = $('body').text();
        const emails = pageText.match(emailPattern) || [];
        
        // Extract from mailto links
        $('a[href^="mailto:"]').each((i, el) => {
          const email = $(el).attr('href')?.replace('mailto:', '');
          if (email && !emails.includes(email)) {
            emails.push(email);
          }
        });
        
        // Clean and dedupe emails
        const uniqueEmails = [...new Set(emails)].filter(email => 
          !email.includes('@example') && 
          !email.includes('yourcompany') &&
          !email.includes('domain.com')
        );
        
        // Try to find team/about pages
        const teamLinks = $('a').filter((i, el) => {
          const href = $(el).attr('href') || '';
          const text = $(el).text().toLowerCase();
          return text.includes('team') || text.includes('about') || text.includes('people') || text.includes('leadership');
        });
        
        // Create contact objects
        uniqueEmails.forEach((email, index) => {
          // Try to extract name from email if possible
          const namePart = email.split('@')[0];
          const name = namePart.split(/[._-]/).map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join(' ');
          
          contacts.push({
            id: `contact-${index}`,
            name: name,
            role: 'Contact', // Would need more context to determine role
            email: email,
            emailConfidence: options.verifyEmails ? 'medium' : 'low',
            source: new URL(domain).hostname,
            department: 'General'
          });
        });
        
        // If no emails found, generate predicted ones based on common patterns
        if (contacts.length === 0 && options.includePredicted) {
          const domainName = new URL(domain).hostname.replace('www.', '');
          const predictedContacts = [
            { name: 'Sales Team', email: `sales@${domainName}`, role: 'Sales' },
            { name: 'Support Team', email: `support@${domainName}`, role: 'Support' },
            { name: 'Info', email: `info@${domainName}`, role: 'General' }
          ];
          
          predictedContacts.forEach((contact, index) => {
            contacts.push({
              id: `predicted-${index}`,
              ...contact,
              emailConfidence: 'predicted',
              source: domainName,
              department: contact.role
            });
          });
        }
        
        // Company info
        const companyInfo = {
          domain: new URL(domain).hostname,
          name: $('title').text() || new URL(domain).hostname,
          totalContactsFound: contacts.length,
          emailPattern: uniqueEmails.length > 2 ? 'firstname.lastname@domain.com' : null
        };
        
        res.json({
          contacts,
          company: companyInfo
        });
      } catch (scrapeError) {
        console.error("Scraping error:", scrapeError);
        res.status(400).json({ 
          message: "Failed to scrape website. Please check the domain and try again.",
          error: scrapeError.message 
        });
      }
    } catch (error) {
      console.error("Error finding contacts:", error);
      res.status(500).json({ message: "Failed to find contacts" });
    }
  });
  
  // Enrich contact data (mock for now)
  app.post("/api/outreach/enrich-contact", isAuthenticated, async (req: any, res) => {
    try {
      const { contactId, name, company, domain } = req.body;
      
      // Mock enrichment - in production, you'd use APIs like Clearbit, Apollo, etc.
      const enrichedData = {
        linkedin: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`,
        phone: '+1 555-0100',
        department: 'Sales',
        seniority: 'Manager'
      };
      
      res.json(enrichedData);
    } catch (error) {
      res.status(500).json({ message: "Failed to enrich contact" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
