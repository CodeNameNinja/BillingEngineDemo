import OpenAI from 'openai';
import { ExtractedBillingTermsSchema, type BillingWarning, type ExtractedBillingTerms } from '@demo/shared';

export type ExtractTermsResult = {
  extractedTerms: ExtractedBillingTerms;
  warnings: BillingWarning[];
  mode: 'openai';
};

export async function extractBillingTermsFromText(text: string): Promise<ExtractTermsResult> {
  const apiKey = process.env.OPEN_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      extractedTerms: {},
      warnings: [{ code: 'parse_error', message: 'Missing OPEN_API_KEY/OPENAI_API_KEY for LLM extraction' }],
      mode: 'openai'
    };
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

  const system = [
    'You are extracting billing terms from contract text.',
    'Return STRICT JSON only (no markdown, no commentary).',
    'If a field is unknown, omit it and add a warning in an array called "_warnings" with objects {code,message,path?}.',
    'Never invent numbers or dates.',
    'For this demo, ZAR is a supported currency and net_15 is a supported due date rule; do not warn when those appear.'
  ].join(' ');

  const user = `Extract billing terms from this contract text:\n\n${text}\n\nReturn JSON with fields:\n- customerName\n- contractStartDate (YYYY-MM-DD)\n- contractEndDate (YYYY-MM-DD) OR termLengthMonths\n- invoiceFrequency (monthly|quarterly|annual|one_time|unknown)\n- billingModel (fixed|recurring|usage|mixed|unknown)\n- currency (USD|EUR|GBP|ZAR)\n- paymentTerms\n- dueDateRule (net_0|net_7|net_14|net_15|net_30 or free text)\n- lineItems[] (description, fixedFeeMinor, recurringFeeMinor, cadence)\n- variableUsageRules[] (meter, unit, pricePerUnitMinor)\n- latePaymentPenalty\n- contactChannel (whatsappPhoneE164, email)\n\nAlso include optional _warnings[].`;

  const resp = await client.responses.create({
    model,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  });

  const rawText = resp.output_text?.trim() ?? '';
  const { json, parseWarnings } = extractJsonObject(rawText);

  if (!json) {
    return {
      extractedTerms: {},
      warnings: [
        ...parseWarnings,
        {
          code: 'parse_error',
          message: 'LLM did not return valid JSON'
        }
      ],
      mode: 'openai'
    };
  }

  const modelWarnings: BillingWarning[] = [];
  const llmWarnings = Array.isArray((json as any)._warnings) ? (json as any)._warnings : [];
  for (const w of llmWarnings) {
    if (w && typeof w === 'object' && typeof w.message === 'string') {
      modelWarnings.push({
        code: (w.code as BillingWarning['code']) ?? 'ambiguous_term',
        message: w.message,
        path: typeof w.path === 'string' ? w.path : undefined
      });
    }
  }

  delete (json as any)._warnings;

  const parsed = ExtractedBillingTermsSchema.safeParse(json);
  if (!parsed.success) {
    return {
      extractedTerms: {},
      warnings: [
        ...parseWarnings,
        ...modelWarnings,
        {
          code: 'parse_error',
          message: 'Extracted terms failed schema validation',
          path: 'ExtractedBillingTerms'
        }
      ],
      mode: 'openai'
    };
  }

  return { extractedTerms: parsed.data, warnings: [...parseWarnings, ...modelWarnings], mode: 'openai' };
}

function extractJsonObject(text: string): { json: unknown | null; parseWarnings: BillingWarning[] } {
  const parseWarnings: BillingWarning[] = [];
  try {
    return { json: JSON.parse(text), parseWarnings };
  } catch {
    // Try to salvage the first top-level JSON object.
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const candidate = text.slice(start, end + 1);
      try {
        return { json: JSON.parse(candidate), parseWarnings };
      } catch {
        parseWarnings.push({
          code: 'parse_error',
          message: 'Failed to parse JSON from LLM output (even after salvage attempt)'
        });
        return { json: null, parseWarnings };
      }
    }
    parseWarnings.push({ code: 'parse_error', message: 'LLM output contained no JSON object' });
    return { json: null, parseWarnings };
  }
}

