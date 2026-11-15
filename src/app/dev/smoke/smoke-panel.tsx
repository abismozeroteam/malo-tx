"use client";
// Temporary: remove in step 1.
import { useState } from "react";

type Result = { status: number; body: unknown };

export function SmokePanel() {
  const [secret, setSecret] = useState("");
  const [phone, setPhone] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  async function run(action: string, extra: Record<string, string> = {}) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/dev/smoke", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-team-secret": secret },
        body: JSON.stringify({ action, ...extra }),
      });
      const text = await res.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {}
      if (action === "qr" && res.ok && body && typeof body === "object") {
        const qr = body as { id?: string; qrImage?: string | null };
        setQrImage(qr.qrImage ?? null);
        if (qr.id) setLookupId(qr.id);
      }
      if (action === "push" && res.ok && body && typeof body === "object") {
        const push = body as { transactionId?: string };
        if (push.transactionId) setLookupId(push.transactionId);
      }
      setResult({ status: res.status, body });
    } finally {
      setBusy(false);
    }
  }

  const button = "rounded bg-black px-4 py-2 text-white disabled:opacity-40";
  const input = "w-full rounded border border-neutral-400 px-3 py-2";

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 text-sm">
      <h1 className="text-xl font-bold">Step 0 smoke test</h1>
      <input
        className={input}
        type="password"
        placeholder="Team secret"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />

      <button className={button} disabled={busy || !secret} onClick={() => run("qr")}>
        1. Create $0.01 QR
      </button>
      {qrImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="CoDi QR" className="mx-auto w-64 bg-white p-2" src={`data:image/png;base64,${qrImage}`} />
      )}

      <div className="flex gap-2">
        <input
          className={input}
          inputMode="numeric"
          placeholder="10-digit phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button className={button} disabled={busy || !secret} onClick={() => run("push", { phone })}>
          2. Push
        </button>
      </div>

      <button className={button} disabled={busy || !secret} onClick={() => run("events")}>
        3. Show received webhooks
      </button>

      <div className="flex flex-col gap-2 border-t pt-4">
        <input
          className={input}
          placeholder="QR id or transaction id"
          value={lookupId}
          onChange={(e) => setLookupId(e.target.value)}
        />
        <div className="flex gap-2">
          <button className={button} disabled={busy || !secret} onClick={() => run("qr-status", { id: lookupId })}>
            QR payments
          </button>
          <button className={button} disabled={busy || !secret} onClick={() => run("tx-status", { id: lookupId })}>
            Transaction
          </button>
        </div>
      </div>

      {result && (
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-neutral-100 p-3 text-xs text-black">
          {`HTTP ${result.status}\n`}
          {JSON.stringify(result.body, (k, v) => (k === "qrImage" && v ? "[image shown above]" : v), 2)}
        </pre>
      )}
    </main>
  );
}
