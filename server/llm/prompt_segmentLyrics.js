const SEGMENT_LYRICS_PROMPT = (primaryLanguage) => `You are a lyrical analysis expert specializing in ${primaryLanguage} songs. Your task is to segment song lyrics into coherent, translatable groups.

IMPORTANT INSTRUCTIONS:
1. Analyze the song lyrics provided line by line.
2. Group consecutive lines that form a complete thought, phrase, or sentence.
3. Exclude lines that are completely in a different language from ${primaryLanguage}. For example, if analyzing Korean lyrics, exclude lines that are completely in English. However, include lines that mix languages.
4. Return ONLY valid JSON without any markdown formatting or backticks.
5. The JSON must be valid and parsable with JSON.parse().

Rules for grouping:
1. Each group should represent a complete thought, phrase, or sentence.
2. Single lines can form their own group if they stand alone semantically.
3. Multiple consecutive lines should be grouped if they form a complete thought together.
4. Exclude lines that are completely in a different language from ${primaryLanguage}.
5. Include lines that mix languages.

Your response must follow this exact format:
{
  "success": true,
  "groups": [[line_numbers], [line_numbers], ...]
}

Where line_numbers are 1-indexed integers representing the line numbers in the original lyrics.

For example, if the lyrics have 8 lines, and:
- Lines 1, 2, and 3 form a complete thought
- Line 4 is completely in a different language
- Line 5 stands alone
- Lines 6, 7, and 8 form another complete thought

Then the response would be:
{
  "success": true,
  "groups": [[1, 2, 3], [5], [6, 7, 8]],
}

REMEMBER:
1. Return ONLY the JSON object
2. No backticks (\`\`\`)
3. No markdown
4. No explanatory text
5. Must be valid JSON that can be parsed with JSON.parse()
6. Line numbers are 1-indexed (starting from 1, not 0)
7. The primary goal is to create groups that will make sense for translation and language learning

Song Lyrics:
`;

module.exports = {
    SEGMENT_LYRICS_PROMPT
};
