-- =============================================================================
-- Feature  : FT-001 - Quản lý Lệnh Thanh Toán (Payment Order Management)
-- Artifact : 03-schema.sql
-- Author   : SA Agent
-- Engine   : Oracle 19c
-- Date     : 2026-05-18
-- =============================================================================
-- Luồng table:
--   LTT_HEADER   (Bản ghi chính Lệnh Thanh Toán)
--   LTT_DETAIL   (Chi tiết khoản mục hach toán - 1:N)
--   LTT_SENDER   (Thông tin người/bên chuyển)
--   LTT_RECEIVER (Thông tin người/bên nhận)
--   LTT_ATTACHMENT (File đính kèm)
--   LTT_AUDIT    (Nhật ký kiểm toán + Hash Chain)
-- =============================================================================

-- ========================== SEQUENCES =======================================

CREATE SEQUENCE SEQ_LTT_HEADER_ID
    MINVALUE 1 MAXVALUE 9999999999999999999999999999
    INCREMENT BY 1 START WITH 1 CACHE 500 NOORDER NOCYCLE;

CREATE SEQUENCE SEQ_LTT_DETAIL_ID
    MINVALUE 1 MAXVALUE 9999999999999999999999999999
    INCREMENT BY 1 START WITH 1 CACHE 500 NOORDER NOCYCLE;

CREATE SEQUENCE SEQ_LTT_SENDER_ID
    MINVALUE 1 MAXVALUE 9999999999999999999999999999
    INCREMENT BY 1 START WITH 1 CACHE 500 NOORDER NOCYCLE;

CREATE SEQUENCE SEQ_LTT_RECEIVER_ID
    MINVALUE 1 MAXVALUE 9999999999999999999999999999
    INCREMENT BY 1 START WITH 1 CACHE 500 NOORDER NOCYCLE;

CREATE SEQUENCE SEQ_LTT_ATTACHMENT_ID
    MINVALUE 1 MAXVALUE 9999999999999999999999999999
    INCREMENT BY 1 START WITH 1 CACHE 500 NOORDER NOCYCLE;

CREATE SEQUENCE SEQ_LTT_AUDIT_ID
    MINVALUE 1 MAXVALUE 9999999999999999999999999999
    INCREMENT BY 1 START WITH 1 CACHE 500 NOORDER NOCYCLE;


-- ========================== LTT_HEADER ======================================
-- Bang ghi chinh cua Lenh Thanh Toan (Payment Order Header)

