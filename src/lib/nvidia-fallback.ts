import axios from 'axios';
import OpenAI from 'openai';

const NV_BASE = 'https://integrate.api.nvidia.com/v1';
const MODEL_TIMEOUT = 30000;
const MAX_RETRIES_PER_MODEL = 0;

interface ModelConfig {
  name: string;
  keyEnv: string;
  method: 'axios' | 'openai';
  maxTokens: number;
  temperature: number;
  topP: number;
  extra?: Record<string, any>;
}

const MODELS: ModelConfig[] = [
  { name: 'deepseek-ai/deepseek-v4-pro', keyEnv: 'NV_DEEPSEEK_KEY', method: 'openai', maxTokens: 16384, temperature: 0.7, topP: 0.9 },
  { name: 'mistralai/mistral-medium-3.5-128b', keyEnv: 'NV_MISTRAL_KEY', method: 'axios', maxTokens: 16384, temperature: 0.7, topP: 1.0, extra: { reasoning_effort: 'high' } },
  { name: 'meta/llama-3.1-8b-instruct', keyEnv: 'NV_API_KEY', method: 'axios', maxTokens: 4096, temperature: 0.85, topP: 0.95 },
  { name: 'minimaxai/minimax-m2.7', keyEnv: 'NV_MINIMAX_KEY', method: 'openai', maxTokens: 8192, temperature: 1.0, topP: 0.95 },
  { name: 'google/diffusiongemma-26b-a4b-it', keyEnv: 'NV_GEMMA_KEY', method: 'axios', maxTokens: 4096, temperature: 1.0, topP: 0.95, extra: { chat_template_kwargs: { enable_thinking: true } } },
];

const OPENAI_CLIENTS = new Map<string, OpenAI>();

function getOpenAIClient(apiKey: string): OpenAI {
  let client = OPENAI_CLIENTS.get(apiKey);
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: `${NV_BASE}`,
      timeout: MODEL_TIMEOUT,
      maxRetries: MAX_RETRIES_PER_MODEL,
    });
    OPENAI_CLIENTS.set(apiKey, client);
  }
  return client;
}

async function callModel(prompt: string, cfg: ModelConfig): Promise<string | null> {
  const key = process.env[cfg.keyEnv];
  if (!key) return null;

  try {
    if (cfg.method === 'openai') {
      const client = getOpenAIClient(key);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT);
      try {
        const completion = await client.chat.completions.create({
          model: cfg.name,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: cfg.maxTokens,
          temperature: cfg.temperature,
          top_p: cfg.topP,
          stream: false,
        });
        return completion.choices?.[0]?.message?.content || null;
      } finally {
        clearTimeout(timeout);
      }
    }

    const payload: any = {
      model: cfg.name,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: cfg.maxTokens,
      temperature: cfg.temperature,
      top_p: cfg.topP,
      stream: false,
    };
    if (cfg.extra) Object.assign(payload, cfg.extra);

    const res = await axios.post(`${NV_BASE}/chat/completions`, payload, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      timeout: MODEL_TIMEOUT,
    });
    return res.data?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

function cleanJSON(raw: string): string {
  return raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
}

export async function generateWithFallback(
  prompt: string,
  models?: ModelConfig[],
  parseAsJson: boolean = true,
): Promise<any> {
  const chain = models || MODELS;
  for (const cfg of chain) {
    const raw = await callModel(prompt, cfg);
    if (!raw) continue;
    if (!parseAsJson) return raw;
    try {
      return JSON.parse(cleanJSON(raw));
    } catch {
      continue;
    }
  }
  return null;
}

export { MODELS, type ModelConfig };
