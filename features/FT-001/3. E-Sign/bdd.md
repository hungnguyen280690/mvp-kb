# BDD Use Cases -- Ky so dien tu chung tu

> Ref: `E-SIGN_spec_function.md` | Agent: BA | Format: Given-When-Then

---

## Main Flow -- Ky so Kiem soat + Phe duyet (Luong chinh)

### TC-ESN-M01: Nguoi lap gui chung tu vao lo trinh ky

```
Given chung tu da hoan thien noi dung (trang thai DRAFT)
  And du lieu chung tu da qua kiem tra (VAL-CHG-*, VAL-ESIGN-*)
When Nguoi lap bam "Gui kiem soat"
Then chung tu chuyen sang trang thai PENDING_CONTROL
  And he thong phat su kien ESIGN.SUBMITTED
  And chung tu xuat hien trong danh sach cho kiem soat cua Nguoi kiem soat
```

### TC-ESN-M02: Nguoi kiem soat ky so chung tu thanh cong

```
Given chung tu o trang thai PENDING_CONTROL
  And Nguoi kiem soat co chung chi so con hieu luc, dung tham quyen
  And ket noi den CA Provider dang hoat dong
When Nguoi kiem soat bam "Kiem soat + Ky so"
  And he thong sinh PDF chinh thuc tu mau + tinh hash PDF
  And he thong gui yeu cau ky so toi CA Provider
  And Nguoi kiem soat xac thuc tren thiet bi (OTP / PIN / sinh trac) thanh cong
Then CA Provider tra ve gia tri chu ky so + dau thoi gian TSA
  And he thong ghep chu ky so (va chu ky hinh anh neu co) vao PDF theo PAdES
  And he thong xac minh ngay: toan ven + OCSP/CRL chung chi -> VALID
  And chung tu chuyen sang trang thai CONTROL_SIGNED -> PENDING_APPROVAL
  And he thong phat su kien ESIGN.SIGNED.CONTROL
  And nhat ky ghi: ma chung tu, nguoi ky, vai tro, serial chung chi, thoi diem, sessionId, hash truoc/sau
```

### TC-ESN-M03: Nguoi phe duyet ky so chung tu thanh cong -- Hoan tat

```
Given chung tu o trang thai PENDING_APPROVAL
  And PDF da co chu ky kiem soat
  And Nguoi phe duyet co chung chi so con hieu luc, dung tham quyen
  And Nguoi phe duyet khac Nguoi kiem soat (SoD)
When Nguoi phe duyet bam "Phe duyet + Ky so"
  And he thong tinh hash moi (da bao gom chu ky kiem soat) -> gui yeu cau ky
  And Nguoi phe duyet xac thuc thanh cong
Then CA Provider tra ve chu ky so + TSA
  And he thong ghep chu ky phe duyet vao PDF + xac minh -> VALID
  And chung tu chuyen sang COMPLETED
  And PDF cuoi cung duoc luu vao kho chung tu kem ban hash
  And he thong phat su kien ESIGN.SIGNED.APPROVAL va ESIGN.COMPLETED
  And thong bao gui Nguoi lap biet chung tu hoan tat
  And so lieu giam sat duoc cap nhat (so ky thanh cong, do tre, ton dong)
```

---

## Main Flow -- Ky bang USB Token

### TC-ESN-M04: Ky so bang USB token ca nhan

```
Given chung tu o trang thai cho ky (PENDING_CONTROL hoac PENDING_APPROVAL)
  And NSD co USB token ca nhan da cai dat plugin trinh duyet
When NSD bam "Ky so" -> he thong sinh hash va truyen qua plugin
  And NSD nhap PIN tren USB token
Then token tra gia tri chu ky so ve VDBAS
  And he thong ghep chu ky vao PDF + xac minh nhu luong chinh
```

---

## Main Flow -- Ky Remote Signing (HSM phia CA)

### TC-ESN-M05: Ky so Remote Signing qua ung dung di dong

```
Given chung tu o trang thai cho ky
  And NSD su dung phuong thuc Remote Signing
When he thong goi API ky tu xa toi CA Provider
  And NSD nhan thong bao tren ung dung di dong
  And NSD xac thuc sinh trac / OTP tren di dong
Then CA Provider ky bang khoa tren HSM phia CA
  And tra ve chu ky so + TSA ve VDBAS
  And he thong ghep + xac minh nhu luong chinh
```

---

## Alternate Flows

### TC-ESN-A01: Dong dau co quan tu dong (chu ky to chuc)

```
Given chung tu can dau co quan (vd: bao cao dinh ky)
  And he thuc duoc cau hinh ky tu dong bang chung chi to chuc tren HSM noi bo
When he thong kiem tra dieu kien dong dau
Then he thong tu dong ky bang chung chi to chuc (khong can thao tac nguoi dung)
  And phat su kien ESIGN.ORG.STAMP.APPLIED
  And nhat ky ghi day du
```

### TC-ESN-A02: Tra lai chung tu cho Nguoi lap

