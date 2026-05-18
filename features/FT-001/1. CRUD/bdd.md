# BDD Use Cases — CRUD Giao dich Lệnh Thanh Toán

> Sinh tu dong boi BA Agent. Phu toan bo luong chinh, luong thay the, ngoai le va chuyen trang thai tu dac ta `CRUD_spec_function.md`.

---

## 1. Luong chinh (Main Flows)

### 1.1 Tao moi giao dich

```gherkin
Scenario: Maker tao moi giao dich thanh cong
  Given NSD da dang nhap he thong voi vai tro Maker
  And cac danh muc Master Data da duoc cau hinh
  When NSD bam "Them moi" tren man hinh danh sach
  Then he thong mo form trong
  And sinh F-ID cho giao dich
  And dat trang thai F-STATUS = "DRAFT"
  And tu dong dien thong tin nguoi lap va ngay lap (F-AUDIT)
  And dat F-VER = 1
```

```gherkin
Scenario: Maker nhap lieu va luu nhap thanh cong
  Given form Them moi dang mo
  And NSD da nhap day du cac truong du lieu hop le
  When NSD bam "Luu nhap"
  Then he thong validate co ban (dinh dang, bat buoc)
  And luu giao dich voi F-STATUS = "DRAFT"
  And hien thi thong bao "Luu giao dich thanh cong" (MSG-OK-SAVE)
```

### 1.2 Gui kiem soat / phe duyet (Submit)

```gherkin
Scenario: Maker Submit giao dich tu DRAFT
  Given giao dich dang o trang thai "DRAFT"
  And NSD la Maker goc cua ban ghi
  And toan bo truong bat buoc da duoc nhap hop le
  When NSD bam "Submit" (Gui kiem soat)
  Then he thong validate day du (VAL-01 den VAL-18)
  And chuyen trang thai thanh "READY_FOR_APPROVAL"
  And gui notification (in-app + email) den Checker (BIZ-009)
  And ghi audit log (user, timestamp, IP, oldValue -> newValue)
  And hien thi thong bao "Da gui giao dich de kiem soat/phe duyet" (MSG-OK-SUBMIT)
```

```gherkin
Scenario: Maker Submit giao dich tu RETURNED_TO_MAKER
  Given giao dich dang o trang thai "RETURNED_TO_MAKER"
  And NSD la Maker goc cua ban ghi
  And NSD da sua chua cac loi theo y kien tra lai
  When NSD bam "Submit"
  Then he thong validate day du
  And chuyen trang thai thanh "READY_FOR_APPROVAL"
  And gui notify Checker
  And ghi audit log
```

---

## 2. Luong thay the (Alternate Flows)

### 2.1 Sua (Edit)

```gherkin
Scenario: Maker sua giao dich DRAFT
  Given giao dich dang o trang thai "DRAFT"
  And NSD la Maker goc cua ban ghi
  When NSD bam "Sua" tren ban ghi
  Then he thong mo form editable
  And load phien ban hien hanh F-VER cua giao dich
```

```gherkin
Scenario: Maker luu thay doi sau khi sua
  Given form Sua dang mo
  And NSD da thay doi du lieu
  When NSD bam "Luu"
  Then he thong kiem tra optimistic lock (VAL-15)
  And cap nhat F-VER = F-VER + 1
  And ghi audit log oldValue -> newValue
  And hien thi MSG-OK-SAVE
```

```gherkin
Scenario: Maker sua giao dich RETURNED_TO_MAKER
  Given giao dich dang o trang thai "RETURNED_TO_MAKER"
  And NSD la Maker goc cua ban ghi
  When NSD bam "Sua"
  Then he thong mo form editable
  And cho phep thay doi cac truong thong tin
```

### 2.2 Xoa (Delete)

```gherkin
Scenario: Maker xoa giao dich DRAFT
  Given giao dich dang o trang thai "DRAFT"
  And NSD la Maker goc cua ban ghi
  When NSD bam "Xoa"
  Then he thong mo popup nhap ly do (>= 10 ky tu) + checkbox xac nhan da ra soat
```

