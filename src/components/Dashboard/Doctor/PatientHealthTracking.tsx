"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BiomarkerTrend {
  id: string;
  biomarkerType: string;
  value: number;
  unit: string;
  recordedDate: string;
}

interface TrendAnalysis {
  biomarkerType: string;
  trend: "IMPROVING" | "WORSENING" | "STABLE";
  percentageChange: number;
  dataPoints: number;
  latestValue: number;
  earliestValue: number;
  unit: string;
  alert?: string;
}

interface RiskAssessment {
  id: string;
  assessmentType: string;
  score: number;
  riskCategory: "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";
  riskPercentage?: number;
  recommendations: string;
  createdAt: string;
  validUntil: string;
}

interface HealthGoal {
  id: string;
  title: string;
  description: string;
  targetMetric: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  targetDate: string;
  status: "IN_PROGRESS" | "ACHIEVED" | "ABANDONED" | "OVERDUE";
  progress: number;
  daysRemaining: number;
}

interface PatientHealthTrackingProps {
  patientId: string;
}

const PatientHealthTracking: React.FC<PatientHealthTrackingProps> = ({ patientId }) => {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);
  const [trendData, setTrendData] = useState<{ [key: string]: BiomarkerTrend[] }>({});
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthData();
  }, [patientId]);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTrends(),
        fetchRiskAssessments(),
        fetchGoals(),
      ]);
    } catch (error) {
      console.error("Error fetching health data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await fetch(`/api/health/trends?userId=${patientId}`);
      const data = await response.json();
      
      if (response.ok) {
        setTrends(data.trends || []);
        setTrendData(data.trendData || {});
      }
    } catch (error) {
      console.error("Failed to fetch trends:", error);
    }
  };

  const fetchRiskAssessments = async () => {
    try {
      const response = await fetch(`/api/health/risk-assessment?userId=${patientId}`);
      const data = await response.json();
      
      if (response.ok) {
        setRiskAssessments(data.riskAssessments || []);
        setHealthScore(data.healthScore);
      }
    } catch (error) {
      console.error("Failed to fetch risk assessments:", error);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await fetch(`/api/health/goals?userId=${patientId}`);
      const data = await response.json();
      
      if (response.ok) {
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "IMPROVING":
        return "↗️";
      case "WORSENING":
        return "↘️";
      default:
        return "➡️";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "IMPROVING":
        return "text-green-600 dark:text-green-400";
      case "WORSENING":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "MODERATE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "VERY_HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACHIEVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "OVERDUE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatBiomarkerName = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      {healthScore !== null && (
        <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-primary/10 to-primary/5 p-6 dark:border-dark-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-dark dark:text-white">
                Patient Health Score
              </h3>
              <p className="text-sm text-body-color dark:text-dark-6">
                Based on biomarkers and risk assessments
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{healthScore.toFixed(0)}</div>
              <div className="text-sm text-body-color dark:text-dark-6">out of 100</div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessments */}
      {riskAssessments.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-dark dark:text-white">
            Risk Assessments
          </h3>
          <div className="space-y-4">
            {riskAssessments.map((risk) => (
              <div
                key={risk.id}
                className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-dark dark:text-white">
                      {risk.assessmentType === "FRAMINGHAM_CVD"
                        ? "Cardiovascular Disease Risk"
                        : "Type 2 Diabetes Risk"}
                    </h4>
                    <p className="text-sm text-body-color dark:text-dark-6">
                      Assessed on {new Date(risk.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-4 py-2 text-sm font-medium ${getRiskColor(risk.riskCategory)}`}>
                    {risk.riskCategory} RISK
                  </span>
                </div>

                {risk.riskPercentage != null && (
                  <div className="mb-4 rounded-md bg-gray-50 p-4 dark:bg-dark-2">
                    <p className="mb-1 text-sm text-body-color dark:text-dark-6">
                      10-Year Risk
                    </p>
                    <p className="text-3xl font-bold text-dark dark:text-white">
                      {risk.riskPercentage.toFixed(1)}%
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <h5 className="font-semibold text-dark dark:text-white">
                    Recommendations:
                  </h5>
                  <div className="whitespace-pre-line text-sm text-body-color dark:text-dark-6">
                    {risk.recommendations}
                  </div>
                </div>

                <p className="mt-4 text-xs text-body-color dark:text-dark-6">
                  Valid until {new Date(risk.validUntil).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biomarker Trends */}
      {trends.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-dark dark:text-white">
            Biomarker Trends
          </h3>
          <div className="space-y-4">
            {trends.map((trend, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark"
              >
                <div
                  className="flex cursor-pointer items-start justify-between"
                  onClick={() => setExpandedTrend(expandedTrend === trend.biomarkerType ? null : trend.biomarkerType)}
                >
                  <div>
                    <h4 className="text-lg font-bold text-dark dark:text-white">
                      {formatBiomarkerName(trend.biomarkerType)}
                    </h4>
                    <p className="text-sm text-body-color dark:text-dark-6">
                      {typeof trend.dataPoints === 'number' ? trend.dataPoints : 0} measurements • Click to expand
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl ${getTrendColor(trend.trend)}`}>
                      {getTrendIcon(trend.trend)}
                    </span>
                    <p className={`text-sm font-medium ${getTrendColor(trend.trend)}`}>
                      {trend.trend}
                    </p>
                  </div>
                </div>

                {expandedTrend === trend.biomarkerType && (
                  <>
                    {/* Chart */}
                    {trendData[trend.biomarkerType] && trendData[trend.biomarkerType].length > 0 && (
                      <div className="my-4">
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart
                            data={trendData[trend.biomarkerType].map((d) => {
                              const chartData = {
                                date: new Date(d.recordedDate).toLocaleDateString(),
                                value: d.value,
                              };
                              return chartData;
                            })}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              name={trend.unit}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    <div className="grid gap-4 border-t border-gray-200 pt-4 dark:border-dark-3 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-body-color dark:text-dark-6">Latest Value</p>
                        <p className="text-lg font-semibold text-dark dark:text-white">
                          {trend.latestValue} {trend.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-body-color dark:text-dark-6">Earliest Value</p>
                        <p className="text-lg font-semibold text-dark dark:text-white">
                          {trend.earliestValue} {trend.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-body-color dark:text-dark-6">Change</p>
                        <p className={`text-lg font-semibold ${getTrendColor(trend.trend)}`}>
                          {trend.percentageChange != null && trend.percentageChange > 0 ? "+" : ""}
                          {trend.percentageChange != null ? trend.percentageChange.toFixed(1) : "0.0"}%
                        </p>
                      </div>
                    </div>

                    {trend.alert && (
                      <div className="mt-4 rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          ⚠️ {trend.alert}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Goals */}
      {goals.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-dark dark:text-white">
            Patient Health Goals
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h4 className="text-lg font-bold text-dark dark:text-white">
                    {goal.title}
                  </h4>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(goal.status)}`}>
                    {goal.status.replace("_", " ")}
                  </span>
                </div>

                <p className="mb-4 text-sm text-body-color dark:text-dark-6">
                  {goal.description}
                </p>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-body-color dark:text-dark-6">Progress</span>
                    <span className="font-semibold text-primary">
                      {goal.progress != null ? goal.progress.toFixed(0) : 0}%
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-dark-3">
                    <div
                      className="h-3 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(goal.progress ?? 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-body-color dark:text-dark-6">Current</p>
                    <p className="font-semibold text-dark dark:text-white">
                      {goal.currentValue} {goal.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-body-color dark:text-dark-6">Target</p>
                    <p className="font-semibold text-dark dark:text-white">
                      {goal.targetValue} {goal.unit}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-dark-3">
                  <p className="text-xs text-body-color dark:text-dark-6">
                    {goal.status === "IN_PROGRESS" && goal.daysRemaining >= 0
                      ? `${goal.daysRemaining} days remaining`
                      : goal.status === "OVERDUE"
                      ? `${Math.abs(goal.daysRemaining)} days overdue`
                      : `Target date: ${new Date(goal.targetDate).toLocaleDateString()}`}
                  </p>
                  {goal.status === "ACHIEVED" && (
                    <div className="mt-2 rounded-md bg-green-50 p-3 text-center dark:bg-green-900/20">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        🎉 Goal Achieved!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {trends.length === 0 && riskAssessments.length === 0 && goals.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-3 dark:bg-dark">
          <p className="text-body-color dark:text-dark-6">
            No health tracking data available for this patient yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientHealthTracking;