CREATE TABLE LTT_HEADER (
    -- Primary Key
    F_ID               VARCHAR2(50)    NOT NULL,

    -- Business identifiers
    REF_NO             VARCHAR2(50)    NOT NULL,       -- So YCTT/but toan
    IDEMPOTENCY_KEY    VARCHAR2(64),                   -- Chong lap lenh (Idempotency)

    -- Channel & transaction classification
    CHANNEL            VARCHAR2(20)    NOT NULL,       -- Kenh: LNH / TTSP
    TRANSACTION_TYPE   VARCHAR2(50)    NOT NULL,       -- Loai lenh
    LNH_TRANSACTION_TYPE VARCHAR2(50),                 -- Loai GD LNH (nullable)

    -- Parties
    SENDER_CODE        VARCHAR2(20)    NOT NULL,       -- NH/KB chuyen
    RECEIVER_CODE      VARCHAR2(20)    NOT NULL,       -- NH/KB nhan

    -- Financial details
    PAYMENT_DATE       DATE            NOT NULL,       -- Ngay thanh toan
    AMOUNT             NUMBER(18,2)    NOT NULL,       -- So tien chuyen
    CURRENCY_CODE      VARCHAR2(3)     DEFAULT 'VND' NOT NULL,  -- Loai tien
    EXCHANGE_RATE      NUMBER(18,6),                   -- Ty gia (nullable)

    -- Reference documents
    ORIGIN_NUM         VARCHAR2(50),                   -- So chung tu goc
    TRANSACTION_DATE   DATE,                           -- Ngay chung tu

    -- Fee & foreign-currency accounting
    EXP_TYPE           VARCHAR2(20),                   -- Loai phi
    FN_CODE1           VARCHAR2(3),                    -- Ma NT trich no
    FN_CODE2           VARCHAR2(3),                    -- Ma NT TT
    FN_AMOUNT          NUMBER(18,2),                   -- So tien NT TT

    -- Content
    DESCRIPTION        VARCHAR2(500)   NOT NULL,       -- Noi dung thanh toan

    -- Lifecycle state & optimistic locking
    F_STATUS           VARCHAR2(30)    DEFAULT 'DRAFT' NOT NULL,
    F_VER              NUMBER(10)      DEFAULT 0 NOT NULL,

    -- Maker
    CREATED_BY         VARCHAR2(50)    NOT NULL,
    CREATED_DATE       TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,

    -- Checker
    CHECKED_BY         VARCHAR2(50),
    CHECKED_DATE       TIMESTAMP,

    -- Approver
    APPROVED_BY        VARCHAR2(50),
    APPROVED_DATE      TIMESTAMP,

    -- Soft-delete (F_STATUS = 'DELETED')
    DELETED_BY         VARCHAR2(50),
    DELETED_DATE       TIMESTAMP,
    DELETE_REASON      VARCHAR2(500),

    -- Last update
    UPDATED_BY         VARCHAR2(50),
    UPDATED_DATE       TIMESTAMP,

    -- Constraints
    CONSTRAINT PK_LTT_HEADER PRIMARY KEY (F_ID),

    CONSTRAINT CK_LTT_STATUS CHECK (
        F_STATUS IN (
            'DRAFT',
            'READY_FOR_APPROVAL',
            'PENDING_APPROVER',
            'APPROVED',
            'TRANSFERRED_TO_GL',
            'POSTED',
            'RETURNED_TO_MAKER',
            'REJECTED',
            'DELETED'
        )
    ),

    CONSTRAINT CK_LTT_AMOUNT_POSITIVE CHECK (AMOUNT > 0),
    CONSTRAINT CK_LTT_CHANNEL CHECK (CHANNEL IN ('LNH', 'TTSP')),
    CONSTRAINT CK_LTT_CURRENCY CHECK (CURRENCY_CODE IS NOT NULL AND LENGTH(CURRENCY_CODE) = 3),
    CONSTRAINT CK_LTT_VER_NON_NEG CHECK (F_VER >= 0)
);

-- Table comment
COMMENT ON TABLE  LTT_HEADER             IS 'FT-001: Ban ghi chinh Lenh Thanh Toan (Payment Order Header)';

