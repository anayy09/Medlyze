"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Breadcrumb from "@/components/Common/Breadcrumb";

interface PatientProfile {
  age?: number;
  biologicalSex?: string;
  weight?: number;
  height?: number;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  medicalHistory?: string;
  chronicIllness?: string;
  surgeries?: string;
  familyHistory?: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  patientProfile?: PatientProfile;
}

interface MedicalReport {
  id: string;
  title: string;
  description: string;
  reportType: string;
  status: string;
  createdAt: string;
  fileName: string;
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

const PatientDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const patientId = params.patientId as string;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({
    diagnosis: "",
    notes: "",
    followUp: "",
  });
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // Fetch patient details and reports using dedicated doctor endpoint
      const response = await fetch(`/api/doctor/patient/${patientId}`);
      const data = await response.json();

      if (response.ok) {
        setPatient(data.patient);
        setReports(data.reports || []);
      } else {
        toast.error(data.error || "Failed to load patient data");
        router.push("/dashboard/doctor");
        return;
      }
    } catch (error) {
      console.error("Failed to fetch patient data:", error);
      toast.error("Failed to load patient data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = (report: MedicalReport) => {
    setSelectedReport(report);
    
    // Pre-fill form if there's an existing note from this doctor
    const existingNote = report.doctorNotes.find(
      (note) => note.doctor.email === session?.user?.email
    );
    
    if (existingNote) {
      setNoteForm({
        diagnosis: existingNote.diagnosis,
        notes: existingNote.notes,
        followUp: existingNote.followUp,
      });
    } else {
      setNoteForm({
        diagnosis: "",
        notes: "",
        followUp: "",
      });
    }
    
    setShowNoteModal(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReport) return;

    if (!noteForm.notes && !noteForm.diagnosis) {
      toast.error("Please enter at least a diagnosis or notes");
      return;
    }

    setSavingNote(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId: selectedReport.id,
          diagnosis: noteForm.diagnosis,
          notes: noteForm.notes,
          followUp: noteForm.followUp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Note saved successfully");
        setShowNoteModal(false);
        setSelectedReport(null);
        setNoteForm({ diagnosis: "", notes: "", followUp: "" });
        await fetchPatientData();
      } else {
        toast.error(data.error || "Failed to save note");
      }
    } catch (error) {
      toast.error("Failed to save note");
      console.error("Save note error:", error);
    } finally {
      setSavingNote(false);
    }
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
      <>
        <Breadcrumb pageName="Patient Details" />
        <section className="bg-gray-1 py-8 dark:bg-dark-2 lg:py-[70px]">
          <div className="container">
            <div className="flex items-center justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <Breadcrumb pageName="Patient Details" />
        <section className="bg-gray-1 py-8 dark:bg-dark-2 lg:py-[70px]">
          <div className="container">
            <div className="rounded-lg bg-white p-8 text-center dark:bg-dark">
              <p className="text-lg text-body-color dark:text-dark-6">
                Patient not found or access denied
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName={`Patient: ${patient.name}`} />
      <section className="bg-gray-1 py-8 dark:bg-dark-2 lg:py-[70px]">
        <div className="container">
          {/* Patient Profile Card */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-dark">
            <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-dark-3">
              <div>
                <h1 className="text-3xl font-bold text-dark dark:text-white">
                  {patient.name}
                </h1>
                <p className="mt-1 text-body-color dark:text-dark-6">
                  {patient.email}
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/doctor")}
                className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
              >
                ← Back to Dashboard
              </button>
            </div>

            {patient.patientProfile && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                    Age
                  </h3>
                  <p className="text-lg font-semibold text-dark dark:text-white">
                    {patient.patientProfile.age || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                    Biological Sex
                  </h3>
                  <p className="text-lg font-semibold text-dark dark:text-white">
                    {patient.patientProfile.biologicalSex || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                    Blood Type
                  </h3>
                  <p className="text-lg font-semibold text-dark dark:text-white">
                    {patient.patientProfile.bloodType || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                    Weight / Height
                  </h3>
                  <p className="text-lg font-semibold text-dark dark:text-white">
                    {patient.patientProfile.weight
                      ? `${patient.patientProfile.weight}kg`
                      : "N/A"}{" "}
                    /{" "}
                    {patient.patientProfile.height
                      ? `${patient.patientProfile.height}cm`
                      : "N/A"}
                  </p>
                </div>
              </div>
            )}

            {patient.patientProfile && (
              <div className="mt-6 grid gap-6 border-t border-gray-200 pt-6 dark:border-dark-3 sm:grid-cols-2">
                {patient.patientProfile.allergies && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                      Allergies
                    </h3>
                    <p className="text-sm text-dark dark:text-white">
                      {patient.patientProfile.allergies}
                    </p>
                  </div>
                )}
                {patient.patientProfile.medications && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                      Current Medications
                    </h3>
                    <p className="text-sm text-dark dark:text-white">
                      {patient.patientProfile.medications}
                    </p>
                  </div>
                )}
                {patient.patientProfile.chronicIllness && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                      Chronic Illnesses
                    </h3>
                    <p className="text-sm text-dark dark:text-white">
                      {patient.patientProfile.chronicIllness}
                    </p>
                  </div>
                )}
                {patient.patientProfile.surgeries && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                      Past Surgeries
                    </h3>
                    <p className="text-sm text-dark dark:text-white">
                      {patient.patientProfile.surgeries}
                    </p>
                  </div>
                )}
                {patient.patientProfile.medicalHistory && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                      Medical History
                    </h3>
                    <p className="text-sm text-dark dark:text-white">
                      {patient.patientProfile.medicalHistory}
                    </p>
                  </div>
                )}
                {patient.patientProfile.familyHistory && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                      Family History
                    </h3>
                    <p className="text-sm text-dark dark:text-white">
                      {patient.patientProfile.familyHistory}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Medical Reports */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-dark">
            <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
              Medical Reports
            </h2>

            {reports.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-3 dark:bg-dark">
                <p className="text-lg text-body-color dark:text-dark-6">
                  No medical reports available yet.
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
                          {report.reportType} • Uploaded{" "}
                          {new Date(report.createdAt).toLocaleDateString()}
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
                        <div className="flex gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-center text-xs font-medium ${getRiskBadgeColor(
                              report.aiAnalysis?.riskLevel || ""
                            )}`}
                          >
                            {report.status}
                          </span>
                          <button
                            onClick={() => handleAddNote(report)}
                            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white transition hover:bg-primary/90"
                          >
                            Add/Edit Note
                          </button>
                        </div>
                      </div>
                    </div>

                    {report.aiAnalysis && (
                      <div className="mt-4 space-y-4 border-t border-gray-200 pt-4 dark:border-dark-3">
                        <div>
                          <h4 className="mb-2 font-semibold text-dark dark:text-white">
                            AI Analysis - Technical Summary
                          </h4>
                          <p className="text-sm text-body-color dark:text-dark-6">
                            {report.aiAnalysis.technicalSummary}
                          </p>
                        </div>

                        <div>
                          <h4 className="mb-2 font-semibold text-dark dark:text-white">
                            Patient Summary
                          </h4>
                          <p className="text-sm text-body-color dark:text-dark-6">
                            {report.aiAnalysis.patientSummary}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div>
                            <h4 className="mb-1 font-semibold text-dark dark:text-white">
                              Risk Level
                            </h4>
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getRiskBadgeColor(
                                report.aiAnalysis.riskLevel
                              )}`}
                            >
                              {report.aiAnalysis.riskLevel} RISK
                            </span>
                          </div>
                          <div>
                            <h4 className="mb-1 font-semibold text-dark dark:text-white">
                              Confidence
                            </h4>
                            <span className="text-sm text-body-color dark:text-dark-6">
                              {(report.aiAnalysis.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-2 font-semibold text-dark dark:text-white">
                            AI Recommendations
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
                            <p className="mb-2 text-sm font-medium text-dark dark:text-white">
                              Dr. {note.doctor.name}
                              {note.doctor.email === session?.user?.email &&
                                " (You)"}
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
        </div>
      </section>

      {/* Add/Edit Note Modal */}
      {showNoteModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-dark">
            <h3 className="mb-4 text-xl font-bold text-dark dark:text-white">
              Add Doctor's Note - {selectedReport.title}
            </h3>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Diagnosis
                </label>
                <input
                  type="text"
                  value={noteForm.diagnosis}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, diagnosis: e.target.value })
                  }
                  placeholder="Enter diagnosis"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Clinical Notes
                </label>
                <textarea
                  rows={5}
                  value={noteForm.notes}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, notes: e.target.value })
                  }
                  placeholder="Enter your clinical observations and notes"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                ></textarea>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Follow-up Recommendations
                </label>
                <textarea
                  rows={3}
                  value={noteForm.followUp}
                  onChange={(e) =>
                    setNoteForm({ ...noteForm, followUp: e.target.value })
                  }
                  placeholder="Recommended follow-up actions"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                ></textarea>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteModal(false);
                    setSelectedReport(null);
                    setNoteForm({ diagnosis: "", notes: "", followUp: "" });
                  }}
                  disabled={savingNote}
                  className="flex-1 rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientDetailPage;
