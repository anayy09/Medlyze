import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

// Create or update doctor note
export async function POST(request: NextRequest) {
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
        { error: 'Only doctors can create notes' },
        { status: 403 }
      );
    }

    const { reportId, diagnosis, notes, followUp } = await request.json();

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Get the report and verify access
    const report = await prisma.medicalReport.findUnique({
      where: { id: reportId },
      include: { user: true },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify doctor has access to this patient
    const access = await prisma.doctorPatientAccess.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: report.userId,
        status: 'APPROVED',
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: 'You do not have access to this patient' },
        { status: 403 }
      );
    }

    // Check if note already exists
    const existingNote = await prisma.doctorNote.findFirst({
      where: {
        reportId,
        doctorId: doctor.id,
      },
    });

    if (existingNote) {
      // Update existing note
      const updatedNote = await prisma.doctorNote.update({
        where: { id: existingNote.id },
        data: {
          diagnosis: diagnosis || existingNote.diagnosis,
          notes: notes || existingNote.notes,
          followUp: followUp || existingNote.followUp,
        },
      });

      // Update report status to REVIEWED
      await prisma.medicalReport.update({
        where: { id: reportId },
        data: { status: 'REVIEWED' },
      });

      return NextResponse.json(
        {
          success: true,
          note: updatedNote,
          message: 'Note updated successfully',
        },
        { status: 200 }
      );
    }

    // Create new note
    const doctorNote = await prisma.doctorNote.create({
      data: {
        reportId,
        doctorId: doctor.id,
        diagnosis: diagnosis || '',
        notes: notes || '',
        followUp: followUp || '',
      },
    });

    // Update report status to REVIEWED
    await prisma.medicalReport.update({
      where: { id: reportId },
      data: { status: 'REVIEWED' },
    });

    return NextResponse.json(
      {
        success: true,
        note: doctorNote,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create doctor note error:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

// Get doctor notes for a report
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the report
    const report = await prisma.medicalReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify access
    if (user.role === 'PATIENT' && report.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only view notes for your own reports' },
        { status: 403 }
      );
    }

    if (user.role === 'DOCTOR') {
      const access = await prisma.doctorPatientAccess.findFirst({
        where: {
          doctorId: user.id,
          patientId: report.userId,
          status: 'APPROVED',
        },
      });

      if (!access) {
        return NextResponse.json(
          { error: 'You do not have access to this patient' },
          { status: 403 }
        );
      }
    }

    // Get notes for this report
    const notes = await prisma.doctorNote.findMany({
      where: { reportId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            doctorProfile: {
              select: {
                specialty: true,
                hospital: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error('Get doctor notes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}
