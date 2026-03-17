import { useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import type {
  ArtifactIndex,
  BillingWarning,
  ExtractedBillingTerms,
  Invoice,
  PaymentLink,
  ReminderSchedule,
  RevRecSchedule
} from '@demo/shared';
import { ExtractedBillingTermsSchema } from '@demo/shared';

type UploadResult = {
  runId: string;
  contractId: string;
  extractedText: string;
};

type ExtractTermsResult = {
  runId: string;
  extractedTerms: ExtractedBillingTerms;
  warnings: BillingWarning[];
};

type InvoiceGenerateResult = {
  runId: string;
  invoice: Invoice;
  invoiceHtml: string;
  paymentLink: PaymentLink;
  whatsappPayload: unknown;
  reminders: ReminderSchedule;
  revrec: RevRecSchedule;
  artifactIndex: ArtifactIndex;
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
                    const parsed = ExtractedBillingTermsSchema.safeParse(j.extractedTerms);
                    if (!parsed.success) throw new Error('Extraction returned invalid schema');
                    setTerms({
                      runId: j.runId,
                      extractedTerms: parsed.data,
                      warnings: (j.warnings ?? []) as BillingWarning[]
                    });
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
                <TermsPanel terms={terms.extractedTerms} warnings={terms.warnings} />
                <JsonAccordion label="extractedTerms (raw JSON)">{JSON.stringify(terms.extractedTerms, null, 2)}</JsonAccordion>
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
                      revrec: j.revrec,
                      artifactIndex: j.artifactIndex
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
                <InvoicePanel invoice={invoice.invoice} paymentLink={invoice.paymentLink} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Button
                    component="a"
                    variant="outlined"
                    disabled={
                      busy ||
                      !invoice.artifactIndex.files.some((f) => f.key === 'invoice.pdf')
                    }
                    href={`/api/artifacts/${encodeURIComponent(invoice.runId)}/file?key=invoice.pdf`}
                  >
                    Download invoice PDF
                  </Button>
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
                <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="stretch">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <RevRecPanel revrec={invoice.revrec} currency={invoice.invoice.currency} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <RemindersPanel schedule={invoice.reminders} />
                    <Box sx={{ mt: 2 }}>
                      <ArtifactsPanel runId={invoice.runId} artifactIndex={invoice.artifactIndex} />
                    </Box>
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

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <JsonAccordion label="invoice (raw JSON)">{JSON.stringify(invoice.invoice, null, 2)}</JsonAccordion>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <JsonAccordion label="collections (WhatsApp payload)">
                      {JSON.stringify(invoice.whatsappPayload, null, 2)}
                    </JsonAccordion>
                  </Box>
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

function JsonAccordion(props: { label: string; children: string }) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        borderRadius: 2,
        '&:before': { display: 'none' }
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.1 }}>
          {props.label}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ mt: -1 }}>
          <CodeBlock label="">{props.children}</CodeBlock>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

function Money(props: { amountMinor: number; currency: string }) {
  return <>{formatMinor(props.amountMinor, props.currency)}</>;
}

function InvoicePanel(props: { invoice: Invoice; paymentLink: PaymentLink }) {
  const inv = props.invoice;
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
      <Stack spacing={1.25}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.1 }}>
              Invoice
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1.15 }}>
              {inv.invoiceNumber}
            </Typography>
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Button component="a" href={props.paymentLink.url} target="_blank" rel="noreferrer" variant="contained">
            Pay via Ozow <OpenInNewRoundedIcon fontSize="inherit" />
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Kpi label="Customer" value={inv.customerName} />
          <Kpi label="Issued" value={inv.issuedAt.slice(0, 10)} />
          <Kpi label="Due" value={inv.dueAt.slice(0, 10)} />
          <Kpi
            label="Total"
            value={
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.2 }}>
                <Money amountMinor={inv.totalMinor} currency={inv.currency} />
              </Typography>
            }
          />
        </Stack>

        <LineItemsTable currency={inv.currency} lineItems={inv.lineItems} />
      </Stack>
    </Paper>
  );
}

