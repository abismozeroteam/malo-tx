// TEMPORARY step 0 route: creates the $0.01 smoke-test QR and push and shows
// the stored webhooks. Protected by TEAM_SECRET. Remove once step 1 exists.
import { isTeamSecret } from "@/server/auth/team-secret";
import { db } from "@/server/db";
import {
  PeyError,
  createCodiPush,
  createCodiQr,
  getQrTransactions,
  getTransaction,
} from "@/server/pey/client";

const notFound = () => new Response("Not found", { status: 404 });
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export async function POST(request: Request) {
  if (!isTeamSecret(request.headers.get("x-team-secret"))) return notFound();

  let input: { action?: string; phone?: string; id?: string };
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (input.action) {
      case "qr": {
        const qr = await createCodiQr({
          amountCents: 1,
          concept: "Malo Tx prueba",
          expirationSeconds: 600,
          numRef: "1",
          metadata: { test: "smoke", kind: "qr" },
          generateImage: true,
        });
        return Response.json({ id: qr.id, qrString: qr.qrString, qrImage: qr.qrImage ?? null });
      }
      case "push": {
        const phone = String(input.phone ?? "").replace(/\D/g, "");
        if (!/^[0-9]{10}$/.test(phone)) {
          return Response.json({ error: "El número debe tener 10 dígitos" }, { status: 400 });
        }
        const push = await createCodiPush({
          amountCents: 1,
          phoneNumber: phone,
          concept: "Malo Tx prueba",
          expirationSeconds: 600,
          numRef: "2",
          metadata: { test: "smoke", kind: "push" },
        });
        return Response.json(push);
      }
      case "qr-status": {
        if (!ID_PATTERN.test(input.id ?? "")) return Response.json({ error: "Bad id" }, { status: 400 });
        return Response.json(await getQrTransactions(input.id!));
      }
      case "tx-status": {
        if (!ID_PATTERN.test(input.id ?? "")) return Response.json({ error: "Bad id" }, { status: 400 });
        return Response.json(await getTransaction(input.id!));
      }
      case "events": {
        const events = await db().query(
          `SELECT webhook_id, event_type, transaction_id, amount_cents,
                  date_paid, received_at,
                  EXTRACT(EPOCH FROM (received_at - date_paid))::int AS delay_seconds,
                  payload
             FROM pey_webhook_events
            ORDER BY received_at DESC
            LIMIT 10`,
        );
        return Response.json({ events });
      }
      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof PeyError) {
      return Response.json(
        { error: error.message, status: error.status, type: error.type, requestId: error.requestId },
        { status: 502 },
      );
    }
    console.error("[smoke] failed:", error instanceof Error ? error.message : "unknown error");
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