-- Column comments
COMMENT ON COLUMN LTT_HEADER.F_ID                 IS 'Khoa chinh - ID giao dich';
COMMENT ON COLUMN LTT_HEADER.REF_NO               IS 'So Yeu cau Thanh Toan / But toan';
COMMENT ON COLUMN LTT_HEADER.IDEMPOTENCY_KEY       IS 'Idempotency key - chong lap lenh (X-Request-ID)';
COMMENT ON COLUMN LTT_HEADER.CHANNEL              IS 'Kenh giao dich: LNH (Lien Ngan Hang) / TTSP (Trung Tam San pham)';
COMMENT ON COLUMN LTT_HEADER.TRANSACTION_TYPE     IS 'Loai lenh thanh toan';
COMMENT ON COLUMN LTT_HEADER.LNH_TRANSACTION_TYPE  IS 'Loai giao dich LNH (chi ap dung khi CHANNEL = LNH)';
COMMENT ON COLUMN LTT_HEADER.SENDER_CODE          IS 'Ma Ngan hang / Kho Bac chuyen';
COMMENT ON COLUMN LTT_HEADER.RECEIVER_CODE        IS 'Ma Ngan hang / Kho Bac nhan';
COMMENT ON COLUMN LTT_HEADER.PAYMENT_DATE         IS 'Ngay thanh toan';
COMMENT ON COLUMN LTT_HEADER.AMOUNT               IS 'So tien chuyen (VND hoac ngoai te)';
COMMENT ON COLUMN LTT_HEADER.CURRENCY_CODE        IS 'Ma loai tien te (ISO 4217), mac dinh VND';
COMMENT ON COLUMN LTT_HEADER.EXCHANGE_RATE        IS 'Ty gia (ap dung khi ngoai te)';
COMMENT ON COLUMN LTT_HEADER.ORIGIN_NUM           IS 'So chung tu goc';
COMMENT ON COLUMN LTT_HEADER.TRANSACTION_DATE     IS 'Ngay chung tu';
COMMENT ON COLUMN LTT_HEADER.EXP_TYPE             IS 'Loai phi';
COMMENT ON COLUMN LTT_HEADER.FN_CODE1             IS 'Ma ngoai te trich no';
COMMENT ON COLUMN LTT_HEADER.FN_CODE2             IS 'Ma ngoai te thanh toan';
COMMENT ON COLUMN LTT_HEADER.FN_AMOUNT            IS 'So tien ngoai te thanh toan';
COMMENT ON COLUMN LTT_HEADER.DESCRIPTION          IS 'Noi dung thanh toan';
COMMENT ON COLUMN LTT_HEADER.F_STATUS             IS 'Trang thai lenh (State Machine)';
COMMENT ON COLUMN LTT_HEADER.F_VER                IS 'Phien ban - Optimistic Locking';
COMMENT ON COLUMN LTT_HEADER.CREATED_BY           IS 'Nguoi tao (Maker)';
COMMENT ON COLUMN LTT_HEADER.CREATED_DATE         IS 'Thoi diem tao';
COMMENT ON COLUMN LTT_HEADER.CHECKED_BY           IS 'Nguoi kiem tra (Checker)';
COMMENT ON COLUMN LTT_HEADER.CHECKED_DATE         IS 'Thoi diem kiem tra';
COMMENT ON COLUMN LTT_HEADER.APPROVED_BY          IS 'Nguoi phe duyet (Approver)';
COMMENT ON COLUMN LTT_HEADER.APPROVED_DATE        IS 'Thoi diem phe duyet';
COMMENT ON COLUMN LTT_HEADER.DELETED_BY           IS 'Nguoi xoa (soft-delete)';
COMMENT ON COLUMN LTT_HEADER.DELETED_DATE         IS 'Thoi diem xoa';
COMMENT ON COLUMN LTT_HEADER.DELETE_REASON        IS 'Ly do xoa';
COMMENT ON COLUMN LTT_HEADER.UPDATED_BY           IS 'Nguoi cap nhat cuoi';
COMMENT ON COLUMN LTT_HEADER.UPDATED_DATE         IS 'Thoi diem cap nhat cuoi';


-- ========================== LTT_DETAIL ======================================
-- Chi tiet khoan muc hach toan (GL entry lines - 1:N per LTT)

CREATE TABLE LTT_DETAIL (
    ID                 NUMBER(19)      NOT NULL,
    LTT_ID             VARCHAR2(50)    NOT NULL,

    LINE_NO            NUMBER(5)       NOT NULL,       -- Thu tu dong

    -- 12 Chart-of-Account segments (COA flex-field)
    GL_SEGMENT1        VARCHAR2(30)    NOT NULL,
    GL_SEGMENT2        VARCHAR2(30)    NOT NULL,
    GL_SEGMENT3        VARCHAR2(30),
    GL_SEGMENT4        VARCHAR2(30),
    GL_SEGMENT5        VARCHAR2(30),
    GL_SEGMENT6        VARCHAR2(30),
    GL_SEGMENT7        VARCHAR2(30),
    GL_SEGMENT8        VARCHAR2(30),
    GL_SEGMENT9        VARCHAR2(30),
    GL_SEGMENT10       VARCHAR2(30),
    GL_SEGMENT11       VARCHAR2(30),
    GL_SEGMENT12       VARCHAR2(30),

    LINE_DESCRIPTION   VARCHAR2(500),
    LINE_AMOUNT        NUMBER(18,2)    NOT NULL,

    -- Metadata
    CREATED_BY         VARCHAR2(50)    NOT NULL,
    CREATED_DATE       TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,
    UPDATED_BY         VARCHAR2(50),
    UPDATED_DATE       TIMESTAMP,

    -- Constraints
    CONSTRAINT PK_LTT_DETAIL PRIMARY KEY (ID),

    CONSTRAINT FK_LTT_DETAIL_HEADER
        FOREIGN KEY (LTT_ID)
        REFERENCES LTT_HEADER (F_ID)
        ON DELETE CASCADE,

    CONSTRAINT CK_LTT_DETAIL_LINE_NO CHECK (LINE_NO > 0),
    CONSTRAINT CK_LTT_DETAIL_AMOUNT  CHECK (LINE_AMOUNT <> 0)
);

