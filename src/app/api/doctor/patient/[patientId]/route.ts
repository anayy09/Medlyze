import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Only doctors can access this endpoint' },
        { status: 403 }
      );
    }

    const { patientId } = await params;

    // Check if doctor has access to this patient
    const access = await prisma.doctorPatientAccess.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: patientId,
        status: 'APPROVED',
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: 'Access denied to this patient' },
        { status: 403 }
      );
    }

    // Fetch patient with profile
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      include: {
        patientProfile: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Fetch patient's medical reports with AI analysis and doctor notes
    const reports = await prisma.medicalReport.findMany({
      where: { userId: patientId },
      include: {
        aiAnalysis: true,
        doctorNotes: {
          include: {
            doctor: {
              select: {
                name: true,
                email: true,
                doctorProfile: {
                  select: {
                    specialty: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(
      {
        patient: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          patientProfile: patient.patientProfile,
        },
        reports,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch patient data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient data' },
      { status: 500 }
    );
  }
}
