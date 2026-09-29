# Deployment

The live site runs on CapRover A as `normie-mode`. The deployment source is
`https://github.com/andymdavid/normie-mode` (`origin` remote), branch
`deployed`. The public `rick/normie-mode` Forgejo mirror is retained for
reference; it is not a deployment source and has no active deployment hook.

The GitHub Actions workflow in `.github/workflows/deploy-caprover.yml` runs
only on pushes to `refs/heads/deployed` and calls CapRover's app webhook.
The webhook URL must be stored in the original repository's
`CAPROVER_DEPLOY_HOOK` Actions secret before promoting this workflow to
`deployed`.
A push to `main` does not deploy. CapRover's Git configuration must point to
the original repository and branch. Its managed GitHub clone credential expires on
2027-03-30 and must be rotated in CapRover before then.

The Dockerfile builds the Astro site and serves the generated files with Bun.
The app listens on `PORT=3000`; `/healthz` returns `ok`.
Keep the CapRover app at one running instance and set its container HTTP port to
3000.

After validating and pushing `main`, promote with a fast-forward:

```sh
git fetch origin
git push origin main
git switch deployed
git merge --ff-only main
git push origin deployed
git switch main
```

Confirm the GitHub Actions run succeeded and the CapRover deployed Git hash
equals `origin/deployed`, then check the public HTTPS homepage and `/healthz`.
If the fast-forward fails, inspect
the branch history before making any further changes; do not force push.