```gherkin
Scenario: Maker xac nhan xoa thanh cong
  Given popup xoa dang mo
  And NSD da nhap ly do >= 10 ky tu
  And NSD da tick checkbox xac nhan
  When NSD bam "Xac nhan xoa"
  Then he thong thuc hien soft-delete (F-STATUS = "DELETED")
  And release hold (neu co)
  And ghi audit log
  And hien thi MSG-OK-DELETE
```

### 2.3 Copy

```gherkin
Scenario: NSD copy giao dich tu ban ghi da co
  Given NSD dang xem danh sach giao dich
  And ton tai mot ban ghi bat ky
  When NSD bam "Copy" tren ban ghi do
  Then he thong mo form Them moi voi du lieu sao chep tu ban ghi goc
  And sinh F-ID moi
  And F-STATUS = "DRAFT"
  And F-VER = 1
  And thong tin nguoi lap, ngay lap tu dong dien theo NSD hien tai
```

### 2.4 Export

```gherkin
Scenario: NSD xuat du lieu danh sach
  Given NSD dang o man hinh danh sach giao dich
  When NSD bam "Export"
  Then he thong xuat file theo dinh dang duoc chon (Excel/PDF/CSV)
  And neu so ban ghi < 50,000 thi xuat dong bo
  And neu so ban ghi >= 50,000 thi xuat bat dong bo
```

### 2.5 In phieu (Print)

```gherkin
Scenario: NSD in phieu giao dich
  Given NSD dang o tab Nhap lieu chinh cua giao dich
  When NSD bam "In phieu"
  Then he thong sinh PDF theo template
  And hien thi preview cho NSD
```

### 2.6 Huy thao tac (Cancel)

```gherkin
Scenario: NSD huy khi dang nhap lieu (form da co du lieu)
  Given NSD dang o form Them moi hoac Sua
  And form da co du lieu thay doi (dirty)
  When NSD bam "Huy"
  Then he thong hien thi xac nhan "Du lieu chua duoc luu. Ban co chac muon huy?" (MSG-CFM-CANCEL)
  When NSD xac nhan huy
  Then he thong dong form va bo qua toan bo thay doi
```

```gherkin
Scenario: NSD huy khi form chua thay doi
  Given NSD dang o form Them moi hoac Sua
  And form chua co du lieu thay doi
  When NSD bam "Huy"
  Then he thong dong form ngay lap tuc, khong hoi xac nhan
```

### 2.7 Dinh kem tep (Attachment)

```gherkin
Scenario: NSD dinh kem tep hop le
  Given form Them moi hoac Sua dang mo
  When NSD upload tep dinh kem (dung luong <= 10MB, dinh dang pdf/jpg/png/docx)
  Then he thong quet virus
  And luu tep dinh kem thanh cong
```

---

## 3. Luong phe duyet (Approval Flows)

### 3.1 Checker phe duyet

```gherkin
Scenario: Checker phe duyet giao dich (chuyen sang Approver)
  Given giao dich dang o trang thai "READY_FOR_APPROVAL"
  And NSD co vai tro Checker
  When Checker bam "Phe duyet"
  Then chuyen trang thai thanh "PENDING_APPROVER"
  And gui notification den Approver
  And ghi audit log
```

### 3.2 Checker tra lai

```gherkin
Scenario: Checker tra lai giao dich cho Maker
  Given giao dich dang o trang thai "READY_FOR_APPROVAL"
  And NSD co vai tro Checker
  When Checker bam "Tra lai" va nhap ly do (>= 10 ky tu)
  Then chuyen trang thai thanh "RETURNED_TO_MAKER"
  And gui notification den Maker
  And ghi audit log kem ly do tra lai
```

### 3.3 Checker tu choi

```gherkin
Scenario: Checker tu choi giao dich
  Given giao dich dang o trang thai "READY_FOR_APPROVAL"
  And NSD co vai tro Checker
  When Checker bam "Tu choi" va nhap ly do
  Then chuyen trang thai thanh "REJECTED"
  And gui notification den Maker
  And khoa giao dich, khong cho Sua
  And ghi audit log
```

### 3.4 Approver phe duyet

