# Bang thuat ngu (Glossary) — TT.OUT.MANUAL

Nguon: SRS v7, 22 sheet + CONTEXT.md + business-rules.yaml + states.yaml + validation-rules.yaml
Generated: 2026-05-10 | Stage 1 — BA

## Thuat ngu nghiep vu

| Thuat ngu | Tieng Anh | Giai thich | Nguon sheet |
| :-------- | :-------- | :--------- | :---------- |
| LTT | Payment Order | Lenh thanh toan — chung tu dien tu yeu cau chuyen tien | 1-Mo ta yeu cau, 2-Bang dac ta chuc nang |
| TT.OUT.MANUAL | Manual Outgoing Payment | Phan he Lap lenh thanh toan di NHNN thu cong (da kenh LNH/SP/LKB) | HDSD, 0-Muc luc |
| TT.OUT.AUTO | Automatic Outgoing Payment | Xu ly lenh thanh toan di tu dong (da kenh) | 0-Muc luc |
| YCTT | Payment Request Number | So yeu cau thanh toan — ma dinh danh duy nhat cho mot LTT, sinh tu dong theo pattern kenh | 5.3-Mo ta Field, Button |
| NHNN | State Bank of Vietnam | Ngan hang Nha nuoc Viet Nam — ngan hang trung uong | 1-Mo ta yeu cau |
| KBNN | State Treasury | Kho bac Nha nuoc — co quan quan ly ngan sach nha nuoc | 1-Mo ta yeu cau |
| NHTM | Commercial Bank | Ngan hang thuong mai — ngan hang nhan thanh toan kenh SP | 1-Mo ta yeu cau |
| NSNN | State Budget | Ngan sach Nha nuoc — nguon von ngan sach nha nuoc | CONTEXT.md |
| DVQHNS | Budget-related Unit | Don vi co quan he ngan sach — don vi co ma dinh danh trong he thong NSNN | 5.4-Quy tac kiem tra du lieu |
| DVS DNS | Budget-using Unit | Don vi su dung ngan sach — don vi duoc giao du toan chi ngan sach | CONTEXT.md |
| NDKT | Economic Content | Noi dung kinh te — ma phan loai khoan chi (vd: luong, cong tac phi) | 5.4-Quy tac kiem tra du lieu |
| COA | Chart of Accounts | He thong muc luc ngan sach — he thong ma tai khoan ke toan nha nuoc | 5.5-Quy tac xu ly nghiep vu |
| TPCP | Government Bond | Trai phieu chinh phu — loai lenh thanh toan dac thu | 5.4-Quy tac kiem tra du lieu |
| CKS | Digital Signature | Chu ky so — ky bang chung thu so ca nhan hop le | CONTEXT.md |
| CITAD | Interbank Payment System | He thong thanh toan lien ngan hang — cong thanh toan qua NHNN | CONTEXT.md |
| GL | General Ledger | So cai ke toan KBNN (TABMIS) — nguon du lieu goc ve ke toan | 6-Outbound API Spec |
| QLT | Revenue Management | Phan he quan ly thu Ngan sach Nha nuoc | CONTEXT.md |
| QLChi | Expenditure Management | Phan he quan ly chi Ngan sach Nha nuoc, quan ly hop dong | CONTEXT.md |
| ECM | Enterprise Content Management | He thong luu tru chung tu dien tu | 5.5-Quy tac xu ly nghiep vu |
| MLNS | Budget Classification Code | Ma loai ngan sach — phan loai ngan sach theo muc luc | CONTEXT.md |
| DMHT | System Catalog/Directory | Danh muc he thong — tap hop cac bang danh muc cau hinh (DMHT01-DMHT13) | 0-Muc luc |
| QLHT | System Management | Quan ly he thong — phan he quan ly cau hinh, quyen, nguoi dung | 0-Muc luc |

## Kenh thanh toan

| Thuat ngu | Tieng Anh | Giai thich | Nguon sheet |
| :-------- | :-------- | :--------- | :---------- |
| LNH | Interbank Channel | Kenh Lien ngan hang (CITAD) — giao dich voi NHNN | 1-Mo ta yeu cau, 5.5 |
| SP | Bilateral Payment | Kenh Thanh toan song phuong — giao dich voi NHTM | 1-Mo ta yeu cau, 5.5 |
| LKB | Inter-Treasury Channel | Kenh Lien kho bac — giao dich voi KBNN khac | 1-Mo ta yeu cau, 5.5 |

