--------------------------------------------------------------------------------
-- FT-001: PAY.OUT.MANUAL — Database Schema (Oracle 19c)
--
-- Feature:   Lệnh Thanh Toán Đi Thủ Công (CRUD + Workflow Maker-Checker-Approver)
-- Author:    SA Agent
-- Date:      2026-05-19
-- Version:   1.0 (MVP)
--
-- Quy ước:
--   - Table prefix:    LTT_  (Lệnh Thanh Toán)
--   - String semantic: CHAR semantics (Unicode-safe)  -- ALTER SESSION SET NLS_LENGTH_SEMANTICS=CHAR;
--   - PK:              UUID stored as VARCHAR2(36 CHAR)
--   - Optimistic lock: column `version NUMBER(10)` (ADR-0004)
--   - Audit:           bảng LTT_AUDIT_LOG hash-chain (ADR-0003)
--   - Idempotency:     bảng LTT_IDEMPOTENCY_STORE (ADR-0005)
--   - Soft delete:     status = 'DELETED' (không có cột is_deleted riêng)
--   - SoD:             DB CHECK constraint + application guard
--
-- References:
--   - features/FT-001/02-design.md
--   - workspaces/sa/adr/0003-audit-hash-chain.md
--   - workspaces/sa/adr/0004-optimistic-lock.md
--   - workspaces/sa/adr/0005-idempotency-design.md
--   - workspaces/sa/adr/0006-coa-validation-strategy.md
--------------------------------------------------------------------------------

ALTER SESSION SET NLS_LENGTH_SEMANTICS = 'CHAR';

