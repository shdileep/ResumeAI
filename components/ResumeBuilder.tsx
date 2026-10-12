import React, { useState, useEffect } from 'react';
import { ResumeData, Education, Project, WorkExperience, Certification, StandardATSResume } from '../types';
import { auth, saveResume, getResume } from '../services/firebase';
import { ChevronRight, ChevronLeft, Plus, Trash2, Wand2, Download, Printer, Sparkles, FileText, Upload, ArrowLeft, RefreshCw, FileCheck } from 'lucide-react';
import { generateProfessionalSummary, polishSentence } from '../services/geminiService';
import { convertRawResumeToStandardATS, resumeDataToStandardATS, standardATSToResumeData } from '../services/atsEngine';
import DocumentUploadZone from './DocumentUploadZone';
import ATSResumeDocument from './ATSResumeDocument';
import { ParsedDocument } from '../services/documentParser';
import { downloadResumeAsDocx, downloadResumeAsPdf } from '../services/exportResume';

const emptyResume: ResumeData = {
  personalInfo: { fullName: '', role: '', email: '', phone: '', linkedin: '', github: '', portfolio: '' },
  summary: '',
  education: [],
  projects: [],
  workExperience: [],
  skills: { languages: '', frameworks: '', tools: '' },
  certifications: []
};

type ResumeSectionMode = 'options' | 'create' | 'upload';

