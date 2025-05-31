// Perplexity API Client for Fact-Checking
import { VerdictType } from './types';

export interface PerplexityResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        finish_reason: string;
        message: {
            role: string;
            content: string;
        };
        delta?: {
            role?: string;
            content?: string;
        };
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface FactCheckResult {
    verdict: VerdictType;
    confidence: number;
    evidence: string;
    sources: string[];
    reasoning: string;
}

export class PerplexityClient {
    private apiKey: string;
    private baseUrl = 'https://api.perplexity.ai';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async factCheck(claim: string): Promise<FactCheckResult> {
        const prompt = this.buildFactCheckPrompt(claim);

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'sonar', // Use online model for current information
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    // temperature: 0.1, // Lower temperature for more factual responses
                    // search_domain_filter: ['gov', 'edu', 'org'], // Focus on reliable sources
                    // return_related_questions: false,
                }),
            });

            console.log('response', response);

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
            }

            const data: PerplexityResponse = await response.json();
            return this.parseFactCheckResponse(data.choices[0].message.content);

        } catch (error) {
            console.error('Error calling Perplexity API:', error);
            throw new Error(`Failed to fact-check claim: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private buildFactCheckPrompt(claim: string): string {
        return `
Please fact-check the following claim and provide a structured response:

CLAIM: "${claim}"

Please analyze this claim and respond with the following structured format:

VERDICT: [TRUE/FALSE/PARTIALLY_TRUE/MISLEADING/UNVERIFIABLE]
CONFIDENCE: [0.0-1.0]
EVIDENCE: [Brief summary of evidence supporting or refuting the claim]
SOURCES: [List key sources used, separated by semicolons]
REASONING: [Explain your reasoning for the verdict]

Guidelines:
- TRUE: The claim is accurate and supported by reliable evidence
- FALSE: The claim is demonstrably false
- PARTIALLY_TRUE: Some elements are true but others are false or missing context
- MISLEADING: Technically true but presented in a way that misleads
- UNVERIFIABLE: Cannot be verified with available reliable sources

Focus on recent, authoritative sources like government data, academic research, and reputable news organizations. Be specific about numbers and dates when possible.
    `.trim();
    }

    private parseFactCheckResponse(content: string): FactCheckResult {
        try {
            // Extract structured information from the response
            const verdictMatch = content.match(/VERDICT:\s*([A-Z_]+)/i);
            const confidenceMatch = content.match(/CONFIDENCE:\s*([\d.]+)/i);
            const evidenceMatch = content.match(/EVIDENCE:\s*([^]*?)(?=\nSOURCES:|$)/i);
            const sourcesMatch = content.match(/SOURCES:\s*([^]*?)(?=\nREASONING:|$)/i);
            const reasoningMatch = content.match(/REASONING:\s*([^]*?)$/i);

            const verdict = this.parseVerdict(verdictMatch?.[1] || 'UNVERIFIABLE');
            const confidence = parseFloat(confidenceMatch?.[1] || '0.5');
            const evidence = evidenceMatch?.[1]?.trim() || 'No evidence provided';
            const sources = this.parseSources(sourcesMatch?.[1] || '');
            const reasoning = reasoningMatch?.[1]?.trim() || 'No reasoning provided';

            return {
                verdict,
                confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0-1
                evidence,
                sources,
                reasoning
            };
        } catch (error) {
            console.error('Error parsing Perplexity response:', error);
            return {
                verdict: VerdictType.UNVERIFIABLE,
                confidence: 0.1,
                evidence: 'Failed to parse fact-check response',
                sources: [],
                reasoning: 'Error occurred during response parsing'
            };
        }
    }

    private parseVerdict(verdictString: string): VerdictType {
        const verdict = verdictString.toUpperCase().trim();

        switch (verdict) {
            case 'TRUE':
                return VerdictType.TRUE;
            case 'FALSE':
                return VerdictType.FALSE;
            case 'PARTIALLY_TRUE':
            case 'PARTIAL':
                return VerdictType.PARTIALLY_TRUE;
            case 'MISLEADING':
                return VerdictType.MISLEADING;
            case 'UNVERIFIABLE':
            default:
                return VerdictType.UNVERIFIABLE;
        }
    }

    private parseSources(sourcesString: string): string[] {
        if (!sourcesString.trim()) return [];

        return sourcesString
            .split(/[;\n]/)
            .map(source => source.trim())
            .filter(source => source.length > 0)
            .slice(0, 5); // Limit to 5 sources
    }
}

// Factory function for creating client
export function createPerplexityClient(): PerplexityClient {
    const apiKey = process.env.PPLX_KEY;

    if (!apiKey) {
        throw new Error('PPLX_KEY environment variable is required');
    }

    return new PerplexityClient(apiKey);
} 