## Vai tro nguoi dung

| Thuat ngu | Tieng Anh | Giai thich | Nguon sheet |
| :-------- | :-------- | :--------- | :---------- |
| Maker | Creator / Nguoi lap | Can bo DVS DNS / KBNN — tao, sua, xoa, gui LTT do minh lap | 3-Phan quyen chuc nang |
| Checker | Controller / Nguoi kiem soat | Can bo KBNN duyet cap 1 — phe duyet hoac tu choi sau khi Maker gui | 3-Phan quyen chuc nang |
| Approver | Approver / Nguoi phe duyet | Can bo KBNN duyet cap 2 — phe duyet cuoi, ky so, gui, huy | 3-Phan quyen chuc nang |
| Admin | Administrator / Quan tri | Quan tri vien don vi — tra cuu thong tin, khong tham gia tac nghiep | 3-Phan quyen chuc nang |
| SoD | Separation of Duties | Phan tach trach nhiem — dam bao mot nguoi khong dam nhan nhieu vai tro cheo nhau | 3-Phan quyen chuc nang |

## Trang thai LTT

| Thuat ngu | Tieng Anh | Giai thich | Nguon sheet |
| :-------- | :-------- | :--------- | :---------- |
| DRAFT | Draft | LTT dang nhap, chua gui kiem soat | 8-Trang thai giao dich |
| SUBMITTED | Submitted | LTT da gui kiem soat, cho Checker tham dinh | 8-Trang thai giao dich |
| IN_CONTROL | In Control | Checker da phe duyet, cho Approver phe duyet | 8-Trang thai giao dich |
| APPROVED | Approved | Approver da phe duyet, cho Ky so | 8-Trang thai giao dich |
| SIGNED | Signed | Da ky so, san sang gui NHNN/KB | 8-Trang thai giao dich |
| SENT | Sent | Da gui qua gateway, cho callback tu NH/KB | 8-Trang thai giao dich |
| CONFIRMED | Confirmed | NH/KB xac nhan thanh cong, cho GL post | 8-Trang thai giao dich |
| POSTED | Posted | GL da ghi so thanh cong, LTT khoa chinh sua | 8-Trang thai giao dich |
| CANCELLED | Cancelled | LTT da bi huy, hold quy duoc giai phong | 8-Trang thai giao dich |
| SEND_FAILED | Send Failed | Gui that bai sau retry, cho phep sua hoac huy | 8-Trang thai giao dich |
| POST_FAILED | Post Failed | GL post that bai, LTT bi chan, canh bao van hanh | 8-Trang thai giao dich |
| REVERSED | Reversed | LTT da dao, LTT goc bi khoa, LTT dao chay chu trinh moi | 8-Trang thai giao dich |
| RETURNED_TO_MAKER | Returned to Maker | Checker tu choi, LTT tra lai Maker de chinh sua | 8-Trang thai giao dich |
| RETURNED_TO_CHECKER | Returned to Checker | Approver tu choi, LTT tra lai Checker de tai tham | 8-Trang thai giao dich |
| BLOCKED | Blocked | He thong phat hien vi pham SoD hoac trung lap, chan moi thao tac | 8-Trang thai giao dich |

## Su kien / Hanh dong

| Thuat ngu | Tieng Anh | Giai thich | Nguon sheet |
| :-------- | :-------- | :--------- | :---------- |
| SUBMIT | Submit | Maker gui LTT di kiem soat (E004) | Chung-Danh sach su kien |
| APPROVE_CHECK | Approve Check | Checker phe duyet kiem soat (E005) | Chung-Danh sach su kien |
| APPROVE | Approve | Approver phe duyet cuoi (E006) | Chung-Danh sach su kien |
| REJECT | Reject | Checker/Approver tu choi (E007) | Chung-Danh sach su kien |
| CANCEL | Cancel | Approver huy LTT (E008) | Chung-Danh sach su kien |
| SIGN | Sign | Approver ky so (E009) | Chung-Danh sach su kien |
| SEND | Send | Gui LTT qua gateway (E010) | Chung-Danh sach su kien |
| REVERSE | Reverse | Tao but toan dao (E011) | Chung-Danh sach su kien |
| EDIT | Edit | Maker sua LTT (E022) | Chung-Danh sach su kien |
| DELETE | Delete | Maker xoa LTT (E014) | Chung-Danh sach su kien |
| RESEND | Resend | Approver chinh sua va gui lai sau khi gui loi | Chung-Danh sach su kien |
| CALLBACK_SUCCESS | Callback Success | NH/KB xac nhan thanh cong qua callback | 7-Trang thai tich hop |
| CALLBACK_FAIL | Callback Fail | NH/KB bao loi hoac timeout | 7-Trang thai tich hop |
| GL_SUCCESS | GL Post Success | GL ghi so thanh cong | 8-Trang thai giao dich |
| GL_FAIL | GL Post Fail | GL ghi so that bai (ky dong/COA sai) | 8-Trang thai giao dich |

