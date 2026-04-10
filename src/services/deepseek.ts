import { UserProfile } from '@/types/welfare';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const HK_WELFARE_KNOWLEDGE = `
Hong Kong Welfare Policy Reference:
- OALA (Old Age Living Allowance): Age 65+, asset limits apply. Normal: $387,000 single / $587,000 couple. Higher: $163,000 single / $247,000 couple.
- CSSA (Comprehensive Social Security Assistance): Means-tested. Single able-bodied: ~$2,765/month. Elderly single (60+): ~$4,060/month. Must be HK resident 1+ year.
- Public Housing: Income limits vary by household size. 1-person: $12,940/month. 2-person: $19,550/month. Wait time ~5.5 years average.
- Elderly Health Care Voucher: Age 65+, $2,000/year, accumulate up to $8,000.
- Transport Subsidy (PTSS): Monthly transport >$400, subsidy = 1/3 of excess, max $400/month.
- Disability Allowance: Normal $1,935/month, Higher $3,870/month. Requires medical certification.
- Working Family Allowance: Household income limits, working hours requirements (144+ hours/month for full rate).
`;

const SYSTEM_PROMPT = `You are a Hong Kong Welfare Policy Expert AI assistant. Your role is to analyze user input, identify which welfare category applies, and determine what information is still needed.

${HK_WELFARE_KNOWLEDGE}

You MUST respond with a valid JSON object in this exact format (no markdown, no code fences):
{
  "category": "string - the welfare category (e.g. 'Elderly', 'Housing', 'Disability', 'Family', 'Transport', 'General')",
  "thought_process": "string - your internal reasoning about the user's situation and eligibility",
  "reply_text": "string - a friendly, helpful message to the user in the same language they used",
  "missing_fields": ["array of field names still needed, e.g. 'age', 'income', 'rent', 'household_size'. Empty array if all info is sufficient"]
}

Rules:
- If the user provides enough info, set missing_fields to an empty array and provide a recommendation in reply_text.
- If info is missing, list ONLY the fields relevant to the identified category.
- Always be warm, professional, and encouraging.
- Respond in the same language the user writes in (English or Chinese).
- NEVER wrap JSON in markdown code fences.`;

export interface DeepSeekResponse {
  category: string;
  thought_process: string;
  reply_text: string;
  missing_fields: string[];
}

const FIELD_LABELS: Record<string, string> = {
  age: 'Age',
  income: 'Monthly Income (HKD)',
  rent: 'Monthly Rent (HKD)',
  household_size: 'Household Size',
  name: 'Full Name',
  district: 'District of Residence',
  employment_status: 'Employment Status',
  disability_type: 'Type of Disability',
  working_hours: 'Monthly Working Hours',
  transport_expense: 'Monthly Transport Expense (HKD)',
  assets: 'Total Assets (HKD)',
  residency_years: 'Years of HK Residency',
  date_of_birth: 'Date of Birth',
  marital_status: 'Marital Status',
};

export function buildFieldsFromMissing(missingFields: string[]) {
  return missingFields.map(fieldName => ({
    name: fieldName,
    type: (['income', 'rent', 'household_size', 'age', 'working_hours', 'transport_expense', 'assets', 'residency_years'].includes(fieldName) ? 'number' : 'text') as 'text' | 'number',
    label: FIELD_LABELS[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    required: true,
    placeholder: `Enter your ${fieldName.replace(/_/g, ' ')}`,
  }));
}

export async function callDeepSeek(
  userMessage: string,
  profile: UserProfile,
  conversationHistory: { role: string; content: string }[] = []
): Promise<DeepSeekResponse> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_DEEPSEEK_API_KEY is not configured. Please add it to your environment.');
  }

  const profileContext = Object.keys(profile).length > 0
    ? `\n\nKnown user profile: ${JSON.stringify(profile)}`
    : '';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + profileContext },
    ...conversationHistory.slice(-10),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('Empty response from DeepSeek');
  }

  try {
    // Strip potential markdown code fences
    const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    return JSON.parse(cleaned) as DeepSeekResponse;
  } catch {
    // Fallback: return as plain text reply
    return {
      category: 'General',
      thought_process: 'Could not parse structured response. Returning raw text.',
      reply_text: content,
      missing_fields: [],
    };
  }
}
