import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import Breadcrumb from "@/components/Common/Breadcrumb";
import DoctorDashboard from "@/components/Dashboard/Doctor";

export const metadata: Metadata = {
  title: "Doctor Dashboard | Medlyze",
  description: "Manage patients and provide professional diagnostic support",
};

const DoctorDashboardPage = async () => {
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

  // If user is a patient, redirect to patient dashboard
  if (user.role === "PATIENT") {
    redirect("/dashboard/patient");
  }

  // If user is not a doctor, redirect to home
  if (user.role !== "DOCTOR") {
    redirect("/");
  }

  return (
    <main>
      <Breadcrumb pageName="Doctor Dashboard" />
      <DoctorDashboard />
    </main>
  );
};

export default DoctorDashboardPage;
