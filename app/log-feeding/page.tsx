import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogFeedingForm from "./LogFeedingForm";

export default async function LogFeedingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, farm_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const home = profile.role === "owner" ? "/dashboard" : "/today";

  if (!profile.farm_id) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ color: "var(--forest)" }}>Log feeding</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      </main>
    );
  }

  const [{ data: camps }, { data: feeds }] = await Promise.all([
    supabase
      .from("camps")
      .select("id, name")
      .eq("farm_id", profile.farm_id)
      .order("name"),
    supabase
      .from("feed_inventory")
      .select("id, name, stock_qty, unit")
      .eq("farm_id", profile.farm_id)
      .order("name"),
  ]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <Link
          href={home}
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          &larr; Back
        </Link>
        <h1 style={{ color: "var(--forest)", margin: "8px 0 0" }}>Log feeding</h1>
      </header>

      <LogFeedingForm camps={camps ?? []} feeds={feeds ?? []} home={home} />
    </main>
  );
}
