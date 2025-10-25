"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface DoctorProfile {
  id: string;
  specialty?: string;
  licenseNumber?: string;
  hospital?: string;
  yearsExperience?: number;
  bio?: string;
}

interface PatientAccess {
  id: string;
  status: string;
  patient: {
    id: string;
    name: string;
    email: string;
    patientProfile?: {
      age: number;
      biologicalSex: string;
      bloodType: string;
    };
  };
}

const DoctorDashboard = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [patients, setPatients] = useState<PatientAccess[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state for profile update
  const [profileForm, setProfileForm] = useState({
    specialty: "",
    licenseNumber: "",
    hospital: "",
    yearsExperience: "",
    bio: "",
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProfile(), fetchPatients()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/doctor/profile");
      const data = await response.json();
      
      if (response.ok && data.profile) {
        setProfile(data.profile);
        setProfileForm({
          specialty: data.profile.specialty || "",
          licenseNumber: data.profile.licenseNumber || "",
          hospital: data.profile.hospital || "",
          yearsExperience: data.profile.yearsExperience?.toString() || "",
          bio: data.profile.bio || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/access");
      const data = await response.json();
      
      if (response.ok) {
        setPatients(data.accessList || []);
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile updated successfully");
        setProfile(data.profile);
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Profile update error:", error);
    }
  };

  const handlePatientClick = (patientId: string) => {
    router.push(`/dashboard/doctor/patient/${patientId}`);
  };

  // Filter patients by search term
  const filteredPatients = patients.filter((access) =>
    access.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    access.patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics from real data
  const stats = {
    totalPatients: patients.length,
    reportsReviewed: 0, // This would need to be fetched from backend
    pendingReviews: 0, // This would need to be fetched from backend
    accessRequests: patients.filter(p => p.status === "PENDING").length,
  };

  if (loading) {
    return (
      <section className="bg-gray-1 py-8 dark:bg-dark-2 lg:py-[70px]">
        <div className="container">
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-1 py-8 dark:bg-dark-2 lg:py-[70px]">
      <div className="container">
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-dark">
          {/* Dashboard Header */}
          <div className="mb-8 border-b border-gray-200 pb-6 dark:border-dark-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-dark dark:text-white">
                  Doctor Dashboard
                </h1>
                <p className="mt-2 text-body-color dark:text-dark-6">
                  Welcome back, Dr. {session?.user?.name || "Doctor"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8 flex gap-4 border-b border-gray-200 dark:border-dark-3">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-4 text-base font-medium transition ${
                activeTab === "overview"
                  ? "border-b-2 border-primary text-primary"
                  : "text-body-color hover:text-primary dark:text-dark-6"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`pb-4 text-base font-medium transition ${
                activeTab === "patients"
                  ? "border-b-2 border-primary text-primary"
                  : "text-body-color hover:text-primary dark:text-dark-6"
              }`}
            >
              My Patients
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-4 text-base font-medium transition ${
                activeTab === "profile"
                  ? "border-b-2 border-primary text-primary"
                  : "text-body-color hover:text-primary dark:text-dark-6"
              }`}
            >
              Professional Profile
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "overview" && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
                  Quick Stats
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Total Patients Card */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-base font-medium text-body-color dark:text-dark-6">
                        Total Patients
                      </h3>
                      <svg
                        className="h-8 w-8 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-dark dark:text-white">
                      {stats.totalPatients}
                    </p>
                  </div>

                  {/* Reports Reviewed Card */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-base font-medium text-body-color dark:text-dark-6">
                        Reports Reviewed
                      </h3>
                      <svg
                        className="h-8 w-8 text-green-500"
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
                    <p className="text-3xl font-bold text-dark dark:text-white">
                      {stats.reportsReviewed}
                    </p>
                  </div>

                  {/* Pending Reviews Card */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-base font-medium text-body-color dark:text-dark-6">
                        Pending Reviews
                      </h3>
                      <svg
                        className="h-8 w-8 text-yellow-500"
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
                    <p className="text-3xl font-bold text-dark dark:text-white">
                      {stats.pendingReviews}
                    </p>
                  </div>

                  {/* Access Requests Card */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-base font-medium text-body-color dark:text-dark-6">
                        Access Requests
                      </h3>
                      <svg
                        className="h-8 w-8 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-dark dark:text-white">
                      {stats.accessRequests}
                    </p>
                  </div>
                </div>

                {/* AI Diagnostic Support Info */}
                <div className="mt-8 rounded-lg bg-primary/10 p-6 dark:bg-primary/20">
                  <h3 className="mb-3 text-xl font-bold text-dark dark:text-white">
                    AI Diagnostic Support Tools
                  </h3>
                  <p className="mb-4 text-body-color dark:text-dark-6">
                    Access AI-powered preliminary analysis for patient reports. Use advanced
                    comparison tools, comprehensive patient history viewer, and add your
                    professional diagnostic notes to override AI insights.
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-body-color dark:text-dark-6">
                        AI Preliminary Analysis
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-body-color dark:text-dark-6">
                        Report Comparison
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-body-color dark:text-dark-6">
                        Patient History
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "patients" && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-dark dark:text-white">
                    Patient List
                  </h2>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search patients..."
                    className="rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  />
                </div>
                
                {filteredPatients.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-3 dark:bg-dark">
                    <svg
                      className="mx-auto mb-4 h-16 w-16 text-body-color dark:text-dark-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-lg text-body-color dark:text-dark-6">
                      {searchTerm ? "No patients found matching your search." : "No patients yet. Patients will appear here once they grant you access to their medical data."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPatients.map((access) => (
                      <div
                        key={access.id}
                        onClick={() => handlePatientClick(access.patient.id)}
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 transition hover:border-primary hover:shadow-md dark:border-dark-3 dark:bg-dark dark:hover:border-primary"
                      >
                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-dark dark:text-white">
                            {access.patient.name}
                          </h3>
                          <p className="text-sm text-body-color dark:text-dark-6">
                            {access.patient.email}
                          </p>
                        </div>
                        {access.patient.patientProfile && (
                          <div className="space-y-1 border-t border-gray-200 pt-4 dark:border-dark-3">
                            <p className="text-sm text-body-color dark:text-dark-6">
                              <span className="font-medium">Age:</span> {access.patient.patientProfile.age}
                            </p>
                            <p className="text-sm text-body-color dark:text-dark-6">
                              <span className="font-medium">Sex:</span> {access.patient.patientProfile.biologicalSex}
                            </p>
                            <p className="text-sm text-body-color dark:text-dark-6">
                              <span className="font-medium">Blood Type:</span> {access.patient.patientProfile.bloodType}
                            </p>
                          </div>
                        )}
                        <div className="mt-4">
                          <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                            {access.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
                  Professional Profile
                </h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Specialty
                      </label>
                      <input
                        type="text"
                        value={profileForm.specialty}
                        onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                        placeholder="e.g., Cardiology, Radiology"
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={profileForm.licenseNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                        placeholder="Medical license number"
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Hospital/Clinic
                      </label>
                      <input
                        type="text"
                        value={profileForm.hospital}
                        onChange={(e) => setProfileForm({ ...profileForm, hospital: e.target.value })}
                        placeholder="Primary practice location"
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        value={profileForm.yearsExperience}
                        onChange={(e) => setProfileForm({ ...profileForm, yearsExperience: e.target.value })}
                        placeholder="Years in practice"
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Professional Bio
                    </label>
                    <textarea
                      rows={5}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder="Brief description of your expertise and approach..."
                      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="rounded-md bg-primary px-8 py-3 text-base font-medium text-white transition hover:bg-primary/90"
                  >
                    Save Profile
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorDashboard;
