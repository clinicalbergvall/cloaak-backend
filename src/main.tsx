import React from "react";

// Workaround for React import issues
const { Suspense, useEffect } = React as any;
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import AppEnhanced from "./AppEnhanced";
import LandingPage from "./LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import CleanerJobs from "./pages/cleanersjob";
import VerificationPending from "./pages/VerificationPending";
import AdminRegister from "./pages/AdminRegister";
import ClientProfile from "./pages/ClientProfile";
import ActiveBooking from "./pages/ActiveBooking";
import CleanerProfile from "./pages/CleanerProfile";
import CleanerActiveBookings from "./pages/CleanerActiveBookings";
import CompletedBookings from "./pages/CompletedBookings";
import Earnings from "./pages/Earnings";
import { LoginForm, AdminLoginForm } from "./components/ui";
import { loadUserSession, getStoredAuthToken, setupSessionSync, saveUserSession, clearUserSession } from './lib/storage';
import { NotificationProvider } from "./contexts/NotificationContext";
import { API_BASE_URL } from "./lib/config";
import { api } from "./lib/api";
import "./index.css";
import { Toaster, toast } from "react-hot-toast";


const getCapacitor = async () => {
  try {
    const capacitorModule = await import("@capacitor/core");
    return capacitorModule.Capacitor;
  } catch (err) {
    console.warn("Capacitor not available in this environment:", err);
    
    return {
      isNativePlatform: () => false,
    };
  }
};


try {
  if (import.meta.env.MODE === "production" && !import.meta.env.VITE_API_URL) {
    console.error("CRITICAL: VITE_API_URL is not set in production!");
  }
} catch (error) {
  console.warn("Environment check failed:", error);
}

console.log("App starting with API:", API_BASE_URL);


window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});


export const showNotification = (
  message: string,
  type: "success" | "error" | "info" = "info",
) => {
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    default:
      toast(message);
  }
};


const ProtectedRoute = ({
  children,
  requiredRole,
}: {
  children: any;
  requiredRole?: string;
}) => {
  const [checked, setChecked] = React.useState(false);
  const [localSession, setLocalSession] = React.useState(loadUserSession());
  const hasValidatedRef = React.useRef(false);

  useEffect(() => {
    let cancelled = false;

    
    const timeoutId = setTimeout(() => {
      if (!cancelled && !hasValidatedRef.current) {
        setChecked(true);
      }
    }, 5000); 

    
    const cleanup = setupSessionSync((sessionData) => {
      if (!cancelled) {
        setLocalSession(sessionData);
      }
    });

    
    const validateSession = async () => {
      if (hasValidatedRef.current) return;
      hasValidatedRef.current = true;

      try {
        const res = await api.get("/auth/me");
        if (res.ok) {
          const data = await res.json();
          const u = (data && (data.user || data)) || {};
          const hydrated = {
            ...u,
            userType: u.userType || u.role,
            name: u.name || "",
            phone: u.phone || "",
            lastSignedIn: new Date().toISOString(),
          };
          
          saveUserSession(hydrated);
          if (!cancelled) {
            setLocalSession(hydrated);
          }
        } else {
          clearUserSession();
          if (!cancelled) {
            setLocalSession(null);
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error validating session:', error);
        }
        
        const fallbackSession = loadUserSession();
        if (fallbackSession && !cancelled) {
          setLocalSession(fallbackSession);
        } else if (!cancelled) {
          setLocalSession(null);
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setChecked(true);
        }
      }
    };

    validateSession();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (cleanup) cleanup();
    };
  }, []); 

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-yellow-500"></div>
      </div>
    );
  }

  if (!localSession) {
    if (requiredRole === "admin") {
      return <AdminLoginForm onAuthSuccess={() => window.location.reload()} />;
    }
    return <LoginForm onAuthSuccess={() => window.location.reload()} />;
  }

  if (requiredRole && localSession.userType !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Block unverified cleaners from accessing any protected cleaner route EXCEPT the pending page itself
  if (localSession.userType === 'cleaner') {
    const isUnverified = localSession.verificationStatus !== 'verified' && !localSession.isVerified;
    const isAtPendingPage = window.location.pathname === '/pending-verification';
    
    if (isUnverified && !isAtPendingPage) {
      return <Navigate to="/pending-verification" replace />;
    }
    
    // If successfully verified while at pending page, redirect forward to jobs
    if (!isUnverified && isAtPendingPage) {
      return <Navigate to="/jobs" replace />;
    }
  }

  return <>{children}</>;
};


const ErrorBoundary: React.FC<{ children: any }> = ({ children }: { children: any }) => {
  return <>{children}</>;
}


