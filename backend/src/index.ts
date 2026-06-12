import { Elysia } from "elysia";
import { llm } from "./routes/llm";

new Elysia().use(llm)
