import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { prisma } from "@/utils/prismaDB";

export async function POST(request: any) {
  const body = await request.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role) {
    return NextResponse.json("Missing Fields", { status: 400 });
  }

  // Validate role
  if (role !== "PATIENT" && role !== "DOCTOR") {
    return NextResponse.json("Invalid role", { status: 400 });
  }

  const exist = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (exist) {
    return NextResponse.json("User already exists!", { status: 500 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user with role and corresponding profile
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,
    },
  });

  // Create profile based on role
  if (role === "PATIENT") {
    await prisma.patientProfile.create({
      data: {
        userId: user.id,
      },
    });
  } else if (role === "DOCTOR") {
    await prisma.doctorProfile.create({
      data: {
        userId: user.id,
      },
    });
  }

  return NextResponse.json("User created successfully!", { status: 200 });
}
