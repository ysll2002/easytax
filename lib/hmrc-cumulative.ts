// No server-only imports: shared by the records check and the quarterly page.

/** First tax year in which a quarterly update is a cumulative (year-to-date) summary. */
export const CUMULATIVE_FROM_TAX_YEAR = '2025-26';

/** "2026-27" >= "2025-26": the quarterly update for this year is cumulative. */
export function isCumulativeTaxYear(taxYear: string) {
  return /^\d{4}-\d{2}$/.test(taxYear) && taxYear >= CUMULATIVE_FROM_TAX_YEAR;
}
