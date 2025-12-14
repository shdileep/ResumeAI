import React, { useState } from 'react';
import { BarChart3, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { analyzeResumeATS } from '../services/geminiService';
import { ATSAnalysis } from '../types';

const ATSChecker: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeText) return alert("Please enter resume text.");
    setLoading(true);
    const result = await analyzeResumeATS(resumeText);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-800">ATS Score Checker</h2>
        <p className="text-gray-500">Is your resume ready for the robots? Get an instant score.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <textarea
          className="w-full h-40 p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-slate-50 mb-4"
          placeholder="Paste your resume text here to analyze..."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-70"
        >
          {loading ? 'Analyzing with Enterprise AI...' : 'Calculate ATS Score'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-6 animate-fadeIn">
          {/* Score Card */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                <circle 
                  cx="80" cy="80" r="70" 
                  stroke={analysis.score > 75 ? '#10b981' : analysis.score > 50 ? '#f59e0b' : '#ef4444'} 
                  strokeWidth="10" fill="transparent"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * analysis.score) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-gray-800">{analysis.score}</span>
                <span className="text-xs text-gray-500 uppercase font-semibold">ATS Score</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" /> Analysis Report
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <h4 className="font-semibold text-red-700 text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Missing Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-white rounded text-xs text-red-600 border border-red-200">{kw}</span>
                      ))}
                    </div>
                 </div>
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-blue-700 text-sm mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Suggestions
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1 list-disc pl-4">
                      {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                 </div>
              </div>
            </div>
          </div>

          {/* Section Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">Section-wise Analysis</div>
            <div className="divide-y divide-slate-100">
              {analysis.sectionAnalysis.map((sec, idx) => (
                <div key={idx} className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="w-32 font-medium text-slate-800">{sec.section}</div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${
                    sec.status === 'Good' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {sec.status}
                  </div>
                  <div className="text-sm text-slate-500 flex-1">{sec.feedback}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATSChecker;
