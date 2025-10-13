import {
    SentenceTokenizer,
    Stemmer,
    PorterStemmer
} from 'natural';

export class TextSummarizer {
    private tokenizer: SentenceTokenizer;
    private stemmer: Stemmer;
    private ENGLISH_ABBREVIATIONS = [
        'mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'rev', 'hon', 'esq', 'sr', 'jr',
        'phd', 'md', 'jd', 'llb', 'ma', 'msc', 'mba', 'bsc', 'ba', 'bs',
        'am', 'pm', 'a.m', 'p.m', 'bc', 'ad', 'bce', 'ce',
        'ave', 'blvd', 'st', 'rd', 'ln', 'dr', 'ct', 'pl', 'cir', 'al', 'mt', 'ft',
        'etc', 'e.g', 'i.e', 'cf', 'vs', 'viz', 'et al', 'ex', 'ibid', 'op cit',
        'inc', 'ltd', 'corp', 'co', 'dept', 'est', 'no', 'vol', 'pp', 'p', 'ch', 'sec',
        'ai', 'api', 'http', 'www', 'io', 'js', 'ts', 'ui', 'ux', 'os',
        'us', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'in', 'br', 'ru',
        'min', 'max', 'fig', 'no', 'nos', 'para', 'approx', 'pct', 'tel', 'fax'
    ];

    constructor() {
        this.tokenizer = new SentenceTokenizer(this.ENGLISH_ABBREVIATIONS);
        this.stemmer = PorterStemmer;
    }

    /**
     * Summarizes text by extracting most important sentences
     * @param text Input text to summarize
     * @param sentenceCount Number of sentences in the summary (default: 3)
     * @returns Summary text
     */
    summarize(text: string, sentenceCount: number = 3): string {
        if (!text.trim()) { return ''; }

        // Tokenize into sentences
        const sentences = this.tokenizer.tokenize(text);
        if (sentences.length <= sentenceCount) { return text; }

        // Create frequency table of stemmed words
        const wordFrequencies: Record<string, number> = {};
        this.stemmer.tokenizeAndStem(text).forEach(word => {
            wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
        });

        // Calculate sentence scores
        const sentenceScores = sentences.map(sentence => {
            const words = this.stemmer.tokenizeAndStem(sentence);
            return words.reduce((score, word) => score + (wordFrequencies[word] || 0), 0);
        });

        // Create scored sentences with original index
        const scoredSentences = sentences.map((sentence, index) => ({
            sentence,
            score: sentenceScores[index],
            index
        }));

        // Sort by score descending, then take top sentences
        const topSentences = scoredSentences
            .sort((a, b) => b.score - a.score)
            .slice(0, sentenceCount);

        // Sort by original position and join
        return topSentences
            .sort((a, b) => a.index - b.index)
            .map(item => item.sentence)
            .join(' ');
    }
}