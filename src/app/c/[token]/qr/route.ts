import { db } from "@/server/db";
import { qrImage } from "@/server/debtors/payments";

export async function GET(_request: Request, { params }: RouteContext<"/c/[token]/qr">) {
  const png = await qrImage(db(), (await params).token);
  if (!png) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=600" },
  });
}
