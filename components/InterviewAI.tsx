import React, { useState } from 'react';
import { Briefcase, Building2, MapPin, Search, Users, TrendingUp, DollarSign, HelpCircle, Lightbulb } from 'lucide-react';
import { generateInterviewInsights } from '../services/geminiService';
import { InterviewInsight } from '../types';

const InterviewAI: React.FC = () => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<InterviewInsight | null>(null);

  const handleGenerate = async () => {
    if (!company || !role) {
      alert("Please enter at least Company Name and Job Role.");
      return;
    }
    setLoading(true);
    const result = await generateInterviewInsights(company, role, location, jobDesc);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">InterviewAI</h1>
          </div>
          <p className="text-indigo-100 max-w-2xl text-lg">
            Get company-specific interview questions, salary insights, and growth trends powered by Gemini AI.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" /> Target Details
            </h2>
            
            <div className="space-y-4">
              <Input label="Company Name" value={company} onChange={setCompany} placeholder="e.g. Google, TCS, Infosys" icon={<Building2 className="w-4 h-4" />} />
              <Input label="Job Role" value={role} onChange={setRole} placeholder="e.g. Software Engineer" icon={<Briefcase className="w-4 h-4" />} />
              <Input label="Location" value={location} onChange={setLocation} placeholder="e.g. Bangalore, Pune" icon={<MapPin className="w-4 h-4" />} />
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Job Description (Optional)</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  placeholder="Paste JD for specific questions..."
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-70 mt-4"
              >
                {loading ? 'Analyzing Market Data...' : 'Generate Insights'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Display */}
        <div className="lg:col-span-2 space-y-6">
          {!insight && !loading && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl h-96 flex flex-col items-center justify-center text-slate-400">
              <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium">Enter details to generate interview intelligence</p>
            </div>
          )}

          {loading && (
             <div className="bg-white border border-slate-100 rounded-xl h-96 flex flex-col items-center justify-center p-8 text-center space-y-4">
               <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
               <p className="text-slate-600 animate-pulse">Gathering company stats, salary trends, and curating interview questions...</p>
             </div>
          )}

          {insight && (
            <div className="space-y-6 animate-fadeIn">
              {/* Company Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard 
                  title="Company Overview" 
                  icon={<Users className="w-5 h-5 text-blue-600" />}
                  items={[
                    { label: "Employees", value: insight.companyInfo.employeeCount },
                    { label: "Presence", value: insight.companyInfo.branches },
                  ]}
                  bgColor="bg-blue-50"
                  borderColor="border-blue-100"
                />
                <StatCard 
                  title="Compensation & Growth" 
                  icon={<DollarSign className="w-5 h-5 text-green-600" />}
                  items={[
                    { label: "Est. Package", value: insight.companyInfo.salaryPackage },
                    { label: "Hike Trends", value: insight.companyInfo.hikeTrends },
                    { label: "Growth", value: insight.companyInfo.growthProspects },
                  ]}
                  bgColor="bg-green-50"
                  borderColor="border-green-100"
                />
              </div>

              {/* Interview Questions */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-indigo-900">Predicted Interview Questions</h3>
                </div>
                <div className="p-0">
                  {insight.questions.map((q, idx) => (
                    <div key={idx} className="p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{idx + 1}</span>
                      <p className="text-slate-700 text-sm leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              </div>

               {/* Tips */}
               <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                  <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" /> Preparation Tips
                  </h3>
                  <ul className="space-y-2">
                    {insight.tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-amber-900">
                        <span className="text-amber-500">•</span> {tip}
                      </li>
                    ))}
                  </ul>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder: string; icon: React.ReactNode }> = ({ label, value, onChange, placeholder, icon }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-2.5 text-gray-400">
        {icon}
      </div>
      <input 
        type="text" 
        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  </div>
);

const StatCard: React.FC<{ title: string; icon: React.ReactNode; items: {label: string, value: string}[]; bgColor: string; borderColor: string }> = ({ title, icon, items, bgColor, borderColor }) => (
  <div className={`rounded-xl border ${borderColor} ${bgColor} p-5`}>
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
    </div>
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx}>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{item.label}</p>
          <p className="text-sm font-semibold text-gray-800">{item.value}</p>
        </div>
      ))}
    </div>
  </div>
);

export default InterviewAI;
