"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRouter } from "next/navigation";
import type { ResumeView } from "@job-search/shared";
import { Button } from "@/components/ui/button";
import { API_URL, api } from "@/lib/api";

const MIN_USER_MESSAGES = 3;

function useSessionId(storageKey: string) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let value: string | null = null;
    try {
      value = localStorage.getItem(storageKey);
      if (!value) {
        value = crypto.randomUUID();
        localStorage.setItem(storageKey, value);
      }
    } catch {
      value = crypto.randomUUID();
    }
    setId(value);
  }, [storageKey]);
  return id;
}

const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

function ChatInner({
  sessionId,
  resumeId,
  initialMessages,
  storageKey,
  placeholder,
}: {
  sessionId: string;
  resumeId: string | null;
  initialMessages: UIMessage[];
  storageKey: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${API_URL}/chat`,
        prepareSendMessagesRequest: ({ messages, id }) => ({
          body: { id, message: messages[messages.length - 1], resumeId },
        }),
      }),
    [resumeId],
  );

  const { messages, sendMessage, status, error } = useChat({ id: sessionId, messages: initialMessages, transport });
  const busy = status === "submitted" || status === "streaming";
  const userTurns = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function createResume() {
    setCreating(true);
    setCreateError(null);
    try {
      const resume = await api<ResumeView>(`/chat/${sessionId}/resume`, { method: "POST" });
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      router.push(`/r/${resume.id}`);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Could not create the resume.");
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-h-[60vh] min-h-64 flex-col gap-3 overflow-y-auto rounded-lg border border-border p-4" aria-live="polite">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">{placeholder}</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border"
              }`}
            >
              {textOf(m)}
            </p>
          </div>
        ))}
        {status === "submitted" && <p className="text-sm text-muted-foreground">Thinking...</p>}
        <div ref={bottom} />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium">
          {error.message}
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = input.trim();
          if (!text || busy) return;
          void sendMessage({ text });
          setInput("");
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          aria-label="Message"
          placeholder="Type your answer"
          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-2"
        />
        <Button type="submit" disabled={busy || !input.trim()}>
          Send
        </Button>
      </form>

      {!resumeId && userTurns >= MIN_USER_MESSAGES && (
        <div className="flex flex-col items-start gap-2">
          <Button variant="outline" onClick={createResume} disabled={creating || busy}>
            {creating ? "Creating..." : "Create resume"}
          </Button>
          {createError && (
            <p role="alert" className="text-sm font-medium">
              {createError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ChatPanel({ storageKey, resumeId, placeholder }: { storageKey: string; resumeId: string | null; placeholder: string }) {
  const sessionId = useSessionId(storageKey);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    api<{ messages: UIMessage[] }>(`/chat/${sessionId}`)
      .then((h) => setInitial(h.messages))
      .catch((e: Error) => setError(e.message));
  }, [sessionId]);

  if (error) return <p role="alert" className="font-medium">{error}</p>;
  if (!sessionId || !initial) return <div className="h-64 animate-pulse rounded-lg bg-muted" aria-label="Loading" />;
  return (
    <ChatInner sessionId={sessionId} resumeId={resumeId} initialMessages={initial} storageKey={storageKey} placeholder={placeholder} />
  );
}
