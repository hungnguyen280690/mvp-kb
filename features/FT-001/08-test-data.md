# FT-001 — Test Data

## 1. Master Data (Danh mục)

### Users
| Username | Role | Đơn vị |
|----------|------|--------|
| maker01 | MAKER | KBHN001 |
| checker01 | CHECKER | KBHN001 |
| approver01 | APPROVER | KBHN001 |
| viewer01 | VIEWER | KBHN001 |

### Banks (NH/KB)
| Code | Name | Type |
|------|------|------|
| KBHN001 | KB Ha Noi | KBNN |
| KBHCM001 | KB TP HCM | KBNN |
| BIDV001 | BIDV | TM |

### Currencies
| Code | Name |
|------|------|
| VND | Viet Nam Dong |
| USD | US Dollar |

## 2. LTT Test Cases Data

### TC-001: Create LTT (kênh TTSP)
```json
{
  "channel": "TTSP",
  "transactionType": "LENH_CHUYEN_KHOAN",
  "senderCode": "KBHN001",
  "receiverCode": "KBHCM001",
  "refNo": "YCTT-2026-00001",
  "paymentDate": "2026-05-18",
  "amount": 150000000.00,
  "currencyCode": "VND",
  "originNum": "CT-2026-001",
  "transactionDate": "2026-05-18",
  "description": "Thanh toan hop dong mua sam trang thiet bi",
  "details": [
    {
      "glSegment1": "01",
      "glSegment2": "1120",
      "glSegment3": "1010101",
      "glSegment5": "040",
      "glSegment6": "260",
      "description": "Mua sam trang thiet bi van phong",
      "amount": 150000000.00
    }
  ],
  "sender": {
    "senderName": "KB Ha Noi",
    "senderAddress": "Số 1, Pham Van Dong, Ha Noi",
    "senderAccount": "1120",
    "senderBankCode": "KBHN001"
  },
  "receiver": {
    "receiverName": "KB TP HCM",
    "receiverAddress": "Số 10, Nguyen Hue, TP HCM",
    "receiverAccount": "1121",
    "receiverBankName": "KB TP HCM",
    "receiverBankCode": "KBHCM001"
  }
}
```

### TC-002: Create LTT (kênh LNH, > 500 triệu → GT cao)
```json
{
  "channel": "LNH",
  "transactionType": "LENH_THONG_THUONG",
  "lnhTransactionType": "LENH_CHUYEN_CO_GT_CAO",
  "senderCode": "KBHN001",
  "receiverCode": "BIDV001",
  "refNo": "BT-2026-00001",
  "paymentDate": "2026-05-18",
  "amount": 750000000.00,
  "currencyCode": "VND",
  "description": "Chuyen tien lien ngan hang - giao dich gia tri cao"
}
```

### TC-003: Create LTT (ngoại tệ)
```json
{
  "channel": "TTSP",
  "transactionType": "TT_BANG_NGOAI_TE_KHAC",
  "senderCode": "KBHN001",
  "receiverCode": "BIDV001",
  "refNo": "YCTT-2026-00002",
  "paymentDate": "2026-05-18",
  "amount": 50000.00,
  "currencyCode": "USD",
  "exchangeRate": 25500.00,
  "expType": "PHI_CHUYEN_TIEN",
  "fnCode1": "VND",
  "fnCode2": "USD",
  "fnAmount": 50000.00,
  "originNum": "CT-2026-002",
  "transactionDate": "2026-05-18",
  "description": "Thanh toan ngoai te"
}
```

## 3. State Transition Test Data

### Happy Path
1. maker01 tạo LTT → DRAFT (fVer=1)
2. maker01 submit → READY_FOR_APPROVAL
3. checker01 approve → PENDING_APPROVER
4. approver01 approve → APPROVED

### Error Cases
- maker01 submit → checker01 = maker01 → 403 SoD violation
- maker01 update LTT with fVer=0 → 409 Optimistic lock conflict
- maker01 delete with reason "ngắn" → 400 (min 10 chars)
- Detail amounts [100M, 60M] ≠ header amount 150M → 400 cross-validation

---
*Lịch sử*: 2026-05-18 | Khởi tạo test data cho FT-001.
