import { useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Link,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';

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
  const [whatsAppStatus, setWhatsAppStatus] = useState<string | null>(null);

  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [terms, setTerms] = useState<ExtractTermsResult | null>(null);
  const [invoice, setInvoice] = useState<InvoiceGenerateResult | null>(null);

  const allRunIds = useMemo(() => {
    const ids = [upload?.runId, terms?.runId, invoice?.runId].filter(Boolean) as string[];
    return Array.from(new Set(ids));
  }, [upload?.runId, terms?.runId, invoice?.runId]);

  return (
    <Box sx={{ py: { xs: 3, sm: 5 } }}>
      <Container maxWidth="lg">
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
            justifyContent="space-between"
          >
            <Stack spacing={0.75}>
              <Typography variant="h4">Contract-to-Cash Demo</Typography>
              <Typography variant="subtitle1">
                Upload → extract terms (OpenAI) → generate invoice (deterministic) → collections artifacts
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Link href="/api/status" target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', gap: 0.75 }}>
                API status <OpenInNewRoundedIcon fontSize="inherit" />
              </Link>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', sm: 'block' } }} />
              <Link href="/healthz" target="_blank" rel="noreferrer" sx={{ display: 'inline-flex', gap: 0.75 }}>
                healthz <OpenInNewRoundedIcon fontSize="inherit" />
              </Link>
            </Stack>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <SectionCard
            title="1) Upload contract PDF"
            status={upload ? <Chip size="small" color="success" label="Uploaded" /> : <Chip size="small" label="Pending" />}
            action={
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Button component="label" variant="outlined" disabled={busy} startIcon={<UploadFileRoundedIcon />}>
                  Choose PDF
                  <input
                    hidden
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </Button>
                <Button
                  variant="contained"
                  disabled={busy || !file}
                  startIcon={busy ? <HourglassTopRoundedIcon /> : <UploadFileRoundedIcon />}
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
                      setWhatsAppStatus(null);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Upload failed');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Upload
                </Button>
              </Stack>
            }
          >
            <Stack spacing={1.25}>
              <Typography variant="body2">
                {file ? (
                  <>
                    Selected: <Typography component="span" sx={{ fontWeight: 650 }}>{file.name}</Typography>
                  </>
                ) : (
                  'Choose a dummy PDF to start.'
                )}
              </Typography>

              {upload ? (
                <Stack spacing={1.25}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <KeyValue label="contractId" value={upload.contractId} />
                    <KeyValue label="runId" value={upload.runId} />
                  </Stack>
                  <CodeBlock label="extractedText">{upload.extractedText}</CodeBlock>
                </Stack>
              ) : null}
            </Stack>
          </SectionCard>

          <SectionCard
            title="2) Extract billing terms (OpenAI)"
            status={
              terms ? (
                <Chip size="small" color="success" label="Extracted" />
              ) : upload ? (
                <Chip size="small" color="info" label="Ready" />
              ) : (
                <Chip size="small" label="Blocked" />
              )
            }
            action={
              <Button
                variant="contained"
                disabled={busy || !upload}
                startIcon={busy ? <HourglassTopRoundedIcon /> : <AutoFixHighRoundedIcon />}
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
                    setWhatsAppStatus(null);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Extraction failed');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Extract terms
              </Button>
            }
          >
            {terms ? (
              <Stack spacing={1.25}>
                <KeyValue label="runId" value={terms.runId} />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <CodeBlock label="extractedTerms (JSON)">{JSON.stringify(terms.extractedTerms, null, 2)}</CodeBlock>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <CodeBlock label="warnings">{JSON.stringify(terms.warnings, null, 2)}</CodeBlock>
                  </Box>
                </Stack>
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Run extraction after upload.
              </Typography>
            )}
          </SectionCard>

          <SectionCard
            title="3) Generate invoice + artifacts"
            status={
              invoice ? (
                <Chip size="small" color="success" label="Generated" />
              ) : upload && terms ? (
                <Chip size="small" color="info" label="Ready" />
              ) : (
                <Chip size="small" label="Blocked" />
              )
            }
            action={
              <Button
                variant="contained"
                disabled={busy || !upload || !terms}
                startIcon={busy ? <HourglassTopRoundedIcon /> : <ReceiptLongRoundedIcon />}
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
                    setWhatsAppStatus(null);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Invoice generation failed');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Generate invoice
              </Button>
            }
          >
            {invoice ? (
              <Stack spacing={1.25}>
                <KeyValue label="runId" value={invoice.runId} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Button
                    variant="outlined"
                    disabled={busy || !invoice?.whatsappPayload}
                    onClick={async () => {
                      setBusy(true);
                      setError(null);
                      setWhatsAppStatus(null);
                      try {
                        const invoiceId = (invoice.invoice as any)?.id as string | undefined;
                        if (!invoiceId) throw new Error('Missing invoice.id');
                        const r = await fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/send-whatsapp`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ messagePayload: invoice.whatsappPayload })
                        });
                        const j = await r.json();
                        if (!r.ok || !j.ok) throw new Error(j.error ?? 'WhatsApp send failed');
                        setWhatsAppStatus('Sent (accepted)');
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'WhatsApp send failed');
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Send via WhatsApp
                  </Button>
                  {whatsAppStatus ? <Chip size="small" color="success" label={whatsAppStatus} /> : null}
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <CodeBlock label="invoice (JSON)">{JSON.stringify(invoice.invoice, null, 2)}</CodeBlock>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack spacing={1.25}>
                      <CodeBlock label="collections (WhatsApp payload)">
                        {JSON.stringify(invoice.whatsappPayload, null, 2)}
                      </CodeBlock>
                      <CodeBlock label="reminders">{JSON.stringify(invoice.reminders, null, 2)}</CodeBlock>
                      <CodeBlock label="rev rec">{JSON.stringify(invoice.revrec, null, 2)}</CodeBlock>
                    </Stack>
                  </Box>
                </Stack>

                <Stack spacing={0.75}>
                  <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                    invoice preview (HTML)
                  </Typography>
                  <Box
                    component="iframe"
                    title="invoice-preview"
                    sx={{
                      width: '100%',
                      height: 460,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper'
                    }}
                    srcDoc={invoice.invoiceHtml}
                  />
                </Stack>
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                This step also writes inspectable artifacts under <Box component="code">artifacts/</Box>.
              </Typography>
            )}
          </SectionCard>

          <SectionCard
            title="Artifacts"
            status={
              allRunIds.length ? <Chip size="small" label={`${allRunIds.length} run${allRunIds.length === 1 ? '' : 's'}`} /> : null
            }
          >
            <Stack spacing={1.25}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Run IDs:{' '}
                {allRunIds.length ? (
                  allRunIds.map((x) => (
                    <Chip
                      key={x}
                      size="small"
                      label={x}
                      sx={{ mr: 1, mb: 0.75, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
                    />
                  ))
                ) : (
                  '—'
                )}
              </Typography>

              {allRunIds.length ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
                  {allRunIds.map((runId) => (
                    <Button
                      key={runId}
                      component="a"
                      href={`/api/artifacts/${encodeURIComponent(runId)}`}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      endIcon={<OpenInNewRoundedIcon />}
                      sx={{ justifyContent: 'space-between' }}
                    >
                      index.json for {runId}
                    </Button>
                  ))}
                </Stack>
              ) : null}
            </Stack>
          </SectionCard>
        </Stack>
      </Container>
    </Box>
  );
}

function KeyValue(props: { label: string; value: string }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.1 }}>
        {props.label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          overflowWrap: 'anywhere'
        }}
      >
        {props.value}
      </Typography>
    </Stack>
  );
}

function CodeBlock(props: { label: string; children: string }) {
  return (
    <Stack spacing={0.75}>
      <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.1 }}>
        {props.label}
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.70)'
        }}
      >
        <Box
          component="pre"
          sx={{
            m: 0,
            fontSize: 12.5,
            lineHeight: 1.5,
            maxHeight: 300,
            overflow: 'auto',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }}
        >
          {props.children}
        </Box>
      </Paper>
    </Stack>
  );
}

function SectionCard(props: {
  title: string;
  status?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ minWidth: 0 }}>
              {props.title}
            </Typography>
            {props.status ? <Box sx={{ flexShrink: 0 }}>{props.status}</Box> : null}
          </Stack>
          {props.action ? <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>{props.action}</Box> : null}
        </Stack>

        <Divider />

        <Box sx={{ minWidth: 0 }}>{props.children}</Box>
      </Stack>
    </Paper>
  );
}