--------------------------------------------------------------------------------
-- 1. TABLE: LTT_PAY_ORDER (Bảng chính — Lệnh thanh toán header)
--------------------------------------------------------------------------------
CREATE TABLE LTT_PAY_ORDER (
    -- F-ID: Khoá chính UUID (INC-G-01)
    ID                       VARCHAR2(36 CHAR)   NOT NULL,

    -- F-VER: Optimistic lock version (ADR-0004, VAL-15)
    VERSION                  NUMBER(10)          DEFAULT 1 NOT NULL,

    -- F-STATUS: Trạng thái workflow (7 states MVP)
    STATUS                   VARCHAR2(30 CHAR)   NOT NULL,

    -- REF_NO: Auto-generate <KBNN>-YYYYMM-<seq6> (INC-G-02)
    REF_NO                   VARCHAR2(20 CHAR)   NOT NULL,

    -- ===== Tab B1.1: Thông tin chung =====
    CHANNEL                  VARCHAR2(30 CHAR)   NOT NULL,    -- LNH / TTSP / LIEN_KHO_BAC
    ORDER_TYPE               VARCHAR2(30 CHAR),               -- conditional (NULL khi channel=LIEN_KHO_BAC)
    LNH_TRANSACTION_TYPE     VARCHAR2(10 CHAR),               -- LTT01..LTT04, conditional khi channel=LNH
    SENDER                   VARCHAR2(20 CHAR)   NOT NULL,    -- Mã NH/KB chuyển
    RECEIVER                 VARCHAR2(20 CHAR)   NOT NULL,    -- Mã NH/KB nhận
    PAYMENT_DATE             DATE                NOT NULL,    -- Editable, validate trong kỳ OPEN
    AMOUNT                   NUMBER(18, 2)       NOT NULL,    -- = SUM(LTT_PAY_ORDER_LINE.LINE_AMOUNT)
    CURRENCY_CODE            VARCHAR2(3 CHAR)    DEFAULT 'VND' NOT NULL,
    EXCHANGE_RATE            NUMBER(18, 6),                   -- conditional, bắt buộc khi currency != VND
    ORIGIN_NUM               VARCHAR2(50 CHAR),               -- Số chứng từ gốc — bắt buộc khi channel=TTSP
    TRANSACTION_DATE         DATE,                            -- Ngày chứng từ — bắt buộc khi channel=TTSP
    EXP_TYPE                 VARCHAR2(10 CHAR),               -- EXP01..EXP05, conditional
    FN_CODE1                 VARCHAR2(3 CHAR),                -- Mã ngoại tệ trích nợ — conditional
    FN_CODE2                 VARCHAR2(3 CHAR),                -- Mã ngoại tệ TT — conditional
    FN_AMOUNT                NUMBER(18, 2),                   -- Số tiền ngoại tệ TT — conditional
    DESCRIPTION              VARCHAR2(500 CHAR)  NOT NULL,    -- Nội dung thanh toán (header)

    -- ===== Tab B1.3: Thông tin người chuyển (Payer/Sender) =====
    SENDER_NAME              VARCHAR2(200 CHAR)  NOT NULL,
    SENDER_ADDRESS           VARCHAR2(500 CHAR)  NOT NULL,
    SENDER_GL_SEGMENT2       VARCHAR2(4 CHAR)    NOT NULL,    -- TK tự nhiên người chuyển (LOV.07.2)
    SENDER_NUM               VARCHAR2(20 CHAR),               -- Mã KH
    SENDER_BANK_CODE         VARCHAR2(20 CHAR)   NOT NULL,    -- Mở tại NH/KB
    SENDER_IDENTIFY_ID       VARCHAR2(50 CHAR),               -- CMND/CCCD/HC/Mã DN
    SENDER_ISSUED_DATE       DATE,                            -- bắt buộc khi SENDER_IDENTIFY_ID NOT NULL
    SENDER_ISSUED_PLACE      VARCHAR2(200 CHAR),              -- bắt buộc khi SENDER_IDENTIFY_ID NOT NULL
    TPCP_CODE                VARCHAR2(20 CHAR),               -- Mã TPCP, bắt buộc khi order_type=Lệnh trái phiếu chính phủ

    -- ===== Tab B1.4: Thông tin người nhận (Payee/Receiver) =====
    RECEIVER_NAME            VARCHAR2(200 CHAR)  NOT NULL,
    RECEIVER_ADDRESS         VARCHAR2(500 CHAR),
    RECEIVER_GL_SEGMENT2     VARCHAR2(20 CHAR)   NOT NULL,    -- Số tài khoản người nhận
    RECEIVER_BANK_CODE       VARCHAR2(20 CHAR)   NOT NULL,    -- Mở tại NH/KB người nhận
    RECEIVER_ACCOUNT_NAME    VARCHAR2(200 CHAR)  NOT NULL,    -- Tên tài khoản người nhận
    RECEIVER_IDENTIFY_ID     VARCHAR2(50 CHAR),
    RECEIVER_ISSUED_DATE     DATE,
    RECEIVER_ISSUED_PLACE    VARCHAR2(200 CHAR),

    -- ===== Workflow attribution (Maker-Checker-Approver) =====
    KBNN_ID                  VARCHAR2(10 CHAR)   NOT NULL,    -- Mã KBNN chủ quản record (cho REF_NO + multi-tenant scope)
    CREATED_BY               VARCHAR2(36 CHAR)   NOT NULL,    -- Maker gốc
    CREATED_AT               TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    CREATED_IP               VARCHAR2(45 CHAR),               -- Audit IP (IPv6-ready, 45 chars)
    UPDATED_BY               VARCHAR2(36 CHAR),
    UPDATED_AT               TIMESTAMP(6) WITH TIME ZONE,
    UPDATED_IP               VARCHAR2(45 CHAR),
    CHECKER_ID               VARCHAR2(36 CHAR),               -- Set khi Checker action
    CHECKER_ACTION_AT        TIMESTAMP(6) WITH TIME ZONE,
    CHECKER_COMMENT          VARCHAR2(500 CHAR),              -- Lý do return/reject (≥10 ký tự)
    APPROVER_ID              VARCHAR2(36 CHAR),               -- Set khi Approver action
    APPROVER_ACTION_AT       TIMESTAMP(6) WITH TIME ZONE,
    APPROVER_COMMENT         VARCHAR2(500 CHAR),

    -- ===== Soft delete =====
    DELETE_REASON            VARCHAR2(500 CHAR),              -- Lý do xoá ≥ 10 ký tự (VAL-16, BIZ-006)
    DELETED_BY               VARCHAR2(36 CHAR),
    DELETED_AT               TIMESTAMP(6) WITH TIME ZONE,
    DELETED_IP               VARCHAR2(45 CHAR),

    -- ===== Idempotency tracking (ADR-0005) =====
    IDEMPOTENCY_KEY          VARCHAR2(64 CHAR),               -- Key của request POST tạo record

    -- ===== Constraints =====
    CONSTRAINT PK_LTT_PAY_ORDER PRIMARY KEY (ID),
    CONSTRAINT UK_LTT_PAY_ORDER_REF_NO UNIQUE (REF_NO),
    CONSTRAINT UK_LTT_PAY_ORDER_IDEMP UNIQUE (IDEMPOTENCY_KEY),

    -- STATUS enum check (7 trạng thái MVP)
    CONSTRAINT CK_LTT_PAY_ORDER_STATUS CHECK (
        STATUS IN ('DRAFT', 'READY_FOR_APPROVAL', 'PENDING_APPROVER',
                   'APPROVED', 'RETURNED_TO_MAKER', 'REJECTED', 'DELETED')
    ),

    -- CHANNEL enum
    CONSTRAINT CK_LTT_PAY_ORDER_CHANNEL CHECK (
        CHANNEL IN ('LNH', 'TTSP', 'LIEN_KHO_BAC')
    ),

    -- LNH_TRANSACTION_TYPE chỉ valid khi channel=LNH
    CONSTRAINT CK_LTT_PAY_ORDER_LNH_TYPE CHECK (
        (CHANNEL = 'LNH' AND LNH_TRANSACTION_TYPE IN ('LTT01','LTT02','LTT03','LTT04'))
        OR (CHANNEL <> 'LNH' AND LNH_TRANSACTION_TYPE IS NULL)
    ),

    -- ORDER_TYPE: bắt buộc khi channel != LIEN_KHO_BAC (INC-G-16)
    CONSTRAINT CK_LTT_PAY_ORDER_TYPE CHECK (
        (CHANNEL = 'LIEN_KHO_BAC' AND ORDER_TYPE IS NULL)
        OR (CHANNEL <> 'LIEN_KHO_BAC' AND ORDER_TYPE IS NOT NULL)
    ),

    -- AMOUNT > 0
    CONSTRAINT CK_LTT_PAY_ORDER_AMOUNT CHECK (AMOUNT > 0),

    -- VERSION >= 1
    CONSTRAINT CK_LTT_PAY_ORDER_VER CHECK (VERSION >= 1),

    -- DELETE_REASON length ∈ [10, 500] khi STATUS=DELETED (BIZ-006, VAL-16)
    CONSTRAINT CK_LTT_PAY_ORDER_DEL_REASON CHECK (
        (STATUS = 'DELETED' AND LENGTH(DELETE_REASON) BETWEEN 10 AND 500
                            AND DELETED_BY IS NOT NULL
                            AND DELETED_AT IS NOT NULL)
        OR (STATUS <> 'DELETED')
    ),

    -- CHECKER comment length ∈ [10, 500] khi có CHECKER action với return/reject
    -- (kiểm tra cấp app — DB chỉ enforce range nếu có value)
    CONSTRAINT CK_LTT_PAY_ORDER_CHK_CMT CHECK (
        CHECKER_COMMENT IS NULL OR LENGTH(CHECKER_COMMENT) BETWEEN 10 AND 500
    ),
    CONSTRAINT CK_LTT_PAY_ORDER_APR_CMT CHECK (
        APPROVER_COMMENT IS NULL OR LENGTH(APPROVER_COMMENT) BETWEEN 10 AND 500
    ),

    -- SoD: defense-in-depth (BIZ-001, INC-G-17)
    CONSTRAINT CK_LTT_PAY_ORDER_SOD_CHK CHECK (
        CHECKER_ID IS NULL OR CHECKER_ID <> CREATED_BY
    ),
    CONSTRAINT CK_LTT_PAY_ORDER_SOD_APR CHECK (
        APPROVER_ID IS NULL OR (APPROVER_ID <> CREATED_BY
                                AND (CHECKER_ID IS NULL OR APPROVER_ID <> CHECKER_ID))
    ),

    -- EXCHANGE_RATE bắt buộc khi currency != VND
    CONSTRAINT CK_LTT_PAY_ORDER_EXR CHECK (
        (CURRENCY_CODE = 'VND' AND EXCHANGE_RATE IS NULL)
        OR (CURRENCY_CODE <> 'VND' AND EXCHANGE_RATE > 0)
    ),

    -- IDENTIFY conditional: nếu có IDENTIFY_ID thì phải có ISSUED_DATE + ISSUED_PLACE
    CONSTRAINT CK_LTT_PAY_ORDER_SND_ID CHECK (
        SENDER_IDENTIFY_ID IS NULL
        OR (SENDER_ISSUED_DATE IS NOT NULL AND SENDER_ISSUED_PLACE IS NOT NULL)
    ),
    CONSTRAINT CK_LTT_PAY_ORDER_RCV_ID CHECK (
        RECEIVER_IDENTIFY_ID IS NULL
        OR (RECEIVER_ISSUED_DATE IS NOT NULL AND RECEIVER_ISSUED_PLACE IS NOT NULL)
    )
);

