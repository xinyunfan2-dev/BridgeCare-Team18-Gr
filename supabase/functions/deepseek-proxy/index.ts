const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const HK_WELFARE_KNOWLEDGE = `
Hong Kong Welfare Policy Reference:
- OALA (Old Age Living Allowance): Age 65+, asset limits apply. Normal: $387,000 single / $587,000 couple. Higher: $163,000 single / $247,000 couple.
- CSSA (Comprehensive Social Security Assistance): Means-tested. Single able-bodied: ~$2,765/month. Elderly single (60+): ~$4,060/month. Must be HK resident 1+ year. Covers rent, food, utilities for those with no/very low income.
- Public Housing: Income limits vary by household size. 1-person: $12,940/month. 2-person: $19,550/month. Wait time ~5.5 years average. Elderly priority schemes available.
- Elderly Health Care Voucher: Age 65+, $2,000/year, accumulate up to $8,000.
- Transport Subsidy (PTSS): Monthly transport >$400, subsidy = 1/3 of excess, max $400/month.
- Disability Allowance: Normal $1,935/month, Higher $3,870/month. Requires medical certification.
- Working Family Allowance: Household income limits, working hours requirements (144+ hours/month for full rate).
- Emergency Relief: Short-term food assistance, temporary shelter for street sleepers, crisis intervention through Integrated Family Service Centres.
- Medical Fee Waiver: For CSSA recipients and low-income individuals, covers public hospital/clinic fees.
`;

const SYSTEM_PROMPT = `You are a Hong Kong Welfare Policy Expert AI assistant. Your job is to carefully analyze the user's situation — even when described in long, complex, or emotional language — and determine which welfare programs they may qualify for.

${HK_WELFARE_KNOWLEDGE}

Instructions:
1. Read the user's ENTIRE message carefully. Extract ALL relevant details: age, income, housing status, family situation, disabilities, employment, health issues, etc.
2. Cross-reference extracted details against ALL welfare programs above. A user may qualify for MULTIPLE programs simultaneously.
3. Identify what critical information is still missing to make a proper assessment.
4. Respond warmly in the SAME LANGUAGE the user writes in. Default to English if unclear.
5. When the user describes a severe or urgent situation (e.g. homelessness, zero income, elderly alone), prioritize the most critical programs first and be extra empathetic.
6. For complex cases, break down your analysis clearly — don't just list programs, explain WHY each one applies.
7. CRITICAL FORMATTING RULE: Do NOT use any markdown syntax in reply_text. No asterisks (*), no bold (**), no headers (#), no bullet symbols. Use plain text only. Use line breaks, numbered lists (1. 2. 3.), and dashes (-) for structure instead.

You MUST call the "analyze_welfare" function with your structured analysis.`;

// Tool definition for structured output
const WELFARE_TOOL = {
  type: 'function',
  function: {
    name: 'analyze_welfare',
    description: 'Analyze user welfare eligibility and return structured assessment',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Primary welfare category: Elderly, Housing, Disability, Family, Transport, Employment, Emergency, or General',
        },
        thought_process: {
          type: 'string',
          description: 'Detailed internal reasoning about the user situation, what programs apply and why, at least 2-3 sentences',
        },
        reply_text: {
          type: 'string',
          description: 'A warm, helpful message to the user in their language. For complex situations, acknowledge their difficulties and explain which programs may help and why. Be specific and actionable.',
        },
        missing_fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fields still needed for assessment. Use these exact names: age, income, rent, household_size, name, district, employment_status, disability_type, working_hours, transport_expense, assets, residency_years, date_of_birth, marital_status, housing. Return empty array [] if enough info is provided.',
        },
      },
      required: ['category', 'thought_process', 'reply_text', 'missing_fields'],
    },
  },
};

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
  "distance_label": "<e.g. '~2.5 km'>",
  "transport_suggestion": "<short suggestion like 'Take MTR to Cheung Sha Wan, 5 min walk'>"
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

    // ── Default: welfare chat with tool calling ──
    const { userMessage, profile, conversationHistory } = body;

    if (!userMessage || typeof userMessage !== 'string') {
      return new Response(
        JSON.stringify({ error: 'userMessage is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profileContext = profile && Object.keys(profile).length > 0
      ? `\n\nKnown user profile so far: ${JSON.stringify(profile)}`
      : '';

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + profileContext },
      ...(conversationHistory || []).slice(-10),
      { role: 'user', content: userMessage },
    ];

    console.log('[deepseek-proxy] Sending request with tool calling, message length:', userMessage.length);

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
        max_tokens: 2048,
        tools: [WELFARE_TOOL],
        tool_choice: { type: 'function', function: { name: 'analyze_welfare' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[deepseek-proxy] API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `DeepSeek API error (${response.status}): ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    // Try to extract from tool call first
    let parsed;
    const toolCall = choice?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        parsed = JSON.parse(toolCall.function.arguments);
        console.log('[deepseek-proxy] Successfully parsed tool call response, category:', parsed.category);
      } catch (e) {
        console.error('[deepseek-proxy] Failed to parse tool call arguments:', e);
      }
    }

    // Fallback: try parsing content as JSON (in case model ignores tool calling)
    if (!parsed) {
      const content = choice?.message?.content?.trim();
      if (content) {
        try {
          const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
          parsed = JSON.parse(cleaned);
          console.log('[deepseek-proxy] Fallback: parsed from content JSON');
        } catch {
          // Last resort: return raw text as reply
          parsed = {
            category: 'General',
            thought_process: 'Model returned unstructured text. Using as-is.',
            reply_text: content,
            missing_fields: [],
          };
          console.log('[deepseek-proxy] Fallback: using raw content as reply_text');
        }
      } else {
        parsed = {
          category: 'General',
          thought_process: 'Empty response from model.',
          reply_text: 'I apologize, I could not process your request. Please try describing your situation again.',
          missing_fields: [],
        };
      }
    }

    // Validate the response structure
    if (!parsed.category) parsed.category = 'General';
    if (!parsed.thought_process) parsed.thought_process = '';
    if (!parsed.reply_text) parsed.reply_text = 'I apologize, something went wrong. Please try again.';
    if (!Array.isArray(parsed.missing_fields)) parsed.missing_fields = [];

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[deepseek-proxy] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
