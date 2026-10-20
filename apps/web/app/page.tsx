import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { UploadForm } from "@/features/upload/upload-form";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-8 px-4 py-20">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold">Better resume. Better jobs.</h1>
        <p className="text-muted-foreground">
          Upload your resume to get an improved version and matching jobs from LinkedIn and Naukri.
        </p>
      </header>
      <UploadForm />
      <div className="flex flex-col items-start gap-2">
        <Link href="/studio" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Improve or write a resume
        </Link>
        <p className="text-sm text-muted-foreground">Edit with AI chat, download a clean DOCX or PDF, then search jobs.</p>
      </div>
    </main>
  );
}
