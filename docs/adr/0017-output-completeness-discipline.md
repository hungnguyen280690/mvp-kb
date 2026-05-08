# ADR-0017: Output completeness discipline — suppress guessing, suppress hallucination

- **Status:** Accepted
- **Date:** 2026-05-08
- **Deciders:** SA (lead), all roles
- **Tags:** quality, prompts, linter, foundation
- **Supersedes:** —
- **Superseded by:** —

## Context

ADR-0009 introduced cite-or-die (R1001) and no-TBD (R0103). These prevent the most egregious hallucinations and placeholders. They are necessary but not sufficient — observed gaps:

- **Vague hedges** survive cite-or-die: "the system should be performant," "we use appropriate caching," "errors are handled gracefully"
- **Implicit assumptions** propagate: design omits a section the next role needs, that role asks back; cycle wastes one round-trip
- **Soft-ambiguous wording** lets agents emit confident-sounding output that downstream readers parse differently
- **Missing-but-not-required sections** don't trip linter rules (which only check required sections)
- **Numeric vagueness** survives: "low latency" instead of "p95 <200ms"; "high availability" instead of "99.9% (43 min/mo budget)"

The system claim is "no missing/conflict/overlap of role/scope/task." Completeness is the foundation of "no missing." Vague output is **half-missing** — the words exist but the information doesn't.

## Decision

Adopt **Output Completeness Discipline** as a cross-cutting principle, with three enforcement layers:

### Layer 1 — Agent prompt boilerplate (all prompt templates)

Every prompt template gets a mandatory `## Anti-hallucination + completeness contract` section:

```markdown
## Anti-hallucination + completeness contract

Before emitting output, you MUST:

1. **Cite every factual claim** to a specific source (ADR id + sha; stakeholder quote + timestamp;
   standard reference; predecessor artifact section). No claim without a citation.
2. **Replace hedges with measurements**:
   - "performant" → specific latency/throughput target ("p95 <200ms at 100 RPS")
   - "scalable" → specific scale target ("10K subscriptions in <30 min")
   - "secure" → specific control ("OIDC bearer tokens; CSP `default-src 'self'`")
   - "user-friendly" → specific UX criterion ("<3 clicks to plan-change; keyboard-only flow possible")
3. **Forbid soft-ambiguity phrases**: "obvious", "should", "as appropriate", "where applicable",
   "etc.", "and so on", "tbd", "todo", "lorem ipsum", "to be determined", "later".
   If you cannot avoid one, output `<<MISSING-INFO: <what>>>` instead and file an
   `escalations/incomplete-input.md`.
4. **Self-verify before emit**: re-read your output against the checklist in your prompt template's
   `## Output completeness checklist` section. If any item fails, fix or escalate.
5. **No invention**: if a fact is not in your context, do NOT generate it. Output `<<MISSING-INFO>>`
   and escalate.
```

### Layer 2 — Per-artifact completeness checklist (in each artifact template)

Each artifact template includes a `## Output completeness checklist` section that the authoring agent (and human reviewer) verifies before status: In Review:

```markdown
## Output completeness checklist (NON-NEGOTIABLE)

- [ ] Every section header present (no skipped sections); empty sections marked
      `Not Applicable` with rationale, never blank
- [ ] Every factual claim cites a source
- [ ] No forbidden hedge phrases (regex-checked by linter R0230)
- [ ] All measurable requirements have measurable targets (units, thresholds)
- [ ] All cross-references resolve (paths exist, anchors valid)
- [ ] All dependencies declared in front-matter (`predecessors`, `applies_adrs`,
      `applies_policies`, `applies_standards`)
- [ ] No `<<MISSING-INFO>>` markers remaining (escalate if any)
- [ ] Reviewer can complete their work using ONLY this artifact + its declared
      predecessors (no implicit context required)
```

### Layer 3 — New linter rule family R0230-R0239 (forbidden hedges + completeness)

