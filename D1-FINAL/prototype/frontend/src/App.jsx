import { useEffect, useState } from "react";
import { request } from "./api";

const emptyPatient = { first_name: "", last_name: "", date_of_birth: "", phone: "", insurer_name: "", member_id: "" };
const emptyClaim = { patient: "", diagnosis_code: "", procedure_code: "", amount: "", service_date: new Date().toISOString().slice(0, 10) };

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "biller", password: "MedBillD1!" });
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); setError("");
    try {
      const data = await request("/auth/login/", { method: "POST", body: JSON.stringify(form) });
      localStorage.setItem("medbill-token", data.token); onLogin(data.user);
    } catch (problem) { setError(problem.message); }
  }
  return <main className="login-shell">
    <section className="login-story">
      <div className="brand"><span>MB</span> MedBill</div>
      <p className="eyebrow">FYDP D1 PROTOTYPE</p>
      <h1>Cleaner claims.<br />Clearer revenue.</h1>
      <p>One proposal-aligned workflow for patient registration, claim preparation, and explainable pre-submission checks.</p>
      <div className="scope-note"><strong>Presentation scope</strong><span>Working vertical slice with synthetic data. Payments, reports, PDF export, and ML follow in Semester 8.</span></div>
    </section>
    <section className="login-panel">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">WELCOME BACK</p><h2>Sign in to MedBill</h2><p>Use the prefilled Biller account for the D1 demonstration.</p>
        <label>Username<input className="form-control" value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} /></label>
        <label>Password<input className="form-control" type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <button className="btn btn-primary w-100">Sign in</button>
        <small>Admin: admin / MedBillD1! &nbsp; Biller: biller / MedBillD1!</small>
      </form>
    </section>
  </main>;
}

