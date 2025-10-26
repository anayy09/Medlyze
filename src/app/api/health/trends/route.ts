import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import { getComprehensiveTrendAnalysis } from '@/lib/trendAnalysis';

/**
 * GET /api/health/trends
 * Get longitudinal trend analysis for patient biomarkers
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
    const biomarkerType = searchParams.get('biomarkerType');
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

    if (biomarkerType) {
      // Get trend for specific biomarker
      const trendData = await prisma.biomarkerTrend.findMany({
        where: {
          userId: targetUserId,
          biomarkerType,
        },
        orderBy: { recordedDate: 'desc' },
        take: 20,
      });

      return NextResponse.json({ biomarkerType, data: trendData });
    } else {
      // Get comprehensive trend analysis
      const trendAnalysis = await getComprehensiveTrendAnalysis(targetUserId);

      // Get all biomarker data organized by type
      const biomarkersByType = await prisma.biomarkerTrend.groupBy({
        by: ['biomarkerType'],
        where: { userId: targetUserId },
      });

      const trendData: { [key: string]: any[] } = {};
      
      for (const { biomarkerType } of biomarkersByType) {
        const data = await prisma.biomarkerTrend.findMany({
          where: {
            userId: targetUserId,
            biomarkerType,
          },
          orderBy: { recordedDate: 'asc' },
          take: 20,
        });
        trendData[biomarkerType] = data;
      }

      // Map the trends to the expected frontend format
      const formattedTrends = trendAnalysis.trends.map(trend => ({
        biomarkerType: trend.biomarkerType,
        trend: trend.trend === 'INSUFFICIENT_DATA' ? 'STABLE' : trend.trend,
        percentageChange: trend.changePercent || 0,
        dataPoints: trend.dataPoints.length,
        latestValue: trend.currentValue,
        earliestValue: trend.previousValue || trend.currentValue,
        unit: trendData[trend.biomarkerType]?.[0]?.unit || '',
        alert: trend.alert,
      }));

      return NextResponse.json({
        trends: formattedTrends,
        trendData,
        summary: trendAnalysis.summary,
        alerts: trendAnalysis.alerts,
      });
    }
  } catch (error: any) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/trends
 * Manually add a biomarker data point
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { biomarkerType, value, unit, recordedDate, reportId } = body;

    if (!biomarkerType || value === undefined || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields: biomarkerType, value, unit' },
        { status: 400 }
      );
    }

    // Create biomarker entry
    const biomarker = await prisma.biomarkerTrend.create({
      data: {
        userId: user.id,
        biomarkerType,
        value: parseFloat(value),
        unit,
        recordedDate: recordedDate ? new Date(recordedDate) : new Date(),
        reportId: reportId || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      biomarker,
      message: 'Biomarker data added successfully',
    });
  } catch (error: any) {
    console.error('Error adding biomarker:', error);
    return NextResponse.json(
      { error: 'Failed to add biomarker data' },
      { status: 500 }
    );
  }
}
