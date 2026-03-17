import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type Stored = {
  createdAt: string;
  responseJson: unknown;
};

const root = path.resolve(process.cwd(), '../../artifacts/_idempotency');

export async function getIdempotentResponse(key: string): Promise<Stored | null> {
  const p = path.join(root, `${safeKey(key)}.json`);
  try {
    const raw = await readFile(p, 'utf8');
    return JSON.parse(raw) as Stored;
  } catch {
    return null;
  }
}

export async function setIdempotentResponse(key: string, stored: Stored): Promise<void> {
  await mkdir(root, { recursive: true });
  const p = path.join(root, `${safeKey(key)}.json`);
  await writeFile(p, JSON.stringify(stored, null, 2));
}

function safeKey(key: string) {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180);
}

