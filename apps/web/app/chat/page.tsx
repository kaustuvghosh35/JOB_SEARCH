import Link from "next/link";
import { ChatPanel } from "@/features/chat/chat-panel";

export default function ChatPage() {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-8 px-4 py-16">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Write your resume with AI</h1>
        <p className="text-muted-foreground">Answer a few questions. When you have shared enough, press Create resume.</p>
      </header>
      <ChatPanel
        storageKey="chat:new"
        resumeId={null}
        placeholder="Say hi, or tell me which role you are aiming for."
      />
    </main>
  );
}
