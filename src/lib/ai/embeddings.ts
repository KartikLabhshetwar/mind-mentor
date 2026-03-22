import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN);

export async function embedText(text: string): Promise<number[]> {
  const result = await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    inputs: text,
  });
  return Array.from(result as number[]);
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const results = await Promise.all(texts.map(embedText));
  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
