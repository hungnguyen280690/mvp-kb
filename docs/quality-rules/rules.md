# Quality Rules — Full List

## R0010–R0099: Structure & Format

### R0010 — Front-matter required

**MUST**. Mọi `.md` artifact phải có YAML front-matter với các field: `status`, `classification`, `applies_adrs`.

### R0011 — Status values

**MUST**. `status` chỉ chấp nhận: `Draft`, `In-Review`, `Active`, `Deprecated`, `Superseded`.

### R0012 — Classification values

**MUST**. `classification` chỉ chấp nhận: `Public`, `Internal`, `Confidential`, `Restricted`.

### R0013 — Naming convention

**MUST**. Artifact filenames theo format: `{NN}-{artifact-name}.md` (00–08).

### R0014 — Single-writer per artifact

**MUST**. Mỗi artifact chỉ có 1 role sở hữu (R trong RACI). Role khác chỉ C hoặc I.

### R0020 — Lifecycle state transitions

**SHOULD**. Artifact phải follow state machine: `Draft → In-Review → Active`. `Deprecated` và `Superseded` cần replacement reference.

### R0030 — Cross-reference SHA pinning

**MUST**. Mọi cross-reference đến file khác phải dùng relative path. Nếu cross-repo, phải SHA-pin.

### R0040 — ADR reference

**SHOULD**. Mỗi artifact nên khai báo `applies_adrs` trong front-matter liệt kê ADR ảnh hưởng.

### R0042 — Schema ADR consistency

**MUST**. Implementation không được contradict Active ADR.

## R0100–R0199: Coverage & Completeness

### R0100 — Required artifacts present

**MUST**. Mỗi feature phải có đủ 9 artifacts: `00-idea.md` through `08-test-data.md`.

### R0101 — Idea artifact mandatory

**MUST**. `00-idea.md` phải có trước khi bắt đầu bất kỳ artifact khác.

### R0103 — Rollback script required

**MUST**. Mỗi DB forward migration phải có rollback script tương ứng.

### R0110 — Traceability matrix

**SHOULD**. Feature nên có traceability matrix map rules → test cases.

### R0120 — Test plan coverage

**MUST**. Test plan phải cover mọi BIZ/VAL rule từ requirements.

## R0200–R0246: Consistency & Cross-artifact

### R0200 — Requirements-to-design traceability

**MUST**. Mọi requirement trong `01-requirements.md` phải có design decision trong `02-design.md`.

### R0207 — PII classification annotation

**MUST**. Mọi PII column/field phải có `classification` annotation. Public artifact KHÔNG chứa PII pattern.

### R0210 — Contract-to-code consistency

**MUST**. OpenAPI contract phải match implementation code. oasdiff breaking change check.

### R0220 — UI spec a11y baseline

**MUST**. `07-ui-spec.md` phải khai báo `applies_a11y_baseline` (WCAG 2.1 AA minimum).

### R0230 — Test data PII safety

**MUST**. `08-test-data.md` KHÔNG chứa real PII. Synthetic data only.

### R0240 — Requirements-to-contract coverage

**MUST**. Mọi API requirement trong `01-requirements.md` phải có endpoint trong OpenAPI contract.

### R0241 — Contract-to-code coverage

**SHOULD**. Mọi OpenAPI endpoint phải có implementation.

### R0242 — Test plan coverage of requirements

**MUST**. Mọi BIZ/VAL rule phải có ít nhất 1 test case trong test plan.

### R0243 — UI spec coverage of screens

**MUST**. Mọi screen trong `screens.yaml` phải có UI spec entry.

### R0244 — Test data coverage

**SHOULD**. Mọi state transition phải có test data entry.

### R0245 — Upstream change propagation

**MUST**. Khi upstream artifact thay đổi (e.g., requirements), downstream artifacts phải được review và update (ripple update workflow).

### R0246 — Orphan detection

**SHOULD**. Artifact hoặc artifact section không được reference bởi artifact nào upstream = orphan. Cần review.

## Enforcement

- **CI doc-lint job**: chạy MUST rules, block merge nếu fail
- **Pre-commit hooks**: chạy SHOULD rules, warning nếu fail
- **Manual review**: MAY rules, reviewers kiểm tra trong gate review

Xem thêm: [lifecycle.md](./lifecycle.md) cho waiver process.
