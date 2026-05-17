import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "@/Config/axios";
import { authClient } from "@/lib/auth-client";

type OtpStatusResponse = {
  required: boolean;
  verified: boolean;
  status: "missing" | "pending" | "expired" | "verified";
  expiresAt?: string;
  attemptsRemaining?: number;
  resendAvailableAt?: string | null;
  resendCount?: number;
};

export default function OtpPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<OtpStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const resendAvailableAt = useMemo(() => {
    if (!status?.resendAvailableAt) return null;
    return new Date(status.resendAvailableAt);
  }, [status?.resendAvailableAt]);

  const canResend =
    !resendAvailableAt || resendAvailableAt.getTime() <= Date.now();

  const getErrorMessage = useCallback((err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
      return err.response?.data?.message || fallback;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return fallback;
  }, []);

  const fetchStatus = useCallback(async () => {
    const { data } = await api.get<OtpStatusResponse>("/api/auth/otp/status");
    setStatus(data);
    if (!data.required && data.verified) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      navigate("/auth/signin");
      return;
    }
    fetchStatus().catch((err) => {
      console.error(err);
      setError(getErrorMessage(err, "Failed to load OTP status"));
    });
  }, [fetchStatus, getErrorMessage, isPending, navigate, session?.user]);

  const handleSend = async () => {
    setError(null);
    setMessage(null);
    setIsSending(true);
    try {
      await api.post("/api/auth/otp/request");
      setMessage("OTP code sent to your email.");
      await fetchStatus();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send OTP code"));
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setMessage(null);
    setIsVerifying(true);
    try {
      await api.post("/api/auth/otp/verify", { code });
      setMessage("OTP verified. Redirecting...");
      await fetchStatus();
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to verify OTP"));
      await fetchStatus().catch(() => undefined);
    } finally {
      setIsVerifying(false);
    }
  };

  const statusLabel = status?.status
    ? status.status === "missing"
      ? "No active code."
      : status.status === "expired"
        ? "Code expired."
        : status.status === "pending"
          ? "Awaiting verification."
          : "Verified."
    : "";

  return (
    <main className="p-6 flex flex-col justify-center items-center min-h-[80vh]">
      <div className="w-full max-w-sm bg-black/10 ring ring-[#22D3EE] rounded-xl p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Verify your email</h1>
          <p className="text-sm text-white/70">
            Enter the code sent to your email.
          </p>
        </div>

        {statusLabel && (
          <div className="text-xs text-white/60">Status: {statusLabel}</div>
        )}

        <input
          className="w-full rounded-md bg-black/30 border border-[#22D3EE]/40 px-3 py-2 text-white focus:outline-none"
          placeholder="Enter OTP code"
          aria-label="Enter OTP verification code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}

        <button
          className="w-full bg-[#22D3EE] text-black font-semibold py-2 rounded-md disabled:opacity-50"
          onClick={handleVerify}
          disabled={isVerifying || code.trim().length === 0}
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </button>

        <button
          className="w-full border border-[#22D3EE] text-white py-2 rounded-md disabled:opacity-50"
          onClick={handleSend}
          disabled={isSending || !canResend}
        >
          {isSending ? "Sending..." : "Resend code"}
        </button>

        {resendAvailableAt && !canResend && (
          <p className="text-xs text-white/60">
            You can request a new code after{" "}
            {resendAvailableAt.toLocaleTimeString()}.
          </p>
        )}
      </div>
    </main>
  );
}
