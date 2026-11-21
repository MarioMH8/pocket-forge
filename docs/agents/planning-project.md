# Pocket Planning

Planning surface for [pocket-forge](https://github.com/MarioMH8/pocket-forge). Ideas are shaped as drafts here and become issues only when their brief is approved. Full process: [docs/agents/planning.md](https://github.com/MarioMH8/pocket-forge/blob/develop/docs/agents/planning.md).

## Flow

`Discussions` → `Inbox` → `Refining` → `Ready` → `Promoted` → issue → pull request

1. **Discussions** — when the idea is still open (approaches, trade-offs, prior art), start a thread in `Ideas`. No discussion is needed for a task that is already clear.
2. **Inbox** — capture the task as a draft: title, one sentence, `Stage = Inbox`. No other field is required. Link the discussion under `References`.
3. **Refining** — write the brief in the draft body: problem, expected outcome, acceptance criteria, out of scope, dependencies, test plan. Set `Kind` and `Priority`. Record decisions with dates in `Decision log`; drafts have no comments.
4. **Ready** — the brief is complete and passes the checklist. Set `Executor` at the end of refinement. A maintainer approves before anything is promoted.
5. **Promoted** — the draft is converted into an issue, labels are applied from the fields, and the issue enters the normal flow: branch, pull request, `Closes #N`.

Drafts have no labels, assignees, comments, dependencies, or issue number. The fields and the `Decision log` replace them until promotion.

## Views

| View | What it is for | Definition |
| ------------ | --------------------------------------------------------- | ------------------------------------------------------- |
| **Inbox** | Raw capture waiting to be shaped. | Table, `stage:Inbox`. |
| **Planning** | Refinement workspace across the three pre-issue stages. | Board, `stage:Inbox,Refining,Ready`, `Column by` = `Stage`. |
| **Ready** | Queue of briefs waiting for a maintainer to promote them. | Table, `stage:Ready`. |
| **Delivery** | Approved work in progress, including issues created outside planning. | Board, `label:status:approved`, `Column by` = `Status`. |
| **Roadmap** | Ordering of approved and ready work. | Table, `stage:Ready,Promoted`, `Group by` = `Priority`. |

On a board, `Column by` selects the field that creates the columns. `Swimlanes` is optional and adds horizontal sections, for example by `Priority` or `Executor`. In a table, the equivalent control is `Group by`. `Slice by` is a filter panel, not a grouping control.

View configuration changes are not persisted until **Save view** is clicked.

## Fields

| Field | Values | Required from |
| ---------- | ------------------------------------------ | ------------- |
| `Stage` | `Inbox`, `Refining`, `Ready`, `Promoted` | Inbox |
| `Kind` | `feature`, `bug`, `chore`, `docs`, `refactor`, `epic` | Refining |
| `Priority` | `critical`, `high`, `medium`, `low` | Refining |
| `Executor` | `agent`, `human` | Ready |
| `Status` | `Todo`, `In Progress`, `Done` | After promotion |

`Kind` is named that way because `Type` is a reserved field name in GitHub Projects.

## Rules

- **Titles do not encode the type.** Start with a capital letter and keep it descriptive; the type lives in `Kind` and becomes a `type:*` label on promotion.
- **Do not open an issue to discuss an idea.** Discuss in Discussions, shape in a draft, promote when approved.
- **Promotion is manual** and applies `status:approved`; promoted issues do not go through triage again.
- **External issues are allowed.** Issues from templates or external reports follow normal triage, then are added here once approved. `Delivery` filters by `label:status:approved`, so unapproved items do not appear.
- **Keep the brief honest.** If acceptance criteria are not verifiable, the draft stays in `Refining`.