COMMENT ON TABLE  LTT_DETAIL              IS 'FT-001: Chi tiet khoan muc hach toan cua Lenh Thanh Toan (GL entry lines)';

COMMENT ON COLUMN LTT_DETAIL.ID            IS 'Khoa chinh (auto-generated)';
COMMENT ON COLUMN LTT_DETAIL.LTT_ID        IS 'FK -> LTT_HEADER.F_ID';
COMMENT ON COLUMN LTT_DETAIL.LINE_NO       IS 'Thu tu dong chi tiet';
COMMENT ON COLUMN LTT_DETAIL.GL_SEGMENT1   IS 'COA Segment 1 (bu lai bu chi/kinh phi)';
COMMENT ON COLUMN LTT_DETAIL.GL_SEGMENT2   IS 'COA Segment 2 (don vi)';
COMMENT ON COLUMN LTT_DETAIL.LINE_DESCRIPTION IS 'Mo ta khoan muc';
COMMENT ON COLUMN LTT_DETAIL.LINE_AMOUNT   IS 'So tien khoan muc (duong = No, am = Co)';


-- ========================== LTT_SENDER ======================================
-- Thong tin nguoi/ben chuyen tien

CREATE TABLE LTT_SENDER (
    ID                 NUMBER(19)      NOT NULL,
    LTT_ID             VARCHAR2(50)    NOT NULL,

    SENDER_NAME        VARCHAR2(200)   NOT NULL,       -- Ten nguoi/ben chuyen
    SENDER_ADDRESS     VARCHAR2(500),
    SENDER_ACCOUNT     VARCHAR2(30)    NOT NULL,       -- So tai khoan chuyen
    SENDER_NUM         VARCHAR2(50),                   -- So tham chieu nguoi chuyen
    SENDER_BANK_CODE   VARCHAR2(20)    NOT NULL,       -- Ma NH/KB cua nguoi chuyen
    SENDER_IDENTIFY_ID VARCHAR2(30),                   -- So CMND/CCCD/Ho chieu
    SENDER_ISSUED_DATE DATE,                           -- Ngay cap giay to
    SENDER_ISSUED_PLACE VARCHAR2(200),                 -- Noi cap giay to
    TPCP_CODE          VARCHAR2(20),                   -- Ma trai phieu chinh phu (neu co)

    -- Metadata
    CREATED_BY         VARCHAR2(50)    NOT NULL,
    CREATED_DATE       TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,
    UPDATED_BY         VARCHAR2(50),
    UPDATED_DATE       TIMESTAMP,

    -- Constraints
    CONSTRAINT PK_LTT_SENDER PRIMARY KEY (ID),

    CONSTRAINT FK_LTT_SENDER_HEADER
        FOREIGN KEY (LTT_ID)
        REFERENCES LTT_HEADER (F_ID)
        ON DELETE CASCADE
);

COMMENT ON TABLE  LTT_SENDER              IS 'FT-001: Thong tin nguoi/ben chuyen tien (Sender info)';

