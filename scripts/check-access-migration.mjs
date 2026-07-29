/**
 * Validates an access migration before it is run by hand in the SQL Editor.
 *
 * Checks that every UPDATE has parseable JSON, carries a sourceUrl, targets a
 * slug that exists, populates at least one field the quality gate counts, and
 * does not quote bag or size limits.
 *
 *   node scripts/check-access-migration.mjs supabase/migrations/<file>.sql
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = loadEnv("production", root, "");
const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/check-access-migration.mjs <file.sql>");
  process.exit(1);
}

const sql = fs.readFileSync(file, "utf8");
const headers = {
  apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
};
const spots = await (
  await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/spots?select=slug`, { headers })
).json();
const known = new Set(spots.map((s) => s.slug));

// Each statement: SET access = '<json>'::jsonb ... WHERE slug = '<slug>';
const re =
  /SET access = '([\s\S]*?)'::jsonb[\s\S]*?WHERE slug = '([a-z0-9-]+)';/g;

// The quality gate counts these; a record with none of them scores nothing.
const GATE_FIELDS = ["ramp", "parking", "walkIn", "facilities", "notes"];
// Rule 3: no specific bag or size numbers.
const LIMIT_PATTERN =
  /\b\d+\s*(fish|salmon|trout|per (?:day|angler|rod|person)|bag limit)|\bbag limit\b|\bsize limit of\b/i;

let count = 0;
let bad = 0;
const seen = new Set();

for (const [, raw, slug] of sql.matchAll(re)) {
  count++;
  const label = `${slug}`;
  // SQL doubles single quotes; undo that to recover the JSON literal.
  const json = raw.replace(/''/g, "'");

  let obj;
  try {
    obj = JSON.parse(json);
  } catch (e) {
    console.error(`FAIL ${label}: JSON does not parse — ${e.message}`);
    bad++;
    continue;
  }

  if (!known.has(slug)) {
    console.error(`FAIL ${label}: slug not present in spots table`);
    bad++;
  }
  if (seen.has(slug)) {
    console.error(`FAIL ${label}: duplicate UPDATE for this slug`);
    bad++;
  }
  seen.add(slug);

  if (!obj.sourceUrl) {
    console.error(`FAIL ${label}: no sourceUrl (rule 2)`);
    bad++;
  } else if (!/^https:\/\//.test(obj.sourceUrl)) {
    console.error(`FAIL ${label}: sourceUrl is not https`);
    bad++;
  }

  if (!GATE_FIELDS.some((f) => obj[f])) {
    console.error(
      `FAIL ${label}: none of ${GATE_FIELDS.join("/")} set — scores 0 on the gate`
    );
    bad++;
  }

  const m = LIMIT_PATTERN.exec(obj.notes || "");
  if (m) {
    console.error(`WARN ${label}: looks like a bag/size limit — "${m[0]}"`);
  }

  const unknown = Object.keys(obj).filter(
    (k) =>
      ![
        "shore",
        "boat",
        "ramp",
        "parking",
        "walkIn",
        "facilities",
        "notes",
        "sourceUrl",
      ].includes(k)
  );
  if (unknown.length) {
    console.error(`WARN ${label}: unexpected field(s) ${unknown.join(", ")}`);
  }
}

console.log(`\n${count} statement(s) checked, ${bad} failure(s).`);
process.exit(bad ? 1 : 0);
