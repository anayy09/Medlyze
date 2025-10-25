import About from "@/components/About";
import AuthRedirect from "@/components/Common/AuthRedirect";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "How It Works | Medlyze - AI-Powered Diagnostic Support Platform",
  description: "Learn how Medlyze uses AI to provide preliminary diagnostic insights for patients and comprehensive support tools for doctors.",
};

const AboutPage = () => {
  return (
    <main>
      <AuthRedirect />
      <Breadcrumb pageName="How It Works" />
      <About />
    </main>
  );
};

export default AboutPage;
