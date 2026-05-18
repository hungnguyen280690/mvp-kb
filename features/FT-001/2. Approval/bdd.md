# BDD Use Cases -- Phu duyet / Uy quyen / Tu choi giao dich

> Ref: `APPROVAL_spec_function.md` | Agent: BA | Format: Given-When-Then

---

## Main Flow -- Duyet giao dich don le (Luong chinh)

### TC-APV-M01: Checker duyets giao dich o cap dau tien

**Mo ta**: Checker mo Hop cho duyet, xem chi tiet GD va duyet thanh cong.

```
Given NSD da dang nhap va xac thuc 2FA
  And co giao dich dang o trang thai PENDING_CHECK
  And NSD co vai tro Checker va tham quyen duyet theo ma tran
  And NSD khong phai la nguoi lap giao dich do (SoD)
When NSD mo Hop cho duyet va chon giao dich do
  And NSD bam "Duyet" voi comment (khong bat buoc)
  And NSD xac thuc OTP/ky so neu cau hinh yeu cau
Then giao dich chuyen sang trang thai PENDING_APPROVE_L1 (hoac APPROVED neu la cap cuoi)
  And lich su workflow ghi nhan: actor, vai tro, thoi diem, IP, hanh dong
  And notification duoc gui cho Maker va Approver cap tiep (neu co)
  And audit log luu hash payload truoc/sau
```

### TC-APV-M02: Approver duyet tai cap trung gian (L1..LN-1)

```
Given giao dich dang o trang thai PENDING_APPROVE_Lk (k < N)
  And NSD co tham quyen Approver cap k theo ma tran
When NSD duyet giao dich
Then giao dich chuyen sang PENDING_APPROVE_L(k+1)
  And notification gui cho Approver cap k+1
```

### TC-APV-M03: Approver cuoi cung duyet -- GD thanh cong

```
Given giao dich dang o trang thai PENDING_APPROVE_LN (cap cuoi)
  And NSD la Approver cap N duoc uy quyen hop le
When NSD duyet giao dich
Then giao dich chuyen sang APPROVED
  And trigger downstream: hach toan, gui lenh he dich, cap nhat so du
  And trigger chi chay 1 lan (idempotency key: txnId + finalApprovalId)
```

---

## Main Flow -- Tu choi giao dich

### TC-APV-M04: Tu choi giao dich

```
Given giao dich dang cho duyet o bat ky cap nao
  And NSD co tham quyen duyet tai cap do
When NSD chon "Tu choi" va chon ly do tu dropdown + nhap comment (bat buoc)
Then giao dich chuyen sang REJECTED
  And notification gui cho Maker va cac cap da duyet truoc do
  And giao dich bi khoa, khong duyet duoc nua
  And Maker co the xem va tao GD moi tham chieu
```

---

## Main Flow -- Tra lai giao dich

### TC-APV-M05: Tra lai giao dich cho Maker hoac Checker

```
Given giao dich dang cho duyet o bat ky cap nao
  And NSD co tham quyen duyet tai cap do
When NSD chon "Tra lai" va chon cap tra ve (Maker / Checker) + ly do
Then giao dich chuyen sang RETURNED_TO_<role>
  And Maker co the chinh sua va trinh lai
  And chuoi duyet se chay lai tu dau khi trinh lai
```

---

## Main Flow -- Phe duyet hang loat

### TC-APV-M06: Duyet nhieu giao dich cung luc

```
Given co nhieu giao dich cung loai, cung don vi, cung cap duyet
  And tat ca GD deu trong trang thai cho duyet
When NSD multi-select cac GD va chon "Duyet hang loat"
  And NSD ky so/OTP 1 lan cho ca lo
Then moi GD duoc validate doc lap
  And GD pass chuyen trang thai dung workflow
  And GD fail giu nguyen trang thai + ly do
  And bao cao lo (success/fail) duoc hien thi
  And audit log ghi rieng tung GD
```

---

## Alternate Flows

### TC-APV-A01: Uy quyen vang mat (Out-of-office)

```
Given NSD (Delegator) tu khai bao lich vang mat (tu-den) + chon nguoi thay
  And NSD co tham quyen duyet hop le
When he thuc active uy quyen tu dong trong khoang thoi gian vang
Then giao dich trong Inbox forward sang Delegatee voi badge "Uy quyen"
  And khi Delegator quay lai, uy quyen tu dong huy
  And GD da duoc Delegatee duyet thi giu nguyen
```