-- Column comments
COMMENT ON TABLE  LTT_PAY_ORDER                       IS 'FT-001 - Header bảng Lệnh thanh toán đi thủ công (PAY.OUT.MANUAL).';
COMMENT ON COLUMN LTT_PAY_ORDER.ID                    IS 'F-ID: UUID khoá chính (INC-G-01).';
COMMENT ON COLUMN LTT_PAY_ORDER.VERSION               IS 'F-VER: Optimistic lock version, tăng +1 mỗi lần UPDATE (ADR-0004, VAL-15).';
COMMENT ON COLUMN LTT_PAY_ORDER.STATUS                IS 'F-STATUS: 7 trạng thái MVP - DRAFT/READY_FOR_APPROVAL/PENDING_APPROVER/APPROVED/RETURNED_TO_MAKER/REJECTED/DELETED.';
COMMENT ON COLUMN LTT_PAY_ORDER.REF_NO                IS 'Số YCTT/Số bút toán - auto-gen pattern <KBNN>-YYYYMM-<seq6> (INC-G-02).';
COMMENT ON COLUMN LTT_PAY_ORDER.CHANNEL               IS 'Kênh: LNH (Liên ngân hàng), TTSP (Thanh toán song phương), LIEN_KHO_BAC.';
COMMENT ON COLUMN LTT_PAY_ORDER.ORDER_TYPE            IS 'Loại lệnh, phụ thuộc channel (LOV.01.Channel_Type). NULL khi channel=LIEN_KHO_BAC.';
COMMENT ON COLUMN LTT_PAY_ORDER.LNH_TRANSACTION_TYPE  IS 'Loại GD LNH (LOV.06): LTT01/02/03/04. Chỉ valid khi channel=LNH.';
COMMENT ON COLUMN LTT_PAY_ORDER.PAYMENT_DATE          IS 'Ngày thanh toán - EDITABLE, validate trong kỳ kế toán OPEN (INC-G-13).';
COMMENT ON COLUMN LTT_PAY_ORDER.AMOUNT                IS 'Số tiền chuyển - phải = SUM(LTT_PAY_ORDER_LINE.LINE_AMOUNT) (BIZ-004, VAL-07).';
COMMENT ON COLUMN LTT_PAY_ORDER.KBNN_ID               IS 'Mã KBNN chủ quản record - dùng cho REF_NO prefix và multi-tenant scope.';
COMMENT ON COLUMN LTT_PAY_ORDER.CREATED_BY            IS 'Maker gốc - SoD enforced: phải khác CHECKER_ID và APPROVER_ID (BIZ-001).';
COMMENT ON COLUMN LTT_PAY_ORDER.CHECKER_ID            IS 'User thực hiện Checker action (check-approve/return/reject).';
COMMENT ON COLUMN LTT_PAY_ORDER.APPROVER_ID           IS 'User thực hiện Approver action (approve/return/reject).';
COMMENT ON COLUMN LTT_PAY_ORDER.DELETE_REASON         IS 'Lý do xoá - bắt buộc 10..500 ký tự khi STATUS=DELETED (BIZ-006, VAL-16).';
COMMENT ON COLUMN LTT_PAY_ORDER.IDEMPOTENCY_KEY       IS 'Idempotency-Key (UUID v4) của request POST tạo record (ADR-0005).';