```gherkin
Scenario: Approver phe duyet giao dich
  Given giao dich dang o trang thai "PENDING_APPROVER"
  And NSD co vai tro Approver
  When Approver bam "Phe duyet"
  Then chuyen trang thai thanh "APPROVED"
  And trigger luong nghiep vu ke tiep
  And gui notification den Maker
  And ghi audit log
```

### 3.5 Approver tu choi

```gherkin
Scenario: Approver tu choi giao dich
  Given giao dich dang o trang thai "PENDING_APPROVER"
  And NSD co vai tro Approver
  When Approver bam "Tu choi" va nhap ly do
  Then chuyen trang thai thanh "REJECTED"
  And khoa giao dich
  And gui notification den Maker
  And ghi audit log
```

### 3.6 Approver tra lai

```gherkin
Scenario: Approver tra lai giao dich cho Maker
  Given giao dich dang o trang thai "PENDING_APPROVER"
  And NSD co vai tro Approver
  When Approver bam "Tra lai" va nhap ly do (>= 10 ky tu)
  Then chuyen trang thai thanh "RETURNED_TO_MAKER"
  And gui notification den Maker
  And ghi audit log
```

---

## 4. Luong ngoai le — Loi validate (Exception Flows: E1-E11)

### E1 — Truong bat buoc bi bo trong

```gherkin
Scenario: E1 - Submit khi truong bat buoc bi bo trong
  Given giao dich dang o trang thai "DRAFT"
  And mot hoac nhieu truong bat buoc chua duoc nhap
  When NSD bam "Submit"
  Then he thong highlight do cac truong loi
  And hien thi "Vui long nhap [Ten truong]" (MSG-ERR-REQUIRED)
  And chan submit
```

### E2 — Gia tri khong thuoc danh muc

```gherkin
Scenario: E2 - Nhap gia tri khong co trong danh muc Master Data
  Given form dang mo
  When NSD nhap gia tri khong ton tai trong danh muc vao truong lookup/dropdown
  Then he thong thong bao "Gia tri khong nam trong danh muc" (MSG-ERR-LOOKUP)
  And clear gia tri truong do
```

### E3 — Cross-field khong thoa man

```gherkin
Scenario: E3a - Don vi thuhuong trung don vi thanh toan
  Given form dang mo
  When NSD chon Don vi thuhuong = Don vi thanh toan
  Then he thong hien thi loi tai truong "Don vi thuhuong va Don vi thanh toan khong hop le" (MSG-ERR-CROSS-FIELD)
  And chan Submit
```

```gherkin
Scenario: E3b - Loai tien no khac loai tien co
  Given form dang mo
  When NSD chon Loai tien no <> Loai tien co
  Then he thong hien thi loi "Loai tien no phai giong Loai tien co"
  And chan Submit
```

```gherkin
Scenario: E3c - Tong dong chi tiet khac tong ban ghi cha
  Given form dang mo voi bang chi tiet
  When tong tien cac dong chi tiet khac F-AMOUNT cua ban ghi cha (vuot tolerance)
  Then he thong hien thi loi "Tong dong chi tiet phai bang tong so tien giao dich" (VAL-07)
  And chan Submit
```

### E4 — File dinh kem vuot gioi han / sai dinh dang

```gherkin
Scenario: E4a - File dinh kem vuot 10MB
  Given NSD dang o form co the dinh kem
  When NSD upload file co dung luong > 10MB
  Then he thong thong bao "File vuot gioi han hoac sai dinh dang" (MSG-ERR-FILE)
  And khong upload file
```

```gherkin
Scenario: E4b - File dinh kem sai dinh dang
  Given NSD dang o form co the dinh kem
  When NSD upload file khong phai pdf/jpg/png/docx
  Then he thong thong bao "File vuot gioi han hoac sai dinh dang" (MSG-ERR-FILE)
  And khong upload file
```

### E5 — Sua/Xoa khi trang thai khong cho phep

```gherkin
Scenario: E5 - Sua giao dich o trang thai khong cho phep
  Given giao dich dang o trang thai khac "DRAFT" va khac "RETURNED_TO_MAKER"
  When NSD bam "Sua"
  Then he thong thong bao "Giao dich dang o trang thai [<state>], khong cho phep Sua/Xoa" (MSG-ERR-STATUS)
  And disable nut Sua
  And ghi audit bao mat
```

