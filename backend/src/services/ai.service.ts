import { config, type AIProviderType } from '../config.js'
import type { AIAnswerData, AnswerSource, WebSearchResult, QuickContextData } from '../types/api.js'

export interface IAIAnswerService {
  generateAnswer(
    query: string,
    results: WebSearchResult[],
    quickContext?: QuickContextData,
    forcedProvider?: AIProviderType
  ): Promise<AIAnswerData>
}

export class AIAnswerService implements IAIAnswerService {
  private activeProvider: AIProviderType

  constructor(provider?: AIProviderType) {
    this.activeProvider = provider ?? config.aiProvider
  }

  /**
   * Generates or checks the AI Answer Layer status.
   * Adheres strictly to privacy-first principles:
   * - Never sends search queries or content to unconfigured third-party AI models.
   * - Never fabricates citations, facts, or sources.
   * - Returns an honest 'unavailable' status when no AI inference model is configured.
   */
  async generateAnswer(
    query: string,
    results: WebSearchResult[],
    _quickContext?: QuickContextData,
    forcedProvider?: AIProviderType
  ): Promise<AIAnswerData> {
    const provider = forcedProvider ?? this.activeProvider

    // Extract real source citations from retrieved search results
    const sources = this.extractSourceCitations(results).slice(0, 4)

    // Default privacy-first stance: No AI inference model is configured
    if (provider === 'none') {
      return {
        status: 'unavailable',
        provider: 'none',
        notice:
          'AI Answer Layer is not configured. To preserve privacy, DitchX does not transmit search queries or retrieved content to third-party AI models by default. You can configure a local private inference engine (e.g., Ollama) or an AI endpoint in backend/.env.',
        sources,
      }
    }

    // If query has no supporting results
    if (!results || results.length === 0) {
      return {
        status: 'unsupported',
        provider,
        notice: 'Retrieved search results do not contain enough verified information to generate an answer.',
        sources: [],
      }
    }

    // Configured provider placeholder (e.g. when user enables a local Ollama model in future)
    return {
      status: 'unavailable',
      provider,
      notice: `AI Provider "${provider}" is selected but inference runtime is not reachable.`,
      sources,
    }
  }

  /**
   * Extracts clean, verified source citations from organic web results.
   */
  extractSourceCitations(results: WebSearchResult[]): AnswerSource[] {
    if (!Array.isArray(results)) return []

    return results
      .filter((r) => Boolean(r && (r.url || r.destinationUrl)))
      .map((r) => ({
        title: r.title || 'Source',
        url: r.url || '',
        destinationUrl: r.destinationUrl || r.url || '',
        domain: r.domain || '',
        snippet: r.description || '',
      }))
  }
}

export const aiAnswerService = new AIAnswerService()
