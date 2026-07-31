/**
 * Fails when src/styles/tailwind.css disagrees with brand/tokens.json.
 *
 * Three ways to fail:
 *   1. A palette token holds a value that is neither the brand value nor its
 *      declared accepted deviation.
 *   2. A semantic role points at a different palette token than declared.
 *   3. The stylesheet declares an --color-elfyou-* token that brand/tokens.json
 *      doesn't account for at all (catches new ad-hoc colours).
 *
 * Run via `pnpm lint:tokens`, which `pnpm lint` picks up automatically.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const spec = JSON.parse(readFileSync(join(root, "brand/tokens.json"), "utf8"));
const css = readFileSync(join(root, spec.stylesheet), "utf8");

/** `--color-<name>: #hex;` -> { name: hex } */
const declaredHex = Object.fromEntries(
  [...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)].map(
    ([, name, hex]) => [name, hex.toLowerCase()],
  ),
);

/** `--color-<role>: var(--color-<target>);` -> { role: target } */
const declaredRefs = Object.fromEntries(
  [...css.matchAll(/--color-([\w-]+):\s*var\(--color-([\w-]+)\)\s*;/g)].map(
    ([, role, target]) => [role, target],
  ),
);

const problems = [];
const isMeta = (key) => key.startsWith("$");

// 1. Palette values
for (const [name, { value, evidence }] of Object.entries(spec.brand)) {
  const deviation = spec.acceptedDeviations[name];
  const expected = (deviation?.shipped ?? value).toLowerCase();
  const actual = declaredHex[name];

  if (actual === undefined) {
    // Not an error on its own: the role map may legitimately not use it.
    continue;
  }
  if (actual !== expected) {
    problems.push(
      `--color-${name} is ${actual}, expected ${expected}\n` +
        (deviation
          ? `      accepted deviation from brand ${value} — ${deviation.reason}`
          : `      brand value, measured from: ${evidence}`),
    );
  }
}

// 1b. Derived tints must match their recorded value exactly, so a hand-tweak
// can't quietly replace a computed one (which is how #9af4cb got in).
for (const [name, spec_] of Object.entries(spec.derived ?? {})) {
  if (isMeta(name)) continue;
  const actual = declaredHex[name];
  if (actual === undefined) continue;
  if (actual !== spec_.value.toLowerCase()) {
    problems.push(
      `--color-${name} is ${actual}, expected ${spec_.value}\n` +
        `      derived from --color-${spec_.from} (${spec_.formula})`,
    );
  }
}

// Deviations that name a token absent from `brand` still have to match the
// stylesheet exactly.
for (const [name, deviation] of Object.entries(spec.acceptedDeviations)) {
  if (isMeta(name) || name in spec.brand) continue;
  const actual = declaredHex[name];
  if (actual && actual !== deviation.shipped.toLowerCase()) {
    problems.push(
      `--color-${name} is ${actual}, expected ${deviation.shipped}\n` +
        `      accepted deviation — ${deviation.reason}`,
    );
  }
}

// 2. Role wiring
for (const [role, target] of Object.entries(spec.roles)) {
  if (isMeta(role)) continue;
  const actual = declaredRefs[role];
  if (actual === undefined) {
    problems.push(
      `--color-${role} is missing; should point at --color-${target}`,
    );
  } else if (actual !== target) {
    problems.push(
      `--color-${role} points at --color-${actual}, expected --color-${target}`,
    );
  }
}

// 3. Unaccounted palette tokens
const accountedFor = new Set(
  [
    ...Object.keys(spec.brand),
    ...Object.keys(spec.derived ?? {}),
    ...Object.keys(spec.unconfirmed),
    ...Object.keys(spec.acceptedDeviations),
  ].filter((k) => !isMeta(k)),
);
for (const name of Object.keys(declaredHex)) {
  if (!name.startsWith("elfyou-")) continue;
  if (!accountedFor.has(name)) {
    problems.push(
      `--color-${name} (${declaredHex[name]}) is not in brand/tokens.json.\n` +
        `      Add it under brand with evidence, or unconfirmed if unverified.`,
    );
  }
}

if (problems.length) {
  console.error(
    `\n  Token drift — ${spec.stylesheet} disagrees with brand/tokens.json:\n`,
  );
  for (const p of problems) console.error(`    • ${p}\n`);
  console.error(
    `  Update both together, or record the divergence under acceptedDeviations.\n`,
  );
  process.exit(1);
}

const roleCount = Object.keys(spec.roles).filter((k) => !isMeta(k)).length;
console.log(
  `Tokens in sync — ${Object.keys(spec.brand).length} brand values, ${roleCount} roles.`,
);
