import { useCallback, useState } from "react";
import type { CreateOrderRequest } from "../../types/pay-out-manual";
import type { LookupEntry } from "../../types/pay-out-manual";
import { LookupPopup, type LookupType } from "../LookupPopup";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SenderTabProps {
  data: Partial<CreateOrderRequest>;
  onChange: (field: keyof CreateOrderRequest, value: unknown) => void;
  readOnly?: boolean;
  errors?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SenderTab({
  data,
  onChange,
  readOnly = false,
  errors = {},
}: SenderTabProps) {
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupType, setLookupType] = useState<LookupType>("BANK");

  const handleChange = useCallback(
    (field: keyof CreateOrderRequest) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(field, e.target.value);
      },
    [onChange],
  );

  const handleLookupSelect = useCallback(
    (entry: LookupEntry) => {
      if (lookupType === "BANK") {
        onChange("SENDER_BANK_CODE", entry.CODE);
      } else if (lookupType === "DVQHNS") {
        onChange("SENDER_GL_SEGMENT2", entry.CODE);
      }
    },
    [lookupType, onChange],
  );

  const openLookup = useCallback((type: LookupType) => {
    setLookupType(type);
    setLookupOpen(true);
  }, []);

  const inputCls =
    "h-8 w-full rounded border border-[#d7dbe0] px-2 text-[13px] focus:border-[#0b5394] focus:outline-none focus:ring-2 focus:ring-[rgba(11,83,148,0.15)]" +
    (readOnly ? " cursor-not-allowed bg-[#f3f5f8] text-[#555]" : "");
  const labelCls = "mb-1 block text-[12px] font-medium text-[#333]";
  const errorCls = "mt-0.5 text-[12px] text-[#cc0000]";

  return (
    <div>
      <div className="grid grid-cols-3 gap-x-[18px] gap-y-3 max-[960px]:grid-cols-2 max-[600px]:grid-cols-1">
        {/* Ten nguoi chung triet */}
        <div>
          <label className={labelCls}>
            Tên người chứng triệt <span className="text-[#cc0000]">*</span>
          </label>
          <input
            type="text"
            value={data.SENDER_NAME || ""}
            onChange={handleChange("SENDER_NAME")}
            maxLength={200}
            className={inputCls}
            readOnly={readOnly}
            placeholder="Nhập tên người chứng triệt…"
          />
          {errors.SENDER_NAME && (
            <div className={errorCls}>{errors.SENDER_NAME}</div>
          )}
        </div>

        {/* Dia chi */}
        <div>
          <label className={labelCls}>
            Địa chỉ <span className="text-[#cc0000]">*</span>
          </label>
          <input
            type="text"
            value={data.SENDER_ADDRESS || ""}
            onChange={handleChange("SENDER_ADDRESS")}
            maxLength={500}
            className={inputCls}
            readOnly={readOnly}
            placeholder="Nhập địa chỉ…"
          />
          {errors.SENDER_ADDRESS && (
            <div className={errorCls}>{errors.SENDER_ADDRESS}</div>
          )}
        </div>

        {/* GL Segment 2 */}
        <div>
          <label className={labelCls}>
            GL Segment 2 <span className="text-[#cc0000]">*</span>
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={data.SENDER_GL_SEGMENT2 || ""}
              onChange={handleChange("SENDER_GL_SEGMENT2")}
              maxLength={4}
              className={inputCls}
              readOnly={readOnly}
              placeholder="Mã ĐVQHNS…"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => openLookup("DVQHNS")}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#d7dbe0] text-[#0b5394] transition-colors hover:bg-[#e7f0f9]"
                title="Tra cúu ĐVQHNS"
                aria-label="Tra cúu ĐVQHNS"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            )}
          </div>
          {errors.SENDER_GL_SEGMENT2 && (
            <div className={errorCls}>{errors.SENDER_GL_SEGMENT2}</div>
          )}
        </div>

        {/* So tai khoan */}
        <div>
          <label className={labelCls}>Số tài khoản</label>
          <input
            type="text"
            value={data.SENDER_NUM || ""}
            onChange={handleChange("SENDER_NUM")}
            maxLength={20}
            className={inputCls}
            readOnly={readOnly}
            placeholder="Nhập số tài khoản…"
          />
        </div>

        {/* Ma ngan hang */}
        <div>
          <label className={labelCls}>
            Mã ngân hàng <span className="text-[#cc0000]">*</span>
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={data.SENDER_BANK_CODE || ""}
              onChange={handleChange("SENDER_BANK_CODE")}
              maxLength={20}
              className={inputCls}
              readOnly={readOnly}
              placeholder="Mã ngân hàng…"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => openLookup("BANK")}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#d7dbe0] text-[#0b5394] transition-colors hover:bg-[#e7f0f9]"
                title="Tra cúu ngân hàng"
                aria-label="Tra cúu ngân hàng"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            )}
          </div>
          {errors.SENDER_BANK_CODE && (
            <div className={errorCls}>{errors.SENDER_BANK_CODE}</div>
          )}
        </div>

        {/* So GTTT */}
        <div>
          <label className={labelCls}>Số GTTT</label>
          <input
            type="text"
            value={data.SENDER_IDENTIFY_ID || ""}
            onChange={handleChange("SENDER_IDENTIFY_ID")}
            maxLength={50}
            className={inputCls}
            readOnly={readOnly}
            placeholder="Nhập số giấy tờ…"
          />
        </div>

        {/* Ngay cap GTTT */}
        <div>
          <label className={labelCls}>Ngày cấp GTTT</label>
          <input
            type="date"
            value={data.SENDER_ISSUED_DATE || ""}
            onChange={handleChange("SENDER_ISSUED_DATE")}
            className={inputCls}
            readOnly={readOnly}
          />
        </div>

        {/* Noi cap GTTT */}
        <div>
          <label className={labelCls}>Nơi cấp GTTT</label>
          <input
            type="text"
            value={data.SENDER_ISSUED_PLACE || ""}
            onChange={handleChange("SENDER_ISSUED_PLACE")}
            maxLength={200}
            className={inputCls}
            readOnly={readOnly}
            placeholder="Nhập nơi cấp…"
          />
        </div>

        {/* Ma TPCP */}
        <div>
          <label className={labelCls}>Mã TPCP</label>
          <input
            type="text"
            value={data.TPCP_CODE || ""}
            onChange={handleChange("TPCP_CODE")}
            maxLength={20}
            className={inputCls}
            readOnly={readOnly}
            placeholder="Nhập mã TPCP…"
          />
        </div>
      </div>

      {/* Lookup popup */}
      <LookupPopup
        open={lookupOpen}
        type={lookupType}
        onSelect={handleLookupSelect}
        onClose={() => setLookupOpen(false)}
      />
    </div>
  );
}

export default SenderTab;