## Thuat giai ky thuat

| Thuat ngu | Tieng Anh | Giai thich | Nguon sheet |
| :-------- | :-------- | :--------- | :---------- |
| TAD-COMM | Digital Signature Service | Dich vu ky so tren lenh thanh toan — tich hop HSM/USB token, PKCS#7 | 5.3-Mo ta Field, Button |
| HSM | Hardware Security Module | Thiet bi bao mat phan cung dung de quan ly va thuc hien phep ky so | 0-Muc luc |
| COT / Cut-off Time | Cut-off Time | Thoi diem ket thuc giao dich cua kenh — sau COT he thong chuyen sang ngay lam viec ke tiep | 5.5-Quy tac xu ly nghiep vu |
| DLQ | Dead-Letter Queue | Hang doi luu giu giao dich loi khong xu ly duoc tu dong | 0-Muc luc |
| MQ | Message Queue | Hang doi tin nhan — IBM MQ cho cac kenh LNH/SP/LKB | CONTEXT.md |
| Outbox | Outbox Pattern | Ghi du lieu vao DB va day tin nhan vao hang doi trong cung mot giao dich Oracle | CLAUDE.md |
| Idempotency Key | Idempotency Key | Ma dinh danh duy nhat dam bao mot yeu cau khong bi xu ly lap lai hai lan | CLAUDE.md |
| Optimistic Lock | Optimistic Lock | Kiem soat cap nhat dong thoi thong qua cot phien ban + header If-Match | 5.4-Quy tac kiem tra du lieu |
| Soft Delete | Soft Delete | Xoa mem LTT — set is_deleted=true, khong xoa vat ly trong DB | 5.5-Quy tac xu ly nghiep vu |
| Saga | Saga Orchestration | Dieu phoi giao dich phan tan bang co che dieu phoi (orchestration) cho mot LTT | CLAUDE.md |
| Correlation ID | Correlation ID | Ma doi chieu xuyen suot vong doi giao dich — theo doi tu UI den gateway den doi tac | 0-Muc luc |
| PKCS#7 | PKCS#7 | Tieu chuan ky so dien tu — dinh dang chu ky so dinh kem vao LTT | 5.3-Mo ta Field, Button |
| SHA-256 | SHA-256 | Ham bam bao mat — dung cho audit chain va luu chu ky | 5.5-Quy tac xu ly nghiep vu |

## Danh muc he thong (DMHT)

| Thuat ngu | Tieng Anh | Giai thich | Nguon sheet |
| :-------- | :-------- | :--------- | :---------- |
| DMHT01 | Bank Mapping | Danh muc NH anh xa — anh xa ma NH noi bo sang ma NH doi tac | 0-Muc luc |
| DMHT02 | Routing Rules | Nguyen tac dinh tuyen — kenh LNH/SP/LKB dua tren NH thu huong + COA | 0-Muc luc |
| DMHT06 | Fee Schedule | Bang muc phi — phi theo kenh x loai lenh x so tien | 0-Muc luc |
| DMHT09 | Unit Directory | Danh muc don vi — thong tin don vi KBNN, NH thu huong tuong ung | 5.3-Mo ta Field, Button |
| DMHT12 | Error Code Catalog | Bang ma loi — phan loai loi tam thoi / loi vinh vien | 0-Muc luc |
| DMHT13 | Journal Entry Config | Cau hinh but toan — sinh but toan dao tuong ung | 0-Muc luc |
| DMHT.COA-MATRIX | COA Matrix | Bang cau hinh to hop COA hop le — doi chieu voi QLT/QLChi | 5.5-Quy tac xu ly nghiep vu |
| QLHT.PERM_MANUAL | Permission Config | Cau hinh quyen tac nghiep thu cong — phan quyen theo vai tro x man hinh | 3-Phan quyen chuc nang |
| QLHT.APPROVAL_TREE | Approval Tree | Cay phe duyet — cap duyet theo loai LTT x so tien x kenh x KBNN | 3-Phan quyen chuc nang |
| QLHT.PORT | Port Config | Cau hinh cong ket noi runtime — endpoint theo moi truong | 0-Muc luc |
| QLHT.BAL | Balance Service | Dich vu so du — kiem tra realtime so du TK NHTM/NHNN | 5.5-Quy tac xu ly nghiep vu |
| QLHT.CHANNEL | Channel Config | Cau hinh kenh thanh toan — thong so ket noi theo kenh | 0-Muc luc |

