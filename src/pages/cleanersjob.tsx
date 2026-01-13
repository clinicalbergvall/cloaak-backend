import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Badge, Button } from "@/components/ui";
import CleanerLayout from "@/components/CleanerLayout";
import type { CleanerJobOpportunity, CleanerProfile } from "@/lib/types";

import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import { LocationMap } from "@/components/ui";

export default function CleanerJobs() {
  const [jobs, setJobs] = useState<CleanerJobOpportunity[]>([]);
  const [profile, setProfile] = useState<CleanerProfile | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocationJob, setSelectedLocationJob] = useState<CleanerJobOpportunity | null>(null);
  const navigate = useNavigate();

  const handleViewLocation = (job: CleanerJobOpportunity) => {
    // Validate coordinates before setting the job to view
    const hasValidCoordinates = job.coordinates && 
      Array.isArray(job.coordinates) && 
      job.coordinates.length === 2 &&
      typeof job.coordinates[0] === 'number' &&
      typeof job.coordinates[1] === 'number' &&
      !isNaN(job.coordinates[0]) &&
      !isNaN(job.coordinates[1]) &&
      isFinite(job.coordinates[0]) &&
      isFinite(job.coordinates[1]);
    
    if (hasValidCoordinates || job.location) {
      setSelectedLocationJob(job);
    } else {
      console.warn("Location data is not available or invalid", job);
      toast.error("Location data is not available or invalid");
    }
  };

  const handleCloseLocationModal = () => {
    setSelectedLocationJob(null);
  };

  
  const calculateCleanerPayout = (payout: string): string => {
    
    const numericValue = parseFloat(payout.replace(/[^0-9.-]+/g, ""));
    if (isNaN(numericValue)) return payout; 

    
    const cleanerEarning = numericValue * 0.4;
    return `KSh ${Math.round(cleanerEarning).toLocaleString()}`;
  };

  
  useEffect(() => {
    fetchAllData();

    
    const interval = setInterval(() => {
      
      
      
      
      
      fetchAllData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      
      try {
        const profileRes = await api.get("/cleaners/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile);
        } else {
          logger.error("Failed to fetch profile, status:", new Error(`HTTP ${profileRes.status}`));
        }
      } catch (error) {
        logger.error("Error fetching profile:", error instanceof Error ? error : undefined);
        if (showLoading) toast.error("Could not load profile");
      }

      
      try {
        const jobsRes = await api.get("/bookings/opportunities?limit=50");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(jobsData.opportunities || []);
        } else {
          logger.error("Failed to fetch jobs, status:", new Error(`HTTP ${jobsRes.status}`));
        }
      } catch (error) {
        logger.error("Error fetching jobs:", error instanceof Error ? error : undefined);
        if (showLoading) toast.error("Could not load job opportunities");
      }
    } catch (error) {
      logger.error("Data fetch error:", error instanceof Error ? error : undefined);
      if (showLoading) toast.error("Failed to load data");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const displayedJobs = useMemo(() => {
    if (!profile?.services?.length) return jobs;
    return jobs.filter((job: any) =>
      profile.services?.includes(job.serviceCategory),
    );
  }, [jobs, profile]);



  const handleRefreshJobs = async () => {
    try {
      setIsRefreshing(true);
      await fetchAllData();
      toast.success("Job feed updated! 🎉");
    } catch (error) {
      logger.error("Unable to refresh jobs", error instanceof Error ? error : undefined);
      toast.error("Could not refresh job feed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAcceptBooking = async (job: CleanerJobOpportunity) => {
    if (!job.bookingId) {
      toast.error("This opportunity does not include a booking reference");
      return;
    }
    try {
      const res = await api.post(`/bookings/${job.bookingId}/accept`, {});
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to accept booking");
      }
      const data = await res.json();
      toast.success(data.message || "Booking accepted! 🎉");
      setJobs((prev: any) => prev.filter((item: any) => item.id !== job.id));
      
      fetchAllData();
      
      navigate("/cleaner-active");
    } catch (error) {
      logger.error("Accept booking error:", error instanceof Error ? error : undefined);
      toast.error(
        error instanceof Error ? error.message : "Failed to accept booking",
      );
    }
  };

  if (isLoading) {
    return (
      <CleanerLayout currentPage="jobs">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center animate-up">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Loading job opportunities...
            </p>
          </div>
        </div>
      </CleanerLayout>
    );
  }

  return (
    <CleanerLayout currentPage="jobs">
      <div className="space-y-6">
        {}
        <div className="text-center animate-up">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Available Jobs
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {profile?.firstName && (
              <Badge variant="warning" className="mb-3">
                🚀 {profile.firstName}, you're live on CleanCloak
              </Badge>
            )}
          </p>
          <p className="text-gray-600 mt-2">
            {profile?.services?.length
              ? `Showing ${displayedJobs.length} gigs matching your ${profile.services.join(" & ")} services.`
              : "Browse curated gigs that match your skills and keep payouts flowing every week."}
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          {}
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-6 border border-gray-100 shadow-sm hover-lift">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                    Available Opportunities
                  </p>
                  <h2 className="text-xl font-bold text-gray-900">
                    Top Matches for You
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="warning" className="hidden sm:flex">
                    Smart Match
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefreshJobs}
                    disabled={isRefreshing}
                    className="transition-all"
                  >
                    {isRefreshing ? "🔄 Refreshing…" : "🔄 Refresh"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {displayedJobs.length === 0 ? (
                  <Card className="p-8 text-center bg-gray-50 border-dashed border-2 border-gray-200">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📭</span>
                    </div>
                    <p className="text-gray-900 font-semibold mb-2">
                      No Jobs Available
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      {profile?.services?.length
                        ? "No jobs match your services yet—check back soon."
                        : "Add your services to see matching jobs."}
                    </p>
                    <Button onClick={handleRefreshJobs} disabled={isRefreshing}>
                      Refresh Jobs
                    </Button>
                  </Card>
                ) : (
                  displayedJobs.map((job: any) => (
                    <Card
                      key={job.id}
                      className="p-5 border border-gray-100 bg-white space-y-4 hover:border-yellow-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            {job.title}
                          </h3>
                          {job.priority && (
                            <Badge
                              variant={
                                job.priority === "featured"
                                  ? "warning"
                                  : "outline"
                              }
                              className="capitalize shrink-0"
                            >
                              {job.priority === "auto-team"
                                ? "🤖 Auto"
                                : `⭐ ${job.priority}`}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <span>📍</span>
                            <span>{job.location}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span>🕐</span>
                            <span>{job.timing}</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {job.coordinates && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleViewLocation(job)}
                            >
                              🗺️ View Location
                            </Button>
                          )}
                        </div>
                        <p className="text-xl font-bold text-emerald-600">
                          {calculateCleanerPayout(job.payout)}
                        </p>
                      </div>

                      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                        <p className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                          <span>📋</span>
                          <span>Requirements</span>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-1">
                          {job.requirements.map((item: any, i: any) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex gap-3 flex-wrap pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold shadow-md hover:shadow-lg transition-all"
                          onClick={() => handleAcceptBooking(job)}
                          disabled={!job.bookingId}
                        >
                          🎯 Accept Job
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          {}
          <div className="space-y-6">
            {}
            <Card className="p-6 border border-gray-100 shadow-sm hover-lift">
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Your Stats
                </p>
                <h2 className="text-lg font-bold text-gray-900">Performance</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-600">
                    Available Jobs
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {jobs.length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm font-medium text-emerald-700">
                    Matched Jobs
                  </span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {displayedJobs.length}
                  </span>
                </div>
                {profile?.rating && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-700">
                      Your Rating
                    </span>
                    <span className="text-2xl font-bold text-yellow-600">
                      ⭐ {profile.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>
      </div>

      {/* Location Modal */}
      {selectedLocationJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Client Location - {selectedLocationJob.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseLocationModal}
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              <LocationMap
                location={{
                  address: selectedLocationJob.location,
                  coordinates: selectedLocationJob.coordinates || undefined,
                  manualAddress: undefined
                }}
                title="Client Location"
              />
            </div>
          </div>
        </div>
      )}
    </CleanerLayout>
  );
}
