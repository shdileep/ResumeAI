import React, { useState } from 'react';
import { Wand2, FileText, ArrowRight, Sparkles, CheckCircle2, AlertTriangle, Download, RefreshCw, ChevronDown, ChevronUp, FileUp, Edit3 } from 'lucide-react';
import { generateJDOptimizedATSResume } from '../services/atsEngine';
import { StandardATSResume } from '../types';
import DocumentUploadZone from './DocumentUploadZone';
import ATSResumeDocument from './ATSResumeDocument';
import { ParsedDocument } from '../services/documentParser';
import { downloadResumeAsDocx, downloadResumeAsPdf } from '../services/exportResume';

interface OptimizationAnalysis {
  matchScore: number;
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  tailoredSummary: string;
  warnings: string[];
}

const Enhancer: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [uploadedResumeDoc, setUploadedResumeDoc] = useState<ParsedDocument | null>(null);
  const [uploadedJdDoc, setUploadedJdDoc] = useState<ParsedDocument | null>(null);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generated state
  const [optimizedResume, setOptimizedResume] = useState<StandardATSResume | null>(null);
  const [analysis, setAnalysis] = useState<OptimizationAnalysis | null>(null);
  const [showInputPanel, setShowInputPanel] = useState(true);

  const handleResumeExtracted = (doc: ParsedDocument) => {
    setUploadedResumeDoc(doc);
    setResumeText(doc.text);
  };

  const handleJdExtracted = (doc: ParsedDocument) => {
    setUploadedJdDoc(doc);
    setJobDesc(doc.text);
  };

  const handleEnhance = async () => {
    if (!resumeText.trim()) {
      alert("Please upload your resume or paste resume content.");
      return;
    }
    if (!jobDesc.trim()) {
      alert("Please provide the target Job Description (paste text or upload JD document).");
      return;
    }

    setLoading(true);
    try {
      const result = await generateJDOptimizedATSResume(resumeText, jobDesc);
      setOptimizedResume(result.resume);
      setAnalysis(result.analysis);
      setShowInputPanel(false); // Collapse inputs to focus on document preview & analysis
    } catch (err: any) {
      console.error('Enhance failed:', err);
      alert('Failed to optimize resume against JD. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Smart ATS Resume Enhancer</h1>
            <p className="text-xs md:text-sm text-slate-500">
              Align your resume with a specific job description to maximize recruiter relevance and ATS compatibility without fabricating experience.
            </p>
          </div>
        </div>

        {optimizedResume && (
          <button
            onClick={() => setShowInputPanel(!showInputPanel)}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {showInputPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showInputPanel ? 'Hide Inputs' : 'Edit Inputs / Re-run'}
          </button>
        )}
      </div>

      {/* Input Section (Upload Resume & JD) */}
      {showInputPanel && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. Resume Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">1</span>
                  Upload Your Resume
                </label>
                <button
                  type="button"
                  onClick={() => setShowManualPaste(!showManualPaste)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  {showManualPaste ? 'Upload Document Instead' : 'Or Paste Raw Text'}
                </button>
              </div>

              {!showManualPaste ? (
                <DocumentUploadZone
                  label="Upload Existing Resume"
                  sublabel="PDF, DOCX, DOC, TXT, RTF, ODT (Max 10MB)"
                  onTextExtracted={handleResumeExtracted}
                  onClear={() => {
                    setUploadedResumeDoc(null);
                    setResumeText('');
                  }}
                />
              ) : (
                <textarea
                  className="w-full h-48 p-4 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-slate-50 leading-relaxed"
                  placeholder="Paste your current resume content here (Summary, Skills, Experience, Education)..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              )}
            </div>

            {/* 2. Job Description Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">2</span>
                  Target Job Description (JD)
                </label>
                <div className="text-xs text-slate-400">Paste text or upload JD</div>
              </div>

              <textarea
                className="w-full h-32 p-4 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none resize-none bg-slate-50 leading-relaxed"
                placeholder="Paste the target job description (responsibilities, required skills, qualifications)..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <DocumentUploadZone
                    label="Or Upload Job Description Document (.pdf, .docx, .txt)"
                    sublabel="Optional"
                    acceptTypes=".pdf,.docx,.txt"
                    onTextExtracted={handleJdExtracted}
                    onClear={() => {
                      setUploadedJdDoc(null);
                      setJobDesc('');
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleEnhance}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Resume & Tailoring to Job Description...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate JD-Optimized ATS Resume <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Dual Area: Left Editable Document Preview, Right Analysis Panel */}
      {optimizedResume && analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Live Editable A4 Document Preview */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <ATSResumeDocument
              resume={optimizedResume}
              onChange={(updated) => setOptimizedResume(updated)}
              isTailoredToJD={true}
            />
          </div>

          {/* Right Column: Compact Analysis & Findings Panel */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-20">
            {/* Scores Overview Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-3">
                <span>ATS & JD Optimization</span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Tailored
                </span>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-3xl font-extrabold text-blue-600">{analysis.matchScore}%</div>
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mt-1">
                    JD Match Score
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-3xl font-extrabold text-emerald-600">{analysis.atsScore}/100</div>
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mt-1">
                    ATS Format Score
                  </div>
                </div>
              </div>

              {/* Matched Keywords */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Matched Keywords ({analysis.matchedKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {analysis.matchedKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Requirements from JD */}
              {analysis.missingKeywords?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Missing JD Keywords ({analysis.missingKeywords.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Not found in your resume. Only add if you have verified experience with them:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {analysis.missingKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recruiter & ATS Warnings */}
              {analysis.warnings?.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 mb-2">Important Recommendations</h3>
                  <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
                    {analysis.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Download Standardized Resume
              </h3>
              <p className="text-xs text-slate-400">
                Both formats are generated directly from your edited, approved resume.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => downloadResumeAsDocx(optimizedResume)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Word (.docx)
                </button>
                <button
                  onClick={() => downloadResumeAsPdf(optimizedResume)}
                  className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> PDF (.pdf)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enhancer;
