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
        doctorProfile: true,
      },
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        profile: user.doctorProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get doctor profile error:', error);
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

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Only doctors can update this profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { specialty, licenseNumber, hospital, yearsExperience, bio } = body;

    // Update or create doctor profile
    const profile = await prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {
        specialty: specialty || undefined,
        licenseNumber: licenseNumber || undefined,
        hospital: hospital || undefined,
        yearsExperience: yearsExperience
          ? parseInt(yearsExperience)
          : undefined,
        bio: bio || undefined,
      },
      create: {
        userId: user.id,
        specialty,
        licenseNumber,
        hospital,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : 0,
        bio,
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
    console.error('Update doctor profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
