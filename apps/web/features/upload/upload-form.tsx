"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResumeView } from "@job-search/shared";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.docx";

export function UploadForm({ destination = (id: string) => `/r/${id}` }: { destination?: (id: string) => string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [text, setText] = useState("");

  async function submit(init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const resume = await api<ResumeView>(init.method === "POST" && init.body instanceof FormData ? "/resumes" : "/resumes/text", init);
      router.push(destination(resume.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    if (!/\.(pdf|docx)$/i.test(file.name)) return setError("Only PDF and DOCX files are supported.");
    if (file.size > MAX_BYTES) return setError("File is larger than 5 MB.");
    const body = new FormData();
    body.append("file", file);
    void submit({ method: "POST", body });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload resume"
        onClick={() => !busy && input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) onFile(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-14 text-center transition-colors focus-visible:outline-2 ${
          dragging ? "border-foreground bg-muted" : "border-border hover:bg-muted"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="font-medium">{busy ? "Reading your resume..." : "Drop your resume here"}</span>
        <span className="text-sm text-muted-foreground">PDF or DOCX, up to 5 MB</span>
        <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Button variant="outline" disabled={busy} onClick={() => setPasteOpen((v) => !v)}>
          {pasteOpen ? "Hide text box" : "Paste text instead"}
        </Button>
      </div>

      {pasteOpen && (
        <div className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Paste your resume text"
            className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline-2"
          />
          <Button
            disabled={busy || text.trim().length < 80}
            onClick={() => submit({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) })}
          >
            {busy ? "Reading..." : "Use this text"}
          </Button>
        </div>
      )}
    </div>
  );
}