### TC-APV-A02: Uy quyen can phe duyet

```
Given NSD tao yeu cau uy quyen (cap cao / vuot han muc ca nhan)
When Admin/Quan ly cap tren duyet yeu cau
Then uy quyen duoc active
  And Delegatee thay GD trong Inbox
```

### TC-APV-A03: Thu hoi uy quyen

```
Given Delegator co uy quyen dang hieu luc
When Delegator thu hoi uy quyen
  And Delegatee chua thao tac tren GD dang giao
Then GD quay ve Inbox cua Delegator
  And uy quyen het hieu luc
```

### TC-APV-A04: Phe duyet song song (M-of-N)

```
Given cap duyet hien tai yeu cau M-of-N nguoi cung cap duyet
  And M-1 nguoi da duyet
When nguoi thu M duyet
Then giao dich chuyen sang cap tiep theo
```

```
Given cap duyet yeu cau M-of-N
When 1 nguoi tu choi
Then giao dich bi REJECT ngay, khong cho cap cung duyet nua
```

### TC-APV-A05: Phe duyet co dieu kien (conditional)

```
Given Approver duyet kem dieu kien (vd: "bo sung chung tu X")
When Maker xac nhan dieu kien da duoc thuc hien
Then giao dich chuyen sang trang thai EFFECTIVE
```

### TC-APV-A06: Escalation tu dong khi qua SLA

```
Given giao dich cho duyet qua thoi gian SLA cau hinh
  And chua co cap cao hon thao tac
When he thong tu dong eskalate
Then notification gui len cap cao hon / quan ly truc tiep
  And cap duoi van co the duyet cho den khi cap cao thao tac
```

### TC-APV-A07: Override khan cap

```
Given lanh dao cap cao nhat can duyet khan cap
  And chua vuot quota override trong thang
When NSD chon override + ly do + ky so
Then giao dich chuyen sang APPROED vuot cap
  And audit log ghi noi bat
  And thong bao gui Hoi dong quan tri / Ban dieu hanh
```

### TC-APV-A08: Thu hoi (Recall)

```
Given Approver cap k da duyet, cap k+1 chua thao tac
When Approver cap k thu hoi
Then giao dich quay ve PENDING_APPROVE_L(k-1) hoac ve Maker
  And lich su workflow ghi nhan hanh dong thu hoi
```

### TC-APV-A09: Yeu cau bo sung thong tin

```
Given giao dich dang cho duyet
When Approver bam "Yeu cau bo sung" va chon truong can bo sung
Then giao dich chuyen sang PENDING_INFO
  And Maker nhan thong bao bo sung
  And Maker bo sung va trinh lai tu dau (hoac tu cap yeu cau tuy cau hinh)
```

### TC-APV-A10: Queue lock -- khoa tam tranh trung duyet

```
Given user A mo GD de duyet (lease 5 phut)
When user B cung mo cung GD
Then GD bi khoa tam cho user B (hoac hien thi thong bao dang duoc user A xu ly)
  And auto-release khi user A het lease
```

---

## Exception Flows

### TC-APV-E01: NSD khong du tham quyen theo ma tran

```
Given NSD mo giao dich qua link truc tiep
  And NSD khong du tham quyen theo ma tran (gia tri / loai / don vi)
Then nut "Duyet" bi disable
  And tooltip giai thich ly do
  And cho phep "Tra lai" hoac "Yeu cau cap cao hon duyet"
```

### TC-APV-E02: Vi pham SoD -- NSD chinh la nguoi lap giao dich

```
Given NSD chinh la nguoi lap hoac kiem soat giao dich
When NSD thu mo giao dich do
Then giao dich an khoi Inbox
  And neu mo qua link truc tiep: chan + canh bao bao mat + ghi audit
```

### TC-APV-E03: GD da duoc nguoi khac xu ly trong khi dang xem

```
Given NSD dang xem chi tiet GD
  And nguoi khac vua duyet/tu choi/thu hoi GD do
When he thong phat hien trang thai thay doi
Then man hinh tu dong refresh
  And thong bao "GD da duoc xu ly boi <user> luc <time>"
  And chan thao tac cua NSD hien tai
```

