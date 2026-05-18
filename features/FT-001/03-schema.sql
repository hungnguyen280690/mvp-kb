-- ============================================================================
-- FT-001: Schema DDL for MVP Kho Bac - Lenh Thanh Toan (Payment Order)
-- DBMS : Oracle 19c
-- Agent: SA
-- Date : 2026-05-18
-- Ref  : CRUD_spec_field.md, CRUD_spec_function.md (State Machine SS11),
--        ROLE_spec_field.md, REPORT_spec_field.md, ARCHITECTURE.md
-- Rules: Optimistic locking, Soft delete, Audit Hash Chain, SoD
-- ============================================================================

-- ============================================================================
-- 1. PAYMENT_ORDER — Transaction header (LTT / Lenh Thanh Toan)
-- ============================================================================
CREATE TABLE payment_order (
    -- Primary key
    id                  NUMBER(20) GENERATED ALWAYS AS IDENTITY START WITH 1 INCREMENT BY 1,
    uuid                VARCHAR2(36)  NOT NULL,

    -- Business identifiers
    ref_no              VARCHAR2(50)  NOT NULL,          -- So YCTT / So but toan
    org_num             VARCHAR2(50),                     -- So chung tu goc (TTSP only)

    -- Channel & type
    channel             VARCHAR2(30)  NOT NULL,           -- 'LIEN_NGAN_HANG' | 'THANH_TOAN_SONG_PHUONG'
    transaction_type    VARCHAR2(50)  NOT NULL,           -- Loai lenh (dropdown value)
    lnh_transaction_type VARCHAR2(50),                    -- Loai GD LNH: HIGH_CREDIT / HIGH_DEBIT / LOW_CREDIT / LOW_DEBIT

    -- Parties
    sender              VARCHAR2(20)  NOT NULL,           -- NH/KB chuyen (ma)
    receiver            VARCHAR2(20)  NOT NULL,           -- NH/KB nhan (ma)

    -- Amounts
    amount              NUMBER(22,2)  NOT NULL,           -- So tien chuyen
    currency_code       VARCHAR2(3)   DEFAULT 'VND' NOT NULL,
    exchange_rate       NUMBER(18,6),                     -- Ty gia (foreign currency)
    fn_code1            VARCHAR2(3),                      -- Ma ngoai te trich no
    fn_code2            VARCHAR2(3),                      -- Ma ngoai te TT
    fn_amount           NUMBER(22,2),                     -- So tien ngoai te TT
    exp_type            VARCHAR2(30),                      -- Loai phi

    -- Dates
    payment_date        DATE          NOT NULL,           -- Ngay thanh toan
    transaction_date    DATE,                             -- Ngay chung tu (TTSP)
    accounting_date     DATE,                             -- Ngay hach toan (posted)

    -- Description
    description         VARCHAR2(500) NOT NULL,           -- Noi dung thanh toan

    -- Sender info (Tab 1.3)
    sender_name         VARCHAR2(200),
    sender_address      VARCHAR2(300),
    sender_gl_segment2  VARCHAR2(4),                      -- TK tu nhien
    sender_num          VARCHAR2(50),                     -- Ma KH
    sender_bank_code    VARCHAR2(20),
    sender_identify_id  VARCHAR2(50),
    sender_issued_date  DATE,
    sender_issued_place VARCHAR2(200),
    tpcp_code           VARCHAR2(30),                     -- Ma TPCP (trai phieu)

    -- Receiver info (Tab 1.4)
    receiver_name       VARCHAR2(200),
    receiver_address    VARCHAR2(300),
    receiver_gl_segment2 VARCHAR2(4),
    receiver_bank_name  VARCHAR2(200),
    receiver_bank_code  VARCHAR2(50),                     -- Ten tai khoan
    receiver_identify_id VARCHAR2(50),
    receiver_issued_date DATE,
    receiver_issued_place VARCHAR2(200),

    -- State machine (ref: CRUD_spec_function.md SS11)
    status              VARCHAR2(30)  DEFAULT 'DRAFT' NOT NULL,
    -- Allowed values: DRAFT, READY_FOR_APPROVAL, PENDING_APPROVER,
    --   APPROVED, TRANSFERRED_TO_GL, POSTED, RETURNED_TO_MAKER,
    --   REJECTED, DELETED

    -- Optimistic locking
    version             NUMBER(10)    DEFAULT 1 NOT NULL,

    -- Audit fields
    created_by          VARCHAR2(40)  NOT NULL,
    created_date        TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    last_updated_by     VARCHAR2(40),
    last_updated_date   TIMESTAMP,
    checked_by          VARCHAR2(40),
    checked_date        TIMESTAMP,
    approved_by         VARCHAR2(40),
    approved_date       TIMESTAMP,
    deleted_by          VARCHAR2(40),
    deleted_date        TIMESTAMP,
    delete_reason       VARCHAR2(500),

    -- Soft delete
    is_deleted          NUMBER(1)     DEFAULT 0 NOT NULL, -- 0=active, 1=soft-deleted

    -- Idempotency
    idempotency_key     VARCHAR2(64),                     -- X-Request-ID

    CONSTRAINT pk_payment_order PRIMARY KEY (id),
    CONSTRAINT uk_payment_order_uuid UNIQUE (uuid),
    CONSTRAINT uk_payment_order_ref   UNIQUE (ref_no),
    CONSTRAINT chk_payment_order_status CHECK (
        status IN ('DRAFT','READY_FOR_APPROVAL','PENDING_APPROVER',
                   'APPROVED','TRANSFERRED_TO_GL','POSTED',
                   'RETURNED_TO_MAKER','REJECTED','DELETED')
    ),
    CONSTRAINT chk_payment_order_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_order_version CHECK (version >= 1),
    CONSTRAINT chk_payment_order_sdel CHECK (is_deleted IN (0, 1))
);

