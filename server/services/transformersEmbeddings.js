import dotenv from 'dotenv';

dotenv.config();

const HF_API_URL = 'https://router.huggingface.co/hf-inference/models';
const MODEL_NAME = process.env.EMBEDDING_MODEL || 'BAAI/bge-small-en-v1.5';

class HuggingFaceEmbeddings {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.modelName = MODEL_NAME;
    this._cachedDimension = null;
  }

  async _request(texts) {
    const response = await fetch(`${HF_API_URL}/${this.modelName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: texts,
        options: { wait_for_model: true },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async embedDocuments(texts) {
    const textArray = Array.isArray(texts) ? texts : [texts];
    if (textArray.length === 0) throw new Error('No texts provided for embedding');

    const batchSize = 32;
    const embeddings = [];

    for (let i = 0; i < textArray.length; i += batchSize) {
      const batch = textArray.slice(i, i + batchSize);
      const result = await this._request(batch);
      embeddings.push(...result);
    }

    return embeddings;
  }

  async embedQuery(text) {
    const result = await this._request([text]);
    return result[0];
  }

  async getEmbeddingDimension() {
    if (this._cachedDimension) return this._cachedDimension;
    const testEmbed = await this.embedQuery('test');
    this._cachedDimension = testEmbed.length;
    return this._cachedDimension;
  }

  async healthCheck() {
    try {
      const dimension = await this.getEmbeddingDimension();
      return {
        status: 'healthy',
        model: this.modelName,
        dimension,
        backend: 'huggingface-inference',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getServiceInfo() {
    const health = await this.healthCheck();
    return {
      name: 'HuggingFace Inference Embeddings',
      model: this.modelName,
      status: health.status,
      dimension: health.dimension,
      backend: 'huggingface-inference',
    };
  }
}

const huggingFaceEmbeddings = new HuggingFaceEmbeddings();
export default huggingFaceEmbeddings;
