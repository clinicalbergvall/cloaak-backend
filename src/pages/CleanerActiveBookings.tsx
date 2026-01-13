import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useNotifications } from "../contexts/NotificationContext";
import { CompleteJobModal } from '@/components/CompleteJobModal';
import { Card, Badge, Button, ChatComponent } from '@/components/ui';
import CleanerLayout from "@/components/CleanerLayout";
import { getVehicleCategory } from "@/lib/validation";
import type { VehicleType } from "@/lib/types";
import { loadUserSession } from "@/lib/storage";
import { watchLocation } from "@/lib/location";

interface ActiveBooking {
  _id: string;
  id?: string;
  serviceCategory: string;
  bookingType: string;
  price: number;
  status: string;
  scheduledDate?: string;
  scheduledTime?: string;
  location?: {
    address: string;
    manualAddress?: string;
    coordinates?: [number, number];
  };
  client: {
    _id: string;
    name: string;
    phone: string;
  };
  completedAt?: string;
  paymentStatus?: string;
  paid?: boolean;
  paidAt?: string;
  payoutStatus?: string;

  carServicePackage?: string;
  cleaningCategory?: string;
  vehicleType?: VehicleType;
}

export default function CleanerActiveBookings() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<ActiveBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ActiveBooking | null>(null);
  const [selectedChatBooking, setSelectedChatBooking] = useState<ActiveBooking | null>(null);



  const ChatWithCurrentUser = ({ bookingId }: { bookingId: string }) => {
    const userSession = loadUserSession();

    if (!userSession) {
      return <div className="p-4 text-center text-gray-500">Please log in to use chat</div>;
    }



    return (
      <ChatComponent
        bookingId={bookingId}
        currentUserId={userSession.phone}
        currentUserRole="cleaner"
      />
    );
  };

  const fetchBookings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get("/bookings");

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please sign in again.");
          navigate("/test-login");
          return;
        }
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();
      const allBookings = data.bookings || [];


      const active = allBookings.filter(
        (b: ActiveBooking) =>
          b.status === "confirmed" || b.status === "in-progress",
      );


      const completed = allBookings.filter(
        (b: ActiveBooking) => b.status === "completed",
      );

      setActiveBookings(active);
      setCompletedBookings(completed);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();


    const interval = setInterval(() => {
      fetchBookings(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleCompleteJob = (booking: ActiveBooking) => {
    setSelectedBooking(booking);
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedBooking) return;

    try {
      // Update booking status to completed using the status endpoint
      const response = await api.put(
        `/bookings/${selectedBooking._id || selectedBooking.id}/status`,
        { status: 'completed' },
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please sign in again.");
          navigate("/test-login");
          return;
        }
        throw new Error("Failed to complete booking");
      }

      const data = await response.json();

      toast.success("Job marked as complete! Client will be notified.");


      addNotification({
        type: "service_complete",
        title: "Job Completed! ✅",
        message: `${selectedBooking.serviceCategory} job completed. Awaiting client payment for payout.`,
        bookingId: selectedBooking._id || selectedBooking.id,
      });

      setShowCompleteModal(false);
      setSelectedBooking(null);


      fetchBookings();
    } catch (error) {
      console.error("Error completing booking:", error);
      toast.error("Failed to mark job as complete");
      throw error;
    }
  };

  const handleStartChat = (booking: ActiveBooking) => {
    setSelectedChatBooking(booking);
  };

  const handleGetDirections = (booking: ActiveBooking) => {
    if (booking.location && booking.location.coordinates) {
      const [lat, lng] = booking.location.coordinates;
      // Open Google Maps with directions
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (booking.location && (booking.location.address || booking.location.manualAddress)) {
      const address = booking.location.manualAddress || booking.location.address;
      // Open Google Maps with the address
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`, '_blank');
    }
  };

  const calculatePayout = (price: number) => Math.round(price * 0.4);

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

  if (loading) {
    return (
      <CleanerLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading bookings...
            </p>
          </div>
        </div>
      </CleanerLayout>
    );
  }

  return (
    <CleanerLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          { }
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Active Jobs
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your ongoing and completed jobs
            </p>
          </div>

          { }
          {activeBookings.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                🧹 Active Jobs ({activeBookings.length})
              </h2>
              <div className="space-y-4">
                {activeBookings.map((booking: any) => (
                  <ActiveBookingCard
                    key={booking._id || booking.id}
                    booking={booking}
                    onComplete={() => handleCompleteJob(booking)}
                    onNavigate={() => navigate(`/bookings/${booking._id || booking.id}`)}
                    onStartChat={handleStartChat}
                    onGetDirections={handleGetDirections}
                  />
                ))}
              </div>
            </div>
          )}

          { }
          {completedBookings.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                ✅ Completed - Awaiting Payment ({completedBookings.length})
              </h2>
              <div className="space-y-4">
                {completedBookings.map((booking: any) => (
                  <CompletedBookingCard
                    key={booking._id || booking.id}
                    booking={booking}
                  />
                ))}
              </div>
            </div>
          )}

          { }
          {activeBookings.length === 0 && completedBookings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4 text-6xl">⏳</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Active Jobs
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Check the Jobs page for new opportunities
              </p>
              <button
                onClick={() => navigate("/jobs")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Browse Jobs
              </button>
            </div>
          )}
        </div>

        { }
        {showCompleteModal && selectedBooking && (
          <CompleteJobModal
            booking={{
              id: selectedBooking._id || selectedBooking.id!,
              serviceCategory: selectedBooking.serviceCategory,
              price: selectedBooking.price,
            }}
            onConfirm={handleConfirmComplete}
            onCancel={() => {
              setShowCompleteModal(false);
              setSelectedBooking(null);
            }}
          />
        )}

        { }
        {selectedChatBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh]">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Chat with Client -{" "}
                  {selectedChatBooking.serviceCategory === "car-detailing"
                    ? selectedChatBooking.carServicePackage || "Car Service"
                    : selectedChatBooking.cleaningCategory || "Cleaning Service"}
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
                <ChatWithCurrentUser
                  bookingId={selectedChatBooking._id || selectedChatBooking.id || ""}
                />
              </div>
            </div>
          </div>
        )}


      </div>
    </CleanerLayout>
  );
}


interface ActiveBookingCardProps {
  booking: ActiveBooking;
  onComplete: () => void;
  onNavigate: () => void;
  onStartChat: (booking: ActiveBooking) => void;
  onGetDirections: (booking: ActiveBooking) => void;
}

function ActiveBookingCard({
  booking,
  onComplete,
  onNavigate,
  onStartChat,
  onGetDirections
}: ActiveBookingCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const cleanerPayout = Math.round(booking.price * 0.4);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      { }
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {booking.vehicleType ? getVehicleCategory(booking.vehicleType)?.icon || "🚗" : "🚗"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {booking.serviceCategory?.replace("-", " ")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {booking.bookingType}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-sm text-gray-600 dark:text-gray-400">Your Earnings</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
            KSh {cleanerPayout.toLocaleString()}
          </p>
        </div>
      </div>

      { }
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {(booking.location?.address || booking.location?.manualAddress) && (
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex-shrink-0">📍</span>
            <span className="truncate">{booking.location.manualAddress || booking.location.address}</span>
          </div>
        )}
        {booking.scheduledDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex-shrink-0">📅</span>
            <span>
              {formatDate(booking.scheduledDate)}{" "}
              {booking.scheduledTime && `at ${booking.scheduledTime}`}
            </span>
          </div>
        )}
      </div>

      { }
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Client Information
        </h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex-shrink-0">👤</span>
            <span className="text-gray-900 dark:text-white">
              {booking.client.name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex-shrink-0">📞</span>
            <a
              href={`tel:${booking.client.phone}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {booking.client.phone}
            </a>
          </div>
        </div>
      </div>

      { }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-semibold rounded-full capitalize self-start">
          {booking.status === 'in-progress' ? 'Confirmed' : booking.status.replace("-", " ")}
        </span>

        <div className="flex gap-2">
          { }
          {(booking.status === "confirmed" || booking.status === "in-progress") && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartChat(booking);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg
                       transition duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              💬 Chat
            </button>
          )}

          { }
          {booking.location && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGetDirections(booking);
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg
                       transition duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              🧭 Get Directions
            </button>
          )}



          <button
            onClick={onComplete}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg
                     transition duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
          >
            ✅ Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}


interface CompletedBookingCardProps {
  booking: ActiveBooking;
}

function CompletedBookingCard({ booking }: CompletedBookingCardProps) {
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

  const cleanerPayout = Math.round(booking.price * 0.4);
  const isPaid = booking.paid || booking.paymentStatus === "paid";
  const payoutProcessed = booking.payoutStatus === "completed";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      { }
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            ✅
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {booking.serviceCategory?.replace("-", " ")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Completed {formatDate(booking.completedAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-sm text-gray-600 dark:text-gray-400">Your Earnings</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            KSh {cleanerPayout.toLocaleString()}
          </p>
        </div>
      </div>

      { }
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Status
          </span>
          <span
            className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${isPaid
              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
              }`}
          >
            {isPaid ? "✓ Paid" : "⏳ Awaiting Payment"}
          </span>
        </div>

        {isPaid && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Payout Status
            </span>
            <span
              className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${payoutProcessed
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                }`}
            >
              {payoutProcessed ? "💰 Payout Sent" : "🔄 Processing"}
            </span>
          </div>
        )}
      </div>

      {isPaid && booking.paidAt && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
          Paid on {formatDate(booking.paidAt)}
        </p>
      )}
    </div>
  );
}
