const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  LevelFormat, TableOfContents, PageBreak,
} = require("docx");

const FOREST = "2C5F2D";
const TERRA = "C97B2E";
const MUTED = "6B7566";
const HEADFILL = "EEF3E9";
const MONO = "Consolas";

const TW = 9020; // table width (A4, 1in margins)

// ---------- helpers ----------
const p = (text, opts = {}) =>
  new Paragraph({ spacing: { after: 120 }, ...opts, children: [new TextRun({ text, ...(opts.run || {}) })] });

const rich = (runs, opts = {}) =>
  new Paragraph({ spacing: { after: 120 }, ...opts, children: runs });

const t = (text, o = {}) => new TextRun({ text, ...o });
const code = (text) => new TextRun({ text, font: MONO, size: 20 });

const h1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 } });
const h2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 100 } });

const bullet = (children) =>
  new Paragraph({
    numbering: { reference: "bul", level: 0 },
    spacing: { after: 80 },
    children: Array.isArray(children) ? children : [new TextRun({ text: String(children) })],
  });

const cell = (children, { w, head = false, mono = false } = {}) =>
  new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, fill: HEADFILL, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: (Array.isArray(children) ? children : [children]).map((c) =>
      typeof c === "string"
        ? new Paragraph({
            spacing: { after: 0 },
            children: [new TextRun({ text: c, bold: head, font: mono ? MONO : undefined, size: mono ? 20 : 22 })],
          })
        : c
    ),
  });

const table = (widths, rows) =>
  new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "D6D6D6" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "D6D6D6" },
    },
    rows: rows.map(
      (r, i) =>
        new TableRow({
          tableHeader: i === 0,
          children: r.map((c) =>
            cell(c.text, { w: c.w, head: i === 0 || c.head, mono: c.mono })
          ),
        })
    ),
  });

const rule = () =>
  new Paragraph({
    spacing: { before: 60, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "C9D4C0" } },
    children: [],
  });

// ---------- content ----------
const children = [];

children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "UBULIMI", bold: true, size: 52, color: FOREST })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: "V1 (Phase 1) — Release Notes", size: 28, color: MUTED })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: "Livestock management for South African smallholder farmers", italics: true, size: 20, color: MUTED })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "V1 + follow-ups · 10 September 2026 · main @ 4e05204", size: 18, color: MUTED })],
  }),
  rule()
);

children.push(
  new Paragraph({ text: "Contents", heading: HeadingLevel.HEADING_1, spacing: { after: 120 } }),
  new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] })
);

// 1. Overview
children.push(h1("1. Overview"));
children.push(
  p("Ubulimi is a web application that helps South African smallholder farmers keep records for a livestock operation: the animals on the farm, the medicine and feed in the store, the health events and treatments, the vaccination schedule, feeding by camp, and animal sales. It is built for two roles on a single farm — an owner, who sees the full picture and the money, and a worker, who is given a focused daily task list.")
);
children.push(
  p("V1 delivers the first working version of every core record-keeping area — nine build increments on top of the starter project (authentication, the database schema, and the two role-based landing pages already existed). Follow-up work since then — a Financials report, sale-integrity guards, grouped navigation, millilitre-based treatment dosing, label dosage reference data, and a health-event detail page — is described in sections 3.9 to 3.11; this document has been updated to include it.")
);
children.push(h2("Technology"));
children.push(bullet([t("Frontend / server: ", { bold: true }), t("Next.js 16.3.4 (App Router), React 19, TypeScript. Plain CSS with a fixed colour palette — no UI component library. @react-pdf/renderer for the client-side PDF reports (animal history, financials).")]));
children.push(bullet([t("Backend: ", { bold: true }), t("Supabase — PostgreSQL, Auth (email + password), and Row-Level Security. Server and browser access through @supabase/ssr.")]));
children.push(bullet([t("Hosting: ", { bold: true }), t("Vercel, auto-deploying from the main branch. Live at ubulimi.vercel.app.")]));
children.push(bullet([t("Data integrity: ", { bold: true }), t("stock changes that must not partially apply are done in SECURITY DEFINER PostgreSQL functions called with supabase.rpc(), never as separate client writes.")]));

