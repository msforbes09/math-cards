"use client";

import dynamic from "next/dynamic";

/**
 * The draw has to happen in the browser and nowhere else. "use client" does not
 * mean client-only - the component is still server-rendered first - so a random
 * draw inside it produces one set of problems on the server and a different set
 * on the client, which is a hydration mismatch. Loading the drill with
 * ssr: false is what actually keeps the draw off the server.
 */
const DrillRun = dynamic(
  () => import("./drill-run").then((module) => module.DrillRun),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-neutral-500" role="status">
        Shuffling the cards…
      </p>
    ),
  },
);

export function Practice() {
  return <DrillRun />;
}
