"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validateClaim } from "@/lib/claim-validation";
import type { ClaimFormData, ClaimRecord, ExtractedClaim, SessionUser } from "@/types/claim";

type Screen = "start" | "manual-patient" | "manual-claim" | "pdf-upload" | "review" | "validation" | "preview" | "history";
type Props = {
  user: SessionUser;
  initialClaims: ClaimRecord[];
  services: { database: string; storage: string; ai: string };
  loadError: string;
};

const emptyForm: ClaimFormData = {
  source: "manual", sourceDocumentId: null, patientFirstName: "", patientLastName: "", dateOfBirth: "", gender: "", address: "",
  insuranceProvider: "", memberId: "", groupNumber: "", providerName: "", providerNpi: "", serviceDate: "",
  diagnosisCode: "", procedureCode: "", placeOfService: "11", chargeAmount: "", clinicalNote: "",
};

const demoForm: ClaimFormData = {
  source: "manual", sourceDocumentId: null, patientFirstName: "Ayesha", patientLastName: "Khan", dateOfBirth: "1991-06-14", gender: "Female",
  address: "42 Demo Street, Lahore", insuranceProvider: "BlueCross Demo Plan", memberId: "BC-2048917", groupNumber: "GRP-7712",
  providerName: "Dr Sarah Ahmed", providerNpi: "1487654321", serviceDate: "2026-10-13", diagnosisCode: "M54.50",
  procedureCode: "99213", placeOfService: "11", chargeAmount: "125.00", clinicalNote: "Synthetic office visit for lower back pain assessment.",
};

const stepLabels = ["Start", "Patient / data", "Claim", "Validate", "CMS preview"];

function stepFor(screen: Screen) {
  if (screen === "start" || screen === "history") return 0;
  if (screen === "manual-patient" || screen === "pdf-upload") return 1;
  if (screen === "manual-claim" || screen === "review") return 2;
  if (screen === "validation") return 3;
  return 4;
}

function Field({ label, value, onChange, type = "text", required = false, hint, className = "" }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; hint?: string; className?: string;
}) {
  return <label className={`d1-field ${className}`}><span>{label}{required && <b aria-hidden="true"> *</b>}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />{hint && <small>{hint}</small>}</label>;
}

