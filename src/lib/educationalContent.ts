/**
 * Educational Content Recommendation System
 * Provides curated health education resources based on medical conditions and findings
 */

export interface EducationalResource {
  title: string;
  description: string;
  url: string;
  source: string;
  type: 'ARTICLE' | 'VIDEO' | 'INFOGRAPHIC' | 'INTERACTIVE';
  trustScore: number; // 1-10, based on source credibility
}

/**
 * Curated educational resources for various medical conditions
 */
const EDUCATIONAL_DATABASE: Record<string, EducationalResource[]> = {
  // Cardiovascular conditions
  hypertension: [
    {
      title: 'Understanding High Blood Pressure',
      description: 'Learn about causes, symptoms, and management of hypertension.',
      url: 'https://www.heart.org/en/health-topics/high-blood-pressure',
      source: 'American Heart Association',
      type: 'ARTICLE',
      trustScore: 10,
    },
    {
      title: 'DASH Diet for Blood Pressure Control',
      description: 'Evidence-based dietary approach to lowering blood pressure.',
      url: 'https://www.nhlbi.nih.gov/education/dash-eating-plan',
      source: 'NHLBI',
      type: 'ARTICLE',
      trustScore: 10,
    },
    {
      title: 'How to Measure Blood Pressure at Home',
      description: 'Step-by-step guide to accurate home blood pressure monitoring.',
      url: 'https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/in-depth/high-blood-pressure/art-20047889',
      source: 'Mayo Clinic',
      type: 'VIDEO',
      trustScore: 9,
    },
  ],

  high_cholesterol: [
    {
      title: 'Cholesterol: What You Need to Know',
      description: 'Understanding LDL, HDL, and how to improve your cholesterol levels.',
      url: 'https://www.heart.org/en/health-topics/cholesterol',
      source: 'American Heart Association',
      type: 'ARTICLE',
      trustScore: 10,
    },
    {
      title: 'Foods That Lower Cholesterol',
      description: 'Evidence-based nutrition guide for cholesterol management.',
      url: 'https://www.health.harvard.edu/heart-health/11-foods-that-lower-cholesterol',
      source: 'Harvard Health',
      type: 'ARTICLE',
      trustScore: 9,
    },
  ],

  // Diabetes
  diabetes: [
    {
      title: 'Understanding Type 2 Diabetes',
      description: 'Comprehensive guide to diabetes diagnosis, management, and prevention.',
      url: 'https://www.diabetes.org/diabetes/type-2',
      source: 'American Diabetes Association',
      type: 'ARTICLE',
      trustScore: 10,
    },
    {
      title: 'Blood Sugar Monitoring Basics',
      description: 'How and when to check your blood glucose levels.',
      url: 'https://www.cdc.gov/diabetes/managing/manage-blood-sugar.html',
      source: 'CDC',
      type: 'ARTICLE',
      trustScore: 10,
    },
    {
      title: 'Diabetes Meal Planning',
      description: 'Create a healthy eating plan to manage blood sugar.',
      url: 'https://www.diabetes.org/nutrition',
      source: 'American Diabetes Association',
      type: 'INTERACTIVE',
      trustScore: 10,
    },
  ],

  prediabetes: [
    {
      title: 'Preventing Type 2 Diabetes',
      description: 'Evidence-based strategies to prevent diabetes progression.',
      url: 'https://www.cdc.gov/diabetes/prevention/index.html',
      source: 'CDC',
      type: 'ARTICLE',
      trustScore: 10,
    },
    {
      title: 'Prediabetes: Your Guide to Action',
      description: 'Understand prediabetes and take steps to reverse it.',
      url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-type-2-diabetes/prediabetes-insulin-resistance',
      source: 'NIDDK',
      type: 'ARTICLE',
      trustScore: 10,
    },
  ],

  // Heart conditions
  arrhythmia: [
    {
      title: 'Understanding Heart Arrhythmias',
      description: 'Types, causes, and treatments for irregular heartbeats.',
      url: 'https://www.heart.org/en/health-topics/arrhythmia',
      source: 'American Heart Association',
      type: 'ARTICLE',
      trustScore: 10,
    },
    {
      title: 'Atrial Fibrillation Overview',
      description: 'Learn about AFib, the most common arrhythmia.',
      url: 'https://www.stroke.org/en/about-stroke/types-of-stroke/atrial-fibrillation',
      source: 'American Stroke Association',
      type: 'VIDEO',
      trustScore: 9,
    },
  ],

  coronary_artery_disease: [
    {
      title: 'Coronary Artery Disease Basics',
      description: 'Understanding CAD and how to manage it.',
      url: 'https://www.heart.org/en/health-topics/heart-attack/about-heart-attacks/coronary-artery-disease',
      source: 'American Heart Association',
      type: 'ARTICLE',
      trustScore: 10,
    },
  ],

  // General health topics
  weight_management: [
    {
      title: 'Healthy Weight Loss Strategies',
      description: 'Evidence-based approaches to sustainable weight loss.',
      url: 'https://www.cdc.gov/healthyweight/losing_weight/index.html',
      source: 'CDC',
      type: 'ARTICLE',
      trustScore: 10,
    },
    {
      title: 'Physical Activity for Health',
      description: 'Guidelines for exercise and physical activity.',
      url: 'https://www.heart.org/en/healthy-living/fitness',
      source: 'American Heart Association',
      type: 'INTERACTIVE',
      trustScore: 10,
    },
  ],

  smoking_cessation: [
    {
      title: 'How to Quit Smoking',
      description: 'Proven strategies and resources to quit tobacco.',
      url: 'https://www.cdc.gov/tobacco/quit_smoking/index.htm',
      source: 'CDC',
      type: 'ARTICLE',
      trustScore: 10,
    },
    {
      title: 'Quitline Support',
      description: 'Free telephone and online support for quitting smoking.',
      url: 'https://www.cancer.org/healthy/stay-away-from-tobacco/guide-quitting-smoking.html',
      source: 'American Cancer Society',
      type: 'INTERACTIVE',
      trustScore: 9,
    },
  ],

  // Imaging findings
  abnormal_xray: [
    {
      title: 'Understanding Your Chest X-Ray',
      description: 'What chest X-rays show and what findings mean.',
      url: 'https://www.radiologyinfo.org/en/info/chestrad',
      source: 'Radiological Society of North America',
      type: 'ARTICLE',
      trustScore: 9,
    },
  ],

  lung_nodule: [
    {
      title: 'Lung Nodules: What You Need to Know',
      description: 'Understanding pulmonary nodules and follow-up care.',
      url: 'https://www.lung.org/lung-health-diseases/lung-disease-lookup/lung-nodules',
      source: 'American Lung Association',
      type: 'ARTICLE',
      trustScore: 9,
    },
  ],
};

