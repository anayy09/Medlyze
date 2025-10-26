import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import { analyzeMedicalReport } from '@/lib/llmAnalysis';
import { readEncryptedFile } from '@/lib/fileStorage';
import { convertPDFToImages } from '@/lib/pdfToImage';
import { extractBiomarkers } from '@/lib/trendAnalysis';
import { getEducationalRecommendations } from '@/lib/educationalContent';

/**
 * Extract text and images from medical report file
 */
async function extractReportContent(
  fileUrl: string,
  mimeType: string,
  fileName: string
): Promise<{ text: string; images: string[] }> {
  try {
    // Read and decrypt the file
    const fileBuffer = await readEncryptedFile(fileUrl);
    
    // Extract text and images based on file type
    if (mimeType === 'application/pdf') {
      // Convert PDF pages to images for vision analysis (primary method)
      const images: string[] = [];
      let textContent = '';
      
      try {
        console.log('📄 Converting PDF to images using PDFRest API...');
        const pdfImages = await convertPDFToImages(fileBuffer, {
          maxPages: 10, // Limit to avoid token overflow
        });
        images.push(...pdfImages);
        if (images.length > 0) {
          console.log(`✅ Successfully extracted ${images.length} page(s) from PDF as images`);
        }
        
        // For PDFs with images, we rely on vision analysis
        // Just add a basic text description
        textContent = `[PDF Document: ${fileName}]\nThis document has been converted to images for visual analysis.`;
      } catch (imgError) {
        console.error('❌ PDF to image conversion failed:', imgError);
        
        // Fallback: try text extraction if image conversion fails
        textContent = `[PDF file: ${fileName}]\nNote: Unable to convert PDF to images. Please ensure the file is a valid PDF and try again.`;
      }

      return { text: textContent, images };
    } else if (mimeType.startsWith('image/')) {
      // For images, convert to base64
      const base64Image = fileBuffer.toString('base64');
      return {
        text: `[Image file: ${fileName}]`,
        images: [base64Image],
      };
    } else {
      // For other types, try to convert buffer to text
      return {
        text: fileBuffer.toString('utf-8'),
        images: [],
      };
    }
  } catch (error) {
    console.error('Error extracting report content:', error);
    throw new Error('Failed to extract content from report file');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Get the report
    const report = await prisma.medicalReport.findUnique({
      where: { id: reportId },
      include: { user: true },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify user owns the report or is a doctor with access
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwner = report.userId === user.id;
    const isDoctor = user.role === 'DOCTOR';
    
    if (!isOwner && isDoctor) {
      // Check if doctor has access to this patient
      const access = await prisma.doctorPatientAccess.findFirst({
        where: {
          doctorId: user.id,
          patientId: report.userId,
          status: 'APPROVED',
        },
      });

      if (!access) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    } else if (!isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if analysis already exists
    const existingAnalysis = await prisma.aIAnalysis.findUnique({
      where: { reportId },
    });

    if (existingAnalysis) {
      return NextResponse.json(
        {
          success: true,
          analysis: existingAnalysis,
          message: 'Analysis already exists',
        },
        { status: 200 }
      );
    }

    // Get patient profile for context
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: report.userId },
    });

    // Extract report content from file
    let reportData: { text: string; images: string[] } = { text: '', images: [] };
    try {
      reportData = await extractReportContent(
        report.fileUrl,
        report.mimeType,
        report.fileName
      );
    } catch (error) {
      console.error('Failed to extract report content:', error);
      // Use report title and description as fallback
      reportData.text = `${report.title}\n${report.description || ''}`;
    }

    // If report content is too short, add description
    if (reportData.text.length < 50 && report.description) {
      reportData.text = `${report.title}\n\n${report.description}\n\n${reportData.text}`;
    }

    console.log(`📄 Analyzing ${report.reportType} report (${reportData.text.length} characters, ${reportData.images.length} images)`);

    // Perform actual LLM analysis
    const analysisData = await analyzeMedicalReport(
      report.reportType,
      reportData.text,
      patientProfile,
      reportData.images
    );

    // Extract biomarkers for longitudinal tracking
    const biomarkers = extractBiomarkers(analysisData.findings, report.reportType);
    const biomarkerData: any = {};
    
    // Save biomarkers to database for trend analysis
    if (biomarkers.length > 0) {
      console.log(`📊 Extracted ${biomarkers.length} biomarker(s) for tracking`);
      
      for (const biomarker of biomarkers) {
        biomarkerData[biomarker.type] = biomarker.value;
        
        await prisma.biomarkerTrend.create({
          data: {
            userId: report.userId,
            biomarkerType: biomarker.type,
            value: biomarker.value,
            unit: biomarker.unit,
            reportId: report.id,
            recordedDate: new Date(),
          },
        });
      }
    }

    // Get educational content recommendations
    const educationalLinks = getEducationalRecommendations(
      analysisData.findings,
      report.reportType,
      analysisData.riskLevel
    );

    console.log(`📚 Generated ${educationalLinks.length} educational recommendation(s)`);

    // Create AI analysis record with enhanced data
    const aiAnalysis = await prisma.aIAnalysis.create({
      data: {
        reportId,
        analysisType: `${report.reportType}_ANALYSIS`,
        ...analysisData,
        biomarkers: biomarkerData, // Store extracted biomarkers
        educationalLinks: JSON.stringify(educationalLinks), // Store educational resources
      },
    });

    // Update report status
    await prisma.medicalReport.update({
      where: { id: reportId },
      data: { status: 'ANALYZED' },
    });

    console.log(`✅ Analysis completed for report ${reportId} using ${analysisData.modelUsed}`);

    return NextResponse.json(
      {
        success: true,
        analysis: aiAnalysis,
        biomarkers,
        educationalResources: educationalLinks,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI analysis' },
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

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const analysis = await prisma.aIAnalysis.findUnique({
      where: { reportId },
      include: {
        report: {
          select: {
            id: true,
            title: true,
            reportType: true,
            status: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (error) {
    console.error('Fetch AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI analysis' },
      { status: 500 }
    );
  }
}