// 2. Release summary
children.push(h1("2. Release summary"));
children.push(
  table(
    [2500, 6520],
    [
      [{ text: "Item", w: 2500 }, { text: "Detail", w: 6520 }],
      [{ text: "Version", w: 2500 }, { text: "V1 — Phase 1 feature-complete (offline support excepted)", w: 6520 }],
      [{ text: "Release date", w: 2500 }, { text: "9 September 2026 (this document updated 10 September)", w: 6520 }],
      [{ text: "Repository", w: 2500 }, { text: "github.com/hlongstibos/ubulimi (branch main, tip 4e05204)", w: 6520 }],
      [{ text: "Production URL", w: 2500 }, { text: "https://ubulimi.vercel.app (live, HTTP 200; auto-deploys on push)", w: 6520 }],
      [{ text: "Commits", w: 2500 }, { text: "30 (9ab30fa … 4e05204) — 9 for V1, 21 follow-ups", w: 6520 }],
      [{ text: "DB migrations", w: 2500 }, { text: "0002 – 0008 — all applied to the live database (checked by API probe)", w: 6520 }],
      [{ text: "Routes", w: 2500 }, { text: "18 (see section 4)", w: 6520 }],
      [{ text: "Build status", w: 2500 }, { text: "npm run build passes; all routes compile; TypeScript clean", w: 6520 }],
    ]
  )
);

// 3. Features
children.push(h1("3. Features in this release"));

children.push(h2("3.1  Authentication and roles"));
children.push(p("Carried over from the starter and unchanged in behaviour, included here for context:"));
children.push(bullet("Email + password sign-in via Supabase Auth. No self-service sign-up — each pilot farm is provisioned by hand (auth users plus farms and profiles rows)."));
children.push(bullet([t("After login, "), code("/"), t(" reads the profile role and redirects: owner to "), code("/dashboard"), t(", worker to "), code("/today"), t(".")]));
children.push(bullet([t("The "), code("middleware.ts"), t(" (proxy) revalidates the session on every request and redirects unauthenticated traffic to "), code("/login"), t(".")]));

children.push(h2("3.2  Animal registry and camps"));
children.push(bullet([code("/camps"), t(" — list the farm's camps and add one by name.")]));
children.push(bullet([code("/animals"), t(" — table of every animal (tag, species, breed, camp, status) with an add form: tag ID, species, breed, date of birth, sex, camp (dropdown), and the optional last-mating and expected-birth dates.")]));
children.push(bullet([code("/animals/[id]"), t(" — a full editable detail view, including status (active / sold / deceased / culled).")]));
children.push(bullet([t("A duplicate tag on the same farm shows a friendly inline message (“An animal with tag ID … already exists on this farm”) instead of a raw database error.")]));
children.push(bullet("Both roles have full access, backed by the existing per-farm RLS policy."));

children.push(h2("3.3  Medicine inventory"));
children.push(bullet([code("/medicine"), t(" and "), code("/medicine/[id]"), t(" — CRUD for the medicine store: name, type (treatment / vaccine), the conditions it treats, stock quantity and unit, expiry date, and restock threshold.")]));
children.push(bullet([t("“Treats conditions” is a chip input — type a condition and press Enter (or comma), and it becomes a tag. A pasted delimited string is split into separate chips.")]));
children.push(bullet([t("Cost and supplier live in a separate "), code("medicine_costs"), t(" table and are "), t("owner-only", { bold: true }), t(": the fields are not rendered for a worker, and a worker session never fetches or writes that table.")]));
children.push(bullet("The add/edit form guards against a double-submit creating two rows."));

children.push(h2("3.4  Health event logging"));
children.push(bullet([code("/log-event"), t(" — reachable from a prominent button on the worker task list. Pick an animal by searching its tag, tag one or more free-text symptoms, add notes.")]));
children.push(bullet([t("As symptoms are chosen, the app queries the medicine store for items whose “treats conditions” overlap the selected symptoms and that have stock, and shows each match with the symptoms it matched and the stock remaining.")]));
children.push(bullet([t("Saving always creates a "), code("health_events"), t(" row. If the user also confirms a treatment against a suggestion (dosage + quantity), that additionally records the treatment and decrements medicine stock — atomically, via "), code("administer_treatment()"), t(" (see section 6).")]));

children.push(h2("3.5  Vaccinations"));
children.push(bullet([code("/vaccination-types"), t(" and "), code("/vaccination-types/[id]"), t(" — "), t("owner-only", { bold: true }), t(" setup screen (workers are redirected): name, target species, linked medicine, initial-dose age in days, booster interval in days.")]));
children.push(bullet([code("/log-vaccination"), t(" — pick an animal, then a vaccination type filtered to that animal's species. If the type has a linked medicine, enter the doses to deduct. Recorded through "), code("administer_vaccination()"), t(", which also sets the next-due date and decrements the linked medicine's stock.")]));
children.push(bullet([t("A due & overdue list ("), code("vaccinations_due"), t(" view) appears on both the owner dashboard and the worker task list. An animal is listed when it has never had a type that applies to its species and is old enough for the initial dose, or when its most recent record's next-due date is within 7 days or already past. Rows are colour-coded (urgent in terracotta) and link straight to the logging screen.")]));
children.push(bullet([t("The owner dashboard shows a “Vaccinations due this week” count.")]));

