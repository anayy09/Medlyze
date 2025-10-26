import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import { getGoalEducationalResources } from '@/lib/educationalContent';

/**
 * GET /api/health/goals
 * Get all health goals for the patient or specified patient (for doctors)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { patientProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');

    // Determine target user ID
    let targetProfile: any;
    
    if (requestedUserId && requestedUserId !== user.id) {
      // Doctor requesting patient's goals
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
      
      // Get patient profile
      const targetPatient = await prisma.user.findUnique({
        where: { id: requestedUserId },
        include: { patientProfile: true },
      });
      
      if (!targetPatient?.patientProfile) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
      }
      
      targetProfile = targetPatient.patientProfile;
    } else {
      // Patient requesting their own goals
      if (!user.patientProfile) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
      }
      targetProfile = user.patientProfile;
    }

    const goals = await prisma.healthGoal.findMany({
      where: { patientProfileId: targetProfile.id },
      include: {
        progress: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate progress percentage for each goal
    const goalsWithProgress = goals.map(goal => {
      const latestProgress = goal.progress[0];
      const progressPercentage = latestProgress
        ? Math.round(((latestProgress.value - (goal.currentValue || 0)) / 
            (goal.targetValue - (goal.currentValue || 0))) * 100)
        : 0;

      return {
        ...goal,
        progress: progressPercentage,
        progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
        daysRemaining: Math.ceil(
          (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      };
    });

    return NextResponse.json({ goals: goalsWithProgress });
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

/**
 * POST /api/health/goals
 * Create a new health goal
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

    if (!user || !user.patientProfile) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      targetMetric,
      currentValue,
      targetValue,
      unit,
      targetDate,
    } = body;

    if (!title || !targetMetric || !targetValue || !unit || !targetDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const goal = await prisma.healthGoal.create({
      data: {
        patientProfileId: user.patientProfile.id,
        title,
        description,
        targetMetric,
        currentValue: currentValue ? parseFloat(currentValue) : null,
        targetValue: parseFloat(targetValue),
        unit,
        targetDate: new Date(targetDate),
        createdBy: user.id,
        status: 'IN_PROGRESS',
      },
    });

    // Get educational resources for this goal type
    const educationalResources = getGoalEducationalResources(targetMetric);

    return NextResponse.json({
      success: true,
      goal,
      educationalResources,
      message: 'Health goal created successfully',
    });
  } catch (error: any) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/health/goals
 * Update goal status or record progress
 */
export async function PATCH(req: NextRequest) {
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
    const { goalId, action, value, notes, status } = body;

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
    }

    // Verify goal ownership
    const goal = await prisma.healthGoal.findFirst({
      where: {
        id: goalId,
        patientProfile: { userId: user.id },
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found or access denied' },
        { status: 404 }
      );
    }

    if (action === 'record_progress') {
      // Record new progress entry
      if (value === undefined) {
        return NextResponse.json(
          { error: 'Value required for progress recording' },
          { status: 400 }
        );
      }

      const progress = await prisma.goalProgress.create({
        data: {
          goalId,
          value: parseFloat(value),
          notes,
        },
      });

      // Check if goal is achieved
      const isAchieved =
        goal.targetMetric.includes('decrease') || goal.targetMetric.includes('lower')
          ? parseFloat(value) <= goal.targetValue
          : parseFloat(value) >= goal.targetValue;

      if (isAchieved && goal.status !== 'ACHIEVED') {
        await prisma.healthGoal.update({
          where: { id: goalId },
          data: { status: 'ACHIEVED' },
        });
      }

      return NextResponse.json({
        success: true,
        progress,
        goalAchieved: isAchieved,
        message: isAchieved
          ? '🎉 Congratulations! Goal achieved!'
          : 'Progress recorded successfully',
      });
    } else if (action === 'update_status') {
      // Update goal status
      const updatedGoal = await prisma.healthGoal.update({
        where: { id: goalId },
        data: { status },
      });

      return NextResponse.json({
        success: true,
        goal: updatedGoal,
        message: 'Goal status updated successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
