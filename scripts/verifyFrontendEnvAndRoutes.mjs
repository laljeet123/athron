import { loadEnv } from 'vite';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();
const envPath = join(cwd, '.env');
console.log(`envPath=${envPath}`);
console.log(`envExists=${existsSync(envPath)}`);
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/).filter(Boolean);
  lines.forEach((line) => {
    if (line.startsWith('VITE_SUPABASE_URL=')) console.log('line:VITE_SUPABASE_URL');
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) console.log('line:VITE_SUPABASE_ANON_KEY');
  });
}
const env = loadEnv('development', cwd, 'VITE_');
console.log(`loadEnv_has_VITE_SUPABASE_URL=${Boolean(env.VITE_SUPABASE_URL)}`);
console.log(`loadEnv_has_VITE_SUPABASE_ANON_KEY=${Boolean(env.VITE_SUPABASE_ANON_KEY)}`);

const rootResp = await fetch('http://localhost:5173/');
console.log(`rootStatus=${rootResp.status}`);
const builderResp = await fetch('http://localhost:5173/workout/builder');
console.log(`builderStatus=${builderResp.status}`);