children.push(h2("3.6  Feed inventory and feeding log"));
children.push(bullet([code("/feed"), t(" and "), code("/feed/[id]"), t(" — CRUD for the feed store: name, type (roughage, concentrate, or the three lick categories), stock and unit, cost, restock threshold. No fields are hidden by role.")]));
children.push(bullet([code("/log-feeding"), t(" — "), t("scoped to a camp, not an animal", { bold: true }), t(": choose a camp, choose a feed, enter a quantity. Recorded through "), code("log_feeding_event()"), t(", which decrements feed stock and writes the "), code("feeding_events"), t(" row together.")]));

children.push(h2("3.7  Animal history and sales"));
children.push(bullet([code("/animals/[id]"), t(" now shows a chronological History section — health events, treatments (with medicine name) and vaccination records (with type name) merged and sorted newest first.")]));
children.push(bullet([t("“Record Sale” is "), t("owner-only", { bold: true }), t(" — the button is not shown to a worker, and the "), code("sales_owner_only"), t(" RLS policy is the real backstop. Fields: buyer, price, sale date.")]));
children.push(bullet([t("On save, the app reads the animal's complete health / treatment / vaccination history and stores it as a JSON snapshot in "), code("sales.history_snapshot"), t(", so the sale record stays accurate even if those rows change later. If the history read fails, no sale is written.")]));
children.push(bullet("Recorded sales for the animal are listed above the form."));

children.push(h2("3.8  Dashboards and worker task list"));
children.push(bullet([t("Owner dashboard: KPI cards (animals on farm, open health events, low-stock medicines, vaccinations due this week), the vaccinations-due list, and recent activity.")]));
children.push(bullet([t("The low-stock card now compares each medicine's stock against "), t("its own restock threshold", { bold: true }), t(", replacing the placeholder “fewer than 5” check.")]));
children.push(bullet([t("Worker "), code("/today"), t(" is now a task list: a prominent “Log a health event” button, then due & overdue vaccinations, then recent activity.")]));

children.push(h2("3.9  Follow-up changes (post-V1)"));
children.push(bullet([t("Persistent home link. ", { bold: true }), t("A sticky top bar (the UBULIMI wordmark, linking to “/”) is rendered once in the root layout, so every authenticated screen has a one-tap route home. Hidden on the login screen.")]));
children.push(bullet([t("Record Sale is now atomic and marks the animal sold. ", { bold: true }), t("Migration 0005 adds record_sale(p_animal_id, p_buyer, p_price, p_sale_date, p_history_snapshot), a SECURITY DEFINER function that inserts the sale and sets animals.status = 'sold' in one transaction. The Record Sale form calls it via supabase.rpc() instead of a plain insert. This closes the “sale does not change status” gap noted for V1.")]));
children.push(bullet([t("Sold animals are hidden from the logging pickers. ", { bold: true }), t("The animal search on /log-event and /log-vaccination excludes status = 'sold' — there is no reason to log a health event or vaccination against an animal that has been sold. (deceased / culled animals still appear.)")]));
children.push(bullet([t("Download Report (PDF). ", { bold: true }), t("A button in the History section of /animals/[id] generates a clean one-page A4 PDF entirely in the browser with @react-pdf/renderer — farm name, tag ID, species, breed, sex, date of birth, status, a Sale block when sold, and Vaccinations and Treatments tables. Intended to be handed to a buyer as proof of history. The library is code-split and loaded only when the button is pressed.")]));

