import type { ICPProfile, InsertLead, LeadData } from "@shared/schema";

// Mock data pools - Enhanced with more realistic company data
const firstNames = ["John", "Sarah", "Michael", "Emma", "David", "Jennifer", "Robert", "Lisa", "James", "Maria", "Christopher", "Amanda", "Daniel", "Ashley", "Matthew", "Jessica"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"];
const titles = ["CEO", "CTO", "VP Sales", "Head of Marketing", "Director of Engineering", "Product Manager", "Sales Manager", "Marketing Director", "Operations Manager", "CFO", "VP Product", "Head of Growth", "Chief Revenue Officer", "VP Engineering", "Director of Sales"];

// More comprehensive company data
const companies = [
  { name: "Stripe", domain: "stripe.com", industry: "Fintech", size: "500+", description: "Payment processing platform for internet businesses" },
  { name: "Plaid", domain: "plaid.com", industry: "Fintech", size: "201-500", description: "Financial data infrastructure" },
  { name: "Square", domain: "squareup.com", industry: "Fintech", size: "500+", description: "Payment and merchant services" },
  { name: "Coinbase", domain: "coinbase.com", industry: "Cryptocurrency", size: "500+", description: "Cryptocurrency exchange platform" },
  { name: "DataDog", domain: "datadoghq.com", industry: "Software", size: "500+", description: "Monitoring and analytics platform" },
  { name: "Notion", domain: "notion.so", industry: "SaaS", size: "201-500", description: "All-in-one workspace" },
  { name: "Airtable", domain: "airtable.com", industry: "SaaS", size: "201-500", description: "Low-code platform for building collaborative apps" },
  { name: "Figma", domain: "figma.com", industry: "Design Tools", size: "201-500", description: "Collaborative design tool" },
  { name: "Vercel", domain: "vercel.com", industry: "Developer Tools", size: "51-200", description: "Frontend cloud platform" },
  { name: "Supabase", domain: "supabase.com", industry: "Developer Tools", size: "51-200", description: "Open source Firebase alternative" },
  { name: "Linear", domain: "linear.app", industry: "Project Management", size: "11-50", description: "Issue tracking and project management" },
  { name: "Anthropic", domain: "anthropic.com", industry: "Artificial Intelligence", size: "51-200", description: "AI safety and research company" },
  { name: "OpenAI", domain: "openai.com", industry: "Artificial Intelligence", size: "201-500", description: "AI research and deployment company" },
  { name: "Scale AI", domain: "scale.com", industry: "Artificial Intelligence", size: "201-500", description: "Data platform for AI" },
  { name: "Canva", domain: "canva.com", industry: "Design", size: "500+", description: "Online design and publishing tool" },
  { name: "Slack", domain: "slack.com", industry: "Communication", size: "500+", description: "Business communication platform" },
  { name: "Discord", domain: "discord.com", industry: "Communication", size: "201-500", description: "Voice and text chat platform" },
  { name: "Zoom", domain: "zoom.us", industry: "Video Conferencing", size: "500+", description: "Video communications platform" },
  { name: "Twilio", domain: "twilio.com", industry: "Communications API", size: "500+", description: "Cloud communications platform" },
  { name: "SendGrid", domain: "sendgrid.com", industry: "Email", size: "201-500", description: "Email delivery service" }
];

const locations = ["San Francisco, CA", "New York, NY", "Austin, TX", "Boston, MA", "Seattle, WA", "Chicago, IL", "Los Angeles, CA", "Denver, CO", "Miami, FL", "Portland, OR", "Atlanta, GA", "San Diego, CA", "Washington, DC", "Philadelphia, PA", "Dallas, TX"];

function generateEmail(firstName: string, lastName: string, domain: string): string {
  const patterns = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}@${domain}`,
    `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`
  ];
  return patterns[Math.floor(Math.random() * patterns.length)];
}

function generateLinkedInUrl(firstName: string, lastName: string): string {
  return `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Math.random().toString(36).substring(7)}`;
}

function scoreLeadAgainstICP(lead: LeadData, icpConfig: any): number {
  let score = 50; // Base score
  
  // Check company match
  if (icpConfig.company) {
    if (icpConfig.company.industries?.includes(lead.company?.industry)) score += 15;
    if (icpConfig.company.size?.includes(lead.company?.size)) score += 10;
    if (icpConfig.company.geo?.some((g: string) => lead.geo?.includes(g))) score += 10;
  }
  
  // Check persona match
  if (icpConfig.personas?.[0]) {
    const persona = icpConfig.personas[0];
    if (persona.title?.some((t: string) => lead.title?.toLowerCase().includes(t.toLowerCase()))) score += 15;
  }
  
  // Add some randomness for variety
  score += Math.floor(Math.random() * 20) - 10;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

export async function searchLeads(icpProfile: ICPProfile, count: number = 20): Promise<InsertLead[]> {
  const leads: InsertLead[] = [];
  const config = icpProfile.config as any;
  
  // Generate more leads than needed to filter for quality
  const generationCount = count * 2;
  
  // Generate mock leads based on ICP criteria
  for (let i = 0; i < generationCount; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    // Generate email with high confidence
    const emailAddress = generateEmail(firstName, lastName, company.domain);
    
    const leadData: LeadData = {
      fullName: `${firstName} ${lastName}`,
      title: title,
      linkedin: generateLinkedInUrl(firstName, lastName),
      email: {
        value: emailAddress,
        confidence: 85 + Math.floor(Math.random() * 15), // 85-99% confidence
        status: 'valid' // Mark as valid by default for demo
      },
      company: {
        name: company.name,
        domain: company.domain,
        size: company.size,
        industry: company.industry,
        description: (company as any).description || "Leading company in " + company.industry
      },
      geo: location,
      score: 0,
      source: "AI-Powered Discovery",
      tags: ["qualified", "verified"]
    };
    
    // Score the lead against ICP
    leadData.score = scoreLeadAgainstICP(leadData, config);
    
    // Enhance score for certain criteria
    if (config.company?.industries?.includes(company.industry)) {
      leadData.score += 10;
      leadData.tags?.push("industry-match");
    }
    if (config.personas?.[0]?.title?.some((t: string) => title.toLowerCase().includes(t.toLowerCase()))) {
      leadData.score += 10;
      leadData.tags?.push("title-match");
    }
    
    // Only include leads with good scores (minimum 50)
    if (leadData.score >= 50) {
      leads.push({
        data: leadData,
        email: emailAddress,
        status: 'new',
        score: leadData.score,
        consent: false
      });
    }
  }
  
  // Sort by score and return exactly the requested count of top matches
  return leads
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, count);
}

export async function enrichLead(lead: Lead): Promise<Partial<LeadData>> {
  const data = lead.data as LeadData;
  
  // Mock enrichment - add additional fields
  const enrichedData: Partial<LeadData> = {
    ...data,
    email: {
      ...data.email,
      status: 'valid',
      confidence: 95
    }
  };
  
  // Add phone number sometimes
  if (Math.random() > 0.5) {
    (enrichedData as any).phone = `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }
  
  // Add company details
  if (enrichedData.company) {
    (enrichedData.company as any).employees = Math.floor(Math.random() * 500) + 10;
    (enrichedData.company as any).revenue = `$${Math.floor(Math.random() * 100)}M`;
    (enrichedData.company as any).yearFounded = 2000 + Math.floor(Math.random() * 24);
  }
  
  return enrichedData;
}

export async function verifyEmail(email: string): Promise<'valid' | 'invalid' | 'pending'> {
  // Mock email verification
  const random = Math.random();
  if (random > 0.8) return 'invalid';
  if (random > 0.1) return 'valid';
  return 'pending';
}