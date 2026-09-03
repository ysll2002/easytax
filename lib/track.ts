// Tiny client-side GA4 event helper. gtag is only injected in production
// (see app/layout.tsx), so this is a no-op locally and on previews.
//
// Event names used across the app (keep this list current — it is the
// contract the daily agent's metrics evaluation reads from GA4):
//   register_attempted / register_success / register_failed   (app/register)
//   mtd_check_started / mtd_check_completed / mtd_check_cta_click (components/MtdChecker)
//   waitlist_joined                                            (components/LaunchWaitlist)
//   account_delete_opened / account_deleted                    (components/DeleteAccountCard)

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export function track(event: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
}
