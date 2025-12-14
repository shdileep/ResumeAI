import React from 'react';
import { FileText, Wand2, BarChart3, TrendingUp, Users, CheckCircle, Clock, Briefcase, Fingerprint } from 'lucide-react';
import { AppView } from '../types';

interface DashboardProps {
  onChangeView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to ResumeAI</h1>
          <p className="text-blue-100 max-w-2xl text-lg mb-6">
            Build ATS-compliant resumes, enhance them with Gemini AI, and increase your chances of getting shortlisted.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onChangeView('builder')}
              className="bg-white text-blue-700 px-6 py-3 rounded-lg font-bold shadow-md hover:bg-blue-50 transition flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Create New Resume
            </button>
            <button 
              onClick={() => onChangeView('settings')}
              className="bg-blue-600 text-white border border-blue-400 px-6 py-3 rounded-lg font-bold shadow-md hover:bg-blue-500 transition flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              Check ATS Score
            </button>
          </div>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute right-20 bottom-0 w-40 h-40 bg-white opacity-10 rounded-full mb-[-40px] pointer-events-none"></div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={<Users className="w-6 h-6 text-blue-600" />}
          label="Active Users"
          value="50,000+"
          trend="+12% this week"
        />
        <MetricCard 
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          label="Candidates Shortlisted"
          value="30,000+"
          trend="Proven success"
        />
        <MetricCard 
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          label="Creation Speed"
          value="70% Faster"
          trend="Vs Manual Methods"
        />
        <MetricCard 
          icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          label="Success Rate"
          value="High"
          trend="IT & Analytics"
        />
      </div>

      {/* Feature Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <FeatureCard 
          title="Resume Builder"
          description="Step-by-step builder with auto-formatting. ATS-friendly templates for freshers."
          icon={<FileText className="w-8 h-8 text-white" />}
          color="bg-blue-500"
          onClick={() => onChangeView('builder')}
        />
        <FeatureCard 
          title="AI Enhancer"
          description="Use Gemini AI to rewrite your content based on specific job descriptions."
          icon={<Wand2 className="w-8 h-8 text-white" />}
          color="bg-purple-500"
          onClick={() => onChangeView('enhance')}
        />
        <FeatureCard 
          title="ATS Score Checker"
          description="Upload your resume and get a score out of 100 with improvement suggestions."
          icon={<BarChart3 className="w-8 h-8 text-white" />}
          color="bg-emerald-500"
          onClick={() => onChangeView('settings')}
        />
         <FeatureCard 
          title="InterviewAI"
          description="Get company-specific interview questions, salary, and growth insights."
          icon={<Briefcase className="w-8 h-8 text-white" />}
          color="bg-indigo-600"
          onClick={() => onChangeView('interview')}
        />
        <FeatureCard 
          title="ZeroAI Detector"
          description="Detect and humanize AI content to bypass detectors with 100% authenticity."
          icon={<Fingerprint className="w-8 h-8 text-white" />}
          color="bg-slate-800"
          onClick={() => onChangeView('zeroai')}
        />
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; trend: string }> = ({ icon, label, value, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    <p className="text-xs text-green-600 font-semibold mt-2">{trend}</p>
  </div>
);

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode; color: string; onClick: () => void }> = ({ title, description, icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full"
  >
    <div className={`${color} p-6 flex items-center justify-center`}>
      {icon}
    </div>
    <div className="p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      <div className="mt-4 text-blue-600 font-medium text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        Get Started &rarr;
      </div>
    </div>
  </div>
);

export default Dashboard;
