import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getEmailConfig() {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER)?.trim();
  const pass = (process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD)?.replace(/\s+/g, "");
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;

  if (!user || !pass) {
    return null;
  }

  return { host, pass, port, secure, user };
}

function getTransporter() {
  const config = getEmailConfig();

  if (!config) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function verifyEmailTransport() {
  const transporter = getTransporter();

  if (!transporter) {
    throw new Error("Email delivery is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.");
  }

  await transporter.verify();
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const transporter = getTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || "JokaFlix";
  const fromEmail = (process.env.AUTH_EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER)?.trim();

  if (!transporter || !fromEmail) {
    throw new Error("Email delivery is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.");
  }

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
  });

  console.info("[JokaFlix email] sent " + JSON.stringify({
    accepted: info.accepted,
    rejected: info.rejected,
    messageId: info.messageId,
    response: info.response,
  }));

  return info;
}
