# Nhat ky Mau thuan / Thieu thong tin / Nhap nhang — SRS v7

Nguon: Phan tich toan bo 22 sheet SRS + cross-ref voi business-rules.yaml, states.yaml, validation-rules.yaml
Generated: 2026-05-10 | Stage 1 — BA
Trang thai: **CAN G1 REVIEW**

---

## INC-001: Thieu dinh nghia pattern sinh so YCTT chi tiet cho tung kenh

**Muc**: HIGH
**Sheet lien quan**: 5.3-Mo ta Field Button, 5.5-Quy tac xu ly nghiep vu, CONTEXT.md
**Mo ta**:
- CONTEXT.md va BIZ-IDGEN noi pattern LNH la `ddMMyyyy + 6-digit seq`, SP la `<maNH>YYYYMMDD<seq>`, LKB la `<maKB>YYYY<seq>`.
- Nhung SRS khong chi dinh cu the: `seq` bat dau tu so may? Reset hang ngay hay hang nam? Do dai chinh xac cua `seq` cho tung kenh la bao nhieu?
- Sheet 5.3 chi noi "sinh tu dong theo cau hinh kenh" ma khong de cap chi tiet.

**De xuat**: Can SA xac dinh cu the pattern sinh so cho tung kenh, bao gom: prefix, do dai seq, phuong thuc reset, va cach xu ly trung lap.

---

## INC-002: Thoi gian cut-off (COT) cu the cho tung kenh chua duoc dinh nghia

**Muc**: HIGH
**Sheet lien quan**: 5.5-Quy tac xu ly nghiep vu (BIZ-COT-CHECK), 0-Muc luc
**Mo ta**:
- BIZ-COT-CHECK noi "Sau gio cut-off cua kenh tuong ung, he thong chuyen sang ngay lam viec ke tiep" nhung khong chi dinh gio COT cu the.
- Khong co sheet nao trong 22 sheet dinh nghia bang COT theo kenh (LNH/SP/LKB).
- Dieu nay anh huong truc tiep den nghiep vu: khong biet khi nao LTT bi chuyen sang T+1.

**De xuat**: Can BA/Nghiep vu cung cap bang COT cu the cho tung kenh, hoac chi dinh rang COT duoc quan ly qua DMHT (QLHT.CHANNEL). Neu la DMHT, can ghi ro tham chieu.

---

## INC-003: Han muc giao dich (BIZ-LIMIT) — Bang cau hinh chua ro

**Muc**: HIGH
**Sheet lien quan**: 5.5-Quy tac xu ly nghiep vu (BIZ-LIMIT), 5.4-Quy tac kiem tra du lieu (VAL-028)
**Mo ta**:
- BIZ-LIMIT noi "Kiem tra So tien LTT so voi han muc theo Kenh x Loai lenh x Vai tro x Don vi" nhung khong de cap bang han muc cu the nam o dau.
- VAL-028 noi "So tien > Han muc cau hinh theo Kenh / Loai lenh / Vai tro" nhung khong tham chieu den DMHT nao.
- Cau truc bang han muc (to hop 4 chieu: kenh x loai lenh x vai tro x don vi) khong duoc mo ta trong bat ky sheet nao.

**De xuat**: Can xac dinh bang han muc thuoc DMHT nao (DMHT moi hoac thuoc QLHT). SA can thiet ke schema bang han muc.

---

## INC-004: So luong trang thai trong state machine — 14 hay 15?

**Muc**: MEDIUM
**Sheet lien quan**: 8-Trang thai giao dich, states.yaml
**Mo ta**:
- states.yaml dinh nghia 15 trang thai (bao gom BLOCKED).
- Nhung sheet "8-Trang thai giao dich" co the khong neu ro trang thai BLOCKED nhu mot trang thai chinh thuc (no la global transition).
- Cung khong ro BLOCKED co duoc dem la trang thai cuoi hay khong.

**De xuat**: Can xac nhan voi nghiep vu: BLOCKED co phai trang thai chinh thuc trong state machine hay khong? Co bao nhieu trang thai cuoi thuc su? (POSTED, CANCELLED, REVERSED, BLOCKED?)

