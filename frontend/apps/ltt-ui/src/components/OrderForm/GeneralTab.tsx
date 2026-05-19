import { useCallback } from "react";
import type {
  OrderChannel,
  LnhTransactionType,
  ExpType,
  CreateOrderRequest,
} from "../../types/pay-out-manual";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GeneralTabProps {
  data: Partial<CreateOrderRequest>;
  onChange: (field: keyof CreateOrderRequest, value: unknown) => void;
  readOnly?: boolean;
  errors?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const CHANNEL_OPTIONS: { value: OrderChannel; label: string }[] = [
  { value: "LNH", label: "LNH" },
  { value: "TTSP", label: "TTSP" },
  { value: "LIEN_KHO_BAC", label: "Liên Kho Bạc" },
];

const LNH_TYPE_OPTIONS: { value: LnhTransactionType; label: string }[] = [
  { value: "LTT01", label: "LTT01" },
  { value: "LTT02", label: "LTT02" },
  { value: "LTT03", label: "LTT03" },
  { value: "LTT04", label: "LTT04" },
];

const EXP_TYPE_OPTIONS: { value: ExpType; label: string }[] = [
  { value: "EXP01", label: "EXP01" },
  { value: "EXP02", label: "EXP02" },
  { value: "EXP03", label: "EXP03" },
  { value: "EXP04", label: "EXP04" },
  { value: "EXP05", label: "EXP05" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GeneralTab({
  data,
  onChange,
  readOnly = false,
  errors = {},
}: GeneralTabProps) {
  const handleChange = useCallback(
    (field: keyof CreateOrderRequest) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const raw = e.target.value;
        if (
          field === "AMOUNT" ||
          field === "EXCHANGE_RATE" ||
          field === "FN_AMOUNT"
        ) {
          onChange(field, raw === "" ? undefined : parseFloat(raw));
        } else {
          onChange(field, raw);
        }
      },
    [onChange],
  );

  const inputCls =
    "h-8 w-full rounded border border-[#d7dbe0] px-2 text-[13px] focus:border-[#0b5394] focus:outline-none focus:ring-2 focus:ring-[rgba(11,83,148,0.15)]" +
    (readOnly ? " cursor-not-allowed bg-[#f3f5f8] text-[#555]" : "");
  const selectCls = inputCls;
  const labelCls = "mb-1 block text-[12px] font-medium text-[#333]";
  const errorCls = "mt-0.5 text-[12px] text-[#cc0000]";

  return (
    <div className="grid grid-cols-3 gap-x-[18px] gap-y-3 max-[960px]:grid-cols-2 max-[600px]:grid-cols-1">
      {/* Kenh */}
      <div>
        <label className={labelCls}>
          Kênh <span className="text-[#cc0000]">*</span>
        </label>
        <select
          value={data.CHANNEL || ""}
          onChange={handleChange("CHANNEL")}
          className={selectCls}
          disabled={readOnly}
        >
          <option value="">-- Chọn --</option>
          {CHANNEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {errors.CHANNEL && <div className={errorCls}>{errors.CHANNEL}</div>}
      </div>

      {/* Loai lenh */}
      <div>
        <label className={labelCls}>Loại lệnh</label>
        <input
          type="text"
          value={data.ORDER_TYPE || ""}
          onChange={handleChange("ORDER_TYPE")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="Nhập loại lệnh…"
        />
      </div>

      {/* LNH Transaction Type — shown when CHANNEL = LNH */}
      {data.CHANNEL === "LNH" && (
        <div>
          <label className={labelCls}>
            Loại giao dịch LNH <span className="text-[#cc0000]">*</span>
          </label>
          <select
            value={data.LNH_TRANSACTION_TYPE || ""}
            onChange={handleChange("LNH_TRANSACTION_TYPE")}
            className={selectCls}
            disabled={readOnly}
          >
            <option value="">-- Chọn --</option>
            {LNH_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.LNH_TRANSACTION_TYPE && (
            <div className={errorCls}>{errors.LNH_TRANSACTION_TYPE}</div>
          )}
        </div>
      )}

      {/* Nguoi chung triet */}
      <div>
        <label className={labelCls}>
          Nguời chứng triệt <span className="text-[#cc0000]">*</span>
        </label>
        <input
          type="text"
          value={data.SENDER || ""}
          onChange={handleChange("SENDER")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="Nhập mã người chứng triệt…"
        />
        {errors.SENDER && <div className={errorCls}>{errors.SENDER}</div>}
      </div>

      {/* Nguoi huong */}
      <div>
        <label className={labelCls}>
          Nguời hưởng <span className="text-[#cc0000]">*</span>
        </label>
        <input
          type="text"
          value={data.RECEIVER || ""}
          onChange={handleChange("RECEIVER")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="Nhập mã người hưởng…"
        />
        {errors.RECEIVER && <div className={errorCls}>{errors.RECEIVER}</div>}
      </div>

      {/* Ngay thanh toan */}
      <div>
        <label className={labelCls}>
          Ngày thanh toán <span className="text-[#cc0000]">*</span>
        </label>
        <input
          type="date"
          value={data.PAYMENT_DATE || ""}
          onChange={handleChange("PAYMENT_DATE")}
          className={inputCls}
          readOnly={readOnly}
        />
        {errors.PAYMENT_DATE && (
          <div className={errorCls}>{errors.PAYMENT_DATE}</div>
        )}
      </div>

      {/* So tien */}
      <div>
        <label className={labelCls}>
          Số tiền <span className="text-[#cc0000]">*</span>
        </label>
        <input
          type="number"
          value={data.AMOUNT ?? ""}
          onChange={handleChange("AMOUNT")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="0"
          min={0}
          step="any"
        />
        {errors.AMOUNT && <div className={errorCls}>{errors.AMOUNT}</div>}
      </div>

      {/* Ngoai te */}
      <div>
        <label className={labelCls}>Ngoại tệ</label>
        <input
          type="text"
          value={data.CURRENCY_CODE || ""}
          onChange={handleChange("CURRENCY_CODE")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="VND"
        />
      </div>

      {/* Ty gia */}
      <div>
        <label className={labelCls}>Tỉ giá</label>
        <input
          type="number"
          value={data.EXCHANGE_RATE ?? ""}
          onChange={handleChange("EXCHANGE_RATE")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="Nhập tỉ giá…"
          min={0}
          step="any"
        />
      </div>

      {/* Mo ta — span 2 columns */}
      <div className="col-span-2 max-[600px]:col-span-1">
        <label className={labelCls}>
          Mô tả <span className="text-[#cc0000]">*</span>
        </label>
        <input
          type="text"
          value={data.DESCRIPTION || ""}
          onChange={handleChange("DESCRIPTION")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="Nhập mô tả…"
        />
        {errors.DESCRIPTION && (
          <div className={errorCls}>{errors.DESCRIPTION}</div>
        )}
      </div>

      {/* So goc */}
      <div>
        <label className={labelCls}>Số gốc</label>
        <input
          type="text"
          value={data.ORIGIN_NUM || ""}
          onChange={handleChange("ORIGIN_NUM")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="Nhập số gốc…"
        />
      </div>

      {/* Ngay giao dich */}
      <div>
        <label className={labelCls}>Ngày giao dịch</label>
        <input
          type="date"
          value={data.TRANSACTION_DATE || ""}
          onChange={handleChange("TRANSACTION_DATE")}
          className={inputCls}
          readOnly={readOnly}
        />
      </div>

      {/* Loai chi phi */}
      <div>
        <label className={labelCls}>Loại chi phí</label>
        <select
          value={data.EXP_TYPE || ""}
          onChange={handleChange("EXP_TYPE")}
          className={selectCls}
          disabled={readOnly}
        >
          <option value="">-- Chọn --</option>
          {EXP_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* FN Code 1 */}
      <div>
        <label className={labelCls}>FN Code 1</label>
        <input
          type="text"
          value={data.FN_CODE1 || ""}
          onChange={handleChange("FN_CODE1")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="Nhập FN code 1…"
        />
      </div>

      {/* FN Code 2 */}
      <div>
        <label className={labelCls}>FN Code 2</label>
        <input
          type="text"
          value={data.FN_CODE2 || ""}
          onChange={handleChange("FN_CODE2")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="Nhập FN code 2…"
        />
      </div>

      {/* FN Amount */}
      <div>
        <label className={labelCls}>FN Amount</label>
        <input
          type="number"
          value={data.FN_AMOUNT ?? ""}
          onChange={handleChange("FN_AMOUNT")}
          className={inputCls}
          readOnly={readOnly}
          placeholder="0"
          min={0}
          step="any"
        />
      </div>
    </div>
  );
}

export default GeneralTab;
