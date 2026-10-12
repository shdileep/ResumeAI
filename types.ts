export interface Education {
  id: string;
  institution: string;
  degree: string;
  specialization: string;
  startYear: string;
  endYear: string;
  score: string; // CGPA/Percentage
  location: string; // Added location field
  type: 'Graduation' | 'HigherSecondary' | 'Schooling';
}

export interface Project {
  id: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  designation: string;
  duration: string;
  currentSalary?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  description: string;
}

export interface Certification {
  id: string;
  title: string;
  issuedBy: string;
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    role: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    portfolio: string;
  };
  summary: string;
  education: Education[];
  projects: Project[];
  workExperience: WorkExperience[];
  skills: {
    languages: string;
    frameworks: string;
    tools: string;
  };
  certifications: Certification[];
}

export interface ATSAnalysis {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  sectionAnalysis: {
    section: string;
    status: 'Good' | 'Needs Improvement' | 'Critical';
    feedback: string;
  }[];
}

export interface InterviewInsight {
  companyInfo: {
    employeeCount: string;
    branches: string;
    salaryPackage: string;
    hikeTrends: string;
    growthProspects: string;
  };
  questions: string[];
  tips: string[];
}

export interface ZeroAIScore {
  aiPercentage: number;
  reasoning: string;
  verdict: 'Human-Written' | 'Likely AI-Generated' | 'Mixed/Edited';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type AppView = 'auth' | 'dashboard' | 'builder' | 'enhance' | 'settings' | 'interview' | 'zeroai';

// -------------------------------------------------------------
// Standard ATS Resume & Strict ATS Review Extended Types
// -------------------------------------------------------------

export interface StandardATSResume {
  contactInfo: {
    fullName: string;
    roleTitle?: string;
    phone: string;
    email: string;
    location: string; // City, State
    linkedin: string;
    github: string;
    portfolio: string;
  };
  professionalSummary: string; // 2-4 lines concise overview
  technicalSkills: {
    languages: string[];
    aiMl?: string[];
    frameworks: string[];
    databases: string[];
    cloudDevops: string[];
    toolsPlatforms: string[];
  };
  professionalExperience: {
    id: string;
    company: string;
    role: string;
    location: string;
    dates: string; // Uniform format, e.g. "May 2024 – Present"
    type?: 'Full-time' | 'Internship' | 'Contract' | 'Independent Project';
    bullets: string[];
  }[];
  projects: {
    id: string;
    title: string;
    techStack: string[];
    dates?: string;
    link?: string;
    purpose?: string;
    bullets: string[];
  }[];
  education: {
    id: string;
    degree: string;
    institution: string;
    location?: string;
    graduationYear: string;
    score?: string; // CGPA/Percentage
  }[];
  certificationsAndAchievements: {
    id: string;
    title: string;
    issuer?: string;
    date?: string;
    type: 'certification' | 'achievement' | 'award';
  }[];
}

export type FindingSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AuditFinding {
  id: string;
  section: string;
  severity: FindingSeverity;
  issue: string;
  originalText: string;
  suggestedCorrection: string;
  whyItMatters: string;
  accepted?: boolean;
}

export interface SectionAudit {
  section: string;
  status: 'Good' | 'Needs Improvement' | 'Critical';
  present: string[];
  missing: string[];
  whyItMatters: string;
  howToFix: string;
}

export interface DetailedATSScoreReport {
  overallScore: number;
  jdMatchScore?: number;
  hasJobDescription: boolean;
  keywordCoveragePercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  formattingIssues: string[];
  criticalIssues: string[];
  sections: SectionAudit[];
  findings: AuditFinding[];
  writingAudit: {
    spellingGrammarCount: number;
    overusedVerbs: string[];
    repeatedKeywords: string[];
    weakPhrases: string[];
  };
  disclaimer: string;
}
