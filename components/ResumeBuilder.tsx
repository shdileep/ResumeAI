import React, { useState, useRef } from 'react';
import { ResumeData, Education, Project, WorkExperience, Certification } from '../types';
import { ChevronRight, ChevronLeft, Plus, Trash2, Wand2, Download, Printer, Briefcase, Sparkles } from 'lucide-react';
import { generateProfessionalSummary, polishSentence } from '../services/geminiService';

const emptyResume: ResumeData = {
  personalInfo: { fullName: '', role: '', email: '', phone: '', linkedin: '', github: '', portfolio: '' },
  summary: '',
  education: [],
  projects: [],
  workExperience: [],
  skills: { languages: '', frameworks: '', tools: '' },
  certifications: []
};

const ResumeBuilder: React.FC = () => {
  const [step, setStep] = useState(1);
  const [resume, setResume] = useState<ResumeData>(emptyResume);
  const [isGenerating, setIsGenerating] = useState(false);
  const [polishingId, setPolishingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load initial data
  React.useEffect(() => {
    const loadData = async () => {
      const { auth, getResume } = await import('../services/firebase');
      if (auth.currentUser) {
        const data = await getResume(auth.currentUser.uid);
        if (data) setResume(data);
      }
    };
    loadData();
  }, []);

  // Save on change (debounced)
  React.useEffect(() => {
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

  // --- RENDER STEPS ---

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

      {resume.education.map((edu, index) => (
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

  const renderPreview = () => (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-xl font-bold text-gray-800">Final Resume Preview</h2>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md">
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Resume Document - A4 Aspect Ratio approx */}
      <div className="bg-white shadow-xl p-8 md:p-12 max-w-4xl mx-auto min-h-[1000px] text-gray-800" id="resume-preview">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-wide">{resume.personalInfo.fullName || 'YOUR NAME'}</h1>
          <p className="text-lg text-gray-600 font-medium">{resume.personalInfo.role || 'Desired Role'}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
            <span>{resume.personalInfo.email}</span>
            <span>•</span>
            <span>{resume.personalInfo.phone}</span>
            <span>•</span>
            <span>{resume.personalInfo.linkedin}</span>
          </div>
        </div>

        {/* Sections */}
        {resume.summary && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-2">Professional Summary</h3>
            <p className="text-sm leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {resume.workExperience.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-2">Work Experience</h3>
            <div className="space-y-4">
              {resume.workExperience.map(exp => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-sm">{exp.company} - {exp.designation}</h4>
                    <span className="text-xs text-gray-500">{exp.duration}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-line text-gray-700">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.projects.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-2">Projects</h3>
            <div className="space-y-4">
              {resume.projects.map(p => (
                <div key={p.id}>
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-sm">{p.title}</h4>
                    <span className="text-xs text-gray-500">{p.startDate} - {p.endDate}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-line text-gray-700">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.skills.languages && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-2">Technical Skills</h3>
            <div className="text-sm grid grid-cols-[120px_1fr] gap-2">
              <span className="font-semibold">Languages:</span> <span>{resume.skills.languages}</span>
              <span className="font-semibold">Tools/Frameworks:</span> <span>{resume.skills.frameworks}</span>
            </div>
          </div>
        )}

        {resume.education.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-2">Education</h3>
            <div className="space-y-3">
              {resume.education.map(e => (
                <div key={e.id} className="flex justify-between">
                  <div>
                    <h4 className="font-bold text-sm">{e.institution}</h4>
                    {e.location && <p className="text-xs text-gray-500">{e.location}</p>}
                    <p className="text-sm">{e.degree} {e.specialization ? `in ${e.specialization}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs block text-gray-500">{e.startYear} - {e.endYear}</span>
                    <span className="text-xs font-medium">Score: {e.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

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
    { title: 'Preview', render: renderPreview }
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-lg min-h-[600px] flex flex-col md:flex-row overflow-hidden">
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
