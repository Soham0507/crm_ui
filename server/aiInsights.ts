import OpenAI from "openai";
import type { Contact, ContactWithDetails } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface ContactInsight {
  score: number; // 1-100 priority score
  category: 'engagement' | 'conversion' | 'upsell' | 'retention' | 'risk';
  title: string;
  description: string;
  actionable: string;
  confidence: number; // 0-1
}

export interface ContactRecommendations {
  nextActions: string[];
  bestContactTime: string;
  communicationStyle: string;
  dealProbability: number;
  insights: ContactInsight[];
}

export async function generateContactInsights(contact: ContactWithDetails): Promise<ContactRecommendations> {
  try {
    if (!openai) {
      console.log("OpenAI API key not configured, using fallback insights");
      return generateFallbackInsights(contact);
    }
    const prompt = `Analyze this CRM contact and provide actionable business insights:

Contact Details:
- Name: ${contact.name}
- Email: ${contact.email}
- Phone: ${contact.phone || 'N/A'}
- Company: ${contact.company || 'N/A'}
- Status: ${contact.status}
- Deal Value: $${contact.dealValue || 0}
- Tags: ${contact.tags?.join(', ') || 'None'}
- Created: ${contact.createdAt}
- Last Updated: ${contact.updatedAt}

Recent Activity:
${contact.activities?.slice(0, 5).map(a => `- ${a.type}: ${a.description} (${a.createdAt})`).join('\n') || 'No recent activity'}

Notes:
${contact.notes?.slice(0, 3).map(n => `- ${n.content} (${n.createdAt})`).join('\n') || 'No notes'}

Tasks:
${contact.tasks?.slice(0, 3).map(t => `- ${t.title} (${t.completed ? 'Completed' : 'Pending'})`).join('\n') || 'No tasks'}

Provide business insights in JSON format with these exact fields:
{
  "nextActions": ["specific action 1", "specific action 2", "specific action 3"],
  "bestContactTime": "recommended time/day",
  "communicationStyle": "preferred communication approach",
  "dealProbability": number between 0 and 1,
  "insights": [
    {
      "score": number 1-100,
      "category": "engagement|conversion|upsell|retention|risk",
      "title": "brief insight title",
      "description": "detailed insight",
      "actionable": "specific action to take",
      "confidence": number 0-1
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert CRM analyst providing actionable business insights. Focus on practical, specific recommendations that drive sales results. Respond only with valid JSON."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and sanitize the response
    return {
      nextActions: Array.isArray(result.nextActions) ? result.nextActions.slice(0, 5) : [],
      bestContactTime: result.bestContactTime || "Business hours",
      communicationStyle: result.communicationStyle || "Professional",
      dealProbability: Math.max(0, Math.min(1, result.dealProbability || 0)),
      insights: Array.isArray(result.insights) 
        ? result.insights.slice(0, 5).map((insight: any) => ({
            score: Math.max(1, Math.min(100, insight.score || 50)),
            category: ['engagement', 'conversion', 'upsell', 'retention', 'risk'].includes(insight.category) 
              ? insight.category : 'engagement',
            title: insight.title || "Insight",
            description: insight.description || "No description",
            actionable: insight.actionable || "No action specified",
            confidence: Math.max(0, Math.min(1, insight.confidence || 0.5))
          }))
        : []
    };

  } catch (error) {
    console.error("Error generating contact insights:", error);
    
    // Fallback insights based on contact data
    return generateFallbackInsights(contact);
  }
}

function generateFallbackInsights(contact: ContactWithDetails): ContactRecommendations {
  const insights: ContactInsight[] = [];
  
  // Basic insights based on contact data
  if (contact.dealValue && contact.dealValue > 10000) {
    insights.push({
      score: 85,
      category: 'conversion',
      title: 'High-Value Opportunity',
      description: 'This contact represents a significant revenue opportunity.',
      actionable: 'Schedule a demo or proposal meeting within 48 hours',
      confidence: 0.9
    });
  }

  if (contact.status === 'lead' && contact.createdAt) {
    const daysSinceCreated = Math.floor((Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated > 7) {
      insights.push({
        score: 70,
        category: 'engagement',
        title: 'Follow-up Required',
        description: `Contact has been in lead status for ${daysSinceCreated} days.`,
        actionable: 'Send a personalized follow-up email with value proposition',
        confidence: 0.8
      });
    }
  }

  if (!contact.phone) {
    insights.push({
      score: 60,
      category: 'engagement',
      title: 'Missing Contact Information',
      description: 'No phone number on file, limiting communication options.',
      actionable: 'Request phone number in next email interaction',
      confidence: 0.7
    });
  }

  return {
    nextActions: [
      'Review recent interactions',
      'Send personalized follow-up',
      'Schedule discovery call'
    ],
    bestContactTime: 'Tuesday-Thursday, 10 AM - 4 PM',
    communicationStyle: 'Professional and consultative',
    dealProbability: contact.status === 'proposal' ? 0.7 : contact.status === 'qualified' ? 0.4 : 0.2,
    insights
  };
}

export async function generateBulkInsights(contacts: Contact[]): Promise<{
  summary: string;
  opportunities: string[];
  risks: string[];
  recommendations: string[];
}> {
  try {
    if (!openai) {
      console.log("OpenAI API key not configured, using fallback insights");
      return generateFallbackBulkInsights(contacts);
    }
    const contactSummary = {
      total: contacts.length,
      byStatus: contacts.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalValue: contacts.reduce((sum, c) => sum + (c.dealValue || 0), 0),
      avgDealValue: contacts.length > 0 ? contacts.reduce((sum, c) => sum + (c.dealValue || 0), 0) / contacts.length : 0,
      topCompanies: [...new Set(contacts.map(c => c.company).filter(Boolean))].slice(0, 5)
    };

    const prompt = `Analyze this CRM pipeline data and provide strategic business insights:

Pipeline Summary:
- Total Contacts: ${contactSummary.total}
- Status Distribution: ${JSON.stringify(contactSummary.byStatus)}
- Total Pipeline Value: $${contactSummary.totalValue.toLocaleString()}
- Average Deal Value: $${contactSummary.avgDealValue.toFixed(0)}
- Key Companies: ${contactSummary.topCompanies.join(', ')}

Provide analysis in JSON format:
{
  "summary": "overall pipeline health assessment",
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a sales operations expert analyzing CRM pipeline data. Provide actionable insights for sales optimization. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      summary: result.summary || "Pipeline analysis unavailable",
      opportunities: Array.isArray(result.opportunities) ? result.opportunities.slice(0, 5) : [],
      risks: Array.isArray(result.risks) ? result.risks.slice(0, 5) : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations.slice(0, 5) : []
    };

  } catch (error) {
    console.error("Error generating bulk insights:", error);
    
    return generateFallbackBulkInsights(contacts);
  }
}

