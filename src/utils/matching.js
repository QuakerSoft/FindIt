// Lightweight text-based matching between lost/found items.
// No external dependencies — pure functions so they're easy to test in isolation.

const STOPWORDS = new Set([
    "the", "a", "an", "in", "on", "at", "near", "and", "of", "to", "for",
    "with", "is", "was", "it", "my", "i", "found", "lost", "item", "this",
    "that", "has", "have", "had", "left", "by", "from", "some", "any",
]);

/**
 * Turns an item's text fields into a normalized set of tags.
 * Combines title, description, and category since those carry the
 * most identifying detail a person would type, plus any AI-generated
 * tags from the photo (item.aiTags), which are already short lowercase
 * words/phrases and don't need the same tokenizing treatment.
 */
export function extractTags(item) {
    const text = [item.title, item.description, item.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    const words = text
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2 && !STOPWORDS.has(word));

    const aiTags = Array.isArray(item.aiTags)
        ? item.aiTags.map((tag) => tag.toLowerCase().trim()).filter(Boolean)
        : [];

    return new Set([...words, ...aiTags]);
}

/**
 * Jaccard similarity: intersection size / union size, 0 to 1.
 * Returns 0 for two empty sets instead of dividing by zero.
 */
export function jaccardSimilarity(tagsA, tagsB) {
    if (tagsA.size === 0 && tagsB.size === 0) return 0;

    let intersectionSize = 0;
    for (const tag of tagsA) {
        if (tagsB.has(tag)) intersectionSize++;
    }

    const unionSize = tagsA.size + tagsB.size - intersectionSize;

    return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/**
 * Scores a new item against a list of candidate items (already fetched),
 * returning the top matches above a minimum score threshold.
 */
export function rankMatches(newItem, candidates, { minScore = 0.15, maxResults = 5 } = {}) {
    const newTags = extractTags(newItem);

    return candidates
        .map((candidate) => ({
            itemId: candidate.id,
            score: jaccardSimilarity(newTags, extractTags(candidate)),
        }))
        .filter((match) => match.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
}