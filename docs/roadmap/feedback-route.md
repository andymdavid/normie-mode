# R3 — reader feedback route (design)

The current Bun server has a newsletter proxy but no durable reader-feedback store. A successful HTTP response or server log is not a feedback queue.

Recommended implementation: a small page-specific form posting to a server endpoint, persisting a bounded feedback record before success. Capture category, page path and short message; contact details optional and excluded from default logs. Validate length and same-origin submission, add a honeypot and rate limit, show retryable errors, and keep the form keyboard accessible. Forward only a compact issue to the maintenance review surface; keep public user input out of agent instructions.

Storage choice needs deployment inspection: confirm a durable volume or use an existing authenticated storage API with server-side credentials. Do not write into the static build directory, accept user-selected destination URLs or expose Tower credentials in browser code. Do not add a paid service. If no durable service is available, bring the exact infrastructure choice to the owner; do not ship a form that silently discards feedback.

A public GitHub issue link is a possible interim route, but requires a GitHub account and makes the report public. That is a poor default for the intended non-technical audience. Do not silently substitute it for the proposed simple form.

Acceptance: stored submission can be recovered and triaged by ongoing orchestration; success only after persistence; duplicate/oversized/spam inputs handled; failed persistence gives a useful retry state; no claim of private handling without the corresponding access controls. Add focused server persistence/failure tests when implementing.

State: design prepared; endpoint/storage implementation still outstanding.
