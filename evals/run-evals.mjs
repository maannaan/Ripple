#!/usr/bin/env node
/**
 * LLM eval harness — validates agent instruction contract without calling an LLM.
 * Checks that fixtures define required tool sequences and simulation-first rules.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = join(ROOT, "evals/fixtures");
const INSTRUCTIONS = join(ROOT, "agent/instructions.md");

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`PASS: ${msg}`);
}

const instructions = readFileSync(INSTRUCTIONS, "utf-8");

if (!instructions.includes("simulate_change.py")) {
  fail("instructions.md must require simulate_change.py");
}
pass("instructions require simulation script");

if (!instructions.includes("apply_product_update")) {
  fail("instructions.md must reference apply_product_update");
}
pass("instructions reference apply_product_update");

if (!instructions.includes("Never") && !instructions.includes("never")) {
  fail("instructions must forbid guessing numbers");
}
pass("instructions forbid guessing");

const files = readdirSync(FIXTURES).filter((f) => f.endsWith(".json"));
for (const file of files) {
  const fixture = JSON.parse(readFileSync(join(FIXTURES, file), "utf-8"));
  if (!fixture.prompt || !fixture.expected_tools?.length) {
    fail(`${file}: missing prompt or expected_tools`);
  }
  if (fixture.must_simulate && !instructions.includes("simulate_change.py")) {
    fail(`${file}: simulation required but not in instructions`);
  }
  if (fixture.forbidden_patterns) {
    for (const pattern of fixture.forbidden_patterns) {
      if (instructions.includes(`estimate ${pattern}`)) {
        fail(`instructions must not encourage estimating ${pattern}`);
      }
    }
  }
  pass(`fixture ${file}: tool sequence [${fixture.expected_tools.join(", ")}]`);
}

console.log("OK: agent eval harness passed");
