export class RegexUtils {
    /**
     * Creates a RegExp object safely.
     * @param keyword The pattern or search text.
     * @param isRegex Whether the keyword is a regex pattern.
     * @param caseSensitive Whether the search should be case sensitive.
     * @returns A RegExp object. Returns a match-nothing regex on error.
     */
    private static cache: Map<string, RegExp> = new Map();
    private static readonly MAX_CACHE_SIZE = 500;
    private static readonly ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;

    /**
     * Creates a RegExp object safely with caching.
     * @param keyword The pattern or search text.
     * @param isRegex Whether the keyword is a regex pattern.
     * @param caseSensitive Whether the search should be case sensitive.
     * @returns A RegExp object. Returns a match-nothing regex on error.
     */
    public static create(keyword: string, isRegex: boolean, caseSensitive: boolean): RegExp {
        const key = `${keyword}_${isRegex}_${caseSensitive}`;
        if (RegexUtils.cache.has(key)) {
            return RegexUtils.cache.get(key)!;
        }

        try {
            const flags = caseSensitive ? 'g' : 'gi';
            let regex: RegExp;
            if (isRegex) {
                regex = new RegExp(keyword, flags);
            } else {
                const escaped = keyword.replace(RegexUtils.ESCAPE_REGEX, '\\$&');
                regex = new RegExp(escaped, flags);
            }

            // Simple LRU-like eviction (clearing half if full)
            if (RegexUtils.cache.size >= RegexUtils.MAX_CACHE_SIZE) {
                RegexUtils.cache.clear();
            }
            RegexUtils.cache.set(key, regex);
            return regex;

        } catch (e) {
            // Return a regex that matches nothing
            return /(?!)/;
        }
    }
}