export function ClaimWorkspace({ user, initialClaims, services, loadError }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [screen, setScreen] = useState<Screen>("start");
  const [form, setForm] = useState<ClaimFormData>(emptyForm);
  const [claims, setClaims] = useState(initialClaims);
  const [savedClaim, setSavedClaim] = useState<ClaimRecord | null>(null);
  const [checks, setChecks] = useState<ReturnType<typeof validateClaim>["checks"]>([]);
  const [busy, setBusy] = useState<"extract" | "save" | "logout" | "">("");
  const [message, setMessage] = useState(loadError);
  const [extraction, setExtraction] = useState<ExtractedClaim["extraction"] | null>(null);
  const [fileName, setFileName] = useState("");
  const currentStep = stepFor(screen);
  const failedErrors = checks.filter((check) => !check.passed && check.severity === "error");
  const update = <K extends keyof ClaimFormData>(key: K, value: ClaimFormData[K]) => setForm((current) => ({ ...current, [key]: value }));
  const claimCounts = useMemo(() => ({ validated: claims.filter((claim) => claim.status === "validated").length, review: claims.filter((claim) => claim.status === "needs_review").length }), [claims]);

  function startManual() {
    setForm({ ...emptyForm, source: "manual" }); setSavedClaim(null); setChecks([]); setMessage(""); setScreen("manual-patient");
  }

  function startPdf() {
    setForm({ ...emptyForm, source: "pdf" }); setSavedClaim(null); setChecks([]); setMessage(""); setExtraction(null); setFileName(""); setScreen("pdf-upload");
  }

  function startOver() {
    setForm(emptyForm); setSavedClaim(null); setChecks([]); setMessage(""); setExtraction(null); setFileName(""); setScreen("start");
  }

  async function extractPdf(event: React.FormEvent) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setMessage("Choose a synthetic claim PDF first."); return; }
    setBusy("extract"); setMessage("");
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch("/api/claims/extract", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not extract the PDF");
      const extracted = payload.claim as ExtractedClaim;
      setForm({ ...emptyForm, ...extracted, source: "pdf", sourceDocumentId: extracted.sourceDocumentId });
      setExtraction(extracted.extraction); setFileName(extracted.fileName); setScreen("review");
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(""); }
  }

  async function validateAndSave() {
    const validation = validateClaim(form);
    setChecks(validation.checks); setSavedClaim(null); setMessage(""); setScreen("validation");
    if (validation.errors.length) return;
    setBusy("save");
    try {
      const response = await fetch("/api/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save the claim");
      setSavedClaim(payload.claim); setClaims((current) => [payload.claim, ...current]); setChecks(payload.claim.checks);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(""); }
  }

  async function logout() {
    setBusy("logout"); await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined); router.push("/login"); router.refresh();
  }

  function openClaim(claim: ClaimRecord) {
    setForm(claim); setSavedClaim(claim); setChecks(claim.checks); setScreen("preview");
  }

  return <main className="d1-app">
    <header className="d1-header">
      <button className="d1-brand" onClick={startOver}><b>M</b><span><strong>MedBill</strong><small>D1 Claim Workspace</small></span></button>
      <span className="d1-scope-badge">D1 WORKING PROTOTYPE</span>
      <nav>
        <button onClick={() => setScreen("history")}>Claims <span>{claims.length}</span></button>
        {user.role === "admin" && <a href="/technical">Technical evidence</a>}
        <button className="d1-user-menu" onClick={logout} disabled={busy === "logout"}>{user.name} · Sign out</button>
      </nav>
    </header>

    <div className="d1-scope-strip"><strong>D1 boundary:</strong> Create, review and validate a synthetic draft claim. No payer submission, payment posting or insurer approval.</div>

    <div className="d1-shell">
      <ol className="d1-steps" aria-label="D1 claim progress">{stepLabels.map((label, index) => <li key={label} className={index === currentStep ? "active" : index < currentStep ? "complete" : ""}><span>{index < currentStep ? "✓" : index + 1}</span>{label}</li>)}</ol>
      {message && <div className="d1-alert error" role="alert">{message}</div>}

      {screen === "start" && <>
        <section className="d1-hero">
          <div><span className="d1-eyebrow">PROPOSAL-ALIGNED D1 FLOW</span><h1>Create a claim from a form or a PDF.</h1><p>Both paths produce the same editable claim, validation result and CMS-1500-style preview.</p></div>
          <dl><div><dt>{claims.length}</dt><dd>saved drafts</dd></div><div><dt>{claimCounts.validated}</dt><dd>validated</dd></div><div><dt>{claimCounts.review}</dt><dd>need review</dd></div></dl>
        </section>
        <section className="d1-choice-grid">
          <article className="d1-choice featured"><span className="d1-chip success">RECOMMENDED DEMO</span><i>PDF</i><h2>Upload a claim PDF</h2><p>Read embedded text or OCR a scan, then review the extracted patient, insurance and service fields.</p><ul><li>PDF extraction and OCR</li><li>Human correction before validation</li><li>Original PDF retained in R2</li></ul><button className="d1-primary" onClick={startPdf}>Upload PDF claim</button></article>
          <article className="d1-choice"><i>+</i><h2>Enter a claim manually</h2><p>Add a patient, insurance information and one service line when no source PDF exists.</p><ul><li>Patient and insurance record</li><li>ICD-10/CPT and charge entry</li><li>Same validation and preview</li></ul><button className="d1-secondary" onClick={startManual}>Enter manually</button></article>
        </section>
        <section className="d1-later"><h2>What remains after D1</h2><div><span>Payment posting</span><span>Denial management</span><span>Financial reports</span><span>Measured ML model</span></div></section>
      </>}

      {screen === "pdf-upload" && <section className="d1-two-column">
        <form className="d1-card" onSubmit={extractPdf}><span className="d1-eyebrow">PDF INPUT</span><h1>Upload a synthetic claim PDF</h1><p className="d1-lead">MedBill tries embedded text first and runs local OCR only when a page has little readable text.</p><label className="d1-upload"><input ref={fileRef} type="file" accept="application/pdf,.pdf" required /><b>Choose a claim PDF</b><span>PDF only · maximum 4 MB · synthetic data only</span></label><div className="d1-actions"><button type="button" className="d1-secondary" onClick={() => setScreen("start")}>Back</button><button className="d1-primary" disabled={busy === "extract"}>{busy === "extract" ? "Extracting PDF…" : "Extract claim information"}</button></div></form>
        <aside className="d1-card d1-explainer"><h2>What the system does</h2><ol><li><b>Reads</b><span>Embedded PDF text or OCR</span></li><li><b>Extracts</b><span>Patient, insurance, codes, date and amount</span></li><li><b>Asks you to review</b><span>Nothing is accepted blindly</span></li></ol></aside>
      </section>}

      {screen === "manual-patient" && <section className="d1-two-column">
        <form className="d1-card" onSubmit={(event) => { event.preventDefault(); setScreen("manual-claim"); }}><span className="d1-eyebrow">MANUAL PATH · PATIENT</span><div className="d1-title-actions"><div><h1>Patient and insurance</h1><p className="d1-lead">Enter the minimum information required to identify the patient and policy.</p></div><button type="button" className="d1-text-button" onClick={() => setForm(demoForm)}>Use demo data</button></div><div className="d1-form-grid"><Field label="First name" value={form.patientFirstName} onChange={(v) => update("patientFirstName", v)} required /><Field label="Last name" value={form.patientLastName} onChange={(v) => update("patientLastName", v)} required /><Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} required /><Field label="Gender" value={form.gender} onChange={(v) => update("gender", v)} /><Field label="Insurance provider" value={form.insuranceProvider} onChange={(v) => update("insuranceProvider", v)} required /><Field label="Member ID" value={form.memberId} onChange={(v) => update("memberId", v)} required /><Field label="Group number" value={form.groupNumber} onChange={(v) => update("groupNumber", v)} /><Field label="Address" value={form.address} onChange={(v) => update("address", v)} className="full" /></div><div className="d1-actions"><button type="button" className="d1-secondary" onClick={() => setScreen("start")}>Back</button><button className="d1-primary">Continue to claim</button></div></form>
        <aside className="d1-card d1-explainer"><h2>D1 evidence</h2><p>This creates the basic patient and insurance information promised in the proposal. Advanced search and eligibility checks remain later work.</p></aside>
      </section>}

      {screen === "manual-claim" && <section className="d1-two-column">
        <form className="d1-card" onSubmit={(event) => { event.preventDefault(); setScreen("review"); }}><span className="d1-eyebrow">MANUAL PATH · CLAIM</span><h1>Enter one service line</h1><p className="d1-lead">D1 demonstrates one basic draft claim, not the entire billing lifecycle.</p><ClaimFields form={form} update={update} /><div className="d1-actions"><button type="button" className="d1-secondary" onClick={() => setScreen("manual-patient")}>Back</button><button className="d1-primary">Review claim</button></div></form>
        <aside className="d1-card d1-explainer"><h2>Basic checks</h2><ul><li>Required fields are present</li><li>ICD-10 format looks valid</li><li>CPT/HCPCS has five characters</li><li>Charge is greater than zero</li></ul></aside>
      </section>}

      {screen === "review" && <section className="d1-two-column wide-main">
        <div className="d1-card"><span className="d1-eyebrow">HUMAN REVIEW</span><h1>Review the complete claim</h1><p className="d1-lead">{form.source === "pdf" ? "Correct any OCR or extraction mistakes before validation." : "Confirm the patient, insurance and service information."}</p>{form.source === "pdf" && <div className="d1-source-banner"><b>{fileName || "Uploaded claim PDF"}</b><span>{extraction?.pages} page{extraction?.pages === 1 ? "" : "s"} · {extraction?.source} extraction{extraction?.averageConfidence === null || extraction?.averageConfidence === undefined ? "" : ` · ${Math.round(extraction.averageConfidence * 100)}% OCR confidence`}</span></div>}<div className="d1-review-section"><h2>Patient and insurance</h2><div className="d1-form-grid"><Field label="First name" value={form.patientFirstName} onChange={(v) => update("patientFirstName", v)} required /><Field label="Last name" value={form.patientLastName} onChange={(v) => update("patientLastName", v)} required /><Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} required /><Field label="Insurance provider" value={form.insuranceProvider} onChange={(v) => update("insuranceProvider", v)} required /><Field label="Member ID" value={form.memberId} onChange={(v) => update("memberId", v)} required /><Field label="Group number" value={form.groupNumber} onChange={(v) => update("groupNumber", v)} /></div></div><div className="d1-review-section"><h2>Claim details</h2><ClaimFields form={form} update={update} /></div><div className="d1-actions"><button className="d1-secondary" onClick={() => setScreen(form.source === "pdf" ? "pdf-upload" : "manual-claim")}>Back</button><button className="d1-primary" onClick={validateAndSave} disabled={busy === "save"}>{busy === "save" ? "Saving claim…" : "Validate and save draft"}</button></div></div>
        <aside className="d1-card d1-explainer"><h2>Human-in-the-loop</h2><p>The PDF is only an input method. The biller remains responsible for reviewing extracted values before the claim is validated.</p><div className="d1-mini-note">“Validated” means the D1 technical checks passed—not that a payer accepted the claim.</div></aside>
      </section>}

      {screen === "validation" && <section className="d1-two-column">
        <div className="d1-card"><span className={`d1-chip ${failedErrors.length ? "warning" : "success"}`}>{failedErrors.length ? `${failedErrors.length} REQUIRED FIX${failedErrors.length === 1 ? "" : "ES"}` : "BASIC VALIDATION PASSED"}</span><h1>Claim validation result</h1><p className="d1-lead">Every check is visible and explainable.</p><div className="d1-checks">{checks.map((check) => <div key={check.key} className={!check.passed ? "failed" : ""}><span><b>{check.label}</b><small>{check.passed ? "Check passed." : check.detail}</small></span><strong>{check.passed ? "Passed" : check.severity === "warning" ? "Review" : "Fix"}</strong></div>)}</div><div className="d1-actions"><button className="d1-secondary" onClick={() => setScreen("review")}>Edit claim</button>{savedClaim && <button className="d1-primary" onClick={() => setScreen("preview")}>Generate CMS-1500 preview</button>}</div></div>
        <aside className="d1-card d1-explainer"><h2>{savedClaim ? "Draft saved" : "Not saved yet"}</h2><p>{savedClaim ? `Claim ${savedClaim.claimNumber} is stored in PostgreSQL as a validated draft.` : "Fix the required fields, then run validation again. No incomplete claim has been saved."}</p><ul><li>No real insurer submission</li><li>No eligibility guarantee</li><li>No reimbursement decision</li></ul></aside>
      </section>}

      {screen === "preview" && <><section className="d1-preview-layout"><div className="d1-card"><span className="d1-chip success">D1 FLOW COMPLETE</span><h1>CMS-1500-style preview</h1><p className="d1-lead">The saved claim remains a demonstration draft.</p><dl className="d1-claim-summary"><div><dt>Claim number</dt><dd>{savedClaim?.claimNumber}</dd></div><div><dt>Status</dt><dd>{savedClaim?.status.replace("_", " ")}</dd></div><div><dt>Source</dt><dd>{form.source === "pdf" ? "Uploaded PDF" : "Manual entry"}</dd></div><div><dt>Total charge</dt><dd>${Number(form.chargeAmount || 0).toFixed(2)}</dd></div></dl><div className="d1-actions"><button className="d1-secondary" onClick={() => window.print()}>Print / Save PDF</button><button className="d1-primary" onClick={startOver}>Start another claim</button></div></div><CmsPreview form={form} /></section><section className="d1-later"><h2>Explicitly outside this D1</h2><div><span>Payer submission</span><span>Payment posting</span><span>Denial management</span><span>Financial reports</span><span>Trained ML model</span></div></section></>}

      {screen === "history" && <section className="d1-card"><div className="d1-title-actions"><div><span className="d1-eyebrow">POSTGRESQL RECORDS</span><h1>Saved D1 claims</h1><p className="d1-lead">Recent synthetic draft claims created through either input path.</p></div><button className="d1-primary" onClick={startOver}>New claim</button></div>{claims.length ? <div className="d1-claim-table"><div className="head"><span>Claim</span><span>Patient</span><span>Source</span><span>Status</span><span /></div>{claims.map((claim) => <div key={claim.id}><span><b>{claim.claimNumber}</b><small>{new Date(claim.createdAt).toLocaleString()}</small></span><span>{claim.patientFirstName} {claim.patientLastName}</span><span>{claim.source}</span><span className={claim.status}>{claim.status.replace("_", " ")}</span><button onClick={() => openClaim(claim)}>Open</button></div>)}</div> : <div className="d1-empty"><b>No saved claims yet</b><p>Create one manually or upload a synthetic claim PDF.</p></div>}</section>}
    </div>
    <footer className="d1-footer"><span>Connected: {services.database} · {services.storage}</span><span>OCR is local; extracted text may use {services.ai}.</span></footer>
  </main>;
}

