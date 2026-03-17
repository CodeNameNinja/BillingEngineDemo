import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

type ArtifactFile = { key: string; filename: string; contentType: string; data: Buffer };

export type ArtifactIndex = {
  runId: string;
  createdAt: string;
  contractId?: string;
  invoiceId?: string;
  files: Array<{ key: string; path: string; contentType: string }>;
};

const artifactsRoot = path.resolve(process.cwd(), '../../artifacts');

export function getRunDir(runId: string) {
  return path.join(artifactsRoot, runId);
}

export async function writeArtifacts(args: {
  runId: string;
  createdAt: string;
  contractId?: string;
  invoiceId?: string;
  files: ArtifactFile[];
}): Promise<ArtifactIndex> {
  const dir = getRunDir(args.runId);
  await mkdir(dir, { recursive: true });

  const index: ArtifactIndex = {
    runId: args.runId,
    createdAt: args.createdAt,
    contractId: args.contractId,
    invoiceId: args.invoiceId,
    files: []
  };

  for (const f of args.files) {
    const filePath = path.join(dir, f.filename);
    await writeFile(filePath, f.data);
    index.files.push({ key: f.key, path: filePath, contentType: f.contentType });
  }

  const indexPath = path.join(dir, 'index.json');
  await writeFile(indexPath, Buffer.from(JSON.stringify(index, null, 2)));
  index.files.unshift({ key: 'index', path: indexPath, contentType: 'application/json' });

  return index;
}

export async function readArtifactIndex(runId: string): Promise<ArtifactIndex> {
  const indexPath = path.join(getRunDir(runId), 'index.json');
  const raw = await readFile(indexPath, 'utf8');
  return JSON.parse(raw) as ArtifactIndex;
}

export async function listRuns(): Promise<string[]> {
  try {
    const entries = await readdir(artifactsRoot, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

