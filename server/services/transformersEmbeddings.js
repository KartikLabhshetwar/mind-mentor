import { pipeline, env } from '@xenova/transformers';
import dotenv from 'dotenv';

dotenv.config();

// Configure environment for better performance
env.allowLocalModels = false; // Use remote models for better performance
env.allowRemoteModels = true;
env.cacheDir = './ai-models'; // Cache models locally

class TransformersEmbeddings {
  constructor() {
    this.model = null;
    this.modelName = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
    this.isInitialized = false;
    this.initializationPromise = null;
    this._cachedDimension = null; // Cache the dimension for health checks
  }

  /**
   * Initialize the embedding model
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeModel();
    return this.initializationPromise;
  }

  async _initializeModel() {
    try {
      console.log('🚀 Initializing Transformers.js embedding model...');
      console.log(`📦 Model: ${this.modelName}`);
      
      // Load the feature extraction pipeline
      this.model = await pipeline('feature-extraction', this.modelName, {
        quantized: false, // Use full precision for better quality
        progress_callback: (progress) => {
          if (progress.status === 'progress') {
            console.log(`📥 Downloading model: ${Math.round(progress.progress * 100)}%`);
          }
        }
      });

      this.isInitialized = true;
      console.log('✅ Transformers.js model initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing Transformers.js model:', error);
      throw new Error(`Failed to initialize embedding model: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param {string|string[]} texts - Text or array of texts to embed
   * @returns {Promise<number[][]>} Array of embedding vectors
   */
  async embedDocuments(texts) {
    try {
      await this.initialize();
      
      const textArray = Array.isArray(texts) ? texts : [texts];
      
      if (textArray.length === 0) {
        throw new Error('No texts provided for embedding');
      }

      console.log(`🔍 Generating embeddings for ${textArray.length} texts...`);
      
      const embeddings = [];
      
      // Process texts in batches for better performance
      const batchSize = 8; // Optimal batch size for Transformers.js
      
      for (let i = 0; i < textArray.length; i += batchSize) {
        const batch = textArray.slice(i, i + batchSize);
        
        const batchEmbeddings = await Promise.all(
          batch.map(async (text) => {
            try {
              const result = await this.model(text, {
                pooling: 'mean', // Use mean pooling for sentence-level embeddings
                normalize: true   // Normalize embeddings to unit length
              });
              
              // Convert to regular array and ensure it's 1D
              return Array.from(result.data);
            } catch (error) {
              console.error(`Error embedding text: "${text.substring(0, 50)}..."`, error);
              throw new Error(`Failed to embed text: ${error.message}`);
            }
          })
        );
        
        embeddings.push(...batchEmbeddings);
      }

      console.log(`✅ Generated ${embeddings.length} embeddings successfully`);
      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Generate embedding for a single query text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector
   */
  async embedQuery(text) {
    try {
      const embeddings = await this.embedDocuments([text]);
      return embeddings[0];
    } catch (error) {
      console.error('Error generating query embedding:', error);
      throw new Error(`Failed to generate query embedding: ${error.message}`);
    }
  }

  /**
   * Get the embedding dimension
   * @returns {Promise<number>} Dimension of the embeddings
   */
  async getEmbeddingDimension() {
    try {
      await this.initialize();
      
      // Cache the dimension to avoid regenerating embeddings
      if (this._cachedDimension) {
        return this._cachedDimension;
      }
      
      // Generate a test embedding to get the dimension only once
      const testEmbedding = await this.embedQuery('test');
      this._cachedDimension = testEmbedding.length;
      return this._cachedDimension;
    } catch (error) {
      console.error('Error getting embedding dimension:', error);
      throw new Error(`Failed to get embedding dimension: ${error.message}`);
    }
  }

  /**
   * Health check for the embedding service
   * @returns {Promise<Object>} Service health status
   */
  async healthCheck() {
    try {
      await this.initialize();
      const dimension = await this.getEmbeddingDimension();
      
      return {
        status: 'healthy',
        model: this.modelName,
        dimension: dimension,
        initialized: this.isInitialized,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get service information
   * @returns {Promise<Object>} Service information
   */
  async getServiceInfo() {
    try {
      const health = await this.healthCheck();
      return {
        name: 'Transformers.js Embeddings',
        model: this.modelName,
        status: health.status,
        dimension: health.dimension,
        backend: 'local',
        cost: 'free',
        rateLimit: 'none'
      };
    } catch (error) {
      return {
        name: 'Transformers.js Embeddings',
        model: this.modelName,
        status: 'error',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const transformersEmbeddings = new TransformersEmbeddings();

export default transformersEmbeddings;
