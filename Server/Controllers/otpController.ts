import { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import prisma from "../lib/prisma.js";
import {
  OTP_PURPOSE_LOGIN,
  createOtpChallenge,
  getOtpConfig,
  hashOtpCode,
  resendOtpChallenge,
} from "../lib/otp.js";

const getSessionFromRequest = async (req: Request) =>
  auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

const getLatestChallenge = async (sessionId: string) =>
  prisma.otpChallenge.findFirst({
    where: { sessionId, purpose: OTP_PURPOSE_LOGIN },
    orderBy: { createdAt: "desc" },
  });

const getActiveChallenge = async (sessionId: string) =>
  prisma.otpChallenge.findFirst({
    where: {
      sessionId,
      purpose: OTP_PURPOSE_LOGIN,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

export const getOtpStatus = async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user || !session.session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const latestChallenge = await getLatestChallenge(session.session.id);
    const config = getOtpConfig();
    const now = new Date();

    if (!latestChallenge) {
      return res.json({
        required: true,
        verified: false,
        status: "missing",
      });
    }

    if (latestChallenge.consumedAt) {
      return res.json({
        required: false,
        verified: true,
        status: "verified",
      });
    }

    const expired = latestChallenge.expiresAt < now;
    const resendAvailableAt = latestChallenge.lastSentAt
      ? new Date(
          latestChallenge.lastSentAt.getTime() +
            config.resendCooldownSeconds * 1000
        )
      : null;

    return res.json({
      required: true,
      verified: false,
      status: expired ? "expired" : "pending",
      expiresAt: latestChallenge.expiresAt,
      attemptsRemaining: Math.max(
        0,
        config.maxAttempts - latestChallenge.attempts
      ),
      resendAvailableAt,
      resendCount: latestChallenge.resendCount,
    });
  } catch (error: any) {
    console.error("[getOtpStatus Error]:", error);
    res.status(500).json({ message: error.message });
  }
};

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user || !session.session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const config = getOtpConfig();
    const now = new Date();
    const latestChallenge = await getLatestChallenge(session.session.id);

    if (
      !latestChallenge ||
      latestChallenge.consumedAt ||
      latestChallenge.expiresAt < now
    ) {
      await createOtpChallenge({
        userId: session.user.id,
        email: session.user.email,
        sessionId: session.session.id,
        purpose: OTP_PURPOSE_LOGIN,
      });
      return res.json({ status: "sent" });
    }

    if (latestChallenge.resendCount >= config.maxResends) {
      return res.status(429).json({
        message: "Resend limit reached",
        code: "OTP_RESEND_LIMIT",
      });
    }

    if (
      latestChallenge.lastSentAt &&
      now.getTime() - latestChallenge.lastSentAt.getTime() <
        config.resendCooldownSeconds * 1000
    ) {
      const retryAfterSeconds = Math.ceil(
        (config.resendCooldownSeconds * 1000 -
          (now.getTime() - latestChallenge.lastSentAt.getTime())) /
          1000
      );
      return res.status(429).json({
        message: "Please wait before requesting another code",
        code: "OTP_RESEND_COOLDOWN",
        retryAfterSeconds,
      });
    }

    await resendOtpChallenge({
      challengeId: latestChallenge.id,
      email: session.user.email,
    });

    return res.json({ status: "resent" });
  } catch (error: any) {
    console.error("[requestOtp Error]:", error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user || !session.session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { code } = req.body as { code?: string };
    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "OTP code is required" });
    }

    const challenge = await getActiveChallenge(session.session.id);
    if (!challenge) {
      return res.status(400).json({
        message: "No active OTP challenge",
        code: "OTP_MISSING",
      });
    }

    const config = getOtpConfig();
    const now = new Date();

    if (challenge.expiresAt < now) {
      return res.status(400).json({
        message: "OTP expired",
        code: "OTP_EXPIRED",
      });
    }

    if (challenge.attempts >= config.maxAttempts) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: now },
      });
      return res.status(429).json({
        message: "Maximum attempts reached",
        code: "OTP_MAX_ATTEMPTS",
      });
    }

    const incomingHash = hashOtpCode(code.trim());
    if (incomingHash !== challenge.codeHash) {
      const nextAttempts = challenge.attempts + 1;
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: {
          attempts: nextAttempts,
          ...(nextAttempts >= config.maxAttempts ? { consumedAt: now } : {}),
        },
      });
      return res.status(400).json({
        message: "Invalid OTP code",
        code: "OTP_INVALID",
        attemptsRemaining: Math.max(0, config.maxAttempts - nextAttempts),
      });
    }

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: now },
    });

    if (!session.user.emailVerified) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { emailVerified: true },
      });
    }

    return res.json({ status: "verified" });
  } catch (error: any) {
    console.error("[verifyOtp Error]:", error);
    res.status(500).json({ message: error.message });
  }
};