const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backPressWindowMs = 2000;
  const lastBackPressRef = React.useRef(0);

  useEffect(() => {
    let backButtonListener: any = null;

    
    (async () => {
      try {
        const capacitorInstance = await getCapacitor();
        if (capacitorInstance.isNativePlatform()) {
          const appModule = await import("@capacitor/app");
          backButtonListener = await appModule.App.addListener(
            "backButton",
            () => {
              const evt = new CustomEvent("app:hardwareBack", { cancelable: true });
              const proceed = document.dispatchEvent(evt);
              if (!proceed) return;

              // Check if we're in the booking flow and need to handle internal step navigation
              const isBookingFlow = location.pathname === "/" && location.search.includes("tab=booking");
              
              if (isBookingFlow) {
                // Dispatch a custom event to notify the booking component to go back a step
                const bookingBackEvent = new CustomEvent("booking:stepBack", { cancelable: true });
                const bookingHandled = document.dispatchEvent(bookingBackEvent);
                
                // If the booking component handled the back step, we're done
                if (!bookingHandled) {
                  // If booking component didn't handle it (e.g., at step 1), navigate to previous route
                  const atRoot = location.pathname === "/";
                  if (!atRoot) {
                    navigate(-1 as unknown as string);
                    return;
                  }

                  if (window.history.length > 1) {
                    navigate(-1 as unknown as string);
                    return;
                  }

                  const now = Date.now();
                  if (now - lastBackPressRef.current < backPressWindowMs) {
                    appModule.App.exitApp();
                  } else {
                    lastBackPressRef.current = now;
                    toast("Press back again to exit");
                  }
                }
              } else {
                // Handle back navigation for other routes normally
                const atRoot = location.pathname === "/";
                if (!atRoot) {
                  navigate(-1 as unknown as string);
                  return;
                }

                if (window.history.length > 1) {
                  navigate(-1 as unknown as string);
                  return;
                }

                const now = Date.now();
                if (now - lastBackPressRef.current < backPressWindowMs) {
                  appModule.App.exitApp();
                } else {
                  lastBackPressRef.current = now;
                  toast("Press back again to exit");
                }
              }
            },
          );
        }
      } catch (error) {
        console.warn('Back button handler failed:', error);
      }
    })();

    return () => {
      (async () => {
        if (backButtonListener) {
          try {
            const appModule = await import("@capacitor/app");
            await appModule.App.removeAllListeners();
          } catch (error) {
            console.warn('Failed to remove back button listener:', error);
          }
        }
      })();
    };
  }, [navigate, location]);

  return null;
};

const Root = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <NotificationProvider>
          <BackButtonHandler />
          <Suspense
            fallback={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400"></div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/register" element={<AdminRegister />} />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute requiredRole="cleaner">
                    <CleanerJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cleaner-active"
                element={
                  <ProtectedRoute requiredRole="cleaner">
                    <CleanerActiveBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cleaner-profile"
                element={
                  <ProtectedRoute requiredRole="cleaner">
                    <CleanerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/earnings"
                element={
                  <ProtectedRoute requiredRole="cleaner">
                    <Earnings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pending-verification"
                element={
                  <ProtectedRoute requiredRole="cleaner">
                    <VerificationPending />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test-login"
                element={
                  <LoginForm
                    onAuthSuccess={() => (window.location.href = "/")}
                  />
                }
              />
            </Routes>
          </Suspense>
        </NotificationProvider>
      </ErrorBoundary>
      <Toaster position="top-right" toastOptions={{
        
        className: 'cleancloak-toast',
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#f3f4f6',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          maxWidth: '350px',
          zIndex: 9999,
        },
      }} />
    </BrowserRouter>
  );
};




const initializeApp = () => {
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderApp();
    });
  } else {
    renderApp();
  }
};

const renderApp = () => {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      console.error("Root element not found");
      return;
    }

    ReactDOM.createRoot(rootElement).render(
      <>
        <Root />
      </>,
    );
  } catch (error) {
    console.error("Failed to initialize app:", error);
    
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px; background-color: #f3f4f6;">
          <div>
            <h1 style="color: #FACC15; margin-bottom: 16px; font-family: sans-serif; font-size: 24px;">CleanCloak Detailer</h1>
            <p style="color: #6B7280; margin-bottom: 8px; font-family: sans-serif;">App failed to load</p>
            <p style="color: #9CA3AF; font-size: 14px; font-family: sans-serif;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p style="color: #9CA3AF; font-size: 12px; font-family: sans-serif; margin-top: 10px;">Check browser console for more details</p>
          </div>
        </div>
      `;
    }
  }
};


initializeApp();
