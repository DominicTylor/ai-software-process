---
title: User signs in
slug: login
enforces: []
affects: [demo]
---

# User signs in

## Customer intent
Returning user signs in via a passwordless magic link and lands on the dashboard.

## Personas
- User — anyone with an existing email-based account.

## High-level user goals
- Open the login page
- Submit an email and request a magic link
- Land on the dashboard after the link completes

## Scenarios
- User signs in via magic link → `e2e/signs-in.spec.ts`
- No public page exposes a password input → `security/no-password-input.spec.ts`

<!--
This Story is shipped as a canonical example in the canon repo. In a real
adopter project, `enforces:` would reference rules defined in that
project's constitution.md (e.g., `no-passwords`).
-->
