import type {
  BookingData,
  BookingHistoryItem,
  CleanerChecklistItem,
  CleanerJobOpportunity,
  CleanerProfile,
  BeforeAfterPhoto,
  UserAccountSession,
} from "./types";
import { API_BASE_URL } from "./config";
import { logger } from "./logger";

const BOOKING_KEY = "cleancloak-booking";
const HISTORY_KEY = "cleancloak-history";
const CLEANER_PROFILE_KEY = "cleancloak-cleaner-profile";
const CLEANER_PENDING_KEY = "cleancloak-pending-cleaners";
const CLEANER_APPROVED_KEY = "cleancloak-approved-cleaners";
const CLEANER_JOB_OPPORTUNITIES_KEY = "cleancloak-job-opportunities";
const CLEANER_CHECKLIST_KEY = "cleancloak-job-checklist";
const CLEANER_BEFORE_AFTER_KEY = "cleancloak-before-after-gallery";
export const USER_SESSION_KEY = "cleancloak-user-session";

const OPPORTUNITIES_ENDPOINT = "/bookings/opportunities";
const JOB_PRIORITY_THRESHOLD = 15000;


export const getStoredAuthToken = (): string | null => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const currencyFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

function saveCleanerJobOpportunities(jobs: CleanerJobOpportunity[]): void {
  try {
    localStorage.setItem(CLEANER_JOB_OPPORTUNITIES_KEY, JSON.stringify(jobs));
  } catch (error) {
    logger.error("Failed to save cleaner job opportunities:", error instanceof Error ? error : undefined);
  }
}

function withDefaultJobState(
  jobs: CleanerJobOpportunity[],
): CleanerJobOpportunity[] {
  return jobs.map((job) => ({ ...job, saved: job.saved ?? false }));
}

export async function refreshCleanerJobOpportunities(): Promise<
  CleanerJobOpportunity[]
