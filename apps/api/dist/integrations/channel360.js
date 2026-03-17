const ORG_ID = '639700347749ed00181de224';
export async function uploadTemplateDocument(args) {
    const token = process.env.WA_TEMPLATE_UPLOAD_KEY ?? process.env.WA_API_KEY;
    if (!token)
        throw new Error('Missing WA_TEMPLATE_UPLOAD_KEY (or WA_API_KEY) for Channel360 upload');
    const url = `https://www.channel360.co.za/webapi/org/${ORG_ID}/templates/upload`;
    const form = new FormData();
    const u8 = new Uint8Array(args.data);
    form.append('file', new Blob([u8], { type: args.contentType }), args.filename);
    const r = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: form
    });
    const text = await r.text();
    let json;
    try {
        json = JSON.parse(text);
    }
    catch {
        throw new Error(`Channel360 upload returned non-JSON: ${text.slice(0, 200)}`);
    }
    if (!r.ok) {
        throw new Error(`Channel360 upload failed (${r.status}): ${JSON.stringify(json).slice(0, 400)}`);
    }
    return json;
}
