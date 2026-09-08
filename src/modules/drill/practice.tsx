"use client";

import { useState } from "react";
import { generateSession } from "@/src/domain/problem";
import { SESSION_LENGTH } from "@/src/domain/session";
import { DrillScreen } from "./drill-screen";

/** Problems are drawn in the browser, not on the server: a server-side draw
 *  would differ from the client's and break hydration. */
export function Practice() {
  const [problems] = useState(() =>
    generateSession(SESSION_LENGTH, Math.random),
  );
  return <DrillScreen problems={problems} />;
}
