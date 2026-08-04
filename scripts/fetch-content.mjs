import { Client } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log('DATABASE_URL not set — skipping Neon fetch, keeping the checked-in data files.');
  process.exit(0);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');

const client = new Client(connectionString);
await client.connect();

const { rows: exercises } = await client.query(
  `SELECT id, name, difficulty, muscle_group AS "muscleGroup", description, image, steps
   FROM exercises ORDER BY sort_order ASC`
);
const { rows: programs } = await client.query(
  `SELECT id, title, duration, difficulty, description, features, icon
   FROM programs ORDER BY sort_order ASC`
);

await client.end();

writeFileSync(join(dataDir, 'exercises.json'), JSON.stringify(exercises, null, 2) + '\n');
writeFileSync(join(dataDir, 'programs.json'), JSON.stringify(programs, null, 2) + '\n');

console.log(`Fetched ${exercises.length} exercises and ${programs.length} programs from Neon.`);
