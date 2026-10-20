"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/features/chat/chat-panel";
import { UploadForm } from "@/features/upload/upload-form";

const toStudio = (id: string) => `/studio/${id}`;

export default function StudioStart() {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-8 px-4 py-16">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Resume studio</h1>
        <p className="text-muted-foreground">Improve the resume you have, or build one by answering a few questions.</p>
      </header>

      <Tabs defaultValue="improve">
        <TabsList variant="line">
          <TabsTrigger value="improve">Improve my resume</TabsTrigger>
          <TabsTrigger value="write">Write with AI</TabsTrigger>
        </TabsList>
        <TabsContent value="improve" className="pt-6">
          <UploadForm destination={toStudio} />
        </TabsContent>
        <TabsContent value="write" className="pt-6">
          <ChatPanel
            storageKey="chat:new"
            resumeId={null}
            createdHref={toStudio}
            placeholder="Say hi, or tell me which role you are aiming for. After a few answers, press Create resume."
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
