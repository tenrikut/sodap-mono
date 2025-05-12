import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role, action } = await req.json();

    // Get the approver's role
    const approver = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        storeOwner: true,
      },
    });

    if (!approver) {
      return NextResponse.json(
        { error: "Approver not found" },
        { status: 404 }
      );
    }

    // Get the user to be approved
    const userToApprove = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        storeOwner: true,
        storeAdmin: true,
      },
    });

    if (!userToApprove) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle different approval scenarios
    if (role === "store_owner") {
      // Only platform admins can approve store owners
      if (approver.role !== "platform_admin") {
        return NextResponse.json(
          { error: "Only platform admins can approve store owners" },
          { status: 403 }
        );
      }

      await prisma.storeOwner.update({
        where: { userId },
        data: { status: action === "approve" ? "approved" : "rejected" },
      });
    } else if (role === "store_admin") {
      // Only store owners can approve their store admins
      if (approver.role !== "store_owner") {
        return NextResponse.json(
          { error: "Only store owners can approve store admins" },
          { status: 403 }
        );
      }

      // Verify the store admin belongs to one of the approver's stores
      const storeAdmin = await prisma.storeAdmin.findFirst({
        where: {
          userId,
          store: {
            ownerId: approver.storeOwner?.id,
          },
        },
      });

      if (!storeAdmin) {
        return NextResponse.json(
          { error: "Store admin not found in your stores" },
          { status: 404 }
        );
      }

      await prisma.storeAdmin.update({
        where: { id: storeAdmin.id },
        data: { status: action === "approve" ? "approved" : "rejected" },
      });
    }

    return NextResponse.json({
      message: `User ${action}d successfully`,
    });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
