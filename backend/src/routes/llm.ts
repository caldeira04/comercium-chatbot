import { Elysia, t } from "elysia";
import { systemPrompt } from "../utils/general";
import { db } from "../db/db";
import { message } from "../db/schema";
import { desc } from "drizzle-orm";

const apiKey = process.env.OPENROUTER_API_KEY;

type Message = {
    role: string;
    content: string;
    reasoning_details?: string | null;
};

const content: Message[] = [
    {
        role: "system",
        content: systemPrompt,
    },
];

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
            const history = await db.query.message.findFirst({
                columns: {
                    createdAt: true,
                    response: true,
                    reasoningDetails: true,
                },
                orderBy: [desc(message.createdAt)],
            });

            if (history)
                content.push({
                    role: "assistant",
                    content: history.response,
                    reasoning_details: history.reasoningDetails,
                });

            if (!input)
                return {
                    status: 400,
                    error: "You must provide a prompt",
                };

            content.push({
                role: "user",
                content: input,
            });

            let response: any = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        model: "openai/gpt-oss-120b:free",
                        messages: content,
                    }),
                },
            );

            const result = await response.json();

            response = {
                message: result.choices[0].message.content,
                reasoningDetails: result.choices[0].message.reasoning,
            };

            await db.insert(message).values({
                prompt: input,
                response: response.message,
                reasoningDetails: response.reasoningDetails,
            });

            return {
                status: 200,
                response,
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
