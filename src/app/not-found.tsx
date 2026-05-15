import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A1628",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "640px", textAlign: "center" }}>
        <div style={{ color: "#C9A84C", fontSize: "13px", fontWeight: "800", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Suitance
        </div>
        <h1 style={{ marginTop: "14px", color: "#C9A84C", fontSize: "40px", fontWeight: "900", letterSpacing: "-0.02em" }}>
          Page not found
        </h1>
        <p style={{ marginTop: "14px", color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: 1.7 }}>
          The page you’re looking for doesn’t exist or has moved.
        </p>
        <div style={{ marginTop: "28px", display: "flex", justifyContent: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 18px",
              borderRadius: "10px",
              backgroundColor: "#C9A84C",
              color: "#0A1628",
              fontWeight: "800",
              fontSize: "14px",
              letterSpacing: "0.02em",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
