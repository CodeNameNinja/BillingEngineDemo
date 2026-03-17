export async function uploadToFileIo(args) {
    const form = new FormData();
    const u8 = new Uint8Array(args.data);
    form.append('file', new Blob([u8], { type: args.contentType }), args.filename);
    const r = await fetch('https://file.io/', {
        method: 'POST',
        headers: {
            Accept: 'application/json'
        },
        body: form
    });
    const text = await r.text();
    let json;
    try {
        json = JSON.parse(text);
    }
    catch {
        throw new Error(`file.io returned non-JSON: ${text.slice(0, 200)}`);
    }
    if (!r.ok)
        throw new Error(`file.io upload failed (${r.status}): ${JSON.stringify(json).slice(0, 400)}`);
    const link = json?.link;
    if (typeof link !== 'string' || link.length === 0)
        throw new Error(`file.io response missing link: ${JSON.stringify(json).slice(0, 400)}`);
    return { link };
}
