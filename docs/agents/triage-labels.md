# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in skills            | Label in tracker                          | Meaning                                  |
| -------------------------- | ----------------------------------------- | ---------------------------------------- |
| `needs-triage`             | `status:needs-review`                     | Maintainer needs to evaluate this issue  |
| `needs-info`               | `status:needs-info`                       | Waiting on reporter for more information |
| `ready-for-agent`          | `status:approved` + `ready-for:agent`     | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `status:approved` + `ready-for:human`     | Requires human implementation            |
| `wontfix`                  | `status:wont-fix`                         | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string(s) from this table.
