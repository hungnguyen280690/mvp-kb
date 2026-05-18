export default function Dashboard() {
  return (
    <>
      <h1 className="text-lg font-bold mb-4" style={{ color: '#073763' }}>
        Trang chu - VDBAS Phan he Thanh toan
      </h1>

      <div className="grid grid-cols-4 gap-4 mb-6 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
        {/* Stats cards */}
        <div className="bg-white border rounded-md p-4" style={{ borderColor: '#d7dbe0', boxShadow: '0 1px 2px rgba(15,20,25,.04)' }}>
          <div className="text-xs text-[#5f6368] mb-1">Cho xu ly hom nay</div>
          <div className="text-2xl font-bold" style={{ color: '#073763' }}>12</div>
          <div className="text-[11px] text-[#137333] mt-1">+3 so voi hom qua</div>
        </div>
        <div className="bg-white border rounded-md p-4" style={{ borderColor: '#d7dbe0', boxShadow: '0 1px 2px rgba(15,20,25,.04)' }}>
          <div className="text-xs text-[#5f6368] mb-1">Da phe duyet hom nay</div>
          <div className="text-2xl font-bold" style={{ color: '#137333' }}>8</div>
          <div className="text-[11px] text-[#5f6368] mt-1">Tong tien: 15.230.000.000 VND</div>
        </div>
        <div className="bg-white border rounded-md p-4" style={{ borderColor: '#d7dbe0', boxShadow: '0 1px 2px rgba(15,20,25,.04)' }}>
          <div className="text-xs text-[#5f6368] mb-1">Tra ve / Tu choi</div>
          <div className="text-2xl font-bold" style={{ color: '#c0392b' }}>2</div>
          <div className="text-[11px] text-[#5f6368] mt-1">Can xu ly lai</div>
        </div>
        <div className="bg-white border rounded-md p-4" style={{ borderColor: '#d7dbe0', boxShadow: '0 1px 2px rgba(15,20,25,.04)' }}>
          <div className="text-xs text-[#5f6368] mb-1">Tong so giao dich thang</div>
          <div className="text-2xl font-bold" style={{ color: '#0b5394' }}>156</div>
          <div className="text-[11px] text-[#5f6368] mt-1">Thang 05/2026</div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white border rounded-md overflow-hidden" style={{ borderColor: '#d7dbe0', boxShadow: '0 1px 2px rgba(15,20,25,.04)' }}>
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ background: '#eef3f9', borderColor: '#d7dbe0' }}>
          <h2 className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#073763' }}>
            Giao dich gan day
          </h2>
        </div>
        <div className="p-8 text-center text-[#5f6368] italic">
          Chon "Lenh thanh toan" tu menu de xem danh sach giao dich.
        </div>
      </div>
    </>
  );
}