### E6 — Khong phai Maker goc

```gherkin
Scenario: E6 - NSD khac Maker goc thu Sua giao dich
  Given giao dich dang o trang thai "DRAFT" hoac "RETURNED_TO_MAKER"
  And NSD hien tai KHONG PHAI la Maker goc cua ban ghi
  When NSD bam "Sua"
  Then he thong thong bao "Chi Nguoi lap goc moi duoc phep Sua/Xoa" (MSG-ERR-MAKER)
  And chan thao tac
  And ghi audit bao mat
```

### E7 — Optimistic lock conflict

```gherkin
Scenario: E7 - Optimistic lock conflict khi luu
  Given giao dich dang o trang thai "DRAFT"
  And Maker A da mo form Sua voi F-VER = 3
  And Maker A (hoac nguoi khac) da luu thay doi tren he thong, F-VER trong DB = 4
  When Maker A bam "Luu" voi F-VER cu = 3
  Then he thong thong bao "Ban ghi da bi thay doi tu phien khac. Vui long tai lai truoc khi tiep tuc" (MSG-ERR-LOCK)
  And chan luu
  And yeu cau tai lai du lieu
  And ghi audit
```

### E8 — Xac nhan xoa khong du dieu kien

```gherkin
Scenario: E8a - Xoa chua nhap ly do du
  Given popup xoa dang mo
  And NSD nhap ly do < 10 ky tu
  And NSD da tick checkbox
  Then nut "Xac nhan xoa" bi disable
```

```gherkin
Scenario: E8b - Xoa chua tick checkbox xac nhan
  Given popup xoa dang mo
  And NSD da nhap ly do >= 10 ky tu
  And NSD chua tick checkbox xac nhan
  Then nut "Xac nhan xoa" bi disable
```

### E9 — Vuot han muc

```gherkin
Scenario: E9 - So tien vuot han muc cau hinh
  Given form dang mo
  And NSD nhap so tien vuot han muc cau hinh theo user/don vi/san pham
  When NSD bam "Submit"
  Then he thong hien thi warning vang "So tien vuot han muc — can phe duyet cap cao hon" (MSG-WRN-LIMIT)
  And cho phep NSD tiep tuc (khong chan)
```

### E10 — Loi he thong / API timeout

```gherkin
Scenario: E10a - Loi he thong khi luu
  Given form dang mo va NSD bam "Luu" hoac "Submit"
  When he thong gap loi noi bo (DB, service, ...)
  Then hien thi "Loi he thong, traceId: <...>" (MSG-ERR-SYSTEM)
  And rollback toan bo giao dich
```

```gherkin
Scenario: E10b - API timeout
  Given NSD bam "Submit"
  And he thong khong phan hoi trong thoi gian cho phep
  Then hien thi "Yeu cau qua thoi gian xu ly, vui long thu lai" (MSG-ERR-TIMEOUT)
```

### E11 — Concurrent edit (record dang bi lock)

```gherkin
Scenario: E11 - Hai nguoi cung chinh sua mot ban ghi
  Given giao dich dang o trang thai "DRAFT"
  And NSD A dang mo form Sua (da acquire lock)
  When NSD B cung thu mo form Sua cung ban ghi
  Then he thong thong bao "Giao dich dang duoc [<user A>] chinh sua, vui long thu lai sau" (MSG-ERR-CONCURRENT)
  And chan NSD B mo form Sua
```

---

## 5. Luong ngoai le — Validate bo sung

### VAL-02 — Dinh dang du lieu khong hop le

```gherkin
Scenario: VAL-02 - Nhap sai dinh dang ngay thang
  Given form dang mo
  When NSD nhap ngay khong dung dinh dang dd/MM/yyyy
  Then he thong thong bao "Dinh dang [Ngay] khong hop le" (MSG-ERR-FORMAT)
```

```gherkin
Scenario: VAL-02 - Nhap so tien am
  Given form dang mo
  When NSD nhap so tien <= 0
  Then he thong thong bao "[So tien] nam ngoai pham vi cho phep" (MSG-ERR-RANGE)
```

### VAL-06 — Truong phu thuoc (Cascading)

