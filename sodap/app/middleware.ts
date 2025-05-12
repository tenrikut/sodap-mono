import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequestWithAuth } from "next-auth/middleware";

// Define protected routes and their required roles
const protectedRoutes = {
  "/admin": ["platform_admin", "super_root_admin"],
  "/admin/store-owners": ["platform_admin", "super_root_admin"],
  "/admin/store-admins": ["store_owner"],
  "/admin/products": ["store_owner", "store_admin"],
  "/marketplace": [
    "end_user",
    "store_owner",
    "store_admin",
    "platform_admin",
    "super_root_admin",
  ],
};

export async function middleware(request: NextRequestWithAuth) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Check if the route is protected
  const protectedRoute = Object.entries(protectedRoutes).find(([route]) =>
    path.startsWith(route)
  );

  if (protectedRoute) {
    const [route, allowedRoles] = protectedRoute;

    // If user is not authenticated, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if user has the required role
    if (!allowedRoles.includes(token.role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // For store admins, verify they have access to the specific store
    if (token.role === "store_admin") {
      const storeId = path.split("/")[3]; // Assuming store ID is in the URL
      if (storeId) {
        // Verify store admin has access to this store
        const hasAccess = await verifyStoreAdminAccess(token.sub, storeId);
        if (!hasAccess) {
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

async function verifyStoreAdminAccess(userId: string, storeId: string) {
  // Implement store admin access verification
  // This would typically check the database to verify the admin has access to the store
  return true; // Placeholder
}

export const config = {
  matcher: ["/admin/:path*", "/marketplace/:path*", "/api/admin/:path*"],
};
