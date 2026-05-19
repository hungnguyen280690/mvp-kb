import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  UpdateOrderRequest,
  PayOrderLineRequest,
  PayOutManual,
  CcidLineResult,
} from "../types/pay-out-manual";
import {
  useOrder,
  useUpdateOrder,
  useWorkflowAction,
} from "../hooks/usePayOutManual";
import { payOutManualClient } from "../api/pay-out-manual-client";
import { OrderFormTabs } from "../components/OrderForm/OrderFormTabs";
import { ErrorBoundary } from "../components/ErrorBoundary";

// ---------------------------------------------------------------------------
// Map order to form data
// ---------------------------------------------------------------------------

function orderToFormData(order: PayOutManual): Partial<UpdateOrderRequest> {
  return {
    CHANNEL: order.CHANNEL,
    ORDER_TYPE: order.ORDER_TYPE,
    LNH_TRANSACTION_TYPE: order.LNH_TRANSACTION_TYPE,
    SENDER: order.SENDER,
    RECEIVER: order.RECEIVER,
    PAYMENT_DATE: order.PAYMENT_DATE,
    AMOUNT: order.AMOUNT,
    CURRENCY_CODE: order.CURRENCY_CODE,
    EXCHANGE_RATE: order.EXCHANGE_RATE,
    ORIGIN_NUM: order.ORIGIN_NUM,
    TRANSACTION_DATE: order.TRANSACTION_DATE,
    EXP_TYPE: order.EXP_TYPE,
    DESCRIPTION: order.DESCRIPTION,
    FN_CODE1: order.FN_CODE1,
    FN_CODE2: order.FN_CODE2,
    FN_AMOUNT: order.FN_AMOUNT,
    LINES: order.LINES.map((l) => ({
      GL_SEGMENT1: l.GL_SEGMENT1,
      GL_SEGMENT2: l.GL_SEGMENT2,
      GL_SEGMENT3: l.GL_SEGMENT3,
      GL_SEGMENT4: l.GL_SEGMENT4,
      GL_SEGMENT5: l.GL_SEGMENT5,
      GL_SEGMENT6: l.GL_SEGMENT6,
      GL_SEGMENT7: l.GL_SEGMENT7,
      GL_SEGMENT8: l.GL_SEGMENT8,
      GL_SEGMENT9: l.GL_SEGMENT9,
      GL_SEGMENT10: l.GL_SEGMENT10,
      GL_SEGMENT11: l.GL_SEGMENT11,
      GL_SEGMENT12: l.GL_SEGMENT12,
      LINE_DESCRIPTION: l.LINE_DESCRIPTION,
      LINE_AMOUNT: l.LINE_AMOUNT,
    })),
    SENDER_NAME: order.SENDER_NAME,
    SENDER_ADDRESS: order.SENDER_ADDRESS,
    SENDER_GL_SEGMENT2: order.SENDER_GL_SEGMENT2,
    SENDER_NUM: order.SENDER_NUM,
    SENDER_BANK_CODE: order.SENDER_BANK_CODE,
    SENDER_IDENTIFY_ID: order.SENDER_IDENTIFY_ID,
    SENDER_ISSUED_DATE: order.SENDER_ISSUED_DATE,
    SENDER_ISSUED_PLACE: order.SENDER_ISSUED_PLACE,
    TPCP_CODE: order.TPCP_CODE,
    RECEIVER_NAME: order.RECEIVER_NAME,
    RECEIVER_ADDRESS: order.RECEIVER_ADDRESS,
    RECEIVER_GL_SEGMENT2: order.RECEIVER_GL_SEGMENT2,
    RECEIVER_BANK_CODE: order.RECEIVER_BANK_CODE,
    RECEIVER_ACCOUNT_NAME: order.RECEIVER_ACCOUNT_NAME,
    RECEIVER_IDENTIFY_ID: order.RECEIVER_IDENTIFY_ID,
    RECEIVER_ISSUED_DATE: order.RECEIVER_ISSUED_DATE,
    RECEIVER_ISSUED_PLACE: order.RECEIVER_ISSUED_PLACE,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(data: Partial<UpdateOrderRequest>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.DESCRIPTION) errors.DESCRIPTION = "Mô tả là bắt buộc";
  if (!data.AMOUNT || data.AMOUNT <= 0) errors.AMOUNT = "Số tiền phải > 0";
  if (!data.PAYMENT_DATE) errors.PAYMENT_DATE = "Ngày thanh toán là bắt buộc";
  if (!data.SENDER_NAME)
    errors.SENDER_NAME = "Tên người chứng triệt là bắt buộc";
  if (!data.RECEIVER_NAME) errors.RECEIVER_NAME = "Tên người hưởng là bắt buộc";
  return errors;
}

// ---------------------------------------------------------------------------
// Inner component
// ---------------------------------------------------------------------------

function PayOutManualEditInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: order,
    loading: orderLoading,
    error: orderError,
    etag,
  } = useOrder(id || null);
  const updateHook = useUpdateOrder();
  const workflowHook = useWorkflowAction();

  const [formData, setFormData] = useState<Partial<UpdateOrderRequest>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [versionWarning, setVersionWarning] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Populate form data once the order is loaded
  useEffect(() => {
    if (order && !initialized) {
      setFormData(orderToFormData(order));
      setInitialized(true);
    }
  }, [order, initialized]);

  // Check for optimistic lock conflicts
  useEffect(() => {
    if (order && etag) {
      const etagVersion = parseInt(etag.replace(/"/g, ""), 10);
      if (!isNaN(etagVersion) && order.VERSION !== etagVersion) {
        setVersionWarning(true);
      }
    }
  }, [order, etag]);

  const handleChange = useCallback(
    (field: keyof UpdateOrderRequest, value: unknown) => {
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

  const handleValidateCcid = useCallback(
    async (lineIndex: number): Promise<CcidLineResult | null> => {
      if (!id || !formData.LINES) return null;
      const line = formData.LINES[lineIndex];
      if (!line) return null;
      try {
        const result = await payOutManualClient.validateCcidLines(id, [line]);
        if (result.RESULTS && result.RESULTS.length > 0) {
          return result.RESULTS[0];
        }
        return null;
      } catch {
        return null;
      }
    },
    [id, formData.LINES],
  );

  const handleSave = useCallback(async () => {
    if (!id) return;
    setErrors({});
    try {
      await updateHook.update(id, formData as UpdateOrderRequest);
      navigate(`/${id}`);
    } catch (err) {
      console.error("Update failed:", err);
    }
  }, [id, formData, updateHook, navigate]);

  const handleSubmit = useCallback(async () => {
    if (!id) return;
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      await updateHook.update(id, formData as UpdateOrderRequest);
      await workflowHook.execute({ action: "submit", id });
      navigate(`/${id}`);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  }, [id, formData, updateHook, workflowHook, navigate]);

  const handleCancel = useCallback(() => {
    if (id) navigate(`/${id}`);
    else navigate("/");
  }, [id, navigate]);

  if (orderLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6fa]">
        <span className="text-[13px] text-[#5f6368]">Đang tải dữ liệu…</span>
      </div>
    );
  }

  if (orderError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6fa]">
        <span className="text-[13px] text-[#cc0000]">
          Lỗi tải dữ liệu: {orderError.message}
        </span>
        <button
          type="button"
          onClick={handleCancel}
          className="mt-3 rounded bg-[#0b5394] px-4 py-2 text-[12.5px] font-semibold text-white"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // Prevent editing non-editable orders
  if (
    order &&
    order.STATUS !== "DRAFT" &&
    order.STATUS !== "RETURNED_TO_MAKER"
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6fa]">
        <span className="text-[13px] text-[#cc0000]">
          Không thể chỉnh sửa lệnh ổ trạng thái {order.STATUS}
        </span>
        <button
          type="button"
          onClick={handleCancel}
          className="mt-3 rounded bg-[#0b5394] px-4 py-2 text-[12.5px] font-semibold text-white"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const isLoading = updateHook.loading || workflowHook.loading;

  return (
    <div className="min-h-screen bg-[#f4f6fa] px-5 pb-10 pt-4">
      {/* Breadcrumb */}
      <nav className="mb-3 bg-white px-5 py-2 text-[12px]">
        <span
          className="cursor-pointer text-[#0b5394]"
          onClick={() => navigate("/")}
        >
          Lệnh thanh toán đi
        </span>
        <span className="mx-1.5 text-[#bbb]">&rsaquo;</span>
        <span
          className="cursor-pointer text-[#0b5394]"
          onClick={() => id && navigate(`/${id}`)}
        >
          {order?.REF_NO || id}
        </span>
        <span className="mx-1.5 text-[#bbb]">&rsaquo;</span>
        <span className="font-semibold text-[#1f2328]">Chỉnh sửa</span>
      </nav>

      {/* Version warning */}
      {versionWarning && (
        <div className="mb-3 rounded border border-orange-200 bg-orange-50 px-4 py-3 text-[12px] text-orange-700">
          <strong>Cảnh báo:</strong> Lệnh đã bị thay đổi từ phiên bản khác. Dữ
          liệu bạn đang chỉnh sửa có thể không còn mới nhất. Vui lòng tải lại
          trang.
        </div>
      )}

      {/* Form card */}
      <div className="rounded-md border border-[#d7dbe0] bg-white shadow-[0_1px_2px_rgba(15,20,25,0.04)]">
        <div className="flex items-center justify-between rounded-t-md bg-[#eef3f9] px-3.5 py-2.5">
          <h2 className="text-[13px] font-bold uppercase text-[#073763]">
            Chỉnh sửa lệnh {order?.REF_NO || ""}
          </h2>
          <span className="text-[11px] text-[#5f6368]">TT_LTT.EDIT</span>
        </div>

        <div className="p-3.5">
          <OrderFormTabs
            data={formData}
            onChange={handleChange}
            onLinesChange={handleLinesChange}
            onValidateCcid={handleValidateCcid}
            errors={errors}
          />
        </div>

        {/* Error */}
        {(updateHook.error || workflowHook.error) && (
          <div className="mx-3.5 mb-3 border-l-4 border-[#cc0000] bg-white px-4 py-3 text-[12.5px] text-[#cc0000]">
            Lỗi: {(updateHook.error || workflowHook.error)?.message}
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
              onClick={handleSave}
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
              Lưu
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
              Lưu &amp; Gửi kiểm soát
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

export function PayOutManualEdit() {
  return (
    <ErrorBoundary>
      <PayOutManualEditInner />
    </ErrorBoundary>
  );
}

export default PayOutManualEdit;
