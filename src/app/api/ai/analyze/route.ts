import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

/**
 * Mock AI Analysis - This will be replaced with actual AI model integration
 */
async function generateMockAIAnalysis(reportType: string, reportId: string) {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockAnalyses: Record<string, any> = {
    ECG: {
      findings: JSON.stringify({
        heartRate: 68,
        rhythm: 'Normal sinus rhythm',
        intervals: {
          PR: '155ms',
          QRS: '88ms',
          QT: '395ms',
        },
        abnormalities: [],
      }),
      patientSummary:
        'Your ECG shows a healthy heart rhythm with a heart rate of 68 beats per minute. All electrical activity appears normal. No concerning abnormalities were detected.',
      technicalSummary:
        'Normal sinus rhythm at 68 bpm. PR interval 155ms, QRS duration 88ms, QTc 395ms. No ST-T wave abnormalities. No evidence of ischemia, infarction, or arrhythmia. Axis is normal.',
      confidence: 0.93,
      riskLevel: 'LOW',
      recommendations:
        'Continue regular monitoring. Maintain healthy lifestyle habits. Schedule next routine ECG in 12 months unless symptoms develop.',
      modelUsed: 'ECG-Analyzer-v2.1 (Mock)',
    },
    XRAY: {
      findings: JSON.stringify({
        location: 'Chest X-Ray PA view',
        quality: 'Adequate',
        heartSize: 'Normal',
        lungFields: 'Clear bilaterally',
        abnormalities: [],
      }),
      patientSummary:
        'Your chest X-ray looks normal. Your lungs appear clear with no signs of infection or fluid buildup. Your heart size is within normal limits.',
      technicalSummary:
        'PA chest radiograph demonstrates clear lung fields bilaterally without infiltrates, effusions, or masses. Cardiac silhouette is normal in size. No pneumothorax. Bony structures intact.',
      confidence: 0.89,
      riskLevel: 'LOW',
      recommendations:
        'No immediate action required. Continue annual screening. Seek medical attention if you develop respiratory symptoms.',
      modelUsed: 'CheXNet-v3.0 (Mock)',
    },
    CT_SCAN: {
      findings: JSON.stringify({
        scanType: 'CT Head non-contrast',
        findings: 'No acute intracranial abnormality',
        structures: 'Brain parenchyma, ventricles, and sulci are normal',
      }),
      patientSummary:
        'Your CT scan shows no signs of bleeding, stroke, or masses. All brain structures appear normal for your age.',
      technicalSummary:
        'Non-contrast CT head: No acute hemorrhage, infarction, or mass effect. Ventricular system is normal in size and configuration. Gray-white matter differentiation preserved. No midline shift.',
      confidence: 0.91,
      riskLevel: 'LOW',
      recommendations:
        'No acute findings. Follow up with your physician to discuss any symptoms and determine if additional imaging is needed.',
      modelUsed: 'CT-Analyzer-v1.8 (Mock)',
    },
    BLOOD_TEST: {
      findings: JSON.stringify({
        hemoglobin: '14.5 g/dL (Normal)',
        wbc: '7,200/µL (Normal)',
        platelets: '225,000/µL (Normal)',
        glucose: '92 mg/dL (Normal)',
      }),
      patientSummary:
        'Your blood test results are within normal ranges. Your blood cell counts, glucose levels, and other markers look healthy.',
      technicalSummary:
        'Complete blood count: Hemoglobin 14.5 g/dL, WBC 7.2K/µL, platelets 225K/µL. Basic metabolic panel: Glucose 92 mg/dL, creatinine 0.9 mg/dL, all electrolytes within normal limits.',
      confidence: 0.96,
      riskLevel: 'LOW',
      recommendations:
        'All values within normal range. Maintain current health regimen. Repeat testing as recommended by your physician.',
      modelUsed: 'Lab-Analyzer-v2.5 (Mock)',
    },
  };

  const defaultAnalysis = {
    findings: JSON.stringify({ status: 'Awaiting detailed analysis' }),
    patientSummary:
      'Your report has been received and will be reviewed shortly. A detailed analysis will be available soon.',
    technicalSummary: 'Preliminary analysis pending. Full report to follow.',
    confidence: 0.75,
    riskLevel: 'MEDIUM',
    recommendations:
      'Please follow up with your healthcare provider for detailed interpretation.',
    modelUsed: 'General-Analyzer-v1.0 (Mock)',
  };

  const analysis = mockAnalyses[reportType] || defaultAnalysis;

  return {
    ...analysis,
    analysisType: `${reportType}_ANALYSIS`,
  };
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

    // Generate mock AI analysis
    const analysisData = await generateMockAIAnalysis(
      report.reportType,
      reportId
    );

    // Create AI analysis record
    const aiAnalysis = await prisma.aIAnalysis.create({
      data: {
        reportId,
        ...analysisData,
      },
    });

    // Update report status
    await prisma.medicalReport.update({
      where: { id: reportId },
      data: { status: 'ANALYZED' },
    });

    return NextResponse.json(
      {
        success: true,
        analysis: aiAnalysis,
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