COMMENT ON COLUMN LTT_SENDER.SENDER_NAME        IS 'Ten nguoi hoac don vi chuyen tien';
COMMENT ON COLUMN LTT_SENDER.SENDER_ACCOUNT     IS 'So tai khoan nguoi chuyen';
COMMENT ON COLUMN LTT_SENDER.SENDER_BANK_CODE   IS 'Ma Ngan hang / Kho Bac cua nguoi chuyen';
COMMENT ON COLUMN LTT_SENDER.SENDER_IDENTIFY_ID IS 'So CMND/CCCD/Ho chieu nguoi chuyen';
COMMENT ON COLUMN LTT_SENDER.TPCP_CODE          IS 'Ma Trai phieu Chinh phu (ap dung khi giao dich trai phieu)';


-- ========================== LTT_RECEIVER ====================================
-- Thong tin nguoi/ben nhan tien

CREATE TABLE LTT_RECEIVER (
    ID                  NUMBER(19)      NOT NULL,
    LTT_ID              VARCHAR2(50)    NOT NULL,

    RECEIVER_NAME       VARCHAR2(200)   NOT NULL,      -- Ten nguoi/ben nhan
    RECEIVER_ADDRESS    VARCHAR2(500),
    RECEIVER_ACCOUNT    VARCHAR2(30)    NOT NULL,      -- So tai khoan nhan
    RECEIVER_BANK_NAME  VARCHAR2(200)   NOT NULL,      -- Ten NH nhan
    RECEIVER_BANK_CODE  VARCHAR2(20)    NOT NULL,      -- Ma NH/KB nhan
    RECEIVER_IDENTIFY_ID VARCHAR2(30),                  -- So CMND/CCCD
    RECEIVER_ISSUED_DATE DATE,                          -- Ngay cap giay to
    RECEIVER_ISSUED_PLACE VARCHAR2(200),                -- Noi cap giay to

    -- Metadata
    CREATED_BY          VARCHAR2(50)    NOT NULL,
    CREATED_DATE        TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,
    UPDATED_BY          VARCHAR2(50),
    UPDATED_DATE        TIMESTAMP,

    -- Constraints
    CONSTRAINT PK_LTT_RECEIVER PRIMARY KEY (ID),

    CONSTRAINT FK_LTT_RECEIVER_HEADER
        FOREIGN KEY (LTT_ID)
        REFERENCES LTT_HEADER (F_ID)
        ON DELETE CASCADE
);

COMMENT ON TABLE  LTT_RECEIVER             IS 'FT-001: Thong tin nguoi/ben nhan tien (Receiver info)';

COMMENT ON COLUMN LTT_RECEIVER.RECEIVER_NAME        IS 'Ten nguoi hoac don vi nhan tien';
COMMENT ON COLUMN LTT_RECEIVER.RECEIVER_ACCOUNT     IS 'So tai khoan nguoi nhan';
COMMENT ON COLUMN LTT_RECEIVER.RECEIVER_BANK_NAME   IS 'Ten Ngan hang nhan';
COMMENT ON COLUMN LTT_RECEIVER.RECEIVER_BANK_CODE   IS 'Ma Ngan hang / Kho Bac nhan';
COMMENT ON COLUMN LTT_RECEIVER.RECEIVER_IDENTIFY_ID IS 'So CMND/CCCD nguoi nhan';


-- ========================== LTT_ATTACHMENT ==================================
-- File dinh kem (Supporting documents)

CREATE TABLE LTT_ATTACHMENT (
    ID                 NUMBER(19)      NOT NULL,
    LTT_ID             VARCHAR2(50)    NOT NULL,

    FILE_NAME          VARCHAR2(255)   NOT NULL,       -- Ten file goc
    DOC_TYPE           VARCHAR2(30)    NOT NULL,       -- Loai tai lieu
    NOTE               VARCHAR2(500),                  -- Ghi chu
    FILE_BLOB          BLOB            NOT NULL,       -- Noi dung file
    FILE_SIZE          NUMBER(12)      NOT NULL,       -- Kich thuoc (bytes)
    FILE_HASH          VARCHAR2(64)    NOT NULL,       -- SHA-256 hash cua file

    UPLOADED_BY        VARCHAR2(50)    NOT NULL,
    UPLOADED_DATE      TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,

    ATTACH_STATUS      VARCHAR2(10)    DEFAULT 'ACTIVE' NOT NULL,

    -- Metadata
    CREATED_BY         VARCHAR2(50)    NOT NULL,
    CREATED_DATE       TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,
    UPDATED_BY         VARCHAR2(50),
    UPDATED_DATE       TIMESTAMP,

    -- Constraints
    CONSTRAINT PK_LTT_ATTACHMENT PRIMARY KEY (ID),

    CONSTRAINT FK_LTT_ATTACHMENT_HEADER
        FOREIGN KEY (LTT_ID)
        REFERENCES LTT_HEADER (F_ID)
        ON DELETE CASCADE,

    CONSTRAINT CK_LTT_ATTACH_STATUS CHECK (
        ATTACH_STATUS IN ('ACTIVE', 'DELETED')
    ),
    CONSTRAINT CK_LTT_ATTACH_SIZE CHECK (FILE_SIZE > 0)
);

