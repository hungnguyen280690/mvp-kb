<!--
PR template — he thong tu kiem cac muc duoi qua CI.
Dien du giup nguoi duyet xu ly nhanh.
-->

## Tom tat

<!-- 1-3 cau: thay doi gi, vi sao -->

## Lien ket

- Stage trong pipeline (BA / SA / Dev / QA):
- ADR / docs lien quan:

## Phan loai rui ro

- [ ] Low-risk (docs, comment, test only, dependency patch)
- [ ] Medium-risk (logic thuong, UI khong touch tien/auth)
- [ ] High-risk (DB migration, contracts/ changes, gates/ signoff, prod config, security)

## Self-check (xac nhan da lam)

- [ ] Da doc [RULES.md](../docs/RULES.md), khong vi pham
- [ ] Da chay `./mvnw verify` / `pnpm test` local — xanh
- [ ] Da viet unit test, coverage khong giam
- [ ] Da cap nhat `features/*` / `contracts/*` neu thay doi nghiep vu / API
- [ ] Khong hard-code credential, khong log so TK / CMND day du
- [ ] Migration moi (khong sua file da merge)
- [ ] OpenAPI khop voi code (neu co endpoint moi)

## Test plan

- [ ]
- [ ]

## Stage gate (neu ap dung)

- [ ] G1 (BA) — `gates/FT-XXX-G1-ba-signoff.md` da ky
- [ ] G2 (SA) — `gates/FT-XXX-G2-design-signoff.md` da ky
- [ ] G3 (Dev) — review xong
