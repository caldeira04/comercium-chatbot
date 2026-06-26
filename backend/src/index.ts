import { Elysia } from "elysia";
import { llm } from "./routes/llm";
import { cors } from "@elysiajs/cors";
import { ensureKnowledgeBase } from "./utils/knowledge";

ensureKnowledgeBase().catch(console.error);

new Elysia()
    .use(
        cors({
            origin: "http://localhost:5173",
        }),
    )
    .use(llm)
    .listen(3000);
