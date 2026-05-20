import { useState, useCallback } from "react";
import type {
  PayOrderLineRequest,
  CcidLineResult,
} from "../../types/pay-out-manual";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CoaLinesTabProps {
  lines: PayOrderLineRequest[];
  onChange: (lines: PayOrderLineRequest[]) => void;
  onValidateCcid?: (lineIndex: number) => Promise<CcidLineResult | null>;
  readOnly?: boolean;
  errors?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// GL Segment keys
// ---------------------------------------------------------------------------

const SEGMENT_KEYS = [
  "GL_SEGMENT1",
  "GL_SEGMENT2",
  "GL_SEGMENT3",
  "GL_SEGMENT4",
  "GL_SEGMENT5",
  "GL_SEGMENT6",
  "GL_SEGMENT7",
  "GL_SEGMENT8",
  "GL_SEGMENT9",
  "GL_SEGMENT10",
  "GL_SEGMENT11",
  "GL_SEGMENT12",
] as const;

const SEGMENT_LABELS: Record<string, string> = {
  GL_SEGMENT1: "Seg 1",
  GL_SEGMENT2: "Seg 2",
  GL_SEGMENT3: "Seg 3",
  GL_SEGMENT4: "Seg 4",
  GL_SEGMENT5: "Seg 5",
  GL_SEGMENT6: "Seg 6",
  GL_SEGMENT7: "Seg 7",
  GL_SEGMENT8: "Seg 8",
  GL_SEGMENT9: "Seg 9",
  GL_SEGMENT10: "Seg 10",
  GL_SEGMENT11: "Seg 11",
  GL_SEGMENT12: "Seg 12",
};

function createEmptyLine(): PayOrderLineRequest {
  return {
    GL_SEGMENT1: "",
    GL_SEGMENT2: "",
    GL_SEGMENT3: "",
    LINE_DESCRIPTION: "",
    LINE_AMOUNT: 0,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CoaLinesTab({
  lines,
  onChange,
  onValidateCcid,
  readOnly = false,
}: CoaLinesTabProps) {
  const [validatingLine, setValidatingLine] = useState<number | null>(null);
  const [ccidResults, setCcidResults] = useState<
    Record<number, CcidLineResult>
  >({});

  const handleAddLine = useCallback(() => {
    onChange([...lines, createEmptyLine()]);
  }, [lines, onChange]);

  const handleRemoveLine = useCallback(
    (index: number) => {
      const next = lines.filter((_, i) => i !== index);
      onChange(next);
      setCcidResults((prev) => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
    },
    [lines, onChange],
  );

  const handleLineChange = useCallback(
    (
      index: number,
      field: keyof PayOrderLineRequest,
      value: string | number,
    ) => {
      const next = lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line,
      );
      onChange(next);
      // Clear CCID result for that line
      setCcidResults((prev) => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
    },
    [lines, onChange],
  );

  const handleValidate = useCallback(
    async (index: number) => {
      if (!onValidateCcid) return;
      setValidatingLine(index);
      try {
        const result = await onValidateCcid(index);
        if (result) {
          setCcidResults((prev) => ({ ...prev, [index]: result }));
        }
      } catch (err) {
        console.error("CCID validation failed:", err);
      } finally {
        setValidatingLine(null);
      }
    },
    [onValidateCcid],
  );

  const inputCls =
    "h-7 w-full rounded border border-[#d7dbe0] px-1.5 text-[12.5px] focus:border-[#0b5394] focus:outline-none focus:ring-2 focus:ring-[rgba(11,83,148,0.15)]" +
    (readOnly ? " cursor-not-allowed bg-[#f3f5f8] text-[#555]" : "");

  return (
    <div>
      {/* Toolbar */}
      {!readOnly && (
        <div className="mb-3 flex items-center justify-between border-b border-[#d7dbe0] pb-2">
          <span className="text-[12px] text-[#5f6368]">
            {lines.length} dòng khoản mục
          </span>
          <button
            type="button"
            onClick={handleAddLine}
            className="flex h-8 items-center gap-1 rounded bg-[#137333] px-3 text-[12.5px] font-semibold text-white transition-colors hover:brightness-[0.92]"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Thêm dòng
          </button>
        </div>
      )}

      {/* Lines table */}
      {lines.length === 0 ? (
        <div className="py-8 text-center text-[12px] italic text-[#5f6368]">
          Chưa có khoản mục COA. Nhấn "Thêm dòng" để thêm mới.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b-2 border-[#c9d6e3] bg-[#eef3f9]">
                <th className="w-[50px] px-2 py-2 text-center text-[12px] font-bold uppercase text-[#073763]">
                  STT
                </th>
                {SEGMENT_KEYS.map((key) => (
                  <th
                    key={key}
                    className="whitespace-nowrap px-2 py-2 text-center text-[12px] font-bold uppercase text-[#073763]"
                  >
                    {SEGMENT_LABELS[key]}
                  </th>
                ))}
                <th className="px-2 py-2 text-left text-[12px] font-bold uppercase text-[#073763]">
                  Mô tả
                </th>
                <th className="px-2 py-2 text-right text-[12px] font-bold uppercase text-[#073763]">
                  Số tiền
                </th>
                <th className="w-[90px] px-2 py-2 text-center text-[12px] font-bold uppercase text-[#073763]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const ccidResult = ccidResults[idx];
                const isValid = ccidResult?.VALID;
                const isInvalid = ccidResult && !ccidResult.VALID;

                return (
                  <tr
                    key={idx}
                    className={`border-b border-[#d7dbe0] ${
                      idx % 2 === 1 ? "bg-[#fafcfe]" : ""
                    } ${isInvalid ? "bg-red-50/50" : ""}`}
                  >
                    {/* STT */}
                    <td className="px-2 py-1.5 text-center text-[#5f6368]">
                      {idx + 1}
                    </td>

                    {/* Segments */}
                    {SEGMENT_KEYS.map((seg) => (
                      <td key={seg} className="px-1 py-1">
                        <input
                          type="text"
                          value={(line[seg] as string) || ""}
                          onChange={(e) =>
                            handleLineChange(idx, seg, e.target.value)
                          }
                          className={inputCls}
                          readOnly={readOnly}
                          placeholder={`${SEGMENT_LABELS[seg]}…`}
                        />
                      </td>
                    ))}

                    {/* Description */}
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={line.LINE_DESCRIPTION}
                        onChange={(e) =>
                          handleLineChange(
                            idx,
                            "LINE_DESCRIPTION",
                            e.target.value,
                          )
                        }
                        className={inputCls}
                        readOnly={readOnly}
                        placeholder="Mô tả khoản mục…"
                      />
                    </td>

                    {/* Amount */}
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={line.LINE_AMOUNT || ""}
                        onChange={(e) =>
                          handleLineChange(
                            idx,
                            "LINE_AMOUNT",
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value),
                          )
                        }
                        className={`${inputCls} text-right`}
                        readOnly={readOnly}
                        min={0}
                        step="any"
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-1 py-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onValidateCcid && !readOnly && (
                          <button
                            type="button"
                            onClick={() => handleValidate(idx)}
                            disabled={validatingLine === idx}
                            className={`flex h-[26px] w-[26px] items-center justify-center rounded border text-[12px] transition-colors ${
                              isValid
                                ? "border-[#137333] bg-[#e6f4ea] text-[#137333]"
                                : isInvalid
                                  ? "border-[#cc0000] bg-[#fde7e7] text-[#cc0000]"
                                  : "border-[#d7dbe0] bg-white text-[#0b5394] hover:bg-[#e7f0f9]"
                            }`}
                            title="Kiểm tra CCID"
                            aria-label={`Kiểm tra CCID dòng ${idx + 1}`}
                          >
                            {validatingLine === idx ? (
                              <svg
                                className="h-3.5 w-3.5 animate-spin"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                              </svg>
                            ) : isValid ? (
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : isInvalid ? (
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            ) : (
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
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                          </button>
                        )}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="flex h-[26px] w-[26px] items-center justify-center rounded border border-[#e7c2c2] text-[#cc0000] transition-colors hover:bg-[#fdecec]"
                            title="Xóa dòng"
                            aria-label={`Xóa dòng ${idx + 1}`}
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      {/* CCID error messages */}
                      {ccidResult?.ERRORS && ccidResult.ERRORS.length > 0 && (
                        <div className="mt-1 text-left text-[10px] text-[#cc0000]">
                          {ccidResult.ERRORS.map((e, ei) => (
                            <div key={ei}>
                              {e.SEGMENT}: {e.MESSAGE}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {lines.length > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-[#d7dbe0] pt-2">
          <span className="text-[12px] text-[#5f6368]">
            Tổng cộp: {lines.length} dòng
          </span>
          <span className="text-[12px] font-semibold text-[#073763]">
            Tổng số tiền:{" "}
            {lines
              .reduce((sum, l) => sum + (l.LINE_AMOUNT || 0), 0)
              .toLocaleString("vi-VN")}
          </span>
        </div>
      )}
    </div>
  );
}

export default CoaLinesTab;
