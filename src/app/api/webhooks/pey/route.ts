import { handlePeyWebhook } from "@/server/pey/webhook-handler";
import { peyEventStore } from "@/server/pey/webhook-store";

export async function POST(request: Request) {
  const result = await handlePeyWebhook({
    rawBody: await request.text(),
    headers: request.headers,
    secret: process.env.PEY_WEBHOOK_SECRET,
    store: peyEventStore,
  });
  console[result.status === 200 ? "log" : "warn"](`[pey-webhook] ${result.log}`);
  return Response.json(result.body, { status: result.status });
}
