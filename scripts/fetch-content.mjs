import { neon } from '@neondatabase/serverless';
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

// Neon's HTTP driver (plain fetch) rather than the WebSocket-based Client —
// GitHub Actions' Node runner has no global WebSocket, only fetch.
const sql = neon(connectionString);

const exercises = await sql`
  SELECT id, name, difficulty, muscle_group AS "muscleGroup", description, image, steps
  FROM exercises ORDER BY sort_order ASC
`;
const programs = await sql`
  SELECT id, title, duration, difficulty, description, features, icon
  FROM programs ORDER BY sort_order ASC
`;

writeFileSync(join(dataDir, 'exercises.json'), JSON.stringify(exercises, null, 2) + '\n');
writeFileSync(join(dataDir, 'programs.json'), JSON.stringify(programs, null, 2) + '\n');

console.log(`Fetched ${exercises.length} exercises and ${programs.length} programs from Neon.`);
