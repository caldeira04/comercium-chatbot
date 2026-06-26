import { Elysia, t } from "elysia";
import { systemPrompt } from "../utils/general";
import { db } from "../db/db";
import { message } from "../db/schema";
import { embed } from "../utils/embeddings";
import { retrieveRelevantChunks } from "../utils/knowledge";

const apiKey = process.env.OPENROUTER_API_KEY;

export const llm = new Elysia({ prefix: "/llm" })
    .get("/chat", async () => {
        const history = await db.query.message.findMany({
            columns: {
                prompt: true,
                response: true,
                reasoningDetails: true,
            },
        });

        return history;
    })

    .delete("/chat", async () => {
        await db.delete(message).returning();

        return {
            status: 201,
        };
    })

    .post(
        "/chat",
        async ({ body }) => {
            const { input } = body;

            if (!input)
                return {
                    status: 400,
                    error: "You must provide a prompt",
                };

            const queryEmbedding = await embed(input);
            const relevantChunks = await retrieveRelevantChunks(queryEmbedding, 5);

            const context = relevantChunks
                .map((c) => c.content)
                .join("\n\n---\n\n");

            const messages = [
                {
                    role: "system",
                    content: `${systemPrompt}\n\n# Contexto\n\n${context}`,
                },
                {
                    role: "user",
                    content: input,
                },
            ];

            const llmResponse = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "openai/gpt-oss-120b:free",
                        messages,
                    }),
                },
            );

            const result = await llmResponse.json();

            if (!result.choices || !result.choices[0]) {
                console.error("OpenRouter error:", JSON.stringify(result, null, 2));
                return {
                    status: 502,
                    error: result.error?.message || "LLM service returned an error",
                };
            }

            const reply = {
                message: result.choices[0].message.content,
                reasoningDetails: result.choices[0].message.reasoning,
            };

            await db.insert(message).values({
                prompt: input,
                response: reply.message,
                reasoningDetails: reply.reasoningDetails,
            });

            return {
                status: 200,
                response: reply,
            };
        },
        {
            body: t.Object({
                input: t.String({
                    minLength: 1,
                    maxLength: 2000,
                }),
            }),
        },
    );