children.push(h2("3.10  Further changes"));
children.push(bullet([t("Financials report (owner-only). ", { bold: true }), t("/financials turns the day-to-day logs into a money picture: net position (sales revenue minus tracked feed & medicine cost) for a chosen period — 30 / 90 / 365 days or all time — with KPI tiles and breakdowns: sales by species, feed used (exact, from feeding quantities), medicine & vaccination used (estimated at one unit per record, since per-dose quantities aren't stored), and current stock value on hand. A Download PDF button produces a one-page A4 report. Reads sales and medicine_costs, so it is owner-only at the route as well as by RLS.")]));
children.push(bullet([t("Sale integrity guards. ", { bold: true }), t("Migration 0006: record_sale() now refuses a second sale on the same animal and only sells an animal whose status is 'active'. A new void_sale(p_sale_id) function (owner-only) deletes a sale and sets the animal back to 'active' — the fix for a sale recorded on the wrong animal. The animal detail page shows the Record Sale form only for an active, unsold animal; a sold animal shows its sale with a Remove control (inline confirm), and a deceased / culled animal shows a note to fix the status first.")]));
children.push(bullet([t("Grouped navigation. ", { bold: true }), t("The in-page nav is now four dropdown menus (Log, Herd, Stock, Setup) plus a Financials pill instead of one long scrolling row — the owner sees five items on one line, the worker three. Menus close on outside click, route change or selection.")]));
children.push(bullet([t("Collapsible sections. ", { bold: true }), t("The vaccinations-due list and the recent-activity list on the dashboard and today view, and the full-history timeline on the animal page, are collapsed by default behind a card with a count badge — click to expand. The "), code("/medicine"), t(" and "), code("/feed"), t(" pages now lead with the inventory and keep the add form behind an “Add medicine” / “Add feed” disclosure, expanded automatically only when the store is still empty.")]));
children.push(bullet([t("One-tap demo login (optional). ", { bold: true }), t("When four NEXT_PUBLIC_DEMO_* env vars are set, the login screen shows Owner / Worker buttons that sign in without typing, using dedicated demo accounts. Hidden entirely when the vars are unset; no credentials are committed.")]));
children.push(bullet([t("Log out. ", { bold: true }), t("A Log out control in the app header on every authenticated screen (supabase.auth.signOut(), returns to /login).")]));
children.push(bullet([t("Visual pass + type-or-pick fields. ", { bold: true }), t("Tinted page background, white cards with a soft shadow, frosted sticky header, focus rings, consistent heading sizes. “Animals on farm” (dashboard) and the /animals list default to active only, with a status filter on the list. Species / breed (animal form), unit (medicine & feed forms) and buyer (sale form) are <datalist> inputs — pick from existing values or type a new one. The dashboard's redundant “Ubulimi” heading was removed (the header wordmark is the home link); the farm name is the page title.")]));

children.push(h2("3.11  Dosing and the health-event detail page"));
children.push(bullet([t("Millilitre treatment dosing. ", { bold: true }), t("Migration 0007: treatment doses are entered in ml. administer_treatment() now takes a single p_dose_ml (the old p_dosage + p_quantity signature is dropped) and deducts it from medicine stock, dividing by 1000 when the stock unit is litres; any other unit is 1:1. Adds treatments.dose_ml. The medicine form's unit list now leads with ml / L. Vaccinations-due list items link to /log-vaccination with the animal and vaccination type pre-selected.")]));
children.push(bullet([t("Label dosage reference data. ", { bold: true }), t("Migration 0008 adds medicine_inventory.label_dosage_instructions, dose_per_kg and dose_unit, plus animals.estimated_weight_kg (all nullable). The medicine form has a “Dosing — copy from the label” section whose copy is explicit that these are transcribed verbatim from the physical label or package insert, not estimated. The animal form has “Estimated weight (kg) — your estimate”, noted as a manual figure with no weight history in V1; it also shows on the animal detail header.")]));
children.push(bullet([t("Dosage guidance on medicine suggestions. ", { bold: true }), t("On every /log-event suggestion card: when the medicine has dose_per_kg + dose_unit and the animal has an estimated weight, a calculated line — “Suggested: {dose_per_kg × weight} {dose_unit} (from label × this animal’s estimated weight)”. The verbatim label instructions are always shown underneath so the number can be checked; if a value is missing the calculation is skipped and the missing field is prompted for (with a link). In every case a persistent, non-dismissible line: “Reference only — confirm with a vet or animal health technician before administering.”")]));
children.push(bullet([t("Health-event detail page (/health-events/[id]). ", { bold: true }), t("Clicking a health event — from the Recent activity list on the dashboard / today view, or a Health event row in the animal history timeline — opens a page showing its symptoms, notes and status (Open / “Open · being treated” when a treatment exists / Resolved) with a Mark resolved / Reopen toggle, the animal linked, the list of treatments recorded against it, and a Record a treatment form (medicine picker + the same dosage guidance + dose in ml) so a treatment can be added after the event is first logged.")]));

