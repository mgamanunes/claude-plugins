# miguel-claude

A Claude Code plugin marketplace.

| Plugin         | What it is                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `session-cost` | Status line entry showing what the session has cost as a share of the subscription, beside its cost at API rates          |
| `agentic-dev`  | The `miguel-agentic-dev` skill: research, a reviewed plan, an approval gate, coding streams each with a review–fix loop |

## Install

```sh
claude plugin marketplace add <owner>/miguel-claude
claude plugin install session-cost@miguel
claude plugin install agentic-dev@miguel
```

Run `/reload-plugins` in a session that is already open.

## session-cost settings

Set under `/config`:

- **Subscription price**: euros per month, 180 by default.
- **Weekly limit at API rates**: what a full weekly limit is worth in US
  dollars at API rates, 1600 by default. It was estimated from one reading on
  an Ultra plan (23% of the week for $367). Set it to 0 to have the mod measure
  it from usage instead.