-- Indexes
CREATE INDEX idx_payment_order_status     ON payment_order (status);
CREATE INDEX idx_payment_order_created    ON payment_order (created_date);
CREATE INDEX idx_payment_order_sender     ON payment_order (sender);
CREATE INDEX idx_payment_order_receiver   ON payment_order (receiver);
CREATE INDEX idx_payment_order_channel    ON payment_order (channel, transaction_type);
CREATE INDEX idx_payment_order_payment_dt ON payment_order (payment_date);
CREATE INDEX idx_payment_order_created_by ON payment_order (created_by);
CREATE INDEX idx_payment_order_idempotency ON payment_order (idempotency_key);

-- Comments for documentation
COMMENT ON TABLE payment_order IS 'LTT - Lenh thanh toan (Payment Order header)';
COMMENT ON COLUMN payment_order.status IS 'State machine: DRAFT -> READY_FOR_APPROVAL -> PENDING_APPROVER -> APPROVED -> TRANSFERRED_TO_GL -> POSTED';
COMMENT ON COLUMN payment_order.version IS 'Optimistic locking version (F-VER)';
COMMENT ON COLUMN payment_order.is_deleted IS 'Soft delete flag: 0=active, 1=deleted';


-- ============================================================================
-- 2. PAYMENT_ORDER_DETAIL — Transaction detail lines (khoan muc / COA)
-- ============================================================================
CREATE TABLE payment_order_detail (
    id                  NUMBER(20) GENERATED ALWAYS AS IDENTITY START WITH 1 INCREMENT BY 1,
    payment_order_id    NUMBER(20)    NOT NULL,           -- FK to payment_order.id
    line_no             NUMBER(5)     NOT NULL,           -- STT dong

    -- GL Segments (COA) - ref: CRUD_spec_field.md SS1.2
    gl_segment1         VARCHAR2(2)   DEFAULT '01',      -- Ma quy
    gl_segment2         VARCHAR2(4)   NOT NULL,           -- TK tu nhien
    gl_segment3         VARCHAR2(7)   NOT NULL,           -- DVQHNS
    gl_segment4         VARCHAR2(10),                     -- Cap NS
    gl_segment5         VARCHAR2(3)   DEFAULT '000',      -- Chuong
    gl_segment6         VARCHAR2(3)   DEFAULT '000',      -- Nganh KT
    gl_segment7         VARCHAR2(4)   DEFAULT '0000',     -- NDKT
    gl_segment8         VARCHAR2(5)   DEFAULT '00000',    -- Dia ban
    gl_segment9         VARCHAR2(5)   DEFAULT '00000',    -- CTMT
    gl_segment10        VARCHAR2(2)   DEFAULT '00',       -- Ma nguyen kinh phi
    gl_segment11        VARCHAR2(4)   DEFAULT '0000',     -- Kho bac
    gl_segment12        VARCHAR2(3)   DEFAULT '00',       -- Du phong

    line_description    VARCHAR2(500) NOT NULL,           -- Dien giai
    line_amount         NUMBER(22,2)  NOT NULL,           -- So tien dong

    -- Audit
    created_by          VARCHAR2(40)  NOT NULL,
    created_date        TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    last_updated_by     VARCHAR2(40),
    last_updated_date   TIMESTAMP,

    -- Soft delete
    is_deleted          NUMBER(1)     DEFAULT 0 NOT NULL,

    CONSTRAINT pk_payment_order_detail PRIMARY KEY (id),
    CONSTRAINT fk_pod_payment_order FOREIGN KEY (payment_order_id)
        REFERENCES payment_order (id) ON DELETE CASCADE,
    CONSTRAINT chk_pod_line_amount CHECK (line_amount > 0),
    CONSTRAINT chk_pod_sdel CHECK (is_deleted IN (0, 1))
);

