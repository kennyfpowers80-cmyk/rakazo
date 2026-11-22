import { describe, expect, it } from "vitest";
import { readDeepSeekBalance } from "./deepseek-balance.js";

describe("readDeepSeekBalance", () => {
  it("reads the first balance entry with its currency", async () => {
    const fetcher = async () =>
      Response.json({
        is_available: true,
        balance_infos: [
          {
            currency: "USD",
            total_balance: "48.39",
            granted_balance: "0.00",
            topped_up_balance: "48.39",
          },
        ],
      });
    await expect(readDeepSeekBalance("fixture", fetcher)).resolves.toEqual({
      currency: "USD",
      total: "48.39",
    });
  });

  it("sends the key as a bearer token on the balance endpoint", async () => {
    const sent = { url: "", authorization: "" };
    const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
      sent.url = String(input);
      sent.authorization = new Headers(init?.headers).get("Authorization") ?? "";
      return Response.json({
        is_available: true,
        balance_infos: [{ currency: "USD", total_balance: "1.00" }],
      });
    };
    await readDeepSeekBalance("secret-fixture", fetcher as typeof fetch);
    expect(sent.url).toBe("https://api.deepseek.com/user/balance");
    expect(sent.authorization).toBe("Bearer secret-fixture");
  });

  it("returns null when the account reports no balance info", async () => {
    const fetcher = async () => Response.json({ is_available: true, balance_infos: [] });
    await expect(readDeepSeekBalance("fixture", fetcher)).resolves.toBeNull();
  });

  it("returns null when the balance endpoint is unavailable", async () => {
    const fetcher = async () => Response.json({ is_available: false, balance_infos: [] });
    await expect(readDeepSeekBalance("fixture", fetcher)).resolves.toBeNull();
  });

  it("returns null when the key is refused", async () => {
    const fetcher = async () => new Response(null, { status: 401 });
    await expect(readDeepSeekBalance("fixture", fetcher)).resolves.toBeNull();
  });
});