function LineItemsTable(props: { lineItems: Invoice['lineItems']; currency: Invoice['currency'] }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Table size="small" sx={{ '& th': { fontWeight: 750 } }}>
        <TableHead>
          <TableRow>
            <TableCell>Description</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Unit</TableCell>
            <TableCell align="right">Unit price</TableCell>
            <TableCell align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.lineItems.map((li) => (
            <TableRow key={li.id} hover>
              <TableCell sx={{ minWidth: 220 }}>
                <Typography variant="body2" sx={{ fontWeight: 650 }}>
                  {li.description}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
                >
                  {li.id}
                </Typography>
              </TableCell>
              <TableCell align="right">{li.quantity}</TableCell>
              <TableCell align="right">{li.unit}</TableCell>
              <TableCell align="right">
                <Money amountMinor={li.unitPriceMinor} currency={props.currency} />
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 750 }}>
                <Money amountMinor={li.amountMinor} currency={props.currency} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

function TermsPanel(props: { terms: ExtractedBillingTerms; warnings: BillingWarning[] }) {
  const t = props.terms;
  const status = props.warnings?.length ? 'Needs review' : 'Looks good';
  const statusColor = props.warnings?.length ? 'warning' : 'success';

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
      <Stack spacing={1.25}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Typography variant="h6">Extracted billing terms</Typography>
          <Box sx={{ flex: 1 }} />
          <Chip size="small" color={statusColor} label={status} />
        </Stack>

        {props.warnings?.length ? (
          <Alert severity="warning">
            <Stack spacing={0.25}>
              <Typography variant="body2" sx={{ fontWeight: 650 }}>
                Warnings
              </Typography>
              {props.warnings.map((w, idx) => (
                <Typography key={`${w.code}-${idx}`} variant="body2">
                  <Box component="span" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                    {w.code}
                  </Box>
                  {w.path ? ` (${w.path})` : ''}: {w.message}
                </Typography>
              ))}
            </Stack>
          </Alert>
        ) : null}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SectionSubhead>Contract & parties</SectionSubhead>
            <KeyValueGrid
              items={[
                { label: 'Customer', value: t.customerName ?? '—' },
                { label: 'Currency', value: t.currency ?? '—' },
                { label: 'Start', value: t.contractStartDate ?? '—' },
                { label: 'End', value: t.contractEndDate ?? '—' }
              ]}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SectionSubhead>Billing</SectionSubhead>
            <KeyValueGrid
              items={[
                { label: 'Model', value: t.billingModel ?? '—' },
                { label: 'Frequency', value: t.invoiceFrequency ?? '—' },
                { label: 'Term (months)', value: t.termLengthMonths != null ? String(t.termLengthMonths) : '—' },
                { label: 'Due rule', value: t.dueDateRule ?? '—' }
              ]}
            />
          </Box>
        </Stack>

        {t.lineItems?.length ? (
          <Box>
            <SectionSubhead>Line items</SectionSubhead>
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit</TableCell>
                    <TableCell align="right">Unit price</TableCell>
                    <TableCell align="right">Fee</TableCell>
                    <TableCell align="right">Cadence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {t.lineItems.map((li, idx) => (
                    <TableRow key={`${li.description}-${idx}`} hover>
                      <TableCell>{li.description}</TableCell>
                      <TableCell align="right">{li.quantity ?? '—'}</TableCell>
                      <TableCell align="right">{li.unit ?? '—'}</TableCell>
                      <TableCell align="right">
                        {li.unitPriceMinor != null && t.currency ? (
                          <Money amountMinor={li.unitPriceMinor} currency={t.currency} />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {li.fixedFeeMinor != null && t.currency ? (
                          <Money amountMinor={li.fixedFeeMinor} currency={t.currency} />
                        ) : li.recurringFeeMinor != null && t.currency ? (
                          <Money amountMinor={li.recurringFeeMinor} currency={t.currency} />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell align="right">{li.cadence ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        ) : null}

        {t.variableUsageRules?.length ? (
          <Box>
            <SectionSubhead>Usage rules</SectionSubhead>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {t.variableUsageRules.map((r, idx) => (
                <Tooltip
                  key={`${r.meter}-${r.unit}-${idx}`}
                  title={
                    t.currency ? (
                      <>
                        {r.meter} · {r.unit} · <Money amountMinor={r.pricePerUnitMinor} currency={t.currency} /> / unit
                      </>
                    ) : (
                      `${r.meter} · ${r.unit} · ${r.pricePerUnitMinor} minor / unit`
                    )
                  }
                >
                  <Chip size="small" label={`${r.meter} (${r.unit})`} color="info" variant="outlined" sx={{ fontWeight: 650 }} />
                </Tooltip>
              ))}
            </Stack>
          </Box>
        ) : null}

        {t.contactChannel?.whatsappPhoneE164 || t.contactChannel?.email ? (
          <Box>
            <SectionSubhead>Collections contact</SectionSubhead>
            <KeyValueGrid
              items={[
                { label: 'WhatsApp', value: t.contactChannel?.whatsappPhoneE164 ?? '—' },
                { label: 'Email', value: t.contactChannel?.email ?? '—' }
              ]}
            />
          </Box>
        ) : null}
      </Stack>
    </Paper>
  );
}

function RemindersPanel(props: { schedule: ReminderSchedule }) {
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
      <Stack spacing={1}>
        <Typography variant="h6">Reminders</Typography>
        <Stack spacing={0.75}>
          {props.schedule.reminders.map((r, idx) => (
            <Stack
              key={`${r.kind}-${idx}`}
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.60)', border: '1px solid', borderColor: 'divider' }}
            >
              <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                {r.kind}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {r.at.slice(0, 10)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function RevRecPanel(props: { revrec: RevRecSchedule; currency: string }) {
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
      <Stack spacing={1.25}>
        <Typography variant="h6">Revenue recognition</Typography>
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell align="right">Recognized</TableCell>
                <TableCell align="right">Deferred</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {props.revrec.months.map((m) => (
                <TableRow key={m.month} hover>
                  <TableCell sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>{m.month}</TableCell>
                  <TableCell align="right">
                    <Money amountMinor={m.recognizedMinor} currency={props.currency} />
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>
                    <Money amountMinor={m.deferredMinor} currency={props.currency} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Paper>
  );
}

function ArtifactsPanel(props: { runId: string; artifactIndex: ArtifactIndex }) {
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Evidence</Typography>
          <Button
            component="a"
            href={`/api/artifacts/${encodeURIComponent(props.runId)}`}
            target="_blank"
            rel="noreferrer"
            variant="outlined"
            endIcon={<OpenInNewRoundedIcon />}
          >
            Open index.json
          </Button>
        </Stack>
        <Stack spacing={0.75}>
          {props.artifactIndex.files.map((f) => (
            <Stack
              key={f.path}
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.60)', border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 650 }}>
                  {f.key}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    overflowWrap: 'anywhere'
                  }}
                >
                  {f.path}
                </Typography>
              </Box>
              <Chip size="small" label={f.contentType} variant="outlined" />
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function Kpi(props: { label: string; value: ReactNode }) {
  return (
    <Stack spacing={0.35} sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.1 }}>
        {props.label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 650, overflowWrap: 'anywhere' }}>
        {props.value}
      </Typography>
    </Stack>
  );
}

function SectionSubhead(props: { children: ReactNode }) {
  return (
    <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.1, display: 'block', mb: 0.75 }}>
      {props.children}
    </Typography>
  );
}

function KeyValueGrid(props: { items: Array<{ label: string; value: string }> }) {
  return (
    <Stack
      spacing={1}
      sx={{ p: 1.25, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.60)', border: '1px solid', borderColor: 'divider' }}
    >
      {props.items.map((it) => (
        <Stack key={it.label} direction="row" spacing={1} justifyContent="space-between" alignItems="baseline">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {it.label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 650,
              textAlign: 'right',
              overflowWrap: 'anywhere',
              maxWidth: '70%'
            }}
          >
            {it.value}
          </Typography>
        </Stack>
      ))}
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

function formatMinor(amountMinor: number, currency: string) {
  const sign = amountMinor < 0 ? '-' : '';
  const v = Math.abs(amountMinor);
  const major = Math.floor(v / 100);
  const minor = String(v % 100).padStart(2, '0');
  return `${sign}${currency} ${major}.${minor}`;
}

