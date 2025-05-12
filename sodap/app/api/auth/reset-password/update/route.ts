import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const updatePasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = updatePasswordSchema.parse(body);

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(password, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password reset update error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
