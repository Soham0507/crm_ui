import type { ICPProfile, InsertLead, LeadData } from "@shared/schema";

// Mock data pools
const firstNames = ["John", "Sarah", "Michael", "Emma", "David", "Jennifer", "Robert", "Lisa", "James", "Maria"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson"];
const titles = ["CEO", "CTO", "VP Sales", "Head of Marketing", "Director of Engineering", "Product Manager", "Sales Manager", "Marketing Director", "Operations Manager", "CFO"];
const companies = [
  { name: "TechCorp", domain: "techcorp.com", industry: "Technology", size: "51-200" },
  { name: "FinanceHub", domain: "financehub.io", industry: "Fintech", size: "201-500" },
  { name: "DataSystems", domain: "datasystems.com", industry: "Software", size: "11-50" },
  { name: "CloudWorks", domain: "cloudworks.net", industry: "SaaS", size: "51-200" },
  { name: "InnovateLabs", domain: "innovatelabs.co", industry: "Technology", size: "1-10" },
  { name: "MarketPro", domain: "marketpro.com", industry: "Marketing", size: "51-200" },
  { name: "SalesForce Plus", domain: "salesforceplus.com", industry: "Sales", size: "201-500" },
  { name: "DevTools Inc", domain: "devtools.io", industry: "Developer Tools", size: "11-50" },
  { name: "AI Solutions", domain: "aisolutions.ai", industry: "Artificial Intelligence", size: "51-200" },
  { name: "GrowthCo", domain: "growthco.com", industry: "Consulting", size: "11-50" }
];
const locations = ["San Francisco, CA", "New York, NY", "Austin, TX", "Boston, MA", "Seattle, WA", "Chicago, IL", "Los Angeles, CA", "Denver, CO", "Miami, FL", "Portland, OR"];

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

export async function searchLeads(icpProfile: ICPProfile, count: number = 50): Promise<InsertLead[]> {
  const leads: InsertLead[] = [];
  const config = icpProfile.config as any;
  
  // Generate mock leads based on ICP criteria
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    const leadData: LeadData = {
      fullName: `${firstName} ${lastName}`,
      title: title,
      linkedin: generateLinkedInUrl(firstName, lastName),
      email: {
        value: generateEmail(firstName, lastName, company.domain),
        confidence: Math.random() > 0.3 ? 90 : 60,
        status: 'pending'
      },
      company: {
        name: company.name,
        domain: company.domain,
        size: company.size,
        industry: company.industry
      },
      geo: location,
      score: 0,
      source: "MockProvider",
      tags: []
    };
    
    // Score the lead against ICP
    leadData.score = scoreLeadAgainstICP(leadData, config);
    
    // Only include leads with decent scores
    if (leadData.score >= 40) {
      leads.push({
        data: leadData,
        email: leadData.email.value,
        status: 'new',
        score: leadData.score,
        consent: false
      });
    }
  }
  
  // Sort by score and return top matches
  return leads
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, Math.min(count, leads.length));
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