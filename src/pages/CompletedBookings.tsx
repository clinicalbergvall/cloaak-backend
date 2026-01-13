import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/config";
import { api } from "@/lib/api";
import { useNotifications } from "../contexts/NotificationContext";
import { RatingInterface } from "@/components/RatingInterface";
import { PaymentModal } from "@/components/PaymentModal";
import { PaymentReceipt } from "@/components/PaymentReceipt";
import type { BookingHistoryItem } from "@/lib/types";

interface CompletedBooking extends BookingHistoryItem {
  completedAt?: string;
  paymentDeadline?: string;
  paid?: boolean;
  paidAt?: string;
  transactionId?: string;
  cleaner?: {
    _id: string;
    name: string;
    phone: string;
  };
}

export default function CompletedBookings() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [bookings, setBookings] = useState<CompletedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] =
    useState<CompletedBooking | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  const fetchCompletedBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/bookings");

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();

      
      const completed =
        data.bookings?.filter(
          (b: CompletedBooking) => b.status === "completed",
        ) || [];

      setBookings(completed);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load completed bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async (
    bookingId: string,
    rating: number,
    review: string,
  ) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/rating`, { rating, review });

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      toast.success("Rating submitted successfully!");
      setRatingBookingId(null);

      
      setBookings((prev: any) =>
        prev.map((b: any) => (b.id === bookingId ? { ...b, rating, review } : b))
      );
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
      throw error;
    }
  };

  const handlePayNow = (booking: CompletedBooking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowReceipt(true);
    toast.success("Payment successful!");

    
    if (selectedBooking) {
      addNotification({
        type: "payment_success",
        title: "Payment Successful! 💳",
        message: `Your payment of KSh ${selectedBooking.price.toLocaleString()} has been processed successfully.`,
        bookingId: selectedBooking.id,
      });
    }

    fetchCompletedBookings(); 
  };

  const calculateTimeRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - now;

    if (diff <= 0) return "Overdue";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading completed bookings...
          </p>
        </div>
      </div>
    );
  }

  const unpaidBookings = bookings.filter((b: any) => !b.paid);
  const paidBookings = bookings.filter((b: any) => b.paid);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Completed Services
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and pay for your completed services
          </p>
        </div>

        {}
        {unpaidBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              ⚠️ Pending Payment ({unpaidBookings.length})
            </h2>
            <div className="space-y-4">
              {unpaidBookings.map((booking: any) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onRate={() => setRatingBookingId(booking.id!)}
                  onPay={() => handlePayNow(booking)}
                  isRating={ratingBookingId === booking.id}
                  onSubmitRating={handleSubmitRating}
                  timeRemaining={calculateTimeRemaining(
                    booking.paymentDeadline,
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {}
        {paidBookings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Paid Services ({paidBookings.length})
            </h2>
            <div className="space-y-4">
              {paidBookings.map((booking: any) => (
                <BookingCard key={booking.id} booking={booking} isPaid />
              ))}
            </div>
          </div>
        )}

        {}
        {bookings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Completed Services Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your completed services will appear here
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Book a Service
            </button>
          </div>
        )}
      </div>

      {}
      {showPaymentModal && selectedBooking && (
        <PaymentModal
          isOpen={true}
          onClose={() => setShowPaymentModal(false)}
          bookingId={selectedBooking.id!}
          amount={selectedBooking.price}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {}
      {showReceipt && selectedBooking && (
        <PaymentReceipt
          booking={selectedBooking}
          onClose={() => {
            setShowReceipt(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
}


interface BookingCardProps {
  booking: CompletedBooking;
  onRate?: () => void;
  onPay?: () => void;
  isPaid?: boolean;
  isRating?: boolean;
  onSubmitRating?: (
    bookingId: string,
    rating: number,
    review: string,
  ) => Promise<void>;
  timeRemaining?: string | null;
}

function BookingCard({
  booking,
  onRate,
  onPay,
  isPaid,
  isRating,
  onSubmitRating,
  timeRemaining,
}: BookingCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasRating = booking.rating && booking.rating > 0;
  const canPay = hasRating && !isPaid;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      {}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {booking.serviceCategory?.replace("-", " ")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Completed {formatDate(booking.completedAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
            KSh {booking.price.toLocaleString()}
          </p>
          {isPaid && (
            <span className="inline-block mt-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold rounded-full">
              ✓ Paid
            </span>
          )}
        </div>
      </div>

      {}
      <div className="space-y-2 mb-4">
        {booking.location?.address && (
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            📍 <span>{booking.location.address}</span>
          </div>
        )}
        {booking.scheduledDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            📅{" "}
            <span>
              {booking.scheduledDate}{" "}
              {booking.scheduledTime && `at ${booking.scheduledTime}`}
            </span>
          </div>
        )}
      </div>

      {}
      {!isPaid && timeRemaining && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            timeRemaining === "Overdue"
              ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
              : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"
          }`}
        >
          ⏰{" "}
          <span className="text-sm font-medium">
            {timeRemaining === "Overdue"
              ? "Payment overdue!"
              : `Payment due: ${timeRemaining}`}
          </span>
        </div>
      )}

      {}
      {hasRating ? (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            ⭐{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              Your Rating: {booking.rating}/5
            </span>
          </div>
          {booking.review && (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              "{booking.review}"
            </p>
          )}
        </div>
      ) : isRating && onSubmitRating ? (
        <div className="mb-4">
          <RatingInterface
            onSubmit={(rating, review) =>
              onSubmitRating(booking.id!, rating, review)
            }
          />
        </div>
      ) : null}

      {}
      {!isPaid && (
        <div className="flex gap-3">
          {canPay && (
            <button
              onClick={onPay}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold
                       py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg
                       flex items-center justify-center gap-2"
            >
              💳 Pay Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