### TC-APV-E04: OTP / ky so khong hop le

```
Given NSD dang thuc hien duyet va can xac thuc OTP/ky so
When NSD nhap sai OTP/ky so
Then cho phep thu lai toi da 3 lan
  And vuot 3 lan: khoa phien duyet 15 phut + ghi audit bao mat
```

### TC-APV-E05: Chung thu so het han / bi thu hoi

```
Given NSD can ky so cho GD trong yeu
  And chung thu so het han hoac bi thu hoi
When NSD bam "Duyet"
Then chan duyet
  And goi y dang ky chung thu moi
  And thong bao Admin
```

### TC-APV-E06: Uy quyen het hieu luc giua chung

```
Given NSD (Delegatee) mo GD tu uy quyen de duyet
  And uy quyen vua het hieu luc
When NSD bam "Duyet"
Then chan duyet + thong bao uy quyen het han
  And GD quay ve Inbox cua Delegator goc
```

### TC-APV-E07: Uy quyen vuot han muc Delegatee

```
Given NSD mo popup uy quyen cho nguoi khac
  And nguoi nhan uy quyen co tham quyen thap hon gia tri GD
When he thuc validate uy quyen
Then chan ngay tai popup
  And goi y nguoi khac co tham quyen cao hon
```

### TC-APV-E08: Hash mismatch -- GD bi thay doi giua cac buoc duyet

```
Given hash payload GD tai buoc duyet hien tai khac voi hash tai buoc truoc
When he thuc phat hien hash mismatch
Then block giao dich ngay lap tuc
  And canh bao nghi van can thiep bao mat
  And gui alert bao mat
  And bat buoc Admin dieu tra
```

### TC-APV-E09: Duyet hang loat -- mot so GD fail validate

```
Given NSD duyet hang loat nhieu GD
  And mot so GD khong pass validate (tham quyen, trang thai, SoD...)
When he thuc xu ly lo
Then GD pass van duoc xu ly binh thuong
  And GD fail giu nguyen trang thai + ly do
  And bao cao lo (success/fail) tra ve cho NSD
```

### TC-APV-E10: Mat ket noi khi dang ky so

```
Given NSD dang ky so va mat ket noi
When he thuc phat hien mat ket noi
Then hien thi "Dang cho xac thuc"
  And cho phep thu lai (khong double-submit)
  And idempotency key dam bao khong xu ly trung
```

### TC-APV-E11: Override vuot quota thang

```
Given NSD da dung het quota override khan cap trong thang
When NSD thu override tiep
Then chan + thong bao lanh dao cap cao hon duyet thu cong
  And luu vao so ngoai le
```

### TC-APV-E12: GD ngoai gio giao dich

```
Given he thuc o ngoai khung gio giao dich
  And cau hinh khong cho phep duyet ngoai gio
When NSD thu duyet
Then chan duyet + cho phep xem
  And thong bao khung gio hop le
```

### TC-APV-E13: Qua SLA -- khong co cap cao hon de escalate

```
Given GD qua SLA nhung khong con cap cao hon de escalate
When he thuc kiem tra
Then canh bao Admin
  And ghi SLA_BREACH
  And van cho cap hien tai duyet
```

### TC-APV-E14: Uy quyen tao vong (A->B, B->A) hoac long nhieu cap

```
Given NSD (Delegatee) thu uy quyen lai cho nguoi khac
  Hoac NSD thu tao vong uy quyen (A->B va B->A da ton tai)
When he thuc validate uy quyen
Then chan + thong bao khong duoc uy quyen lai / tao vong
```

### TC-APV-E15: Delegatee co conflict voi nguoi lap GD

```
Given nguoi duoc uy quyen (Delegatee) cung la nguoi lap giao dich do (vi pham SoD)
When he thuc kiem tra truoc khi cho Delegatee duyet
Then chan + thong bao vi pham SoD
  And goi y uy quyen cho nguoi khac
```

### TC-APV-E16: Comment chua tu ngu nhay cam / PII

```
Given NSD nhap comment chua tu nhay cam hoac PII
When NSD gui comment
Then canh bao + de nghi che mask
  And van cho luu kem co flagged de hau kiem
```
