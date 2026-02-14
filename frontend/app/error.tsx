"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./error.module.css";

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
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <section className={styles.section}>
          <div className={styles.iconContainer}>
            !
          </div>

          <h1 className={styles.heading}>Something went wrong</h1>
          <p className={styles.description}>
            We couldn&apos;t load this page right now. Please try again.
          </p>

          <div className={styles.errorBox}>
            <p className={styles.errorLabel}>Error details</p>
            <p className={styles.errorMessage}>{errorMessage}</p>
          </div>

          <div className={styles.buttonsContainer}>
            <button
              className={styles.primaryButton}
              onClick={reloadPage}
            >
              Try again
            </button>
            <button
              className={styles.secondaryButton}
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