// 4. Routes
children.push(h1("4. Routes"));
const R = (r, a, pp) => [
  { text: r, w: 2600, mono: true }, { text: a, w: 1700 }, { text: pp, w: 4720 },
];
children.push(
  table(
    [2600, 1700, 4720],
    [
      [{ text: "Route", w: 2600 }, { text: "Access", w: 1700 }, { text: "Purpose", w: 4720 }],
      R("/login", "Public", "Email + password sign-in"),
      R("/", "Any signed-in", "Role redirect to /dashboard or /today"),
      R("/dashboard", "Owner", "KPI tiles, collapsible vaccinations-due + recent-activity"),
      R("/today", "Worker", "Task list: log-event button, collapsible vaccinations-due + recent-activity"),
      R("/animals", "Both", "Animal list (status filter) + add form"),
      R("/animals/[id]", "Both", "Edit animal + estimated weight; collapsible history (event rows linked); Download Report PDF; Sales with Record / Remove (owner)"),
      R("/financials", "Owner", "Net position, KPI tiles, breakdowns, Download PDF"),
      R("/health-events/[id]", "Both", "Event symptoms / notes / status, treatments given, record a treatment"),
      R("/camps", "Both", "Camp list + add"),
      R("/medicine", "Both", "Inventory first; collapsible add form (cost fields owner-only)"),
      R("/medicine/[id]", "Both", "Edit medicine (cost/supplier owner-only)"),
      R("/feed", "Both", "Inventory first; collapsible add form"),
      R("/feed/[id]", "Both", "Edit feed"),
      R("/log-event", "Both", "Health event + medicine suggestions + optional treatment"),
      R("/log-vaccination", "Both", "Animal + type → vaccination record"),
      R("/log-feeding", "Both", "Camp + feed + quantity"),
      R("/vaccination-types", "Owner", "Vaccination type setup list + add"),
      R("/vaccination-types/[id]", "Owner", "Edit vaccination type"),
    ]
  )
);

// 5. Database changes
children.push(h1("5. Database changes"));
children.push(p("Seven migrations are new since the base schema. They must be run once in the Supabase SQL Editor, in order. Migration 0001 (the base schema) was already applied. All seven below have been confirmed live in the project database (checked by API probe)."));
children.push(
  table(
    [2700, 6320],
    [
      [{ text: "Migration", w: 2700 }, { text: "What it adds", w: 6320 }],
      [
        { text: "0002_administer_treatment.sql", w: 2700, mono: true },
        { text: "administer_treatment(…) → uuid. SECURITY DEFINER. Decrements medicine_inventory.stock_qty and inserts the treatments row in one block; raises if the medicine is not on the caller's farm. Its signature is later changed by migration 0007.", w: 6320 },
      ],
      [
        { text: "0003_administer_vaccination.sql", w: 2700, mono: true },
        { text: "administer_vaccination(p_animal_id, p_vaccination_type_id, p_quantity default 1) → uuid. Looks up the booster interval and linked medicine from the type row, sets next_due_date = today + booster interval, decrements the linked medicine's stock (if any), and inserts the vaccination_records row — all in one block. Also creates the vaccinations_due view (security_invoker) used by the dashboards.", w: 6320 },
      ],
      [
        { text: "0004_log_feeding_event.sql", w: 2700, mono: true },
        { text: "log_feeding_event(p_camp_id, p_feed_id, p_quantity) → uuid. Verifies the camp belongs to the farm, decrements feed_inventory.stock_qty, and inserts the feeding_events row in one block.", w: 6320 },
      ],
      [
        { text: "0005_record_sale.sql", w: 2700, mono: true },
        { text: "record_sale(p_animal_id, p_buyer, p_price, p_sale_date, p_history_snapshot) → uuid. SECURITY DEFINER. Inserts the sales row and sets the animal's status to 'sold' in one transaction.", w: 6320 },
      ],
      [
        { text: "0006_sale_guards.sql", w: 2700, mono: true },
        { text: "Redefines record_sale() to raise if the animal isn't 'active' or already has a sale. Adds void_sale(p_sale_id) → void: owner-only; deletes a sale and sets the animal back to 'active'. Both fire the audit-log trigger.", w: 6320 },
      ],
      [
        { text: "0007_ml_dosing.sql", w: 2700, mono: true },
        { text: "Adds treatments.dose_ml. Drops the old administer_treatment(uuid,uuid,uuid,text,numeric) and recreates it as administer_treatment(p_animal_id, p_medicine_id, p_health_event_id, p_dose_ml): deducts the ml dose from medicine stock, /1000 when the unit is litres, 1:1 otherwise.", w: 6320 },
      ],
      [
        { text: "0008_medicine_dosage_fields.sql", w: 2700, mono: true },
        { text: "Additive, nullable: medicine_inventory.label_dosage_instructions (text), dose_per_kg (numeric), dose_unit (text); animals.estimated_weight_kg (numeric). No functions or existing data change.", w: 6320 },
      ],
    ]
  )
);
children.push(h2("vaccinations_due view logic"));
children.push(p("One row per active animal and applicable vaccination type that is due. A type applies to an animal when the animal's species is listed in the type's target species (an empty target-species list applies to no animal). A pair is due when:"));
children.push(bullet("the animal has no record for that type, and the type sets no minimum age, or the animal's date of birth is at least the initial-dose age in the past; OR"));
children.push(bullet("the most recent record for that pair has a next-due date within 7 days or already past."));
children.push(p("The view uses security_invoker, so each caller's row-level security scopes it to their own farm automatically."));

