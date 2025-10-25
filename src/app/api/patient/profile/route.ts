import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        patientProfile: true,
      },
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Patient profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        profile: user.patientProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get patient profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Only patients can update this profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      age,
      biologicalSex,
      weight,
      height,
      bloodType,
      allergies,
      medications,
      medicalHistory,
      chronicIllness,
      familyHistory,
    } = body;

    // Parse values correctly
    const parsedAge = age ? parseInt(age.toString()) : undefined;
    const parsedWeight = weight ? parseFloat(weight.toString()) : undefined;
    const parsedHeight = height ? parseFloat(height.toString()) : undefined;

    // Update or create patient profile
    const profile = await prisma.patientProfile.upsert({
      where: { userId: user.id },
      update: {
        age: parsedAge,
        biologicalSex: biologicalSex || undefined,
        weight: parsedWeight,
        height: parsedHeight,
        bloodType: bloodType || undefined,
        allergies: allergies || undefined,
        medications: medications || undefined,
        medicalHistory: medicalHistory || undefined,
        chronicIllness: chronicIllness || undefined,
        familyHistory: familyHistory || undefined,
      },
      create: {
        userId: user.id,
        age: parsedAge,
        biologicalSex,
        weight: parsedWeight,
        height: parsedHeight,
        bloodType,
        allergies,
        medications,
        medicalHistory,
        chronicIllness,
        familyHistory,
      },
    });

    return NextResponse.json(
      {
        success: true,
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update patient profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
