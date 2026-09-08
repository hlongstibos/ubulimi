import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnimalForm, { type Animal } from "../AnimalForm";

export default async function AnimalDetailPage({
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
  if (!profile.farm_id) redirect("/animals");

  const [{ data: animal }, { data: camps }] = await Promise.all([
    supabase
      .from("animals")
      .select(
        "id, tag_id, species, breed, dob, sex, camp_id, status, last_mating_date, expected_birth_date"
      )
      .eq("id", id)
      .eq("farm_id", profile.farm_id)
      .single(),
    supabase
      .from("camps")
      .select("id, name")
      .eq("farm_id", profile.farm_id)
      .order("name"),
  ]);

  if (!animal) notFound();

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <Link
          href="/animals"
          style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}
        >
          &larr; All animals
        </Link>
        <h1 style={{ color: "var(--forest)", margin: "8px 0 0" }}>
          {animal.tag_id}
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
          {animal.species}
          {animal.breed ? ` · ${animal.breed}` : ""} · {animal.status}
        </p>
      </header>

      <AnimalForm
        farmId={profile.farm_id}
        camps={camps ?? []}
        animal={animal as Animal}
      />
    </main>
  );
}
