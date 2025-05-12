"use client";

import { usePathname } from "next/navigation";

export default function GlobalFooter() {
  const pathname = usePathname();

  // Don't show footer on login page
  if (pathname === "/") {
    return null;
  }

  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#f3f4f6",
        padding: "0.75rem 0",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderTop: "1px solid #e5e7eb",
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#4b5563",
            marginBottom: "0.25rem",
            textAlign: "center",
            width: "100%",
            display: "block",
            fontSize: "0.875rem",
          }}
        >
          Sodap is a scan to go decentralized in-Store shopping application
        </p>
        <p
          style={{
            color: "#6b7280",
            fontSize: "0.75rem",
            textAlign: "center",
            width: "100%",
            display: "block",
          }}
        >
          Copyright 2025 SoDap Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
