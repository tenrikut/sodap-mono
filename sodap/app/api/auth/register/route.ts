import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    // Validate input
    if (!email || !password || !username) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email or username already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = uuidv4();

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        verificationToken,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        role: "USER",
      },
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    // Return success response without sensitive data
    return NextResponse.json(
      {
        message:
          "User registered successfully. Please check your email to verify your account.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
