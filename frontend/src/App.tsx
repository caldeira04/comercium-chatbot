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
        <div>
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
        <article className="flex flex-col gap-2">
            <div className="bg-muted self-end px-4 py-2 rounded-xl min-w-2/3 max-w-2/3">
                <MarkdownContent value={content.prompt} />
            </div>

            <div className="bg-muted/20 self-start px-4 py-2 rounded-xl min-w-2/3 max-w-2/3">
                <p className="font-bold text-xl">Market Guy</p>
                <MarkdownContent value={content.response} />
            </div>

            {content.reasoningDetails && (
                <details className="min-w-2/3 max-w-2/3">
                    <summary className="font-bold">Ver raciocínio</summary>
                    <div className="bg-muted rounded-lg px-4 py-2 text-muted-foreground mb-2">
                        <MarkdownContent value={content.reasoningDetails} />
                    </div>
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
        <main className="w-1/2 h-screen flex flex-col mx-auto mt-6 top-6 sticky">
            <section className="text-center flex flex-col gap-4">
                <h1 className="font-bold text-6xl uppercase">Comercium</h1>
                <p>
                    tem alguma dúvida sobre como usar o sistema? deixe o Market
                    Guy te ajudar!
                </p>
            </section>

            <section className="mt-6 overflow-scroll flex-1 flex flex-col">
                {messages.length > 0 ? (
                    messages.map((message, index) => (
                        <Message
                            content={message}
                            key={`${message.prompt}-${index}`}
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <span>Comece uma conversa</span>
                        <p>
                            Digite sua dúvida abaixo para receber a primeira
                            resposta.
                        </p>
                    </div>
                )}
            </section>

            <form
                className="flex items-center justify-center w-full h-24 sticky gap-4 mb-6"
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
                    className="w-full bg-muted rounded-xl px-4 py-2"
                />
                <button
                    className={`${loading || !input.trim() ? "bg-muted-foreground/50 cursor-not-allowed" : ""} cursor-pointer bg-black px-4 py-2 rounded-full text-white`}
                    type="submit"
                    disabled={loading || !input.trim()}
                >
                    &gt;
                </button>
            </form>
        </main>
    );
}

export default App;