-- Indexes
CREATE UNIQUE INDEX UX_LTT_PAY_ORDER_REF_NO ON LTT_PAY_ORDER (REF_NO);
CREATE INDEX IX_LTT_PAY_ORDER_STATUS       ON LTT_PAY_ORDER (STATUS);
CREATE INDEX IX_LTT_PAY_ORDER_MAKER        ON LTT_PAY_ORDER (CREATED_BY, STATUS);
CREATE INDEX IX_LTT_PAY_ORDER_CHECKER      ON LTT_PAY_ORDER (CHECKER_ID);
CREATE INDEX IX_LTT_PAY_ORDER_APPROVER     ON LTT_PAY_ORDER (APPROVER_ID);
CREATE INDEX IX_LTT_PAY_ORDER_CREATED_AT   ON LTT_PAY_ORDER (CREATED_AT DESC);
CREATE INDEX IX_LTT_PAY_ORDER_PAYMENT_DATE ON LTT_PAY_ORDER (PAYMENT_DATE);
CREATE INDEX IX_LTT_PAY_ORDER_KBNN_DATE    ON LTT_PAY_ORDER (KBNN_ID, PAYMENT_DATE);

--------------------------------------------------------------------------------
-- 2. TABLE: LTT_PAY_ORDER_LINE (Chi tiết khoản mục COA - 12 segments)
--------------------------------------------------------------------------------
CREATE TABLE LTT_PAY_ORDER_LINE (
    ID                  VARCHAR2(36 CHAR)   NOT NULL,
    ORDER_ID            VARCHAR2(36 CHAR)   NOT NULL,
    LINE_NO             NUMBER(5)           NOT NULL,           -- Số thứ tự dòng (auto-increment per order)

    -- 12 COA segments (LOV.07.1..12) - thứ tự + độ dài theo spec B1.2
    GL_SEGMENT1         VARCHAR2(2 CHAR)    DEFAULT '01',       -- Mã quỹ
    GL_SEGMENT2         VARCHAR2(4 CHAR)    NOT NULL,           -- TK tự nhiên
    GL_SEGMENT3         VARCHAR2(7 CHAR)    NOT NULL,           -- DVQHNS
    GL_SEGMENT4         VARCHAR2(1 CHAR),                       -- Cấp NS (conditional)
    GL_SEGMENT5         VARCHAR2(3 CHAR)    DEFAULT '000',      -- Chương
    GL_SEGMENT6         VARCHAR2(3 CHAR)    DEFAULT '000',      -- Ngành KT
    GL_SEGMENT7         VARCHAR2(4 CHAR)    DEFAULT '0000',     -- NDKT
    GL_SEGMENT8         VARCHAR2(5 CHAR)    DEFAULT '00000',    -- ĐB
    GL_SEGMENT9         VARCHAR2(5 CHAR)    DEFAULT '00000',    -- CTMT
    GL_SEGMENT10        VARCHAR2(2 CHAR)    DEFAULT '00',       -- MN
    GL_SEGMENT11        VARCHAR2(4 CHAR)    DEFAULT '0000',     -- Kho bạc
    GL_SEGMENT12        VARCHAR2(3 CHAR)    DEFAULT '000',      -- DP (INC-A-04: default '000', không phải '00')

    -- CCID composite (cache key cho COA validator - ADR-0006)
    CCID_KEY            VARCHAR2(50 CHAR),                      -- Computed: concat các segments dùng cho cache lookup

    LINE_DESCRIPTION    VARCHAR2(500 CHAR)  NOT NULL,           -- Diễn giải dòng (INC-A-14: dùng LINE_DESCRIPTION, không DESCRIPTION)
    LINE_AMOUNT         NUMBER(18, 2)       NOT NULL,           -- Số tiền dòng - tổng phải = LTT_PAY_ORDER.AMOUNT

    CREATED_AT          TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    UPDATED_AT          TIMESTAMP(6) WITH TIME ZONE,

    CONSTRAINT PK_LTT_PAY_ORDER_LINE PRIMARY KEY (ID),
    CONSTRAINT FK_LTT_PAY_ORDER_LINE_ORDER FOREIGN KEY (ORDER_ID)
        REFERENCES LTT_PAY_ORDER (ID) ON DELETE CASCADE,
    CONSTRAINT UK_LTT_PAY_ORDER_LINE_NO UNIQUE (ORDER_ID, LINE_NO),
    CONSTRAINT CK_LTT_PAY_ORDER_LINE_AMT CHECK (LINE_AMOUNT > 0),
    CONSTRAINT CK_LTT_PAY_ORDER_LINE_NO CHECK (LINE_NO > 0)
);

