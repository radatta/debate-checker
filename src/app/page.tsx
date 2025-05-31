import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

type DebateWithRelations = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  speakers: { id: string; name: string; role: string | null }[];
  claims_count: number;
};

async function DebateList() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // First get debates with speakers
  const { data: debates, error } = await supabase
    .from("debate")
    .select(
      `
      id,
      title,
      description,
      start_time,
      speakers:speaker(id, name, role)
    `
    )
    .order("start_time", { ascending: false });

  if (error) {
    console.error("Error fetching debates:", error);
    return <div>Error loading debates</div>;
  }

  // Get claims count for each debate
  const debatesWithCounts = await Promise.all(
    debates?.map(async (debate) => {
      const { count } = await supabase
        .from("claim")
        .select("*", { count: "exact", head: true })
        .eq("debate_id", debate.id);

      return {
        ...debate,
        claims_count: count || 0,
      };
    }) || []
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {debatesWithCounts?.map((debate) => (
        <Link
          key={debate.id}
          href={`/debates/${debate.id}`}
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">{debate.title}</h2>
          <p className="text-gray-600 mb-4">{debate.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {debate.speakers?.map((speaker) => (
              <span
                key={speaker.id}
                className="px-2 py-1 bg-gray-100 rounded-full text-sm"
              >
                {speaker.name}
              </span>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{formatDate(debate.start_time)}</span>
            <span>{debate.claims_count} claims</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Debate Fact Checker</h1>
        <Button asChild>
          <Link href="/debates/new">New Debate</Link>
        </Button>
      </div>

      <Suspense fallback={<div>Loading debates...</div>}>
        <DebateList />
      </Suspense>
    </div>
  );
}
