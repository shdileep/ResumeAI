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