/**
 * Generate educational recommendations based on medical findings
 */
export function getEducationalRecommendations(
  findings: string,
  reportType: string,
  riskLevel?: string
): EducationalResource[] {
  const resources: EducationalResource[] = [];
  const findingsLower = findings.toLowerCase();

  // Check for specific conditions mentioned in findings
  for (const [condition, conditionResources] of Object.entries(EDUCATIONAL_DATABASE)) {
    if (findingsLower.includes(condition.replace(/_/g, ' '))) {
      resources.push(...conditionResources);
    }
  }

  // Add resources based on report type
  if (reportType === 'ECG' && resources.length === 0) {
    // General ECG education
    resources.push({
      title: 'Understanding Your ECG Results',
      description: 'Learn how electrocardiograms work and what they show.',
      url: 'https://www.heart.org/en/health-topics/heart-attack/diagnosing-a-heart-attack/electrocardiogram-ecg-or-ekg',
      source: 'American Heart Association',
      type: 'ARTICLE',
      trustScore: 10,
    });
  }

  if (reportType === 'BLOOD_TEST') {
    // Common patterns in blood tests
    if (findingsLower.includes('cholesterol') || findingsLower.includes('lipid')) {
      resources.push(...(EDUCATIONAL_DATABASE.high_cholesterol || []));
    }
    if (findingsLower.includes('glucose') || findingsLower.includes('a1c')) {
      resources.push(...(EDUCATIONAL_DATABASE.diabetes || []));
    }
  }

  // Add general healthy lifestyle resources if high risk
  if (riskLevel === 'HIGH' || riskLevel === 'VERY_HIGH') {
    resources.push(...(EDUCATIONAL_DATABASE.weight_management || []));
  }

  // Remove duplicates based on URL
  const uniqueResources = Array.from(
    new Map(resources.map(r => [r.url, r])).values()
  );

  // Sort by trust score (highest first) and limit to top 5
  return uniqueResources
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 5);
}

/**
 * Get educational resources for health goals
 */
export function getGoalEducationalResources(goalType: string): EducationalResource[] {
  const goalMappings: Record<string, string[]> = {
    blood_pressure: ['hypertension'],
    cholesterol: ['high_cholesterol'],
    weight: ['weight_management'],
    glucose: ['diabetes', 'prediabetes'],
    smoking: ['smoking_cessation'],
  };

  const resources: EducationalResource[] = [];
  const conditions = goalMappings[goalType] || [];

  for (const condition of conditions) {
    if (EDUCATIONAL_DATABASE[condition]) {
      resources.push(...EDUCATIONAL_DATABASE[condition]);
    }
  }

  return resources.slice(0, 3); // Top 3 resources per goal
}