```gherkin
Scenario: VAL-06 - Doi Tinh thi reset Huyen/Xa
  Given form dang mo
  And NSD da chon Tinh = "Ha Noi", Huyen = "Cau Giay", Xa = "Dich Vong"
  When NSD thay doi Tinh thanh "Ho Chi Minh"
  Then truong Huyen va Xa duoc reset ve trong
  And dropdown Huyen duoc refresh theo Tinh moi
```

### VAL-08 — Ngay khong nam trong ky ke toan

```gherkin
Scenario: VAL-08 - Nhap ngay ngoai ky ke toan mo
  Given form dang mo
  When NSD nhap ngay khong nam trong ky ke toan dang mo
  Then he thong hien thi loi "Ngay khong nam trong ky ke toan mo"
  And chan Submit
```

### VAL-10 — Ky tu dieu khien / XSS

```gherkin
Scenario: VAL-10 - Nhap ky tu doc hai vao truong Text
  Given form dang mo
  When NSD nhap chuoi chua ky tu dieu khien (\x00-\x1F) hoac script tag
  Then he thong trim va escape ky tu
  And chan submit neu van con ky tu khong hop le
```

### VAL-11 — Trung ma giao dich

```gherkin
Scenario: VAL-11 - Nhap ma giao dich trung lap
  Given form dang mo
  When NSD nhap ma giao dich / so chung tu da ton tai trong cung don vi, ky, loai
  Then he thong thong bao "Da ton tai ban ghi co [truong khoa] = [gia tri]" (MSG-ERR-DUPLICATE)
  And chan Submit
```

### VAL-17 — Truong immutable bi thay doi

```gherkin
Scenario: VAL-17 - Backend reject khi truong immutable bi sua
  Given giao dich dang duoc sua
  When client gui yeu cau update kem thay doi F-ID hoac F-AUDIT (nguoi lap, ngay lap)
  Then backend reject yeu cau
  And chi cap nhat cac truong duoc phep thay doi
```

### VAL-18 — Canh bao trung giao dich

```gherkin
Scenario: VAL-18 - Phat hien giao dich tuong tu trong N phut
  Given form Them moi dang mo
  And trong N phut qua da co giao dich cung (Don vi + So tien + So chung tu goc)
  When NSD bam "Submit"
  Then he thong hien thi warning "Phat hien giao dich tuong tu da duoc lap gan day" (MSG-WRN-DUPLICATE)
  And hien thi nut "Tiep tuc" va "Huy"
  When NSD bam "Tiep tuc"
  Then he thong cho phep Submit binh thuong
```

---

## 6. State Machine — Chuyen trang thai (Transitions)

### 6.1 Start -> Draft

```gherkin
Scenario: SM-01 Tao moi giao dich (Start -> Draft)
  Given trang thai khoi dau la "Start"
  When Maker tao moi giao dich (NEW.OPEN)
  Then chuyen sang trang thai "DRAFT"
  And sinh F-ID, F-VER = 1, F-STATUS = Draft
  And tu dong dien F-AUDIT (nguoi lap, ngay lap)
  And ghi audit log
```

### 6.2 Draft -> Draft (Save)

```gherkin
Scenario: SM-02 Luu nhap (Draft -> Draft)
  Given giao dich o trang thai "DRAFT"
  When Maker bam Luu / Luu nhap (NEW.SAVE hoac EDIT.SAVE)
  Then trang thai van la "DRAFT"
  And ghi audit; F-VER khong doi khi Save nap, F-VER+1 khi Edit.Save
  And hien thi MSG-OK-SAVE
```

### 6.3 Draft -> End (Huy chua luu)

```gherkin
Scenario: SM-03 Huy thao tac them moi chua luu (Draft chua luu -> End)
  Given giao dich o trang thai "DRAFT" va chua tung duoc Save vao DB
  When Maker huy thao tac them moi (NEW.CANCEL)
  Then chuyen sang "End"
  And dong form, bo thay doi; khong sinh ban ghi DB
```

### 6.4 Draft/Returned_To_Maker -> Draft (Edit Save)

