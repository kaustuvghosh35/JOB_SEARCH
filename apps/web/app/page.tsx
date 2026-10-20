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
    </main>
  );
}
