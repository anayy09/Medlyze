/**
 * Longitudinal Trend Analysis for Biomarkers
 * Tracks patient health metrics over time and identifies patterns
 */

import { prisma } from '@/utils/prismaDB';

export interface BiomarkerData {
  type: string;
  value: number;
  unit: string;
  date: Date;
  reportId?: string;
}

export interface TrendResult {
  biomarkerType: string;
  currentValue: number;
  previousValue?: number;
  changePercent?: number;
  trend: 'IMPROVING' | 'WORSENING' | 'STABLE' | 'INSUFFICIENT_DATA';
  interpretation: string;
  alert?: string;
  dataPoints: Array<{ date: Date; value: number }>;
}

/**
 * Extract biomarkers from AI analysis findings
 */
export function extractBiomarkers(
  analysisFindings: string,
  reportType: string
): BiomarkerData[] {
  const biomarkers: BiomarkerData[] = [];
  const date = new Date();

  try {
    // Parse findings as JSON if it's structured
    const findings = JSON.parse(analysisFindings);

    // Extract based on report type
    switch (reportType) {
      case 'BLOOD_TEST':
        if (findings.cholesterol) {
          if (findings.cholesterol.total) {
            biomarkers.push({
              type: 'cholesterol_total',
              value: findings.cholesterol.total,
              unit: 'mg/dL',
              date,
            });
          }
          if (findings.cholesterol.hdl) {
            biomarkers.push({
              type: 'cholesterol_hdl',
              value: findings.cholesterol.hdl,
              unit: 'mg/dL',
              date,
            });
          }
          if (findings.cholesterol.ldl) {
            biomarkers.push({
              type: 'cholesterol_ldl',
              value: findings.cholesterol.ldl,
              unit: 'mg/dL',
              date,
            });
          }
          if (findings.cholesterol.triglycerides) {
            biomarkers.push({
              type: 'triglycerides',
              value: findings.cholesterol.triglycerides,
              unit: 'mg/dL',
              date,
            });
          }
        }

        if (findings.glucose !== undefined) {
          biomarkers.push({
            type: 'glucose_fasting',
            value: findings.glucose,
            unit: 'mg/dL',
            date,
          });
        }

        if (findings.hba1c !== undefined) {
          biomarkers.push({
            type: 'hba1c',
            value: findings.hba1c,
            unit: '%',
            date,
          });
        }

        if (findings.creatinine !== undefined) {
          biomarkers.push({
            type: 'creatinine',
            value: findings.creatinine,
            unit: 'mg/dL',
            date,
          });
        }
        break;

      case 'ECG':
        if (findings.heartRate) {
          biomarkers.push({
            type: 'heart_rate',
            value: findings.heartRate,
            unit: 'bpm',
            date,
          });
        }
        if (findings.intervals?.QTc) {
          biomarkers.push({
            type: 'qtc_interval',
            value: findings.intervals.QTc,
            unit: 'ms',
            date,
          });
        }
        break;
    }
  } catch (error) {
    // If findings aren't JSON, try regex extraction
    console.log('Could not parse findings as JSON, attempting regex extraction');
    
    // Extract common patterns
    const patterns = [
      { regex: /total cholesterol[:\s]+(\d+\.?\d*)\s*mg\/dL/i, type: 'cholesterol_total', unit: 'mg/dL' },
      { regex: /HDL[:\s]+(\d+\.?\d*)\s*mg\/dL/i, type: 'cholesterol_hdl', unit: 'mg/dL' },
      { regex: /LDL[:\s]+(\d+\.?\d*)\s*mg\/dL/i, type: 'cholesterol_ldl', unit: 'mg/dL' },
      { regex: /glucose[:\s]+(\d+\.?\d*)\s*mg\/dL/i, type: 'glucose_fasting', unit: 'mg/dL' },
      { regex: /HbA1c[:\s]+(\d+\.?\d*)\s*%/i, type: 'hba1c', unit: '%' },
      { regex: /heart rate[:\s]+(\d+\.?\d*)\s*bpm/i, type: 'heart_rate', unit: 'bpm' },
      { regex: /blood pressure[:\s]+(\d+)\/(\d+)/i, type: 'blood_pressure', unit: 'mmHg' },
    ];

    for (const pattern of patterns) {
      const match = analysisFindings.match(pattern.regex);
      if (match) {
        if (pattern.type === 'blood_pressure') {
          biomarkers.push({
            type: 'bp_systolic',
            value: parseInt(match[1]),
            unit: 'mmHg',
            date,
          });
          biomarkers.push({
            type: 'bp_diastolic',
            value: parseInt(match[2]),
            unit: 'mmHg',
            date,
          });
        } else {
          biomarkers.push({
            type: pattern.type,
            value: parseFloat(match[1]),
            unit: pattern.unit,
            date,
          });
        }
      }
    }
  }

  return biomarkers;
}

/**
 * Analyze trend for a specific biomarker
 */
