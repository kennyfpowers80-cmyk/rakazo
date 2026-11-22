import { cancelResponseBody, readBoundedJsonResponse } from "@rakazo/core";
import { z } from "zod";

const MAX_BALANCE_RESPONSE_BYTES = 16 * 1024;

const balanceInfoSchema = z.object({
  currency: z.string().min(1),
  total_balance: z.string(),
});

const deepseekBalanceSchema = z.object({
  is_available: z.boolean().optional(),
  balance_infos: z.array(balanceInfoSchema).optional(),
});

/** The one number a balance readout needs, with its currency code. */
export type ModelProviderBalance = {
  currency: string;
  total: string;
};

/**
 * Reads the DeepSeek account balance. The key is used only here, server-side, and is never
 * returned. A non-2xx answer (an invalid or revoked key included) and an unavailable or empty
 * balance read as `null`, so callers show nothing instead of failing.
 */
export async function readDeepSeekBalance(
  apiKey: string,
  fetcher: typeof fetch = globalThis.fetch,
): Promise<ModelProviderBalance | null> {
  const response = await fetcher("https://api.deepseek.com/user/balance", {
    headers: { Authorization: `Bearer ${apiKey}` },
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    cancelResponseBody(response);
    return null;
  }
  const body = deepseekBalanceSchema.parse(
    await readBoundedJsonResponse(response, MAX_BALANCE_RESPONSE_BYTES),
  );
  if (body.is_available === false) return null;
  const info = body.balance_infos?.[0];
  if (!info) return null;
  return { currency: info.currency, total: info.total_balance };
}