function Metric({ label, value, tone }) {
  return <article className={`metric ${tone || ""}`}><span>{label}</span><strong>{value}</strong></article>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [patients, setPatients] = useState([]);
  const [claims, setClaims] = useState([]);
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [claimForm, setClaimForm] = useState(emptyClaim);
  const [notice, setNotice] = useState("");

  async function load() {
    const [me, stats, patientData, claimData] = await Promise.all([
      request("/auth/me/"), request("/dashboard/"), request("/patients/"), request("/claims/"),
    ]);
    setUser(me); setDashboard(stats); setPatients(patientData); setClaims(claimData);
  }
  useEffect(() => { if (localStorage.getItem("medbill-token")) load().catch(() => localStorage.removeItem("medbill-token")); }, []);

  async function createPatient(event) {
    event.preventDefault();
    const created = await request("/patients/", { method: "POST", body: JSON.stringify(patientForm) });
    setPatients([created, ...patients]); setPatientForm(emptyPatient); setNotice("Patient and insurance record saved."); setView("patients");
    setDashboard(await request("/dashboard/"));
  }
  async function createClaim(event) {
    event.preventDefault();
    const created = await request("/claims/", { method: "POST", body: JSON.stringify(claimForm) });
    setClaims([created, ...claims]); setClaimForm(emptyClaim); setNotice(created.status === "ready" ? "Claim passed all D1 validation rules." : "Claim saved for correction. Review the validation messages."); setView("claims");
    setDashboard(await request("/dashboard/"));
  }
  async function signOut() {
    await request("/auth/logout/", { method: "POST" }); localStorage.removeItem("medbill-token"); setUser(null);
  }

  if (!user) return <Login onLogin={(loggedInUser) => { setUser(loggedInUser); load(); }} />;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span>MB</span> MedBill</div>
      <nav>
        {[["dashboard", "Overview"], ["patients", "Patients"], ["new-patient", "Register patient"], ["claims", "Claims"], ["new-claim", "Create claim"]].map(([key, label]) => <button key={key} className={view === key ? "active" : ""} onClick={() => { setView(key); setNotice(""); }}>{label}</button>)}
      </nav>
      <div className="user-card"><strong>{user.username}</strong><span>{user.role}</span><button onClick={signOut}>Sign out</button></div>
    </aside>
    <main className="content">
      <header><div><p className="eyebrow">MEDBILL D1 REBUILD</p><h1>{({ dashboard: "Revenue cycle overview", patients: "Patient registry", "new-patient": "Register patient", claims: "Claim worklist", "new-claim": "Create claim" })[view]}</h1></div><span className="demo-badge">Synthetic demo data</span></header>
      {notice && <div className="alert alert-success">{notice}</div>}
      {view === "dashboard" && dashboard && <>
        <section className="metrics"><Metric label="Patients" value={dashboard.patients} /><Metric label="Claims" value={dashboard.claims} /><Metric label="Ready" value={dashboard.ready} tone="good" /><Metric label="Needs attention" value={dashboard.needs_attention} tone="warn" /><Metric label="Draft billed value" value={`$${Number(dashboard.billed).toFixed(2)}`} /></section>
        <section className="panel"><div><p className="eyebrow">D1 STORY</p><h2>What this prototype proves</h2></div><div className="flow"><span>1 Patient</span><b>→</b><span>2 Insurance</span><b>→</b><span>3 Claim</span><b>→</b><span>4 Validation</span></div><p>The browser sends structured data to Django. The backend stores it in a relational database, runs deterministic checks, and returns an auditable result. This establishes the architecture before financial posting and ML are added.</p></section>
      </>}
      {view === "patients" && <section className="panel"><div className="panel-heading"><div><p className="eyebrow">MASTER RECORDS</p><h2>{patients.length} patients</h2></div><button className="btn btn-primary" onClick={() => setView("new-patient")}>Add patient</button></div><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Patient</th><th>Date of birth</th><th>Insurer</th><th>Member ID</th></tr></thead><tbody>{patients.map(patient => <tr key={patient.id}><td><strong>{patient.full_name}</strong><small>{patient.phone || "No phone"}</small></td><td>{patient.date_of_birth}</td><td>{patient.insurer_name}</td><td><code>{patient.member_id}</code></td></tr>)}</tbody></table></div></section>}
      {view === "new-patient" && <section className="panel form-panel"><p className="eyebrow">PATIENT AND COVERAGE</p><h2>Capture the minimum claim identity</h2><form onSubmit={createPatient} className="form-grid">{Object.entries({ first_name: "First name", last_name: "Last name", date_of_birth: "Date of birth", phone: "Phone", insurer_name: "Insurer", member_id: "Member ID" }).map(([key, label]) => <label key={key}>{label}<input required={key !== "phone"} type={key === "date_of_birth" ? "date" : "text"} className="form-control" value={patientForm[key]} onChange={event => setPatientForm({ ...patientForm, [key]: event.target.value })} /></label>)}<button className="btn btn-primary">Save patient</button></form></section>}
      {view === "claims" && <section className="panel"><div className="panel-heading"><div><p className="eyebrow">VALIDATION WORKLIST</p><h2>{claims.length} claim drafts</h2></div><button className="btn btn-primary" onClick={() => setView("new-claim")}>Create claim</button></div>{claims.map(claim => <article className="claim-row" key={claim.id}><div><strong>#{String(claim.id).padStart(4, "0")} · {claim.patient_name}</strong><span>{claim.diagnosis_code} / {claim.procedure_code} · ${claim.amount}</span></div><div><span className={`status ${claim.status}`}>{claim.status.replace("_", " ")}</span>{claim.validation_messages.map(message => <small key={message}>{message}</small>)}</div></article>)}</section>}
      {view === "new-claim" && <section className="panel form-panel"><p className="eyebrow">CHARGE TO CLAIM</p><h2>Create and validate a draft</h2><form onSubmit={createClaim} className="form-grid"><label className="wide">Patient<select required className="form-select" value={claimForm.patient} onChange={event => setClaimForm({ ...claimForm, patient: event.target.value })}><option value="">Choose a patient</option>{patients.map(patient => <option key={patient.id} value={patient.id}>{patient.full_name} · {patient.insurer_name}</option>)}</select></label>{Object.entries({ service_date: "Service date", diagnosis_code: "ICD-10 diagnosis", procedure_code: "Procedure code", amount: "Charge amount" }).map(([key, label]) => <label key={key}>{label}<input required type={key.includes("date") ? "date" : key === "amount" ? "number" : "text"} step={key === "amount" ? "0.01" : undefined} placeholder={key === "diagnosis_code" ? "J06.9" : key === "procedure_code" ? "99213" : ""} className="form-control" value={claimForm[key]} onChange={event => setClaimForm({ ...claimForm, [key]: event.target.value })} /></label>)}<div className="rule-preview wide"><strong>Rules executed on the server</strong><span>Insurance ID present · ICD-10 shape · five-character procedure code · positive amount</span></div><button className="btn btn-primary">Validate and save</button></form></section>}
    </main>
  </div>;
}
