import { defineMiddleware } from "astro:middleware";
import { SECURITY_HEADERS } from "./lib/errors";

export const onRequest = defineMiddleware(async (_ctx, next) => {
  const response = await next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(k)) {
      response.headers.set(k, v);
    }
  }
  return response;
});
