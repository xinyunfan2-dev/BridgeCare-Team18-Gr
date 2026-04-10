const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
- Respond in the same language the user writes in. Default to English if unclear.
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

    const body = await req.json();
    const { action } = body;

    // ── Branch: rank offices by distance ──
    if (action === 'rank_offices') {
      const { userAddress, offices } = body;
      if (!userAddress || !offices) {
        return new Response(
          JSON.stringify({ error: 'userAddress and offices are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const rankPrompt = `You are a Hong Kong geography expert. Given a user's residential address and a list of government offices, estimate the approximate distance (in km) from the user's home to each office, and rank them from nearest to farthest.

User's Address: "${userAddress}"

Offices:
${offices.map((o: any, i: number) => `${i + 1}. ${o.name} — ${o.address}`).join('\n')}

Respond with a valid JSON array (no markdown, no code fences). Each element:
{
  "index": <original 0-based index>,
  "name": "<office name>",
  "distance_km": <number, estimated km>,
  "distance_label": "<e.g. '约2.5公里' or '~2.5 km'>",
  "transport_suggestion": "<short suggestion like '乘港铁到长沙湾站步行5分钟' or 'Take MTR to Cheung Sha Wan, 5 min walk'>"
}

Sort the array by distance_km ascending. Be as accurate as possible based on Hong Kong geography.`;

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a Hong Kong geography and transit expert. Always respond with valid JSON only, no markdown.' },
            { role: 'user', content: rankPrompt },
          ],
          temperature: 0.2,
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
      let parsed;
      try {
        const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = [];
      }

      return new Response(JSON.stringify({ ranked_offices: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Default: welfare chat ──
    const { userMessage, profile, conversationHistory } = body;

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