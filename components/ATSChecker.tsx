import React, { useState } from 'react';
import {
  BarChart3,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Check,
  X,
  FileText,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { performStrictATSReview, convertRawResumeToStandardATS, applyAuditFixes } from '../services/atsEngine';
import { DetailedATSScoreReport, AuditFinding, StandardATSResume, FindingSeverity } from '../types';
import DocumentUploadZone from './DocumentUploadZone';
import ATSResumeDocument from './ATSResumeDocument';
import { ParsedDocument } from '../services/documentParser';
import { downloadResumeAsDocx, downloadResumeAsPdf } from '../services/exportResume';

const ATSChecker: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [showJdInput, setShowJdInput] = useState(false);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [loading, setLoading] = useState(false);

  // Audit state
  const [report, setReport] = useState<DetailedATSScoreReport | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<FindingSeverity | 'All'>('All');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Fix Suggestions & Corrected Resume state
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);
  const [correctedResume, setCorrectedResume] = useState<StandardATSResume | null>(null);
  const [showFixModal, setShowFixModal] = useState(false);
  const [originalRawText, setOriginalRawText] = useState('');

  const handleResumeExtracted = (doc: ParsedDocument) => {
    setResumeText(doc.text);
    setOriginalRawText(doc.text);
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      alert("Please upload a resume or paste resume text to analyze.");
      return;
    }
    setLoading(true);
    try {
      const res = await performStrictATSReview(resumeText, showJdInput ? jobDesc : undefined);
      setReport(res);
      // Initialize all findings as accepted by default for user convenience
      setFindings(res.findings.map(f => ({ ...f, accepted: true })));
      setCorrectedResume(null);
    } catch (err) {
      console.error('ATS audit error:', err);
      alert('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFindingAccepted = (id: string) => {
    setFindings(prev =>
      prev.map(f => (f.id === id ? { ...f, accepted: !f.accepted } : f))
    );
  };

  const handleApplyFixes = async () => {
    const acceptedList = findings.filter(f => f.accepted);
    if (acceptedList.length === 0) {
      alert("Please accept at least one suggested fix to apply.");
      return;
    }

    setIsApplyingFixes(true);
    try {
      const { updatedText, revisedResume } = await applyAuditFixes(resumeText, acceptedList);
      setResumeText(updatedText);
      setCorrectedResume(revisedResume);
      setShowFixModal(false);
    } catch (err) {
      console.error('Apply fixes error:', err);
      alert('Failed to apply fixes. Please try again.');
    } finally {
      setIsApplyingFixes(false);
    }
  };

  const handleReRunAudit = async () => {
    if (correctedResume) {
      setLoading(true);
      try {
        const res = await performStrictATSReview(resumeText, showJdInput ? jobDesc : undefined);
        setReport(res);
        setFindings(res.findings.map(f => ({ ...f, accepted: true })));
      } catch (err) {
        console.error('Re-run error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRevertOriginal = () => {
    if (originalRawText) {
      setResumeText(originalRawText);
      setCorrectedResume(null);
      handleAnalyze();
    }
  };

  const filteredFindings = findings.filter(
    f => selectedSeverity === 'All' || f.severity === selectedSeverity
  );

  const acceptedCount = findings.filter(f => f.accepted).length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800">ATS Resume Auditor & Reviewer</h1>
        <p className="text-slate-500 text-sm">
          Strict, section-by-section audit of formatting, keyword coverage, action verbs, and credibility with one-click fix suggestions.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              Upload Resume for Review
            </label>
            <button
              onClick={() => setShowManualPaste(!showManualPaste)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              {showManualPaste ? 'Upload File Instead' : 'Paste Raw Text'}
            </button>
          </div>

          {!showManualPaste ? (
            <DocumentUploadZone
              label="Click or Drag Resume (.pdf, .docx, .doc, .txt, .rtf, .odt)"
              sublabel="Max 10MB • Fast multi-format extraction"
              onTextExtracted={handleResumeExtracted}
              onClear={() => setResumeText('')}
            />
          ) : (
            <textarea
              className="w-full h-40 p-4 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-slate-50 leading-relaxed"
              placeholder="Paste your resume text here to analyze..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
            />
          )}

          {/* Optional JD Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowJdInput(!showJdInput)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              {showJdInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showJdInput ? 'Remove Job Description (General Audit)' : '+ Add Job Description for Target Role Matching (Optional)'}
            </button>

            {showJdInput && (
              <div className="mt-3 animate-fadeIn">
                <textarea
                  className="w-full h-28 p-3 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-slate-50 leading-relaxed"
                  placeholder="Paste target Job Description here to get role-specific keyword matching and JD match score..."
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running Strict Section-by-Section ATS Audit...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              Run Strict ATS Review
            </>
          )}
        </button>
      </div>

      {/* CORRECTED RESUME PREVIEW (When user applied fixes) */}
      {correctedResume && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border-2 border-emerald-400 space-y-6 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Corrected & Revised ATS Resume</h2>
                <p className="text-xs text-slate-500">
                  Applied {acceptedCount} suggestions while strictly preserving factual accuracy.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReRunAudit}
                disabled={loading}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Re-run Audit on Corrected Resume
              </button>
              {originalRawText && (
                <button
                  onClick={handleRevertOriginal}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Revert to Original
                </button>
              )}
            </div>
          </div>

          <ATSResumeDocument
            resume={correctedResume}
            onChange={updated => setCorrectedResume(updated)}
            isTailoredToJD={Boolean(jobDesc)}
          />
        </div>
      )}

      {/* AUDIT REPORT */}
      {report && (
        <div className="space-y-8 animate-fadeIn">
          {/* Section A: Overall ATS Assessment Card */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="88" cy="88" r="76" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    stroke={report.overallScore >= 80 ? '#10b981' : report.overallScore >= 65 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={477}
                    strokeDashoffset={477 - (477 * report.overallScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold text-slate-800">{report.overallScore}</span>
                  <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                    ATS Score
                  </span>
                </div>
              </div>

              {report.jdMatchScore !== undefined && (
                <div className="mt-2 text-center">
                  <span className="text-xs font-semibold text-slate-600">JD Match: </span>
                  <span className="text-xs font-bold text-blue-600">{report.jdMatchScore}%</span>
                </div>
              )}
            </div>

            {/* Assessment Details */}
            <div className="flex-1 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  Comprehensive ATS Audit Breakdown
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Keyword Coverage: <strong className="text-slate-800">{report.keywordCoveragePercentage}%</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matched / Present Keywords */}
                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                  <h4 className="font-bold text-emerald-800 text-xs mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Indexed Skills & Keywords ({report.matchedKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {report.matchedKeywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white text-emerald-700 rounded text-[11px] font-medium border border-emerald-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-800 text-xs mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Missing Required Keywords ({report.missingKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {report.missingKeywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white text-amber-800 rounded text-[11px] font-medium border border-amber-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Critical issues if any */}
              {report.criticalIssues?.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <strong>Critical parsing blocker:</strong> {report.criticalIssues.join(' • ')}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>{report.disclaimer}</span>
              </div>
            </div>
          </div>

          {/* Section B: Section-by-Section Expandable Audit */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm">
              Section-by-Section Standard Compliance Audit
            </div>
            <div className="divide-y divide-slate-100">
              {report.sections.map((sec, idx) => {
                const isOpen = expandedSection === sec.section || (!expandedSection && idx === 0);
                return (
                  <div key={idx} className="p-5 transition hover:bg-slate-50/50">
                    <div
                      onClick={() => setExpandedSection(isOpen ? null : sec.section)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 text-sm">{sec.section}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            sec.status === 'Good'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sec.status === 'Needs Improvement'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {sec.status}
                        </span>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                        <div>
                          <strong className="text-slate-700 block mb-1">What is Present:</strong>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                            {sec.present.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>

                          {sec.missing?.length > 0 && (
                            <div className="mt-3">
                              <strong className="text-amber-700 block mb-1">What is Missing:</strong>
                              <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                                {sec.missing.map((m, i) => (
                                  <li key={i}>{m}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                          <div>
                            <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                              Why it matters:
                            </strong>
                            <p className="text-slate-600 leading-relaxed">{sec.whyItMatters}</p>
                          </div>
                          <div>
                            <strong className="text-slate-800 block text-[11px] uppercase tracking-wider mb-0.5">
                              How to fix it:
                            </strong>
                            <p className="text-blue-700 font-medium leading-relaxed">{sec.howToFix}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section C: Writing, Repetition & Quality Audit */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Writing Quality & Repetition Audit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Overused Action Verbs</span>
                <p className="text-slate-500 text-[11px] mb-2">
                  Replace with stronger action verbs (e.g. Engineered, Architected, Spearheaded):
                </p>
                <div className="flex flex-wrap gap-1">
                  {report.writingAudit.overusedVerbs.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200 font-semibold text-[11px]">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Repeated Keywords & Phrases</span>
                <p className="text-slate-500 text-[11px] mb-2">
                  Avoid repeating identical words across multiple bullets:
                </p>
                <div className="flex flex-wrap gap-1">
                  {report.writingAudit.repeatedKeywords.map((k, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 font-semibold text-[11px]">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1">Spelling & Weak Phrasing</span>
                <p className="text-slate-500 text-[11px] mb-2">
                  Spelling/grammar errors: <strong className="text-slate-800">{report.writingAudit.spellingGrammarCount}</strong>
                </p>
                <div className="flex flex-wrap gap-1">
                  {report.writingAudit.weakPhrases.map((w, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-semibold text-[11px]">
                      "{w}"
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Actionable Findings & Fix Suggestions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Actionable Findings & Suggested Corrections ({findings.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Select suggestions to apply. All accepted edits will be incorporated into the revised resume.
                </p>
              </div>

              {/* Severity Filter Buttons */}
              <div className="flex items-center gap-1.5">
                {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedSeverity === sev
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-4">
              {filteredFindings.map(f => (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border transition ${
                    f.accepted
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 bg-slate-50/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            f.severity === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : f.severity === 'High'
                              ? 'bg-orange-100 text-orange-800'
                              : f.severity === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{f.section}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-600">{f.issue}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFindingAccepted(f.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        f.accepted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {f.accepted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {f.accepted ? 'Accepted' : 'Ignored'}
                    </button>
                  </div>

                  {/* Before / After comparison */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-red-50/60 rounded-lg border border-red-200">
                      <span className="text-[10px] uppercase font-bold text-red-700 block mb-1">Original Text:</span>
                      <p className="text-slate-800 font-mono text-[11px] leading-relaxed">"{f.originalText}"</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Suggested Correction:</span>
                      <p className="text-slate-900 font-mono text-[11px] font-medium leading-relaxed">"{f.suggestedCorrection}"</p>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500">
                    <strong className="text-slate-700">Why it matters:</strong> {f.whyItMatters}
                  </div>
                </div>
              ))}
            </div>

            {/* PART 6: FIX SUGGESTIONS BUTTON */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-600">
                  <strong className="text-slate-900 font-bold">{acceptedCount}</strong> of {findings.length} suggestions selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleApplyFixes}
                  disabled={isApplyingFixes || acceptedCount === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {isApplyingFixes ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Applying Corrections...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Fix Suggestions & Generate Revised Resume ({acceptedCount})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATSChecker;
