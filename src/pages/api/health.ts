import type { APIRoute } from "astro";
import { jsonResponse } from "../../lib/errors";

export const prerender = false;

export const GET: APIRoute = async () => {
  return jsonResponse(200, {
    ok: true,
    version: "1.0.0",
    ts: new Date().toISOString(),
  });
};
