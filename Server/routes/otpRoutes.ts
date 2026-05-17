import express from "express";
import {
  getOtpStatus,
  requestOtp,
  verifyOtp,
} from "../Controllers/otpController.js";

const otpRouter = express.Router();

otpRouter.get("/status", getOtpStatus);
otpRouter.post("/request", requestOtp);
otpRouter.post("/verify", verifyOtp);

export default otpRouter;
