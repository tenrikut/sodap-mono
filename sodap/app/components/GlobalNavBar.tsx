"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function GlobalNavBar() {
  const pathname = usePathname();

  //Don't show navbar on login page
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="bg-purple-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/marketplace" className="flex items-center">
          <div
            style={{
              backgroundColor: "#a78bfa", // Phantom purple color
              borderRadius: "40px", // Oval shape
              padding: "2px 15px",
              display: "inline-block",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontSize: "50px",
                fontWeight: "600",
                color: "white",
                lineHeight: "1.1",
              }}
            >
              SoDap
            </span>
          </div>
        </Link>

        <div className="flex space-x-6">
          <Link
            href="/marketplace"
            className="hover:text-purple-200 transition-colors"
          >
            Marketplace
          </Link>
        </div>
        <div className="flex space-x-6">
          {/* Only show dashboard links if NOT on /marketplace */}
          {pathname !== "/marketplace" && (
            <>
              <Link
                href="/store-admin/dashboard"
                className="hover:text-purple-200 transition-colors"
              >
                Store Admin
              </Link>
              <Link
                href="/platform-admin/dashboard"
                className="hover:text-purple-200 transition-colors"
              >
                Platform Admin
              </Link>
            </>
          )}
          <div className="flex space-x-6">
            <Link
              href="/marketplace"
              className="hover:text-purple-200 transition-colors"
            ></Link>
            {/* Only show dashboard links if NOT on /marketplace */}
            {pathname !== "/marketplace" && (
              <>
                <Link
                  href="/store-admin/dashboard"
                  className="hover:text-purple-200 transition-colors"
                >
                  Store Admin
                </Link>
                <Link
                  href="/platform-admin/dashboard"
                  className="hover:text-purple-200 transition-colors"
                >
                  Platform Admin
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
