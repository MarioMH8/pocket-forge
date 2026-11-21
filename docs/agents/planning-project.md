# Pocket Planning

Planning surface for [pocket-forge](https://github.com/MarioMH8/pocket-forge). Ideas are shaped as drafts here and become issues only when their brief is approved. Full process: [docs/agents/planning.md](https://github.com/MarioMH8/pocket-forge/blob/develop/docs/agents/planning.md).

## Flow

`Discussions` → `Inbox` → `Refining` → `Ready` → `Promoted` → issue → pull request

1. **Discussions** — when the idea is still open (approaches, trade-offs, prior art), start a thread in `Ideas`. No discussion is needed for a task that is already clear.
2. **Inbox** — capture the task as a draft: title, one sentence, `Stage = Inbox`. No other field is required. Link the discussion under `References`.
3. **Refining** — write the brief in the draft body: problem, expected outcome, acceptance criteria, out of scope, dependencies, test plan. Set `Kind` (the hierarchy) and `Priority`; for tasks and subtasks, also set `Nature`. Record decisions with dates in `Decision log`; drafts have no comments.
4. **Ready** — the brief is complete and passes the checklist. For tasks and subtasks, set `Executor` at the end of refinement. A maintainer approves before anything is promoted.
5. **Promoted** — the draft is converted into an issue, labels are applied from the fields, and the issue enters the normal flow: branch, pull request, `Closes #N`.

Drafts have no labels, assignees, comments, dependencies, or issue number. The fields and the `Decision log` replace them until promotion.

## Views

| View | What it is for | Definition |
| ------------ | --------------------------------------------------------- | ------------------------------------------------------- |
| **Inbox** | Raw capture waiting to be shaped. | Table, `stage:Inbox`. |
| **Planning** | Refinement workspace across the three pre-issue stages. The `Ready` column is the promotion queue. | Board, `stage:Inbox,Refining,Ready`, `Column by` = `Stage`. |
| **Delivery** | Approved work in progress, including issues created outside planning. | Board, `label:status:approved`, `Column by` = `Status`. |
| **Roadmap** | Ordering of approved and ready work. | Table, `stage:Ready,Promoted`, `Group by` = `Priority`. |

On a board, `Column by` selects the field that creates the columns. `Swimlanes` is optional and adds horizontal sections, for example by `Priority` or `Executor`. In a table, the equivalent control is `Group by`. `Slice by` is a filter panel, not a grouping control.

View configuration changes are not persisted until **Save view** is clicked.

## Fields

| Field | Values | Required from |
| ---------- | ------------------------------------------ | ------------- |
| `Stage` | `Inbox`, `Refining`, `Ready`, `Promoted` | Inbox |
| `Kind` | `epic`, `user-story`, `task`, `subtask` | Refining |
| `Nature` | `feature`, `bug`, `chore`, `docs`, `refactor`, `breaking-change` | Refining (tasks and subtasks only) |
| `Priority` | `critical`, `high`, `medium`, `low` | Refining |
| `Executor` | `agent`, `human` | Ready (tasks and subtasks only) |
| `Status` | `Todo`, `In Progress`, `Done` | After promotion |

`Type` is a reserved field name in GitHub Projects. `Kind` mirrors the `kind:*` hierarchy labels and `Nature` mirrors the `type:*` labels. Epics and user stories carry no `Nature` or `Executor`.

`Status` is the delivery state (`Todo`, `In Progress`, `Done`). It does not mirror the `status:*` labels, which record triage and approval.

## Rules

- **Titles do not encode the type.** Start with a capital letter and keep it descriptive; the hierarchy lives in `Kind`, the nature lives in `Nature`, and tasks/subtasks also get `type:*`.
- **Hierarchy labels.** Every planned issue carries one `kind:*` label: `kind:epic`, `kind:user-story`, `kind:task`, or `kind:subtask`. `type:*` and `ready-for:*` are reserved for tasks and subtasks; epics and user stories never carry them.
- **Do not open an issue to discuss an idea.** Discuss in Discussions, shape in a draft, promote when approved.
- **Promotion is manual** and applies `status:approved`; promoted issues do not go through triage again.
- **External issues are allowed.** Issues from templates or external reports follow normal triage, then are added here once approved. `Delivery` filters by `label:status:approved`, so unapproved items do not appear.
- **Keep the brief honest.** If acceptance criteria are not verifiable, the draft stays in `Refining`.
