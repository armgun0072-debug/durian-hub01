---
name: executing-plans
description: Execute an approved plan inline, tracking progress and evidence in CURRENT_TASK.md.
---

# Executing Plans - Durian Hub adaptation

Adapted from obra/superpowers commit 22f0b463e7a5e579904dd6211a520321035526f7.
See LICENSE and [project guide](../../../docs/agent-skills.md).

1. Announce use of executing-plans. Read CURRENT_TASK.md first, then the
   approved plan. Resume completed steps from their evidence.
2. Follow AGENTS.md. Obtain approval for new work or material scope changes;
   existing approval covers routine steps within the agreed scope.
3. Execute inline. Delegate only if explicitly requested by the user.
4. Record active steps in CURRENT_TASK.md. Read only relevant files.
5. Use the sibling test-driven-development skill for behavior changes.
   Documentation and reversible configuration need proportionate validation,
   not tests that merely mirror their implementation.
6. Implement the smallest complete change. Use systematic-debugging when
   results contradict expectations. Record evidence and justified adjustments.
7. Run appropriate checks and record commands, results, failures, and next
   steps. Continue through authorized work without repeated approval.
8. Use verification-before-completion, review the full diff, and update
   CURRENT_TASK.md. Use receiving-code-review when feedback exists. Never claim
   tests or independent reviews ran when they did not.

Commit, push, deployment, database mutation, and destructive cleanup require
applicable authorization; this skill grants none of those actions.

## Compatibility changes

This local edition replaces upstream worktree/SDD shell helpers, subagent and
model dispatch, final-review dispatch, and branch-finishing automation with
inline execution and CURRENT_TASK.md. No Bash or uninstalled framework needed.