---

## INC-005: RETURNED_TO_CHECKER — Cho phep Edit hay chi Resubmit?

**Muc**: MEDIUM
**Sheet lien quan**: 8-Trang thai giao dich, states.yaml
**Mo ta**:
- states.yaml dinh nghia RETURNED_TO_CHECKER chi co `allowed_actions: [submit]` (tuc la Checker chi co the tai tham + gui lai).
- Nhung khong co sheet nao chi dinh rang Checker co duoc sua noi dung LTT khi o trang thai RETURNED_TO_CHECKER hay khong.
- Neu Checker duoc phep sua, dieu nay vi pham SoD (Checker sua noi dung nghiep vu cua LTT).

**De xuat**: Can xac nhan: RETURNED_TO_CHECKER cho phep Checker (a) chi resubmit, (b) resubmit + them ghi chu, hay (c) sua noi dung LTT. Khuyen nghi: chi cho phep (a) + (b) de bao toan SoD.

---

## INC-006: Thieu dinh nghia N phut cho chong trung lap (BIZ-DUPLICATE)

**Muc**: MEDIUM
**Sheet lien quan**: 5.5-Quy tac xu ly nghiep vu (BIZ-DUPLICATE)
**Mo ta**:
- BIZ-DUPLICATE noi "Canh bao neu trong N phut gan nhat co LTT cung Don vi, NH nhan, So tien, So CT goc" nhung gia tri cu the cua N khong duoc dinh nghia.
- Day la tham so cau hinh quan trong anh huong trai nghiem nguoi dung.

**De xuat**: Can BA/Nghiep vu xac dinh gia tri N mac dinh (vd: 30 phut, 60 phut). Khuyen nghi: cau hinh duoc qua DMHT.

---

## INC-007: Retry gateway — Backoff 5/15/45s hay Exponential backoff?

**Muc**: MEDIUM
**Sheet lien quan**: 5.5-Quy tac xu ly nghiep vu (BIZ-RETRY), 0-Muc luc (III.1.1.1.5.4.2)
**Mo ta**:
- BIZ-RETRY dinh nghia "3 lan, backoff 5/15/45s" — day la co dinh (fixed delay).
- Nhung o muc "Chinh sach thu lai khi giao dich loi" (III.1.1.1.5.4.2) SRS ghi "Exponential backoff, jitter, max 3-5 attempts".
- Hai dinh nghia nay khong nhat quan: (a) so lan (3 vs 3-5), (b) kieu backoff (fixed vs exponential).

**De xuat**: Thong nhat la: 3 lan retry, exponential backoff (5s, 15s, 45s), co jitter. So lan toi da = 3 (khong phai 3-5).

---

## INC-008: Thieu quy tac ve ky dong ke toan (GL period close)

**Muc**: MEDIUM
**Sheet lien quan**: 8-Trang thai giao dich, 5.5-Quy tac xu ly nghiep vu
**Mo ta**:
- Trang thai POST_FAILED duoc dinh nghia la "GL post that bai (ky dong/COA sai)" nhung khong co sheet nao dinh nghia cu the:
  - Khi nao ky dong ke toan duoc mo/dong?
  - LTT o trang thai nao khi ky dong duoc dong (chua hach toan duoc)?
  - Co co che tu dong chuyen sang ky ke tiep khong?

**De xuat**: Can SA/DBA dinh nghia co che ky dong ke toan. Anh huong truc tiep den trang thai POST_FAILED va viec xu ly LTT bi chan.

---

## INC-009: Tinh phi (BIZ-FEE-CALC) — Bang phi cu the nam o dau?

**Muc**: MEDIUM
**Sheet lien quan**: 5.5-Quy tac xu ly nghiep vu (BIZ-FEE-CALC), 0-Muc luc
**Mo ta**:
- BIZ-FEE-CALC tham chieu "bang phi" va 0-Muc luc tham chieu "DMHT06" nhung khong co sheet nao trong 22 sheet mo ta cau truc bang phi cu the.
- Khong biet phi duoc tinh theo cong thuc nao (phan tram, muc co dinh, bac thang).
- Lam tron "den dong cho VND, den cent cho ngoai te" — nhung khong co vi du cu the.

