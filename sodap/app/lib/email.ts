import nodemailer from "nodemailer";

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your SoDap account",
    html: `
      <h1>Welcome to SoDap!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your SoDap password",
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
