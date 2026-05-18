import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LttStatusBadge from "../components/LttStatusBadge";
import { listLtt } from "../api/lttApi";
import type {
  LttFilter,
  LttHeader,
  LttStatus,
  LttChannel,
} from "../api/lttApi";

export default function LttListPage() {
  const [filters, setFilters] = useState<LttFilter>({});
  const [rows, setRows] = useState<LttHeader[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listLtt({ ...filters, page, size: 20 });
      setRows(res.data.content);
      setTotalElements(res.data.totalElements);
      setTotalPages(res.data.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Loi tai du lieu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page]);

  const handleFilterChange = (
    field: keyof LttFilter,
    value: string | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(0);
    fetchList();
  };

  const handleClear = () => {
    setFilters({});
    setPage(0);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Danh sach Lenh Thanh Toan
        </h1>
        <div className="flex gap-3">
          <Link
            to="/ltt/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Tao moi
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter Area */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Bo loc</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Channel */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Kenh
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.channel ?? ""}
              onChange={(e) =>
                handleFilterChange(
                  "channel",
                  (e.target.value || undefined) as LttChannel | undefined,
                )
              }
            >
              <option value="">-- Tat ca --</option>
              <option value="LNH">Lien ngan hang</option>
              <option value="TTSP">Thanh toan song phuong</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Trang thai
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.status ?? ""}
              onChange={(e) =>
                handleFilterChange(
                  "status",
                  (e.target.value || undefined) as LttStatus | undefined,
                )
              }
            >
              <option value="">-- Tat ca --</option>
              <option value="DRAFT">Ban nhap</option>
              <option value="READY_FOR_APPROVAL">Cho kiem soat</option>
              <option value="PENDING_APPROVER">Cho phe duyet</option>
              <option value="APPROVED">Da phe duyet</option>
              <option value="RETURNED_TO_MAKER">Tra lai Maker</option>
              <option value="REJECTED">Tu choi</option>
              <option value="TRANSFERRED_TO_GL">Da chuyen GL</option>
              <option value="POSTED">Da ghi so</option>
              <option value="DELETED">Da xoa</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Tu ngay
            </label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.fromDate ?? ""}
              onChange={(e) =>
                handleFilterChange("fromDate", e.target.value || undefined)
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Den ngay
            </label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.toDate ?? ""}
              onChange={(e) =>
                handleFilterChange("toDate", e.target.value || undefined)
              }
            />
          </div>

          {/* Keyword */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Tu khoa
            </label>
            <input
              type="text"
              placeholder="Ma LTT, ten..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filters.keyword ?? ""}
              onChange={(e) =>
                handleFilterChange("keyword", e.target.value || undefined)
              }
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={handleClear}
          >
            Xoa bo loc
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={handleSearch}
          >
            Tim kiem
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ma LTT
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Kenh
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Trang thai
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nguoi gui
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nguoi nhan
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                So tien
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ngay hach toan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Dang tai du lieu...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Khong co du lieu. Nhan "Tao moi" de tao lenh thanh toan.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <Link
                      to={`/ltt/${row.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {row.lttCode}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {row.channel}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <LttStatusBadge status={row.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {row.senderName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {row.receiverName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                    {row.amount.toLocaleString()} {row.currency}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {row.valueDate}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalElements > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hien thi <span className="font-medium">{page * 20 + 1}</span> -{" "}
            <span className="font-medium">
              {Math.min((page + 1) * 20, totalElements)}
            </span>{" "}
            tren tong so <span className="font-medium">{totalElements}</span>{" "}
            ban ghi
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:opacity-50"
            >
              Truoc
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className={`rounded border px-3 py-1 text-sm ${
                  i === page
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