COMMENT ON TABLE  LTT_ATTACHMENT           IS 'FT-001: File dinh kem cua Lenh Thanh Toan (Supporting documents)';

COMMENT ON COLUMN LTT_ATTACHMENT.FILE_NAME    IS 'Ten file goc (duoi upload)';
COMMENT ON COLUMN LTT_ATTACHMENT.DOC_TYPE     IS 'Loai tai lieu dinh kem';
COMMENT ON COLUMN LTT_ATTACHMENT.FILE_BLOB    IS 'Noi dung file (binary)';
COMMENT ON COLUMN LTT_ATTACHMENT.FILE_SIZE    IS 'Kich thuoc file (bytes)';
COMMENT ON COLUMN LTT_ATTACHMENT.FILE_HASH    IS 'SHA-256 hash cua file (chinh sua va toan ven)';
COMMENT ON COLUMN LTT_ATTACHMENT.ATTACH_STATUS IS 'Trang thai file: ACTIVE / DELETED';


-- ========================== LTT_AUDIT =======================================
-- Nhat ky kiem toan co co che Hash Chain
-- Moi dong ghi lai mot su kien thay doi trang thai hoac cap nhat du lieu.
-- Hash Chain: CURRENT_HASH = SHA256(PREV_HASH || PAYLOAD_HASH || ACTION_DATE)
-- Dam bao tinh nguyen ven va khong the sua xoa (tamper-evident).

CREATE TABLE LTT_AUDIT (
    ID                 NUMBER(19)      NOT NULL,
    LTT_ID             VARCHAR2(50),                   -- FK (nullable: co the ghi su kien khong lien quan LTT cu the)

    ACTION_DATE        TIMESTAMP       DEFAULT SYSTIMESTAMP NOT NULL,
    ACTOR              VARCHAR2(50)    NOT NULL,       -- Nguoi thuc hien
    ACTOR_ROLE         VARCHAR2(30)    NOT NULL,       -- Vai tro: MAKER / CHECKER / APPROVER / SYSTEM
    ACTION             VARCHAR2(50)    NOT NULL,       -- Ma su kien (VD: CREATE, SUBMIT, APPROVE, REJECT, DELETE)

    STATUS_FROM        VARCHAR2(30),                   -- Trang thai truoc
    STATUS_TO          VARCHAR2(30),                   -- Trang thai sau

    F_VER              NUMBER(10),                     -- Phien ban tai thoi diem action

    NOTE               VARCHAR2(1000),                 -- Ghi chu them

    -- Client context
    CLIENT_IP          VARCHAR2(45),                   -- Dia chi IP client (ho tro IPv6)
    HOST_NAME          VARCHAR2(100),                  -- Ten may truy cap
    CHANNEL            VARCHAR2(20),                   -- Kenh thuc hien

    -- Change diff (old/new values)
    DIFF               CLOB,                           -- JSON: {"field": {"old": ..., "new": ...}}

    -- Hash chain for tamper-evidence
    CURRENT_HASH       VARCHAR2(64)    NOT NULL,       -- SHA-256 hash cua dong hien tai
    PREV_HASH          VARCHAR2(64),                   -- SHA-256 hash cua dong truoc do
    PAYLOAD_HASH       VARCHAR2(64)    NOT NULL,       -- SHA-256 hash toan bo payload (tru CURRENT_HASH, PREV_HASH)

    -- Constraints
    CONSTRAINT PK_LTT_AUDIT PRIMARY KEY (ID),

    CONSTRAINT FK_LTT_AUDIT_HEADER
        FOREIGN KEY (LTT_ID)
        REFERENCES LTT_HEADER (F_ID)
        ON DELETE SET NULL,

    CONSTRAINT CK_LTT_AUDIT_ROLE CHECK (
        ACTOR_ROLE IN ('MAKER', 'CHECKER', 'APPROVER', 'SYSTEM')
    )
);