COMMENT ON TABLE  LTT_PAY_ORDER_LINE                  IS 'FT-001 - Chi tiết khoản mục COA (12 segments) của lệnh thanh toán.';
COMMENT ON COLUMN LTT_PAY_ORDER_LINE.GL_SEGMENT1      IS 'Segment 1 - Mã quỹ (LOV.07.1), 2 ký tự, default 01.';
COMMENT ON COLUMN LTT_PAY_ORDER_LINE.GL_SEGMENT2      IS 'Segment 2 - TK tự nhiên (LOV.07.2), 4 ký tự, bắt buộc.';
COMMENT ON COLUMN LTT_PAY_ORDER_LINE.GL_SEGMENT3      IS 'Segment 3 - DVQHNS (LOV.07.3), 7 ký tự, bắt buộc.';
COMMENT ON COLUMN LTT_PAY_ORDER_LINE.GL_SEGMENT12     IS 'Segment 12 - DP (LOV.07.12), 3 ký tự, default 000 (sửa từ 00 theo INC-A-04).';
COMMENT ON COLUMN LTT_PAY_ORDER_LINE.CCID_KEY         IS 'Composite cache key cho COA Validator (ADR-0006). Computed at app layer.';
COMMENT ON COLUMN LTT_PAY_ORDER_LINE.LINE_DESCRIPTION IS 'Diễn giải dòng chi tiết (INC-A-14 - đổi từ DESCRIPTION → LINE_DESCRIPTION).';
COMMENT ON COLUMN LTT_PAY_ORDER_LINE.LINE_AMOUNT      IS 'Số tiền dòng - SUM(LINE_AMOUNT) phải = LTT_PAY_ORDER.AMOUNT (BIZ-004, VAL-07).';

CREATE INDEX IX_LTT_PAY_ORDER_LINE_ORDER  ON LTT_PAY_ORDER_LINE (ORDER_ID);
CREATE INDEX IX_LTT_PAY_ORDER_LINE_CCID   ON LTT_PAY_ORDER_LINE (CCID_KEY);
CREATE INDEX IX_LTT_PAY_ORDER_LINE_DVQHNS ON LTT_PAY_ORDER_LINE (GL_SEGMENT3);

