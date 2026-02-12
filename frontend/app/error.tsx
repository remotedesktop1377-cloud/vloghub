"use client";
import { startTransition, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();
  const errorMessage = useMemo(() => {
    if (!error?.message) return "An unexpected issue occurred while loading this page.";
    return error.message.length > 220 ? `${error.message.slice(0, 220)}...` : error.message;
  }, [error]);

  const reloadPage = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <main className="min-h-screen w-full bg-[#05070d] text-[#e6eaf2]">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
        <section className="w-full rounded-2xl border border-[#233047] bg-[#0f1421] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#3a4f73] bg-[#172136] text-xl">
            !
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">Something went wrong</h1>
          <p className="mt-2 text-sm text-[#b8c5dd] sm:text-base">
            We couldn&apos;t load this page right now. Please try again.
          </p>

          <div className="mt-5 rounded-xl border border-[#24314a] bg-[#0b101a] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8ea4c9]">Error details</p>
            <p className="mt-2 break-words text-sm text-[#d7e2f6]">{errorMessage}</p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              className="h-11 rounded-full bg-[#e6eaf2] px-6 text-sm font-semibold text-[#0b0f17] transition-colors hover:bg-white"
              onClick={reloadPage}
            >
              Try again
            </button>
            <button
              className="h-11 rounded-full border border-[#314462] px-6 text-sm font-semibold text-[#dbe6fb] transition-colors hover:bg-[#172136]"
              onClick={() => router.push("/")}
            >
              Go to home
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}