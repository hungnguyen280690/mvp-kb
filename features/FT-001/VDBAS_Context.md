1. Thông tin chung
   Tên dự án: Hệ thống thông tin ngân sách và kế toán nhà nước số (VDBAS).

Chủ đầu tư: Kho bạc Nhà nước (KBNN).

Mục tiêu chính: Xây dựng hệ thống nền tảng số lõi cho KBNN, thực hiện hiện đại hóa quản lý ngân sách và kế toán nhà nước theo hướng tập trung, tích hợp và tự động hóa.

2. Kiến trúc & Công nghệ (Technical Stack)
   Mô hình kiến trúc: Triển khai theo kiến trúc Microservices kết hợp với các nền tảng dùng chung.

Hệ quản trị cơ sở dữ liệu: Sử dụng Oracle Database (đảm bảo tính thống nhất với hạ tầng phần cứng) và giải pháp đồng bộ dữ liệu Oracle GoldenGate.

Giải pháp lõi (Core): Sử dụng Oracle EBS (Enterprise Business Suite) cho phân hệ Sổ cái kế toán nhà nước (GL).

Trục tích hợp:Sử dụng trục tích hợp trong VDBAS và ngoài VDBAS (của KBNN), áp dụng phần mềm IBM Datapower quản lý API Gateway và IBM MQ

Bảo mật: Triển khai giải pháp xác thực đa nhân tố (MFA) cho người dùng nội bộ và tuân thủ các tiêu chuẩn an toàn thông tin theo quy định.

3. Các phân hệ ứng dụng chính
   Phân hệ lõi: Sổ cái kế toán (GL), Quản lý Thu và Quản lý Chi.

Hệ thống dịch vụ: Xử lý dịch vụ KBNN (Dịch vụ công trực tuyến).

Nền tảng bổ trợ:

Hệ thống Lưu trữ điện tử.

Nền tảng Quản trị dùng chung (quản lý danh mục, xác thực tập trung).

Hệ thống báo cáo và kho dữ liệu.

4. Hạ tầng triển khai
   Môi trường: Ứng dụng hoạt động trên nền tảng Cloud PaaS.

Kết nối DC-DR: Sử dụng thiết bị ghép kênh DWDM và đường truyền quang tốc độ cao (tối thiểu 10 Gbps) để kết nối giữa Trung tâm dữ liệu chính (DC) và Trung tâm dự phòng (DR).

Công nghệ phần cứng: Ưu tiên các thiết bị hiệu năng cao như NVMe Gen 5, RAM DDR5.

5. Quy định & Pháp lý tuân thủ
   Khung kiến trúc số Bộ Tài chính (Quyết định số 4060/QĐ-BTC ngày 05/12/2025).

Nghiệm thu và triển khai theo các tiêu chuẩn về Ipv6 và an toàn thông tin cấp độ.