--------------------------------------------------------------------------------
-- 3. TABLE: LTT_PAY_ORDER_ATTACHMENT (Đính kèm)
--------------------------------------------------------------------------------
CREATE TABLE LTT_PAY_ORDER_ATTACHMENT (
    ID              VARCHAR2(36 CHAR)   NOT NULL,
    ORDER_ID        VARCHAR2(36 CHAR)   NOT NULL,
    FILE_NAME       VARCHAR2(255 CHAR)  NOT NULL,
    DOC_TYPE        VARCHAR2(30 CHAR)   NOT NULL,    -- Chứng từ gốc/Hợp đồng/Hoá đơn/Bảng kê/Văn bản khác
    NOTE            VARCHAR2(250 CHAR),
    FILE_PATH       VARCHAR2(500 CHAR)  NOT NULL,    -- Object storage path: /ltt/{orderId}/{attachmentId}.{ext}
    FILE_SIZE       NUMBER(12)          NOT NULL,    -- bytes - check ≤ 10MB (10485760)
    CONTENT_TYPE    VARCHAR2(100 CHAR)  NOT NULL,    -- MIME type
    FILE_HASH       VARCHAR2(64 CHAR)   NOT NULL,    -- SHA-256 - chống trùng
    UPLOADED_BY     VARCHAR2(36 CHAR)   NOT NULL,
    UPLOADED_AT     TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    IS_DELETED      NUMBER(1)           DEFAULT 0 NOT NULL,  -- 0=Active, 1=Deleted (soft)
    DELETED_BY      VARCHAR2(36 CHAR),
    DELETED_AT      TIMESTAMP(6) WITH TIME ZONE,

    CONSTRAINT PK_LTT_PAY_ORDER_ATTACH PRIMARY KEY (ID),
    CONSTRAINT FK_LTT_PAY_ORDER_ATTACH_ORDER FOREIGN KEY (ORDER_ID)
        REFERENCES LTT_PAY_ORDER (ID) ON DELETE CASCADE,
    CONSTRAINT CK_LTT_PAY_ORDER_ATTACH_SIZE CHECK (FILE_SIZE > 0 AND FILE_SIZE <= 10485760),
    CONSTRAINT CK_LTT_PAY_ORDER_ATTACH_DEL  CHECK (IS_DELETED IN (0, 1)),
    CONSTRAINT CK_LTT_PAY_ORDER_ATTACH_TYPE CHECK (
        DOC_TYPE IN ('CHUNG_TU_GOC', 'HOP_DONG', 'HOA_DON', 'BANG_KE', 'VAN_BAN_KHAC')
    )
);

COMMENT ON TABLE  LTT_PAY_ORDER_ATTACHMENT             IS 'FT-001 - File đính kèm. Limit per file ≤10MB, tổng/record ≤50MB (BIZ-005, check ở app).';
COMMENT ON COLUMN LTT_PAY_ORDER_ATTACHMENT.FILE_HASH   IS 'SHA-256 toàn vẹn file + chống trùng (BIZ-AUDIT).';
COMMENT ON COLUMN LTT_PAY_ORDER_ATTACHMENT.FILE_SIZE   IS 'Bytes - DB check ≤ 10485760 (10MB). N file/record check ở app (đề xuất 10).';

CREATE INDEX IX_LTT_PAY_ORDER_ATTACH_ORDER ON LTT_PAY_ORDER_ATTACHMENT (ORDER_ID, IS_DELETED);
CREATE INDEX IX_LTT_PAY_ORDER_ATTACH_HASH  ON LTT_PAY_ORDER_ATTACHMENT (FILE_HASH);

--------------------------------------------------------------------------------
-- 4. TABLE: LTT_PAY_ORDER_APPROVAL (Lịch sử workflow - append-only)
--    Mỗi action trong state machine sinh 1 entry.
--    Dùng cho tab "Trạng thái phê duyệt" (PAY.OUT.MANUAL.VIEW.APPROVAL).
--------------------------------------------------------------------------------
CREATE TABLE LTT_PAY_ORDER_APPROVAL (
    ID              VARCHAR2(36 CHAR)   NOT NULL,
    ORDER_ID        VARCHAR2(36 CHAR)   NOT NULL,
    STEP_NO         NUMBER(5)           NOT NULL,           -- Thứ tự bước (1,2,3...)
    ACTION          VARCHAR2(30 CHAR)   NOT NULL,           -- CREATE/SUBMIT/CHECK_APPROVE/APPROVE/RETURN_BY_CHECKER/...
    FROM_STATUS     VARCHAR2(30 CHAR),
    TO_STATUS       VARCHAR2(30 CHAR)   NOT NULL,
    PERFORMED_BY    VARCHAR2(36 CHAR)   NOT NULL,
    PERFORMED_ROLE  VARCHAR2(30 CHAR)   NOT NULL,           -- MAKER/CHECKER/APPROVER
    PERFORMED_AT    TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    PERFORMED_IP    VARCHAR2(45 CHAR),
    REASON          VARCHAR2(500 CHAR),                     -- Lý do (return/reject) ≥10 ký tự
    VERSION_BEFORE  NUMBER(10),
    VERSION_AFTER   NUMBER(10),

    CONSTRAINT PK_LTT_PAY_ORDER_APPROVAL PRIMARY KEY (ID),
    CONSTRAINT FK_LTT_PAY_ORDER_APPROVAL_ORDER FOREIGN KEY (ORDER_ID)
        REFERENCES LTT_PAY_ORDER (ID) ON DELETE CASCADE,
    CONSTRAINT UK_LTT_PAY_ORDER_APPROVAL_STEP UNIQUE (ORDER_ID, STEP_NO),
    CONSTRAINT CK_LTT_PAY_ORDER_APPROVAL_ACTION CHECK (
        ACTION IN ('CREATE','UPDATE','SUBMIT','CHECK_APPROVE','APPROVE',
                   'RETURN_BY_CHECKER','REJECT_BY_CHECKER',
                   'RETURN_BY_APPROVER','REJECT_BY_APPROVER',
                   'DELETE')
    ),
    CONSTRAINT CK_LTT_PAY_ORDER_APPROVAL_ROLE CHECK (
        PERFORMED_ROLE IN ('MAKER','CHECKER','APPROVER')
    )
);

