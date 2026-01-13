import { useState, useEffect } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { PaymentModal } from "@/components/PaymentModal";
import RatingModal from "@/components/RatingModal";
import { API_BASE_URL } from "@/lib/config";
import { loadUserSession } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { logger } from "@/lib/logger";
import { api } from "@/lib/api";

interface CompletedBooking {
  _id: string;
  serviceCategory: string;
  vehicleType?: string;
  carServicePackage?: string;
  cleaningCategory?: string;
  price: number;
  totalPrice?: number;
  cleanerPayout?: number;
  platformFee?: number;
  status: string;
  completedAt: string;
  paymentDeadline?: string;
  rating?: number;
  review?: string;
  paid: boolean;
  paidAt?: string;
  cleaner?: {
    _id: string;
    name: string;
    phone: string;
  };
  client?: {
    _id: string;
    name: string;
    phone: string;
  };
  beforePhotos?: string[];
  afterPhotos?: string[];
  completionNotes?: string;
  location?: {
    address?: string;
    manualAddress?: string;
  };
}

export default function ClientCompletedBookings() {
  const [bookings, setBookings] = useState<CompletedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] =
    useState<CompletedBooking | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<CompletedBooking | null>(
    null,
  );

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  const fetchCompletedBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/bookings");

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();

      
      const completedBookings =
        data.bookings?.filter(
          (booking: CompletedBooking) => booking.status === "completed",
        ) || [];

      setBookings(completedBookings);
    } catch (error) {
      logger.error("Fetch completed bookings error:", error instanceof Error ? error : undefined);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleRateService = (booking: CompletedBooking) => {
    setSelectedBooking(booking);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (rating: number, review: string) => {
    if (!selectedBooking) return;

    try {
      const response = await api.post(
        `/bookings/${selectedBooking._id}/rating`,
        { rating, review }
      );

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      toast.success("Rating submitted successfully! ⭐");

      
      await fetchCompletedBookings();

      setShowRatingModal(false);
      setSelectedBooking(null);
    } catch (error) {
      logger.error("Submit rating error:", error instanceof Error ? error : undefined);
      toast.error("Failed to submit rating");
      throw error;
    }
  };

  const handlePayNow = async (booking: CompletedBooking) => {
    
    if (!booking.rating) {
      toast.error("Please rate the service before making payment");
      handleRateService(booking);
      return;
    }

    
    if (booking.paid) {
      toast.error("This booking has already been paid");
      return;
    }

    setPaymentBooking(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    toast.success("Payment successful! 🎉");
    setShowPaymentModal(false);
    setPaymentBooking(null);

    
    await fetchCompletedBookings();
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setPaymentBooking(null);
  };

  const getTimeRemaining = (deadline?: string) => {
    if (!deadline) return null;

    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const remaining = deadlineTime - now;

    if (remaining <= 0) {
      return { text: "Overdue", isOverdue: true };
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return { text: `${hours}h ${minutes}m remaining`, isOverdue: false };
    }

    return { text: `${minutes}m remaining`, isOverdue: false };
  };

  const getServiceTitle = (booking: CompletedBooking) => {
    if (booking.serviceCategory === "car-detailing") {
      return `${booking.carServicePackage || "Car Detailing"} - ${booking.vehicleType || "Vehicle"}`;
    }
    return `${booking.cleaningCategory || "Car Detailing"}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                Loading your bookings...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  const session = loadUserSession();
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="p-12 text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Login Required
              </h3>
              <p className="text-gray-600 mb-6">
                Please login to view your completed bookings and payments
              </p>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={() => (window.location.href = "/test-login")}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  Login / Register
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  className="w-full"
                >
                  Go to Home
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const unpaidBookings = bookings.filter((b: any) => !b.paid);
  const paidBookings = bookings.filter((b: any) => b.paid);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Completed Services
            </h1>
            <p className="text-gray-600">
              Rate your experience and make payment
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Button>
        </div>

        {}
        {unpaidBookings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Awaiting Payment
              </h2>
              <Badge variant="warning" className="animate-pulse">
                {unpaidBookings.length}
              </Badge>
            </div>

            {unpaidBookings.map((booking: any) => {
              const timeRemaining = getTimeRemaining(booking.paymentDeadline);

              return (
                <Card
                  key={booking._id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getServiceTitle(booking)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Cleaner: {booking.cleaner?.name || "N/A"}
                          </p>
                        </div>
                        {timeRemaining && (
                          <Badge
                            variant={
                              timeRemaining.isOverdue ? "error" : "warning"
                            }
                            className={
                              timeRemaining.isOverdue ? "animate-pulse" : ""
                            }
                          >
                            {timeRemaining.text}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(booking.completedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {formatCurrency(booking.price)}
                          </p>
                        </div>
                      </div>

                      {booking.rating && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= booking.rating!
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                  }`}
                                fill={
                                  star <= booking.rating!
                                    ? "currentColor"
                                    : "none"
                                }
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                              </svg>
                            ))}
                          </div>
                          <Badge variant="success">Rated</Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <Button
                        variant="primary"
                        onClick={() => handlePayNow(booking)}
                        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700"
                      >
                        💳 Pay Now
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {}
        {paidBookings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment History
              </h2>
              <Badge variant="success">{paidBookings.length}</Badge>
            </div>

            {paidBookings.map((booking: any) => (
              <Card key={booking._id} className="p-6 opacity-75">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getServiceTitle(booking)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Cleaner: {booking.cleaner?.name || "N/A"}
                        </p>
                      </div>
                      <Badge variant="success">✓ Paid</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Paid On</p>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.paidAt
                            ? new Date(booking.paidAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(booking.price)}
                        </p>
                      </div>
                    </div>

                    {booking.rating && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= booking.rating!
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                                }`}
                              fill={
                                star <= booking.rating!
                                  ? "currentColor"
                                  : "none"
                              }
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          ))}
                        </div>
                        {booking.review && (
                          <p className="text-sm text-gray-600 ml-2 line-clamp-1">
                            "{booking.review}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {}
        {bookings.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Completed Bookings
            </h3>
            <p className="text-gray-600 mb-6">
              Your completed services will appear here
            </p>
            <Button
              variant="primary"
              onClick={() => (window.location.href = "/")}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700"
            >
              Book a Service
            </Button>
          </Card>
        )}
      </div>

      {}
      {selectedBooking && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedBooking(null);
          }}
          onSubmit={handleSubmitRating}
          bookingId={selectedBooking._id}
          cleanerName={selectedBooking.cleaner?.name}
          serviceType={getServiceTitle(selectedBooking)}
        />
      )}

      {}
      {paymentBooking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          bookingId={paymentBooking._id}
          amount={paymentBooking.price}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
