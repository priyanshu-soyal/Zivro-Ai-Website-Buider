import crypto from "crypto";
import prisma from "./prisma.js";
import { sendOtpEmail } from "./resend.js";

export const OTP_PURPOSE_LOGIN = "login";

export type OtpConfig = {
  codeLength: number;
  expiresMinutes: number;
  maxAttempts: number;
  resendCooldownSeconds: number;
  maxResends: number;
};

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

export const getOtpConfig = (): OtpConfig => ({
  codeLength: parseNumber(process.env.OTP_CODE_LENGTH, 6),
  expiresMinutes: parseNumber(process.env.OTP_EXPIRES_MINUTES, 10),
  maxAttempts: parseNumber(process.env.OTP_MAX_ATTEMPTS, 5),
  resendCooldownSeconds: parseNumber(
    process.env.OTP_RESEND_COOLDOWN_SECONDS,
    60
  ),
  maxResends: parseNumber(process.env.OTP_MAX_RESENDS, 5),
});

const generateOtpCode = (length: number) => {
  if (length <= 1) {
    return crypto.randomInt(0, 10).toString();
  }
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return crypto.randomInt(min, max).toString();
};

export const hashOtpCode = (code: string) =>
  crypto.createHash("sha256").update(code).digest("hex");

export const createOtpChallenge = async ({
  userId,
  email,
  sessionId,
  purpose,
}: {
  userId: string;
  email: string;
  sessionId: string;
  purpose: string;
}) => {
  const config = getOtpConfig();
  const code = generateOtpCode(config.codeLength);
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(
    Date.now() + config.expiresMinutes * 60 * 1000
  );
  const now = new Date();

  await prisma.otpChallenge.updateMany({
    where: {
      sessionId,
      purpose,
      consumedAt: null,
    },
    data: {
      consumedAt: now,
    },
  });

  const challenge = await prisma.otpChallenge.create({
    data: {
      userId,
      email,
      purpose,
      codeHash,
      expiresAt,
      sessionId,
      lastSentAt: now,
    },
  });

  await sendOtpEmail({
    to: email,
    code,
    expiresInMinutes: config.expiresMinutes,
  });

  return challenge;
};

export const resendOtpChallenge = async ({
  challengeId,
  email,
}: {
  challengeId: string;
  email: string;
}) => {
  const config = getOtpConfig();
  const code = generateOtpCode(config.codeLength);
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(
    Date.now() + config.expiresMinutes * 60 * 1000
  );
  const now = new Date();

  const challenge = await prisma.otpChallenge.update({
    where: { id: challengeId },
    data: {
      codeHash,
      expiresAt,
      lastSentAt: now,
      attempts: 0,
      resendCount: { increment: 1 },
      consumedAt: null,
    },
  });

  await sendOtpEmail({
    to: email,
    code,
    expiresInMinutes: config.expiresMinutes,
  });

  return challenge;
};