## Cac chuc nang lien quan (SRS)

| Thuat ngu | Tieng Anh | Giai thich | Nguon sheet |
| :-------- | :-------- | :--------- | :---------- |
| TT.OUT.AUTO | Automatic Outgoing Payment | Xu ly lenh thanh toan di tu dong da kenh (LNH+SP+LKB) — pattern F.3 + F.1 | 0-Muc luc |
| TT.OUT.MANUAL | Manual Outgoing Payment | Lap lenh thanh toan di thu cong da kenh — pattern F.1 | 0-Muc luc |
| TT.IN.AUTO | Automatic Incoming Payment | Nhan va hach toan lenh thanh toan den tu dong da kenh | 0-Muc luc |
| TT.IN.MANUAL | Manual Incoming Payment | Nhap lenh thanh toan den thu cong (TTSP) | 0-Muc luc |
| TT.IN.COMPLETE | Complete Incoming Payment | Bo sung thong tin lenh thanh toan den | 0-Muc luc |
| TT.RECALL.REQ | Recall Request | Lap yeu cau thu hoi lenh thanh toan di | 0-Muc luc |
| TT.RECALL.RESP | Recall Response | Xu ly yeu cau thu hoi lenh thanh toan den | 0-Muc luc |
| TT.RECON.LNH | LNH Reconciliation | Doi soat TTLNH | 0-Muc luc |
| TT.RECON.LKB | LKB Reconciliation | Doi soat LKB | 0-Muc luc |
| TT.RECON.THCH | Treasury Reconciliation | Doi soat kho bac | 0-Muc luc |
| TT.RECON.SETTLE | Settlement Reconciliation | Xu ly ket qua quyet toan TTLNH | 0-Muc luc |
| TT.ERR.QUEUE | Error Queue | Xu ly giao dich loi trong hang doi | 0-Muc luc |
| TT.ERR.RESEND | Error Resend | Gui lai giao dich loi | 0-Muc luc |
| TT.TRACE.OUT | Outgoing Trace | Tra soat giao dich di | 0-Muc luc |
| TT.TRACE.IN | Incoming Trace | Tra soat giao dich den | 0-Muc luc |
| TT.IF.CALC | Interest Calculation | Tinh lai giao dich | 0-Muc luc |

## Quy tac tham chieu

| Thuat ngu | Tieng Anh | Giai thich | Nguon sheet |
| :-------- | :-------- | :--------- | :---------- |
| BIZ-001..BIZ-EDIT-AUDIT | Business Rules | Cac quy tac nghiep vu (29 rule) — xem business-rules.yaml | 5.5-Quy tac xu ly nghiep vu |
| VAL-001..VAL-036 | Validation Rules | Cac quy tac kiem tra du lieu (36 rule) — xem validation-rules.yaml | 5.4-Quy tac kiem tra du lieu |
| F.1 | Pattern F.1 | Mau chuc nang tac nghiep thu cong — form nhap + maker-checker workflow | 0-Muc luc |
| F.3 | Pattern F.3 | Mau chuc nang tich hop tu dong — queue-driven + gateway | 0-Muc luc |
| F.6 | Pattern F.6 | Mau chuc nang doi soat — 2-panel + match rules | 0-Muc luc |
| C.3 | Pattern C.3 | Mau danh muc he thong — CRUD + version + approval | 0-Muc luc |
| E004..E022 | Event Codes | Ma su kien nghiep vu (gui, duyet, tu choi, huy, ky, gui NH, dao, sua, xoa) | Chung-Danh sach su kien |
