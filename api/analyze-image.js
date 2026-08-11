const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You are labeling a photo of a lost or found item for a campus lost-and-found app.
Look at the photo and respond with ONLY a JSON object, no other text, no markdown fences.
The JSON must have exactly this shape:
{"tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}

Rules:
- 3 to 8 short lowercase tags.
- Include: object type, color(s), visible brand/logo if any, and any distinguishing feature (rip, sticker, keychain, scratch, etc).
- Do not include generic words like "item", "photo", "found", "lost".
- If the image doesn't clearly show an item, return {"tags": []}.`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageBase64, mediaType } = req.body;

    if (!imageBase64 || !mediaType) {
        return res
            .status(400)
            .json({ error: 'imageBase64 and mediaType are required' });
    }

    const allowedMediaTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];

    if (!allowedMediaTypes.includes(mediaType)) {
        return res.status(400).json({ error: 'Unsupported image type' });
    }

    try {
        const response = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 200,
                system: SYSTEM_PROMPT,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mediaType,
                                    data: imageBase64,
                                },
                            },
                            {
                                type: 'text',
                                text: 'Label this item.',
                            },
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Anthropic API error:', response.status, errorBody);
            return res.status(502).json({ error: 'Image analysis failed' });
        }

        const data = await response.json();
        const textBlock = data.content?.find((block) => block.type === 'text');

        if (!textBlock) {
            return res.status(200).json({ tags: [] });
        }

        let parsed;
        try {
            const cleaned = textBlock.text
                .replace(/```json|```/g, '')
                .trim();
            parsed = JSON.parse(cleaned);
        } catch {
            console.error('Failed to parse model response:', textBlock.text);
            return res.status(200).json({ tags: [] });
        }

        const tags = Array.isArray(parsed.tags)
            ? parsed.tags.filter((t) => typeof t === 'string').slice(0, 8)
            : [];

        return res.status(200).json({ tags });
    } catch (error) {
        console.error('Error analyzing image:', error);
        return res.status(500).json({ error: 'Failed to analyze image' });
    }
}