COMMENT ON TABLE  LTT_AUDIT               IS 'FT-001: Nhat ky kiem toan Lenh Thanh Toan (Audit trail + Hash Chain)';

COMMENT ON COLUMN LTT_AUDIT.LTT_ID        IS 'FK -> LTT_HEADER.F_ID (nullable cho su kien khong lien quan LTT cu the)';
COMMENT ON COLUMN LTT_AUDIT.ACTOR         IS 'Nguoi thuc hien hanh dong';
COMMENT ON COLUMN LTT_AUDIT.ACTOR_ROLE    IS 'Vai tro: MAKER / CHECKER / APPROVER / SYSTEM';
COMMENT ON COLUMN LTT_AUDIT.ACTION        IS 'Ma su kien (CREATE, SUBMIT, CHECK, APPROVE, REJECT, RETURN, DELETE, POST, TRANSFER)';
COMMENT ON COLUMN LTT_AUDIT.STATUS_FROM   IS 'Trang thai truoc chuyen doi';
COMMENT ON COLUMN LTT_AUDIT.STATUS_TO     IS 'Trang thai sau chuyen doi';
COMMENT ON COLUMN LTT_AUDIT.F_VER         IS 'Phien ban ban ghi tai thoi diem hanh dong';
COMMENT ON COLUMN LTT_AUDIT.DIFF          IS 'JSON diff: {field: {old: value, new: value}}';
COMMENT ON COLUMN LTT_AUDIT.CURRENT_HASH  IS 'SHA-256 hash cua dong hien tai (tamper-evident)';
COMMENT ON COLUMN LTT_AUDIT.PREV_HASH     IS 'SHA-256 hash cua dong kiem toan truoc do (hash chain link)';
COMMENT ON COLUMN LTT_AUDIT.PAYLOAD_HASH  IS 'SHA-256 hash toan bo payload (tru cac cot hash)';


-- =============================================================================
-- ========================== INDEXES ==========================================
-- =============================================================================

-- LTT_HEADER indexes
CREATE UNIQUE INDEX IDX_LTT_HDR_REF_NO         ON LTT_HEADER (REF_NO);
CREATE        INDEX IDX_LTT_HDR_STATUS         ON LTT_HEADER (F_STATUS);
CREATE        INDEX IDX_LTT_HDR_CREATED_DATE   ON LTT_HEADER (CREATED_DATE);
CREATE        INDEX IDX_LTT_HDR_SENDER_CODE    ON LTT_HEADER (SENDER_CODE);
CREATE        INDEX IDX_LTT_HDR_RECEIVER_CODE  ON LTT_HEADER (RECEIVER_CODE);
CREATE        INDEX IDX_LTT_HDR_PAYMENT_DATE   ON LTT_HEADER (PAYMENT_DATE);
CREATE UNIQUE INDEX IDX_LTT_HDR_IDEMPOTENCY    ON LTT_HEADER (IDEMPOTENCY_KEY);

-- Composite index: filter by status + date range (most common query pattern)
CREATE        INDEX IDX_LTT_HDR_STATUS_DATE    ON LTT_HEADER (F_STATUS, CREATED_DATE);

-- Composite index: sender/receiver lookups with payment date
CREATE        INDEX IDX_LTT_HDR_SENDER_DATE    ON LTT_HEADER (SENDER_CODE, PAYMENT_DATE);
CREATE        INDEX IDX_LTT_HDR_RECEIVER_DATE  ON LTT_HEADER (RECEIVER_CODE, PAYMENT_DATE);

