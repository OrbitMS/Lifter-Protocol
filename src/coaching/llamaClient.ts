import { initLlama, type LlamaContext } from 'llama.rn';
import type { ChatMessage, CoachingClient } from '@/engine/coaching';
import { getModelPath } from '@/lib/modelManager';

let _ctx: LlamaContext | null = null;

async function getCtx(): Promise<LlamaContext> {
  if (_ctx) return _ctx;
  _ctx = await initLlama({
    model: getModelPath(),
    use_mlock: true,
    n_ctx: 2048,
    n_gpu_layers: 99,
  });
  return _ctx;
}

export async function releaseLlama(): Promise<void> {
  if (_ctx) {
    await _ctx.release();
    _ctx = null;
  }
}

export const llamaCoach: CoachingClient = {
  async complete(system, user) {
    const ctx = await getCtx();
    const { text } = await ctx.completion({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      n_predict: 180,
      temperature: 0.7,
      stop: ['<|im_end|>', '<|im_start|>'],
    });
    return text.trim();
  },

  async chat(system, messages: ChatMessage[]) {
    const ctx = await getCtx();
    const { text } = await ctx.completion({
      messages: [
        { role: 'system', content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      n_predict: 700,
      temperature: 0.7,
      stop: ['<|im_end|>', '<|im_start|>'],
    });
    return text.trim();
  },
};
