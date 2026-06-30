const apiKey = process.env.OPENROUTER_API_KEY!;
const embeddingModel = process.env.OPENROUTER_EMBEDDING_MODEL!;

export async function embed(text: string): Promise<number[]> {
    const response = await fetch(
        "https://openrouter.ai/api/v1/embeddings",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: embeddingModel,
                input: text,
            }),
        },
    );

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `OpenRouter embeddings API error: ${response.status} ${response.statusText} - ${errorBody}`,
        );
    }

    const data = await response.json();
    if (!data.data?.[0]?.embedding) {
        throw new Error(
            `Unexpected embeddings response structure: ${JSON.stringify(data)}`,
        );
    }
    return data.data[0].embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }

    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function chunkDocument(
    content: string,
    sourceFile: string,
): { content: string; sourceFile: string }[] {
    const lines = content.split("\n");
    const chunks: { content: string; sourceFile: string }[] = [];
    let currentSection: string[] = [];

    for (const line of lines) {
        if (line.startsWith("## ")) {
            if (currentSection.length > 0) {
                const sectionContent = currentSection.join("\n").trim();
                if (sectionContent.length > 20) {
                    chunks.push({
                        content: sectionContent,
                        sourceFile,
                    });
                }
            }
            currentSection = [line];
        } else {
            currentSection.push(line);
        }
    }

    if (currentSection.length > 0) {
        const sectionContent = currentSection.join("\n").trim();
        if (sectionContent.length > 20) {
            chunks.push({
                content: sectionContent,
                sourceFile,
            });
        }
    }

    return chunks;
}