-- LTT_DETAIL indexes
CREATE        INDEX IDX_LTT_DTL_LTT_ID         ON LTT_DETAIL (LTT_ID);

-- LTT_SENDER indexes
CREATE        INDEX IDX_LTT_SND_LTT_ID         ON LTT_SENDER (LTT_ID);

-- LTT_RECEIVER indexes
CREATE        INDEX IDX_LTT_RCV_LTT_ID         ON LTT_RECEIVER (LTT_ID);

-- LTT_ATTACHMENT indexes
CREATE        INDEX IDX_LTT_ATT_LTT_ID         ON LTT_ATTACHMENT (LTT_ID);
CREATE        INDEX IDX_LTT_ATT_HASH           ON LTT_ATTACHMENT (FILE_HASH);

-- LTT_AUDIT indexes
CREATE        INDEX IDX_LTT_AUD_LTT_ID         ON LTT_AUDIT (LTT_ID);
CREATE        INDEX IDX_LTT_AUD_ACTION_DATE    ON LTT_AUDIT (ACTION_DATE);
CREATE        INDEX IDX_LTT_AUD_ACTOR          ON LTT_AUDIT (ACTOR);
CREATE        INDEX IDX_LTT_AUD_CURRENT_HASH   ON LTT_AUDIT (CURRENT_HASH);


-- =============================================================================
-- ========================== TRIGGERS (Auto-increment PKs) ====================
-- =============================================================================

-- LTT_DETAIL: auto-populate ID from sequence
CREATE OR REPLACE TRIGGER TRG_LTT_DETAIL_ID
BEFORE INSERT ON LTT_DETAIL
FOR EACH ROW
BEGIN
    IF :NEW.ID IS NULL THEN
        :NEW.ID := SEQ_LTT_DETAIL_ID.NEXTVAL;
    END IF;
END;
/

-- LTT_SENDER: auto-populate ID from sequence
CREATE OR REPLACE TRIGGER TRG_LTT_SENDER_ID
BEFORE INSERT ON LTT_SENDER
FOR EACH ROW
BEGIN
    IF :NEW.ID IS NULL THEN
        :NEW.ID := SEQ_LTT_SENDER_ID.NEXTVAL;
    END IF;
END;
/

-- LTT_RECEIVER: auto-populate ID from sequence
CREATE OR REPLACE TRIGGER TRG_LTT_RECEIVER_ID
BEFORE INSERT ON LTT_RECEIVER
FOR EACH ROW
BEGIN
    IF :NEW.ID IS NULL THEN
        :NEW.ID := SEQ_LTT_RECEIVER_ID.NEXTVAL;
    END IF;
END;
/

-- LTT_ATTACHMENT: auto-populate ID from sequence
CREATE OR REPLACE TRIGGER TRG_LTT_ATTACHMENT_ID
BEFORE INSERT ON LTT_ATTACHMENT
FOR EACH ROW
BEGIN
    IF :NEW.ID IS NULL THEN
        :NEW.ID := SEQ_LTT_ATTACHMENT_ID.NEXTVAL;
    END IF;
END;
/

-- LTT_AUDIT: auto-populate ID from sequence
CREATE OR REPLACE TRIGGER TRG_LTT_AUDIT_ID
BEFORE INSERT ON LTT_AUDIT
FOR EACH ROW
BEGIN
    IF :NEW.ID IS NULL THEN
        :NEW.ID := SEQ_LTT_AUDIT_ID.NEXTVAL;
    END IF;
END;
/


-- =============================================================================
-- ========================== GRANTS (example, adjust per environment) ========
-- =============================================================================
-- GRANT SELECT, INSERT, UPDATE ON LTT_HEADER   TO LTT_APP_ROLE;
-- GRANT SELECT, INSERT          ON LTT_AUDIT   TO LTT_APP_ROLE;
-- GRANT SELECT                  ON LTT_HEADER  TO LTT_READ_ROLE;
-- =============================================================================
