// List prices of the configured chat model, without the cached-input discount.
export const USD_PER_INPUT_TOKEN = 0.1 / 1_000_000;
export const USD_PER_OUTPUT_TOKEN = 0.5 / 1_000_000;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return inputTokens * USD_PER_INPUT_TOKEN + outputTokens * USD_PER_OUTPUT_TOKEN;
}