```gherkin
Scenario: SM-04 Luu sau khi sua (Draft/Returned_To_Maker -> Draft)
  Given giao dich o trang thai "DRAFT" hoac "RETURNED_TO_MAKER"
  When Maker bam Sua va Luu (EDIT.SAVE)
  Then trang thai thanh "DRAFT"
  And kiem tra optimistic lock (VAL-15)
  And F-VER tang len 1
  And ghi audit oldValue -> newValue
```

### 6.5 Draft/Returned_To_Maker -> Ready_For_Approval (Submit)

```gherkin
Scenario: SM-05 Submit giao dich (Draft/Returned_To_Maker -> Ready_For_Approval)
  Given giao dich o trang thai "DRAFT" hoac "RETURNED_TO_MAKER"
  When Maker bam Submit (NEW.SUBMIT)
  Then trang thai thanh "READY_FOR_APPROVAL"
  And validate day du
  And gui notify Checker
  And ghi audit
```

### 6.6 Draft/Returned_To_Maker -> Deleted (Xoa)

```gherkin
Scenario: SM-06 Xoa giao dich (Draft/Returned_To_Maker -> Deleted)
  Given giao dich o trang thai "DRAFT" hoac "RETURNED_TO_MAKER"
  And NSD la Maker goc
  When Maker xac nhan xoa (DELETE.CONFIRM) voi ly do hop le
  Then trang thai thanh "DELETED"
  And soft-delete (F-STATUS = Deleted)
  And release hold (neu co)
  And ghi audit
```

### 6.7 Ready_For_Approval -> Pending_Approver (Checker phe duyet)

```gherkin
Scenario: SM-07 Checker phe duyet (Ready_For_Approval -> Pending_Approver)
  Given giao dich o trang thai "READY_FOR_APPROVAL"
  When Checker phe duyet (APPROVE.CHECKER)
  Then trang thai thanh "PENDING_APPROVER"
  And gui notify Approver
  And ghi audit
```

### 6.8 Ready_For_Approval -> Returned_To_Maker (Checker tra lai)

```gherkin
Scenario: SM-08 Checker tra lai (Ready_For_Approval -> Returned_To_Maker)
  Given giao dich o trang thai "READY_FOR_APPROVAL"
  When Checker tra lai (APPROVE.RETURN) voi ly do >= 10 ky tu
  Then trang thai thanh "RETURNED_TO_MAKER"
  And gui notify Maker
  And ghi audit kem ly do
```

### 6.9 Ready_For_Approval -> Rejected (Checker tu choi)

```gherkin
Scenario: SM-09 Checker tu choi (Ready_For_Approval -> Rejected)
  Given giao dich o trang thai "READY_FOR_APPROVAL"
  When Checker tu choi (APPROVE.REJECT) voi ly do
  Then trang thai thanh "REJECTED"
  And khoa giao dich
  And gui notify Maker
  And ghi audit
```

### 6.10 Pending_Approver -> Approved (Approver phe duyet)

```gherkin
Scenario: SM-10 Approver phe duyet (Pending_Approver -> Approved)
  Given giao dich o trang thai "PENDING_APPROVER"
  When Approver phe duyet (APPROVE.APPROVER)
  Then trang thai thanh "APPROVED"
  And trigger luong nghiep vu ke tiep
  And gui notify Maker
  And ghi audit
```

### 6.11 Pending_Approver -> Returned_To_Maker (Approver tra lai)

```gherkin
Scenario: SM-11 Approver tra lai (Pending_Approver -> Returned_To_Maker)
  Given giao dich o trang thai "PENDING_APPROVER"
  When Approver tra lai (APPROVE.RETURN) voi ly do >= 10 ky tu
  Then trang thai thanh "RETURNED_TO_MAKER"
  And gui notify Maker
  And ghi audit
```

### 6.12 Pending_Approver -> Rejected (Approver tu choi)

```gherkin
Scenario: SM-12 Approver tu choi (Pending_Approver -> Rejected)
  Given giao dich o trang thai "PENDING_APPROVER"
  When Approver tu choi (APPROVE.REJECT) voi ly do
  Then trang thai thanh "REJECTED"
  And khoa giao dich
  And gui notify Maker
  And ghi audit
```

### 6.13 Approved -> Transferred_to_GL -> Posted

