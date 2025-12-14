import React, { useState } from 'react';
import { Wand2, Upload, FileText, ArrowRight } from 'lucide-react';
import { enhanceResumeText } from '../services/geminiService';

const Enhancer: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [enhancedText, setEnhancedText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnhance = async () => {
    if (!resumeText || !jobDesc) {
      alert("Please provide both resume text and job description.");
      return;
    }
    setLoading(true);
    const result = await enhanceResumeText(resumeText, jobDesc);
    setEnhancedText(result);
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Smart Resume Enhancer</h2>
            <p className="text-gray-500">Optimize your resume content for a specific job description using AI.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Side */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                1. Paste Resume Content
              </label>
              <textarea
                className="w-full h-48 p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-slate-50"
                placeholder="Paste your resume text here (Summary, Work Experience, Projects)..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                2. Paste Job Description (JD)
              </label>
              <textarea
                className="w-full h-48 p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-slate-50"
                placeholder="Paste the Job Description you are applying for..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>
            <button
              onClick={handleEnhance}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>Processing with Gemini AI...</>
              ) : (
                <>Enhance Resume <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* Output Side */}
          <div className="bg-slate-900 rounded-xl p-6 text-slate-100 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" /> 
                Enhanced Result
              </h3>
              {enhancedText && (
                 <button onClick={() => navigator.clipboard.writeText(enhancedText)} className="text-xs text-purple-400 hover:text-purple-300">Copy</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-line">
              {enhancedText || (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                  <Wand2 className="w-12 h-12 mb-4" />
                  <p>Results will appear here...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enhancer;
