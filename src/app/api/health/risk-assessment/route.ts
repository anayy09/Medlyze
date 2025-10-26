import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import {
  calculateComprehensiveRiskProfile,
  RiskFactors,
} from '@/lib/riskAssessment';

/**
 * POST /api/health/risk-assessment
 * Calculate comprehensive risk assessment for a patient
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { patientProfile: true },
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Only patients can calculate risk assessments' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { biomarkerData } = body;

    // Combine patient profile data with biomarker data
    const profile = user.patientProfile;
    
    const riskFactors: RiskFactors = {
      age: profile?.age || 0,
      biologicalSex: (profile?.biologicalSex?.toUpperCase() as 'MALE' | 'FEMALE') || 'MALE',
      weight: profile?.weight || undefined,
      height: profile?.height || undefined,
      smokingStatus: (profile?.smokingStatus as any) || 'NEVER',
      diabetesStatus: profile?.diabetesStatus || false,
      ...biomarkerData, // Include latest biomarker values from request
    };

    // Calculate comprehensive risk profile
    const riskProfile = await calculateComprehensiveRiskProfile(riskFactors);

    // Save risk assessments to database
    const assessments = [];

    if (riskProfile.framingham) {
      const framinghamAssessment = await prisma.riskAssessment.create({
        data: {
          userId: user.id,
          assessmentType: 'FRAMINGHAM_CVD',
          score: riskProfile.framingham.score,
          riskCategory: riskProfile.framingham.riskCategory,
          factors: riskProfile.framingham.factors,
          recommendations: riskProfile.framingham.recommendations.join('\n'),
          validUntil: new Date(
            Date.now() + riskProfile.framingham.validityPeriod * 24 * 60 * 60 * 1000
          ),
        },
      });
      assessments.push(framinghamAssessment);
    }

    if (riskProfile.diabetes) {
      const diabetesAssessment = await prisma.riskAssessment.create({
        data: {
          userId: user.id,
          assessmentType: 'DIABETES_RISK',
          score: riskProfile.diabetes.score,
          riskCategory: riskProfile.diabetes.riskCategory,
          factors: riskProfile.diabetes.factors,
          recommendations: riskProfile.diabetes.recommendations.join('\n'),
          validUntil: new Date(
            Date.now() + riskProfile.diabetes.validityPeriod * 24 * 60 * 60 * 1000
          ),
        },
      });
      assessments.push(diabetesAssessment);
    }

    // Update health score in patient profile
    await prisma.patientProfile.update({
      where: { userId: user.id },
      data: {
        healthScore: riskProfile.overallHealthScore,
        riskScores: {
          framingham: riskProfile.framingham?.score,
          framinghamRisk: riskProfile.framingham?.percentageRisk,
          diabetes: riskProfile.diabetes?.score,
          diabetesRisk: riskProfile.diabetes?.percentageRisk,
          lastUpdated: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      riskProfile,
      assessments,
      message: 'Risk assessment calculated successfully',
    });
  } catch (error: any) {
    console.error('Risk assessment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate risk assessment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/health/risk-assessment
 * Get latest risk assessments for the current user or specified patient (for doctors)
 */
export async function GET(req: NextRequest) {
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

    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');

    // Determine target user ID
    let targetUserId = user.id;
    
    // If requesting another user's data, verify doctor access
    if (requestedUserId && requestedUserId !== user.id) {
      if (user.role !== 'DOCTOR') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Verify doctor has access to this patient
      const access = await prisma.doctorPatientAccess.findFirst({
        where: {
          doctorId: user.id,
          patientId: requestedUserId,
          status: 'APPROVED',
        },
      });
      
      if (!access) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      
      targetUserId = requestedUserId;
    }

    // Get latest valid risk assessments
    const assessments = await prisma.riskAssessment.findMany({
      where: {
        userId: targetUserId,
        validUntil: { gte: new Date() },
      },
      orderBy: { calculatedAt: 'desc' },
      take: 10,
    });

    // Get health score from patient profile
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: targetUserId },
      select: { healthScore: true, riskScores: true },
    });

    return NextResponse.json({
      riskAssessments: assessments,
      healthScore: patientProfile?.healthScore || 0,
      riskScores: patientProfile?.riskScores || {},
    });
  } catch (error: any) {
    console.error('Error fetching risk assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk assessments' },
      { status: 500 }
    );
  }
}