export async function analyzeBiomarkerTrend(
  userId: string,
  biomarkerType: string,
  minDataPoints: number = 2
): Promise<TrendResult> {
  // Fetch historical data for this biomarker
  const historicalData = await prisma.biomarkerTrend.findMany({
    where: {
      userId,
      biomarkerType,
    },
    orderBy: {
      recordedDate: 'desc',
    },
    take: 12, // Last 12 measurements
  });

  if (historicalData.length < minDataPoints) {
    return {
      biomarkerType,
      currentValue: historicalData[0]?.value || 0,
      trend: 'INSUFFICIENT_DATA',
      interpretation: `Not enough historical data to determine trend. Need at least ${minDataPoints} measurements.`,
      dataPoints: historicalData.map(d => ({ date: d.recordedDate, value: d.value })),
    };
  }

  const currentValue = historicalData[0].value;
  const previousValue = historicalData[1].value;
  const changePercent = ((currentValue - previousValue) / previousValue) * 100;

  // Determine if the trend is improving or worsening based on biomarker type
  let trend: 'IMPROVING' | 'WORSENING' | 'STABLE';
  let interpretation: string;
  let alert: string | undefined;

  const thresholds = getBiomarkerThresholds(biomarkerType);
  
  // Calculate overall trend direction (simple linear regression)
  const trendDirection = calculateTrendDirection(historicalData.map(d => d.value));

  // For biomarkers where lower is better
  if (thresholds.lowerIsBetter) {
    if (trendDirection < -5) {
      trend = 'IMPROVING';
      interpretation = `${biomarkerType.replace(/_/g, ' ')} is decreasing over time (${changePercent.toFixed(1)}% decrease from last measurement).`;
    } else if (trendDirection > 5) {
      trend = 'WORSENING';
      interpretation = `${biomarkerType.replace(/_/g, ' ')} is increasing over time (${changePercent.toFixed(1)}% increase from last measurement).`;
      if (currentValue > thresholds.high) {
        alert = `⚠️ Current value (${currentValue}) is above healthy range (>${thresholds.high} ${historicalData[0].unit})`;
      }
    } else {
      trend = 'STABLE';
      interpretation = `${biomarkerType.replace(/_/g, ' ')} remains relatively stable.`;
    }
  } else {
    // For biomarkers where higher is better (like HDL cholesterol)
    if (trendDirection > 5) {
      trend = 'IMPROVING';
      interpretation = `${biomarkerType.replace(/_/g, ' ')} is increasing over time (${changePercent.toFixed(1)}% increase).`;
    } else if (trendDirection < -5) {
      trend = 'WORSENING';
      interpretation = `${biomarkerType.replace(/_/g, ' ')} is decreasing over time (${changePercent.toFixed(1)}% decrease).`;
      if (currentValue < thresholds.low) {
        alert = `⚠️ Current value (${currentValue}) is below healthy range (<${thresholds.low} ${historicalData[0].unit})`;
      }
    } else {
      trend = 'STABLE';
      interpretation = `${biomarkerType.replace(/_/g, ' ')} remains relatively stable.`;
    }
  }

  return {
    biomarkerType,
    currentValue,
    previousValue,
    changePercent,
    trend,
    interpretation,
    alert,
    dataPoints: historicalData.map(d => ({ date: d.recordedDate, value: d.value })),
  };
}

/**
 * Calculate trend direction using simple linear regression
 * Returns the slope (positive = increasing, negative = decreasing)
 */
function calculateTrendDirection(values: number[]): number {
  if (values.length < 2) return 0;

  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  // Convert slope to percentage change per measurement
  const avgValue = sumY / n;
  return (slope / avgValue) * 100;
}

/**
 * Get healthy ranges and thresholds for biomarkers
 */
function getBiomarkerThresholds(biomarkerType: string): {
  low: number;
  high: number;
  lowerIsBetter: boolean;
} {
  const thresholds: Record<string, any> = {
    cholesterol_total: { low: 125, high: 200, lowerIsBetter: true },
    cholesterol_ldl: { low: 0, high: 100, lowerIsBetter: true },
    cholesterol_hdl: { low: 40, high: 200, lowerIsBetter: false }, // Higher is better
    triglycerides: { low: 0, high: 150, lowerIsBetter: true },
    glucose_fasting: { low: 70, high: 100, lowerIsBetter: true },
    hba1c: { low: 4, high: 5.7, lowerIsBetter: true },
    bp_systolic: { low: 90, high: 120, lowerIsBetter: true },
    bp_diastolic: { low: 60, high: 80, lowerIsBetter: true },
    heart_rate: { low: 60, high: 100, lowerIsBetter: true },
    creatinine: { low: 0.6, high: 1.2, lowerIsBetter: true },
  };

  return thresholds[biomarkerType] || { low: 0, high: Infinity, lowerIsBetter: true };
}

/**
 * Get comprehensive trend analysis for all biomarkers
 */
export async function getComprehensiveTrendAnalysis(userId: string): Promise<{
  trends: TrendResult[];
  summary: string;
  alerts: string[];
}> {
  // Get all unique biomarker types for this user
  const uniqueBiomarkers = await prisma.biomarkerTrend.groupBy({
    by: ['biomarkerType'],
    where: { userId },
  });

  const trends: TrendResult[] = [];
  const alerts: string[] = [];

  for (const { biomarkerType } of uniqueBiomarkers) {
    const trend = await analyzeBiomarkerTrend(userId, biomarkerType);
    trends.push(trend);
    
    if (trend.alert) {
      alerts.push(trend.alert);
    }
  }

  // Generate summary
  const worseningCount = trends.filter(t => t.trend === 'WORSENING').length;
  const improvingCount = trends.filter(t => t.trend === 'IMPROVING').length;
  
  let summary = '';
  if (worseningCount > 0) {
    summary += `${worseningCount} biomarker(s) showing worsening trends. `;
  }
  if (improvingCount > 0) {
    summary += `${improvingCount} biomarker(s) showing improvement. `;
  }
  if (worseningCount === 0 && improvingCount === 0) {
    summary = 'All tracked biomarkers remain stable.';
  }

  return { trends, summary, alerts };
}
