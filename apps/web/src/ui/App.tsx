import { useMemo, useState } from 'react';

type UploadResult = {
  runId: string;
  contractId: string;
  extractedText: string;
};

type ExtractTermsResult = {
  runId: string;
  extractedTerms: unknown;
  warnings: unknown[];
};

type InvoiceGenerateResult = {
  runId: string;
  invoice: unknown;
  invoiceHtml: string;
  paymentLink: unknown;
  whatsappPayload: unknown;
  reminders: unknown;
  revrec: unknown;
};

export function App() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [terms, setTerms] = useState<ExtractTermsResult | null>(null);
  const [invoice, setInvoice] = useState<InvoiceGenerateResult | null>(null);

  const allRunIds = useMemo(() => {
    const ids = [upload?.runId, terms?.runId, invoice?.runId].filter(Boolean) as string[];
    return Array.from(new Set(ids));
  }, [upload?.runId, terms?.runId, invoice?.runId]);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>Contract-to-Cash Demo</h1>
          <div style={{ color: '#555', marginTop: 6 }}>
            Upload → extract terms (mock) → generate invoice (deterministic) → collections artifacts
          </div>
        </div>
        <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 8 }}>
          <a href="/api/status" target="_blank" rel="noreferrer">
            API status
          </a>
          <a href="/healthz" target="_blank" rel="noreferrer">
            healthz
          </a>
        </div>
      </header>

      <section style={cardStyle}>
        <h2 style={h2Style}>1) Upload contract PDF</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={busy}
          />
          <button
            disabled={busy || !file}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const fd = new FormData();
                fd.append('file', file!);
                const r = await fetch('/api/contracts', { method: 'POST', body: fd });
                const j = await r.json();
                if (!r.ok || !j.ok) throw new Error(j.error ?? 'Upload failed');
                setUpload({ runId: j.runId, contractId: j.contractId, extractedText: j.extractedText });
                setTerms(null);
                setInvoice(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Upload failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            Upload
          </button>
        </div>
        {upload ? (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <KeyValue label="contractId" value={upload.contractId} />
            <KeyValue label="runId" value={upload.runId} />
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>extractedText</div>
              <pre style={preStyle}>{upload.extractedText}</pre>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 10, color: '#555' }}>Upload a dummy PDF to start.</div>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={h2Style}>2) Extract billing terms (mocked)</h2>
        <button
          disabled={busy || !upload}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const r = await fetch(`/api/contracts/${encodeURIComponent(upload!.contractId)}/extract-terms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: upload!.extractedText })
              });
              const j = await r.json();
              if (!r.ok || !j.ok) throw new Error(j.error ?? 'Extraction failed');
              setTerms({ runId: j.runId, extractedTerms: j.extractedTerms, warnings: j.warnings ?? [] });
              setInvoice(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Extraction failed');
            } finally {
              setBusy(false);
            }
          }}
        >
          Extract terms
        </button>

        {terms ? (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <KeyValue label="runId" value={terms.runId} />
            <div />
            <div>
              <div style={labelStyle}>extractedTerms (JSON)</div>
              <pre style={preStyle}>{JSON.stringify(terms.extractedTerms, null, 2)}</pre>
            </div>
            <div>
              <div style={labelStyle}>warnings</div>
              <pre style={preStyle}>{JSON.stringify(terms.warnings, null, 2)}</pre>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 10, color: '#555' }}>Run extraction after upload.</div>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={h2Style}>3) Generate invoice + artifacts</h2>
        <button
          disabled={busy || !upload || !terms}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const r = await fetch('/api/invoices/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `demo-${upload!.contractId}` },
                body: JSON.stringify({ contractId: upload!.contractId, extractedTerms: terms!.extractedTerms })
              });
              const j = await r.json();
              if (!r.ok || !j.ok) throw new Error(j.error ?? 'Invoice generation failed');
              setInvoice({
                runId: j.runId,
                invoice: j.invoice,
                invoiceHtml: j.invoiceHtml,
                paymentLink: j.paymentLink,
                whatsappPayload: j.whatsappPayload,
                reminders: j.reminders,
                revrec: j.revrec
              });
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Invoice generation failed');
            } finally {
              setBusy(false);
            }
          }}
        >
          Generate invoice
        </button>

        {invoice ? (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <KeyValue label="runId" value={invoice.runId} />
            <div />
            <div>
              <div style={labelStyle}>invoice (JSON)</div>
              <pre style={preStyle}>{JSON.stringify(invoice.invoice, null, 2)}</pre>
            </div>
            <div>
              <div style={labelStyle}>collections (WhatsApp payload)</div>
              <pre style={preStyle}>{JSON.stringify(invoice.whatsappPayload, null, 2)}</pre>
              <div style={{ marginTop: 10 }}>
                <div style={labelStyle}>reminders</div>
                <pre style={preStyle}>{JSON.stringify(invoice.reminders, null, 2)}</pre>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={labelStyle}>rev rec</div>
                <pre style={preStyle}>{JSON.stringify(invoice.revrec, null, 2)}</pre>
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={labelStyle}>invoice preview (HTML)</div>
              <iframe
                title="invoice-preview"
                style={{ width: '100%', height: 420, border: '1px solid #e5e7eb', borderRadius: 8 }}
                srcDoc={invoice.invoiceHtml}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 10, color: '#555' }}>
            This step also writes inspectable artifacts under <code>artifacts/</code>.
          </div>
        )}
      </section>

      <section style={cardStyle}>
        <h2 style={h2Style}>Artifacts</h2>
        <div style={{ color: '#555' }}>
          Run IDs: {allRunIds.length ? allRunIds.map((x) => <code key={x} style={{ marginRight: 8 }}>{x}</code>) : '—'}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {allRunIds.map((runId) => (
            <a key={runId} href={`/api/artifacts/${encodeURIComponent(runId)}`} target="_blank" rel="noreferrer">
              index.json for {runId}
            </a>
          ))}
        </div>
      </section>

      {error ? (
        <section style={{ ...cardStyle, borderColor: '#fecaca', background: '#fff1f2' }}>
          <strong>Error:</strong> {error}
        </section>
      ) : null}
    </div>
  );
}

function KeyValue(props: { label: string; value: string }) {
  return (
    <div>
      <div style={labelStyle}>{props.label}</div>
      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
        {props.value}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  marginTop: 16,
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  background: '#fff'
};

const h2Style: React.CSSProperties = {
  margin: '0 0 10px 0',
  fontSize: 18
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#6b7280',
  marginBottom: 6
};

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: 12,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#fafafa',
  maxHeight: 280,
  overflow: 'auto'
};

