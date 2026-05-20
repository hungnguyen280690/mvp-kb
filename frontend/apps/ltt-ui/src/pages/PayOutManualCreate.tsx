import { useState, useCallback } from "react";
import { useAppNavigate } from "../hooks/useAppNavigate";
import type {
  CreateOrderRequest,
  PayOrderLineRequest,
} from "../types/pay-out-manual";
import { useCreateOrder } from "../hooks/usePayOutManual";
import { OrderFormTabs } from "../components/OrderForm/OrderFormTabs";
import { ErrorBoundary } from "../components/ErrorBoundary";

// ---------------------------------------------------------------------------
// Initial empty form data
// ---------------------------------------------------------------------------

function initialFormData(): Partial<CreateOrderRequest> {
  return {
    CHANNEL: "" as CreateOrderRequest["CHANNEL"],
    ORDER_TYPE: "",
    SENDER: "",
    RECEIVER: "",
    PAYMENT_DATE: "",
    AMOUNT: 0,
    CURRENCY_CODE: "VND",
    EXCHANGE_RATE: undefined,
    ORIGIN_NUM: "",
    TRANSACTION_DATE: "",
    EXP_TYPE: undefined,
    DESCRIPTION: "",
    LINES: [],
    SENDER_NAME: "",
    SENDER_ADDRESS: "",
    SENDER_GL_SEGMENT2: "",
    SENDER_NUM: "",
    SENDER_BANK_CODE: "",
    SENDER_IDENTIFY_ID: "",
    SENDER_ISSUED_DATE: "",
    SENDER_ISSUED_PLACE: "",
    TPCP_CODE: "",
    RECEIVER_NAME: "",
    RECEIVER_ADDRESS: "",
    RECEIVER_GL_SEGMENT2: "",
    RECEIVER_BANK_CODE: "",
    RECEIVER_ACCOUNT_NAME: "",
    RECEIVER_IDENTIFY_ID: "",
    RECEIVER_ISSUED_DATE: "",
    RECEIVER_ISSUED_PLACE: "",
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const FIELD_MAX_LENGTHS: Record<string, number> = {
  ORDER_TYPE: 30,
  SENDER: 20,
  RECEIVER: 20,
  CURRENCY_CODE: 3,
  ORIGIN_NUM: 50,
  DESCRIPTION: 500,
  SENDER_NAME: 200,
  SENDER_ADDRESS: 500,
  SENDER_GL_SEGMENT2: 4,
  SENDER_NUM: 20,
  SENDER_BANK_CODE: 20,
  SENDER_IDENTIFY_ID: 50,
  SENDER_ISSUED_PLACE: 200,
  TPCP_CODE: 20,
  RECEIVER_NAME: 200,
  RECEIVER_ADDRESS: 500,
  RECEIVER_GL_SEGMENT2: 20,
  RECEIVER_BANK_CODE: 20,
  RECEIVER_ACCOUNT_NAME: 200,
  RECEIVER_IDENTIFY_ID: 50,
  RECEIVER_ISSUED_PLACE: 200,
  FN_CODE1: 3,
  FN_CODE2: 3,
};

function validate(data: Partial<CreateOrderRequest>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.CHANNEL) errors.CHANNEL = "Kenh la bat buoc";
  if (data.CHANNEL === "LNH" && !data.LNH_TRANSACTION_TYPE)
    errors.LNH_TRANSACTION_TYPE =
      "Loai giao dich LNH la bat buoc khi chon kenh LNH";
  if (!data.SENDER) errors.SENDER = "Nguoi chung triet la bat buoc";
  else if (data.SENDER.length > 20) errors.SENDER = "Toi da 20 ky tu";
  if (!data.RECEIVER) errors.RECEIVER = "Nguoi huong la bat buoc";
  else if (data.RECEIVER.length > 20) errors.RECEIVER = "Toi da 20 ky tu";
  if (!data.PAYMENT_DATE) errors.PAYMENT_DATE = "Ngay thanh toan la bat buoc";
  if (!data.AMOUNT || data.AMOUNT <= 0) errors.AMOUNT = "So tien phai luon > 0";
  if (!data.DESCRIPTION) errors.DESCRIPTION = "Mo ta la bat buoc";
  else if (data.DESCRIPTION.length > 500)
    errors.DESCRIPTION = "Toi da 500 ky tu";
  if (!data.SENDER_NAME)
    errors.SENDER_NAME = "Ten nguoi chung triet la bat buoc";
  else if (data.SENDER_NAME.length > 200)
    errors.SENDER_NAME = "Toi da 200 ky tu";
  if (!data.SENDER_ADDRESS)
    errors.SENDER_ADDRESS = "Dia chi nguoi chung triet la bat buoc";
  else if (data.SENDER_ADDRESS.length > 500)
    errors.SENDER_ADDRESS = "Toi da 500 ky tu";
  if (!data.SENDER_GL_SEGMENT2)
    errors.SENDER_GL_SEGMENT2 = "GL Segment 2 la bat buoc";
  else if (data.SENDER_GL_SEGMENT2.length > 4)
    errors.SENDER_GL_SEGMENT2 = "Toi da 4 ky tu";
  if (!data.SENDER_BANK_CODE)
    errors.SENDER_BANK_CODE = "Ma ngan hang la bat buoc";
  else if (data.SENDER_BANK_CODE.length > 20)
    errors.SENDER_BANK_CODE = "Toi da 20 ky tu";
  if (!data.RECEIVER_NAME) errors.RECEIVER_NAME = "Ten nguoi huong la bat buoc";
  else if (data.RECEIVER_NAME.length > 200)
    errors.RECEIVER_NAME = "Toi da 200 ky tu";
  if (!data.RECEIVER_GL_SEGMENT2)
    errors.RECEIVER_GL_SEGMENT2 = "GL Segment 2 la bat buoc";
  else if (data.RECEIVER_GL_SEGMENT2.length > 20)
    errors.RECEIVER_GL_SEGMENT2 = "Toi da 20 ky tu";
  if (!data.RECEIVER_BANK_CODE)
    errors.RECEIVER_BANK_CODE = "Ma ngan hang la bat buoc";
  else if (data.RECEIVER_BANK_CODE.length > 20)
    errors.RECEIVER_BANK_CODE = "Toi da 20 ky tu";
  if (!data.RECEIVER_ACCOUNT_NAME)
    errors.RECEIVER_ACCOUNT_NAME = "Ten tai khoan la bat buoc";
  else if (data.RECEIVER_ACCOUNT_NAME.length > 200)
    errors.RECEIVER_ACCOUNT_NAME = "Toi da 200 ky tu";
  if (!data.LINES || data.LINES.length === 0)
    errors.LINES = "Can it nhat 1 dong COA";
  else {
    const lineTotal = data.LINES.reduce((s, l) => s + (l.LINE_AMOUNT || 0), 0);
    if (Math.abs((data.AMOUNT || 0) - lineTotal) > 0.01)
      errors.AMOUNT = `So tien (${data.AMOUNT}) phai bang tong dong COA (${lineTotal})`;
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Inner component
// ---------------------------------------------------------------------------

function PayOutManualCreateInner() {
  const nav = useAppNavigate();
  const createHook = useCreateOrder();

  const [formData, setFormData] =
    useState<Partial<CreateOrderRequest>>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof CreateOrderRequest, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    },
    [],
  );

  const handleLinesChange = useCallback((lines: PayOrderLineRequest[]) => {
    setFormData((prev) => ({ ...prev, LINES: lines }));
  }, []);

  const buildPayload = useCallback(
    (_isDraft: boolean): CreateOrderRequest => {
      return {
        CHANNEL: formData.CHANNEL as CreateOrderRequest["CHANNEL"],
        ORDER_TYPE: formData.ORDER_TYPE || undefined,
        LNH_TRANSACTION_TYPE: formData.LNH_TRANSACTION_TYPE || undefined,
        SENDER: formData.SENDER || "",
        RECEIVER: formData.RECEIVER || "",
        PAYMENT_DATE: formData.PAYMENT_DATE || "",
        AMOUNT: formData.AMOUNT || 0,
        CURRENCY_CODE: formData.CURRENCY_CODE || "VND",
        EXCHANGE_RATE: formData.EXCHANGE_RATE || undefined,
        ORIGIN_NUM: formData.ORIGIN_NUM || undefined,
        TRANSACTION_DATE: formData.TRANSACTION_DATE || undefined,
        EXP_TYPE: formData.EXP_TYPE || undefined,
        DESCRIPTION: formData.DESCRIPTION || "",
        LINES: formData.LINES || [],
        SENDER_NAME: formData.SENDER_NAME || "",
        SENDER_ADDRESS: formData.SENDER_ADDRESS || "",
        SENDER_GL_SEGMENT2: formData.SENDER_GL_SEGMENT2 || "",
        SENDER_NUM: formData.SENDER_NUM || undefined,
        SENDER_BANK_CODE: formData.SENDER_BANK_CODE || "",
        SENDER_IDENTIFY_ID: formData.SENDER_IDENTIFY_ID || undefined,
        SENDER_ISSUED_DATE: formData.SENDER_ISSUED_DATE || undefined,
        SENDER_ISSUED_PLACE: formData.SENDER_ISSUED_PLACE || undefined,
        TPCP_CODE: formData.TPCP_CODE || undefined,
        RECEIVER_NAME: formData.RECEIVER_NAME || "",
        RECEIVER_ADDRESS: formData.RECEIVER_ADDRESS || undefined,
        RECEIVER_GL_SEGMENT2: formData.RECEIVER_GL_SEGMENT2 || "",
        RECEIVER_BANK_CODE: formData.RECEIVER_BANK_CODE || "",
        RECEIVER_ACCOUNT_NAME: formData.RECEIVER_ACCOUNT_NAME || "",
        RECEIVER_IDENTIFY_ID: formData.RECEIVER_IDENTIFY_ID || undefined,
        RECEIVER_ISSUED_DATE: formData.RECEIVER_ISSUED_DATE || undefined,
        RECEIVER_ISSUED_PLACE: formData.RECEIVER_ISSUED_PLACE || undefined,
        FN_CODE1: formData.FN_CODE1 || undefined,
        FN_CODE2: formData.FN_CODE2 || undefined,
        FN_AMOUNT: formData.FN_AMOUNT || undefined,
      } as CreateOrderRequest;
    },
    [formData],
  );

  const handleSaveDraft = useCallback(async () => {
    setErrors({});
    try {
      const payload = buildPayload(true);
      const result = await createHook.create(payload);
      nav.toView(result.ID);
    } catch (err) {
      console.error("Create failed:", err);
    }
  }, [buildPayload, createHook, nav]);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload(false);
      const result = await createHook.create(payload);
      nav.toView(result.ID);
    } catch (err) {
      console.error("Create failed:", err);
    } finally {
      setSubmitting(false);
    }
  }, [formData, buildPayload, createHook, nav]);

  const handleCancel = useCallback(() => {
    nav.toHome();
  }, [nav]);

  const isLoading = createHook.loading || submitting;

  return (
    <div className="min-h-screen bg-[#f4f6fa] px-5 pb-10 pt-4">
      {/* Breadcrumb */}
      <nav className="mb-3 bg-white px-5 py-2 text-[12px]">
        <span
          className="cursor-pointer text-[#0b5394]"
          onClick={() => nav.toHome()}
        >
          Lệnh thanh toán đi
        </span>
        <span className="mx-1.5 text-[#bbb]">&rsaquo;</span>
        <span className="font-semibold text-[#1f2328]">Tạo mới lệnh</span>
      </nav>

      {/* Form card */}
      <div className="rounded-md border border-[#d7dbe0] bg-white shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        <div className="flex items-center justify-between rounded-t-md bg-[#eef3f9] px-3.5 py-2.5">
          <h2 className="text-[13px] font-bold uppercase text-[#073763]">
            Tạo mới lệnh thanh toán đi
          </h2>
          <span className="text-[11px] text-[#5f6368]">TT_LTT.CREATE</span>
        </div>

        <div className="p-3.5">
          <OrderFormTabs
            data={formData}
            onChange={handleChange}
            onLinesChange={handleLinesChange}
            errors={errors}
          />
        </div>

        {/* Error */}
        {createHook.error && (
          <div className="mx-3.5 mb-3 border-l-4 border-[#cc0000] bg-white px-4 py-3 text-[12.5px] text-[#cc0000]">
            Lỗi: {createHook.error.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-[#d7dbe0] bg-[#fafcfe] px-3.5 py-2.5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex h-8 items-center gap-1 rounded border border-[#d7dbe0] bg-white px-4 text-[12.5px] font-semibold text-[#333] transition-colors hover:bg-[#f3f5f8] disabled:cursor-not-allowed disabled:opacity-55"
          >
            Hủy bỏ
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="flex h-8 items-center gap-1 rounded border border-[#c6d6e6] bg-white px-4 text-[12.5px] font-semibold text-[#0b5394] transition-colors hover:bg-[#e7f0f9] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Lưu nháp
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex h-8 items-center gap-1 rounded bg-[#0b5394] px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#073763] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
              Gửi kiểm soát
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wrapped with ErrorBoundary
// ---------------------------------------------------------------------------

export function PayOutManualCreate() {
  return (
    <ErrorBoundary>
      <PayOutManualCreateInner />
    </ErrorBoundary>
  );
}

export default PayOutManualCreate;
