/**
 * Adds products to public/products.json from a pasted list.
 *
 *   node scripts/add-products.mjs --category Haircare list.txt
 *   node scripts/add-products.mjs --category Haircare --write list.txt
 *
 * Reads stdin when no file is given. Dry run unless --write, because this
 * mutates committed data.
 *
 * Input is one product per line, tab- or pipe-separated, in the shape the
 * team already sends:
 *
 *   Never Thirsty Moisturizing Shampoo	!shampoo	https://go.elfcosmetics.com/shampoo
 *
 * The alias is optional and its leading `!` is ignored. Lines without a URL
 * are skipped, so a bare "HAIR" heading in a pasted block is harmless.
 *
 * Price and image come from each product page's JSON-LD, NOT from scraping the
 * markup. This matters: e.l.f. product pages carry cross-sell carousels, so
 * "first product image on the page" returns the same packshot for every
 * product, and a naive price grep can pick up a carousel item. JSON-LD is the
 * page's own product.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTS = join(root, "public/products.json");
const UA = "Mozilla/5.0 (compatible; elfyou-extension/1.0)";

// ---------------------------------------------------------------- args

const argv = process.argv.slice(2);
const write = argv.includes("--write");
const catIdx = argv.indexOf("--category");
const category = catIdx === -1 ? null : argv[catIdx + 1];
const file = argv.filter((a, i) => !a.startsWith("--") && i !== catIdx + 1)[0];

// Category labels come from the app's own source of truth.
const labels = [
  ...readFileSync(join(root, "src/utils/categories.ts"), "utf8").matchAll(
    /label:\s*"([^"]+)"/g,
  ),
].map(([, l]) => l);

const die = (msg) => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};

if (!category) die(`--category is required. One of: ${labels.join(", ")}`);
if (!labels.includes(category))
  die(`Unknown category "${category}". One of: ${labels.join(", ")}`);

// ---------------------------------------------------------------- input

// resolve(), not join() — the path may be absolute
let raw;
try {
  raw = file
    ? readFileSync(resolve(root, file), "utf8")
    : readFileSync(0, "utf8");
} catch (e) {
  die(
    `Could not read ${file ? resolve(root, file) : "stdin"}: ${e.code ?? e.message}`,
  );
}

const rows = raw
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && /https?:\/\//.test(l)) // drops headings and blanks
  .map((line) => {
    const parts = line
      .split(/\t+|\s*\|\s*/)
      .map((p) => p.trim())
      .filter(Boolean);
    const url = parts.find((p) => /^https?:\/\//.test(p));
    const rest = parts.filter((p) => p !== url);

    // The `!` is optional — the team's lists mix `!shampoo` and `glossmode`.
    // An explicit `!` wins; otherwise a second column is taken as the alias.
    const flagged = rest.find((p) => p.startsWith("!"));
    const alias = (flagged ?? (rest.length > 1 ? rest[1] : undefined))?.replace(
      /^!+/,
      "",
    );
    const name = rest.find((p) => p !== flagged && p !== alias) ?? rest[0];

    return { name, alias, url };
  });

if (!rows.length) die("No product lines found (each needs a URL).");

// ---------------------------------------------------------------- fetch

/** Pull the page's own Product node out of its JSON-LD. */
const productFromJsonLd = (html) => {
  const found = [];
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      if (n["@type"] === "Product") found.push(n);
      Object.values(n).forEach(walk);
    }
  };
  for (const [, block] of html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    try {
      walk(JSON.parse(block));
    } catch {
      /* a malformed block elsewhere on the page is not our problem */
    }
  }
  return found[0] ?? null;
};

const money = (v) => {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : null;
};

/** Match the sizing params the existing entries use. */
const sized = (url) => {
  const u = new URL(url);
  u.searchParams.set("width", "720");
  u.searchParams.set("height", "720");
  u.searchParams.set("crop", "center");
  return u.toString();
};

const ok = async (url) => {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    return r.status;
  } catch {
    return 0;
  }
};

