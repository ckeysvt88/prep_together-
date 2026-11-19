# Expandable layout rollback

The dedicated branch `rollback/expandable-layout` retains commit **1529a67f10eba11209d0f11aefbab89e21c931b2**. It restores the app at `afbca30eb9ab7e69a64ead07f61d4d7d88d7e25d` (version 1.11), including medical, trusted-contact authentication, original tutorial and isolated analytics. Its only runtime adjustment is a fresh public service-worker cache namespace. Test fixtures follow the active cache name.

## Restore the live website

1. Open GitHub Actions and select **Roll back expandable layout**.
2. Choose **Run workflow** on `main`.
3. Wait for the rollback job and Pages deployment to finish.
4. Close every Ready Together browser tab and installed PWA window, then reopen online. This lets the waiting restoration worker activate and replace the layout cache. Offline devices receive the rollback after reconnecting.
5. Confirm the original long-page layout appears and saved household settings, checklist, medical inventory options, authentication and PDF export remain available.

This workflow deploys the pinned rollback commit; it does not rewrite `main` or clear localStorage. The worker removes only earlier `ready-together-public-` caches. The current layout can return on the next push to `main` or manual **Publish Ready Together** run. Both workflows share the `pages` concurrency group.

## Restore the source branch instead

Revert the dedicated layout release commit with `git revert <layout-release-sha>` and push the resulting commit to `main`. Preserve the rollback branch while this release is supported. Avoid a forced reset of shared history.