function ClaimFields({ form, update }: { form: ClaimFormData; update: <K extends keyof ClaimFormData>(key: K, value: ClaimFormData[K]) => void }) {
  return <div className="d1-form-grid"><Field label="Service date" type="date" value={form.serviceDate} onChange={(v) => update("serviceDate", v)} required /><Field label="Billing provider" value={form.providerName} onChange={(v) => update("providerName", v)} required /><Field label="Provider NPI" value={form.providerNpi} onChange={(v) => update("providerNpi", v)} hint="10 digits" /><Field label="Place of service" value={form.placeOfService} onChange={(v) => update("placeOfService", v)} hint="Example: 11" /><Field label="ICD-10 diagnosis" value={form.diagnosisCode} onChange={(v) => update("diagnosisCode", v)} required /><Field label="CPT / HCPCS procedure" value={form.procedureCode} onChange={(v) => update("procedureCode", v)} required /><Field label="Charge amount" type="number" value={form.chargeAmount} onChange={(v) => update("chargeAmount", v)} required /><label className="d1-field full"><span>Clinical note</span><textarea rows={3} value={form.clinicalNote} onChange={(event) => update("clinicalNote", event.target.value)} /></label></div>;
}

function CmsPreview({ form }: { form: ClaimFormData }) {
  return <section className="d1-cms" aria-label="CMS-1500-style claim preview"><header><b>HEALTH INSURANCE CLAIM FORM</b><span>CMS-1500 STYLE · D1 PREVIEW</span></header><div className="d1-cms-grid"><div><small>1a INSURED&apos;S ID NUMBER</small><b>{form.memberId}</b></div><div><small>2 PATIENT&apos;S NAME</small><b>{form.patientLastName}, {form.patientFirstName}</b></div><div><small>3 PATIENT&apos;S BIRTH DATE</small><b>{form.dateOfBirth}</b></div><div><small>4 INSURED / PAYER</small><b>{form.insuranceProvider}</b></div><div className="wide"><small>5 PATIENT&apos;S ADDRESS</small><b>{form.address || "Not provided"}</b></div><div><small>21 DIAGNOSIS</small><b>{form.diagnosisCode}</b></div><div><small>24B PLACE OF SERVICE</small><b>{form.placeOfService || "—"}</b></div><div><small>24D PROCEDURE</small><b>{form.procedureCode}</b></div><div><small>24A SERVICE DATE</small><b>{form.serviceDate}</b></div><div><small>24F CHARGE</small><b>${Number(form.chargeAmount || 0).toFixed(2)}</b></div><div className="wide"><small>33 BILLING PROVIDER</small><b>{form.providerName}{form.providerNpi ? ` · NPI ${form.providerNpi}` : ""}</b></div></div><footer>Preview only · not submitted to an insurer</footer></section>;
}
