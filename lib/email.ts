import nodemailer from "nodemailer";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;

};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getTransporter() {
  const host = requireEnv("SMTP_HOST");
  const port = Number(requireEnv("SMTP_PORT"));
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(args: SendEmailArgs) {
  const from = requireEnv("FROM_EMAIL");
  const transporter = getTransporter();

  return transporter.sendMail({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
  });
}
