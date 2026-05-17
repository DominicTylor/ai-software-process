---
title: No hidden admin area
slug: no-hidden-admin-area
enforces: []
affects: [demo]
---

# No hidden admin area

## Customer intent
Public visitors must not be able to discover or reach an admin surface by guessing URLs.

## Personas
- Attacker — anonymous probe trying common admin paths.

## High-level user goals
The public app exposes no admin surface to anonymous probes. Any attempt to navigate to a likely-sensitive admin path returns 404.

## Scenarios
- Attacker cannot reach a hidden admin path → `security/admin-paths-rejected.spec.ts`
