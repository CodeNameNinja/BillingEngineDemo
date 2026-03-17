import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const artifactsRoot = path.resolve(process.cwd(), '../../artifacts');
export function getRunDir(runId) {
    return path.join(artifactsRoot, runId);
}
export async function writeArtifacts(args) {
    const dir = getRunDir(args.runId);
    await mkdir(dir, { recursive: true });
    const index = {
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
export async function readArtifactIndex(runId) {
    const indexPath = path.join(getRunDir(runId), 'index.json');
    const raw = await readFile(indexPath, 'utf8');
    return JSON.parse(raw);
}
export async function listRuns() {
    try {
        const entries = await readdir(artifactsRoot, { withFileTypes: true });
        return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    }
    catch {
        return [];
    }
}
