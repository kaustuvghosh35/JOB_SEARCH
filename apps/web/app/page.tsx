"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Health = { status: string; anthropicKey: boolean; tinyfishKey: boolean };

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<Health>("/health").then(setHealth).catch(() => setFailed(true));
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-6 px-4 py-24">
      <h1 className="text-4xl font-semibold">Better resume. Better jobs.</h1>
      <p className="text-muted-foreground">
        Upload your resume, get an improved version, and see matching jobs.
      </p>
      <p className="font-mono text-xs text-muted-foreground">
        api: {failed ? "unreachable" : health ? health.status : "checking"}
      </p>
    </main>
  );
}
