import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { saveEncryptedFile } from '@/lib/fileStorage';
import { prisma } from '@/utils/prismaDB';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = {
  ECG: ['application/pdf', 'image/png', 'image/jpeg'],
  XRAY: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
  CT_SCAN: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
  MRI: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
  BLOOD_TEST: ['application/pdf'],
  PATHOLOGY: ['application/pdf'],
  OTHER: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Only patients can upload reports' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const reportType = formData.get('reportType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!title || !reportType) {
      return NextResponse.json(
        { error: 'Title and report type are required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate mime type
    const allowedTypes = ALLOWED_MIME_TYPES[reportType as keyof typeof ALLOWED_MIME_TYPES];
    if (!allowedTypes || !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type for ${reportType}. Allowed types: ${allowedTypes?.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save encrypted file
    const fileId = await saveEncryptedFile(buffer, file.name);

    // Create medical report record
    const medicalReport = await prisma.medicalReport.create({
      data: {
        userId: user.id,
        title,
        description: description || '',
        reportType,
        fileUrl: fileId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        success: true,
        report: {
          id: medicalReport.id,
          title: medicalReport.title,
          reportType: medicalReport.reportType,
          status: medicalReport.status,
          createdAt: medicalReport.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

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

    // Get all reports for the user
    const reports = await prisma.medicalReport.findMany({
      where: { userId: user.id },
      include: {
        aiAnalysis: true,
        doctorNotes: {
          include: {
            doctor: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
