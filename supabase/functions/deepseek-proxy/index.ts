import { corsHeaders } from '@supabase/supabase-js/cors'

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'DEEPSEEK_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userMessage, profile, conversationHistory } = await req.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return new Response(
        JSON.stringify({ error: 'userMessage is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profileContext = profile && Object.keys(profile).length > 0
      ? `\n\nKnown user profile: ${JSON.stringify(profile)}`
      : '';

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + profileContext },
      ...(conversationHistory || []).slice(-10),
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
      return new Response(
        JSON.stringify({ error: `DeepSeek API error (${response.status}): ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Empty response from DeepSeek' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsed;
    try {
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        category: 'General',
        thought_process: 'Could not parse structured response. Returning raw text.',
        reply_text: content,
        missing_fields: [],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});