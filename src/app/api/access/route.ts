import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

// Request access to a patient (from patient perspective)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { doctorEmail } = await request.json();

    if (!doctorEmail) {
      return NextResponse.json(
        { error: 'Doctor email is required' },
        { status: 400 }
      );
    }

    // Get current user (patient)
    const patient = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!patient || patient.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Only patients can grant access' },
        { status: 403 }
      );
    }

    // Find doctor by email
    const doctor = await prisma.user.findUnique({
      where: { email: doctorEmail },
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Doctor not found or invalid role' },
        { status: 404 }
      );
    }

    // Check if access already exists
    const existingAccess = await prisma.doctorPatientAccess.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: patient.id,
      },
    });

    if (existingAccess) {
      // If access was revoked, re-approve it
      if (existingAccess.status === 'REVOKED') {
        const updatedAccess = await prisma.doctorPatientAccess.update({
          where: { id: existingAccess.id },
          data: { status: 'APPROVED' },
        });

        return NextResponse.json(
          {
            success: true,
            access: updatedAccess,
            message: 'Access re-granted successfully',
          },
          { status: 200 }
        );
      }

      // If already approved or pending, return existing access
      return NextResponse.json(
        {
          success: false,
          message: 'Access request already exists',
          access: existingAccess,
        },
        { status: 200 }
      );
    }

    // Create new access request
    const access = await prisma.doctorPatientAccess.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        status: 'APPROVED', // Auto-approve since patient is granting access
      },
    });

    return NextResponse.json(
      {
        success: true,
        access,
        message: 'Access granted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Grant access error:', error);
    return NextResponse.json(
      { error: 'Failed to grant access' },
      { status: 500 }
    );
  }
}

// Get list of doctors with access (for patient) or patients accessible (for doctor)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'PATIENT') {
      // Get all doctors who have access to this patient
      const accessList = await prisma.doctorPatientAccess.findMany({
        where: { patientId: user.id },
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
                  yearsExperience: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ accessList }, { status: 200 });
    } else if (user.role === 'DOCTOR') {
      // Get all patients this doctor has access to
      const accessList = await prisma.doctorPatientAccess.findMany({
        where: {
          doctorId: user.id,
          status: 'APPROVED',
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              patientProfile: {
                select: {
                  age: true,
                  biologicalSex: true,
                  bloodType: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({ accessList }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
  } catch (error) {
    console.error('Get access list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access list' },
      { status: 500 }
    );
  }
}

// Revoke access
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accessId = searchParams.get('accessId');

    if (!accessId) {
      return NextResponse.json(
        { error: 'Access ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the access record
    const access = await prisma.doctorPatientAccess.findUnique({
      where: { id: accessId },
    });

    if (!access) {
      return NextResponse.json(
        { error: 'Access record not found' },
        { status: 404 }
      );
    }

    // Only patient can revoke their own access
    if (user.role === 'PATIENT' && access.patientId !== user.id) {
      return NextResponse.json(
        { error: 'You can only revoke your own access grants' },
        { status: 403 }
      );
    }

    // Update status to REVOKED
    await prisma.doctorPatientAccess.update({
      where: { id: accessId },
      data: { status: 'REVOKED' },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Access revoked successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revoke access error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke access' },
      { status: 500 }
    );
  }
}