-- Indexes
CREATE INDEX idx_pod_payment_order ON payment_order_detail (payment_order_id);
CREATE INDEX idx_pod_dvqhns        ON payment_order_detail (gl_segment3);

COMMENT ON TABLE payment_order_detail IS 'LTT chi tiet - dong khoan muc COA (Payment Order detail lines)';
COMMENT ON COLUMN payment_order_detail.line_amount IS 'Tong LINE_AMOUNT phai bang AMOUNT cua payment_order cha (BIZ-004)';


-- ============================================================================
-- 3. APPROVAL_LOG — Approval history (Checker + Approver actions)
-- ============================================================================
CREATE TABLE approval_log (
    id                  NUMBER(20) GENERATED ALWAYS AS IDENTITY START WITH 1 INCREMENT BY 1,
    payment_order_id    NUMBER(20)    NOT NULL,
    version             NUMBER(10)    NOT NULL,           -- F-VER tai thoi diem phe duyet

    -- Actor
    actor               VARCHAR2(40)  NOT NULL,           -- Username
    actor_role          VARCHAR2(30)  NOT NULL,           -- MAKER / CHECKER / APPROVER / SYSTEM
    actor_display_name  VARCHAR2(100),                    -- Ho ten

    -- Action
    action              VARCHAR2(50)  NOT NULL,
    -- Values: APPROVE.CHECKER, APPROVE.APPROVER, APPROVE.RETURN, APPROVE.REJECT,
    --         NEW.SUBMIT, DELETE.CONFIRM, SYSTEM.POST, SYSTEM.TRANSFER_GL

    -- State transition
    status_from         VARCHAR2(30),                     -- Trang thai truoc
    status_to           VARCHAR2(30),                     -- Trang thai sau

    -- Notes
    note                VARCHAR2(500),                    -- Ly do tu choi/tra lai/xoa

    -- Security
    auth_method         VARCHAR2(20),                     -- OTP | DIGITAL_SIGN
    otp_code            VARCHAR2(6),
    cert_serial         VARCHAR2(100),

    -- Environment
    client_ip           VARCHAR2(45),                     -- IPv4/IPv6
    host_name           VARCHAR2(100),
    channel             VARCHAR2(20)  DEFAULT 'WEB',      -- WEB / API / MOBILE
    action_date         TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,

    -- Checklist confirmation
    checklist_json      CLOB,                             -- JSON array of checklist items

    CONSTRAINT pk_approval_log PRIMARY KEY (id),
    CONSTRAINT fk_alog_payment_order FOREIGN KEY (payment_order_id)
        REFERENCES payment_order (id)
);

