import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const message = sqliteTable("message", {
    id: text("id")
        .primaryKey()
        .$default(() => crypto.randomUUID()),
    prompt: text("prompt").notNull(),
    response: text("reponse").notNull(),
    reasoningDetails: text("reasoning_details"),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const knowledgeChunk = sqliteTable("knowledge_chunk", {
    id: text("id")
        .primaryKey()
        .$default(() => crypto.randomUUID()),
    content: text("content").notNull(),
    embedding: text("embedding").notNull(),
    sourceFile: text("source_file").notNull(),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});
