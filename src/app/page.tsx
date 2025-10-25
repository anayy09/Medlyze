import About from "@/components/About";
import AuthRedirect from "@/components/Common/AuthRedirect";
import ScrollUp from "@/components/Common/ScrollUp";
import Faq from "@/components/Faq";
import Features from "@/components/Features";
import Hero from "@/components/Hero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medlyze - AI-Powered Diagnostic Support Platform",
  description: "Upload your medical reports and get instant AI-powered insights. Secure, HIPAA-compliant platform for patients and doctors to collaborate on diagnostic analysis.",
};

export default function Home() {
  return (
    <main>
      <AuthRedirect />
      <ScrollUp />
      <Hero />
      <Features />
      <About />
      <Faq />
    </main>
  );
}
