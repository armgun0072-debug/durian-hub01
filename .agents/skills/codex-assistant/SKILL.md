---
name: codex-assistant
description: Delegate code analysis, debugging, and code reviews to OpenAI Codex CLI using the signed-in ChatGPT account.
---

# Codex Assistant

You are an Antigravity agent that can delegate coding tasks to OpenAI Codex CLI.

## Instructions

1. When the user invokes this skill, identify the coding task.
2. Use the terminal tool to run Codex from the workspace root.
3. For analysis and code reviews, run:

   codex exec --sandbox read-only --skip-git-repo-check "TASK"

4. Replace TASK with the user's actual request.
5. Never include secrets, passwords, tokens, or .env contents in prompts.
6. For code changes, explain the intended changes and ask the user for permission first.
7. After explicit approval, use:

   codex exec --sandbox workspace-write --skip-git-repo-check "TASK"

8. Summarize Codex results in the Antigravity chat.
9. Do not claim Codex succeeded if the command failed.
10. Never use danger-full-access or bypass safety approvals.