```
Given chung tu o trang thai PENDING_CONTROL hoac PENDING_APPROVAL
When Nguoi kiem soat / phe duyet chon "Tra lai" va nhap ly do
Then chung tu chuyen sang RETURNED
  And khong thuc hien ky so
  And thong bao Nguoi lap sua lai
  And phat su kien ESIGN.RETURNED
```

### TC-ESN-A03: Tu choi chung tu

```
Given chung tu o trang thai PENDING_CONTROL hoac PENDING_APPROVAL
When Nguoi kiem soat / phe duyet chon "Tu choi" va nhap ly do
Then chung tu chuyen sang REJECTED (ket thuc luong)
  And khong thuc hien ky so
  And phat su kien ESIGN.REJECTED
```

### TC-ESN-A04: Ky theo lo (batch signing)

```
Given co nhieu chung tu cung loai o trang thai cho ky cung cap
  And so chung tu khong vuot gioi han N (vd: 50)
When NSD chon nhieu chung tu va bam "Ky theo lo"
  And NSD xac thuc 1 lan
Then he thuc gom danh sach hash -> mo 1 phien ky gop
  And chu ky duoc ghep tung PDF rieng biet
  And moi chung tu co nhat ky rieng de truy vet
  And trang thai cap nhat song song
  And phat su kien ESIGN.BATCH.STARTED va ESIGN.BATCH.DONE
```

### TC-ESN-A05: Dai dien ky (uy quyen tam thoi)

```
Given co quyet dinh uy quyen con hieu luc trong he thong
  And nguoi duoc uy quyen co tham quyen ky loai chung tu do
When nguoi duoc uy quyen ky so bang chung chi ca nhan cua minh
Then nhat ky ghi ca nguoi uy quyen va nguoi duoc uy quyen
  And phat su kien ESIGN.DELEGATE.USED
```

### TC-ESN-A06: Ky lai (re-sign) khi chu ky hong

```
Given chung tu o trang thai SIGN_FAILED hoac SIGN_TIMEOUT
  And so lan ky lai chua vuot 3
When Quan trị / nguoi dung bam "Ky lai"
Then chung tu quay ve trang thai cho ky phu hop (PENDING_CONTROL hoac PENDING_APPROVAL)
  And tang resignCount
  And phat su kien ESIGN.RESIGN.MANUAL
```

### TC-ESN-A07: Doi soat cuoi ngay voi CA Provider

```
Given den thoi diem EOD (cuoi ngay)
When he thong tu dong doi chieu danh sach phien ky voi log CA Provider
  And so luong va gia tri khop nhau
Then phat su kien ESIGN.RECONCILE.MATCH
  And bao cao doi soat thanh cong
```

### TC-ESN-A08: Tam dung ken ky so (bao tri)

```
Given Quan tri can bao tri ken ky so
When Quan tri bam "Tam dung ken ky so" (kem phe duyet neu cau hinh)
Then nguoi dung khong the bat dau phien ky moi
  And phien dang do van hoan tat theo thu tu
  And phat su kien ESIGN.PAUSE
```

---

## Exception Flows

### TC-ESN-E01: Nguoi ky khong co chung chi so hieu luc

```
Given chung tu o trang thai cho ky
  And nguoi ky khong co chung chi so hoac chung chi het han
When nguoi ky bam "Ky so"
Then chan ky + thong bao gia han chung chi
  And ghi nhat ky
```

### TC-ESN-E02: Chung chi bi thu hoi (CRL/OCSP bao REVOKED)

```
Given nguoi ky co chung chi so nhung da bi thu hoi
When he thong kiem tra OCSP/CRL tai thoi diem ky
Then chan ky ngay lap tuc
  And chung tu chuyen sang SIGN_FAILED
  And canh bao bao mat
  And phat su kien ESIGN.CERT.REVOKED
```

### TC-ESN-E03: Nguoi ky khong du tham quyen voi loai chung tu

```
Given nguoi ky mo chung tu de ky
  And nguoi ky khong du tham quyen theo bang phan quyen nghiep vu
When nguoi ky bam "Ky so"
Then chan ky + thong bao + ghi nhat ky
```

### TC-ESN-E04: Nguoi dung huy phien ky tren thiet bi

```
Given phien ky dang o trang thai cho nguoi ky xac thuc (CONTROL_SIGNING hoac APPROVAL_SIGNING)
When nguoi ky huy (khong nhap PIN / huy OTP / tu choi tren di dong)
Then chung tu quay ve trang thai truoc do (PENDING_CONTROL hoac PENDING_APPROVAL)
  And cho phep thuc hien lai
  And phat su kien ESIGN.AUTH.FAILED
```

### TC-ESN-E05: Qua han xac thuc ky (timeout)

```
Given phien ky da mo nhung nguoi ky khong xac thuc trong N giay
When he thong phat hien qua han
Then tu dong dong phien ky
  And chung tu chuyen sang SIGN_TIMEOUT
  And cho phep ky lai
  And phat su kien ESIGN.TIMEOUT
  And hien thi thong bao "Da qua thoi han xac thuc ky. Vui long bat dau lai"
```

### TC-ESN-E06: Mat ket noi tam thoi toi CA Provider

