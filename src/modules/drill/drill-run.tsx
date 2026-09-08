"use client";

import { useState } from "react";
import { generateSession } from "@/src/domain/problem";
import { SESSION_LENGTH } from "@/src/domain/session";
import { DrillScreen } from "./drill-screen";

export function DrillRun() {
  const [problems] = useState(() =>
    generateSession(SESSION_LENGTH, Math.random),
  );
  return <DrillScreen problems={problems} />;
}
