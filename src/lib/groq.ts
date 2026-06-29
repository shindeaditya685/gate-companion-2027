import Groq from 'groq-sdk'

let client: Groq | null = null

function getClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })
  }
  return client
}

export async function explainFormula(name: string, formula: string, subject: string): Promise<string> {
  try {
    const groq = getClient()
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a GATE CSE exam tutor. Explain the given formula in 2-3 concise sentences. Focus on when to use it, common pitfalls, and a quick memory trick. Keep it under 100 words.',
        },
        {
          role: 'user',
          content: `Formula: "${name}" — ${formula}\nSubject: ${subject}\n\nExplain when to use this formula and a memory trick.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    })
    return res.choices[0]?.message?.content?.trim() || 'Could not generate explanation.'
  } catch (err) {
    console.error('[Groq] API error:', err)
    return 'AI explanation unavailable. Check your GROQ_API_KEY.'
  }
}
