import { useLingui } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { useSpaceQueries } from "../../../lib/query/query";

/** Formats a balance number in its currency, e.g. "$48.39", in the member's locale. */
function formatBalance(currency: string, total: string, locale: string): string {
  const value = Number.parseFloat(total);
  if (!Number.isFinite(value)) return `${currency} ${total}`;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${total}`;
  }
}

/**
 * The DeepSeek account balance beside the search button, or nothing when the account has no
 * connection, no balance, or a read that failed. It only reads the server's numbers; the key
 * never reaches the browser.
 */
export function DeepSeekBalance({ mini = false }: { mini?: boolean }) {
  const { t, i18n } = useLingui();
  const queries = useSpaceQueries();
  const { data } = useQuery(queries.models.deepseekBalance.queryOptions());
  if (mini || !data) return null;
  return (
    <span
      data-testid="deepseek-balance"
      title={t`DeepSeek balance`}
      className="app-no-drag px-1 text-body-sm tabular-nums text-muted-foreground"
    >
      {formatBalance(data.currency, data.total, i18n.locale)}
    </span>
  );
}
