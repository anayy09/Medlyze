import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import { readEncryptedFile } from '@/lib/fileStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.reportId;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Get the report
    const report = await prisma.medicalReport.findUnique({
      where: { id: reportId },
      include: {
        user: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = report.userId === user.id;
    let hasAccess = isOwner;

    // If not owner, check if user is a doctor with approved access
    if (!isOwner && user.role === 'DOCTOR') {
      const access = await prisma.doctorPatientAccess.findFirst({
        where: {
          doctorId: user.id,
          patientId: report.userId,
          status: 'APPROVED',
        },
      });

      hasAccess = !!access;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to access this file' },
        { status: 403 }
      );
    }

    // Read the encrypted file
    const fileBuffer = await readEncryptedFile(report.fileUrl);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', report.mimeType);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set(
      'Content-Disposition',
      `inline; filename="${report.fileName}"`
    );

    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
