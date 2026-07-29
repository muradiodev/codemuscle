import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: process.env.SMTP_SECURE === "true",
  ...(process.env.SMTP_USER
    ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" } }
    : {})
});

export async function sendVerification(email: string, token: string) {
  const url = `${process.env.WEB_ORIGIN ?? "http://localhost:3000"}/auth/verify-email?token=${encodeURIComponent(token)}`;
  await transport.sendMail({
    from: process.env.MAIL_FROM ?? "CodeMuscle <noreply@codemuscle.local>",
    to: email,
    subject: "Verify your CodeMuscle email",
    text: `Verify your email: ${url}`
  });
}

export async function sendPasswordReset(email: string, token: string) {
  const url = `${process.env.WEB_ORIGIN ?? "http://localhost:3000"}/auth/reset-password?token=${encodeURIComponent(token)}`;
  await transport.sendMail({
    from: process.env.MAIL_FROM ?? "CodeMuscle <noreply@codemuscle.local>",
    to: email,
    subject: "Reset your CodeMuscle password",
    text: `Reset your password: ${url}`
  });
}