function generateFallbackBulkInsights(contacts: Contact[]) {
  const totalValue = contacts.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const statusCounts = contacts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highValueContacts = contacts.filter(c => (c.dealValue || 0) > 5000).length;
  const recentContacts = contacts.filter(c => {
    const days = Math.floor((Date.now() - new Date(c.createdAt!).getTime()) / (1000 * 60 * 60 * 24));
    return days <= 7;
  }).length;

  return {
    summary: `Pipeline contains ${contacts.length} contacts with $${totalValue.toLocaleString()} total value. ${statusCounts.qualified || 0} qualified leads and ${highValueContacts} high-value opportunities.`,
    opportunities: [
      `${highValueContacts} high-value prospects worth pursuing`,
      `${statusCounts.qualified || 0} qualified leads ready for proposals`,
      `${recentContacts} new contacts from this week need immediate follow-up`,
      "Pipeline momentum shows growth potential",
      "Strong deal values indicate quality lead sources"
    ].slice(0, 3),
    risks: [
      statusCounts.lead > (contacts.length * 0.6) ? "Too many unqualified leads in pipeline" : null,
      contacts.filter(c => !c.phone).length > (contacts.length * 0.3) ? "Missing contact information for many prospects" : null,
      totalValue < 50000 ? "Pipeline value below recommended threshold" : null,
      "Leads may be aging without proper follow-up",
      "Deal progression tracking needs improvement"
    ].filter(Boolean).slice(0, 3),
    recommendations: [
      "Implement systematic lead qualification process",
      "Set up automated follow-up sequences",
      "Focus on high-value prospect engagement",
      "Improve contact data collection",
      "Establish clear next-step protocols"
    ].slice(0, 3)
  };
}