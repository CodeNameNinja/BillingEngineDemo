import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(process.cwd(), '../../artifacts/_idempotency');
export async function getIdempotentResponse(key) {
    const p = path.join(root, `${safeKey(key)}.json`);
    try {
        const raw = await readFile(p, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export async function setIdempotentResponse(key, stored) {
    await mkdir(root, { recursive: true });
    const p = path.join(root, `${safeKey(key)}.json`);
    await writeFile(p, JSON.stringify(stored, null, 2));
}
function safeKey(key) {
    return key.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}