// 6. Atomic operations
children.push(h1("6. Atomic operations and data integrity"));
children.push(p("Any action that writes a log row alongside another change — a stock level or an animal status — is done inside a single PostgreSQL function, invoked with supabase.rpc(). The client never adjusts a stock quantity directly. This is the same pattern in every case:"));
children.push(bullet([code("administer_treatment"), t(" — treatments row + medicine stock")]));
children.push(bullet([code("administer_vaccination"), t(" — vaccination_records row + linked-medicine stock + next-due date")]));
children.push(bullet([code("log_feeding_event"), t(" — feeding_events row + feed stock")]));
children.push(bullet([code("record_sale"), t(" — sales row + animals.status set to 'sold' (refuses a non-active animal or a second sale)")]));
children.push(bullet([code("void_sale"), t(" — deletes a sale row + animals.status back to 'active' (owner-only)")]));
children.push(p("Each function runs as SECURITY DEFINER and resolves the caller's farm with current_farm_id(). The stock-decrementing functions raise a clear error (rather than writing a partial result) if a referenced record is not on that farm. The health-event insert is deliberately kept separate from its optional treatment, so a failed treatment never loses the health record."));
children.push(p("An audit-log trigger (from the base schema) records every insert, update and delete on animals, health events, treatments, vaccination records and sales."));

// 7. Security
children.push(h1("7. Security model"));
children.push(bullet("Every table is row-level-security protected and scoped to the caller's farm via current_farm_id()."));
children.push(bullet([t("Owner-only at the database: "), code("sales"), t(", "), code("medicine_costs"), t(", and the "), code("audit_log"), t(" read, all gated by current_role() = 'owner'.")]));
children.push(bullet([t("Owner-only in the UI, with RLS as the backstop: the "), code("/dashboard"), t(", "), code("/vaccination-types"), t(" and "), code("/financials"), t(" routes redirect workers; medicine cost/supplier fields are not rendered or fetched for workers; the Record Sale form and the Financials nav item are not rendered for workers.")]));
children.push(bullet("No self-service registration; farms and their owner/worker profiles are created by an administrator."));
children.push(bullet([t("Supabase credentials are the publishable key only (safe for the browser); no service-role key is used in the app. They are supplied as "), code("NEXT_PUBLIC_SUPABASE_URL"), t(" and "), code("NEXT_PUBLIC_SUPABASE_ANON_KEY"), t(".")]));

// 8. Known limitations
children.push(h1("8. Known limitations and deferred work"));
children.push(h2("Deferred"));
children.push(bullet([t("Offline support. ", { bold: true }), t("An IndexedDB queue for the health-event form was built and then withdrawn: the auth middleware revalidates the session over the network on every request, so any navigation while offline redirects to the login page. Usable offline behaviour needs the middleware to fall back to the stored session cookie plus caching of the page shell. Tracked as a follow-up; nothing offline-related ships in V1.")]));
children.push(h2("Behavioural notes"));
children.push(bullet("Vaccination applicability is an exact species-string match. “Cattle” does not match “cattle”, and a type with no target species set never applies to anything."));
children.push(bullet("The Download Report PDF covers identity, vaccinations, treatments and sale — not the free-text health-event notes. The on-screen History timeline still shows those."));
children.push(bullet("Financials: sales revenue and feed cost are exact; medicine & vaccination cost is estimated at one unit / dose per record; labour, transport and other overheads are not tracked. Items with no cost captured count as R 0."));
children.push(bullet("void_sale hard-deletes the sale row (the audit log records the deletion). There is no “voided” flag or soft-delete."));
children.push(bullet("Medicine suggestions on the health-event form likewise need the symptom tag to exactly match a stored “treats condition” string. There is no fuzzy matching."));
children.push(bullet("The animal history timeline is not paginated — fine for pilot volumes, revisit if an animal accumulates hundreds of events."));
children.push(h2("Inherited from the starter project"));
children.push(bullet([t("The "), code("npm run lint"), t(" script is broken ("), code("next lint"), t(" was removed in Next.js 16). The build-time TypeScript check still runs.")]));
children.push(bullet([code("middleware.ts"), t(" uses the file convention Next.js 16 has deprecated in favour of "), code("proxy.ts"), t(". It works and only emits a warning.")]));

// 9. Deployment
children.push(h1("9. Deployment and operator checklist"));
children.push(bullet([t("1.  Apply migrations "), code("0002"), t(" through "), code("0008"), t(" in the Supabase SQL Editor, in order. Run 0007 together with the matching frontend deploy — it changes the administer_treatment signature.  "), t("[done — all seven confirmed live]", { color: FOREST })]));
children.push(bullet([t("2.  Set "), code("NEXT_PUBLIC_SUPABASE_URL"), t(" and "), code("NEXT_PUBLIC_SUPABASE_ANON_KEY"), t(" in the Vercel project (all environments).  "), t("[done]", { color: FOREST })]));
children.push(bullet("3.  Provision each pilot farm by hand: create the owner and worker auth users (Auto Confirm on), then insert the farms row and the two profiles rows linking those users to it with roles owner and worker (README, step 5)."));
children.push(bullet([t("4.  Optional — demo mode: create dedicated demo auth users, and set "), code("NEXT_PUBLIC_DEMO_OWNER_EMAIL / _PASSWORD"), t(" and "), code("NEXT_PUBLIC_DEMO_WORKER_EMAIL / _PASSWORD"), t(" in Vercel to show the one-tap Owner / Worker buttons on the login screen. Point them at throwaway accounts — NEXT_PUBLIC values are readable in the browser bundle.")]));
children.push(bullet("5.  Deploy: push to main; Vercel builds and promotes automatically. Current production build is green."));
children.push(bullet("6.  Smoke test on the live URL: sign in (or use a demo button), check the dashboard counts, open an animal (history populates), run /log-event (a matching medicine is suggested), open /financials."));

// 10. Commit history
children.push(h1("10. Commit history"));
const C = (sha, msg) => [{ text: sha, w: 1400, mono: true }, { text: msg, w: 7620 }];
children.push(
  table(
    [1400, 7620],
    [
      [{ text: "Commit", w: 1400 }, { text: "Summary", w: 7620 }],
      C("4e05204", "Collapse the add-stock form on /medicine and /feed behind an “Add” disclosure; show the inventory first (open by default only when empty)"),
      C("3998f15", "Add a health-event detail page (/health-events/[id]) with treatments list + record-a-treatment; link from Recent activity and the timeline; extract DosageGuidance"),
      C("f676129", "Show label-based dosage guidance on each medicine suggestion (calc, verbatim label text, vet disclaimer)"),
      C("a6d2a24", "Label estimated_weight_kg as a manual estimate; show it on the animal detail header"),
      C("279376b", "Medicine dosing section copy: transcribed reference data, not a guess"),
      C("6319229", "Wire the 0008 dosage fields into the medicine and animal forms"),
      C("c8d6c6f", "Add migration 0008: medicine dosage reference fields + animal estimated_weight_kg"),
      C("0ea2e0d", "Millilitre treatment dosing (migration 0007) + pre-fill the vaccination form from the due list"),
      C("9564e89", "void_sale: null-safe owner check (is distinct from)"),
      C("222a1f9", "Guard sales: one per animal, active-only, with a void_sale path (migration 0006)"),
      C("e038f1a", "Group the nav into function dropdown menus instead of a long scrolling row"),
      C("151794d", "Add a Financials report (owner-only) with period filter and PDF export"),
      C("2fad6a9", "Polish UI; active-only animal count; type-or-pick fields (datalists); collapse recent activity; drop the dashboard Ubulimi heading"),
      C("2846b53", "Add a Log out button to the app header"),
      C("dff35ec", "Collapse the vaccinations-due list behind a click on both views"),
      C("4dc70ba", "Add optional one-tap demo login (owner / worker) to the login screen"),
      C("e1d3e29", "Add a Download Report PDF on the animal history page (@react-pdf/renderer, client-side, code-split)"),
      C("f5a2cc3", "Exclude sold animals from the health-event and vaccination pickers"),
      C("d24aa0b", "Wire RecordSaleForm to the record_sale() rpc (also marks the animal sold)"),
      C("08ea502", "Add the record_sale() migration (0005)"),
      C("a54c1ab", "Add a persistent home link (sticky header) to every authenticated screen"),
      C("0232c69", "Clean up Sprint 0 placeholders — real restock-threshold low-stock check, “vaccinations due this week” card, worker today page reworked as a task list, due cards link to logging"),
      C("9bdd2d7", "Add animal history timeline and owner-only Record Sale (history_snapshot JSON capture)"),
      C("d6ad83d", "Add feed inventory and a camp-scoped feeding log (log_feeding_event)"),
      C("12e2673", "Add vaccination types, vaccination logging, and a due/overdue list (administer_vaccination, vaccinations_due)"),
      C("7cfbb12", "Add health event logging with medicine suggestions (/log-event, administer_treatment)"),
      C("42d5dc2", "Harden the medicine form against duplicate / malformed entries"),
      C("ea103b9", "Add medicine inventory (/medicine) with owner-only cost fields"),
      C("91c9103", "Add animal registry (camps + animals CRUD)"),
      C("9ab30fa", "Replace the scaffold with the Ubulimi V1 starter (Supabase auth + schema + two role views)"),
    ]
  )
);