```gherkin
Scenario: SM-13 Hach toan va ghi so (Approved -> Transferred_to_GL -> Posted)
  Given giao dich o trang thai "APPROVED"
  When he thong trigger hach toan
  Then trang thai thanh "TRANSFERRED_TO_GL"
  And ghi audit
  When he thong trigger ghi so
  Then trang thai thanh "POSTED"
  And ghi audit
```

### 6.14 End (Dong nghiep vu)

```gherkin
Scenario: SM-14 Dong nghiep vu (Posted/Rejected/Deleted -> End)
  Given giao dich o trang thai "POSTED", "REJECTED" hoac "DELETED"
  When he thong dong nghiep vu
  Then chuyen sang "End"
  And khoa toan bo thao tac Sua/Xoa
  And chi cho phep Xem
  And ghi audit truy cap
```

### 6.15 Vi pham — Sua/Xoa trang thai khong cho phep

```gherkin
Scenario: SM-15 Thu Sua/Xoa o trang thai bi cam
  Given giao dich o trang thai "READY_FOR_APPROVAL" hoac "PENDING_APPROVER" hoac "APPROVED" hoac "POSTED" hoac "REJECTED" hoac "DELETED"
  When NSD thu Sua hoac Xoa
  Then trang thai khong doi
  And chan thao tac (VAL-13)
  And thong bao MSG-ERR-STATUS
  And disable nut Sua/Xoa
  And ghi audit bao mat
```

### 6.16 Vi pham — NSD khac Maker goc

```gherkin
Scenario: SM-16 NSD khac Maker goc thu Sua/Xoa
  Given giao dich o trang thai "DRAFT" hoac "RETURNED_TO_MAKER"
  And NSD khong phai Maker goc
  When NSD thu Sua hoac Xoa
  Then trang thai khong doi
  And chan thao tac (VAL-14)
  And thong bao MSG-ERR-MAKER
  And ghi audit bao mat
```

### 6.17 Quan tri — Khoi phuc ban ghi da xoa

```gherkin
Scenario: SM-17 Quan tri khoi phuc ban ghi da xoa (Deleted -> Draft)
  Given giao dich o trang thai "DELETED"
  And NSD co quyen Quan tri hoac theo quy trinh duyet
  When NSD thuc hien khoi phuc
  Then trang thai thanh "DRAFT"
  And Restore F-STATUS = Draft
  And ghi audit khoi phuc
```

---

## 7. Phien dang nhap va bao mat

```gherkin
Scenario: Phiên dang nhap het han
  Given NSD dang thao tac tren form (bat ky trang thai nao)
  When phien dang nhap het han
  Then he thong hien thi "Phien dang nhap da het han, vui long dang nhap lai" (MSG-ERR-SESSION)
  And buoc dang nhap lai
  And luu draft tam (neu form dang dirty)
```

```gherkin
Scenario: NSD khong co quyen truy cap
  Given NSD da dang nhap nhung khong co vai tro Maker/Checker/Approver/Viewer
  When NSD thu truy cap man hinh giao dich
  Then he thong thong bao "Ban khong co quyen thuc hien thao tac nay" (MSG-ERR-PERMISSION)
```

```gherkin
Scenario: Maker-Checker-Approver phai la nhung nguoi khac nhau
  Given giao dich da duoc tao boi Maker A
  When Maker A thu phe duyet chinh giao dich minh tao
  Then he thong chan vi pham phan tach trach nhiem (SoD) (BIZ-001)
  And thong bao "Ban khong the phe duyet giao dich do chinh minh tao"
```

---

## Tom tat do phu

| Nhom | So scenario |
|---|---|
| Luong chinh (Tao, Luu, Submit) | 4 |
| Luong thay the (Sua, Xoa, Copy, Export, Print, Huy, Dinh kem) | 12 |
| Luong phe duyet (Checker, Approver) | 6 |
| Ngoai le validate (E1-E11) | 15 |
| Validate bo sung (VAL-02,06,08,10,11,17,18) | 8 |
| Chuyen trang thai (SM-01 den SM-17) | 17 |
| Phien & bao mat | 3 |
| **Tong cong** | **65** |

---

## 8. Role-based UI Visibility (Hiển thị theo vai trò)

