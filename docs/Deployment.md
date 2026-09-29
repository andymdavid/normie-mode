# Deployment

The live site runs on CapRover A as `normie-mode`. CapRover builds the
`deployed` branch from the public `rick/normie-mode` Forgejo mirror at
`https://tower-stable-forgejo.b.otherstuff.ai/rick/normie-mode`.
The original GitHub repository remains the `origin` remote. Rick's Forgejo
account owns the deployment mirror because it cannot create repositories in
the `other-stuff` organisation.
The Forgejo push webhook must be active for push events on
`refs/heads/deployed` only. A push to `main` does not deploy.

The Dockerfile builds the Astro site and serves the generated files with Bun.
The app listens on `PORT=3000`; `/healthz` returns `ok`.

After validating and pushing `main`, promote with a fast-forward:

```sh
git fetch forgejo
git switch deployed
git merge --ff-only main
git push forgejo deployed
git switch main
```

Confirm the CapRover deployed Git hash equals `forgejo/deployed`, then check
the public HTTPS homepage and `/healthz`. If the fast-forward fails, inspect
the branch history before making any further changes; do not force push.
