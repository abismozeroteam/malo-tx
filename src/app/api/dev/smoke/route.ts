// Temporary: remove in step 1.
import { isTeamSecret } from "@/server/auth/team-secret";
import { db } from "@/server/db";
import { ChargeNotAllowedError } from "@/server/pey/charge-rules";
import {
  PeyError,
  createCodiPush,
  createCodiQr,
  getQrTransactions,
  getTransaction,
} from "@/server/pey/client";
import { smokeRequestSchema, type SmokeRequest } from "@/server/validation/smoke-request";

export async function POST(request: Request) {
  if (!isTeamSecret(request.headers.get("x-team-secret"))) {
    return new Response("Not found", { status: 404 });
  }

  const parsed = smokeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  try {
    return Response.json(await runSmokeAction(parsed.data));
  } catch (error) {
    if (error instanceof PeyError) {
      return Response.json(
        { error: error.message, status: error.status, type: error.type, requestId: error.requestId },
        { status: 502 },
      );
    }
    if (error instanceof ChargeNotAllowedError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("[smoke] failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
}

async function runSmokeAction(request: SmokeRequest) {
  switch (request.action) {
    case "qr": {
      const qr = await createCodiQr({
        amountCents: 1,
        concept: "Malo Tx prueba",
        expirationSeconds: 600,
        numRef: "1",
        metadata: { test: "smoke", kind: "qr" },
        generateImage: true,
      });
      return { id: qr.id, qrString: qr.qrString, qrImage: qr.qrImage ?? null };
    }
    case "push":
      return createCodiPush({
        amountCents: 1,
        phoneNumber: request.phone,
        concept: "Malo Tx prueba",
        expirationSeconds: 600,
        numRef: "2",
        metadata: { test: "smoke", kind: "push" },
      });
    case "qr-status":
      return getQrTransactions(request.id);
    case "tx-status":
      return getTransaction(request.id);
    case "events":
      return {
        events: await db().query(
          `SELECT webhook_id, event_type, transaction_id, amount_cents,
                  date_paid, received_at,
                  EXTRACT(EPOCH FROM (received_at - date_paid))::int AS delay_seconds,
                  payload
             FROM pey_webhook_events
            ORDER BY received_at DESC
            LIMIT 10`,
        ),
      };
  }
}
