"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
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

interface EducationalResource {
  title: string;
  url: string;
  source: string;
  type: string;
  trustScore: number;
}

const HealthTracking = () => {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("overview");
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);
  const [trendData, setTrendData] = useState<{ [key: string]: BiomarkerTrend[] }>({});
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [educationalResources, setEducationalResources] = useState<EducationalResource[]>([]);
  
  // Goal form state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    targetMetric: "cholesterol_ldl",
    currentValue: "",
    targetValue: "",
    unit: "mg/dL",
    targetDate: "",
  });

  useEffect(() => {
    fetchHealthData();
  }, []);

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
      const response = await fetch("/api/health/trends");
      const data = await response.json();
      
      if (response.ok) {
        setTrends(data.trends || []);
        setTrendData(data.trendData || {});
      } else {
        console.error("Failed to fetch trends:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch trends:", error);
    }
  };

  const fetchRiskAssessments = async () => {
    try {
      const response = await fetch("/api/health/risk-assessment");
      const data = await response.json();
      
      if (response.ok) {
        setRiskAssessments(data.riskAssessments || []);
        setHealthScore(data.healthScore);
        
        // Extract educational resources from risk assessments
        const resources: EducationalResource[] = [];
        data.riskAssessments?.forEach((risk: RiskAssessment) => {
          if (risk.assessmentType === "FRAMINGHAM_CVD") {
            resources.push({
              title: "Understanding Your Heart Disease Risk",
              url: "https://www.heart.org/en/health-topics/heart-attack/understand-your-risks-to-prevent-a-heart-attack",
              source: "American Heart Association",
              type: "ARTICLE",
              trustScore: 10,
            });
          } else if (risk.assessmentType === "DIABETES_RISK") {
            resources.push({
              title: "Preventing Type 2 Diabetes",
              url: "https://www.cdc.gov/diabetes/prevention/",
              source: "CDC",
              type: "ARTICLE",
              trustScore: 10,
            });
          }
        });
        setEducationalResources(resources);
      } else {
        console.error("Failed to fetch risk assessments:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch risk assessments:", error);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/health/goals");
      const data = await response.json();
      
      if (response.ok) {
        setGoals(data.goals || []);
      } else {
        console.error("Failed to fetch goals:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goalForm.title || !goalForm.currentValue || !goalForm.targetValue || !goalForm.targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/health/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...goalForm,
          currentValue: parseFloat(goalForm.currentValue),
          targetValue: parseFloat(goalForm.targetValue),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Health goal created successfully!");
        setShowGoalModal(false);
        setGoalForm({
          title: "",
          description: "",
          targetMetric: "cholesterol_ldl",
          currentValue: "",
          targetValue: "",
          unit: "mg/dL",
          targetDate: "",
        });
        await fetchGoals();
      } else {
        toast.error(data.error || "Failed to create goal");
      }
    } catch (error) {
      toast.error("Failed to create goal");
      console.error("Create goal error:", error);
    }
  };

  const handleRecordProgress = async (goalId: string) => {
    const value = prompt("Enter new value:");
    if (!value) return;

    const notes = prompt("Add notes (optional):");

    try {
      const response = await fetch("/api/health/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId,
          value: parseFloat(value),
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Progress recorded!");
        await fetchGoals();
      } else {
        toast.error(data.error || "Failed to record progress");
      }
    } catch (error) {
      toast.error("Failed to record progress");
      console.error("Record progress error:", error);
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
    <div>
      {/* Sub-navigation */}
      <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-dark-3">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`pb-3 text-sm font-medium transition ${
            activeSubTab === "overview"
              ? "border-b-2 border-primary text-primary"
              : "text-body-color hover:text-primary dark:text-dark-6"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSubTab("trends")}
          className={`pb-3 text-sm font-medium transition ${
            activeSubTab === "trends"
              ? "border-b-2 border-primary text-primary"
              : "text-body-color hover:text-primary dark:text-dark-6"
          }`}
        >
          Biomarker Trends
        </button>
        <button
          onClick={() => setActiveSubTab("risk")}
          className={`pb-3 text-sm font-medium transition ${
            activeSubTab === "risk"
              ? "border-b-2 border-primary text-primary"
              : "text-body-color hover:text-primary dark:text-dark-6"
          }`}
        >
          Risk Assessment
        </button>
        <button
          onClick={() => setActiveSubTab("goals")}
          className={`pb-3 text-sm font-medium transition ${
            activeSubTab === "goals"
              ? "border-b-2 border-primary text-primary"
              : "text-body-color hover:text-primary dark:text-dark-6"
          }`}
        >
          Health Goals
        </button>
        <button
          onClick={() => setActiveSubTab("education")}
          className={`pb-3 text-sm font-medium transition ${
            activeSubTab === "education"
              ? "border-b-2 border-primary text-primary"
              : "text-body-color hover:text-primary dark:text-dark-6"
          }`}
        >
          Educational Resources
        </button>
      </div>

      {/* Overview Tab */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Health Score */}
          {healthScore !== null && (
            <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-primary/10 to-primary/5 p-6 dark:border-dark-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-dark dark:text-white">
                    Overall Health Score
                  </h3>
                  <p className="text-sm text-body-color dark:text-dark-6">
                    Based on your biomarkers and risk assessments
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">{healthScore.toFixed(0)}</div>
                  <div className="text-sm text-body-color dark:text-dark-6">out of 100</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-3 dark:bg-dark">
              <h4 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                Tracked Biomarkers
              </h4>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {trends.length}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-3 dark:bg-dark">
              <h4 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                Active Goals
              </h4>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {goals.filter((g) => g.status === "IN_PROGRESS").length}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-3 dark:bg-dark">
              <h4 className="mb-2 text-sm font-medium text-body-color dark:text-dark-6">
                Risk Assessments
              </h4>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {riskAssessments.length}
              </p>
            </div>
          </div>

          {/* Recent Trends Summary */}
          {trends.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark">
              <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                Recent Biomarker Trends
              </h3>
              <div className="space-y-3">
                {trends.slice(0, 3).map((trend, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-dark-2"
                  >
                    <div>
                      <p className="font-medium text-dark dark:text-white">
                        {formatBiomarkerName(trend.biomarkerType)}
                      </p>
                      <p className="text-sm text-body-color dark:text-dark-6">
                        Latest: {trend.latestValue} {trend.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl ${getTrendColor(trend.trend)}`}>
                        {getTrendIcon(trend.trend)}
                      </span>
                      <p className={`text-sm font-medium ${getTrendColor(trend.trend)}`}>
                        {trend.percentageChange != null && trend.percentageChange > 0 ? "+" : ""}
                        {trend.percentageChange != null ? trend.percentageChange.toFixed(1) : "0.0"}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Goals Summary */}
          {goals.filter((g) => g.status === "IN_PROGRESS").length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark">
              <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                Active Health Goals
              </h3>
              <div className="space-y-3">
                {goals
                  .filter((g) => g.status === "IN_PROGRESS")
                  .slice(0, 2)
                  .map((goal) => (
                    <div
                      key={goal.id}
                      className="rounded-md border border-gray-200 p-4 dark:border-dark-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-dark dark:text-white">
                          {goal.title}
                        </h4>
                        <span className="text-sm font-medium text-primary">
                          {goal.progress != null ? goal.progress.toFixed(0) : 0}%
                        </span>
                      </div>
                      <div className="mb-2 h-2 w-full rounded-full bg-gray-200 dark:bg-dark-3">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(goal.progress ?? 0, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-body-color dark:text-dark-6">
                        {goal.daysRemaining != null ? goal.daysRemaining : 'N/A'} days remaining
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Biomarker Trends Tab */}
      {activeSubTab === "trends" && (
        <div className="space-y-6">
          {trends.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-3 dark:bg-dark">
              <p className="text-body-color dark:text-dark-6">
                No biomarker trends yet. Upload blood test reports to start tracking!
              </p>
            </div>
          ) : (
            trends.map((trend, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-dark dark:text-white">
                      {formatBiomarkerName(trend.biomarkerType)}
                    </h3>
                    <p className="text-sm text-body-color dark:text-dark-6">
                      {typeof trend.dataPoints === 'number' ? trend.dataPoints : 0} measurements tracked
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

                {/* Chart */}
                {trendData[trend.biomarkerType] && trendData[trend.biomarkerType].length > 0 && (
                  <div className="mb-4">
                    <ResponsiveContainer width="100%" height={200}>
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

                <div className="grid gap-4 sm:grid-cols-3">
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
              </div>
            ))
          )}
        </div>
      )}

      {/* Risk Assessment Tab */}
      {activeSubTab === "risk" && (
        <div className="space-y-6">
          {riskAssessments.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-3 dark:bg-dark">
              <p className="text-body-color dark:text-dark-6">
                No risk assessments available yet. Upload medical reports to generate risk profiles.
              </p>
            </div>
          ) : (
            riskAssessments.map((risk) => (
              <div
                key={risk.id}
                className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-dark dark:text-white">
                      {risk.assessmentType === "FRAMINGHAM_CVD"
                        ? "Cardiovascular Disease Risk"
                        : "Type 2 Diabetes Risk"}
                    </h3>
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
                  <h4 className="font-semibold text-dark dark:text-white">
                    Recommendations:
                  </h4>
                  <div className="whitespace-pre-line text-sm text-body-color dark:text-dark-6">
                    {risk.recommendations}
                  </div>
                </div>

                <p className="mt-4 text-xs text-body-color dark:text-dark-6">
                  Valid until {new Date(risk.validUntil).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Health Goals Tab */}
      {activeSubTab === "goals" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowGoalModal(true)}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              Create New Goal
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-3 dark:bg-dark">
              <p className="text-body-color dark:text-dark-6">
                No health goals set yet. Create your first goal to start tracking progress!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 dark:border-dark-3 dark:bg-dark"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="text-lg font-bold text-dark dark:text-white">
                      {goal.title}
                    </h3>
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
                        {goal.progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-dark-3">
                      <div
                        className="h-3 rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
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
                    <p className="mb-2 text-xs text-body-color dark:text-dark-6">
                      {goal.status === "IN_PROGRESS" && goal.daysRemaining >= 0
                        ? `${goal.daysRemaining} days remaining`
                        : goal.status === "OVERDUE"
                        ? `${Math.abs(goal.daysRemaining)} days overdue`
                        : `Target date: ${new Date(goal.targetDate).toLocaleDateString()}`}
                    </p>
                    {goal.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleRecordProgress(goal.id)}
                        className="w-full rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-white"
                      >
                        Record Progress
                      </button>
                    )}
                    {goal.status === "ACHIEVED" && (
                      <div className="rounded-md bg-green-50 p-3 text-center dark:bg-green-900/20">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          🎉 Goal Achieved!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Educational Resources Tab */}
      {activeSubTab === "education" && (
        <div className="space-y-4">
          {educationalResources.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-3 dark:bg-dark">
              <p className="text-body-color dark:text-dark-6">
                No educational resources yet. Resources will appear based on your health data and risk assessments.
              </p>
            </div>
          ) : (
            educationalResources.map((resource, idx) => (
              <a
                key={idx}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-md dark:border-dark-3 dark:bg-dark"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-bold text-dark dark:text-white">
                      {resource.title}
                    </h3>
                    <p className="mb-2 text-sm text-body-color dark:text-dark-6">
                      {resource.source} • {resource.type}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-body-color dark:text-dark-6">
                        Trust Score:
                      </span>
                      <div className="flex gap-1">
                        {[...Array(10)].map((_, i) => (
                          <span
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i < resource.trustScore
                                ? "bg-primary"
                                : "bg-gray-300 dark:bg-dark-3"
                            }`}
                          ></span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </a>
            ))
          )}
        </div>
      )}

      {/* Create Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-dark">
            <h3 className="mb-4 text-xl font-bold text-dark dark:text-white">
              Create Health Goal
            </h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="e.g., Lower LDL Cholesterol"
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  placeholder="Describe your goal..."
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                ></textarea>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    Target Metric *
                  </label>
                  <select
                    value={goalForm.targetMetric}
                    onChange={(e) => {
                      const metric = e.target.value;
                      let unit = "mg/dL";
                      if (metric === "weight") unit = "kg";
                      if (metric === "hba1c") unit = "%";
                      if (metric.includes("bp")) unit = "mmHg";
                      setGoalForm({ ...goalForm, targetMetric: metric, unit });
                    }}
                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  >
                    <option value="cholesterol_ldl">LDL Cholesterol</option>
                    <option value="cholesterol_total">Total Cholesterol</option>
                    <option value="cholesterol_hdl">HDL Cholesterol</option>
                    <option value="triglycerides">Triglycerides</option>
                    <option value="glucose_fasting">Fasting Glucose</option>
                    <option value="hba1c">HbA1c</option>
                    <option value="weight">Weight</option>
                    <option value="bp_systolic">Systolic BP</option>
                    <option value="bp_diastolic">Diastolic BP</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={goalForm.unit}
                    onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition dark:border-dark-3 dark:text-white"
                    readOnly
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    Current Value *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={goalForm.currentValue}
                    onChange={(e) => setGoalForm({ ...goalForm, currentValue: e.target.value })}
                    placeholder="e.g., 165"
                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    Target Value *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={goalForm.targetValue}
                    onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })}
                    placeholder="e.g., 100"
                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                  className="w-full rounded-md border border-stroke bg-transparent px-4 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalModal(false);
                    setGoalForm({
                      title: "",
                      description: "",
                      targetMetric: "cholesterol_ldl",
                      currentValue: "",
                      targetValue: "",
                      unit: "mg/dL",
                      targetDate: "",
                    });
                  }}
                  className="flex-1 rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthTracking;
