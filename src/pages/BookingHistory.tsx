import { useState, useEffect } from "react";
import { Card, Badge, Button, ChatComponent } from "@/components/ui";
import { PaymentModal } from "@/components/PaymentModal";
import toast from "react-hot-toast";
import { loadUserSession } from "@/lib/storage";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getVehicleCategory,
  getCarServicePackage,
  CLEANING_CATEGORIES,
  ROOM_SIZES,
} from "@/lib/validation";
import type { BookingHistoryItem, BookingStatus } from "@/lib/types";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";


interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  bookingId: string;
  serviceName: string;
}

function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  bookingId,
  serviceName,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, review);
      onClose();
    } catch (error) {
      logger.error("Failed to submit rating:", error instanceof Error ? error : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReview("");
    setHoveredStar(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Rate Your Service
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Service: {serviceName}</p>
            <p className="text-xs text-gray-500">Booking ID: {bookingId}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate this service?
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-10 h-10 ${star <= (hoveredStar || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                      }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="review"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Share your experience (optional)
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none"
              placeholder="Tell us about your experience with this service..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BookingHistory() {
  const [history, setHistory] = useState<BookingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] =
    useState<BookingHistoryItem | null>(null);
  const [selectedChatBooking, setSelectedChatBooking] =
    useState<BookingHistoryItem | null>(null);
  const [userSession, setUserSession] = useState(loadUserSession());
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] =
    useState<BookingHistoryItem | null>(null);
  const [selectedBookingForPayment, setSelectedBookingForPayment] =
    useState<BookingHistoryItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const fetchBookings = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await api.get("/bookings");
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.bookings)) {
          const mappedBookings: BookingHistoryItem[] = data.bookings.map((b: any) => ({
            ...b,
            id: b._id,
          }));
          setHistory(mappedBookings);
        }
      } else {
        logger.error("Failed to fetch bookings from API");
      }
    } catch (error) {
      logger.error("Error fetching bookings:", error instanceof Error ? error : undefined);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    
    const interval = setInterval(() => {
      fetchBookings(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const filteredHistory =
    (filter === "all"
      ? history
      : history.filter((item: any) => {
        if (filter === 'confirmed') {
          return item.status === 'confirmed' || item.status === 'in-progress';
        }
        return item.status === filter;
      })
    )
      .filter((item: any) => item.status !== ("cancelled" as unknown as BookingStatus))
      .filter((item: any) => (item.serviceCategory as string) !== "home-cleaning"); 



  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, "default" | "success" | "warning" | "error"> = {
      pending: "warning",
      confirmed: "default",
      "in-progress": "warning",
      completed: "success",
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const handleRateBooking = (booking: BookingHistoryItem) => {
    setSelectedBookingForRating(booking);
    setRatingModalOpen(true);
  };

  const handleRatingSubmit = async (rating: number, review: string) => {
    if (!selectedBookingForRating) return;

    
    if (!rating || rating < 1 || rating > 5) {
      alert("Please select a valid rating between 1 and 5 stars");
      return;
    }

    
    if (review && review.length > 1000) {
      alert("Review must be less than 1000 characters");
      return;
    }

    try {
      
      setHistory((prev: any) =>
        prev.map((item: any) =>
          item.id === selectedBookingForRating.id
            ? { ...item, rating, review }
            : item,
        ),
      );

      
      const response = await api.post(
        `/bookings/${selectedBookingForRating.id}/rating`,
        { rating, review },
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error("Failed to submit rating to backend:", error);

        
        if (error.message === "Booking has already been rated") {
          alert("You have already rated this booking");
        } else if (error.message === "Can only rate completed bookings") {
          alert("You can only rate completed bookings");
        } else {
          alert("Failed to submit rating. Please try again.");
        }

        
        setHistory((prev: any) =>
          prev.map((item: any) =>
            item.id === selectedBookingForRating.id
              ? { ...item, rating: undefined, review: undefined }
              : item,
          ),
        );
      } else {
        
        
      }
    } catch (error) {
      logger.error("Error submitting rating:", error instanceof Error ? error : undefined);
      alert(
        "Network error. Please check your connection.",
      );
      
      setHistory((prev: any) =>
        prev.map((item: any) =>
          item.id === selectedBookingForRating.id
            ? { ...item, rating: undefined, review: undefined }
            : item,
        ),
      );
    }
  };

  const handleMarkComplete = async (booking: BookingHistoryItem) => {
    if (
      !window.confirm(
        "Mark this job as completed? The client will be notified to pay within 2 hours.",
      )
    ) {
      return;
    }

    setIsMarkingComplete(true);
    try {
      const response = await api.post(`/bookings/${booking.id}/complete`, {
        notes: "Job completed successfully",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to mark as complete");
      }

      
      toast.success("✅ Job marked as completed! Client has 2 hours to pay.");

      
      setHistory((prev: any) =>
        prev.map((item: any) =>
          item.id === booking.id
            ? { ...item, status: "completed" as BookingStatus }
            : item,
        ),
      );
    } catch (error) {
      logger.error("Error marking complete:", error instanceof Error ? error : undefined);
      toast.error(
        error instanceof Error ? error.message : "Failed to mark as complete",
      );
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handlePayNow = async (booking: BookingHistoryItem) => {
    
    if (!booking.rating) {
      toast.error("⭐ Please rate the service before paying");
      handleRateBooking(booking);
      return;
    }

    
    setSelectedBookingForPayment(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    
    fetchBookings();
    toast.success("Payment completed successfully!");
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setSelectedBookingForPayment(null);
    toast.error("Payment cancelled");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 sm:px-4 overflow-x-hidden">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="max-w-4xl mx-auto w-full">
        {}
        <div className="mb-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 w-full">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => window.history.back()}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
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
                </button>
                <h1 className="text-3xl font-bold text-gray-900 truncate">My Bookings</h1>
              </div>
              <p className="text-gray-600 mt-1 truncate">
                Track and manage your service history
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBookings(true)}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <svg
                className={isLoading ? "animate-spin w-4 h-4" : "w-4 h-4"}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            </Button>
          </div>

          {}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b hide-scrollbar w-full">
            {['all', 'pending', 'confirmed', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as 'all' | BookingStatus)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 flex-shrink-0 ${filter === status
                  ? 'border-yellow-400 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                {status.charAt(0).toUpperCase() +
                  status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              No bookings found
            </h3>
            <p className="text-sm text-gray-600">
              Your booking history will appear here
            </p>
          </div>
        ) : (
          <div className="grid gap-4 w-full">
            {filteredHistory.map((booking: any) => {
              const isCarService = booking.serviceCategory === "car-detailing";
              const vType = isCarService ? booking.vehicleType : undefined;
              const vehicleOrProperty = vType ? getVehicleCategory(vType) : undefined;
              const sPkg = isCarService ? booking.carServicePackage : undefined;
              const servicePackageName = sPkg
                ? getCarServicePackage(sPkg)?.name
                : CLEANING_CATEGORIES.find((c) => c.id === booking.cleaningCategory)?.name || "Home Cleaning";

              const typeName = (() => {
                if (isCarService) {
                  return vehicleOrProperty?.name;
                }
                if (!booking.cleaningCategory) return undefined;
                if (booking.cleaningCategory === "HOUSE_CLEANING") {
                  if (booking.houseCleaningType === "BATHROOM") return "Bathroom Cleaning";
                  if (booking.houseCleaningType === "WINDOW") return "Window Cleaning";
                  if (booking.houseCleaningType === "ROOM" && booking.roomSize) {
                    const size = ROOM_SIZES.find((r) => r.id === booking.roomSize);
                    return size?.name || "Room";
                  }
                }
                if (booking.cleaningCategory === "FUMIGATION" && booking.roomSize) {
                  const size = ROOM_SIZES.find((r) => r.id === booking.roomSize);
                  return `${booking.fumigationType === "BED_BUG" ? "Bed Bug" : "General"} · ${size?.name || ""}`.trim();
                }
                if (booking.cleaningCategory === "MOVE_IN_OUT" && booking.roomSize) {
                  const size = ROOM_SIZES.find((r) => r.id === booking.roomSize);
                  return `Move In/Out · ${size?.name || ""}`.trim();
                }
                if (booking.cleaningCategory === "POST_CONSTRUCTION" && booking.roomSize) {
                  const size = ROOM_SIZES.find((r) => r.id === booking.roomSize);
                  return `Post Construction · ${size?.name || ""}`.trim();
                }
                return undefined;
              })();

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer w-full overflow-hidden"
                  onClick={() => setSelectedBooking(booking)}
                >
                  {}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3 w-full min-w-0 overflow-hidden">
                    <div className="flex items-start gap-3 min-w-0 overflow-hidden">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                        {vehicleOrProperty?.icon}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="font-semibold text-gray-900 text-base truncate">
                          {servicePackageName}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {typeName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          Booked: {formatDate(new Date(booking.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center min-w-[80px] flex-shrink-0">
                      {getStatusBadge(booking.status)}
                      <p className="text-base font-bold text-gray-900 mt-1 truncate">
                        {formatCurrency(booking.price)}
                      </p>
                    </div>
                  </div>

                  {}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600 pt-3 border-t w-full overflow-hidden">
                    {booking.scheduledDate && (
                      <div className="flex items-center gap-1 min-w-0">
                        <svg
                          className="w-3 h-3 flex-shrink-0 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 003 2z"
                          />
                        </svg>
                        <span className="truncate">{booking.scheduledDate}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 min-w-0">
                      <svg
                        className="w-3 h-3 flex-shrink-0 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <span className="truncate uppercase">{booking.paymentMethod}</span>
                    </div>

                    {booking.location && (
                      <div className="flex items-center gap-1 min-w-0">
                        <svg
                          className="w-3 h-3 flex-shrink-0 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="truncate">
                          {booking.location.manualAddress ||
                            booking.location.address ||
                            "Location provided"}
                        </span>
                      </div>
                    )}
                  </div>

                  {}
                  <div className="mt-3 pt-3 border-t space-y-2 w-full overflow-hidden">
                    {}
                    {(booking.status === "confirmed" ||
                      booking.status === "in-progress") && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            setSelectedChatBooking(booking);
                          }}
                          className="w-full flex items-center justify-center gap-1 text-sm"
                        >
                          <span>💬</span>
                          <span className="truncate">Chat</span>
                        </Button>
                      )}

                    {}
                    {booking.status === "completed" && !booking.paid && (
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          setSelectedBookingForPayment(booking);
                          setShowPaymentModal(true);
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-1 text-sm"
                      >
                        <span>💰</span>
                        <span className="truncate">Pay ({formatCurrency(booking.price)})</span>
                      </Button>
                    )}

                    {}
                    {booking.rating ? (
                      <div className="flex items-center gap-1 justify-center py-1">
                        <span className="text-xs text-gray-600 mr-1">Rating:</span>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${booking.rating && i < booking.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    ) : (
                      booking.status === "completed" && booking.paid && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            setSelectedBookingForRating(booking);
                            setRatingModalOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1 text-sm"
                        >
                          <span>⭐</span>
                          <span className="truncate">Rate</span>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {}
        {selectedBooking && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedBooking(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Booking Details
                </h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="font-semibold text-gray-900">
                    {(() => {
                      const isCarService = selectedBooking.serviceCategory === "car-detailing";
                      const servicePackage = selectedBooking.carServicePackage ? getCarServicePackage(selectedBooking.carServicePackage) : undefined;
                      const vehicleCategory = selectedBooking.vehicleType ? getVehicleCategory(selectedBooking.vehicleType) : undefined;
                      const serviceTitle = isCarService
                        ? `${servicePackage?.name || "Car Detailing"} - ${vehicleCategory?.name || "Vehicle"}`
                        : CLEANING_CATEGORIES.find((c) => c.id === selectedBooking.cleaningCategory)?.name || "Cleaning Service";

                      
                      
                      
                      return serviceTitle;
                    })()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold text-gray-900">
                    {selectedBooking.serviceCategory === "car-detailing" && selectedBooking.vehicleType
                      ? getVehicleCategory(selectedBooking.vehicleType)?.name
                      : (() => {
                        if (selectedBooking.cleaningCategory === "HOUSE_CLEANING") {
                          if (selectedBooking.houseCleaningType === "BATHROOM") return "Bathroom Cleaning";
                          if (selectedBooking.houseCleaningType === "WINDOW") return "Window Cleaning";
                          if (selectedBooking.houseCleaningType === "ROOM") {
                            const size = selectedBooking.roomSize ? ROOM_SIZES.find((r) => r.id === selectedBooking.roomSize) : undefined;
                            return size?.name || "Room";
                          }
                        }
                        if (selectedBooking.cleaningCategory === "FUMIGATION") {
                          const size = selectedBooking.roomSize ? ROOM_SIZES.find((r) => r.id === selectedBooking.roomSize) : undefined;
                          return `${selectedBooking.fumigationType === "BED_BUG" ? "Bed Bug" : "General"} · ${size?.name || ""}`.trim();
                        }
                        if (selectedBooking.cleaningCategory === "MOVE_IN_OUT") {
                          const size = selectedBooking.roomSize ? ROOM_SIZES.find((r) => r.id === selectedBooking.roomSize) : undefined;
                          return `Move In/Out · ${size?.name || ""}`.trim();
                        }
                        if (selectedBooking.cleaningCategory === "POST_CONSTRUCTION") {
                          const size = selectedBooking.roomSize ? ROOM_SIZES.find((r) => r.id === selectedBooking.roomSize) : undefined;
                          return `Post Construction · ${size?.name || ""}`.trim();
                        }
                        return "";
                      })()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedBooking.price)}
                  </p>
                </div>

                {selectedBooking.location && (
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">
                      {selectedBooking.location.manualAddress ||
                        selectedBooking.location.address}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button fullWidth onClick={() => setSelectedBooking(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        {selectedChatBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh]">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Chat with Cleaner -{" "}
                  {selectedChatBooking.serviceCategory === "car-detailing" && selectedChatBooking.carServicePackage
                    ? getCarServicePackage(selectedChatBooking.carServicePackage)?.name || "Car Service"
                    : CLEANING_CATEGORIES.find((c) => c.id === selectedChatBooking.cleaningCategory)?.name || "Cleaning Service"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedChatBooking(null)}
                >
                  ✕
                </Button>
              </div>
              <div className="p-4">
                <ChatComponent
                  bookingId={selectedChatBooking.id}
                  currentUserId={userSession?.phone || ""}
                  currentUserRole="client"
                />
              </div>
            </div>
          </div>
        )}

        {}
        <RatingModal
          isOpen={ratingModalOpen}
          onClose={() => {
            setRatingModalOpen(false);
            setSelectedBookingForRating(null);
          }}
          onSubmit={handleRatingSubmit}
          bookingId={selectedBookingForRating?.id || ""}
          serviceName={
            selectedBookingForRating?.serviceCategory === "car-detailing"
              ? getCarServicePackage(selectedBookingForRating?.carServicePackage || "NORMAL-DETAIL")
                ?.name || "Car Service"
              : CLEANING_CATEGORIES.find((c) => c.id === selectedBookingForRating?.cleaningCategory)?.name || "Cleaning Service"
          }
        />

        {}
        {showPaymentModal && selectedBookingForPayment && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedBookingForPayment(null);
            }}
            bookingId={selectedBookingForPayment.id}
            amount={selectedBookingForPayment.price}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}
