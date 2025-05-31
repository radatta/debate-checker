// Claim Detection Module
// Extracts factual claims from transcribed text using regex patterns and basic NLP

export interface DetectedClaim {
    text: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
    type: ClaimType;
}

export enum ClaimType {
    STATISTIC = 'statistic',
    FACT = 'fact',
    COMPARISON = 'comparison',
    PREDICTION = 'prediction',
    QUOTE = 'quote'
}

// Regex patterns for different types of claims
const CLAIM_PATTERNS = {
    // Statistical claims: "X percent", "X million", "increased by X%"
    statistic: [
        /\b\d+(\.\d+)?\s*(percent|%|million|billion|trillion|thousand)\b/gi,
        /\b(increased|decreased|rose|fell|dropped)\s+by\s+\d+(\.\d+)?\s*(percent|%)\b/gi,
        /\b\d+(\.\d+)?\s*(times\s+)?(more|less|higher|lower)\b/gi,
    ],

    // Factual statements with strong indicators
    fact: [
        /\b(according to|studies show|research indicates|data shows|reports that)\b.*?\./gi,
        /\b(the fact is|it is true that|evidence shows|proven that)\b.*?\./gi,
        /\b(in \d{4}|last year|this year|since \d{4})\b.*?\./gi,
    ],

    // Comparative claims
    comparison: [
        /\b(compared to|versus|vs\.?|more than|less than|higher than|lower than)\b.*?\./gi,
        /\b(best|worst|highest|lowest|first|last)\s+(in|of)\b.*?\./gi,
    ],

    // Predictions and future claims  
    prediction: [
        /\b(will|would|going to|expect to|predict|forecast)\b.*?\./gi,
        /\b(by \d{4}|next year|in the future|within \d+\s+years?)\b.*?\./gi,
    ],

    // Quoted statements or attributions
    quote: [
        /"[^"]+"/g,
        /\b(said|stated|claimed|announced|declared)\s+that\b.*?\./gi,
    ]
};

// Keywords that often indicate factual claims
const CLAIM_INDICATORS = [
    'according to', 'studies show', 'research', 'data', 'statistics',
    'percent', 'million', 'billion', 'increased', 'decreased',
    'fact', 'evidence', 'proven', 'documented', 'reported',
    'compared to', 'versus', 'more than', 'less than'
];

// Filter out common non-factual phrases
const EXCLUDE_PATTERNS = [
    /\b(I think|I believe|in my opinion|it seems|maybe|perhaps|possibly)\b/gi,
    /\b(should|could|might|may|would)\b/gi,
    /^(and|but|so|well|you know|um|uh)\b/gi
];

export function detectClaims(text: string): DetectedClaim[] {
    const claims: DetectedClaim[] = [];
    const sentences = splitIntoSentences(text);

    sentences.forEach((sentence, index) => {
        const detectedClaim = analyzeSentence(sentence, index);
        if (detectedClaim) {
            claims.push(detectedClaim);
        }
    });

    return deduplicateClaims(claims);
}

function splitIntoSentences(text: string): string[] {
    // Improved sentence splitting that handles decimal numbers properly
    return text
        .split(/(?<!\d)\.(?!\d)|[!?]+/) // Don't split on decimal points like "3.2"
        .map(s => s.trim())
        .filter(s => s.length > 10) // Filter out very short fragments
        .map(s => {
            // Capitalize first letter if needed
            if (s.length > 0 && /[a-z]/.test(s.charAt(0))) {
                return s.charAt(0).toUpperCase() + s.slice(1);
            }
            return s;
        });
}

function analyzeSentence(sentence: string, sentenceIndex: number): DetectedClaim | null {
    // Skip if sentence contains exclusion patterns
    for (const excludePattern of EXCLUDE_PATTERNS) {
        if (excludePattern.test(sentence)) {
            return null;
        }
    }

    let bestMatch: { type: ClaimType; confidence: number } | null = null;

    // Check each claim type
    for (const [claimType, patterns] of Object.entries(CLAIM_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(sentence)) {
                const confidence = calculateConfidence(sentence, claimType as ClaimType);

                if (!bestMatch || confidence > bestMatch.confidence) {
                    bestMatch = { type: claimType as ClaimType, confidence };
                }
            }
        }
    }

    // If no pattern matched, check for claim indicators
    if (!bestMatch) {
        const indicatorScore = calculateIndicatorScore(sentence);
        if (indicatorScore > 0.3) {
            bestMatch = { type: ClaimType.FACT, confidence: indicatorScore };
        }
    }

    if (bestMatch && bestMatch.confidence > 0.4) {
        return {
            text: sentence,
            confidence: bestMatch.confidence,
            startIndex: sentenceIndex * 100, // Rough estimate
            endIndex: (sentenceIndex + 1) * 100,
            type: bestMatch.type
        };
    }

    return null;
}

function calculateConfidence(sentence: string, claimType: ClaimType): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on claim type specific features
    switch (claimType) {
        case ClaimType.STATISTIC:
            // Higher confidence for sentences with numbers and statistical terms
            if (/\b\d+(\.\d+)?\s*(percent|%)\b/i.test(sentence)) confidence += 0.3;
            if (/\b(increased|decreased|rose|fell)\b/i.test(sentence)) confidence += 0.2;
            break;

        case ClaimType.FACT:
            // Higher confidence for authoritative sources
            if (/\b(according to|research|study|data)\b/i.test(sentence)) confidence += 0.3;
            if (/\b(university|institute|government|official)\b/i.test(sentence)) confidence += 0.2;
            break;

        case ClaimType.COMPARISON:
            // Higher confidence for clear comparative terms
            if (/\b(more than|less than|compared to)\b/i.test(sentence)) confidence += 0.2;
            break;
    }

    // Reduce confidence for uncertain language
    if (/\b(approximately|about|roughly|around)\b/i.test(sentence)) confidence -= 0.1;
    if (/\b(alleged|reportedly|supposedly)\b/i.test(sentence)) confidence -= 0.2;

    return Math.min(Math.max(confidence, 0), 1);
}

function calculateIndicatorScore(sentence: string): number {
    const words = sentence.toLowerCase().split(/\s+/);
    const matchedIndicators = CLAIM_INDICATORS.filter(indicator =>
        sentence.toLowerCase().includes(indicator)
    );

    return Math.min(matchedIndicators.length / words.length * 2, 1);
}

function deduplicateClaims(claims: DetectedClaim[]): DetectedClaim[] {
    const uniqueClaims: DetectedClaim[] = [];

    for (const claim of claims) {
        const isDuplicate = uniqueClaims.some(existing =>
            calculateSimilarity(claim.text, existing.text) > 0.8
        );

        if (!isDuplicate) {
            uniqueClaims.push(claim);
        }
    }

    return uniqueClaims.sort((a, b) => b.confidence - a.confidence);
}

function calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);

    return intersection.size / union.size;
}

// Example usage function for testing
export function testClaimDetection() {
    const sampleText = `
    According to recent studies, unemployment has decreased by 3.2 percent in the last year.
    I think the economy is doing well, but crime rates have increased by 15% in major cities.
    The data shows that renewable energy production rose by 40% compared to last year.
    Maybe we should consider other options.
  `;

    const claims = detectClaims(sampleText);
    console.log('Detected claims:', claims);
    return claims;
} 