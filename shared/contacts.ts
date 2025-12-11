import { z } from "zod";

// Define the Zod schema for a Contact being added to the CRM, usually via CSV Import.
// This is different from the Contact type in the database, which is more detailed.
// This schema is used to map CSV columns on the front end, and validate the data before importing.
export const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z
    .enum(["lead", "qualified", "proposal", "closed-won", "closed-lost"])
    .default("lead"),
  dealValue: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

export const bulkSchema = z
  .array(schema)
  .min(1, "At least one Contact is required");

export type Contact = z.infer<typeof schema>;
