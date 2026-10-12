"use client";

import { useMemo, useRef, useState } from "react";
import type { DocumentClassification, DocumentRecord } from "@/types/document";

type Props = {
  initialDocuments: DocumentRecord[];
  services: { database: string; storage: string; ai: string };
  loadError: string;
};

const folders: Array<{ key: DocumentClassification; label: string; path: string }> = [
  { key: "accepted", label: "Accepted", path: "output/accepted/" },
  { key: "needs_review", label: "Needs review", path: "output/needs-review/" },
  { key: "rejected", label: "Rejected", path: "output/rejected/" },
  { key: "failed", label: "Failed", path: "output/failed/" },
];

const debugSteps = [
  { key: "read", label: "Read PDF", help: "Check the file" },
  { key: "ocr", label: "Get text", help: "Local extraction / OCR" },
  { key: "validate", label: "Validate fields", help: "Check required claim fields" },
  { key: "analyze", label: "AI extraction", help: "Inspect the provider response" },
  { key: "route", label: "Move to output", help: "Write the final folder and report" },
] as const;

function classificationOf(document: DocumentRecord): DocumentClassification {
  if (document.classification) return document.classification;
  if (document.status === "failed") return "failed";
  return "pending";
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function displayClassification(value: DocumentClassification) {
  return value.replace("_", " ");
}

export function DocumentWorkspace({ initialDocuments, services, loadError }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedId, setSelectedId] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<"upload" | "scan-batch" | "scan-all" | "debug" | "backup" | "reset" | "">("");
  const [message, setMessage] = useState(loadError);
  const [messageKind, setMessageKind] = useState<"success" | "error" | "info">(loadError ? "error" : "info");
  const [query, setQuery] = useState("");
  const [outputFilter, setOutputFilter] = useState<DocumentClassification>("accepted");
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [runMode, setRunMode] = useState<"simple" | "debug">("simple");
  const [debugSessions, setDebugSessions] = useState<string[]>([]);
  const [debugStep, setDebugStep] = useState(0);
  const [debugLog, setDebugLog] = useState<Array<{ step: string; title: string; details: unknown }>>([]);
  const [runProgress, setRunProgress] = useState<{ step: string; file: string; current: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetDialogRef = useRef<HTMLDialogElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const inspectorTitleRef = useRef<HTMLHeadingElement>(null);

  const selected = useMemo(() => documents.find((item) => item.id === selectedId) || null, [documents, selectedId]);
  const queue = useMemo(() => documents.filter((item) => classificationOf(item) === "pending"), [documents]);
  const visibleQueue = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? queue.filter((item) => item.name.toLowerCase().includes(normalized)) : queue;
  }, [queue, query]);
  const outputDocuments = useMemo(() => documents.filter((item) => classificationOf(item) === outputFilter), [documents, outputFilter]);
  const counts = useMemo(() => Object.fromEntries(["pending", "accepted", "needs_review", "rejected", "failed"].map((key) => [key, documents.filter((item) => classificationOf(item) === key).length])), [documents]);
  const scanning = busy === "scan-batch" || busy === "scan-all" || busy === "debug";
  const activeStep = busy === "debug" ? debugSteps[debugStep]?.key : runProgress?.step;

  function notify(text: string, kind: "success" | "error" | "info" = "info") {
    setMessage(text); setMessageKind(kind);
  }

  function inspectDocument(document: DocumentRecord, scroll = true) {
    setSelectedId(document.id);
    if (!scroll) return;
    window.requestAnimationFrame(() => {
      inspectorRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      inspectorTitleRef.current?.focus({ preventScroll: true });
    });
  }

  function toggleBatchSelection(id: string) {
    resetDebugRun();
    setSelectedBatchIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function resetDebugRun() {
    setDebugSessions([]);
    setDebugStep(0);
    setDebugLog([]);
  }

  async function refresh() {
    const response = await fetch("/api/documents", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not load documents");
    setDocuments(payload.documents);
    return payload.documents as DocumentRecord[];
  }

  async function upload(file: File) {
    setBusy("upload"); setMessage("");
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch("/api/documents", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Upload failed");
      setDocuments((current) => [payload.document, ...current]);
      inspectDocument(payload.document, false);
      notify(`${file.name} was added to input/. Review it, then scan the file.`, "success");
    } catch (error) { notify((error as Error).message, "error"); }
    finally { setBusy(""); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function scanInputFolder(ids?: string[]) {
    if (ids ? !ids.length : !queue.length) return;
    const isBatch = Boolean(ids);
    setBusy(isBatch ? "scan-batch" : "scan-all"); setMessage(""); setRunProgress(null);
    try {
      const chosen = ids || queue.map((document) => document.id);
      const results: { processed: DocumentRecord[]; failures: unknown[] } = { processed: [], failures: [] };
      for (const [index, id] of chosen.entries()) {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!response.ok) { const error = await response.json(); throw new Error(error.error || "Folder scan failed"); }
      if (!response.body) throw new Error("The server did not return progress data");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      let payload: { processed: DocumentRecord[]; failures: unknown[] } | null = null;
      while (true) {
        const { value, done } = await reader.read();
        pending += decoder.decode(value, { stream: !done });
        const lines = pending.split("\n"); pending = lines.pop() || "";
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.type === "progress") setRunProgress({ ...event, current: index + 1, total: chosen.length });
          if (event.type === "done") payload = event;
          if (event.type === "error") throw new Error(event.error);
        }
        if (done) break;
      }
      if (!payload) throw new Error("Processing ended without a result. Refresh to check the files.");
      results.processed.push(...payload.processed);
      results.failures.push(...payload.failures);
      }
      await refresh();
      if (ids) setSelectedBatchIds((current) => current.filter((id) => !ids.includes(id)));
      else setSelectedBatchIds([]);
      notify(`${isBatch ? "Selected batch" : "Input folder"} finished: ${results.processed.length} routed, ${results.failures.length} failed.`, results.failures.length ? "info" : "success");
      if (results.processed[0]) { setOutputFilter(classificationOf(results.processed[0])); }
    } catch (error) { await refresh().catch(() => undefined); notify((error as Error).message, "error"); }
    finally { setBusy(""); setRunProgress(null); }
  }

  async function runDebugNext() {
    if (!selectedBatchIds.length || debugStep >= debugSteps.length) return;
    setBusy("debug"); setMessage("");
    try {
      let sessionIds = debugSessions;
      if (!sessionIds.length) {
        sessionIds = [];
        for (const id of selectedBatchIds) {
          const startResponse = await fetch("/api/debug", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", ids: [id] }) });
          const startPayload = await startResponse.json();
          if (!startResponse.ok) throw new Error(startPayload.error || "Could not start debug mode");
          sessionIds.push(startPayload.sessionId);
        }
        setDebugSessions(sessionIds);
      }
      const step = debugSteps[debugStep].key;
      const payload: { title: string; details: unknown[]; documents: DocumentRecord[] } = { title: "", details: [], documents: [] };
      for (const sessionId of sessionIds) {
        const response = await fetch("/api/debug", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, step }) });
        const item = await response.json();
        if (!response.ok) throw new Error(item.error || `${debugSteps[debugStep].label} failed`);
        payload.title = item.title;
        payload.details.push(...item.details);
        payload.documents.push(...(item.documents || []));
      }
      setDebugLog((current) => [...current, { step, title: payload.title, details: payload.details }]);
      const nextStep = debugStep + 1;
      setDebugStep(nextStep);
      notify(`${payload.title}. ${nextStep < debugSteps.length ? "Review the details, then run the next step." : "Debug flow finished."}`, "success");
      if (step === "route") {
        const refreshed = await refresh();
        setSelectedBatchIds([]);
        const first = refreshed.find((item) => payload.documents?.some((routed: DocumentRecord) => routed.id === item.id));
        if (first) { setSelectedId(first.id); setOutputFilter(classificationOf(first)); }
      }
    } catch (error) { notify((error as Error).message, "error"); }
    finally { setBusy(""); }
  }

  async function createBackup() {
    setBusy("backup"); setMessage("");
    try {
      const response = await fetch("/api/backup", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Backup failed");
      notify(`Backup created at ${payload.backup.prefix} (${payload.backup.count} files).`, "success");
    } catch (error) { notify((error as Error).message, "error"); }
    finally { setBusy(""); }
  }

  async function resetWorkspace() {
    setBusy("reset"); setMessage("");
    try {
      const response = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: resetConfirmation }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Reset failed");
      setDocuments(payload.documents); setSelectedId(""); setSelectedBatchIds([]); setOutputFilter("accepted"); setResetConfirmation("");
      resetDialogRef.current?.close();
      notify(`Workflow reset. ${payload.reset} files are back in input/ and every output folder is empty. Backup: ${payload.backup.prefix}`, "success");
    } catch (error) { notify((error as Error).message, "error"); }
    finally { setBusy(""); }
  }

  function downloadReport(document: DocumentRecord) {
    if (!document.result) return;
    const anchor = window.document.createElement("a");
    anchor.href = `/api/documents/${document.id}/report`;
    anchor.download = "";
    window.document.body.append(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <main>
      <a className="skip-link" href="#workspace">Skip to workspace</a>
      <header className="app-header">
        <a className="brand" href="#" aria-label="MedBill Document Router home"><span className="brand-mark">MB</span><span><strong>MedBill</strong><small>Document Router</small></span></a>
        <div className={`header-status${loadError ? " error" : ""}`}><span className="status-indicator" />{loadError ? "Pipeline unavailable" : "Pipeline ready"} <button type="button" popoverTarget="system-status">System details</button></div>
        <div id="system-status" popover="auto" className="system-popover"><strong>Connected services</strong><span>Metadata: {services.database}</span><span>Files: {services.storage}</span><span>OCR: Node.js · Tesseract</span><span>AI: {services.ai}</span><span>AI receives extracted text only.</span><span>Backups: backups/&lt;timestamp&gt;/</span></div>
      </header>

      <div className="page-shell" id="workspace">
        <div className="page-title-row">
          <div><h1>Process PDFs</h1><p>Pick your files. Run the flow. Review the results.</p></div>
          <details className="workspace-tools"><summary>Workspace tools</summary><div className="page-actions">
            <button className="button secondary-button" onClick={createBackup} disabled={Boolean(busy)}>{busy === "backup" ? "Creating backup…" : "Create backup"}</button>
            <button className="button danger-button" onClick={() => resetDialogRef.current?.showModal()} disabled={Boolean(busy)}>Reset workspace</button>
          <p>Reset restores all PDFs to input and clears output. A backup is saved first.</p></div></details>
        </div>

        <section className="pipeline-map" aria-labelledby="pipeline-title">
          <h2 id="pipeline-title" className="sr-only">Storage pipeline</h2>
          <div className="pipeline-node input-node">
            <div className="input-node-main"><span className="folder-icon" aria-hidden="true" /><div><strong>Input <code>input/</code></strong><span>{counts.pending} file{counts.pending === 1 ? "" : "s"} available · {selectedBatchIds.length} selected</span></div></div>
            <div className="pipeline-source-actions">
              <label className="compact-upload"><input ref={inputRef} aria-label="Add PDF to input folder" type="file" accept="application/pdf,.pdf" disabled={Boolean(busy)} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file); }} /><span>{busy === "upload" ? "Adding…" : "+ Add PDF"}</span></label>
            </div>
            <div className="inline-picker">
              <div className="inline-picker-head"><input aria-label="Filter files in input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files…" /><div className="picker-actions"><button type="button" onClick={() => { resetDebugRun(); setSelectedBatchIds(queue.map((item) => item.id)); }} disabled={!queue.length || Boolean(busy)}>Select all</button><button type="button" onClick={() => { resetDebugRun(); setSelectedBatchIds([]); }} disabled={!selectedBatchIds.length || Boolean(busy)}>Clear</button></div></div>
              <div className="inline-file-list" aria-label="Input folder files">{visibleQueue.length ? visibleQueue.map((document) => <label key={document.id} className={selectedBatchIds.includes(document.id) ? "chosen" : ""}><input type="checkbox" checked={selectedBatchIds.includes(document.id)} onChange={() => toggleBatchSelection(document.id)} disabled={Boolean(busy)} /><span><strong>{document.name}</strong><small>{formatSize(document.size)} · {formatDate(document.createdAt)}</small></span><button type="button" onClick={(event) => { event.preventDefault(); inspectDocument(document); }}>Preview</button></label>) : <div className="picker-empty">No PDFs match this search.</div>}</div>
            </div>
            <div className="source-scan-action"><div className="run-controls"><div className="run-mode-switch" aria-label="Run mode"><button type="button" disabled={Boolean(busy)} aria-pressed={runMode === "simple"} onClick={() => { setRunMode("simple"); resetDebugRun(); }}>Complete flow</button><button type="button" disabled={Boolean(busy)} aria-pressed={runMode === "debug"} onClick={() => { setRunMode("debug"); resetDebugRun(); }}>Debug step-by-step</button></div><span className="run-selection">{selectedBatchIds.length ? `${selectedBatchIds.length} selected` : "Select files to begin"}</span>{runMode === "simple" ? <button className="button run-flow-button" onClick={() => scanInputFolder(selectedBatchIds)} disabled={!selectedBatchIds.length || Boolean(busy)}>{scanning ? <><i className="mini-spinner light" />Running flow…</> : <>Run complete flow <span aria-hidden="true">→</span></>}</button> : <button className="button run-flow-button debug-run" onClick={runDebugNext} disabled={!selectedBatchIds.length || Boolean(busy) || debugStep >= debugSteps.length}>{busy === "debug" ? <><i className="mini-spinner light" />Running {debugSteps[debugStep]?.label}…</> : debugStep >= debugSteps.length ? "Debug complete" : debugStep === 0 ? "Start debug flow" : `Run next: ${debugSteps[debugStep].label}`}</button>}</div></div>
            {runMode === "simple" && <div className="flow-progress" aria-label="Processing steps" aria-live="polite">{debugSteps.map((step, index) => <span key={step.key} className={scanning && activeStep === step.key ? "active" : scanning && debugSteps.findIndex((item) => item.key === activeStep) > index ? "complete" : ""}>{scanning && activeStep === step.key ? <i className="mini-spinner" /> : <b>{index + 1}</b>}{step.label}</span>)}{runProgress && <small>{runProgress.current}/{runProgress.total} · {runProgress.file}</small>}</div>}
            {runMode === "debug" && <div className="debug-console">
              <div className="debug-console-head"><div><small>DEBUG MODE</small><strong>Control and inspect every stage</strong></div><span>{debugStep}/{debugSteps.length} complete</span></div>
              <ol className="debug-step-list">{debugSteps.map((step, index) => <li key={step.key} className={index < debugStep ? "complete" : index === debugStep ? "current" : "pending"}><span>{index < debugStep ? "✓" : busy === "debug" && index === debugStep ? <i className="mini-spinner light" /> : index + 1}</span><div><strong>{step.label}</strong><small>{busy === "debug" && index === debugStep ? "Running…" : step.help}</small></div><b>{index < debugStep ? "Done" : index === debugStep ? "Next" : "Waiting"}</b></li>)}</ol>
              {debugLog.length > 0 && <div className="debug-log">{debugLog.map((entry) => <details key={entry.step} open={entry.step === debugLog.at(-1)?.step}><summary>{entry.title}<span>View data</span></summary><pre>{JSON.stringify(entry.details, null, 2)}</pre></details>)}</div>}
            </div>}
          </div>
        </section>

        {message && <div className={`notice ${messageKind}`} role={messageKind === "error" ? "alert" : "status"}>{message}</div>}

        {selected && <section className="work-grid single-panel">
          <section ref={inspectorRef} className="inspector-panel" aria-labelledby="inspector-title">
            <div className="panel-heading"><div><h2 ref={inspectorTitleRef} tabIndex={-1} id="inspector-title">{selected.name}</h2></div><div className="inspector-actions"><span className={`route-status ${classificationOf(selected)}`}>{displayClassification(classificationOf(selected))}</span><button type="button" onClick={() => setSelectedId("")} aria-label="Close file details">✕</button></div></div>
            {selected ? (
              <>
                <dl className="file-facts"><div><dt>Current path</dt><dd><code>{selected.storageKey}</code></dd></div><div><dt>Size</dt><dd>{formatSize(selected.size)}</dd></div><div><dt>Added</dt><dd>{formatDate(selected.createdAt)}</dd></div></dl>
                {classificationOf(selected) === "pending" ? (
                  <>
                    <details className="rules-box"><summary>What gets checked?</summary><ul><li>Readable PDF text</li><li>Insurance/member ID</li><li>ICD-style diagnosis code</li><li>Five-character procedure code</li><li>Positive claim amount</li><li>Service date and provider identity</li></ul></details>
                    <p className="inspector-hint">To process this PDF alone, select it in input and press Run.</p>
                    <a className="button secondary-button" href={`/api/documents/${selected.id}/file`} target="_blank" rel="noreferrer">Open PDF</a>
                  </>
                ) : (
                  <>
                    <div className="destination-box"><span className="folder-icon" aria-hidden="true" /><div><small>DESTINATION</small><strong>{selected.destinationFolder || "output/failed"}/</strong></div></div>
                    <div className="reason-list"><strong>Routing reasons</strong>{selected.validationReasons?.length ? <ul>{selected.validationReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <p>All required checks passed.</p>}</div>
                    {selected.result && <details className="report-preview"><summary>Show extraction report</summary><div className="report-meta">Processed by {selected.provider || "configured extraction provider"}</div><pre>{selected.result}</pre></details>}
                    <div className="action-row"><a className="button secondary-button" href={`/api/documents/${selected.id}/file`} target="_blank" rel="noreferrer">Open PDF</a><button className="button secondary-button" onClick={() => downloadReport(selected)} disabled={!selected.result}>Download report</button></div>
                  </>
                )}
              </>
            ) : <div className="empty-state large"><span aria-hidden="true">02</span><strong>Nothing open yet</strong><p>Click a filename to review one document. Use the checkboxes when you want to build a multi-file batch.</p></div>}
          </section>
        </section>}

        <section className="outputs-panel" id="outputs" aria-labelledby="outputs-title">
          <div className="panel-heading"><h2 id="outputs-title">Results</h2><code>{folders.find((folder) => folder.key === outputFilter)?.path}</code></div>
          <div className="output-tabs" aria-label="Output folders">{folders.map((folder) => <button aria-pressed={outputFilter === folder.key} className={outputFilter === folder.key ? "active" : ""} key={folder.key} onClick={() => setOutputFilter(folder.key)}>{folder.label}<span>{counts[folder.key]}</span></button>)}</div>
          {outputDocuments.length ? (
            <div className="table-wrap"><table><thead><tr><th>File</th><th>Reason</th><th>Details</th></tr></thead><tbody>{outputDocuments.map((document) => <tr key={document.id} className={selectedId === document.id ? "selected-row" : ""}><td><button className="file-link" onClick={() => inspectDocument(document)}>{document.name}</button><small>{formatSize(document.size)}</small></td><td>{document.validationReasons?.[0] || "All required checks passed"}</td><td><button className="row-action" onClick={() => inspectDocument(document)} aria-label={`Inspect ${document.name}`}>Inspect</button></td></tr>)}</tbody></table></div>
          ) : <div className="empty-output"><span className="folder-icon" aria-hidden="true" /><strong>No files in this folder</strong><p>Files will appear here after the backend finishes routing them.</p></div>}
        </section>
      </div>

      <dialog ref={resetDialogRef} className="reset-dialog" onClose={() => setResetConfirmation("")}>
        <form method="dialog" onSubmit={(event) => event.preventDefault()}>
          <div className="dialog-warning" aria-hidden="true">!</div>
          <div><p className="kicker">WORKSPACE MAINTENANCE</p><h2>Reset input and output folders?</h2></div>
          <p>This creates a timestamped copy under <code>backups/</code>, moves every routed file from <code>output/</code> back to <code>input/</code>, and clears previous routing decisions so the full batch can run again.</p>
          <label htmlFor="reset-confirmation">Type <strong>RESET</strong> to confirm</label>
          <input id="reset-confirmation" autoComplete="off" value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} placeholder="RESET" />
          <div className="dialog-actions">
            <button className="button secondary-button" type="button" onClick={() => resetDialogRef.current?.close()} disabled={busy === "reset"}>Cancel</button>
            <button className="button danger-button" type="button" onClick={resetWorkspace} disabled={resetConfirmation !== "RESET" || Boolean(busy)}>{busy === "reset" ? "Backing up and re-queuing…" : "Back up and reset run"}</button>
          </div>
        </form>
      </dialog>
    </main>
  );
}