```
Given he thong dang gui yeu cau ky so toi CA Provider
  And mat ket noi tam thoi
When he thong tu dong gui lai theo chinh sach gian cach tang dan (5s/15s/45s)
  And gui lai toi da 3 lan
Then neu thanh cong trong 3 lan: xu ly binh thuong
  And neu that bai ca 3 lan: chung tu chuyen sang SIGN_FAILED
  And hien thi "Mat ket noi. He thong se tu thu lai"
  And phat su kien ESIGN.RETRY
```

### TC-ESN-E07: CA Provider bao loi nghiep vu

```
Given CA Provider tra loi nghiep vu (sai dinh dang, sai cau hinh, hash khong khop)
When he thong nhan loi tu CA Provider
Then chung tu chuyen sang SIGN_FAILED
  And ghi ly do cu the
  And canh bao quan tri tich hop
  And phat su kien ESIGN.FAILED
```

### TC-ESN-E08: Vuot nguong loi lien tiep -- ngat mach tu dong

```
Given so loi lien tiep voi CA Provider vuot nguong cau hinh
When he thong phat hien nguong
Then tu dong tam dung ken ky so (circuit breaker)
  And canh bao quan tri
  And phat su kien ESIGN.CIRCUIT.OPENED
  And tu khoi phuc dan sau N giay
  And phat ESIGN.CIRCUIT.CLOSED khi khoi phuc
```

### TC-ESN-E09: TSA (dau thoi gian) khong phan hoi

```
Given he thong da nhan chu ky so thanh cong
  And can lay dau thoi gian TSA
When TSA khong phan hoi
Then tuy cau hinh:
  (1) ky khong co TSA + danh dau canh bao, hoac
  (2) chan ky + cho thu lai
  And phat su kien ESIGN.TSA.FAILED
```

### TC-ESN-E10: Xac minh sau ky that bai -- nghi van tan cong

```
Given he thong vua ghep chu ky so vao PDF
  And xac minh ngay phat hien chu ky khong hop le (toan ven that bai hoac hash khong khop)
When he thong xac minh that bai
Then huy ket qua ky ngay lap tuc
  And chung tu chuyen sang SIGN_FAILED
  And canh bao nghiem trong (co the la tan cong)
  And phat su kien ESIGN.VERIFY.FAILED
```

### TC-ESN-E11: PDF vuot kich thuoc toi da cho ky

```
Given chung tu co PDF vuot kich thuoc gioi han (vd > 10MB)
When nguoi ky bam "Ky so"
Then chan ky + thong bao + yeu cau kiem tra du lieu chung tu
  And thong bao: MSG-ERR-ESIGN-025
```

### TC-ESN-E12: Vi pham phan ly trach nhiem -- nguoi phe duyet trung nguoi kiem soat

```
Given chung tu da duoc ky kiem soat boi nguoi A
  And nguoi A cung la nguoi duoc chi dinh phe duyet
When nguoi A mo chung tu de ky phe duyet
Then chan ky + thong bao vi pham SoD
  And yeu cau chon nguoi phe duyet khac
  And thong bao: MSG-ERR-ESIGN-024
```

### TC-ESN-E13: Doi soat EOD phat hien chenh lech

```
Given he thong doi soat cuoi ngay voi CA Provider
  And phat hien chenh lech giua nhat ky VDBAS va log CA Provider
When chenh lech duoc phat hien
Then sinh bao cao chenh lech
  And canh bao quan tri
  And chan nghiep vu cuoi ngay ke tiep den khi xu ly xong
  And phat su kien ESIGN.RECONCILE.MISMATCH va ESIGN.RECONCILE.BLOCK_EOD
```

### TC-ESN-E14: Vuot so lan ky lai cho phep (3 lan)

```
Given chung tu o trang thai SIGN_FAILED
  And da ky lai 3 lan nhung van that bai
When nguoi dung / quan tri thu ky lai lan thu 4
Then chan ky lai
  And yeu cau phe duyet cap cao hoac tra ve Nguoi lap tao lai chung tu
  And chung tu chuyen sang CANCELLED
  And phat su kien ESIGN.RETRY.EXCEEDED
```

### TC-ESN-E15: Sai PIN / OTP / xac thuc sinh trac

```
Given nguoi ky dang xac thuc tren thiet bi
When nguoi ky nhap sai PIN / OTP hoac sinh trac khong khop
Then he thong thong bao "Sai PIN/OTP/xac thuc sinh trac. Vui long thu lai"
  And cho phep thu lai (khong tang so lan ky lai, chi la sai xac thuc)
  And phat su kien ESIGN.AUTH.FAILED
  And hien thi thong bao: MSG-ERR-ESIGN-043
```

### TC-ESN-E16: Chung tu o trang thai khong cho phep ky

```
Given chung tu o trang thai khong phai PENDING_CONTROL hoac PENDING_APPROVAL
  (vd: DRAFT, COMPLETED, REJECTED, RETURNED, SIGN_FAILED, CANCELLED)
When nguoi ky thu thao tac ky so
Then chan ky + thong bao trang thai hien tai khong cho phep ky
  And hien thi: MSG-ERR-ESIGN-020
```
