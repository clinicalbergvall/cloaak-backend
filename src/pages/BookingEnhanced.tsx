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
  const [step, setStep] = useState(0);
  const serviceCategory = "car-detailing";


  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false); // Kept for potential future use
  const [isAuthenticating, setIsAuthenticating] = useState(false);


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
  const [vehicleVideoFailed, setVehicleVideoFailed] = useState(false);




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
        setStep(2); // Start at step 2 (vehicle selection) for returning clients
        setIsSignup(false);
      }
    } else {
      // For new users, start at step 0 (user type selection)
      setStep(0);
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
    // Handle navigation back from different steps
    if (step === 0) {
      // Going back from step 0 should return to user type selection
      clearUserSession();
      setUserType(null);
    } else if (step === 1) {
      // Going back from step 1 (account) should go to step 0 (user type selection)
      setStep(0);
    } else {
      // For other steps, go back normally
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
    if (step <= 1) return "account"; // Steps 0 and 1 map to account stage
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
        Math.max(0, ((Math.max(0, step - 1)) / (activeStages.length - 1)) * 100),
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
      <div className="w-full">
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
            onClick={() => {
              handleUserTypeSelect("client");
              setStep(1); // Go to login page first
            }}
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
        let errorMessage = "Failed to submit booking";
        try {
          const errorBody = await response.json().catch(() => ({}));
          errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText.substring(0, 200);
            }
          } catch (textError) {
            // Use default error message
          }
        }
        throw new Error(errorMessage);
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
    } catch (error: any) {
      console.error("Booking submission error:", error);
      const errorMessage = error?.message || error?.toString() || "Failed to submit booking. Please check your connection and try again.";
      
      // Check if it's a network error
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        toast.error("Network error. Please check your internet connection and try again.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen min-w-full mx-auto m-0 p-0 bg-white overflow-x-hidden">
      { }
      <div className="mb-6 bg-gradient-to-br from-gray-900 via-gray-950 to-black shadow-lg border-b border-gray-800 backdrop-blur-sm -mx-4 px-4 pt-6 pb-8">
        {step > 0 && (
          <button
            onClick={handleGoBack}
            className="text-gray-300 hover:text-white mb-2 flex items-center gap-2 font-medium px-0"
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent mb-2">CleanCloak</h1>
          <p className="text-gray-100 font-medium text-lg">
            {step === 0 && "Complete your profile to get started"}
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
        step === 0 && (
          <div className="w-full max-w-2xl mx-auto px-4">
            <div className="text-center mb-8">
            </div>

            <div className="space-y-4">
              <p className="font-semibold text-gray-100 mb-3">I want to:</p>

              <Card
                variant="outlined"
                hoverable
                className="p-6 cursor-pointer transition-all hover:border-yellow-400 shadow-sm hover:shadow-md"
                onClick={() => {
                  handleUserTypeSelect("client");
                  setStep(1); // Go to login/signup page
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-2xl">
                    🚗
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-1">
                      Find Professional Car Detailers
                    </h3>
                    <p className="text-sm text-gray-600">
                      Connect with expert detailers to elevate and maintain your vehicle
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-yellow-500">
                    ›
                  </div>
                </div>
              </Card>

              <Card
                variant="outlined"
                hoverable
                className="p-6 cursor-pointer transition-all border-2 border-yellow-400 bg-yellow-50 hover:border-yellow-500 shadow-sm hover:shadow-md"
                onClick={() => handleUserTypeSelect("cleaner")}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center text-white text-2xl">
                    💼
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-1">
                      Join the Clean Cloak Family
                    </h3>
                    <p className="text-sm text-gray-600">
                      Offer Premium Detailing Services
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-yellow-500">
                    ›
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )
      }
      {
        step === 1 && (
          <div className="space-y-6 w-full max-w-2xl mx-auto px-4">
            
            <div className="space-y-3 mb-6 bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-sm -mx-4 px-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-100">Booking Progress</h3>
                <span className="text-sm font-medium text-amber-400 bg-amber-900/50 px-3 py-1 rounded-full">
                  Step {normalizedStageIndex + 1} of {activeStages.length}
                </span>
              </div>
              <ProgressBar value={progress} className="mb-3" />
              <div className="flex gap-2 overflow-x-auto pb-2">
                {activeStages.map((stage: any, index: number) => {
                  const status =
                    index < normalizedStageIndex
                      ? "complete"
                      : index === normalizedStageIndex
                        ? "current"
                        : "upcoming";
                  const statusClasses =
                    status === "complete"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg"
                      : status === "current"
                        ? "border-2 border-yellow-500 shadow-md bg-gradient-to-r from-yellow-50 to-white"
                        : "border border-gray-200 bg-white shadow-sm text-gray-400";
                  
                  return (
                    <button
                      key={stage.id}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${statusClasses}`}
                      onClick={() => setStep(index + 1)}
                      disabled={index > normalizedStageIndex}
                    >
                      <div className="flex items-center gap-2">
                        {status === "complete" && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {stage.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {isSignup && (
                <Input
                  label="Full Name"
                  placeholder="e.g. John Kamau"
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                  required
                />
              )}
              
              <Input
                label="Phone Number"
                placeholder="07XX XXX XXX (for M-Pesa payments)"
                value={phone}
                onChange={(e: any) => setPhone(formatPhoneNumber(e.target.value))}
                required
                helperText="Use your Safaricom number registered for M-Pesa (07XXXXXXXX or 01XXXXXXXX)"
              />
              
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
                helperText="Minimum 6 characters"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
              <Button
                loading={isAuthenticating}
                disabled={isAuthenticating || !phone || (isSignup && (!name || !password))}
                onClick={async () => {
                  if (!phone) {
                    toast.error("Please enter a phone number");
                    return;
                  }
                  
                  if (isSignup && !name.trim()) {
                    toast.error("Please enter your name");
                    return;
                  }
                  
                  if (!password) {
                    toast.error("Please enter a password");
                    return;
                  }
                  
                  setIsAuthenticating(true);
                  try {
                    if (isSignup) {
                      // Sign up flow
                      console.log('Attempting to register with:', { name: name.trim(), phone, role: "client" });
                      const result = await authAPI.register({
                        name: name.trim(),
                        phone,
                        password,
                        role: "client",
                      });
                      
                      console.log('Registration result:', result);
                      
                      if (result.success) {
                        toast.success("Account created successfully!");
                        // Save user session after successful signup
                        saveUserSession({
                          userType: "client",
                          name: name.trim(),
                          phone,
                          lastSignedIn: new Date().toISOString(),
                        });
                        // Set user type and move to next step
                        setUserType("client");
                        setStep(2);
                      } else {
                        throw new Error(result.message || "Failed to create account");
                      }
                    } else {
                      // Login flow with phone and password
                      console.log('Attempting to login with:', { phone, password });
                      const result = await authAPI.login(phone, password);
                      
                      console.log('Login result:', result);
                      
                      if (result.success) {
                        toast.success("Logged in successfully!");
                        // Save user session after successful login
                        saveUserSession({
                          userType: "client",
                          name: result.user?.name || name,
                          phone,
                          lastSignedIn: new Date().toISOString(),
                        });
                        // Set user type and move to next step
                        setUserType("client");
                        setStep(2);
                      } else {
                        throw new Error(result.message || "Failed to login");
                      }
                    }
                  } catch (error: any) {
                    console.error('Auth error:', error);
                    toast.error(error.message || "An error occurred. Please check your connection.");
                  } finally {
                    setIsAuthenticating(false);
                  }
                }}
                fullWidth
                className="min-h-12"
              >
                {isSignup ? "Create Account" : "Sign In"}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setIsSignup(!isSignup)}
                fullWidth
                className="min-h-12"
              >
                {isSignup
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </Button>
            </div>
          </div>
        )
      }
      {
        step === 2 && (
          <div className="space-y-6 w-full max-w-2xl mx-auto px-4">
            
            <div className="space-y-3 mb-6 p-5 bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-100">Booking Progress</h3>
                <span className="text-sm font-medium text-amber-400 bg-amber-900/50 px-3 py-1 rounded-full">
                  Step {normalizedStageIndex + 1} of {activeStages.length}
                </span>
              </div>
              <ProgressBar value={progress} className="mb-3" />
              <div className="flex gap-2 overflow-x-auto pb-2">
                {activeStages.map((stage: any, index: number) => {
                  const status =
                    index < normalizedStageIndex
                      ? "complete"
                      : index === normalizedStageIndex
                        ? "current"
                        : "upcoming";
                  const statusClasses =
                    status === "complete"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg"
                      : status === "current"
                        ? "border-2 border-yellow-500 shadow-md bg-gradient-to-r from-yellow-50 to-white"
                        : "border border-gray-200 bg-white shadow-sm text-gray-400";
                  
                  return (
                    <button
                      key={stage.id}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${statusClasses}`}
                      onClick={() => setStep(index + 1)}
                      disabled={index > normalizedStageIndex}
                    >
                      <div className="flex items-center gap-2">
                        {status === "complete" && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {stage.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video for vehicle selection */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-video max-h-[320px] w-full flex items-center justify-center mb-4 shadow-inner max-w-2xl mx-auto">
              <video
                ref={carVideoRef}
                src={getVideoSrc('/assets/detailing/6873165-mobile-720p.mp4')}
                muted
                loop
                playsInline
                autoPlay
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  console.error('Video failed to load:', e.currentTarget.src);
                  // Set a state to show fallback image when video fails
                  setVehicleVideoFailed(true);
                }}
              >
                <track kind="captions" />
                Your browser does not support the video tag.
              </video>
              {vehicleVideoFailed && (
                <img
                  src="/assets/detailing/wash-1.png"
                  alt="Vehicle selection"
                  className="absolute inset-0 w-full h-full object-cover rounded-lg max-w-2xl mx-auto"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </div>

            <div className="space-y-4 w-full max-w-lg mx-auto">
              {VEHICLE_CATEGORIES.map((vehicle) => {
                const status =
                  vehicleType === vehicle.id
                    ? "current"
                    : "upcoming";
                const statusClasses =
                  status === "current"
                    ? "border-2 border-yellow-400 shadow-sm"
                    : "border border-gray-200 opacity-60";
                
                return (
                  <Card
                    key={vehicle.id}
                    variant="glass"
                    hoverable
                    selected={vehicleType === vehicle.id}
                    className={`p-5 cursor-pointer transition-all duration-300 transform hover:scale-[1.03] border-2 ${vehicleType === vehicle.id ? 'border-yellow-500 shadow-2xl ring-2 ring-yellow-200' : 'border-gray-200 shadow-lg hover:shadow-xl'} rounded-2xl`}
                    onClick={() => {
                      setVehicleType(vehicle.id);
                      // Auto-progress to next step
                      setStep(3);
                    }}
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-2xl shadow-md">
                        {vehicle.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-xl">
                          {vehicle.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1.5">
                          {vehicle.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-yellow-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button variant="outline" onClick={handleGoBack} fullWidth>
                Back
              </Button>
            </div>
          </div>
        )
      }
      {
        step === 3 && (
          <div className="space-y-6 w-full max-w-2xl mx-auto px-4">
            

            <div className="space-y-3 mb-6 p-5 bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-100">Booking Progress</h3>
                <span className="text-sm font-medium text-amber-400 bg-amber-900/50 px-3 py-1 rounded-full">
                  Step {normalizedStageIndex + 1} of {activeStages.length}
                </span>
              </div>
              <ProgressBar value={progress} className="mb-3" />
              <div className="flex gap-2 overflow-x-auto pb-2">
                {activeStages.map((stage: any, index: number) => {
                  const status =
                    index < normalizedStageIndex
                      ? "complete"
                      : index === normalizedStageIndex
                        ? "current"
                        : "upcoming";
                  const statusClasses =
                    status === "complete"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg"
                      : status === "current"
                        ? "border-2 border-yellow-500 shadow-md bg-gradient-to-r from-yellow-50 to-white"
                        : "border border-gray-200 bg-white shadow-sm text-gray-400";
                  
                  return (
                    <button
                      key={stage.id}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${statusClasses}`}
                      onClick={() => setStep(index + 1)}
                      disabled={index > normalizedStageIndex}
                    >
                      <div className="flex items-center gap-2">
                        {status === "complete" && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {stage.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5 w-full">
              {CAR_SERVICE_PACKAGES.map((pkg) => {
                let displayPrice = getCarDetailingPrice(
                  vehicleType as VehicleType,
                  pkg.id,
                  paintStage || undefined,
                  midSUVTier,
                  fleetCarCount,
                );
                
                if (pkg.id === "PAINT-CORRECTION") {
                  // For paint correction package card, always show Stage 1 price
                  displayPrice = getCarDetailingPrice(
                    vehicleType as VehicleType,
                    pkg.id,
                    "STAGE-1",
                    midSUVTier,
                    fleetCarCount,
                  );
                }
                
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
                    variant="glass"
                    hoverable
                    selected={carServicePackage === pkg.id}
                    className={`p-5 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] border-2 ${carServicePackage === pkg.id ? 'border-indigo-500 shadow-2xl ring-2 ring-indigo-200' : 'border-gray-200 shadow-lg hover:shadow-xl'} rounded-2xl`}
                    onClick={() => {
                      setCarServicePackage(pkg.id);
                      // Auto-progress if not a special package that requires additional selections
                      if (pkg.id !== "PAINT-CORRECTION" && pkg.id !== "FLEET-PACKAGE") {
                        setStep(4);
                      } else {
                        // For special packages, allow user to configure additional options before advancing
                        if (pkg.id === "PAINT-CORRECTION") {
                          // User needs to select paint correction stage
                        } else if (pkg.id === "FLEET-PACKAGE") {
                          // User needs to select number of cars
                        }
                      }
                    }}
                  >
                    <div className="-mt-1 -mx-1 mb-2">
                      {pkg.id !== "FLEET-PACKAGE" && ( // Don't show media for fleet package
                        PACKAGE_VIDEOS[pkg.id] && !failedPackage[pkg.id] ? (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden shadow-lg relative aspect-video max-h-[220px] w-full border border-indigo-100 max-w-2xl mx-auto">
                            <video
                              className="w-full h-full object-cover"
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
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                          </div>
                        ) : PACKAGE_FALLBACK_IMAGES[pkg.id] ? (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden shadow-lg relative aspect-video max-h-[220px] w-full border border-indigo-100 max-w-2xl mx-auto">
                            <img
                              src={PACKAGE_FALLBACK_IMAGES[pkg.id]}
                              alt={pkg.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                          </div>
                        ) : null
                      )}
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">
                          {pkg.name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {pkg.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {pkg.duration}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-yellow-600 min-w-[140px] text-right whitespace-nowrap">
                          {pkg.id === "FLEET-PACKAGE"
                            ? formatCurrency(displayPrice)
                            : pkg.id === "PAINT-CORRECTION"
                              ? (displayPrice > 0 ? formatCurrency(displayPrice) : `KSH 5,000`)
                              : formatCurrency(displayPrice)}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            { }
            {carServicePackage === "PAINT-CORRECTION" && (
              <div className="mt-6 p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl shadow-sm">
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
                        variant="elevated"
                        hoverable
                        selected={paintStage === stage.id}
                        className={`py-3 px-3 cursor-pointer border-2 ${paintStage === stage.id ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-200' : 'border-indigo-200 shadow-md hover:shadow-lg'} rounded-xl transition-all duration-300`}
                        onClick={() => setPaintStage(stage.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-semibold text-gray-900 text-sm">
                              {stage.name}
                            </h5>
                            <p className="text-xs text-gray-600">
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
              <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl shadow-sm">
                <p className="font-semibold text-gray-900 mb-3">
                  Number of Cars:
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFleetCarCount((prev: number) => Math.max(2, prev - 1))}
                    className="w-12 h-12 rounded-full bg-gradient-to-b from-indigo-50 to-white border border-indigo-200 flex items-center justify-center text-xl font-bold hover:from-indigo-100 active:scale-95 transition-all duration-300 shadow-sm hover:shadow-md"
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
                    className="w-12 h-12 rounded-full bg-gradient-to-b from-indigo-50 to-white border border-indigo-200 flex items-center justify-center text-xl font-bold hover:from-indigo-100 active:scale-95 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Total: {formatCurrency(getCarDetailingPrice(vehicleType as VehicleType, "FLEET-PACKAGE", undefined, midSUVTier, fleetCarCount))}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} fullWidth>
                Back
              </Button>
              <Button
                onClick={() => {
                  // For paint correction, user must select a stage
                  if (carServicePackage === "PAINT-CORRECTION" && !paintStage) {
                    toast.error("Please select a paint correction stage");
                    return;
                  }
                  // For fleet package, user must select number of cars
                  if (carServicePackage === "FLEET-PACKAGE" && fleetCarCount < 2) {
                    toast.error("Please select at least 2 cars for fleet package");
                    return;
                  }
                  setStep(4);
                }}
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
          <div className="space-y-6 w-full max-w-2xl mx-auto px-4">
            <div className="space-y-3 mb-6 p-5 bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-100">Booking Progress</h3>
                <span className="text-sm font-medium text-amber-400 bg-amber-900/50 px-3 py-1 rounded-full">
                  Step {normalizedStageIndex + 1} of {activeStages.length}
                </span>
              </div>
              <ProgressBar value={progress} className="mb-3" />
              <div className="flex gap-2 overflow-x-auto pb-2">
                {activeStages.map((stage: any, index: number) => {
                  const status =
                    index < normalizedStageIndex
                      ? "complete"
                      : index === normalizedStageIndex
                        ? "current"
                        : "upcoming";
                  const statusClasses =
                    status === "complete"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg"
                      : status === "current"
                        ? "border-2 border-yellow-500 shadow-md bg-gradient-to-r from-yellow-50 to-white"
                        : "border border-gray-200 bg-white shadow-sm text-gray-400";
                  
                  return (
                    <button
                      key={stage.id}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${statusClasses}`}
                      onClick={() => setStep(index + 1)}
                      disabled={index > normalizedStageIndex}
                    >
                      <div className="flex items-center gap-2">
                        {status === "complete" && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {stage.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
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
              <div className="space-y-3 w-full max-w-lg mx-auto">
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

            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
              <Button variant="outline" onClick={() => setStep(3)} fullWidth className="min-h-12">
                Back
              </Button>
              <Button 
                onClick={() => {
                  // For fleet package, user must select number of cars
                  if (carServicePackage === "FLEET-PACKAGE" && fleetCarCount < 2) {
                    toast.error("Please select at least 2 cars for fleet package");
                    return;
                  }
                  setStep(5);
                }}
                fullWidth className="min-h-12">
                Continue
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
          <div className="space-y-6 w-full max-w-2xl mx-auto px-4">
            <div className="space-y-3 mb-6 p-5 bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-100">Booking Progress</h3>
                <span className="text-sm font-medium text-amber-400 bg-amber-900/50 px-3 py-1 rounded-full">
                  Step {normalizedStageIndex + 1} of {activeStages.length}
                </span>
              </div>
              <ProgressBar value={progress} className="mb-3" />
              <div className="flex gap-2 overflow-x-auto pb-2">
                {activeStages.map((stage: any, index: number) => {
                  const status =
                    index < normalizedStageIndex
                      ? "complete"
                      : index === normalizedStageIndex
                        ? "current"
                        : "upcoming";
                  const statusClasses =
                    status === "complete"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg"
                      : status === "current"
                        ? "border-2 border-yellow-500 shadow-md bg-gradient-to-r from-yellow-50 to-white"
                        : "border border-gray-200 bg-white shadow-sm text-gray-400";
                  
                  return (
                    <button
                      key={stage.id}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${statusClasses}`}
                      onClick={() => setStep(index + 1)}
                      disabled={index > normalizedStageIndex}
                    >
                      <div className="flex items-center gap-2">
                        {status === "complete" && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {stage.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="w-full">
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

            <div className="w-full">
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

            <div className="w-full">
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

            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
              <Button variant="outline" onClick={() => setStep(4)} fullWidth className="min-h-12">
                Back
              </Button>
              <Button onClick={() => setStep(6)} fullWidth className="min-h-12">
                Review
              </Button>
            </div>
          </div>
        )
      }

      { }
      {
        step === 6 && (
          <div className="space-y-6 w-full max-w-2xl mx-auto px-4">
            <div className="space-y-3 mb-6 p-5 bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-100">Booking Progress</h3>
                <span className="text-sm font-medium text-amber-400 bg-amber-900/50 px-3 py-1 rounded-full">
                  Step {normalizedStageIndex + 1} of {activeStages.length}
                </span>
              </div>
              <ProgressBar value={progress} className="mb-3" />
              <div className="flex gap-2 overflow-x-auto pb-2">
                {activeStages.map((stage: any, index: number) => {
                  const status =
                    index < normalizedStageIndex
                      ? "complete"
                      : index === normalizedStageIndex
                        ? "current"
                        : "upcoming";
                  const statusClasses =
                    status === "complete"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg"
                      : status === "current"
                        ? "border-2 border-yellow-500 shadow-md bg-gradient-to-r from-yellow-50 to-white"
                        : "border border-gray-200 bg-white shadow-sm text-gray-400";
                  
                  return (
                    <button
                      key={stage.id}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${statusClasses}`}
                      onClick={() => setStep(index + 1)}
                      disabled={index > normalizedStageIndex}
                    >
                      <div className="flex items-center gap-2">
                        {status === "complete" && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {stage.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <Card className="p-4 sm:p-6 bg-gray-50">
              <h3 className="font-bold text-lg mb-4">Booking Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold">Car Detailing</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold text-right">
                    {location.address || location.manualAddress || (location.coordinates ? 
                      `${location.coordinates[0].toFixed(4)}, ${location.coordinates[1].toFixed(4)}` : 
                      'No location set')}
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

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button variant="outline" onClick={() => setStep(5)} fullWidth className="min-h-12">
                Back
              </Button>
              <Button
                fullWidth
                onClick={handleBookingSubmit}
                disabled={isSubmitting}
                className="min-h-12 mt-4"
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
