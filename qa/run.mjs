import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const suites = [
  'partner-registry', 'results-only', 'partner-self-service', 'savera-data',
  'property-intake-dedup', 'movein-next-action', 'movein-receipt',
  'property-results-period', 'install-app', 'partner-crm', 'crm-identifiers', 'crm-workflow', 'commercial-periods'
];
let failures = 0;
function run(args) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error || result.status !== 0) { failures++; console.error(result.error || `Failed: ${args.join(' ')}`); }
}
function syntax(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) syntax(file);
    else if (file.endsWith('.js')) run(['--check', file]);
  }
}
syntax('dist');
for (const suite of suites) { console.log(`\nSuite: ${suite}`); run([`qa/${suite}.mjs`]); }
console.log(`\n${suites.length} suites executed; ${failures} failed commands.`);
process.exitCode = failures ? 1 : 0;
