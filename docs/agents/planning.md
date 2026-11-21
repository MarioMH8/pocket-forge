# Planning: from idea to approved issue

The `pocket planning` project is the pre-issue surface for this repo. A task can be shaped as a draft item without creating an issue, applying labels, or notifying anyone. It becomes an issue only when its brief is approved.

- Project: `pocket planning` (#5), owner `MarioMH8`
- URL: <https://github.com/users/MarioMH8/projects/5>
- Linked repository: `MarioMH8/pocket-forge`

## Surfaces

| Surface | Use it for | Output |
| --------------- | ------------------------------------------------------------- | ------------------- |
| GitHub Discussions | Open-ended exploration: approaches, prior art, trade-offs, feedback | A direction, not a task |
| Project draft | Turning a direction into a scoped, testable task | An approved brief |
| GitHub issue | Approved work with labels and a number | A pull request |

### Start in Discussions when the task is not defined yet

Not every idea needs a discussion. Use Discussions when the idea is still open: several possible approaches, questions for other people, or no acceptance criteria yet. Prefer the `Ideas` category. When a direction emerges, capture the concrete task as an `Inbox` draft and link the discussion under `References` in the draft body.

Do not open an issue to host that exploration. An issue implies an approved task; a discussion decides whether there is one.

## Fields

`Type` is a reserved field name in GitHub Projects. The project therefore uses two fields that mirror the label prefixes: `Kind` for the hierarchy (`kind:*`) and `Nature` for the type of work (`type:*`).

| Field | Type | Values | Required from |
| ---------- | ------------- | ------------------------------------------ | ------------- |
| `Stage` | single select | `Inbox`, `Refining`, `Ready`, `Promoted` | Inbox |
| `Kind` | single select | `epic`, `user-story`, `task`, `subtask` | Refining |
| `Nature` | single select | `feature`, `bug`, `chore`, `docs`, `refactor`, `breaking-change` | Refining (tasks and subtasks only) |
| `Priority` | single select | `critical`, `high`, `medium`, `low` | Refining |
| `Executor` | single select | `agent`, `human` | Ready (tasks and subtasks only) |

`Status` (`Todo`, `In Progress`, `Done`) only applies after promotion and tracks delivery of the issue. It is a different axis from the `status:*` labels: the field tracks delivery, while the labels record triage and approval (`status:approved`, `status:blocked`, and so on).

`Kind` records the hierarchy and maps to the `kind:*` labels at promotion: `kind:epic`, `kind:user-story`, `kind:task`, or `kind:subtask`. `Nature` records the type of work and maps to the `type:*` labels. Epics and user stories never carry `Nature` or `Executor`; tasks and subtasks carry both.

### Field reference

Drafts have no URL, so `gh project item-edit --field <name>` cannot target them. Use the node IDs below. Regenerate them with `gh project field-list 5 --owner MarioMH8 --format json`.

| Field | Field ID |
| ---------- | ------------------------------------ |
| `Stage` | `PVTSSF_lAHOBG-dps4Bsg5-zhqu0Gg` |
| `Kind` | `PVTSSF_lAHOBG-dps4Bsg5-zhqz6cA` |
| `Nature` | `PVTSSF_lAHOBG-dps4Bsg5-zhqu0Ig` |
| `Priority` | `PVTSSF_lAHOBG-dps4Bsg5-zhqu0JI` |
| `Executor` | `PVTSSF_lAHOBG-dps4Bsg5-zhqu0JM` |
| `Status` | `PVTSSF_lAHOBG-dps4Bsg5-zhquuyM` |

| Field | Option | Option ID |
| ---------- | ---------- | ---------- |
| `Stage` | `Inbox` | `aef247e1` |
| `Stage` | `Refining` | `b88cd78f` |
| `Stage` | `Ready` | `841b0bb6` |
| `Stage` | `Promoted` | `d8b6971b` |
| `Kind` | `epic` | `836daa15` |
| `Kind` | `user-story` | `2c0b6c7b` |
| `Kind` | `task` | `1979adf4` |
| `Kind` | `subtask` | `716e4d09` |
| `Nature` | `feature` | `e0a5f3f4` |
| `Nature` | `bug` | `0f3dba5b` |
| `Nature` | `chore` | `6234b51c` |
| `Nature` | `docs` | `3c22f854` |
| `Nature` | `refactor` | `e952baaf` |
| `Nature` | `breaking-change` | `5cc37829` |
| `Priority` | `critical` | `38c94602` |
| `Priority` | `high` | `27d78b51` |
| `Priority` | `medium` | `2c3e9e80` |
| `Priority` | `low` | `17be7e2c` |
| `Executor` | `agent` | `81a3818f` |
| `Executor` | `human` | `69cd7a7b` |
| `Status` | `Todo` | `f75ad846` |
| `Status` | `In Progress` | `47fc9ee4` |
| `Status` | `Done` | `98236657` |

## Draft limitations

A draft is a project item, not an issue. It has:

- no issue number, labels, assignees, milestone, sub-issues, or dependencies;
- no comments, notifications, or links from commits and pull requests;
- visibility limited to people with access to the private project.

Compensate deliberately:

- labels become `Kind`, `Nature`, `Priority`, and `Executor` fields;
- comments become a `Decision log` section in the body;
- dependencies and epics are recorded in the body and materialized after promotion;
- the issue number exists only after promotion.

## Lifecycle

### Inbox: capture

Minimum: title and one sentence. No field is required. Write the problem before the solution. If there is a discussion, link it.

Create a draft and set `Stage` to `Inbox`, otherwise no view shows it:

```bash
item=$(gh project item-create 5 --owner MarioMH8 \
  --title "Short, descriptive title" \
  --body "$(cat .brief.md)" --format json --jq .id)

gh project item-edit --project-id PVT_kwHOBG-dps4Bsg5- --id "$item" \
  --field-id PVTSSF_lAHOBG-dps4Bsg5-zhqu0Gg --single-select-option-id aef247e1
```

### Refining: shape

Fill the brief. Set `Kind` (the hierarchy) and `Priority`; for tasks and subtasks, also set `Nature`. Record every decision with a date in `Decision log`; the draft body is the only conversation surface.

### Ready: approve

A draft is ready when the checklist passes and the complete brief lives in the draft body. Decide `Executor` at the end of refinement, because it determines the labels applied at promotion.

Checklist:

- [ ] Title starts with a capital letter, is descriptive, and has no type prefix; the hierarchy lives in `Kind` and the nature lives in `Nature`
- [ ] `Kind` and `Priority` set
- [ ] `Nature` set (tasks and subtasks only)
- [ ] `Executor` set (tasks and subtasks only)
- [ ] Problem and expected outcome stated
- [ ] Acceptance criteria are verifiable
- [ ] Out of scope stated
- [ ] Dependencies and epic recorded
- [ ] Test plan present

Leaving `Refining` means the brief is complete. Moving to `Ready` is a maintainer approval decision; only approved work is promoted.

### Promoted: hand off

Promotion converts the draft into an issue in the repository. The project item and its field values survive, the draft body becomes the issue body, and the issue enters the normal flow.

## Brief template

```markdown
## Problem

## Expected outcome

## Acceptance criteria

- [ ] ...

## Out of scope

## Dependencies

Blocked by:
Epic:

## References

Discussion:

## Decision log

- YYYY-MM-DD:

## Test plan
```

## Promotion procedure

Promotion is manual and maintainer-only.

1. Locate the draft item:

   ```bash
   gh project item-list 5 --owner MarioMH8 --format json \
     --jq '.items[] | select(.content.title == "Deterministic combat replay export") | .id'
   ```

2. Convert it into an issue in this repository:

   ```bash
   gh api graphql \
     -f query='mutation($item: ID!, $repo: ID!) {
       convertProjectV2DraftIssueItemToIssue(input: { itemId: $item, repositoryId: $repo }) {
         item { content { ... on Issue { number url } } }
       }
     }' \
     -f item="<ITEM_ID>" \
     -f repo="$(gh api repos/MarioMH8/pocket-forge --jq .node_id)"
   ```

3. Apply labels derived from the fields, plus `status:approved`:

   | Field | Label |
   | ------------- | -------------------------------------- |
   | `Kind` | `kind:epic`, `kind:user-story`, `kind:task`, or `kind:subtask` |
   | `Nature` (tasks/subtasks only) | `type:feature`, `type:bug`, `type:chore`, `type:docs`, `type:refactor`, `type:breaking-change` |
   | `Priority` | `priority:critical`, `priority:high`, `priority:medium`, `priority:low` |
   | `Executor` (tasks/subtasks only) | `ready-for:agent` or `ready-for:human` |

   ```bash
   # Epic or user story
   gh issue edit <NUMBER> \
     --add-label "kind:user-story,priority:high,status:approved"

   # Task or subtask
   gh issue edit <NUMBER> \
     --add-label "kind:task,type:feature,priority:high,ready-for:agent,status:approved"
   ```

   Epics and user stories never carry `type:*` or `ready-for:*`. Tasks and subtasks carry the hierarchy label, the nature label, the priority, and the executor. Promotion is the approval event: `status:approved` is applied here, so promoted issues do not go through triage again. Issue titles stay descriptive and never carry a type prefix; the hierarchy is a `kind:*` label, and the nature is a `type:*` label only on tasks and subtasks.

4. Update the project fields. Drafts have no URL, so use node IDs:

   ```bash
   # Stage = Promoted
   gh project item-edit --project-id PVT_kwHOBG-dps4Bsg5- --id <ITEM_ID> \
     --field-id PVTSSF_lAHOBG-dps4Bsg5-zhqu0Gg --single-select-option-id d8b6971b

   # Status = Todo
   gh project item-edit --project-id PVT_kwHOBG-dps4Bsg5- --id <ITEM_ID> \
     --field-id PVTSSF_lAHOBG-dps4Bsg5-zhquuyM --single-select-option-id f75ad846
   ```

5. Materialize the relations recorded in the brief: sub-issue for the epic and `blocked_by` dependencies, using the commands in [issue-tracker.md](issue-tracker.md#wayfinding-operations). Link the original discussion in a comment if one exists.

6. Work normally: branch, pull request, `Closes #<NUMBER>`.

## Views

| View | Layout | Filter | View setting |
| ----------- | ------ | ------------------------------- | ------------------------- |
| `Inbox` | Table | `stage:Inbox` | n/a |
| `Planning` | Board | `stage:Inbox,Refining,Ready` | `Column by` = `Stage` |
| `Delivery` | Board | `label:status:approved` | `Column by` = `Status` |
| `Roadmap` | Table | `stage:Ready,Promoted` | `Group by` = `Priority` |

The API does not expose board columns or table grouping. Configure them once in the GitHub UI. Changes only persist after **Save view**.

- `Planning`: **View** → **Column by** → `Stage`. `Swimlanes` is optional; it adds horizontal sections, for example by `Priority`.
- `Delivery`: **View** → **Column by** → `Status`. Set `Swimlanes` to `None` or to `Executor`.
- `Roadmap`: **View** → **Group by** → `Priority`.

The view's README is mirrored in [planning-project.md](planning-project.md). `Slice by` is a filter panel, not a grouping control: it narrows the current view by a field value and is optional.

## Issues created outside the project

Issues created from templates and issues reported by external users remain issues: they go through triage as usual. Once approved, add them to the project so `Delivery` includes them:

```bash
gh project item-add 5 --owner MarioMH8 \
  --url https://github.com/MarioMH8/pocket-forge/issues/<NUMBER>
```

`Delivery` filters by `label:status:approved`, so unapproved issues stay invisible there even if added early. External issues have no `Stage`; `stage:` views only show planned work.
