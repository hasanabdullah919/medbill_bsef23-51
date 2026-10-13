"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/claim";

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("biller");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function chooseRole(next: UserRole) {
    setRole(next);
    setEmail("");
    setPassword("");
    setError("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, email, password }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not sign in");
      router.push("/"); router.refresh();
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }

  return <main className="d1-login-page">
    <section className="d1-login-shell">
      <div className="d1-login-intro">
        <span className="d1-chip light">D1 WORKING PROTOTYPE</span>
        <div className="d1-logo"><b>M</b><span>MedBill</span></div>
        <h1>From claim information to a validated draft.</h1>
        <p>Create a claim manually or upload a synthetic PDF, review the extracted fields, validate the claim and generate a CMS-1500-style preview.</p>
        <ol className="d1-login-flow"><li>Patient and insurance</li><li>Claim fields</li><li>Validation</li><li>CMS preview</li></ol>
        <small>Synthetic demonstration data only. No claim is submitted to an insurer.</small>
      </div>
      <form className="d1-login-card" onSubmit={submit}>
        <span className="d1-chip">SUPERVISOR DEMO</span>
        <h2>Sign in</h2>
        <p>Choose a demo role. Admin can also open the technical PDF workspace.</p>
        <div className="d1-role-switch" aria-label="Demo role">
          <button type="button" aria-pressed={role === "biller"} onClick={() => chooseRole("biller")}>Biller</button>
          <button type="button" aria-pressed={role === "admin"} onClick={() => chooseRole("admin")}>Admin</button>
        </div>
        <label>Email<input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={role === "admin" ? "admin@medbill.demo" : "biller@medbill.demo"} autoComplete="username" required /></label>
        <label>Password<input aria-label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter the demo password" autoComplete="current-password" required /></label>
        <div className="d1-demo-credentials"><strong>Demo credentials</strong><span>{role === "admin" ? "admin@medbill.demo" : "biller@medbill.demo"}</span><span>D1Demo2026!</span></div>
        {error && <div className="d1-alert error" role="alert">{error}</div>}
        <button className="d1-primary wide" disabled={busy}>{busy ? "Signing in…" : "Open D1 workspace"}</button>
      </form>
    </section>
  </main>;
}
