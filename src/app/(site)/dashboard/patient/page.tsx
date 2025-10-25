import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import Breadcrumb from "@/components/Common/Breadcrumb";
import PatientDashboard from "@/components/Dashboard/Patient";

export const metadata: Metadata = {
  title: "Patient Dashboard | Medlyze",
  description: "Manage your medical reports and view AI-powered health insights",
};

const PatientDashboardPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  // Get user and check role
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
  });

  if (!user) {
    redirect("/signin");
  }

  // If user is a doctor, redirect to doctor dashboard
  if (user.role === "DOCTOR") {
    redirect("/dashboard/doctor");
  }

  // If user is not a patient, redirect to home
  if (user.role !== "PATIENT") {
    redirect("/");
  }

  return (
    <main>
      <Breadcrumb pageName="Patient Dashboard" />
      <PatientDashboard />
    </main>
  );
};

export default PatientDashboardPage;