const fetchProduct = async (row) => {
  const res = await fetch(row.url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
  });
  if (!res.ok) return { ...row, error: `page returned ${res.status}` };

  const ld = productFromJsonLd(await res.text());
  if (!ld) return { ...row, error: "no JSON-LD Product on the page" };

  const offer = [].concat(ld.offers ?? [])[0] ?? {};
  const price = money(offer.price ?? offer.lowPrice);
  const image = [].concat(ld.image ?? []).filter(Boolean)[0];

  if (!price) return { ...row, error: "no price in JSON-LD" };
  if (!image) return { ...row, error: "no image in JSON-LD" };

  return {
    ...row,
    name: row.name || ld.name,
    ldName: ld.name,
    price,
    image: sized(image),
    finalUrl: res.url,
  };
};

// ---------------------------------------------------------------- run

const products = JSON.parse(readFileSync(PRODUCTS, "utf8"));

/** Every command the existing catalogue already claims. */
const claimed = new Map();
for (const p of products)
  for (const a of [
    String(p.id),
    p.name.replace(/\s+/g, ""),
    ...(p.commands ?? []),
  ])
    claimed.set(a.toLowerCase().replace(/^!+/, ""), p);

console.log(`\n  ${rows.length} product(s), category ${category}\n`);

const resolved = await Promise.all(rows.map(fetchProduct));
const problems = [];

for (const r of resolved) {
  if (r.error) {
    problems.push(`${r.url} — ${r.error}`);
    continue;
  }

  const dupe = products.find((p) => p.buy_url === r.url);
  if (dupe) problems.push(`${r.name} — already present as id ${dupe.id}`);

  if (r.alias && claimed.has(r.alias))
    problems.push(
      `!${r.alias} (${r.name}) — already claimed by id ${claimed.get(r.alias).id}`,
    );

  const [imgStatus, buyStatus] = await Promise.all([ok(r.image), ok(r.url)]);
  if (imgStatus !== 200)
    problems.push(`${r.name} — image returned ${imgStatus}`);
  if (buyStatus !== 200)
    problems.push(`${r.name} — buy_url returned ${buyStatus}`);

  const sku = (r.image.match(/files\/(\d+)_/) ?? [, "?"])[1];
  console.log(`  ${r.name}`);
  console.log(
    `    price ${r.price}   sku ${sku}   ${r.alias ? "!" + r.alias : "(no alias)"}`,
  );
  if (r.ldName !== r.name) console.log(`    site name differs: "${r.ldName}"`);
  console.log(`    img ${imgStatus}  buy ${buyStatus}`);
}

// A distinct SKU per product is the check that the carousel trap didn't bite.
const skus = resolved
  .filter((r) => !r.error)
  .map((r) => (r.image.match(/files\/(\d+)_/) ?? [, null])[1]);
if (new Set(skus).size !== skus.length)
  problems.push(
    `duplicate image SKUs across this batch (${skus.join(", ")}) — likely a cross-sell carousel image, check the pages by hand`,
  );

if (problems.length) {
  console.error(`\n  Refusing to write — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`    • ${p}`);
  console.error("");
  process.exit(1);
}

// Nothing is appended unless the whole batch is clean, so a partial failure
// can't leave half a batch in the catalogue.
let id = Math.max(...products.map((p) => Number(p.id)));
const added = resolved.map((r) => ({
  id: String(++id),
  name: r.name,
  category,
  price: r.price,
  image_url: r.image,
  buy_url: r.url,
  ...(r.alias ? { commands: [r.alias] } : {}),
}));

if (!write) {
  console.log(`\n  Dry run — would add ids ${added[0].id}–${added.at(-1).id}.`);
  console.log("  Re-run with --write to apply.\n");
  process.exit(0);
}

writeFileSync(
  PRODUCTS,
  JSON.stringify([...products, ...added], null, 2) + "\n",
);
console.log(
  `\n  Added ${added.length} product(s), ids ${added[0].id}–${added.at(-1).id}.`,
);
console.log(
  "  Run `pnpm lint` (Prettier formats products.json) before committing.\n",
);
