import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

const API_URL = "http://localhost:3000/llm/chat";

type MessageType = {
    prompt: string;
    response: string;
    reasoningDetails?: string | null;
};

type ChatResponse = {
    response?: {
        message: string;
        reasoningDetails?: string | null;
    };
};

function MarkdownContent({ value }: { value: string }) {
    return (
        <div className="markdown-content">
            <ReactMarkdown
                components={{
                    a: (props) => (
                        <a
                            href={props.href}
                            title={props.title}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {props.children}
                        </a>
                    ),
                }}
            >
                {value}
            </ReactMarkdown>
        </div>
    );
}

function Message({ content }: { content: MessageType }) {
    return (
        <article className="message-card">
            <div className="message-row message-row-user">
                <span className="message-label">Você</span>
                <MarkdownContent value={content.prompt} />
            </div>

            <div className="message-row message-row-bot">
                <span className="message-label">Comercium</span>
                <MarkdownContent value={content.response} />
            </div>

            {content.reasoningDetails && (
                <details className="reasoning-details">
                    <summary>Ver raciocínio</summary>
                    <MarkdownContent value={content.reasoningDetails} />
                </details>
            )}
        </article>
    );
}

function App() {
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [input, setInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        fetch(API_URL, {
            method: "GET",
        })
            .then(async (res) => {
                setMessages(await res.json());
            })
            .catch(() => setMessages([]));
    }, []);

    async function handlePrompt() {
        const prompt = input.trim();

        if (!prompt) return;

        setLoading(true);

        try {
            const res = await fetch(API_URL, {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    input: prompt,
                }),
            });

            if (!res.ok) throw new Error("Não foi possível enviar sua dúvida.");

            const data = (await res.json()) as ChatResponse;
            const response = data.response;

            if (response?.message) {
                setMessages((currentMessages) => [
                    ...currentMessages,
                    {
                        prompt,
                        response: response.message,
                        reasoningDetails: response.reasoningDetails ?? null,
                    },
                ]);
            }

            setInput("");
        } catch (e) {
            alert(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="chat-shell">
            <section className="chat-hero" aria-labelledby="chat-title">
                <span className="eyebrow">Assistente inteligente</span>
                <h1 id="chat-title">Comercium Chatbot</h1>
                <p>
                    Tire dúvidas comerciais com respostas claras, rápidas e organizadas.
                </p>
            </section>

            <section className="messages-panel" aria-live="polite">
                {messages.length > 0 ? (
                    messages.map((message, index) => (
                        <Message content={message} key={`${message.prompt}-${index}`} />
                    ))
                ) : (
                    <div className="empty-state">
                        <span>Comece uma conversa</span>
                        <p>Digite sua dúvida abaixo para receber a primeira resposta.</p>
                    </div>
                )}
            </section>

            <form
                className="prompt-composer"
                onSubmit={(event) => {
                    event.preventDefault();
                    handlePrompt();
                }}
            >
                <textarea
                    value={input}
                    placeholder="digite sua dúvida aqui..."
                    maxLength={2000}
                    onChange={(e) => setInput(e.target.value)}
                    aria-label="Digite sua dúvida"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                >
                    {loading ? "enviando..." : "enviar"}
                </button>
            </form>
        </main>
    );
}

export default App;