> {
  try {
    const response = await fetch(`${API_BASE_URL}${OPPORTUNITIES_ENDPOINT}`, {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch opportunities: ${response.status}`);
    }
    const data = await response.json();
    const opportunities = Array.isArray(data?.opportunities)
      ? data.opportunities
      : [];
    const normalized = withDefaultJobState(opportunities);
    saveCleanerJobOpportunities(normalized);
    return normalized;
  } catch (error) {
    console.warn("Falling back to cached opportunities:", error);
    return loadCleanerJobOpportunities();
  }
}

export function loadCleanerJobOpportunities(): CleanerJobOpportunity[] {
  try {
    const saved = localStorage.getItem(CLEANER_JOB_OPPORTUNITIES_KEY);
    if (saved) {
      return withDefaultJobState(JSON.parse(saved));
    }
    
    return [];
  } catch (error) {
    logger.error("Failed to load cleaner job opportunities:", error instanceof Error ? error : undefined);
    return [];
  }
}

export function toggleSavedJob(jobId: string): CleanerJobOpportunity[] {
  const jobs = loadCleanerJobOpportunities();
  const updated = jobs.map((job) =>
    job.id === jobId ? { ...job, saved: !job.saved } : job,
  );
  saveCleanerJobOpportunities(updated);
  return updated;
}

export function addBookingToCleanerJobs(
  booking: BookingData,
): CleanerJobOpportunity[] {
  const jobs = loadCleanerJobOpportunities();
  const id = booking.id || `booking-${Date.now()}`;
  const titleParts = [booking.carServicePackage, booking.vehicleType].filter(
    Boolean,
  );

  
  const cleanerPayout = Math.round((booking.price || 0) * 0.6);

  const opportunity: CleanerJobOpportunity = {
    id,
    bookingId: booking.id,
    title: titleParts.join(" · ") || "Car Detailing Job",
    location:
      booking.location?.manualAddress ||
      booking.location?.address ||
      "Client to confirm exact location",
    payout: currencyFormatter.format(cleanerPayout),
    timing:
      booking.bookingType === "scheduled" && booking.scheduledDate
        ? `${booking.scheduledDate}${booking.scheduledTime ? ` · ${booking.scheduledTime}` : ""}`
        : "Immediate dispatch",
    requirements: [
      booking.vehicleType ? `Vehicle: ${booking.vehicleType}` : null,
      booking.carServicePackage
        ? `Package: ${booking.carServicePackage}`
        : null,
      booking.scheduledTime ? `Preferred time: ${booking.scheduledTime}` : null,
    ].filter(Boolean) as string[],
    serviceCategory: booking.serviceCategory,
    priority:
      (booking.price || 0) >= JOB_PRIORITY_THRESHOLD ? "featured" : "standard",
    saved: false,
    createdAt: booking.createdAt || new Date().toISOString(),
  };
  const updated = [opportunity, ...jobs];
  saveCleanerJobOpportunities(updated);
  return updated;
}

function saveCleanerChecklist(items: CleanerChecklistItem[]): void {
  try {
    localStorage.setItem(CLEANER_CHECKLIST_KEY, JSON.stringify(items));
  } catch (error) {
    logger.error("Failed to save cleaner checklist:", error instanceof Error ? error : undefined);
  }
}

export function loadCleanerChecklist(): CleanerChecklistItem[] {
  try {
    const saved = localStorage.getItem(CLEANER_CHECKLIST_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    
    return [];
  } catch (error) {
    logger.error("Failed to load cleaner checklist:", error instanceof Error ? error : undefined);
    return [];
  }
}

export function toggleChecklistItem(itemId: string): CleanerChecklistItem[] {
  const checklist = loadCleanerChecklist();
  const updated = checklist.map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item,
  );
  saveCleanerChecklist(updated);
  return updated;
}

export function saveCurrentBooking(booking: BookingData): void {
  try {
    localStorage.setItem(BOOKING_KEY, JSON.stringify(booking));
  } catch (error) {
    logger.error("Failed to save booking:", error instanceof Error ? error : undefined);
  }
}

export function loadCurrentBooking(): BookingData | null {
  try {
    const saved = localStorage.getItem(BOOKING_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    logger.error("Failed to load booking:", error instanceof Error ? error : undefined);
    return null;
  }
}

export function clearCurrentBooking(): void {
  try {
    localStorage.removeItem(BOOKING_KEY);
  } catch (error) {
    logger.error("Failed to clear booking:", error instanceof Error ? error : undefined);
  }
}

export function saveToHistory(booking: BookingData): void {
  try {
    const history = loadHistory();
    const historyItem: BookingHistoryItem = {
      ...booking,
      id: booking.id || `booking-${Date.now()}`,
      status: booking.status || "pending",
      createdAt: booking.createdAt || new Date().toISOString(),
    };
    history.unshift(historyItem);
    
    const trimmed = history.slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    logger.error("Failed to save to history:", error instanceof Error ? error : undefined);
  }
}

export function loadHistory(): BookingHistoryItem[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    logger.error("Failed to load history:", error instanceof Error ? error : undefined);
    return [];
  }
}

export function updateHistoryItem(
  id: string,
  updates: Partial<BookingHistoryItem>,
): void {
  try {
    const history = loadHistory();
    const index = history.findIndex((item) => item.id === id);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    logger.error("Failed to update history item:", error instanceof Error ? error : undefined);
  }
}


export const saveBooking = saveCurrentBooking;
export const addToHistory = saveToHistory;


export function saveCleanerProfile(profile: CleanerProfile): void {
  try {
    localStorage.setItem(CLEANER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    logger.error("Failed to save cleaner profile:", error instanceof Error ? error : undefined);
  }
}

export function loadCleanerProfile(): CleanerProfile | null {
  try {
    const saved = localStorage.getItem(CLEANER_PROFILE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    logger.error("Failed to load cleaner profile:", error instanceof Error ? error : undefined);
    return null;
  }
}

export function clearCleanerProfile(): void {
  try {
    localStorage.removeItem(CLEANER_PROFILE_KEY);
  } catch (error) {
    logger.error("Failed to clear cleaner profile:", error instanceof Error ? error : undefined);
  }
}

function savePendingCleaners(cleaners: CleanerProfile[]): void {
  try {
    localStorage.setItem(CLEANER_PENDING_KEY, JSON.stringify(cleaners));
  } catch (error) {
    logger.error("Failed to save pending cleaners:", error instanceof Error ? error : undefined);
  }
}

export function loadPendingCleaners(): CleanerProfile[] {
  try {
    const saved = localStorage.getItem(CLEANER_PENDING_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    logger.error("Failed to load pending cleaners:", error instanceof Error ? error : undefined);
    return [];
  }
}

export function addPendingCleaner(profile: CleanerProfile): void {
  const cleaners = loadPendingCleaners();
  const existingIndex = cleaners.findIndex((c) => c.id === profile.id);
  if (existingIndex !== -1) {
    cleaners[existingIndex] = profile;
  } else {
    cleaners.push(profile);
  }
  savePendingCleaners(cleaners);
}

export function removePendingCleaner(id: string): void {
  const cleaners = loadPendingCleaners().filter((c) => c.id !== id);
  savePendingCleaners(cleaners);
}

function saveApprovedCleaners(cleaners: CleanerProfile[]): void {
  try {
    localStorage.setItem(CLEANER_APPROVED_KEY, JSON.stringify(cleaners));
  } catch (error) {
    logger.error("Failed to save approved cleaners:", error instanceof Error ? error : undefined);
  }
}

export function loadApprovedCleaners(): CleanerProfile[] {
  try {
    const saved = localStorage.getItem(CLEANER_APPROVED_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    logger.error("Failed to load approved cleaners:", error instanceof Error ? error : undefined);
    return [];
  }
}

export function addApprovedCleaner(profile: CleanerProfile): void {
  const cleaners = loadApprovedCleaners();
  const existingIndex = cleaners.findIndex((c) => c.id === profile.id);
  if (existingIndex !== -1) {
    cleaners[existingIndex] = profile;
  } else {
    cleaners.push(profile);
  }
  saveApprovedCleaners(cleaners);
}

export function updateStoredCleanerProfile(
  id: string,
  updates: Partial<CleanerProfile>,
): void {
  const existing = loadCleanerProfile();
  if (existing && existing.id === id) {
    const updated = { ...existing, ...updates };
    saveCleanerProfile(updated);
  }
}


export function saveUserSession(session: UserAccountSession): void {
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    logger.error("Failed to save user session:", error instanceof Error ? error : undefined);
  }
}

export const loadUserSession = (): UserAccountSession | null => {
  try {
    const saved = localStorage.getItem(USER_SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    logger.error("Failed to load user session:", error instanceof Error ? error : undefined);
    return null;
  }
};

export const clearUserSession = () => {
  try {
    localStorage.removeItem(USER_SESSION_KEY);
  } catch (error) {
    logger.error("Failed to clear user session:", error instanceof Error ? error : undefined);
  }
};
