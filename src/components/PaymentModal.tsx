import { useState, useEffect } from "react";
import { Button, Card } from "@/components/ui";
import { API_BASE_URL } from "@/lib/config";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  amount: number;
  onSuccess: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  bookingId,
  amount,
  onSuccess,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "initiating" | "waiting" | "success" | "failed"
  >("idle");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(120);
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    // Load phone number from booking or user session
    const loadPhoneNumber = async () => {
      try {
        const response = await api.get(`/bookings/${bookingId}`);

        if (response.ok) {
          const data = await response.json();
          // Check both booking.client.phone and booking.client?.phone
          if (data.booking?.client?.phone) {
            setPhoneNumber(data.booking.client.phone);
          } else if (data.booking?.clientPhone) {
            setPhoneNumber(data.booking.clientPhone);
          }
        }
      } catch (error) {
        console.error("Error loading phone:", error);
      }
    };

    if (isOpen && bookingId) {
      loadPhoneNumber();
    }
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const handlePayment = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      toast.error("Please enter your M-Pesa phone number");
      return;
    }
    
    setIsProcessing(true);
    setStatus("initiating");
    setMessage("Starting payment...");

    try {
      const response = await api.post("/payments/initiate", {
        bookingId,
        phoneNumber,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payment failed");
      }

      setStatus("waiting");
      setMessage("Check your phone for M-Pesa prompt...");
      toast.success("Payment request sent! Check your phone for M-Pesa prompt");

      let remaining = 120;
      setCountdown(remaining);

      const interval = setInterval(async () => {
        try {
          remaining -= 3;
          setCountdown(Math.max(remaining, 0));

          const statusRes = await api.get(`/payments/status/${bookingId}`);
          const statusData = await statusRes.json();

          if (!statusRes.ok) {
            throw new Error(statusData.message || "Failed to check status");
          }

          if (statusData.paid || statusData.paymentStatus === "paid") {
            clearInterval(interval);
            setStatus("success");
            setMessage("Payment successful!");
            toast.success("Payment successful");
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1500);
          } else if (remaining <= 0) {
            clearInterval(interval);
            setStatus("failed");
            setMessage("Payment timeout. You can try again.");
            toast.error("Payment timed out. Try again.");
            setIsProcessing(false);
          }
        } catch (err) {
          clearInterval(interval);
          setStatus("failed");
          setMessage(
            err instanceof Error ? err.message : "Payment status check failed",
          );
          toast.error(
            err instanceof Error ? err.message : "Payment status check failed",
          );
          setIsProcessing(false);
        }
      }, 3000);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const retryPayment = async () => {
    // Validate phone number
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      toast.error("Please enter your M-Pesa phone number");
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus("initiating");
      setMessage("Retrying payment...");

      const response = await api.post(`/payments/retry/${bookingId}`, {
        phoneNumber,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Retry failed");
      }

      setStatus("waiting");
      setMessage("Check your phone for M-Pesa prompt...");
      toast.success("Retry sent. Check your phone for M-Pesa prompt");

      let remaining = 120;
      setCountdown(remaining);
      const interval = setInterval(async () => {
        try {
          remaining -= 3;
          setCountdown(Math.max(remaining, 0));
          const statusRes = await api.get(`/payments/status/${bookingId}`);
          const statusData = await statusRes.json();
          if (!statusRes.ok) {
            throw new Error(statusData.message || "Failed to check status");
          }
          if (statusData.paid || statusData.paymentStatus === "paid") {
            clearInterval(interval);
            setStatus("success");
            setMessage("Payment successful!");
            toast.success("Payment successful");
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1500);
          } else if (remaining <= 0) {
            clearInterval(interval);
            setStatus("failed");
            setMessage("Payment timeout. You can try again.");
            toast.error("Payment timed out. Try again.");
            setIsProcessing(false);
          }
        } catch (err2) {
          clearInterval(interval);
          setStatus("failed");
          setMessage(
            err2 instanceof Error ? err2.message : "Payment status check failed",
          );
          toast.error(
            err2 instanceof Error ? err2.message : "Payment status check failed",
          );
          setIsProcessing(false);
        }
      }, 3000);
    } catch (err) {
      setIsProcessing(false);
      setStatus("failed");
      toast.error(err instanceof Error ? err.message : "Retry failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Complete Payment
          </h2>
          <p className="text-sm text-gray-600">Pay via M-Pesa</p>
        </div>

        {/* Amount Display */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 text-center mb-1">
            Amount to Pay
          </p>
          <p className="text-3xl font-bold text-green-600 text-center">
            {formatCurrency(amount)}
          </p>
        </div>

        {/* Phone Number Display */}
        <div className="mb-6">
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Registered M-Pesa Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="0712345678"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            You'll receive an M-Pesa prompt on your registered number
          </p>
          {status === "waiting" && (
            <p className="text-xs text-blue-600 mt-1">
              Waiting for confirmation... {countdown}s
            </p>
          )}
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Payment Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Check your phone for M-Pesa prompt</li>
                <li>Enter your M-Pesa PIN</li>
                <li>Confirm the payment</li>
              </ul>
              {message && (
                <p className="text-xs text-blue-700 mt-2">{message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {status === "waiting" || status === "initiating" ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Pay Now"
            )}
          </Button>
          {status === "failed" && (
            <Button
              variant="outline"
              onClick={retryPayment}
              className="flex-1"
              disabled={isProcessing}
            >
              Retry
            </Button>
          )}
        </div>

        {/* Security Note */}
        <p className="text-xs text-center text-gray-500 mt-4">
          🔒 Secure payment powered by IntaSend
        </p>
      </Card>
    </div>
  );
}