**De xuat**: Can BA/Nghiep vu cung cap bang phi mau. SA can thiet ke schema DMHT06.

---

## INC-010: Lien ket hop dong (BIZ-CONTRACT-LINK) — dich vu QLChi chua san sang

**Muc**: MEDIUM
**Sheet lien quan**: 5.5-Quy tac xu ly nghiep vu (BIZ-CONTRACT-LINK)
**Mo ta**:
- BIZ-CONTRACT-LINK yeu cau "Kiem tra so du hop dong con lai >= So tien LTT, giam tru tuong ung khi Approve".
- Nhung trong CONTEXT.md, QLChi duoc danh dau "Giai doan 2" (khong co trong MVP).
- Dieu nay tao ra mau thuan: BIZ-CONTRACT-LINK la rule MUST nhung dich vu phu thuoc (QLChi) la out-of-scope.

**De xuat**: Hoaac (a) chuyen BIZ-CONTRACT-LINK thanh COULD/SHOULD trong MVP, hoaac (b) dam bao QLChi cung cap duoc API kiem tra so du hop dong cho MVP.

---

## INC-011: Muc do uu tien giua cac sheet — F.1 vs F.3 cho TT.OUT.MANUAL

**Muc**: LOW
**Sheet lien quan**: 0-Muc luc, HDSD
**Mo ta**:
- TT.OUT.MANUAL duoc gan pattern F.1 (tac nghiep thu cong).
- Nhung trong muc luc, nhieu muc con cua TT.OUT.MANUAL (vd: III.1.1.2.5.3, III.1.1.2.5.4, III.1.1.2.5.5) co noi dung giong het voi muc tuong ung cua TT.OUT.AUTO (pattern F.3).
- Nguoi doc co the nham lan ve muc nao ap dung cho TT.OUT.MANUAL va muc nao cho TT.OUT.AUTO.

**De xuat**: Can lam ro rang trong SRS: cac muc nao la chung giua F.1 va F.3, cac muc nao la rieng.

---

## INC-012: Thieu dinh nghia ly do tu choi / huy — Danh sach co dinh hay tu do?

**Muc**: LOW
**Sheet lien quan**: 5.5-Quy tac xu ly nghiep vu (BIZ-REJECT-REASON), 5.4-Quy tac kiem tra du lieu (VAL-030)
**Mo ta**:
- BIZ-REJECT-REASON va VAL-030 dinh nghia "ly do >= 10 ky tu" nhung khong noi:
  - Ly do la truong nhap tu do (textarea)?
  - Hay chon tu danh sach ly do co san (dropdown)?
  - Co bat buoc dinh kem chung tu khi tu choi khong?

**De xuat**: Xac dinh voi nghiep vu: ly do tu choi la nhap tu do hay chon tu DM. Khuyen nghi: nhap tu do + bat buoc >= 10 ky tu.

---

## INC-013: Trang thai DRAFT co phai "da hoan thien" khong?

**Muc**: LOW
**Sheet lien quan**: 2-Bang dac ta chuc nang, 8-Trang thai giao dich
**Mo ta**:
- O sheet 2, buoc "Cap nhat trang thai LTT tu 'da hoan thien' (nhap) → 'cho kiem soat'" dung tu "da hoan thien" de chi trang thai DRAFT.
- Nhung "da hoan thien" khong phai la ten trang thai chinh thuc (trang thai chinh thuc la DRAFT).
- Dieu nay co the gay nham lan cho developer khi doc SRS.

**De xuat**: Thay the "da hoan thien" bang "DRAFT" trong toan bo SRS de nhat quan voi state machine.

---

## INC-014: Kich ban xu ly khi ca Checker va Approver deu khong co (don vi nho)

