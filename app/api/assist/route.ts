import { z } from "zod";
import { runLocalAssistant } from "../../lib/local-ai";

export const dynamic = "force-dynamic";

const inputSchema = z.object({
  module: z.enum(["rams", "incidents", "iso", "training"]),
  title: z.string().trim().max(180).default(""),
  payload: z.record(z.string(), z.unknown()).refine((value) => JSON.stringify(value).length <= 40_000, "Assistant context is too large."),
});

function response(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return response({ error: { message: "Cross-origin assistant requests are not allowed." } }, 403);
    const input = inputSchema.parse(await request.json());
    return response(runLocalAssistant(input.module, input.title, input.payload));
  } catch (error) {
    if (error instanceof z.ZodError) return response({ error: { message: error.issues[0]?.message ?? "Invalid assistant request." } }, 400);
    return response({ error: { message: "The local assistant could not process this record." } }, 500);
  }
}
