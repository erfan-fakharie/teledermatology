# MVP verification

The Next.js build, ESLint, TypeScript, and two workflow unit tests passed. The integration suite also passed against the optimized Next.js build with an isolated PGlite database.

| Area | Checked behavior |
| --- | --- |
| Approval and payment | Role restrictions, payment before approval, failed payment, concurrent payment retries and a single queue entry |
| Queue and intake | Repeated intake invitation, queue order, hold and resume, blocked premature start, required photo |
| Private photos | Original bytes and SHA-256 retained, no-store response, patient isolation for original and preview |
| Consultation and follow-up | Private doctor notes, message and close retries, locked patient messaging before eligibility, follow-up after advancing the demo clock |
| Browser | Login for both roles, persisted chat, and dashboard layouts at 360px and 1440px in Chromium |

This verification covers the core MVP path and selected guardrails from the original handoff. It does not certify all 40 source acceptance scenarios. PostgreSQL 17 via Docker Compose and physical mobile PWA installation were not exercised in this environment. The demo uses synthetic data, simulated payment and simulated notifications.
