// What is actually running, and was it built from `main`?
//
// Why this exists: on 2026-09-11 the daily agent could not answer the question
// "is last round's work live?" from any endpoint this project owns. It had to
// infer the answer from an unrelated side effect — a crawler fetching the .ics
// feed shipped by that round — because nothing reported the commit the running
// deployment was built from.
//
// That inference was needed because two complete rounds of work (PRs #9 and
// #10, 2026-09-09 and 2026-09-10) had been built, opened and then left
// unmerged. `main` had not moved in three days, production was serving code
// from 2026-09-08, and every metric read in between was judged as if the work
// were live. Nothing anywhere said otherwise.
//
// This is the same failure the 2026-09-05 incident produced from the opposite
// direction — production ahead of `main` rather than behind it — and CLAUDE.md
// answered that one by *enforcing* main-only deploys in the workflow. Enforcement
// stops the bad deploy. It does not tell you what is live, and the gap between
// "main is the only thing we deploy" and "main is what is deployed right now"
// is exactly where three days went.
//
// So: report it. `deployment` in /api/admin/daily-metrics now names the commit,
// the branch and the build time of the code answering the request, and says
// whether that branch is `main`. Comparing the SHA against GitHub's `main` is
// then one lookup rather than an inference from crawler traffic.

/** Set at build time from next.config.ts. Vercel exposes the commit but not
 *  when the build ran, and "which commit" and "how old" answer different
 *  questions — a correct SHA that was built three weeks ago is still a
 *  finding. */
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? null;

export interface DeploymentInfo {
  /** 'production' | 'preview' | 'development'. Vercel's own name for the scope. */
  env: string;
  /** Git branch the deployment was built from, e.g. 'main'. */
  git_ref: string | null;
  /** Full commit SHA, for comparing against GitHub. */
  commit_sha: string | null;
  /** First 7 characters, for reading in a report. */
  commit_short: string | null;
  commit_message: string | null;
  /** ISO timestamp of the build, or null on a local dev server. */
  built_at: string | null;
  /** Whole days since the build. Null when `built_at` is unknown. */
  build_age_days: number | null;
  /**
   * CLAUDE.md permits exactly one source for production: `main`. False here on
   * a production deployment is the 2026-09-05 incident happening again, and is
   * worth failing loudly over rather than reporting quietly.
   */
  built_from_main: boolean;
  /**
   * Null when there is nothing to say. A string here is a sentence meant to be
   * read by whoever is looking at the metrics, not a log line.
   */
  warning: string | null;
}

export function deploymentInfo(now: Date = new Date()): DeploymentInfo {
  const env = process.env.VERCEL_ENV ?? 'development';
  const gitRef = process.env.VERCEL_GIT_COMMIT_REF ?? null;
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? null;

  const builtAt = BUILD_TIME;
  const buildAgeDays = builtAt
    ? Math.floor((now.getTime() - new Date(builtAt).getTime()) / 86_400_000)
    : null;

  const builtFromMain = gitRef === 'main';

  let warning: string | null = null;
  if (env === 'production' && gitRef && !builtFromMain) {
    warning =
      `Production is serving a build from '${gitRef}', not 'main'. CLAUDE.md allows ` +
      `only main-to-production; this is the 2026-09-05 drift recurring.`;
  } else if (buildAgeDays !== null && buildAgeDays >= 3) {
    // Not an error — a quiet week is a legitimate reason for an old build. It
    // is here because "nothing has shipped for N days" is precisely the fact
    // that went unnoticed for three days, and it costs one line to state it.
    warning = `This deployment was built ${buildAgeDays} days ago. Check whether merged work is waiting to ship.`;
  }

  return {
    env,
    git_ref: gitRef,
    commit_sha: sha,
    commit_short: sha ? sha.slice(0, 7) : null,
    commit_message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.slice(0, 200) ?? null,
    built_at: builtAt,
    build_age_days: buildAgeDays,
    built_from_main: builtFromMain,
    warning,
  };
}
