import type { AuditLogEntry } from "../types/pay-out-manual";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AuditLogTimelineProps {
  entries: AuditLogEntry[];
  loading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  } catch {
    return iso;
  }
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    CREATE: "Tạo mới",
    UPDATE: "Cập nhật",
    SUBMIT: "Gửi kiểm soát",
    CHECK_APPROVE: "Kiểm soát phê duyệt",
    APPROVE: "Phê duyệt",
    RETURN: "Trả lại",
    REJECT: "Từ chối",
    DELETE: "Xóa",
  };
  return map[action] || action;
}

/** Parse oldValue/newValue JSON and render a diff view */
function renderDiff(oldVal?: string, newVal?: string): React.ReactNode {
  if (!oldVal && !newVal) return null;

  let oldObj: Record<string, unknown> = {};
  let newObj: Record<string, unknown> = {};

  try {
    if (oldVal) oldObj = JSON.parse(oldVal);
  } catch {
    oldObj = { value: oldVal };
  }
  try {
    if (newVal) newObj = JSON.parse(newVal);
  } catch {
    newObj = { value: newVal };
  }

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const changes: { key: string; old: unknown; new: unknown }[] = [];

  allKeys.forEach((key) => {
    const o = oldObj[key];
    const n = newObj[key];
    if (JSON.stringify(o) !== JSON.stringify(n)) {
      changes.push({ key, old: o, new: n });
    }
  });

  if (changes.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5 text-[11px]">
      {changes.map((c) => (
        <div key={c.key} className="flex items-start gap-1">
          <span className="font-medium text-[#073763]">{c.key}:</span>
          <span className="text-[#cc0000] line-through">
            {String(c.old ?? "")}
          </span>
          <span className="text-[#5f6368]">&rarr;</span>
          <span className="text-[#137333]">{String(c.new ?? "")}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuditLogTimeline({
  entries,
  loading = false,
}: AuditLogTimelineProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-[#d7dbe0] bg-white p-4">
        <h3 className="mb-3 text-[13px] font-bold uppercase text-[#073763]">
          Nhật ký thao tác
        </h3>
        <div className="py-8 text-center text-[12px] italic text-[#5f6368]">
          Đang tải nhật ký…
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-[#d7dbe0] bg-white p-4">
        <h3 className="mb-3 text-[13px] font-bold uppercase text-[#073763]">
          Nhật ký thao tác
        </h3>
        <div className="py-8 text-center text-[12px] italic text-[#5f6368]">
          Chưa có nhật ký thao tác.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#d7dbe0] bg-white">
      <div className="flex items-center justify-between rounded-t-lg bg-[#eef3f9] px-3.5 py-2.5">
        <h3 className="text-[13px] font-bold uppercase text-[#073763]">
          Nhật ký thao tác
        </h3>
        <span className="text-[11px] text-[#5f6368]">TT_LTT.AUDIT</span>
      </div>

      <div className="p-3.5">
        <div className="space-y-0">
          {entries.map((entry, idx) => (
            <div key={entry.ID} className="relative flex gap-3 pb-4">
              {/* Timeline connector */}
              {idx < entries.length - 1 && (
                <div className="absolute left-[11px] top-6 h-full w-[2px] bg-[#d7dbe0]" />
              )}

              {/* Timeline dot */}
              <div className="relative z-10 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0b5394] text-[10px] font-bold text-white">
                {idx + 1}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-1">
                  <span className="text-[12px] font-semibold text-[#333]">
                    {entry.PERFORMED_BY}
                  </span>
                  <span className="text-[12px] text-[#5f6368]">
                    — {formatAction(entry.ACTION)}
                  </span>
                  {entry.VERSION_BEFORE != null &&
                    entry.VERSION_AFTER != null && (
                      <span className="rounded bg-[#eef3f9] px-1 py-0.5 text-[10px] font-medium text-[#073763]">
                        v{entry.VERSION_BEFORE} &rarr; v{entry.VERSION_AFTER}
                      </span>
                    )}
                </div>
                <div className="text-[11px] text-[#5f6368]">
                  {formatDateTime(entry.PERFORMED_AT)}
                  {entry.IP_ADDRESS && (
                    <span className="ml-2">IP: {entry.IP_ADDRESS}</span>
                  )}
                </div>
                {renderDiff(entry.OLD_VALUE, entry.NEW_VALUE)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AuditLogTimeline;
