# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

## Hierarchy labels

Every planned issue carries exactly one `kind:*` label:

| Label | Level | Labels allowed |
| ----------------- | ---------- | -------------------------------------------------------------------- |
| `kind:epic` | Epic | `priority:*`, `status:*`; never `type:*` or `ready-for:*` |
| `kind:user-story` | User story | `priority:*`, `status:*`; never `type:*` or `ready-for:*` |
| `kind:task` | Task | `kind:*`, `type:*`, `priority:*`, `ready-for:*`, `status:*` |
| `kind:subtask` | Subtask | `kind:*`, `type:*`, `priority:*`, `ready-for:*`, `status:*` |

`type:epic` is retired. Use `kind:epic`.

## Project fields

The `pocket planning` project mirrors the labels with two fields:

| Field | Mirrors | Values |
| ---------- | ---------- | ------------------------------------------------------------ |
| `Kind` | `kind:*` | `epic`, `user-story`, `task`, `subtask` |
| `Nature` | `type:*` | `feature`, `bug`, `chore`, `docs`, `refactor`, `breaking-change` |

`Type` is a reserved field name in GitHub Projects, so the type field is called `Nature`. `Nature` and `Executor` only apply to tasks and subtasks; epics and user stories leave them empty.

The project's `Status` field is the delivery state (`Todo`, `In Progress`, `Done`). It does not mirror the `status:*` labels, which record triage and approval.

## Triage roles

| Label in skills            | Label in tracker                          | Meaning                                                    |
| -------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `needs-triage`             | `status:needs-review`                     | Maintainer needs to evaluate this issue                    |
| `needs-info`               | `status:needs-info`                       | Waiting on reporter for more information                   |
| `ready-for-agent`          | `status:approved` + `ready-for:agent`     | Fully specified task or subtask, ready for an AFK agent    |
| `ready-for-human`          | `status:approved` + `ready-for:human`     | Task or subtask that requires human implementation         |
| `wontfix`                  | `status:wont-fix`                         | Will not be actioned                                       |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string(s) from this table.

## Promotion

Issues promoted from the `pocket planning` project already carry `status:approved` plus the matching `priority:*` and hierarchy label:

- epics: `kind:epic`
- user stories: `kind:user-story`
- tasks: `kind:task`
- subtasks: `kind:subtask`

Tasks and subtasks additionally carry `type:*` and `ready-for:*`. Epics and user stories never carry `type:*` or `ready-for:*`. Promotion counts as maintainer approval, so treat those issues as approved instead of triaging them again.

The full label catalog lives in [.github/labels.yml](../../.github/labels.yml).