const ResumeBuilder: React.FC = () => {
  const [sectionMode, setSectionMode] = useState<ResumeSectionMode>('options');
  const [step, setStep] = useState(1);
  const [resume, setResume] = useState<ResumeData>(emptyResume);
  const [convertedATS, setConvertedATS] = useState<StandardATSResume | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [polishingId, setPolishingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (auth.currentUser) {
        const data = await getResume(auth.currentUser.uid);
        if (data && data.personalInfo?.fullName) {
          setResume(data);
        }
      }
    };
    loadData();
  }, []);

  // Save on change (debounced)
  useEffect(() => {
    const saveData = async () => {
      setIsSaving(true);
      try {
        const { auth, saveResume } = await import('../services/firebase');
        if (auth.currentUser) {
          await saveResume(auth.currentUser.uid, resume);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    };

    const timeout = setTimeout(saveData, 2000);
    return () => clearTimeout(timeout);
  }, [resume]);

  // Handle Upload and Convert to ATS
  const handleUploadedResume = async (doc: ParsedDocument) => {
    setIsConverting(true);
    try {
      const ats = await convertRawResumeToStandardATS(doc.text);
      setConvertedATS(ats);
      setSectionMode('upload');
      // Also sync back to standard resume data
      const syncedData = standardATSToResumeData(ats);
      setResume(syncedData);
    } catch (err: any) {
      console.error('ATS Conversion error:', err);
      alert('Could not convert resume. Please check the document contents.');
    } finally {
      setIsConverting(false);
    }
  };

  // Helpers to update nested state
  const updateInfo = (field: string, value: string) => {
    setResume(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  };

  const generateSummary = async () => {
    if (!resume.personalInfo.role) return alert("Please enter a Desired Role first.");
    setIsGenerating(true);
    const summary = await generateProfessionalSummary(resume.personalInfo.role, `${resume.skills.languages} ${resume.skills.frameworks}`);
    setResume(prev => ({ ...prev, summary }));
    setIsGenerating(false);
  };

  const handlePolish = async (id: string, text: string, type: 'project' | 'experience') => {
    if (!text || text.length < 5) return;
    setPolishingId(id);
    const polished = await polishSentence(text);

    if (type === 'project') {
      updateProject(id, 'description', polished);
    } else {
      updateExp(id, 'description', polished);
    }
    setPolishingId(null);
  };

  const addEducation = (type: Education['type']) => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: '', degree: '', specialization: '', startYear: '', endYear: '', score: '', location: '', type
    };
    setResume(prev => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const addProject = () => {
    setResume(prev => ({
      ...prev,
      projects: [...prev.projects, { id: Date.now().toString(), title: '', startDate: '', endDate: '', description: '' }]
    }));
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    setResume(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const addExp = () => {
    setResume(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, { id: Date.now().toString(), company: '', designation: '', duration: '', description: '', currentSalary: '', expectedSalary: '', noticePeriod: '' }]
    }));
  };

  const updateExp = (id: string, field: keyof WorkExperience, value: string) => {
    setResume(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  // --- RENDER STEPS FOR STEP-BY-STEP BUILDER ---

  const renderBasicInfo = () => (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800">Basic Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Full Name" value={resume.personalInfo.fullName} onChange={(v) => updateInfo('fullName', v)} />
        <Input label="Desired Role" value={resume.personalInfo.role} onChange={(v) => updateInfo('role', v)} placeholder="e.g. Software Engineer" />
        <Input label="Email" value={resume.personalInfo.email} onChange={(v) => updateInfo('email', v)} type="email" />
        <Input label="Phone Number" value={resume.personalInfo.phone} onChange={(v) => updateInfo('phone', v)} />
        <Input label="LinkedIn URL" value={resume.personalInfo.linkedin} onChange={(v) => updateInfo('linkedin', v)} />
        <Input label="GitHub URL" value={resume.personalInfo.github} onChange={(v) => updateInfo('github', v)} />
        <Input label="Portfolio URL" value={resume.personalInfo.portfolio} onChange={(v) => updateInfo('portfolio', v)} />
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800">Professional Summary</h2>
      <p className="text-sm text-gray-500">Provide a brief overview of your career and skills.</p>
      <div className="relative">
        <textarea
          className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="I am a passionate developer..."
          value={resume.summary}
          onChange={(e) => setResume(prev => ({ ...prev, summary: e.target.value }))}
        />
        <button
          onClick={generateSummary}
          disabled={isGenerating}
          className="absolute right-2 bottom-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 hover:opacity-90 transition disabled:opacity-50 shadow-md"
        >
          <Wand2 className="w-3 h-3" />
          {isGenerating ? 'Generating...' : 'AI Generate'}
        </button>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800">Education</h2>

      {resume.education.map((edu) => (
        <div key={edu.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
          <button onClick={() => setResume(p => ({ ...p, education: p.education.filter(e => e.id !== edu.id) }))} className="absolute right-2 top-2 text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </button>
          <h3 className="font-semibold text-sm mb-3 text-blue-600 uppercase tracking-wide">{edu.type}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Institution" value={edu.institution} onChange={(v) => updateEducation(edu.id, 'institution', v)} />
            <Input label="Location" value={edu.location} onChange={(v) => updateEducation(edu.id, 'location', v)} placeholder="City, State" />

            {edu.type === 'Graduation' && <Input label="Degree" value={edu.degree} onChange={(v) => updateEducation(edu.id, 'degree', v)} placeholder="B.Tech, B.Sc" />}
            {edu.type === 'Graduation' && <Input label="Specialization" value={edu.specialization} onChange={(v) => updateEducation(edu.id, 'specialization', v)} placeholder="CS, IT" />}

            <div className="flex gap-2">
              <Input label="Start Year" value={edu.startYear} onChange={(v) => updateEducation(edu.id, 'startYear', v)} />
              <Input label="End Year" value={edu.endYear} onChange={(v) => updateEducation(edu.id, 'endYear', v)} />
            </div>
            <Input label="CGPA / %" value={edu.score} onChange={(v) => updateEducation(edu.id, 'score', v)} />
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button onClick={() => addEducation('Graduation')} className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Degree
        </button>
        <button onClick={() => addEducation('HigherSecondary')} className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add 12th
        </button>
        <button onClick={() => addEducation('Schooling')} className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add 10th
        </button>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800">Projects</h2>
      {resume.projects.map((proj) => (
        <div key={proj.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
          <button onClick={() => setResume(p => ({ ...p, projects: p.projects.filter(pr => pr.id !== proj.id) }))} className="absolute right-2 top-2 text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label="Project Title" value={proj.title} onChange={(v) => updateProject(proj.id, 'title', v)} />
            <div className="flex gap-2">
              <Input label="Start" value={proj.startDate} onChange={(v) => updateProject(proj.id, 'startDate', v)} type="date" />
              <Input label="End" value={proj.endDate} onChange={(v) => updateProject(proj.id, 'endDate', v)} type="date" />
            </div>
          </div>
          <div className="w-full relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">Description (Bullet points)</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md text-sm pr-20"
              rows={3}
              value={proj.description}
              onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
            />
            <button
              onClick={() => handlePolish(proj.id, proj.description, 'project')}
              disabled={polishingId === proj.id}
              className="absolute right-2 bottom-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-200 transition"
            >
              <Sparkles className={`w-3 h-3 ${polishingId === proj.id ? 'animate-spin' : ''}`} />
              {polishingId === proj.id ? 'Polishing...' : 'Polish'}
            </button>
          </div>
        </div>
      ))}
      <button onClick={addProject} className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 flex items-center gap-1">
        <Plus className="w-4 h-4" /> Add Project
      </button>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800">Work Experience</h2>
      {resume.workExperience.map((exp) => (
        <div key={exp.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
          <button onClick={() => setResume(p => ({ ...p, workExperience: p.workExperience.filter(e => e.id !== exp.id) }))} className="absolute right-2 top-2 text-red-500 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label="Company Name" value={exp.company} onChange={(v) => updateExp(exp.id, 'company', v)} />
            <Input label="Designation" value={exp.designation} onChange={(v) => updateExp(exp.id, 'designation', v)} />
            <Input label="Duration" value={exp.duration} onChange={(v) => updateExp(exp.id, 'duration', v)} placeholder="e.g. Jun 2023 - Present" />
            <Input label="Notice Period" value={exp.noticePeriod || ''} onChange={(v) => updateExp(exp.id, 'noticePeriod', v)} />
          </div>
          <div className="w-full relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">Key Achievements / Description</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md text-sm pr-20"
              rows={3}
              value={exp.description}
              onChange={(e) => updateExp(exp.id, 'description', e.target.value)}
            />
            <button
              onClick={() => handlePolish(exp.id, exp.description, 'experience')}
              disabled={polishingId === exp.id}
              className="absolute right-2 bottom-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-purple-200 transition"
            >
              <Sparkles className={`w-3 h-3 ${polishingId === exp.id ? 'animate-spin' : ''}`} />
              {polishingId === exp.id ? 'Polishing...' : 'Polish'}
            </button>
          </div>
        </div>
      ))}
      <button onClick={addExp} className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 flex items-center gap-1">
        <Plus className="w-4 h-4" /> Add Experience
      </button>
    </div>
  );

  const renderPreview = () => {
    const atsResume = resumeDataToStandardATS(resume);
    return (
      <div className="animate-fadeIn space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3 no-print bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Final ATS Resume Preview</h2>
            <p className="text-xs text-gray-500">Standard single-column layout optimized for parsers and recruiters</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadResumeAsDocx(atsResume)}
              className="bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Word (.docx)
            </button>
            <button
              onClick={() => downloadResumeAsPdf(atsResume)}
              className="bg-red-600 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-red-700 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> PDF (.pdf)
            </button>
            <button
              onClick={() => window.print()}
              className="bg-slate-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>

        <ATSResumeDocument
          resume={atsResume}
          onChange={(updated) => setResume(standardATSToResumeData(updated))}
          allowDownload={false}
        />
      </div>
    );
  };

  const steps = [
    { title: 'Basic Info', render: renderBasicInfo },
    { title: 'Summary', render: renderSummary },
    { title: 'Experience', render: renderExperience },
    { title: 'Education', render: renderEducation },
    { title: 'Projects', render: renderProjects },
    {
      title: 'Skills & Certs', render: () => (
        <div className="space-y-6 animate-fadeIn">
          <h2 className="text-xl font-bold text-gray-800">Skills</h2>
          <Input label="Programming Languages" value={resume.skills.languages} onChange={v => setResume(p => ({ ...p, skills: { ...p.skills, languages: v } }))} placeholder="Java, Python, C++" />
          <Input label="Frameworks & Tools" value={resume.skills.frameworks} onChange={v => setResume(p => ({ ...p, skills: { ...p.skills, frameworks: v } }))} placeholder="React, Git, Docker" />
        </div>
      )
    },
    { title: 'Preview & Download', render: renderPreview }
  ];

  // =========================================================
  // VIEW: 1. OPTION SELECTOR (Upload Resume vs Create Resume)
  // =========================================================
  if (sectionMode === 'options') {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">Resume Builder & ATS Converter</h1>
          <p className="text-slate-500 text-sm">
            Choose whether to build your resume step-by-step from scratch or upload an existing file to instantly convert it into a standardized single-page ATS resume.
          </p>
        </div>

        {/* 2 Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Create Resume */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <div className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-[11px] font-bold rounded-full mb-3 uppercase tracking-wider">
                Step-by-Step Builder
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Create Resume</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Fill in your background with our guided form. Includes AI summary generation, bullet-point polishers, and real-time formatting according to industry standards.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Guided multi-step questionnaire with auto-saving
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  AI action verb and achievement enhancer
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Direct export to Word (.docx) and PDF (.pdf)
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                setSectionMode('create');
                setStep(1);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Start Creating Resume
            </button>
          </div>

          {/* Card 2: Upload Resume & Convert to ATS */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full mb-3 uppercase tracking-wider">
                Instant Single-Page ATS Convert
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Upload Resume</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Have an existing resume? Upload your file to automatically convert it into a standardized single-page ATS-compliant layout following all 7 standard sections.
              </p>

              {/* Upload Card Box Button right on the card */}
              <div className="mb-4">
                <DocumentUploadZone
                  label="Click or Drag Resume Here to Convert"
                  sublabel="Accepts PDF, DOCX, DOC, TXT, RTF, ODT (Max 10MB)"
                  onTextExtracted={handleUploadedResume}
                />
              </div>

              {isConverting && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-2 animate-pulse mb-4">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Converting into standardized single-page ATS layout...
                </div>
              )}
            </div>

            <div className="pt-2 text-center text-xs text-slate-400">
              Converts to Contact • Summary • Skills • Experience • Projects • Education • Certifications
            </div>
          </div>
        </div>

        {/* ATS Checklist Box */}
        <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl shadow-sm text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            Standard ATS Resume Structure & Credibility Checklist
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-300 text-[11px] leading-relaxed">
            <div>
              <strong className="text-white block mb-1">1. Layout & Styling:</strong>
              Single column, Calibri/Arial, no tables, no text boxes, no icons or photos.
            </div>
            <div>
              <strong className="text-white block mb-1">2. Standard Headings:</strong>
              Professional Summary • Technical Skills • Experience • Projects • Education.
            </div>
            <div>
              <strong className="text-white block mb-1">3. Factual Accuracy:</strong>
              Accurate dates (e.g. May 2024 – Present), verifiable links, truthful metrics.
            </div>
            <div>
              <strong className="text-white block mb-1">4. Dual Export:</strong>
              Selectable-text PDF (.pdf) and structured Microsoft Word (.docx).
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW: 2. UPLOADED RESUME CONVERTED TO SINGLE-PAGE ATS
  // =========================================================
  if (sectionMode === 'upload' && convertedATS) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fadeIn">
        {/* Top Navigation Bar with Back to Options */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSectionMode('options')}
              className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Options
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-800">Standardized Single-Page ATS Resume</h2>
              <p className="text-xs text-slate-500">Converted according to ATS specifications • Editable live preview</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSectionMode('create');
                setStep(1);
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
            >
              Open in Step-by-Step Form
            </button>
          </div>
        </div>

        {/* Live A4 ATS Document Preview with Downloads & Editing */}
        <ATSResumeDocument
          resume={convertedATS}
          onChange={(updated) => {
            setConvertedATS(updated);
            setResume(standardATSToResumeData(updated));
          }}
          isTailoredToJD={false}
        />
      </div>
    );
  }

  // =========================================================
  // VIEW: 3. STEP-BY-STEP BUILDER (Existing details preserved)
  // =========================================================
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4 animate-fadeIn">
      {/* Top Banner with Easy Back to Options Button */}
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSectionMode('options')}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Options
          </button>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Create Resume Mode • Step-by-step
          </span>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          {isSaving ? <span className="text-blue-600 font-medium">Saving draft...</span> : <span>Draft Saved</span>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg min-h-[600px] flex flex-col md:flex-row overflow-hidden border border-slate-200">
        {/* Sidebar Steps */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6 no-print">
          <h3 className="font-bold text-slate-700 mb-6 uppercase text-xs tracking-wider">Progress</h3>
          <div className="space-y-1">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i + 1)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-between ${step === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                {s.title}
                {step > i + 1 && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-10 flex flex-col">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {steps[step - 1].render()}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between no-print">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(Math.min(steps.length, step + 1))}
              disabled={step === steps.length}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${step === steps.length ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                }`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Input Component
const Input: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="w-full">
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

export default ResumeBuilder;
