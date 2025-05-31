import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Dashboard } from "@/components/dashboard";

export default async function DebatePage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Get debate with speakers and claims
  const { data: debate, error } = await supabase
    .from("debate")
    .select(
      `
      id,
      title,
      description,
      start_time,
      end_time,
      created_at,
      updated_at,
      speakers:speaker(id, name, role, debate_id, created_at, updated_at),
      claims:claim(
        id,
        text,
        timestamp,
        status,
        debate_id,
        speaker_id,
        created_at,
        updated_at,
        speaker:speaker(id, name, role, debate_id, created_at, updated_at),
        verdicts:verdict(id, verdict, confidence, sources, reasoning, evidence, claim_id, created_at, updated_at)
      )
    `
    )
    .eq("id", params.id)
    .single();

  if (error || !debate) {
    notFound();
  }

  // Sort claims by timestamp
  const sortedClaims = debate.claims?.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  ) || [];

  const debateWithRelations = {
    ...debate,
    claims: sortedClaims,
  } as any; // Type assertion to bypass complex nested type issues

  return <Dashboard debate={debateWithRelations} />;
}