CREATE INDEX idx_alog_payment_order ON approval_log (payment_order_id);
CREATE INDEX idx_alog_action_date   ON approval_log (action_date);
CREATE INDEX idx_alog_actor         ON approval_log (actor);

COMMENT ON TABLE approval_log IS 'Lich su phe duyet / kiem soat (Approval history log)';
COMMENT ON COLUMN approval_log.actor_role IS 'MAKER | CHECKER | APPROVER | SYSTEM';
COMMENT ON COLUMN approval_log.action IS 'Event ID tham chieu CRUD_spec_function.md SS10';


-- ============================================================================
-- 4. AUDIT_LOG — Hash chain audit trail
-- ============================================================================
CREATE TABLE audit_log (
    id                  NUMBER(20) GENERATED ALWAYS AS IDENTITY START WITH 1 INCREMENT BY 1,
    table_name          VARCHAR2(60)  NOT NULL,           -- e.g. 'PAYMENT_ORDER'
    record_id           NUMBER(20)    NOT NULL,           -- PK cua ban ghi bi thay doi
    record_uuid         VARCHAR2(36),                     -- UUID neu co

    -- Actor context
    actor               VARCHAR2(40)  NOT NULL,
    actor_role          VARCHAR2(30),
    action              VARCHAR2(50)  NOT NULL,           -- INSERT / UPDATE / DELETE / STATUS_CHANGE
    action_date         TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,

    -- Environment
    client_ip           VARCHAR2(45),
    host_name           VARCHAR2(100),
    channel             VARCHAR2(20)  DEFAULT 'WEB',

    -- Diff
    diff_json           CLOB,                             -- JSON: [{field, oldValue, newValue}]
    note                VARCHAR2(500),

    -- Hash chain: prevHash + payload + timestamp -> SHA-256
    prev_hash           VARCHAR2(64)  NOT NULL,           -- Hash cua ban ghi audit truoc do
    current_hash        VARCHAR2(64)  NOT NULL,           -- SHA-256(prev_hash || table_name || record_id || action || actor || action_date || diff_json)

    CONSTRAINT pk_audit_log PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX idx_audit_log_record    ON audit_log (table_name, record_id);
CREATE INDEX idx_audit_log_record_uuid ON audit_log (record_uuid);
CREATE INDEX idx_audit_log_action_dt ON audit_log (action_date);
CREATE INDEX idx_audit_log_actor     ON audit_log (actor);
CREATE INDEX idx_audit_log_hash      ON audit_log (current_hash);

COMMENT ON TABLE audit_log IS 'Audit trail voi Hash Chain - chong chinh sua du lieu trai phep';
COMMENT ON COLUMN audit_log.current_hash IS 'SHA-256(prev_hash || table_name || record_id || action || actor || action_date || diff_json)';
COMMENT ON COLUMN audit_log.prev_hash IS 'Hash cua ban ghi audit ngay truoc do trong chain';


-- ============================================================================
-- 5. ROLE — Role definitions
-- ============================================================================
CREATE TABLE role (
    id                  NUMBER(20) GENERATED ALWAYS AS IDENTITY START WITH 1 INCREMENT BY 1,
    role_code           NUMBER(10)    NOT NULL,           -- Ma quyen (unique, immutable)
    role_name           VARCHAR2(40)  NOT NULL,
    role_group_name     VARCHAR2(40),

    -- State machine (same pattern as payment_order)
    status              VARCHAR2(30)  DEFAULT 'DRAFT' NOT NULL,
    -- Values: DRAFT, READY_FOR_APPROVAL, PENDING_APPROVER, RETURNED_TO_MAKER,
    --   REJECTED, ACTIVE, INACTIVE, DELETED

    -- Optimistic locking
    version             NUMBER(10)    DEFAULT 1 NOT NULL,

    -- Audit
    created_by          VARCHAR2(40)  NOT NULL,
    created_date        TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    last_updated_by     VARCHAR2(40),
    last_updated_date   TIMESTAMP,
    deleted_by          VARCHAR2(40),
    deleted_date        TIMESTAMP,
    delete_reason       VARCHAR2(500),

    is_deleted          NUMBER(1)     DEFAULT 0 NOT NULL,

    CONSTRAINT pk_role PRIMARY KEY (id),
    CONSTRAINT uk_role_code UNIQUE (role_code),
    CONSTRAINT chk_role_status CHECK (
        status IN ('DRAFT','READY_FOR_APPROVAL','PENDING_APPROVER',
                   'RETURNED_TO_MAKER','REJECTED','ACTIVE','INACTIVE','DELETED')
    ),
    CONSTRAINT chk_role_version CHECK (version >= 1),
    CONSTRAINT chk_role_sdel CHECK (is_deleted IN (0, 1))
);

CREATE INDEX idx_role_status ON role (status);
CREATE INDEX idx_role_group  ON role (role_group_name);

COMMENT ON TABLE role IS 'Dinh nghia vai tro / quyen he thong';


-- ============================================================================
-- 6. ROLE_FUNCTION — Function permissions per role (detail grid)
-- ============================================================================
CREATE TABLE role_function (
    id                  NUMBER(20) GENERATED ALWAYS AS IDENTITY START WITH 1 INCREMENT BY 1,
    role_id             NUMBER(20)    NOT NULL,
    seq                 NUMBER(5)     NOT NULL,           -- STT

    -- Function reference
    function_code       NUMBER(10)    NOT NULL,           -- Ma chuc nang
    function_name       VARCHAR2(40),                     -- Auto-fill tu danh muc

    -- Permissions
    read_perm           NUMBER(1)     DEFAULT 0 NOT NULL, -- 0=deny, 1=allow
    write_perm          NUMBER(1)     DEFAULT 0 NOT NULL, -- 0=deny, 1=allow

    -- Effective dates
    effective_date_from DATE,
    effective_date_to   DATE,

    -- Audit
    created_by          VARCHAR2(40)  NOT NULL,
    created_date        TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    last_updated_by     VARCHAR2(40),
    last_updated_date   TIMESTAMP,

    is_deleted          NUMBER(1)     DEFAULT 0 NOT NULL,

    CONSTRAINT pk_role_function PRIMARY KEY (id),
    CONSTRAINT fk_rf_role FOREIGN KEY (role_id) REFERENCES role (id) ON DELETE CASCADE,
    CONSTRAINT uk_rf_role_func UNIQUE (role_id, function_code),
    CONSTRAINT chk_rf_rw CHECK (read_perm IN (0,1) AND write_perm IN (0,1)),
    CONSTRAINT chk_rf_at_least_one CHECK (read_perm = 1 OR write_perm = 1),
    CONSTRAINT chk_rf_dates CHECK (effective_date_to IS NULL OR effective_date_to >= effective_date_from),
    CONSTRAINT chk_rf_sdel CHECK (is_deleted IN (0, 1))
);

CREATE INDEX idx_rf_role ON role_function (role_id);

COMMENT ON TABLE role_function IS 'Gan chuc nang (Function) cho Role voi quyen Read/Write va thoi han hieu luc';


-- ============================================================================
-- 7. USER_ROLE — User-to-role assignment
-- ============================================================================
CREATE TABLE user_role (
    id                  NUMBER(20) GENERATED ALWAYS AS IDENTITY START WITH 1 INCREMENT BY 1,
    user_name           VARCHAR2(40)  NOT NULL,           -- Username (FK he thong user)
    role_id             NUMBER(20)    NOT NULL,           -- FK to role.id

    -- Effective dates
    effective_date_from DATE,
    effective_date_to   DATE,

    -- Audit
    assigned_by         VARCHAR2(40)  NOT NULL,
    assigned_date       TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,

    is_deleted          NUMBER(1)     DEFAULT 0 NOT NULL,

    CONSTRAINT pk_user_role PRIMARY KEY (id),
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES role (id),
    CONSTRAINT uk_ur_user_role UNIQUE (user_name, role_id),
    CONSTRAINT chk_ur_dates CHECK (effective_date_to IS NULL OR effective_date_to >= effective_date_from),
    CONSTRAINT chk_ur_sdel CHECK (is_deleted IN (0, 1))
);

CREATE INDEX idx_ur_user ON user_role (user_name);
CREATE INDEX idx_ur_role ON user_role (role_id);

COMMENT ON TABLE user_role IS 'Gan User vao Role (phieu gan quyen)';


-- ============================================================================
-- 8. ATTACHMENT — File attachments for payment orders
-- ============================================================================
CREATE TABLE attachment (
    id                  NUMBER(20) GENERATED ALWAYS AS IDENTITY START WITH 1 INCREMENT BY 1,
    payment_order_id    NUMBER(20)    NOT NULL,

    -- File info
    file_name           VARCHAR2(255) NOT NULL,
    doc_type            VARCHAR2(30),                     -- CHUNG_TU / HOP_DONG / HOA_DON / BANG_KE / VAN_BAN_KHAC
    note                VARCHAR2(250),
    file_blob           BLOB,
    file_size           NUMBER(12),                        -- Bytes
    file_hash           VARCHAR2(64),                     -- SHA-256

    -- Status
    attach_status       VARCHAR2(20)  DEFAULT 'ACTIVE' NOT NULL, -- ACTIVE / DELETED

    -- Audit
    uploaded_by         VARCHAR2(40)  NOT NULL,
    uploaded_date       TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    deleted_by          VARCHAR2(40),
    deleted_date        TIMESTAMP,

    CONSTRAINT pk_attachment PRIMARY KEY (id),
    CONSTRAINT fk_att_payment_order FOREIGN KEY (payment_order_id)
        REFERENCES payment_order (id) ON DELETE CASCADE,
    CONSTRAINT chk_att_status CHECK (attach_status IN ('ACTIVE', 'DELETED'))
);

CREATE INDEX idx_att_payment_order ON attachment (payment_order_id);

COMMENT ON TABLE attachment IS 'Tai lieu dinh kem (File attachment) cho Lenh thanh toan';
COMMENT ON COLUMN attachment.file_hash IS 'SHA-256 hash cua file - dung de kiem tra toan ven va chong trung';


-- ============================================================================
-- 9. SEED: Master data for function catalog (minimal set for MVP)
-- ============================================================================
CREATE TABLE sys_function (
    id                  NUMBER(20) GENERATED ALWAYS AS IDENTITY START WITH 1 INCREMENT BY 1,
    function_code       NUMBER(10)    NOT NULL,
    function_name       VARCHAR2(40)  NOT NULL,
    module_code         VARCHAR2(10)  DEFAULT 'TT',      -- TT / KS / KB / BC
    function_description VARCHAR2(500),
    active_status       VARCHAR2(10)  DEFAULT 'ACTIVE' NOT NULL,

    CONSTRAINT pk_sys_function PRIMARY KEY (id),
    CONSTRAINT uk_sys_func_code UNIQUE (function_code),
    CONSTRAINT chk_sys_func_status CHECK (active_status IN ('ACTIVE', 'INACTIVE'))
);


-- ============================================================================
-- 10. SEQUENCE for manual PK if needed (identity columns preferred)
-- ============================================================================
-- Oracle 19c uses GENERATED ALWAYS AS IDENTITY on columns above.
-- This sequence is reserved for batch imports or migration scripts.
CREATE SEQUENCE seq_payment_order     START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_approval_log      START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_audit_log         START WITH 1 INCREMENT BY 1 NOCACHE;


-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