**Muc**: LOW
**Sheet lien quan**: 3-Phan quyen chuc nang, 2-Bang dac ta chuc nang
**Mo ta**:
- Quy trinh yeu cau 3 cap Maker-Checker-Approver nhung khong co sheet nao dinh nghia:
  - Don vi KBNN chi co 1-2 nguoi thi xu ly the nao?
  - Co cho phep "tu phe duyet" (self-approve) trong truong hop dac biet khong?
  - Co co che "uy quyen" (delegate) khong?

**De xuat**: Can BA/Nghiep vu xac dinh cach xu ly cho don vi nho. Khuyen nghi: co che uy quyen + canh bao khi tu phe duyet.

---

## INC-015: Thieu dinh nghia cau hinh lam tron cho phi va lai

**Muc**: LOW
**Sheet lien quan**: 5.5-Quy tac xu ly nghiep vu (BIZ-FEE-CALC)
**Mo ta**:
- BIZ-FEE-CALC noi "Lam tron theo quy dinh (den dong cho VND, den cent cho ngoai te)" nhung:
  - Phuong phap lam tron nao? (ROUND_HALF_UP, ROUND_DOWN, ROUND_CEILING?)
  - Don vi lam tron co duoc cau hinh qua DMHT khong?

**De xuat**: Xac dinh phuong phap lam tron chuan (vd: ROUND_HALF_UP) va cho phep cau hinh.

---

## INC-016: Pham vi gioi han file dinh kem — so luong toi da?

**Muc**: LOW
**Sheet lien quan**: 5.4-Quy tac kiem tra du lieu (VAL-029)
**Mo ta**:
- VAL-029 dinh nghia "File > 10MB hoac dinh dang ngoai (pdf, jpg, png, docx)" nhung khong noi:
  - So luong file toi da cho mot LTT?
  - Tong dung luong toi da cua tat ca file dinh kem?

**De xuat**: Xac dinh so luong file toi da (vd: 10 file) va tong dung luong toi da (vd: 50MB).

---

## INC-017: Thieu mo ta chi tiet cho sheet "4-Giao dien chuc nang"

**Muc**: LOW
**Sheet lien quan**: 4-Giao dien chuc nang, HDSD
**Mo ta**:
- HDSD ghi "Duoc gen tu Claude AI" nhung trong 22 sheet, sheet "4-Giao dien chuc nang" khong duoc parse vao srs_extract.json (hoac co the co du lieu moi phan).
- Khong co wireframe/mockup chi tiet cho cac man hinh S01-S07.

**De xuat**: Can UI/UX tao wireframe cho 7 man hinh chinh. Trong luc nay, dev-FE tham chieu cac mo ta truong tu sheet 5.3.

---

## Tong hop

| Ma | Muc | Trang thai | Canh bao |
| :-- | :--- | :--------- | :------- |
| INC-001 | HIGH | CAN REVIEW | Anh huong sinh so YCTT |
| INC-002 | HIGH | CAN REVIEW | Anh huong nghiep vu COT |
| INC-003 | HIGH | CAN REVIEW | Anh huong kiem tra han muc |
| INC-004 | MEDIUM | CAN REVIEW | Nhat quan state machine |
| INC-005 | MEDIUM | CAN REVIEW | SoD va quy trinh |
| INC-006 | MEDIUM | CAN REVIEW | Tham so cau hinh |
| INC-007 | MEDIUM | CAN REVIEW | Ma thuan retry |
| INC-008 | MEDIUM | CAN REVIEW | Ky dong ke toan |
| INC-009 | MEDIUM | CAN REVIEW | Bang phi |
| INC-010 | MEDIUM | CAN REVIEW | Phu thuoc QLChi |
| INC-011 | LOW | GHI NHAN | Van de presentation SRS |
| INC-012 | LOW | GHI NHAN | Ly do tu choi |
| INC-013 | LOW | GHI NHAN | Ten trang thai |
| INC-014 | LOW | GHI NHAN | Don vi nho |
| INC-015 | LOW | GHI NHAN | Lam tron |
| INC-016 | LOW | GHI NHAN | File dinh kem |
| INC-017 | LOW | GHI NHAN | Wireframe |

**Tong**: 3 HIGH, 7 MEDIUM, 7 LOW = 17 inconsistencies