COMMENT ON TABLE LTT_PAY_ORDER_APPROVAL IS 'FT-001 - Lịch sử workflow append-only. Dùng cho tab Trạng thái phê duyệt (stepper Maker→Checker→Approver).';

CREATE INDEX IX_LTT_PAY_ORDER_APPROVAL_ORDER ON LTT_PAY_ORDER_APPROVAL (ORDER_ID, STEP_NO);

--------------------------------------------------------------------------------
-- 5. TABLE: LTT_AUDIT_LOG (Audit Hash Chain - append-only - ADR-0003)
--    Bảo vệ bằng trigger ngăn UPDATE/DELETE.
--------------------------------------------------------------------------------
CREATE TABLE LTT_AUDIT_LOG (
    ID              NUMBER(19)          NOT NULL,
    ENTITY_TYPE     VARCHAR2(50 CHAR)   NOT NULL,           -- 'PAY_ORDER', 'PAY_ORDER_LINE', 'PAY_ORDER_ATTACHMENT'
    ENTITY_ID       VARCHAR2(36 CHAR)   NOT NULL,
    ACTION          VARCHAR2(30 CHAR)   NOT NULL,           -- CREATE/UPDATE/DELETE/SUBMIT/APPROVE/REJECT/RETURN/ATTACH_UPLOAD/...
    PERFORMED_BY    VARCHAR2(36 CHAR)   NOT NULL,
    PERFORMED_AT    TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    IP_ADDRESS      VARCHAR2(45 CHAR),
    USER_AGENT      VARCHAR2(500 CHAR),
    TRACE_ID        VARCHAR2(64 CHAR),                      -- Correlation X-Request-Id
    OLD_VALUE       CLOB,                                   -- JSON snapshot trước (NULL khi CREATE)
    NEW_VALUE       CLOB,                                   -- JSON snapshot sau (NULL khi DELETE)
    VERSION_BEFORE  NUMBER(10),
    VERSION_AFTER   NUMBER(10),
    PREV_HASH       VARCHAR2(64 CHAR),                      -- SHA-256 hex của entry trước (cùng entity_id)
    HASH            VARCHAR2(64 CHAR)   NOT NULL,           -- SHA-256 hex của entry hiện tại
    GENERATED_BY    VARCHAR2(20 CHAR)   DEFAULT 'HUMAN',    -- 'AI_AGENT' / 'HUMAN' (ADR-0007)
    IS_VERIFIED     NUMBER(1)           DEFAULT 0 NOT NULL, -- Verify batch job set 1

    CONSTRAINT PK_LTT_AUDIT_LOG PRIMARY KEY (ID),
    CONSTRAINT CK_LTT_AUDIT_LOG_VERIFIED CHECK (IS_VERIFIED IN (0, 1))
);

COMMENT ON TABLE  LTT_AUDIT_LOG               IS 'FT-001 - Audit log hash chain (ADR-0003). APPEND-ONLY: trigger chặn UPDATE/DELETE.';
COMMENT ON COLUMN LTT_AUDIT_LOG.PREV_HASH     IS 'SHA-256 của entry trước cùng entity_id - chuỗi liên kết.';
COMMENT ON COLUMN LTT_AUDIT_LOG.HASH          IS 'SHA-256(prev_hash || entity_type || entity_id || action || user_id || ts || payload || ip).';
COMMENT ON COLUMN LTT_AUDIT_LOG.OLD_VALUE     IS 'JSON snapshot trước thay đổi (NULL khi action=CREATE).';
COMMENT ON COLUMN LTT_AUDIT_LOG.NEW_VALUE     IS 'JSON snapshot sau thay đổi (NULL khi action=DELETE).';

CREATE INDEX IX_LTT_AUDIT_LOG_ENTITY   ON LTT_AUDIT_LOG (ENTITY_TYPE, ENTITY_ID, PERFORMED_AT);
CREATE INDEX IX_LTT_AUDIT_LOG_USER     ON LTT_AUDIT_LOG (PERFORMED_BY, PERFORMED_AT);
CREATE INDEX IX_LTT_AUDIT_LOG_TRACE    ON LTT_AUDIT_LOG (TRACE_ID);

