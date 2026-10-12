import { readdirSync } from "node:fs";
const directory = "supabase/migrations";
const files = readdirSync(directory).filter((name) => name.endsWith(".sql")).sort();
const seen = new Map();
const errors = [];

for (const file of files) {
  const match = file.match(/^(\d{14})_([a-z0-9_]+)\.sql$/);
  if (!match) {
    errors.push(`Invalid migration filename: ${file}`);
    continue;
  }
  const [, version] = match;
  if (seen.has(version)) {
    errors.push(`Duplicate migration version ${version}: ${seen.get(version)} and ${file}`);
  } else {
    seen.set(version, file);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${files.length} migrations: unique 14-digit versions and valid names.`);
