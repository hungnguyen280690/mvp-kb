# Sổ cái Kiến trúc (Project Structure Ledger)

Tài liệu này định nghĩa cấu trúc mã nguồn (Skeleton) của dự án **MVP Kho Bạc**, dựa trên các phương pháp luận kiến trúc tiên tiến để đảm bảo tính độc lập, khả năng mở rộng và tái lập.

## 1. Phương pháp luận Backend: Hexagonal Architecture (Kiến trúc Lục giác)
Mục tiêu: Cô lập logic nghiệp vụ khỏi các phụ thuộc bên ngoài (Framework, DB).

### Cấu trúc Module: `ltt-core`
```text
mvp-kb/backend/ltt-core/src/main/java/com/kb/ltt/
├── domain/                # Lõi nghiệp vụ (Domain Models, Business Rules) - Thuần Java
│   └── model/             # e.g., Transaction.java, LineItem.java
├── application/           # Luồng sử dụng (Use Cases & Ports)
│   ├── port/
│   │   ├── in/            # Interfaces cho Input (e.g., CreateLttUseCase)
│   │   └── out/           # Interfaces cho Output (e.g., LttRepositoryPort, NotificationPort)
│   └── service/           # Thực thi Use Cases (Business Logic)
└── infrastructure/        # Hạ tầng & Adapters (Phụ thuộc Framework)
    ├── adapter/
    │   ├── in/
    │   │   └── web/       # REST Controllers (Mapping OpenAPI -> Use Cases)
    │   └── out/
    │       └── persistence/ # JPA Entities, Spring Data Repositories
    └── config/            # Bean configurations, Security, Exception Handling
```

## 2. Phương pháp luận Frontend: Modular Monorepo & Micro-frontend
Mục tiêu: Phân tách quyền sở hữu và khả năng deploy độc lập.

### Cấu trúc Monorepo: `frontend`
```text
mvp-kb/frontend/
├── package.json           # Root workspace (NPM/Yarn Workspaces)
├── apps/                  # Các ứng dụng chạy được
│   ├── shell/             # Host App (Layout, Auth, Shared Routing)
│   └── ltt-ui/            # Remote App (Module nghiệp vụ Lệnh Thanh Toán)
└── packages/              # Các thư viện dùng chung nội bộ
    ├── ui-shared/         # Design System (shadcn/ui, Tailwind Config)
    └── core-utils/        # Shared Hooks, API Clients, Validators
```

## 3. Quy chuẩn Công nghệ (Tech Stack)
- **Backend:** Java 21, Spring Boot 3.3.4, Maven Multi-module.
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Database:** Oracle 19c (Persistence Adapter).
- **Communication:** RESTful (OpenAPI 3.0 Contract-first).

---
*Tài liệu này là "bộ gen" kiến trúc. SA Agent dựa vào đây để tái tạo project bất cứ khi nào cần thiết.*