-- Trigger ngăn UPDATE/DELETE (immutability)
CREATE OR REPLACE TRIGGER TRG_LTT_AUDIT_LOG_IMMUTABLE
BEFORE UPDATE OR DELETE ON LTT_AUDIT_LOG
FOR EACH ROW
BEGIN
    RAISE_APPLICATION_ERROR(-20001, 'LTT_AUDIT_LOG is append-only. UPDATE/DELETE is forbidden.');
END;
/

--------------------------------------------------------------------------------
-- 6. TABLE: LTT_IDEMPOTENCY_STORE (Idempotency-Key cache - ADR-0005)
--    TTL 24h, cleanup batch job.
--------------------------------------------------------------------------------
CREATE TABLE LTT_IDEMPOTENCY_STORE (
    IDEMPOTENCY_KEY     VARCHAR2(64 CHAR)   NOT NULL,
    REQUEST_HASH        VARCHAR2(64 CHAR)   NOT NULL,    -- SHA-256 của request body, để detect "key same nhưng data khác"
    ENDPOINT            VARCHAR2(200 CHAR)  NOT NULL,    -- Vd: 'POST /api/pay-out-manual'
    RESPONSE_STATUS     NUMBER(3)           NOT NULL,
    RESPONSE_BODY       CLOB,
    USER_ID             VARCHAR2(36 CHAR),
    CREATED_AT          TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    EXPIRES_AT          TIMESTAMP(6) WITH TIME ZONE NOT NULL,

    CONSTRAINT PK_LTT_IDEMPOTENCY PRIMARY KEY (IDEMPOTENCY_KEY)
);

COMMENT ON TABLE LTT_IDEMPOTENCY_STORE IS 'FT-001 - Idempotency-Key store (ADR-0005). TTL 24h.';
CREATE INDEX IX_LTT_IDEMP_EXPIRES ON LTT_IDEMPOTENCY_STORE (EXPIRES_AT);

--------------------------------------------------------------------------------
-- 7. TABLE: LTT_REF_NO_SEQUENCE (REF_NO atomic per KBNN+month - INC-G-02)
--    Dùng row-level lock thay vì Oracle Sequence vì cần per-tenant sequence.
--------------------------------------------------------------------------------
CREATE TABLE LTT_REF_NO_SEQUENCE (
    KBNN_ID         VARCHAR2(10 CHAR)   NOT NULL,
    YEAR_MONTH      VARCHAR2(6 CHAR)    NOT NULL,        -- YYYYMM
    LAST_SEQ        NUMBER(10)          DEFAULT 0 NOT NULL,
    UPDATED_AT      TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,

    CONSTRAINT PK_LTT_REF_NO_SEQ PRIMARY KEY (KBNN_ID, YEAR_MONTH),
    CONSTRAINT CK_LTT_REF_NO_SEQ_SEQ CHECK (LAST_SEQ >= 0 AND LAST_SEQ <= 999999),
    CONSTRAINT CK_LTT_REF_NO_SEQ_YM  CHECK (REGEXP_LIKE(YEAR_MONTH, '^[0-9]{6}$'))
);

COMMENT ON TABLE LTT_REF_NO_SEQUENCE IS 'FT-001 - Sequence per (KBNN, YYYYMM) sinh REF_NO pattern <KBNN>-YYYYMM-<seq6>.';

--------------------------------------------------------------------------------
-- 8. ORACLE SEQUENCES
--------------------------------------------------------------------------------
CREATE SEQUENCE SEQ_LTT_AUDIT_LOG
    START WITH 1
    INCREMENT BY 1
    NOCACHE             -- ORDER + NOCACHE đảm bảo strict ordering cho hash chain
    NOCYCLE
    ORDER;

COMMENT ON SEQUENCE SEQ_LTT_AUDIT_LOG IS 'FT-001 - Sequence cho LTT_AUDIT_LOG.ID. NOCACHE+ORDER để đảm bảo strict ordering cho hash chain (ADR-0003).';

--------------------------------------------------------------------------------
-- 9. NOTES VỀ PERMISSIONS & SECURITY (chạy ở môi trường production)
--    -- Chỉ INSERT trên LTT_AUDIT_LOG cho application user
--    -- GRANT INSERT ON LTT_AUDIT_LOG TO LTT_APP_USER;
--    -- GRANT SELECT ON LTT_AUDIT_LOG TO LTT_APP_USER;
--    -- (Không grant UPDATE/DELETE - trigger là failsafe defense-in-depth)
--    --
--    -- Bảng LTT_IDEMPOTENCY_STORE cần cleanup batch:
--    -- DELETE FROM LTT_IDEMPOTENCY_STORE WHERE EXPIRES_AT < SYSTIMESTAMP;
--------------------------------------------------------------------------------

-- End of FT-001 schema