| Rule  | Description                                                                | Severity |
| ----- | -------------------------------------------------------------------------- | -------- |
| R0230 | Forbidden hedge phrases (regex against locked enum)                        | error    |
| R0231 | Numeric vagueness (regex: "low/high/fast/slow" without measurement nearby) | warn     |
| R0232 | All section headers from template manifest are present                     | error    |
| R0233 | No `<<MISSING-INFO>>` markers in `status: In Review` or later              | error    |
| R0234 | Self-verification artifact section populated (the checklist above, ticked) | warn     |
| R0235 | "Reviewer can complete using only this + predecessors" assertion verified  | advisory |

### Forbidden hedge phrases (locked enum, R0230)

```yaml
forbidden_hedges:
  - "obvious"
  - "should be" # use "must" or specific outcome
  - "as appropriate"
  - "where applicable"
  - "etc."
  - "and so on"
  - "tbd"
  - "todo"
  - "lorem ipsum"
  - "to be determined"
  - "later" # context-dependent; allowed in "future revisions" sections
  - "user-friendly" # use specific UX criterion
  - "performant" # use specific perf target
  - "scalable" # use specific scale target
  - "robust" # use specific failure-mode coverage
  - "industry-standard" # cite specific standard
  - "best practice" # cite specific source
```

The list is tunable; additions require ADR-0005 lifecycle (severity-tiered with `enforce_after`).

### Reviewer agents extended with completeness focus

Existing `@claude-code-reviewer` and `@claude-architect-reviewer` (per ADR-0011) get prompt updates: their finding categories now include `completeness-gap` (new finding fingerprint category) which maps to R0230-R0234.

A new reviewer specialty:

- `@claude-completeness-reviewer` — sole job is to verify the completeness checklist, regex-scan for hedges, and validate "downstream role can consume without asking back."

## Consequences

### Positive

- Concrete, measurable outputs become the default — no more "should be performant"
- Downstream roles spend less time asking back; per-feature wall-clock reduced
- Loop divergence is reduced (concrete findings → easier to fix definitively)
- Audit chain stronger — every claim cited
- Hallucinations land as `<<MISSING-INFO>>` markers instead of confident-sounding fabrications

### Negative / Costs

- Authoring takes longer — first drafts can no longer rely on hedges
- ~10-20% prompt token increase per agent invocation (the boilerplate)
- More escalations for `incomplete-input` early in adoption (eventually decreases as upstream artifacts tighten)
- Forbidden-hedge enum needs maintenance as new vague patterns surface

### Neutral

- The "Reviewer can complete using only this + predecessors" assertion is intentionally strong; some artifacts will need predecessor tightening to satisfy it
- Numeric-vagueness rule (R0231) is heuristic; tune false-positive rate in first month

## Alternatives Considered

### A. Stronger cite-or-die only (extend R1001) — Rejected

Doesn't catch numeric vagueness or soft hedges; doesn't enforce completeness checklist.

### B. Reviewer-only enforcement (no linter) — Rejected

Reviewers miss things at scale; ADR-0009's defense-in-depth principle says detection is one layer.

### C. Skip; trust prompts — Rejected

Without enforcement, prompt boilerplate gets dropped during quick edits.

## Related

- ADR-0001 — Per-feature folder + per-artifact file
- ADR-0009 — Defense-in-depth (R-family extended)
- ADR-0011 — Hybrid agent identity (`@claude-completeness-reviewer` joins roster)
- ADR-0013 — Agentic loop topology (`completeness-gap` joins finding category enum)
- All prompt templates updated to include the contract section

## Notes for future revision

- **Forbidden-hedge enum** evolves; quarterly review of false-positives + new patterns
- **R0231 numeric vagueness** is hardest to enforce — start advisory, tighten as data accumulates
- **`<<MISSING-INFO>>` marker convention** must be respected by all authoring agents (prompt update needed across all existing prompt templates as a one-time migration)
- **Self-verification step** can be partially auto-checked by linter (R0234); humans still decide on judgment items
