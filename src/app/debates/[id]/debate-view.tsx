"use client";

import { Dashboard } from "@/components/dashboard";
import type { DebateWithRelations } from "@/lib/types";

interface DebateViewProps {
  debate: DebateWithRelations;
}

export function DebateView({ debate }: DebateViewProps) {
  return <Dashboard debate={debate} />;
}