> Bổ sung sau khi phát hiện thiếu: UI phải hiện/ẩn nút và hành động theo vai trò NSD.

### 8.1 Maker — Màn hình danh sách

```gherkin
Scenario: Maker thay cac nut thao tac tren man hinh danh sach
  Given NSD dang nhap voi vai tro Maker
  When hien thi man hinh danh sach giao dich
  Then hien thi nut "Them moi"
  And hien thi nut "Xuat Excel"
  And voi moi giao dich trang thai DRAFT hoac RETURNED_TO_MAKER cua Maker do
  Then hien thi nut "Sua" va "Xoa"
  And voi moi giao dich trang thai DRAFT hoac RETURNED_TO_MAKER cua Maker do
  Then hien thi nut "Gui kiem soat"
  And an nut "Kiem soat", "Phe duyet", "Tu choi"
```

### 8.2 Checker — Màn hình danh sách

```gherkin
Scenario: Checker thay cac nut thao tac tren man hinh danh sach
  Given NSD dang nhap voi vai tro Checker
  When hien thi man hinh danh sach giao dich
  Then an nut "Them moi"
  And voi moi giao dich trang thai READY_FOR_APPROVAL
  Then hien thi nut "Kiem soat" va "Tu choi"
  And voi moi giao dich trang thai khac
  Then chi hien thi nut "Xem"
  And an nut "Sua", "Xoa", "Gui kiem soat", "Phe duyet"
```

### 8.3 Approver — Màn hình danh sách

```gherkin
Scenario: Approver thay cac nut thao tac tren man hinh danh sach
  Given NSD dang nhap voi vai tro Approver
  When hien thi man hinh danh sach giao dich
  Then an nut "Them moi"
  And voi moi giao dich trang thai PENDING_APPROVER
  Then hien thi nut "Phe duyet" va "Tu choi"
  And voi moi giao dich trang thai khac
  Then chi hien thi nut "Xem"
  And an nut "Sua", "Xoa", "Gui kiem soat", "Kiem soat"
```

### 8.4 Viewer/Admin — Màn hình danh sách

```gherkin
Scenario: Viewer chi xem duoc khong co nut thao tac
  Given NSD dang nhap voi vai tro Viewer
  When hien thi man hinh danh sach giao dich
  Then moi giao dich chi hien thi nut "Xem"
  And an tat ca cac nut "Them moi", "Sua", "Xoa", "Gui kiem soat", "Kiem soat", "Phe duyet"
```

### 8.5 Maker — Màn hình chi tiết

```gherkin
Scenario: Maker xem chi tiet giao dich DRAFT
  Given NSD dang nhap voi vai tro Maker
  And giao dich trang thai DRAFT do chinh Maker tao
  When mo man hinh chi tiet
  Then hien thi nut "Sua", "Xoa", "Gui kiem soat", "Luu nhap"
  And hien thi tab "Thong tin", "Dinh kem", "Lich su giao dich"
```

```gherkin
Scenario: Maker xem chi tiet giao dich da gui kiem soat
  Given NSD dang nhap voi vai tro Maker
  And giao dich trang thai READY_FOR_APPROVAL do chinh Maker tao
  When mo man hinh chi tiet
  Then an nut "Sua", "Xoa", "Gui kiem soat"
  And hien thi thong bao trang thai "Dang cho kiem soat"
```

### 8.6 Role switcher cho Demo

```gherkin
Scenario: Chuyen vai tro tren giao dien demo
  Given ung dung dang o che do demo
  When NSD chon vai tro tu dropdown "Vai tro" tren thanh header
  Then giao dien cap nhat ngay:
    | Vai tro    | Ten hien thi      | Nut hien thi tren danh sach                    |
    | Maker      | Nguoi lap         | Them moi, Sua, Xoa, Gui kiem soat             |
    | Checker    | Nguoi kiem soat   | Kiem soat, Tu choi (voi GD cho kiem soat)     |
    | Approver   | Nguoi phe duyet   | Phe duyet, Tu choi (voi GD cho phe duyet)     |
    | Admin      | Quan tri he thong | Tat ca cac nut                                |
  And badge mau sac cua trang thai giao dich khong doi
```
