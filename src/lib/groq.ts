import Groq from 'groq-sdk';
import type { CheatSheetDifficulty } from './types';

type DraftInput = {
  topic: string;
  subject: string;
  difficulty: CheatSheetDifficulty;
};

export type CheatSheetAIDraft = {
  name: string;
  subject: string;
  formula: string;
  difficulty: CheatSheetDifficulty;
  example?: string;
  code?: string;
  tags?: string[];
  notes?: string;
};

let client: Groq | null = null;

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY');
  }

  if (!client) {
    client = new Groq({ apiKey });
  }

  return client;
}

function extractJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced ?? trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed;
  return JSON.parse(candidate) as Record<string, unknown>;
}

function asDifficulty(value: unknown, fallback: CheatSheetDifficulty): CheatSheetDifficulty {
  return value === 'must-know' || value === 'frequent' || value === 'tricky' ? value : fallback;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 6);
}

export async function explainFormula(name: string, formula: string, subject: string): Promise<string> {
  try {
    const groq = getClient();
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a GATE CSE exam tutor. Explain the formula in 2-3 concise sentences. Focus on when to use it, common traps, and one memory hook. Keep it under 100 words.',
        },
        {
          role: 'user',
          content: `Formula: "${name}" - ${formula}\nSubject: ${subject}\n\nExplain when to use this formula and one memory hook.`,
        },
      ],
      max_tokens: 220,
      temperature: 0.25,
    });

    return res.choices[0]?.message?.content?.trim() || 'Could not generate explanation.';
  } catch (err) {
    console.error('[Groq] explainFormula error:', err);
    return 'AI explanation unavailable. Check your GROQ_API_KEY.';
  }
}

export async function draftCheatSheetItem(input: DraftInput): Promise<CheatSheetAIDraft> {
  const groq = getClient();
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: [
          'You are a precise GATE CSE cheat-sheet curator.',
          'Create one high-yield revision card for the requested topic.',
          'Return only valid JSON with these keys: name, subject, formula, difficulty, example, code, tags, notes.',
          'formula must be concise LaTeX/plain math suitable for KaTeX.',
          'difficulty must be one of: must-know, frequent, tricky.',
          'example should be a short exam-style reminder.',
          'code should be pseudocode/C/C++ only when useful; otherwise an empty string.',
          'notes should mention a common GATE trap or memory hook.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          topic: input.topic,
          subject: input.subject,
          difficulty: input.difficulty,
        }),
      },
    ],
    max_tokens: 650,
    temperature: 0.2,
  });

  const content = res.choices[0]?.message?.content ?? '{}';
  const parsed = extractJsonObject(content);
  const name = asString(parsed.name) || input.topic;
  const formula = asString(parsed.formula);

  if (!formula) {
    throw new Error('AI draft did not include a formula.');
  }

  return {
    name,
    subject: asString(parsed.subject) || input.subject,
    formula,
    difficulty: asDifficulty(parsed.difficulty, input.difficulty),
    example: asString(parsed.example) || undefined,
    code: asString(parsed.code) || undefined,
    tags: asTags(parsed.tags),
    notes: asString(parsed.notes) || undefined,
  };
}
