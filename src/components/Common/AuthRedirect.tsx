"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userRole = (session.user as any).role;
      
      if (userRole === "DOCTOR") {
        router.push("/dashboard/doctor");
      } else if (userRole === "PATIENT") {
        router.push("/dashboard/patient");
      }
    }
  }, [status, session, router]);

  return null;
}
