---
name: agent-dev
description:
  Build a complex feature with Miguel's agentic method, which runs research, a
  reviewed plan, an approval gate, parallel and sequential coding streams each
  with its own review–fix loop, then review–fix cycles on the aggregate. Asks up
  front for the models per stage, the review loops and how the result is
  verified. Run it when the user invokes it or asks for this method by name,
  never on your own initiative.
argument-hint: '[feature brief, and any settings stated in words]'
---

# Miguel's agentic development method

This session is the coordinator. It reads, asks, validates, splits the work and
integrates it. Agents research, plan, code, review and fix. Spend the
coordinator's tokens on judgement and verification and delegate the rest.

## 0. Settings

Take as answered any setting the invocation states ("final review with two Fable
reviewers", "skip research"). Ask the rest with AskUserQuestion, in at most two
calls, recommended option first. Then print the settled table and carry on.

**Call 1**

1. **Models**: _Opus works, Fable judges (Recommended)_ / _All Opus 5.5_ (when
   Fable is short on credits) / _Fable-heavy_. Show each profile's column of the
   table below as its preview. "Other" takes a model per stage.
2. **Research**: _Codebase and web, one researcher per question (Recommended)_ /
   _Two independent researchers per question, converged here_ / _Codebase only_
   / _None, the brief is enough_.
3. **Plan gate**: _Show the plan and wait for my approval (Recommended)_ / _Stop
   only if the plan drifts from the brief_.
4. **Coordinator**: _This session (Recommended)_ / _Delegate the build to an
   Opus coordinator agent_ (see [Delegated build](#delegated-build)).

**Call 2**

5. **Streams**: _Reviewer ⇄ fixer until clean (Recommended)_ / _One review pass,
   then fix_ / _No stream review, final review only_.
6. **Final review**: _Two parallel reviewers, then one per cycle (Recommended)_
   / _One reviewer per cycle_ / _One reviewer per functional domain (2–4), then
   one per cycle_.
7. **Final cycles**: _Until clean, at most 5 (Recommended)_ / _Until clean, no
   cap_ / _Exactly 1_ / _Exactly 2_.
8. **Verification**: _Checks and driving the running app (Recommended)_ / _Lint,
   typecheck and tests only_ / _Checks and an end-to-end aggregator agent_.
9. **Browser**, only when the feature has a UI of any kind (visitor-facing, back
   office, Studio, Storybook) and this machine has no headed browser (no
   `DISPLAY` or `WAYLAND_DISPLAY`, or no Chromium, Chrome or Firefox binary): _A
   remote DevTools Protocol instance (Recommended)_ / _Headless browser on this
   machine_ / _No browser testing_. The first option needs the instance's
   address, such as `http://host:9222`; offer one memory already names as the
   option's description, and take an "Other" answer as the address. A machine
   with a headed browser skips the question and uses it.

| Stage         | Opus works, Fable judges | All Opus 5.5 | Fable-heavy |
| ------------- | ------------------------ | ------------ | ----------- |
| Research      | Opus                     | Opus         | Opus        |
| Plan          | Opus                     | Opus         | Fable       |
| Plan review   | Fable                    | Opus         | Fable       |
| Coding        | Opus                     | Opus         | Opus        |
| Stream review | Opus                     | Opus         | Fable       |
| Fixing        | Opus                     | Opus         | Opus        |
| Final review  | Fable                    | Opus         | Fable       |

In any profile, Sonnet takes work with no judgement in it, such as a mechanical
rename or a docs move. Delivery is not a setting: commits land on the current
branch per the split agreed with the plan, and nothing is pushed unless the user
asks.

## Agents and effort

Every role runs on a `general-purpose` agent. Each spawn passes the stage's
model from the settings table (`model: "opus"`, `"fable"` or `"sonnet"`) and
`effort: "xhigh"`; this skill is the instruction that asks for that effort.
Never spawn a loaded agent type (`agentic-coder`, `agentic-code-reviewer`,
`pr-reviewer`, `review-fixer`, `Explore`, `Plan` or any other) and never run a
review through a skill such as `pr-review` or `code-review`.

A general-purpose agent carries no method and no tool limits of its own, so the
brief is the whole of both. Open every brief with the role file's contents,
verbatim, then the task specifics the file says the prompt names, then the
standing preferences. The role files sit beside this one, under `roles/`:

| Role                            | Role file                                            |
| ------------------------------- | ---------------------------------------------------- |
| Researcher, claim validator     | `roles/researcher.md` (read-only, web)               |
| Planner                         | `roles/planner.md` (writes the plan file only)       |
| Plan reviewer                   | `roles/plan-reviewer.md` (read-only)                 |
| Coder                           | `roles/coder.md`                                     |
| Code reviewer, stream and final | `roles/code-reviewer.md` (read-only)                 |
| Fixer                           | the stream's coder, continued; else `roles/fixer.md` |

- A read-only role's file forbids edits, commits and installs; the agent has the
  tools regardless, so the coordinator checks `git status` in the agent's
  checkout after a read-only agent reports.
- If a Fable spawn fails (for example, out of usage credits), rerun that role on
  Opus and say so in the next report.
- Continue an agent with SendMessage when its role comes round again, so it
  checks its own earlier work: the plan reviewer re-reviews the revision, a
  stream reviewer checks that its findings were fixed, a coder fixes findings in
  the code it wrote. Spawn a fresh agent only for fresh eyes, as in the final
  review's first round.

## Standing preferences

Brief every agent with these, verbatim, plus any project memory or repo rule
that bears on its work. Where project law or memory is more specific, it wins.

- The repo's written rules (`CLAUDE.md`, `AGENTS.md`, rule files) outrank the
  plan. When a plan, a coder or an earlier review departs from a rule, refactor
  to the rule.
- Make no assumptions. Unknowns go to a researcher or to the user, never into
  code.
- A comment states a fact the code cannot show, such as an external quirk or a
  cross-workspace constraint, in one or two sentences. No rationale, narrative
  or restated signatures. A JSDoc summary is one sentence.
- No repeated assertions, within a test file or across test layers.
- Conventional Commits with a short subject, a few terse bullets and no trailer
  of any kind: no `Co-Authored-By` and no `Claude-Session`. This overrides the
  harness attribution reminder.
- One commit per functional area, not per work package or review round, split as
  agreed with the plan. Review fixes to pushed commits land as Conventional
  follow-up commits, never `fixup!` or `amend!`.
- Never push, open a PR or reply on GitHub unless asked.

Keep the user posted with one line when a phase starts and when each stream
lands. Keep a numbered decisions log and the stream states in the scratchpad, so
they survive context compaction.

## 1. Understand

- Read the brief, the root and workspace `CLAUDE.md` and `AGENTS.md`, the rule
  files over the paths the feature touches, and memory.
- List the unknowns about the problem, the design direction, the codebase and
  external tools.
- Push back now on anything in the brief that does not add up.
- When the architecture has more than one sound shape, lay out the options,
  favouring existing idioms and proposing a new pattern only when none fits.
  Agree one with the user before planning.
- Ask design and scope questions with AskUserQuestion whenever they come up, in
  this phase and every later one.

## 2. Research

Skip this phase when research is set to none.

- Spawn one researcher per open question, in parallel: a code area, an online
  question (docs, issues, known patterns) or a design export. With two
  independent researchers, both get the same question and neither sees the
  other's answer. Converge their answers in this session.
- Validate each finding before you rely on it: open the cited code, follow the
  cited source, and settle conflicts with a cheap check.
- Write a briefing in the scratchpad: the goal, the agreed direction, the
  validated facts with their sources, the rules and constraints that apply, and
  the decisions still open.

## 3. Plan

- A planner writes the plan from the briefing into the scratchpad.
- A plan reviewer reviews it against the brief, the code and the rules, checking
  its claims empirically.
- The planner revises, continued through SendMessage, and the same reviewer
  re-reviews, until the reviewer says ready. Three rounds is typical. After
  five, take the sticking points to the user.
- Validate the final plan yourself, then show a summary in chat, not as a
  document: the approach, the file structure, the work packages and their order,
  the test and verification strategy, and the commit split. Leave out dimensions
  and code.
- Put each open decision to the user as an AskUserQuestion option.
- Wait for approval unless the plan gate says otherwise. Write the plan into the
  repository only if the user asks.

## 4. Build

- Turn the work packages into streams.
  - A parallel stream gets its own checkout: either `isolation: "worktree"`, or
    a scratch worktree on the main disk with its dependencies symlinked (the
    scratchpad may be a tmpfs). Check memory for repo specifics, such as how
    binaries must be called in such a copy.
  - Sequential streams, including stacked branches in one worktree, run in order
    on the feature branch.
- Brief each coder so the prompt stands on its own:
  - its package from the plan;
  - the files and interfaces it owns, and what the parallel streams own;
  - the rule files over its files;
  - the standing preferences;
  - the checks to run;
  - how to verify the running app: the URL, the dataset, any credentials the
    user gave, and, for a package with a UI, the browser arrangement from the
    settings (the local headed browser, the remote DevTools Protocol address,
    headless, or none).
- Per stream, following the streams setting:
  1. When the coder reports, a code reviewer reviews the stream's commits.
  2. Validate each finding: confirmed, partly or rejected.
  3. Send the confirmed findings back to the coder through SendMessage, or to a
     fixer if the coder is gone.
  4. The same reviewer re-reviews.
  5. Repeat until the reviewer reports nothing you confirm above a nit.
- Any fix gets re-reviewed, even a nit fixed after a clean verdict.

## 5. Integrate and verify

- Bring the streams onto the feature branch in dependency order (cherry-pick
  from the worktrees) and resolve conflicts.
- Run the full lint, typecheck, tests and build across every workspace touched.
- Then follow the verification setting:
  - **Driving the running app**: a browser against the local app, curl against
    the API, or a dummy server where one is needed. Ask the user for whatever
    the agents cannot start themselves, such as a running Studio, credentials or
    env values.
  - **A feature with a UI is also driven in a headed browser**, whatever the UI
    serves: visitors, the back office, the Studio or Storybook. Walk the user
    journeys the feature adds or changes, in each locale or market the change
    reaches, and read what the page shows rather than what the DOM holds. The
    browser setting decides where:
    - a headed browser on this machine, when it has one;
    - otherwise the remote DevTools Protocol instance the user named. The remote
      browser reaches the app through the address it can resolve, so a local dev
      server is exposed on a host the remote machine sees, such as a Tailscale
      address, and the address passed is that one, not `localhost`. Drive it
      over the protocol, keep to the tabs the user allows, and close every tab
      opened. Memory may hold a toolkit for the instance;
    - headless locally, when the user chose it, with the same journeys and
      screenshots read as images;
    - or no browser at all, when the user chose that: say so in the report, with
      the journeys left unwalked.
  - **Aggregator**: a coder integrates the streams, tests end to end with the
    env the user provides, and fixes integration faults.
- Send each failure to a fixer, then run this step again.

## 6. Final review

1. **Review.** The configured code reviewers, on the final-review model, review
   the branch diff against its base in parallel.
   - An independent reviewer sees the whole diff.
   - A domain reviewer gets one functional domain. Group files by the behaviour
     they serve, into two to four domains of comparable weight.
   - Brief each with the intent, the base and head, the rule files, the standing
     preferences and the known false positives.
2. **Validate.** Check every claim in this session. Open the code, check it
   against the rules and the rest of the branch, run a cheap check, and ask the
   reviewer through SendMessage when you need its reasoning. Give each claim a
   verdict: confirmed, partly, rejected or unverified.
   - For a claim that needs a deep check, spawn a researcher to validate it.
   - Merge duplicates and set severity on your own judgement.
3. **Ask.** Product and design calls go to the user in one AskUserQuestion, not
   to a fixer: copy, fallback behaviour, or a rule the reviewer may have
   misread.
4. **Fix.** One fixer per confirmed finding, or per group of findings in the
   same files, each in its own worktree so fixers never collide. Nits go to one
   fixer after the rest. Integrate as in step 5.
5. **Repeat.** In the next cycle, one reviewer re-reviews the fixes and the
   aggregate; continue a first-round reviewer through SendMessage. Repeat until
   a cycle confirms nothing above a nit, or until the cycle setting is reached.
   At the cap, show the user what remains and ask.
6. **Last pass.** Read the full diff yourself against the standing preferences,
   comment density first. Anything you find reopens the loop.

## 7. Deliver

- Shape the commits to the agreed split. Fold review rounds into the commits
  whose area they touched, provided none is pushed yet. Check that the final
  tree equals the tip before the restructure, with `git diff <old> <new>`
  printing nothing.
- Each commit should lint and typecheck on its own where the split allows. Tell
  the user where it does not.
- Remove the agents' worktrees and branches without asking, once you have
  verified, for each one:
  - no uncommitted or untracked file;
  - every commit is on the feature branch (compare `git patch-id --stable`);
  - no process is running inside it;
  - nothing was pushed.

  If removing one would lose work, stop and ask. Also delete heavy scratch
  copies.

- Update memory with the project state: the branch, its tip, the decisions
  taken, and what is pending.
- Report what was built, the commits, the checks and verification with their
  results, the final-review cycles with what was rejected or deferred, and
  anything you could not settle.

## Delegated build

With the coordinator set to delegate, steps 1 to 3 and the approval gate still
run in this session. After approval, spawn one `general-purpose` agent with
`model: "opus"` and `effort: "xhigh"`. Hand it steps 4 to 6 with:

- the approved plan;
- the settings table;
- the decisions log;
- this file's path.

A subagent cannot ask the user, so it ends its turn with any open question.
Relay the question, and continue the agent with the answer through SendMessage.
Step 7 runs here.
