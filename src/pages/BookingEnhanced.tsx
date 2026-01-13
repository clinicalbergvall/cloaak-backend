import { useState, useEffect, useMemo, useRef } from "react";
import {
  Button,
  Input,
  Card,
  ProgressBar,
} from "@/components/ui";
import CleanerProfile from "./CleanerProfile";
import LocationMap from "@/components/LocationMap";
import { PaymentModal } from "@/components/PaymentModal";
import {
  VEHICLE_CATEGORIES,
  CAR_SERVICE_PACKAGES,
  PAINT_CORRECTION_STAGES,
  CAR_DETAILING_EXTRAS,
  getCarDetailingPrice,
  loginSchema,
} from "@/lib/validation";
import type {
  VehicleType,
  CarServicePackage,
  PaintCorrectionStage,
  CarDetailingExtra,
  MidSUVPricingTier,
  BookingType,
  PaymentMethod,
} from "@/lib/types";
import { formatCurrency, formatPhoneNumber } from "@/lib/utils";
import {
  saveUserSession,
  loadUserSession,
  clearUserSession,
} from "@/lib/storage";
import { getCurrentLocation, getLocationPermissionStatus, reverseGeocode } from "@/lib/location";
import authAPI from "@/lib/auth-api";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { logger } from "@/lib/logger";


const carDetailingCarouselImages = [
  {
    id: 1,
    title: "Professional Car Polishing",
    description: "Expert detailing with premium equipment",
    image: "/assets/images/car-polish-new.png",
  },
  {
    id: 2,
    title: "Pressure Washing Service",
    description: "Deep cleaning with high-pressure equipment",
    image: "/assets/images/pressure-wash-new.png",
  },
  {
    id: 5,
    title: "Interior Steam Cleaning",
    description: "Deep sanitation and stain removal",
    image: "/assets/images/interior-steam-cleaning.jpg",
  },
  {
    id: 6,
    title: "Premium Foam Wash",
    description: "Gentle and effective exterior cleaning",
    image: "/assets/images/premium-foam-wash.jpg",
  },
  {
    id: 7,
    title: "Detailed Interior Care",
    description: "Thorough cleaning for every corner",
    image: "/assets/images/interior-detailing.jpg",
  },
];



type UserType = "client" | "cleaner" | "admin" | null;

type StageId =
  | "account"
  | "vehicle"
  | "package"
  | "extras"
  | "schedule"
  | "review";

interface StageDefinition {
  id: StageId;
  label: string;
  optional?: boolean;
}

