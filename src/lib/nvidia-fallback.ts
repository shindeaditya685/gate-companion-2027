export interface ModelConfig {
  name: string;
  key: string;
  baseURL: string;
}

export const MODELS: ModelConfig[] = [
  { name: 'meta/llama-3.1-8b-instruct', key: process.env.NV_API_KEY || '', baseURL: 'https://integrate.api.nvidia.com/v1' },
  { name: 'deepseek-ai/deepseek-v4-pro', key: process.env.NV_DEEPSEEK_KEY || '', baseURL: 'https://integrate.api.nvidia.com/v1' },
  { name: 'mistralai/mistral-medium-3.5-128b', key: process.env.NV_MISTRAL_KEY || '', baseURL: 'https://integrate.api.nvidia.com/v1' },
  { name: 'minimaxai/minimax-m2.7', key: process.env.NV_MINIMAX_KEY || '', baseURL: 'https://integrate.api.nvidia.com/v1' },
  { name: 'google/diffusiongemma-26b-a4b-it', key: process.env.NV_GEMMA_KEY || '', baseURL: 'https://integrate.api.nvidia.com/v1' },
];

const TIMEOUT = 30000;

const timeout = <T>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

export async function generateWithFallback(prompt: string, models: ModelConfig[]): Promise<any> {
  const { default: OpenAI } = await import('openai');

  for (const model of models) {
    if (!model.key) continue;
    try {
      const client = new OpenAI({ apiKey: model.key, baseURL: model.baseURL, timeout: TIMEOUT });
      const completion = await timeout(
        client.chat.completions.create({
          model: model.name,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
        TIMEOUT
      );
      if (!completion) continue;
      const text = completion.choices[0]?.message?.content || '';
      const cleaned = text.replace(/```json|```/g, '').trim();
      if (!cleaned) continue;
      return JSON.parse(cleaned);
    } catch {
      continue;
    }
  }
  return null;
}
