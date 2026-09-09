#!/usr/bin/env node
/**
 * Validate a hyrule.json against schema/hyrule.schema.json.
 *
 * Usage:
 *   node scripts/validate-manifest.mjs                 # validate ./hyrule.json
 *   node scripts/validate-manifest.mjs path/to/hyrule.json [...more]
 *
 * Exits non-zero if any file is invalid. Safe to run in a tool repo's CI.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(resolve(root, 'schema/hyrule.schema.json'), 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const targets = process.argv.slice(2);
if (targets.length === 0) targets.push('hyrule.json');

let failed = 0;

for (const target of targets) {
  const path = resolve(process.cwd(), target);
  const label = relative(process.cwd(), path) || target;

  if (!existsSync(path)) {
    console.error(`✗ ${label}: file not found`);
    failed++;
    continue;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`✗ ${label}: malformed JSON — ${err.message}`);
    failed++;
    continue;
  }

  if (validate(data)) {
    console.log(`✓ ${label}: valid`);
    continue;
  }

  failed++;
  console.error(`✗ ${label}: ${validate.errors.length} problem(s)`);
  for (const e of validate.errors) {
    const where = e.instancePath || '(root)';
    const allowed = e.params?.allowedValues ? ` — allowed: ${e.params.allowedValues.join(', ')}` : '';
    const extra = e.params?.additionalProperty ? ` "${e.params.additionalProperty}"` : '';
    console.error(`    ${where} ${e.message}${extra}${allowed}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed validation.`);
  process.exit(1);
}
console.log(`\nAll ${targets.length} file(s) valid.`);
