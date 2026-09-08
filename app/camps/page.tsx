import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddCampForm from "./AddCampForm";

export default async function CampsPage() {
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

  const { data: camps } = profile.farm_id
    ? await supabase
        .from("camps")
        .select("id, name")
        .eq("farm_id", profile.farm_id)
        .order("name")
    : { data: null };

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <Link
          href="/animals"
          style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}
        >
          &larr; Animals
        </Link>
        <h1 style={{ color: "var(--forest)", margin: "8px 0 0" }}>Camps</h1>
      </header>

      {!profile.farm_id ? (
        <p style={{ color: "var(--text-muted)" }}>
          Your profile isn&rsquo;t linked to a farm yet.
        </p>
      ) : (
        <>
          <AddCampForm farmId={profile.farm_id} />

          <section style={{ marginTop: 28 }}>
            {!camps || camps.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No camps yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {camps.map((c) => (
                  <li
                    key={c.id}
                    style={{
                      border: "1px solid var(--card-border)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 8,
                    }}
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
