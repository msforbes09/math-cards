import Link from "next/link";
import { SESSION_LENGTH } from "@/src/domain/session";

export default function HomePage() {
  return (
    <section className="flex max-w-md flex-col items-center gap-8 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Math Cards</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          {SESSION_LENGTH} multiplication cards, one at a time. Type the answer
          and press Enter.
        </p>
      </div>

      <Link
        href="/practice"
        className="rounded-md bg-neutral-900 px-6 py-3 text-lg font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        Start practising
      </Link>

      <Link href="/history" className="text-sm underline underline-offset-4">
        See past sessions
      </Link>
    </section>
  );
}
