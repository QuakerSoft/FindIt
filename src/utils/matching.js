const STOPWORDS = new Set([
    "the", "a", "an", "in", "on", "at", "near", "and", "of", "to", "for",
    "with", "is", "was", "it", "my", "i", "found", "lost", "item", "this",
    "that", "has", "have", "had", "left", "by", "from", "some", "any",
]);
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
export function jaccardSimilarity(tagsA, tagsB) {
    if (tagsA.size === 0 && tagsB.size === 0) return 0;

    let intersectionSize = 0;
    for (const tag of tagsA) {
        if (tagsB.has(tag)) intersectionSize++;
    }

    const unionSize = tagsA.size + tagsB.size - intersectionSize;

    return unionSize === 0 ? 0 : intersectionSize / unionSize;
}
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