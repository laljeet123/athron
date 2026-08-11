import { loadEnv } from 'vite';
import { readFileSync } from 'fs';
import { join } from 'path';
const cwd = process.cwd();
console.log('cwd:', cwd);
console.log('env file exists:', ['.env', '.env.local', '.env.test'].map(f => ({ file:f, exists: Boolean(readFileSync(join(cwd, f), 'utf8') && true) })));
const env = loadEnv('development', cwd, 'VITE_');
console.log(JSON.stringify(env, null, 2));
console.log('process.env VITE values:', { VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY });
