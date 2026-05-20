import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface LayoutProps {
  children: React.ReactNode;
  breadcrumb?: BreadcrumbItem[];
  user?: { name: string; role: string };
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export default function Layout({
  children,
  breadcrumb,
  user: userProp,
}: LayoutProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const displayName =
    userProp?.name ?? authUser?.displayName ?? authUser?.userId ?? "User";
  const role = userProp?.role ?? authUser?.roles?.[0] ?? "";

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Topbar */}
      <header
        style={{
          background: "linear-gradient(90deg, #073763 0%, #0b5394 100%)",
          height: "54px",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        {/* Logo box */}
        <div
          style={{
            width: 40,
            height: 40,
            background: "#ffffff",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 11,
            color: "var(--primary-dark)",
            letterSpacing: "0.5px",
            flexShrink: 0,
          }}
        >
          KBC
        </div>

        {/* Brand text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 10,
              letterSpacing: "0.6px",
              lineHeight: 1.3,
            }}
          >
            VDBAS • HỆ THỐNG NGÂN SÁCH
          </span>
          <span
            style={{
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            Kho bạc Nhà nước
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {getInitials(displayName)}
          </div>

          {/* Name + role */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span
              style={{
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              {displayName}
            </span>
            {role && (
              <span
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 10,
                  lineHeight: 1.3,
                }}
              >
                {role}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb strip */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav
          style={{
            background: "#ffffff",
            padding: "8px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
            flexWrap: "wrap",
          }}
          aria-label="breadcrumb"
        >
          {breadcrumb.map((item, idx) => {
            const isLast = idx === breadcrumb.length - 1;
            return (
              <span
                key={idx}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {idx > 0 && (
                  <span style={{ color: "#bbb", fontSize: 13, lineHeight: 1 }}>
                    ›
                  </span>
                )}
                {isLast || !item.href ? (
                  <span
                    style={{
                      color: "#1f2328",
                      fontWeight: isLast ? 600 : 400,
                      fontSize: 12,
                    }}
                  >
                    {item.label}
                  </span>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.href!);
                    }}
                    style={{
                      color: "var(--primary)",
                      fontSize: 12,
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) =>
                      ((e.target as HTMLAnchorElement).style.textDecoration =
                        "underline")
                    }
                    onMouseOut={(e) =>
                      ((e.target as HTMLAnchorElement).style.textDecoration =
                        "none")
                    }
                  >
                    {item.label}
                  </a>
                )}
              </span>
            );
          })}
        </nav>
      )}

      {/* Main content */}
      <main
        style={{
          flex: 1,
          background: "var(--bg)",
          padding: "16px 20px 40px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
