import { Resend } from "resend";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(apiKey);
};

const getResendFrom = () => {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL environment variable is required");
  }
  return fromEmail;
};

export const sendOtpEmail = async ({
  to,
  code,
  expiresInMinutes,
}: {
  to: string;
  code: string;
  expiresInMinutes: number;
}) => {
  const resend = getResendClient();
  const from = getResendFrom();

  await resend.emails.send({
    from,
    to,
    subject: "Your Zivro verification code",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Verify your login</h2>
        <p style="margin: 0 0 12px;">Use the code below to finish signing in:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">
          ${code}
        </div>
        <p style="margin: 0 0 12px;">This code expires in ${expiresInMinutes} minutes.</p>
        <p style="margin: 0;">If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  });
};