// 11. Verification
children.push(h1("11. Verification status"));
children.push(bullet([t("Verified (10 Sep 2026): ", { bold: true }), code("npm run build"), t(" passes with a clean TypeScript check and no warnings; "), code("npm audit"), t(" reports 0 vulnerabilities; the five RPC functions (administer_treatment with the new p_dose_ml signature, administer_vaccination, log_feeding_event, record_sale, void_sale), the vaccinations_due view, and the 0008 columns are live in the project database (API probe); ubulimi.vercel.app returns HTTP 200; git main is level with origin.")]));
children.push(bullet([t("Tested live on production (demo Owner / Worker on ubulimi.vercel.app): ", { bold: true }), t("grouped nav; Financials period switching + PDF; a feeding decrements feed stock; Remove sale (void_sale) deletes the sale and reactivates the animal, then a fresh sale re-marks it sold; a deceased / culled animal shows the “fix status first” note; a treatment dose of 500 ml against a medicine held in litres reduces stock by 0.5 L (1:1 when held in ml); the vaccinations-due link pre-selects animal + type; the dosage suggestion computes dose_per_kg × weight and always shows the vet disclaimer; the health-event page opens from Recent activity and the timeline, lists treatments given, records a new one, and toggles resolved / reopen; on /medicine and /feed the add form stays collapsed until the “Add” disclosure is clicked, with the inventory shown first. Demo data restored where practical.")]));
children.push(bullet([t("Exercised by the product owner during development: ", { bold: true }), t("the authenticated end-to-end flows across every CRUD screen and logging flow.")]));
children.push(bullet([t("Not covered: ", { bold: true }), t("automated tests (there is no test suite); the actual file save of a generated PDF (generation path is verified, the browser save is silent in automation).")]));

children.push(h1("12. Testing from a phone"));
children.push(p("The app is a normal responsive web app served over HTTPS at https://ubulimi.vercel.app — there is nothing to install. To try it on a phone:"));
children.push(bullet([t("1.  Confirm the Vercel production deployment is on the latest commit ("), code("4e05204"), t(" or newer) — Vercel dashboard → Deployments. It auto-deploys on push.")]));
children.push(bullet("2.  Sign in with either a real owner / worker login (email + password), or — if demo mode is configured — the one-tap Owner / Worker buttons on the login screen (no password needed)."));
children.push(bullet([t("3.  On the phone browser, open "), code("https://ubulimi.vercel.app"), t(", and work through: dashboard / today, the grouped nav menus, add an animal (type-or-pick species / breed), log a health event / vaccination / feeding, record and then remove a sale, open /financials and Download PDF, open an animal and Download Report.")]));
children.push(bullet("4.  Optionally add it to the home screen (Share → Add to Home Screen) for an app-like launch. It is not an installable PWA — no service worker or manifest — so it still needs a connection, and there is no offline mode."));
children.push(bullet("5.  Mobile notes: the nav is now grouped menus (no sideways scroll); the wide inventory / financials tables scroll inside their own container; the sticky header, the “Log a health event” button and the dropdown menus should sit comfortably; PDF buttons use the browser's normal download handling."));

// ---------- document ----------
const doc = new Document({
  creator: "Ubulimi",
  title: "Ubulimi V1 Release Notes",
  description: "Phase 1 release notes",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { line: 288 } } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: FOREST }, paragraph: { spacing: { before: 320, after: 140 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, color: "3D5236" }, paragraph: { spacing: { before: 220, after: 100 } } },
    ],
  },
  numbering: {
    config: [
      { reference: "bul", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 260 } } } },
      ] },
    ],
  },
  sections: [
    {
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("Ubulimi-V1-Release-Notes.docx", buf);
  console.log("wrote Ubulimi-V1-Release-Notes.docx", buf.length, "bytes");
});
