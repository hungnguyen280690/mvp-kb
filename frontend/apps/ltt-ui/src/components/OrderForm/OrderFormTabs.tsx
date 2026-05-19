import { useState, useCallback } from "react";
import type {
  CreateOrderRequest,
  PayOrderLineRequest,
  CcidLineResult,
} from "../../types/pay-out-manual";
import { GeneralTab } from "./GeneralTab";
import { CoaLinesTab } from "./CoaLinesTab";
import { SenderTab } from "./SenderTab";
import { ReceiverTab } from "./ReceiverTab";

// ---------------------------------------------------------------------------
// Tab definition
// ---------------------------------------------------------------------------

interface TabDef {
  key: string;
  label: string;
  code: string;
}

const TABS: TabDef[] = [
  { key: "general", label: "Thông tin chung", code: "B1.1" },
  { key: "coa", label: "Khoản mục COA", code: "B1.2" },
  { key: "sender", label: "Thông tin người chứng triệt", code: "B1.3" },
  { key: "receiver", label: "Thông tin người hưởng", code: "B1.4" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OrderFormTabsProps {
  data: Partial<CreateOrderRequest>;
  onChange: (field: keyof CreateOrderRequest, value: unknown) => void;
  onLinesChange: (lines: PayOrderLineRequest[]) => void;
  onValidateCcid?: (lineIndex: number) => Promise<CcidLineResult | null>;
  readOnly?: boolean;
  errors?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrderFormTabs({
  data,
  onChange,
  onLinesChange,
  onValidateCcid,
  readOnly = false,
  errors = {},
}: OrderFormTabsProps) {
  const [activeTab, setActiveTab] = useState("general");

  const handleTabClick = useCallback((key: string) => {
    setActiveTab(key);
  }, []);

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-0 flex border-b border-[#c9d6e3] bg-[#eef3f9]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabClick(tab.key)}
            className={`relative px-4 py-2.5 text-[12.5px] font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-white text-[#0b5394] shadow-[inset_2px_2px_0_#fff,inset_-2px_0_0_#fff]"
                : "text-[#5f6368] hover:text-[#073763]"
            }`}
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            {tab.label}
            <span className="ml-1.5 text-[10px] font-normal text-[#5f6368]">
              [{tab.code}]
            </span>
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0b5394]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-b-lg border border-t-0 border-[#d7dbe0] bg-white p-3.5">
        {activeTab === "general" && (
          <GeneralTab
            data={data}
            onChange={onChange}
            readOnly={readOnly}
            errors={errors}
          />
        )}
        {activeTab === "coa" && (
          <CoaLinesTab
            lines={data.LINES || []}
            onChange={onLinesChange}
            onValidateCcid={onValidateCcid}
            readOnly={readOnly}
            errors={errors}
          />
        )}
        {activeTab === "sender" && (
          <SenderTab
            data={data}
            onChange={onChange}
            readOnly={readOnly}
            errors={errors}
          />
        )}
        {activeTab === "receiver" && (
          <ReceiverTab
            data={data}
            onChange={onChange}
            readOnly={readOnly}
            errors={errors}
          />
        )}
      </div>
    </div>
  );
}

export default OrderFormTabs;
