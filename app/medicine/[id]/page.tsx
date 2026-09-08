import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MedicineForm, { type Medicine, type MedicineCost } from "../MedicineForm";

export default async function MedicineDetailPage({
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
    .select("role, farm_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");
  if (!profile.farm_id) redirect("/medicine");

  const { data: medicine } = await supabase
    .from("medicine_inventory")
    .select(
      "id, name, type, treats_conditions, stock_qty, unit, expiry_date, restock_threshold"
    )
    .eq("id", id)
    .eq("farm_id", profile.farm_id)
    .single();

  if (!medicine) notFound();

  // Only the owner role reads medicine_costs — a worker session never
  // issues this query.
  let cost: MedicineCost | null = null;
  if (profile.role === "owner") {
    const { data } = await supabase
      .from("medicine_costs")
      .select("cost, supplier")
      .eq("medicine_id", id)
      .maybeSingle();
    cost = data ?? null;
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <Link
          href="/medicine"
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          &larr; All medicine
        </Link>
        <h1 style={{ color: "var(--forest)", margin: "8px 0 0" }}>
          {medicine.name}
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>
          {medicine.type} · {medicine.stock_qty} {medicine.unit} in stock
        </p>
      </header>

      <MedicineForm
        farmId={profile.farm_id}
        role={profile.role}
        medicine={medicine as Medicine}
        cost={cost}
      />
    </main>
  );
}
