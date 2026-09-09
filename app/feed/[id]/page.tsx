import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedForm, { type Feed } from "../FeedForm";

export default async function FeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("farm_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");
  if (!profile.farm_id) redirect("/feed");

  const { data: feed } = await supabase
    .from("feed_inventory")
    .select("id, name, type, stock_qty, unit, cost, restock_threshold")
    .eq("id", id)
    .eq("farm_id", profile.farm_id)
    .single();

  if (!feed) notFound();

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <Link
          href="/feed"
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          &larr; All feed
        </Link>
        <h1 style={{ color: "var(--forest)", margin: "8px 0 0" }}>{feed.name}</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
          {feed.type} · {feed.stock_qty} {feed.unit} in stock
        </p>
      </header>

      <FeedForm farmId={profile.farm_id} feed={feed as Feed} />
    </main>
  );
}
