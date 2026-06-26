import { db } from "../db/db";
import { knowledgeChunk } from "../db/schema";
import { embed, cosineSimilarity, chunkDocument } from "./embeddings";
import { count } from "drizzle-orm";
import { resolve } from "path";

const KNOWLEDGE_DIR = import.meta.dir
    ? resolve(import.meta.dir, "../../knowledge")
    : "backend/knowledge";

export async function ensureKnowledgeBase(): Promise<void> {
    const [row] = await db.select({ count: count() }).from(knowledgeChunk);

    if (row.count > 0) {
        console.log(`Knowledge base already seeded (${row.count} chunks)`);
        return;
    }

    console.log("Seeding knowledge base...");

    const glob = new Bun.Glob("*.md");
    const files: string[] = [];
    for await (const file of glob.scan({ cwd: KNOWLEDGE_DIR })) {
        files.push(file);
    }

    if (files.length === 0) {
        console.warn(`No markdown files found in: ${KNOWLEDGE_DIR}`);
        return;
    }

    let totalChunks = 0;

    for (const file of files.sort()) {
        const filePath = `${KNOWLEDGE_DIR}/${file}`;
        const markdown = await Bun.file(filePath).text();
        const chunks = chunkDocument(markdown, file);

        for (const chunk of chunks) {
            const vector = await embed(chunk.content);
            await db.insert(knowledgeChunk).values({
                content: chunk.content,
                embedding: JSON.stringify(vector),
                sourceFile: chunk.sourceFile,
            });
            totalChunks++;
        }

        console.log(`  Embedded ${chunks.length} chunks from ${file}`);
    }

    console.log(`Knowledge base seeded: ${totalChunks} chunks from ${files.length} files`);
}

export async function retrieveRelevantChunks(
    queryEmbedding: number[],
    topK: number = 5,
): Promise<{ content: string; sourceFile: string; score: number }[]> {
    const rows = await db.select({
        content: knowledgeChunk.content,
        sourceFile: knowledgeChunk.sourceFile,
        embedding: knowledgeChunk.embedding,
    }).from(knowledgeChunk);

    const scored = rows.map((row) => ({
        content: row.content,
        sourceFile: row.sourceFile,
        score: cosineSimilarity(queryEmbedding, JSON.parse(row.embedding)),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
}
