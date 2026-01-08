
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookingEnhanced from "./pages/BookingEnhanced";
import BookingHistory from "./pages/BookingHistory";
import CleanerProfile from "./pages/CleanerProfile";
import { LoginForm } from "./components/ui";
import { loadUserSession, clearUserSession } from "./lib/storage";
import ErrorBoundary from "./components/ErrorBoundary";
import { authAPI } from "@/lib/api";
import { NotificationCenter } from "./components/NotificationCenter";
import { API_BASE_URL } from "./lib/config";



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

type Page = "booking" | "history" | "profile";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab") as Page | null;
    return tab && ["booking", "history", "profile"].includes(tab) ? tab : "booking";
  });
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode) {
      setDarkMode(savedMode === "true");
    }
  }, []);



  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);


  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab") as Page | null;
    if (tab && tab !== currentPage && ["booking", "history", "profile"].includes(tab)) {
      setCurrentPage(tab);
    }

  }, [location.search]);

  const setTab = (page: Page) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    const params = new URLSearchParams(location.search);
    params.set("tab", page);
    navigate({ pathname: "/", search: params.toString() });
  };


  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(location.search);
      const tab = params.get("tab") as Page | null;
      if (tab && ["booking", "history", "profile"].includes(tab)) {
        setCurrentPage(tab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [location.search]);


  useEffect(() => {
    const handleHardwareBackButton = () => {
      const params = new URLSearchParams(location.search);
      const tab = params.get("tab") as Page | null;


      if (tab && ["history", "profile"].includes(tab)) {
        setTab("booking");
      } else {


        if (window.history.length === 1) {

          getCapacitor().then(Capacitor => {
            if (Capacitor.isNativePlatform()) {

              import("@capacitor/app").then(module => {
                module.App.exitApp();
              });
            }
          });
        } else {
          window.history.back();
        }
      }
    };


    getCapacitor().then(capacitorInstance => {
      if (capacitorInstance.isNativePlatform()) {
        import("@capacitor/app").then(module => {
          module.App.addListener('backButton', handleHardwareBackButton);
        });
      }
    });


    return () => {
      getCapacitor().then(capacitorInstance => {
        if (capacitorInstance.isNativePlatform()) {
          import("@capacitor/app").then(module => {
            module.App.removeAllListeners();
          });
        }
      });
    };
  }, [location.search]);





  const isValidTabRoute = location.pathname === "/" &&
    (location.search === "" ||
      location.search.startsWith("?tab=booking") ||
      location.search.startsWith("?tab=history") ||
      location.search.startsWith("?tab=profile"));


  const excludedPaths = ["/profile", "/completed-bookings", "/active-booking", "/admin", "/jobs", "/cleaner-active", "/cleaner-profile", "/earnings"];
  const isExcludedPath = excludedPaths.some(path => location.pathname.startsWith(path));


  const isSubRoute = location.pathname !== "/";


  useEffect(() => {
    if (location.pathname !== "/") {


      console.warn("AppEnhanced accessed on non-root path, redirecting to /");
    }
  }, [location.pathname]);


  useEffect(() => {
    const registerPushNotifications = async () => {
      try {
        const capacitorInstance = await getCapacitor();
        if (capacitorInstance.isNativePlatform()) {
          try {

            const pushNotificationModule = await import('./lib/pushNotifications');
            if (pushNotificationModule && pushNotificationModule.PushNotificationService) {
              await pushNotificationModule.PushNotificationService.registerForNotifications();
            }
          } catch (importError) {
            console.error('Error importing push notifications:', importError);
          }
        }
      } catch (error) {
        console.error('Error in push notification registration process:', error);
      }
    };

    registerPushNotifications();
  }, []);

  return (
    <ErrorBoundary>
      <div className={`min-h-screen relative overflow-y-auto overflow-x-hidden`}>
        { }
        <div
          className="fixed inset-0 z-0"
          style={{
            background: darkMode
              ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
              : "linear-gradient(135deg, #bbdefb 0%, #64b5f6 100%)",
            backgroundSize: "400% 400%",
          }}
        >
          { }
          <div
            className={`absolute inset-0 ${darkMode ? "bg-black/30" : "bg-white/20"}`}
          ></div>
        </div>

        { }
        <div className="relative z-10 container max-w-5xl mx-auto px-4 py-2 animate-fade">
          { }
          <div
            className={
              `relative text-center mb-0 py-3 px-6 rounded-3xl ${darkMode ? "bg-gray-800/40 border-gray-600/50" : "bg-white/60 border-white/40"} border`
            }
          >
            <h1
              className={`text-4xl md:text-5xl font-black tracking-tight mb-3 ${darkMode ? "text-white" : "text-black drop-shadow-lg"}`}
            >
              Welcome to CleanCloak
            </h1>
            <p
              className={`text-base md:text-lg font-semibold ${darkMode ? "text-gray-100" : "text-black drop-shadow-md"} uppercase`}
            >
              ELEVATING SPACES AND EMPOWERING CLEANERS THROUGH TECH
            </p>
          </div>

          { }
          <header className="mb-0">
            <div
              className={`flex items-center justify-between mb-0 pb-2 border-b backdrop-blur-sm ${darkMode ? "border-gray-600/50" : "border-white/30"
                }`}
            >

              <div className="flex items-center gap-3">


              </div>
            </div>

            { }
            {isValidTabRoute && !isExcludedPath && !isSubRoute && (
              <div
                className={`mb-1 rounded-2xl backdrop-blur-sm border ${darkMode
                  ? "bg-gray-900/40 border-gray-700/50"
                  : "bg-white/40 border-white/50"
                  }`}
              >
                <div className="flex justify-around py-3">
                  <button
                    onClick={() => setTab("booking")}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ${currentPage === "booking"
                      ? darkMode
                        ? "text-yellow-400 bg-gray-800/30"
                        : "text-yellow-600 bg-white/50 shadow-md"
                      : darkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span className="text-xs font-medium text-center mt-1">Book</span>
                  </button>
                  <button
                    onClick={() => setTab("history")}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ${currentPage === "history"
                      ? darkMode
                        ? "text-yellow-400 bg-gray-800/30"
                        : "text-yellow-600 bg-white/50 shadow-md"
                      : darkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-xs font-medium text-center mt-1">History</span>
                  </button>
                  <button
                    onClick={() => setTab("profile")}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ${currentPage === "profile"
                      ? darkMode
                        ? "text-yellow-400 bg-gray-800/30"
                        : "text-yellow-600 bg-white/50 shadow-md"
                      : darkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-xs font-medium text-center mt-1">Profile</span>
                  </button>
                </div>
              </div>
            )}

            { }
            <main
              className={
                `rounded-3xl border p-6 pt-1 overflow-x-auto max-w-full mb-2 ${darkMode
                  ? "bg-gray-900/30 border-gray-700/40"
                  : "bg-white/70 border-white/40"
                }`
              }
            >
              {(isValidTabRoute && !isExcludedPath && !isSubRoute) ? (
                <>
                  {currentPage === "booking" && <BookingEnhanced />}
                  {currentPage === "history" && <BookingHistory />}
                  {currentPage === "profile" && (
                    <div className="flex gap-4 max-w-2xl mx-auto">
                      <button
                        onClick={() => navigate("/profile")}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        My Profile
                      </button>
                      <button
                        onClick={() => navigate("/completed-bookings")}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Payments
                      </button>
                    </div>
                  )}
                </>
              ) : (

                <div className="flex flex-col items-center justify-center py-2">
                  <div className="text-center max-w-md mx-auto relative">
                    <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">
                      Welcome to CleanCloak
                    </h2>
                    <p className="text-black dark:text-gray-300 mb-6">
                      Navigate to the appropriate section using the menu
                    </p>
                  </div>
                </div>
              )}
            </main>
          </header>



          { }
          <footer
            className={`mt-8 text-center text-sm font-medium ${darkMode ? "text-gray-400" : "text-black"
              }`}
          >
            <p className="backdrop-blur-sm bg-white/10 rounded-full px-6 py-2 inline-block uppercase text-black">
              ELEVATING SPACES AND EMPOWERING CLEANERS THROUGH TECH
            </p>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}
