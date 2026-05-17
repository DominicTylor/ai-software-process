// Template for a comment-first e2e scenario.
//
// Authoring rule (see process.md § Artifact ontology → Commented tests):
//   1. The author writes the scenario first as natural-language comments inside test.todo().
//   2. The /scenario-implement skill (or the Implementer manually) fills executable code
//      UNDER each comment, never replacing it.
//   3. Comments remain in the final test as self-documentation. They are the acceptance
//      criteria; the code below them is the verification.
//
// Once the scenario is wired, replace `test.todo` with `test`.

import { test, expect } from '@canon/e2e-framework';

test.todo('User <does the thing the Story exists for>', async ({ user }) => {
  // # User <opens the entry point>
  // await user.<opensEntryPoint>();

  // # User <sees the expected initial state>
  // await user.<seesInitialState>();

  // # User <takes the primary action>
  // await user.<takesPrimaryAction>();

  // # System <responds the way the Story requires>
  // await user.<expectsOutcome>();
});
