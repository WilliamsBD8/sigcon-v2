import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { base_url } from "../../utils/functions";

const ASSISTANT_TIMEOUT_MS = 90000;

async function assistantFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ASSISTANT_TIMEOUT_MS);

    try {
        const response = await fetch(url, { ...options, headers, signal: controller.signal });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw {
                msg: data.msg || data.message || "No se pudo obtener respuesta del asistente.",
                status: response.status,
            };
        }
        return data;
    } finally {
        clearTimeout(timeoutId);
    }
}

const AssistantChat = () => {
    const user = useSelector((state) => state.user?.user);
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState({ enabled: true, configured: false });
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sessionSummary, setSessionSummary] = useState("");
    const bottomRef = useRef(null);

    const loadStatus = useCallback(async () => {
        try {
            const url = base_url(["api", "v1", "assistant", "status"]);
            const response = await assistantFetch(url, { method: "GET" });
            setStatus(response?.data ?? { enabled: true, configured: false });
        } catch {
            setStatus({ enabled: true, configured: false });
        }
    }, []);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    useEffect(() => {
        if (open && messages.length === 0 && user) {
            setMessages([
                {
                    role: "assistant",
                    content: `Hola ${user.name ?? ""}, soy el asistente de SIGCON. Puedo ayudarte con consultas sobre tu empresa y los indicadores de tu sesión actual. ¿En qué te ayudo?`,
                },
            ]);
        }
    }, [open, messages.length, user]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const sendMessage = async (event) => {
        event.preventDefault();
        const text = input.trim();
        if (!text || loading) return;

        if (!status.configured) {
            setError("El asistente no está configurado en el servidor (falta OPENAI_API_KEY).");
            return;
        }

        const userMessage = { role: "user", content: text };
        const history = messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role, content: m.content }));

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setError("");
        setLoading(true);

        try {
            const url = base_url(["api", "v1", "assistant", "chat"]);
            const response = await assistantFetch(url, {
                method: "POST",
                body: JSON.stringify({ message: text, history }),
            });

            const data = response?.data ?? {};
            setSessionSummary(data.sessionSummary ?? "");
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply ?? "Sin respuesta." },
            ]);
        } catch (err) {
            setError(err?.msg || "Error al consultar el asistente.");
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError("");
        setSessionSummary("");
    };

    return (
        <>
            <button
                type="button"
                className="btn btn-primary btn-icon rounded-circle sigcon-assistant-fab shadow"
                onClick={() => setOpen((v) => !v)}
                title="Asistente SIGCON"
                aria-label="Abrir asistente"
            >
                <i className={`${open ? "ri-chat-off-line" : "ri-chat-new-fill"}`} />
            </button>

            {open && (
                <div className="card sigcon-assistant-panel shadow-lg">
                    <div className="card-header d-flex justify-content-between align-items-center py-3">
                        <div>
                            <h6 className="mb-0">Asistente SIGCON</h6>
                            <small className="text-muted">
                                {sessionSummary || `${user?.name ?? ""} ${user?.lastname ?? ""}`.trim()}
                            </small>
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-label-secondary"
                            onClick={clearChat}
                            title="Nueva conversación"
                        >
                            <i className="ri-reset-left-line" />
                        </button>
                    </div>

                    <div className="card-body sigcon-assistant-messages p-3">
                        {!status.configured && (
                            <div className="alert alert-warning py-2 mb-2" role="alert">
                                Configura <code>OPENAI_API_KEY</code> en el backend para activar respuestas con IA.
                            </div>
                        )}

                        {messages.map((msg, index) => (
                            <div
                                key={`${msg.role}-${index}`}
                                className={`sigcon-assistant-bubble mb-2 ${
                                    msg.role === "user" ? "is-user" : "is-assistant"
                                }`}
                            >
                                <small className="text-muted d-block mb-1">
                                    {msg.role === "user" ? "Tú" : "Asistente"}
                                </small>
                                <div className="mb-0 text-break">{msg.content}</div>
                            </div>
                        ))}

                        {loading && (
                            <div className="sigcon-assistant-bubble is-assistant mb-2">
                                <span className="spinner-border spinner-border-sm me-2" role="status" />
                                Pensando con el contexto de tu sesión...
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger py-2 mb-0" role="alert">
                                {error}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <form className="card-footer p-3 border-top" onSubmit={sendMessage}>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Pregunta sobre facturas, comprobantes, bancos..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={loading || !status.enabled}
                                maxLength={4000}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || !input.trim() || !status.enabled}
                            >
                                <i className="ti ti-send" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <style>{`
                .sigcon-assistant-fab {
                    position: fixed;
                    right: 1.5rem;
                    bottom: 1.5rem;
                    z-index: 1090;
                    width: 3.25rem;
                    height: 3.25rem;
                }
                .sigcon-assistant-panel {
                    position: fixed;
                    right: 1.5rem;
                    bottom: 5.25rem;
                    width: min(420px, calc(100vw - 2rem));
                    height: min(560px, calc(100vh - 7rem));
                    z-index: 1090;
                    display: flex;
                    flex-direction: column;
                }
                .sigcon-assistant-messages {
                    flex: 1;
                    overflow-y: auto;
                    background: var(--bs-body-bg);
                }
                .sigcon-assistant-bubble {
                    border-radius: 0.75rem;
                    padding: 0.65rem 0.85rem;
                    max-width: 92%;
                }
                .sigcon-assistant-bubble.is-user {
                    margin-left: auto;
                    background: rgba(var(--bs-primary-rgb), 0.12);
                }
                .sigcon-assistant-bubble.is-assistant {
                    margin-right: auto;
                    background: rgba(var(--bs-secondary-rgb), 0.12);
                }
            `}</style>
        </>
    );
};

export default AssistantChat;
