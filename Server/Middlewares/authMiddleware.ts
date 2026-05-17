import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { success } from "better-auth";
import prisma from "../lib/prisma.js";
import { OTP_PURPOSE_LOGIN } from "../lib/otp.js";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({
        message: "Unathorized User",
      });
    }

    if (session.session) {
      const latestChallenge = await prisma.otpChallenge.findFirst({
        where: {
          sessionId: session.session.id,
          purpose: OTP_PURPOSE_LOGIN,
          consumedAt: null,
        },
        orderBy: { createdAt: "desc" },
      });

      if (latestChallenge) {
        if (latestChallenge.expiresAt < new Date()) {
          return res.status(403).json({
            message: "OTP expired",
            code: "OTP_EXPIRED",
            otpRequired: true,
          });
        }
        return res.status(403).json({
          message: "OTP verification required",
          code: "OTP_REQUIRED",
          otpRequired: true,
        });
      }
    }

    req.userId = session.user.id;
    next();
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: error.code || error.message,
    });
  }
};
