# Dedicated Trusted Contact rollback

This rollback restores the Ready Together app from commit `e4c5135bfa1bab1db8dfb94806fc03a0a8ca41a0`, before Trusted Contact Authentication. The emergency medical module, household planning, shopping lists, personalized PDFs and existing tutorial remain available.

The restoration is pinned at commit **`be5f131f45a78ae51e3796ecebe10fccd002548b`**, retained on branch **`rollback/trusted-contact-authentication`**. Its tree contains the previous application plus a service-worker retirement script and a targeted rollback test.

## Run the rollback

1. Open the repository’s **Actions** tab.
2. Select **Roll back Trusted Contact Authentication**.
3. Choose **Run workflow**, use branch **main**, then run it.
4. Wait for the **rollback** job and GitHub Pages deployment to succeed.
5. Reopen Ready Together online and refresh. Close other open Ready Together tabs or PWA windows. Existing installed clients fetch the retirement worker; keep them online long enough to finish cleanup. Offline-only devices cannot receive a rollback until they reconnect.
6. Confirm the Trusted Contact panel is gone and the medical panel, saved household plan and PDF export still work. The restored app shows version 1.9 and does not promise cached offline app access. Previously downloaded PDFs and authenticator entries remain available independently.

[Open the dedicated rollback workflow](https://github.com/ckeysvt88/prep_together-/actions/workflows/rollback-trusted-contact.yml)

## What the rollback changes

- The workflow deploys the exact pinned rollback commit, rather than a branch that might move. It runs all 33 pre-existing planner/medical tests and the dedicated rollback test before uploading the previous app.
- A cleanup script requests `sw.js` with the browser HTTP cache bypassed. The retirement worker activates immediately, removes caches whose names begin `ready-together-public-`, claims current clients and unregisters itself. It has no fetch handler, so requests pass through to the restored app.
- It does not clear localStorage, medical inventory, saved household settings, unrelated site caches, or authenticator entries on phones. Any in-memory authentication session ends when its tab closes/reloads. Clearing the browser does not revoke secrets enrolled elsewhere.
- New or returning visitors get the previous app. Existing offline devices need an online visit to obtain cleanup. Simply deleting `sw.js`, resetting the branch to the old commit, or restoring only `index.html` is insufficient to retire an installed worker reliably.

## Repository and deployment behavior

Running this workflow changes the live deployment; it does not rewrite `main` or erase release history. A later push to `main`, or a manual run of **Publish Ready Together**, deploys the code on `main` again. Coordinate subsequent changes if the rollback must remain live. The two deployment workflows share the same `pages` concurrency group so they cannot publish concurrently.

The rollback branch is a retained recovery artifact. Do not delete it while this release is supported. The exact pinned commit remains the workflow’s source of truth.

## Validation

The previous app’s 33 tests passed. The rollback test verifies immediate activation, deletion of only the Ready Together public cache namespace, client claim, worker unregistration, absence of a fetch handler, the cleanup registration script, and restoration of the pre-auth medical application. The rollback tree was checked against the prior app plus the four documented cleanup/test changes. A browser that already had version 1.10 installed then loaded the rollback: version 1.9 appeared, the Trusted Contact panel was absent, the saved household selection remained, and worker registrations and Ready Together public caches both reached zero.
