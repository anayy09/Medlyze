"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import FileUpload from "./FileUpload";

interface PatientProfile {
  id: string;
  age?: number;
  biologicalSex?: string;
  weight?: number;
  height?: number;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  medicalHistory?: string;
  chronicIllness?: string;
  familyHistory?: string;
}

interface MedicalReport {
  id: string;
  title: string;
  description: string;
  reportType: string;
  status: string;
  createdAt: string;
  fileName: string;
  fileSize: number;
  aiAnalysis?: {
    patientSummary: string;
    technicalSummary: string;
    riskLevel: string;
    recommendations: string;
    confidence: number;
  };
  doctorNotes: Array<{
    id: string;
    diagnosis: string;
    notes: string;
    followUp: string;
    doctor: {
      name: string;
      email: string;
    };
  }>;
}

interface DoctorAccess {
  id: string;
  status: string;
  doctor: {
    id: string;
    name: string;
    email: string;
    doctorProfile?: {
      specialty: string;
      hospital: string;
      yearsExperience: number;
    };
  };
}

const PatientDashboard = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [doctors, setDoctors] = useState<DoctorAccess[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [addingDoctor, setAddingDoctor] = useState(false);

  // Form state for profile update
  const [profileForm, setProfileForm] = useState({
    age: "",
    biologicalSex: "",
    weight: "",
    height: "",
    bloodType: "",
    allergies: "",
    medications: "",
    medicalHistory: "",
    chronicIllness: "",
    familyHistory: "",
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProfile(), fetchReports(), fetchDoctors()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/patient/profile");
      const data = await response.json();
      
      if (response.ok && data.profile) {
        setProfile(data.profile);
        setProfileForm({
          age: data.profile.age?.toString() || "",
          biologicalSex: data.profile.biologicalSex || "",
          weight: data.profile.weight?.toString() || "",
          height: data.profile.height?.toString() || "",
          bloodType: data.profile.bloodType || "",
          allergies: data.profile.allergies || "",
          medications: data.profile.medications || "",
          medicalHistory: data.profile.medicalHistory || "",
          chronicIllness: data.profile.chronicIllness || "",
          familyHistory: data.profile.familyHistory || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports/upload");
      const data = await response.json();
      
      if (response.ok) {
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/access");
      const data = await response.json();
      
      if (response.ok) {
        setDoctors(data.accessList || []);
      }
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/patient/profile", {
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

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!doctorEmail) {
      toast.error("Please enter doctor's email");
      return;
    }

    setAddingDoctor(true);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ doctorEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Doctor added successfully");
        setDoctorEmail("");
        setShowAddDoctorModal(false);
        await fetchDoctors();
      } else {
        toast.error(data.error || "Failed to add doctor");
      }
    } catch (error) {
      toast.error("Failed to add doctor");
      console.error("Add doctor error:", error);
    } finally {
      setAddingDoctor(false);
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    if (!confirm("Are you sure you want to revoke this doctor's access?")) {
      return;
    }

    try {
      const response = await fetch(`/api/access?accessId=${accessId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Access revoked successfully");
        await fetchDoctors();
      } else {
        toast.error(data.error || "Failed to revoke access");
      }
    } catch (error) {
      toast.error("Failed to revoke access");
      console.error("Revoke access error:", error);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    fetchReports();
    toast.success("Report uploaded and analyzed successfully!");
  };

  // Calculate statistics from real data
  const stats = {
    totalReports: reports.length,
    analyzedReports: reports.filter(r => r.aiAnalysis).length,
    pendingReports: reports.filter(r => r.status === "PENDING").length,
    doctorsConnected: doctors.filter(d => d.status === "APPROVED").length,
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
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
                  Patient Dashboard
                </h1>
                <p className="mt-2 text-body-color dark:text-dark-6">
                  Welcome back, {session?.user?.name || "Patient"}
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="rounded-md bg-primary px-6 py-3 text-base font-medium text-white transition hover:bg-primary/90"
              >
                Upload Report
              </button>
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
              onClick={() => setActiveTab("reports")}
              className={`pb-4 text-base font-medium transition ${
                activeTab === "reports"
                  ? "border-b-2 border-primary text-primary"
                  : "text-body-color hover:text-primary dark:text-dark-6"
              }`}
            >
              My Reports
            </button>
            <button
              onClick={() => setActiveTab("doctors")}
              className={`pb-4 text-base font-medium transition ${
                activeTab === "doctors"
                  ? "border-b-2 border-primary text-primary"
                  : "text-body-color hover:text-primary dark:text-dark-6"
              }`}
            >
              My Doctors
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-4 text-base font-medium transition ${
                activeTab === "profile"
                  ? "border-b-2 border-primary text-primary"
                  : "text-body-color hover:text-primary dark:text-dark-6"
              }`}
            >
              Health Profile
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
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-base font-medium text-body-color dark:text-dark-6">
                        Total Reports
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-dark dark:text-white">
                      {stats.totalReports}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-base font-medium text-body-color dark:text-dark-6">
                        AI Analyzed
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
                      {stats.analyzedReports}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-base font-medium text-body-color dark:text-dark-6">
                        Pending Analysis
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
                      {stats.pendingReports}
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-base font-medium text-body-color dark:text-dark-6">
                        Doctors Connected
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-dark dark:text-white">
                      {stats.doctorsConnected}
                    </p>
                  </div>
                </div>

                {/* Recent Reports */}
                <div className="mt-8">
                  <h3 className="mb-4 text-xl font-bold text-dark dark:text-white">
                    Recent Reports
                  </h3>
                  {reports.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-3 dark:bg-dark">
                      <p className="text-body-color dark:text-dark-6">
                        No reports uploaded yet. Upload your first medical report to get started!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.slice(0, 3).map((report) => (
                        <div
                          key={report.id}
                          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-3 dark:bg-dark"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-dark dark:text-white">
                                {report.title}
                              </h4>
                              <p className="text-sm text-body-color dark:text-dark-6">
                                {report.reportType} • {new Date(report.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getRiskBadgeColor(report.aiAnalysis?.riskLevel || "")}`}>
                              {report.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-dark dark:text-white">
                    Medical Reports
                  </h2>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                  >
                    Upload New Report
                  </button>
                </div>

                {reports.length === 0 ? (
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg text-body-color dark:text-dark-6">
                      No reports uploaded yet. Upload your first medical report to get AI-powered insights!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark"
                      >
                          <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-dark dark:text-white">
                              {report.title}
                            </h3>
                            <p className="mt-1 text-sm text-body-color dark:text-dark-6">
                              {report.reportType} • Uploaded {new Date(report.createdAt).toLocaleDateString()}
                            </p>
                            {report.description && (
                              <p className="mt-2 text-sm text-body-color dark:text-dark-6">
                                {report.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <a
                                href={`/api/download/${report.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white transition hover:bg-primary/90"
                              >
                                View
                              </a>
                              <a
                                href={`/api/download/${report.id}?download=true`}
                                className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white transition hover:bg-primary/90"
                              >
                                Download
                              </a>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-center text-xs font-medium ${getRiskBadgeColor(report.aiAnalysis?.riskLevel || "")}`}>
                              {report.status}
                            </span>
                          </div>
                        </div>                        {report.aiAnalysis && (
                          <div className="mt-4 space-y-4 border-t border-gray-200 pt-4 dark:border-dark-3">
                            <div>
                              <h4 className="mb-2 font-semibold text-dark dark:text-white">
                                AI Analysis Summary
                              </h4>
                              <p className="text-sm text-body-color dark:text-dark-6">
                                {report.aiAnalysis.patientSummary}
                              </p>
                            </div>

                            <div>
                              <h4 className="mb-2 font-semibold text-dark dark:text-white">
                                Risk Level
                              </h4>
                              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getRiskBadgeColor(report.aiAnalysis.riskLevel)}`}>
                                {report.aiAnalysis.riskLevel} RISK
                              </span>
                              <span className="ml-3 text-sm text-body-color dark:text-dark-6">
                                Confidence: {(report.aiAnalysis.confidence * 100).toFixed(0)}%
                              </span>
                            </div>

                            <div>
                              <h4 className="mb-2 font-semibold text-dark dark:text-white">
                                Recommendations
                              </h4>
                              <p className="text-sm text-body-color dark:text-dark-6">
                                {report.aiAnalysis.recommendations}
                              </p>
                            </div>
                          </div>
                        )}

                        {report.doctorNotes.length > 0 && (
                          <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-dark-3">
                            <h4 className="font-semibold text-dark dark:text-white">
                              Doctor's Notes
                            </h4>
                            {report.doctorNotes.map((note) => (
                              <div
                                key={note.id}
                                className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20"
                              >
                                <p className="mb-1 text-sm font-medium text-dark dark:text-white">
                                  Dr. {note.doctor.name}
                                </p>
                                {note.diagnosis && (
                                  <p className="mb-2 text-sm text-body-color dark:text-dark-6">
                                    <strong>Diagnosis:</strong> {note.diagnosis}
                                  </p>
                                )}
                                {note.notes && (
                                  <p className="mb-2 text-sm text-body-color dark:text-dark-6">
                                    <strong>Notes:</strong> {note.notes}
                                  </p>
                                )}
                                {note.followUp && (
                                  <p className="text-sm text-body-color dark:text-dark-6">
                                    <strong>Follow-up:</strong> {note.followUp}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "doctors" && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-dark dark:text-white">
                    Connected Doctors
                  </h2>
                  <button
                    onClick={() => setShowAddDoctorModal(true)}
                    className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                  >
                    Add Doctor
                  </button>
                </div>

                {doctors.length === 0 ? (
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="text-lg text-body-color dark:text-dark-6">
                      No doctors connected yet. Add a doctor to grant access to your medical data.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {doctors.map((access) => (
                      <div
                        key={access.id}
                        className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-dark dark:text-white">
                              Dr. {access.doctor.name}
                            </h3>
                            <p className="text-sm text-body-color dark:text-dark-6">
                              {access.doctor.email}
                            </p>
                            {access.doctor.doctorProfile && (
                              <>
                                <p className="mt-2 text-sm font-medium text-dark dark:text-white">
                                  {access.doctor.doctorProfile.specialty}
                                </p>
                                <p className="text-sm text-body-color dark:text-dark-6">
                                  {access.doctor.doctorProfile.hospital}
                                </p>
                                <p className="text-sm text-body-color dark:text-dark-6">
                                  {access.doctor.doctorProfile.yearsExperience} years experience
                                </p>
                              </>
                            )}
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${access.status === "APPROVED" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"}`}>
                            {access.status}
                          </span>
                        </div>
                        {access.status === "APPROVED" && (
                          <button
                            onClick={() => handleRevokeAccess(access.id)}
                            className="w-full rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            Revoke Access
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
                  Health Profile
                </h2>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Age
                      </label>
                      <input
                        type="number"
                        value={profileForm.age}
                        onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                        placeholder="Enter your age"
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Biological Sex
                      </label>
                      <select
                        value={profileForm.biologicalSex}
                        onChange={(e) => setProfileForm({ ...profileForm, biologicalSex: e.target.value })}
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                      >
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={profileForm.weight}
                        onChange={(e) => setProfileForm({ ...profileForm, weight: e.target.value })}
                        placeholder="e.g., 70.5"
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={profileForm.height}
                        onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
                        placeholder="e.g., 175"
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Blood Type
                      </label>
                      <select
                        value={profileForm.bloodType}
                        onChange={(e) => setProfileForm({ ...profileForm, bloodType: e.target.value })}
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                      >
                        <option value="">Select</option>
                        <option value="A_POSITIVE">A+</option>
                        <option value="A_NEGATIVE">A-</option>
                        <option value="B_POSITIVE">B+</option>
                        <option value="B_NEGATIVE">B-</option>
                        <option value="O_POSITIVE">O+</option>
                        <option value="O_NEGATIVE">O-</option>
                        <option value="AB_POSITIVE">AB+</option>
                        <option value="AB_NEGATIVE">AB-</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Allergies
                    </label>
                    <textarea
                      rows={3}
                      value={profileForm.allergies}
                      onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                      placeholder="List any known allergies..."
                      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                    ></textarea>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Current Medications
                    </label>
                    <textarea
                      rows={3}
                      value={profileForm.medications}
                      onChange={(e) => setProfileForm({ ...profileForm, medications: e.target.value })}
                      placeholder="List current medications..."
                      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                    ></textarea>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Medical History
                    </label>
                    <textarea
                      rows={4}
                      value={profileForm.medicalHistory}
                      onChange={(e) => setProfileForm({ ...profileForm, medicalHistory: e.target.value })}
                      placeholder="Previous surgeries, major illnesses, etc..."
                      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                    ></textarea>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Chronic Illnesses
                    </label>
                    <textarea
                      rows={3}
                      value={profileForm.chronicIllness}
                      onChange={(e) => setProfileForm({ ...profileForm, chronicIllness: e.target.value })}
                      placeholder="Any ongoing chronic conditions..."
                      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                    ></textarea>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                      Family History
                    </label>
                    <textarea
                      rows={3}
                      value={profileForm.familyHistory}
                      onChange={(e) => setProfileForm({ ...profileForm, familyHistory: e.target.value })}
                      placeholder="Relevant family medical history..."
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

      {/* File Upload Modal */}
      {showUploadModal && (
        <FileUpload
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-dark">
            <h3 className="mb-4 text-xl font-bold text-dark dark:text-white">
              Add Doctor
            </h3>
            <form onSubmit={handleAddDoctor}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Doctor's Email
                </label>
                <input
                  type="email"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  placeholder="doctor@example.com"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDoctorModal(false);
                    setDoctorEmail("");
                  }}
                  className="flex-1 rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDoctor}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {addingDoctor ? "Adding..." : "Add Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default PatientDashboard;
