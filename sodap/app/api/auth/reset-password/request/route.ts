import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset for your SoDap account.</p>
        <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    return NextResponse.json({
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
