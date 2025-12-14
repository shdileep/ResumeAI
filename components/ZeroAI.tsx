import React, { useState } from 'react';
import { Scan, UserCheck, RefreshCw, Copy, AlertTriangle, Fingerprint, Sparkles } from 'lucide-react';
import { detectAIProbability, humanizeContent } from '../services/geminiService';
import { ZeroAIScore } from '../types';

const ZeroAI: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<ZeroAIScore | null>(null);
  const [humanizedText, setHumanizedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText || inputText.length < 50) {
      alert("Please enter at least 50 characters for accurate detection.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysis(null);
    setHumanizedText('');
    const result = await detectAIProbability(inputText);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleHumanize = async () => {
    if (!inputText) return;
    setIsHumanizing(true);
    const result = await humanizeContent(inputText);
    setHumanizedText(result);
    setIsHumanizing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/50 backdrop-blur-sm">
                <Fingerprint className="w-6 h-6 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">ZeroAI <span className="text-green-400 font-light">Detector</span></h1>
            </div>
            <p className="text-slate-400 max-w-2xl text-lg">
              Detect AI-generated content percentage and humanize text to bypass detectors. 
              Ensure your resumes and emails sound authentic.
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm text-center min-w-[150px]">
            <span className="block text-xs text-slate-300 uppercase tracking-wider mb-1">Status</span>
            <span className="text-green-400 font-bold flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Active
            </span>
          </div>
        </div>
        <div className="absolute left-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input & Analysis */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Scan className="w-5 h-5 text-indigo-600" /> Content Analyzer
            </h2>
            <textarea
              className="w-full h-64 p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50 leading-relaxed"
              placeholder="Paste your resume summary, cover letter, or email content here to check for AI patterns..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {isAnalyzing ? 'Scanning Patterns...' : 'Check AI Score'}
              </button>
              {analysis && analysis.aiPercentage > 20 && (
                <button
                  onClick={handleHumanize}
                  disabled={isHumanizing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isHumanizing ? 'Rewriting...' : 'Humanize Text'}
                </button>
              )}
            </div>
          </div>

          {/* Analysis Result Card */}
          {analysis && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800">Detection Result</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  analysis.aiPercentage < 30 ? 'bg-green-100 text-green-700' :
                  analysis.aiPercentage < 70 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {analysis.verdict}
                </span>
              </div>
              
              <div className="flex flex-col items-center justify-center mb-6 relative">
                 {/* Circular Progress (Simple CSS/SVG) */}
                 <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="96" cy="96" r="88" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                      <circle 
                        cx="96" cy="96" r="88" 
                        stroke={analysis.aiPercentage > 50 ? '#ef4444' : '#22c55e'} 
                        strokeWidth="12" fill="transparent"
                        strokeDasharray={552}
                        strokeDashoffset={552 - (552 * analysis.aiPercentage) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-slate-800">{analysis.aiPercentage}%</span>
                      <span className="text-xs text-slate-500 font-medium uppercase mt-1">AI Probability</span>
                    </div>
                 </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed">
                <strong className="block text-slate-900 mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Analysis Logic:
                </strong>
                {analysis.reasoning}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Humanized Output */}
        <div className="flex flex-col h-full">
           <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col ${humanizedText ? 'opacity-100' : 'opacity-70'} transition-opacity duration-300`}>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-600" /> Humanized Output
                </h2>
                {humanizedText && (
                  <button onClick={() => copyToClipboard(humanizedText)} className="text-slate-400 hover:text-indigo-600 transition">
                    <Copy className="w-5 h-5" />
                  </button>
                )}
             </div>

             {humanizedText ? (
               <div className="flex-1 overflow-y-auto max-h-[600px] p-4 bg-green-50/50 rounded-xl border border-green-100 text-slate-700 leading-relaxed whitespace-pre-line animate-fadeIn">
                 {humanizedText}
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl min-h-[300px]">
                 {isHumanizing ? (
                   <>
                     <RefreshCw className="w-10 h-10 mb-4 animate-spin text-green-500" />
                     <p>Rewriting content to sound authentic...</p>
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-12 h-12 mb-4 text-slate-300" />
                     <p className="text-center px-6">Click "Humanize Text" to convert AI-generated content into natural human writing.</p>
                   </>
                 )}
               </div>
             )}
             
             {humanizedText && (
               <div className="mt-4 flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">100% Human Score Target</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">High Perplexity</span>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ZeroAI;