export default function BookingEnhanced() {
  const carVideoRef = useRef<HTMLVideoElement | null>(null)
  const homeVideoRef = useRef<HTMLVideoElement | null>(null)
  const [canAutoplay, setCanAutoplay] = useState(true)
  const useMobileSrc = useMemo(() => {
    if (!canAutoplay) return true
    if (typeof window === 'undefined') return false
    return window.innerWidth <= 768
  }, [canAutoplay])
  const getVideoSrc = (src: string) => {
    if (!src || !src.endsWith('.mp4')) return src

    if (/-mobile-720p\.mp4$/.test(src)) return src
    if (!useMobileSrc) return src
    const base = src.slice(0, -4)
    return `${base}-mobile-720p.mp4`
  }
  const [userType, setUserType] = useState<UserType>(null);
  const [step, setStep] = useState(1);
  const serviceCategory = "car-detailing";


  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);


  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [carServicePackage, setCarServicePackage] = useState<
    CarServicePackage | ""
  >("");
  const [paintStage, setPaintStage] = useState<PaintCorrectionStage | "">("");
  const [midSUVTier, setMidSUVTier] = useState<MidSUVPricingTier>("STANDARD");
  const [fleetCarCount, setFleetCarCount] = useState<number>(5);
  const [selectedCarExtras, setSelectedCarExtras] = useState<
    CarDetailingExtra[]
  >([]);
  const [selectedCarServices, setSelectedCarServices] = useState<string[]>([]);
  const [failedPackage, setFailedPackage] = useState<Record<string, boolean>>({});




  const [bookingType, setBookingType] = useState<BookingType>("immediate");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [location, setLocation] = useState<{
    address?: string;
    manualAddress?: string;
    coordinates?: [number, number];
  }>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<string>("unknown");


  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState("");
  const [currentBookingAmount, setCurrentBookingAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const session = loadUserSession();
    if (session) {
      setUserType(session.userType);
      setName(session.name || "");
      setPhone(session.phone || "");
      if (session.userType === "client") {
        setStep(2);
        setIsSignup(false);
      }
    }
    getLocationPermissionStatus().then(setLocationPermission).catch(() => setLocationPermission("unknown"));
  }, []);

  useEffect(() => {
    setCanAutoplay(true)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLVideoElement
        if (!el) return
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
          el.muted = true
          el.play().catch(() => { })
        } else {
          el.pause()
        }
      })
    }, { threshold: [0.2, 0.5, 0.8] })
    if (carVideoRef.current) observer.observe(carVideoRef.current)
    if (homeVideoRef.current) observer.observe(homeVideoRef.current)
    return () => observer.disconnect()
  }, [])

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    if (type === "cleaner") {
      rememberSession({ userType: "cleaner" });
    }
  };

  const handleGoBack = () => {
    // Only clear session when going back from step 1 (account selection) to the initial screen
    // Don't clear session when moving between booking steps for users who are already logged in
    if (step === 1) {
      // Check if the user was already logged in before entering the booking flow
      const savedSession = loadUserSession();
      if (savedSession && savedSession.userType) {
        // User was already logged in, don't clear their session
        setStep(step - 1);
      } else {
        // User was not logged in, clear session to go back to initial screen
        clearUserSession();
        setUserType(null);
      }
    } else {
      setStep(step - 1);
    }
  };

  // Handle hardware back button for booking flow
  useEffect(() => {
    const handleStepBack = () => {
      // Prevent default back navigation if we're in a middle step
      if (step > 1) {
        // Call the same logic as the back button in the UI
        handleGoBack();
        // Stop propagation by returning false (handled by custom event system)
        return false;
      }
      // Return true if we allow default navigation (at step 1)
      return true;
    };

    const handleBookingStepBack = (e: Event) => {
      const result = handleStepBack();
      // Since custom events can't return values directly, we'll use the event's defaultPrevented
      // to signal whether the event was handled
      if (!result) {
        e.preventDefault();
      }
    };

    document.addEventListener('booking:stepBack', handleBookingStepBack);
    
    return () => {
      document.removeEventListener('booking:stepBack', handleBookingStepBack);
    };
  }, [step, userType]);

  // Handle hardware back button for booking flow




  const rememberSession = (payload: {
    userType: "client" | "cleaner";
    name?: string;
    phone?: string;
  }) => {
    saveUserSession({
      userType: payload.userType,
      name: payload.name || "",
      phone: payload.phone || "",
      lastSignedIn: new Date().toISOString(),
    });
  };

  const roleFromUserType = (u: UserType): "client" | "cleaner" => {
    return u === "cleaner" ? "cleaner" : "client"
  }

  const extrasEnabled = serviceCategory === "car-detailing";

  const stageDefinitions = useMemo<StageDefinition[]>(
    () => [
      { id: "account", label: "Account" },
      { id: "vehicle", label: "Vehicle" },
      { id: "package", label: "Package" },
      { id: "extras", label: "Add-ons", optional: true },
      { id: "schedule", label: "Schedule & Location" },
      { id: "review", label: "Review" },
    ],
    [serviceCategory],
  );

  const activeStages = useMemo(
    () =>
      stageDefinitions.filter(
        (stage: any) => extrasEnabled || stage.id !== "extras"
      ),
    [stageDefinitions, extrasEnabled],
  );

  const currentStageId = useMemo<StageId>(() => {
    if (step <= 1) return "account";
    if (step === 2) return "vehicle";
    if (step === 3) return "package";
    if (step === 4) return "extras";
    if (step === 5) return "schedule";
    return "review";
  }, [step]);

  const currentStageIndex = activeStages.findIndex(
    (stage: any) => stage.id === currentStageId
  );
  const normalizedStageIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

  const progress =
    activeStages.length > 1
      ? Math.min(
        100,
        Math.max(0, (normalizedStageIndex / (activeStages.length - 1)) * 100),
      )
      : 0;


  const price =
    vehicleType && carServicePackage
      ? getCarDetailingPrice(
        vehicleType,
        carServicePackage,
        paintStage || undefined,
        midSUVTier,
        fleetCarCount,
      )
      : 0;


  const carAddonsTotal = selectedCarExtras.reduce((total: number, extraId: string) => {
    const extra = CAR_DETAILING_EXTRAS.find((e) => e.id === extraId);
    return total + (extra?.price ?? 0);
  }, 0);

  const addonsTotal = carAddonsTotal;
  const totalPrice = price + addonsTotal;

  const PACKAGE_VIDEOS: Record<CarServicePackage, string> = {
    "NORMAL-DETAIL": "/assets/detailing/6873163-mobile-720p.mp4",
    "INTERIOR-STEAMING": "/assets/detailing/6873149-mobile-720p.mp4",
    "PAINT-CORRECTION": "/assets/detailing/6872065-mobile-720p.mp4",
    "FULL-DETAIL": "/assets/detailing/6872474-mobile-720p.mp4",
    "FLEET-PACKAGE": "",
  } as const
  const PACKAGE_FALLBACK_IMAGES: Record<CarServicePackage, string> = {
    "NORMAL-DETAIL": "/assets/images/premium-foam-wash.jpg",
    "INTERIOR-STEAMING": "/assets/detailing/wash-2.png",
    "PAINT-CORRECTION": "/assets/detailing/wash-1.png",
    "FULL-DETAIL": "/assets/detailing/IMG_0120.png",
    "FLEET-PACKAGE": "/assets/images/premium-foam-wash.jpg",
  } as const




  if (!userType) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">Tell us about yourself to get started</p>
        </div>

        <div className="space-y-4">
          <p className="font-semibold text-gray-900 mb-3">I want to:</p>

          <Card
            variant="outlined"
            hoverable
            className="p-6 cursor-pointer transition-all hover:border-gray-400"
            onClick={() => handleUserTypeSelect("client")}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">🏠</div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-1">
                  Find Professional Car Detailers
                </h3>
                <p className="text-sm text-gray-600">
                  Connect with expert detailers to elevate and maintain your vehicle
                </p>
              </div>
            </div>
          </Card>

          <Card
            variant="outlined"
            hoverable
            className="p-6 cursor-pointer transition-all border-2 border-yellow-400 bg-yellow-50 hover:border-yellow-500"
            onClick={() => handleUserTypeSelect("cleaner")}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">💼</div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-1">
                  Setup Personal Business
                </h3>
                <p className="text-sm text-gray-600">
                  Offer cleaning services and grow your business
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }


  if (userType === "cleaner") {
    return (
      <div>
        <button
          onClick={() => setUserType(null)}
          className="text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-2"
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
        </button>
        <CleanerProfile />
      </div>
    );
  }


  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    const loc = await getCurrentLocation();
    setIsLoadingLocation(false);
    if (loc) {
      setLocation(loc);
    } else {
      toast.error("Could not fetch location. Please enter manually.");
    }
  };

  const handleLocationChange = async (lat: number, lng: number) => {
    // Update coordinates immediately for responsiveness
    setLocation((prev: any) => ({
      ...prev,
      coordinates: [lat, lng],
    }));

    try {
      // Reverse geocode to get the new address
      const address = await reverseGeocode(lat, lng);
      setLocation((prev: any) => ({
        ...prev,
        coordinates: [lat, lng],
        address: address,
        manualAddress: address
      }));
    } catch (error) {
      console.error("Failed to reverse geocode:", error);
    }
  };

  const handleBookingSubmit = async () => {
    try {
      setIsSubmitting(true);

      const bookingPayload = {
        contact: {
          name: name.trim() || "CleanCloak Client",
          phone,
        },
        serviceCategory,

        vehicleType:
          serviceCategory === "car-detailing" ? vehicleType : undefined,
        carServicePackage:
          serviceCategory === "car-detailing" ? carServicePackage : undefined,
        paintCorrectionStage:
          carServicePackage === "PAINT-CORRECTION" ? paintStage : undefined,
        midSUVPricingTier: vehicleType === "MID-SUV" ? midSUVTier : undefined,
        fleetCarCount:
          carServicePackage === "FLEET-PACKAGE" ? fleetCarCount : undefined,
        selectedCarExtras:
          selectedCarExtras.length > 0 ? selectedCarExtras : undefined,

        location,
        bookingType,
        scheduledDate: bookingType === "scheduled" ? scheduledDate : undefined,
        scheduledTime: bookingType === "scheduled" ? scheduledTime : undefined,
        paymentMethod,
        price: totalPrice,
        paymentStatus: "pending",
      };

      const response = await api.post("/bookings/public", bookingPayload);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || "Failed to submit booking");
      }

      const data = await response.json();
      const bookingRecord = data.booking || bookingPayload;


      rememberSession({
        userType: "client",
        name: name.trim() || bookingRecord.contact?.name,
        phone,
      });


      toast.success(
        "🎉 Booking created! A cleaner will accept your request soon.",
      );


      setTimeout(() => {
        setStep(2);
        setName("");
        setPhone("");

        setVehicleType("");
        setCarServicePackage("");
        setPaintStage("");
        setMidSUVTier("STANDARD");
        setFleetCarCount(5);
        setSelectedCarExtras([]);
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Booking failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      { }
      {step === 1 && (
        <button
          onClick={() => setUserType(null)}
          className="text-gray-600 hover:text-gray-900 mb-1 flex items-center gap-2"
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
        </button>
      )}

      { }
      <div className="mb-0">
        {step > 1 && (
          <button
            onClick={handleGoBack}
            className="text-gray-600 hover:text-gray-900 mb-0 flex items-center gap-2"
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
          </button>
        )}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-0">CleanCloak</h1>
          <p className="text-gray-600 mb-0">
            {step === 1 &&
              (isSignup
                ? "Create your account to find professional car detailers"
                : "Sign in to find professional car detailers")}
            {step === 2 && "Select vehicle type"}
            {step === 3 && "Select service package"}
            {step === 4 && "Select add-ons"}
            {step === 5 && "Location & scheduling"}
            {step === 6 && "Review your booking"}
          </p>
        </div>
      </div>

      { }
      { }
      {
        step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Service Package</h3>
              <p className="text-gray-600 mb-4">Choose the detailing package that best fits your needs</p>
            </div>
            
            <div className="space-y-2 mb-3">
              <ProgressBar value={progress} className="mb-1" />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activeStages.map((stage: any, index: number) => {
                  const status =
                    index < normalizedStageIndex
                      ? "complete"
                      : index === normalizedStageIndex
                        ? "current"
                        : "upcoming";
                  const statusClasses =
                    status === "complete"
                      ? "bg-black text-white border-black shadow-sm"
                      : status === "current"
                        ? "border-2 border-yellow-400 shadow-sm"
                        : "border border-gray-200 opacity-60";
                  
                  return (
                    <button
                      key={stage.id}
                      className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${statusClasses}`}
                      onClick={() => setStep(index + 1)}
                      disabled={index > normalizedStageIndex}
                    >
                      {stage.label}
                      {status === "complete" && " ✓"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {CAR_SERVICE_PACKAGES.map((pkg) => {
                const displayPrice = getCarDetailingPrice(
                  vehicleType as VehicleType,
                  pkg.id,
                  paintStage || undefined,
                  midSUVTier,
                  fleetCarCount,
                );
                
                const status =
                  carServicePackage === pkg.id
                    ? "current"
                    : "upcoming";
                const statusClasses =
                  status === "current"
                    ? "border-2 border-yellow-400 shadow-sm"
                    : "border border-gray-200 opacity-60";
                
                return (
                  <Card
                    key={pkg.id}
                    variant={carServicePackage === pkg.id ? "default" : "outlined"}
                    hoverable
                    selected={carServicePackage === pkg.id}
                    className={`p-4 cursor-pointer transition-all ${statusClasses}`}
                    onClick={() => {
                      setCarServicePackage(pkg.id);
                      // Auto-progress if not a special package
                      if (pkg.id !== "PAINT-CORRECTION" && pkg.id !== "FLEET-PACKAGE") {
                        setStep(4);
                      }
                    }}
                  >
                    <div className="-mt-2 -mx-2 mb-4">
                      {pkg.id !== "FLEET-PACKAGE" && ( // Don't show media for fleet package
                        PACKAGE_VIDEOS[pkg.id] && !failedPackage[pkg.id] ? (
                          <video
                            className="w-full h-32 sm:h-40 object-cover rounded-xl"
                            src={getVideoSrc(PACKAGE_VIDEOS[pkg.id])}
                            muted
                            loop
                            playsInline
                            preload="none"
                            autoPlay
                            controls={false}
                            poster={PACKAGE_FALLBACK_IMAGES[pkg.id]}
                            onError={() => setFailedPackage((p: any) => ({ ...p, [pkg.id]: true }))}
                          />
                        ) : PACKAGE_FALLBACK_IMAGES[pkg.id] ? (
                          <img
                            src={PACKAGE_FALLBACK_IMAGES[pkg.id]}
                            alt={pkg.name}
                            className="w-full h-32 sm:h-40 object-cover rounded-xl"
                            loading="lazy"
                          />
                        ) : null
                      )}
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {pkg.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {pkg.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ⏱️ {pkg.duration}
                        </p>
                      </div>
                      <span className="font-bold text-yellow-600 min-w-[140px] text-left whitespace-nowrap">
                        {pkg.id === "FLEET-PACKAGE"
                          ? `${formatCurrency(displayPrice)}/car`
                          : formatCurrency(displayPrice)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>

            { }
            {carServicePackage === "PAINT-CORRECTION" && (
              <div className="mt-6">
                <p className="font-semibold text-gray-900 mb-3">
                  Select Paint Correction Stage:
                </p>
                <div className="grid gap-3">
                  {PAINT_CORRECTION_STAGES.map((stage) => {
                    const stagePrice = getCarDetailingPrice(
                      vehicleType as VehicleType,
                      "PAINT-CORRECTION",
                      stage.id,
                      midSUVTier,
                    );
                    return (
                      <Card
                        key={stage.id}
                        variant={
                          paintStage === stage.id ? "default" : "outlined"
                        }
                        hoverable
                        selected={paintStage === stage.id}
                        className="p-4 cursor-pointer"
                        onClick={() => setPaintStage(stage.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-semibold text-gray-900">
                              {stage.name}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {stage.description}
                            </p>
                          </div>
                          <span className="font-bold text-yellow-600">
                            {formatCurrency(stagePrice)}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            { }
            {carServicePackage === "FLEET-PACKAGE" && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-semibold text-gray-900 mb-3">
                  Number of Cars:
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFleetCarCount((prev: number) => Math.max(2, prev - 1))}
                    className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xl font-bold hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {fleetCarCount}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFleetCarCount((prev: number) => Math.min(100, prev + 1))}
                    className="w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xl font-bold hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Total: {formatCurrency(getCarDetailingPrice(vehicleType as VehicleType, "FLEET-PACKAGE", undefined, midSUVTier, fleetCarCount))}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} fullWidth>
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                fullWidth
                disabled={!carServicePackage}
              >
                Continue
              </Button>
            </div>
          </div>
        )
      }

      { }
      {
        step === 4 && (
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600">Selected Package:</p>
              <div className="flex items-center gap-3 mt-1 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xl">✨</span>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">
                    {CAR_SERVICE_PACKAGES.find(p => p.id === carServicePackage)?.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {VEHICLE_CATEGORIES.find(v => v.id === vehicleType)?.name}
                  </p>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="ml-auto text-xs text-yellow-600 font-bold hover:underline"
                >
                  Change
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select Additional Services
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose specific detailing services you need
              </p>
            </div>

            { }
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Optional Extras
              </h4>
              <div className="space-y-3">
                {CAR_DETAILING_EXTRAS.map((extra) => {
                  const isSelected = selectedCarExtras.includes(extra.id);
                  return (
                    <label
                      key={extra.id}
                      className="flex items-center justify-between p-3 bg-white rounded border cursor-pointer hover:border-yellow-400"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCarExtras([
                                ...selectedCarExtras,
                                extra.id,
                              ]);
                            } else {
                              setSelectedCarExtras(
                                selectedCarExtras.filter((id: string) => id !== extra.id)
                              );
                            }
                          }}
                          className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
                        />
                        <span>{extra.name}</span>
                      </div>
                      <span className="font-semibold text-yellow-600 w-28 text-left whitespace-nowrap">
                        {formatCurrency(extra.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {selectedCarExtras.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Selected Extras ({selectedCarExtras.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCarExtras.map((extraId: string) => {
                    const extra = CAR_DETAILING_EXTRAS.find(
                      (e: any) => e.id === extraId,
                    );
                    return extra ? (
                      <span
                        key={extraId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-yellow-300 rounded text-xs"
                      >
                        {extra.icon} {extra.name}
                      </span>
                    ) : null;
                  })}
                </div>
                <p className="mt-3 text-sm text-gray-700">
                  Extras total:{" "}
                  <span className="font-semibold text-yellow-700">
                    {formatCurrency(addonsTotal)}
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(3)} fullWidth>
                Back
              </Button>
              <Button onClick={() => setStep(5)} fullWidth>
                Continue{" "}
                {selectedCarExtras.length > 0 &&
                  `(${selectedCarExtras.length} extras)`}
              </Button>
            </div>
          </div>
        )
      }

      { }
      {
        step === 5 && (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-gray-900 mb-3">Location:</p>
              <Button
                variant="outline"
                fullWidth
                onClick={handleGetLocation}
                loading={isLoadingLocation}
                className="mb-3"
              >
                📍 Use Current Location
              </Button>
              <p className="text-xs text-gray-600 mb-2">
                Permission: {locationPermission}
              </p>
              <Input
                placeholder="Or enter address manually"
                value={location.manualAddress || ""}
                onChange={(e: any) =>
                  setLocation({ ...location, manualAddress: e.target.value })
                }
              />

              <LocationMap
                location={location}
                height="200px"
                draggable={true}
                onLocationChange={handleLocationChange}
                showMap={false}
              />

              {(location.address || location.manualAddress || location.coordinates) && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Location
                    </p>
                    <button
                      onClick={() => setLocation({})}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      Clear
                    </button>
                  </div>

                  {location.address && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">📍</span>
                      <p className="text-sm text-blue-900 font-medium">
                        {location.address}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="font-semibold text-gray-900 mb-3">
                When do you need this service?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Card
                  variant={bookingType === "immediate" ? "default" : "outlined"}
                  hoverable
                  selected={bookingType === "immediate"}
                  className="p-4 cursor-pointer text-center"
                  onClick={() => setBookingType("immediate")}
                >
                  <div className="text-2xl mb-2">⚡</div>
                  <p className="font-semibold text-sm">Now</p>
                </Card>
                <Card
                  variant={bookingType === "scheduled" ? "default" : "outlined"}
                  hoverable
                  selected={bookingType === "scheduled"}
                  className="p-4 cursor-pointer text-center"
                  onClick={() => setBookingType("scheduled")}
                >
                  <div className="text-2xl mb-2">📅</div>
                  <p className="font-semibold text-sm">Schedule</p>
                </Card>
              </div>
            </div>

            {bookingType === "scheduled" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  label="Date"
                  value={scheduledDate}
                  onChange={(e: any) => setScheduledDate(e.target.value)}
                />
                <Input
                  type="time"
                  label="Time"
                  value={scheduledTime}
                  onChange={(e: any) => setScheduledTime(e.target.value)}
                />
              </div>
            )}

            <div>
              <p className="font-semibold text-gray-900 mb-3">Payment Method:</p>
              <Card
                variant="default"
                className="p-4 text-center bg-green-50 border-green-200"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">📱</span>
                  <p className="font-bold text-lg text-green-800">M-PESA</p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Secure mobile payment
                </p>
              </Card>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(4)} fullWidth>
                Back
              </Button>
              <Button onClick={() => setStep(6)} fullWidth>
                Review
              </Button>
            </div>
          </div>
        )
      }

      { }
      {
        step === 6 && (
          <div className="space-y-4">
            <Card className="p-6 bg-gray-50">
              <h3 className="font-bold text-lg mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold">Car Detailing</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold">
                    {location.address || location.manualAddress || (location.coordinates ? `${location.coordinates[0].toFixed(6)}, ${location.coordinates[1].toFixed(6)}` : 'No location set')}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold">
                    {
                      VEHICLE_CATEGORIES.find((v) => v.id === vehicleType)
                        ?.name
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Package:</span>
                  <span className="font-semibold">
                    {
                      CAR_SERVICE_PACKAGES.find(
                        (s) => s.id === carServicePackage,
                      )?.name
                    }
                  </span>
                </div>
                {selectedCarExtras.length > 0 && (
                  <div>
                    <span className="text-gray-600">Add-ons:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedCarExtras.map((id: string) => {
                        const addon = CAR_DETAILING_EXTRAS.find(
                          (s: any) => s.id === id,
                        );
                        return addon ? (
                          <span
                            key={id}
                            className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700"
                          >
                            {addon.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}


                <div className="flex justify-between">
                  <span className="text-gray-600">When:</span>
                  <span className="font-semibold">
                    {bookingType === "immediate"
                      ? "Now"
                      : `${scheduledDate} at ${scheduledTime}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment:</span>
                  <span className="font-semibold uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price:</span>
                  <span className="font-semibold">{formatCurrency(price)}</span>
                </div>
                {addonsTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Add-ons Total:</span>
                    <span className="font-semibold">
                      {formatCurrency(addonsTotal)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-yellow-600">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(5)} fullWidth>
                Back
              </Button>
              <Button
                fullWidth
                onClick={handleBookingSubmit}
                disabled={isSubmitting}
                className="mt-4"
              >
                {isSubmitting ? "Submitting..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )
      }
    </div >
  );
}
