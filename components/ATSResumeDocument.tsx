import React, { useState } from 'react';
import { StandardATSResume } from '../types';
import { Download, FileText, Check, Edit3, Eye, Sparkles, Plus, Trash2 } from 'lucide-react';
import { downloadResumeAsDocx, downloadResumeAsPdf } from '../services/exportResume';

interface ATSResumeDocumentProps {
  resume: StandardATSResume;
  onChange?: (updated: StandardATSResume) => void;
  isTailoredToJD?: boolean;
  className?: string;
  allowDownload?: boolean;
}

export const ATSResumeDocument: React.FC<ATSResumeDocumentProps> = ({
  resume,
  onChange,
  isTailoredToJD = false,
  className = '',
  allowDownload = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const updateContact = (field: keyof StandardATSResume['contactInfo'], val: string) => {
    if (!onChange) return;
    onChange({
      ...resume,
      contactInfo: { ...resume.contactInfo, [field]: val },
    });
  };

  const updateSummary = (val: string) => {
    if (!onChange) return;
    onChange({ ...resume, professionalSummary: val });
  };

  const updateSkillCategory = (cat: keyof StandardATSResume['technicalSkills'], valStr: string) => {
    if (!onChange) return;
    const items = valStr.split(',').map(s => s.trim()).filter(Boolean);
    onChange({
      ...resume,
      technicalSkills: { ...resume.technicalSkills, [cat]: items },
    });
  };

  const updateExpBullet = (expId: string, bulletIdx: number, val: string) => {
    if (!onChange) return;
    onChange({
      ...resume,
      professionalExperience: resume.professionalExperience.map(e => {
        if (e.id !== expId) return e;
        const newBullets = [...e.bullets];
        newBullets[bulletIdx] = val;
        return { ...e, bullets: newBullets };
      }),
    });
  };

  const addExpBullet = (expId: string) => {
    if (!onChange) return;
    onChange({
      ...resume,
      professionalExperience: resume.professionalExperience.map(e => {
        if (e.id !== expId) return e;
        return { ...e, bullets: [...e.bullets, 'Engineered high-performance module delivering measurable results.'] };
      }),
    });
  };

  const removeExpBullet = (expId: string, bulletIdx: number) => {
    if (!onChange) return;
    onChange({
      ...resume,
      professionalExperience: resume.professionalExperience.map(e => {
        if (e.id !== expId) return e;
        return { ...e, bullets: e.bullets.filter((_, idx) => idx !== bulletIdx) };
      }),
    });
  };

  const handleDownload = async (format: 'docx' | 'pdf') => {
    setIsDownloading(format);
    try {
      if (format === 'docx') {
        await downloadResumeAsDocx(resume);
      } else {
        await downloadResumeAsPdf(resume);
      }
    } catch (err) {
      console.error(`Download ${format} failed:`, err);
      alert(`Download ${format.toUpperCase()} failed. Please try again.`);
    } finally {
      setIsDownloading(null);
      setShowDownloadMenu(false);
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Top Document Toolbar */}
      <div className="w-full max-w-[800px] flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {isTailoredToJD && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              JD-Tailored ATS Standard
            </span>
          )}
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Single-Column • Selectable A4 Layout
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onChange && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isEditing
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditing ? 'Done Editing' : 'Edit Resume'}
            </button>
          )}

          {allowDownload && (
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-2 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Resume
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fadeIn">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Format
                  </div>
                  <button
                    onClick={() => handleDownload('docx')}
                    disabled={isDownloading !== null}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Microsoft Word (.docx)
                    </span>
                    {isDownloading === 'docx' && <span className="text-[10px] text-blue-600">Generating...</span>}
                  </button>
                  <button
                    onClick={() => handleDownload('pdf')}
                    disabled={isDownloading !== null}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 flex items-center justify-between transition"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-600" />
                      Standard PDF (.pdf)
                    </span>
                    {isDownloading === 'pdf' && <span className="text-[10px] text-red-600">Generating...</span>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="w-full overflow-x-auto flex justify-center pb-8">
        <div
          className="bg-white text-slate-900 shadow-md border border-slate-200 rounded-sm w-[794px] min-h-[1123px] p-10 md:p-12 font-sans text-[13px] leading-relaxed flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900"
          style={{ fontFamily: 'Calibri, Arial, Helvetica, sans-serif' }}
        >
          <div>
            {/* 1. CONTACT INFORMATION */}
            <header className="text-center pb-3 border-b border-slate-200 mb-4">
              {isEditing ? (
                <input
                  type="text"
                  value={resume.contactInfo.fullName}
                  onChange={e => updateContact('fullName', e.target.value)}
                  className="text-2xl font-bold text-center w-full uppercase tracking-wide border-b border-dashed border-blue-400 outline-none pb-1"
                  placeholder="FULL NAME"
                />
              ) : (
                <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
                  {resume.contactInfo.fullName || 'YOUR NAME'}
                </h1>
              )}

              {/* Contact details line */}
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11.5px] text-slate-600">
                {isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full mt-2 text-left">
                    <input
                      type="text"
                      value={resume.contactInfo.phone}
                      onChange={e => updateContact('phone', e.target.value)}
                      placeholder="Phone"
                      className="p-1 border text-xs rounded"
                    />
                    <input
                      type="text"
                      value={resume.contactInfo.email}
                      onChange={e => updateContact('email', e.target.value)}
                      placeholder="Email"
                      className="p-1 border text-xs rounded"
                    />
                    <input
                      type="text"
                      value={resume.contactInfo.location}
                      onChange={e => updateContact('location', e.target.value)}
                      placeholder="City, State"
                      className="p-1 border text-xs rounded"
                    />
                    <input
                      type="text"
                      value={resume.contactInfo.linkedin}
                      onChange={e => updateContact('linkedin', e.target.value)}
                      placeholder="LinkedIn URL"
                      className="p-1 border text-xs rounded"
                    />
                    <input
                      type="text"
                      value={resume.contactInfo.github}
                      onChange={e => updateContact('github', e.target.value)}
                      placeholder="GitHub URL"
                      className="p-1 border text-xs rounded"
                    />
                    <input
                      type="text"
                      value={resume.contactInfo.portfolio}
                      onChange={e => updateContact('portfolio', e.target.value)}
                      placeholder="Portfolio URL"
                      className="p-1 border text-xs rounded"
                    />
                  </div>
                ) : (
                  <>
                    {resume.contactInfo.phone && <span>{resume.contactInfo.phone}</span>}
                    {resume.contactInfo.email && (
                      <>
                        <span className="text-slate-300">|</span>
                        <a href={`mailto:${resume.contactInfo.email}`} className="hover:underline">
                          {resume.contactInfo.email}
                        </a>
                      </>
                    )}
                    {resume.contactInfo.location && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span>{resume.contactInfo.location}</span>
                      </>
                    )}
                    {resume.contactInfo.linkedin && (
                      <>
                        <span className="text-slate-300">|</span>
                        <a
                          href={resume.contactInfo.linkedin.startsWith('http') ? resume.contactInfo.linkedin : `https://${resume.contactInfo.linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          LinkedIn
                        </a>
                      </>
                    )}
                    {resume.contactInfo.github && (
                      <>
                        <span className="text-slate-300">|</span>
                        <a
                          href={resume.contactInfo.github.startsWith('http') ? resume.contactInfo.github : `https://${resume.contactInfo.github}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          GitHub
                        </a>
                      </>
                    )}
                    {resume.contactInfo.portfolio && (
                      <>
                        <span className="text-slate-300">|</span>
                        <a
                          href={resume.contactInfo.portfolio.startsWith('http') ? resume.contactInfo.portfolio : `https://${resume.contactInfo.portfolio}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Portfolio
                        </a>
                      </>
                    )}
                  </>
                )}
              </div>
            </header>

            {/* 2. PROFESSIONAL SUMMARY */}
            {(resume.professionalSummary || isEditing) && (
              <section className="mb-4">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
                  Professional Summary
                </h2>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={resume.professionalSummary}
                    onChange={e => updateSummary(e.target.value)}
                    className="w-full p-2 border border-blue-400 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Concise 2–4 line overview of experience, core capabilities, and verified achievements..."
                  />
                ) : (
                  <p className="text-[12px] text-slate-800 leading-normal text-justify">
                    {resume.professionalSummary}
                  </p>
                )}
              </section>
            )}

            {/* 3. TECHNICAL SKILLS */}
            <section className="mb-4">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
                Technical Skills
              </h2>
              {isEditing ? (
                <div className="space-y-1.5 text-xs">
                  <div>
                    <label className="font-semibold block text-[11px] text-slate-600">Languages (comma separated):</label>
                    <input
                      type="text"
                      value={(resume.technicalSkills.languages || []).join(', ')}
                      onChange={e => updateSkillCategory('languages', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-[11px] text-slate-600">Frameworks & Libraries:</label>
                    <input
                      type="text"
                      value={(resume.technicalSkills.frameworks || []).join(', ')}
                      onChange={e => updateSkillCategory('frameworks', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-[11px] text-slate-600">Databases:</label>
                    <input
                      type="text"
                      value={(resume.technicalSkills.databases || []).join(', ')}
                      onChange={e => updateSkillCategory('databases', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-[11px] text-slate-600">Cloud & DevOps:</label>
                    <input
                      type="text"
                      value={(resume.technicalSkills.cloudDevops || []).join(', ')}
                      onChange={e => updateSkillCategory('cloudDevops', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-[11px] text-slate-600">Tools & Platforms:</label>
                    <input
                      type="text"
                      value={(resume.technicalSkills.toolsPlatforms || []).join(', ')}
                      onChange={e => updateSkillCategory('toolsPlatforms', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5 text-[12px] text-slate-800">
                  {resume.technicalSkills.languages?.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Languages:</strong>{' '}
                      {resume.technicalSkills.languages.join(', ')}
                    </div>
                  )}
                  {resume.technicalSkills.aiMl && resume.technicalSkills.aiMl.length > 0 && (
                    <div>
                      <strong className="text-slate-900">AI / ML:</strong>{' '}
                      {resume.technicalSkills.aiMl.join(', ')}
                    </div>
                  )}
                  {resume.technicalSkills.frameworks?.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Frameworks & Libraries:</strong>{' '}
                      {resume.technicalSkills.frameworks.join(', ')}
                    </div>
                  )}
                  {resume.technicalSkills.databases?.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Databases:</strong>{' '}
                      {resume.technicalSkills.databases.join(', ')}
                    </div>
                  )}
                  {resume.technicalSkills.cloudDevops?.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Cloud & DevOps:</strong>{' '}
                      {resume.technicalSkills.cloudDevops.join(', ')}
                    </div>
                  )}
                  {resume.technicalSkills.toolsPlatforms?.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Tools & Platforms:</strong>{' '}
                      {resume.technicalSkills.toolsPlatforms.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 4. PROFESSIONAL EXPERIENCE */}
            {resume.professionalExperience?.length > 0 && (
              <section className="mb-4">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
                  Professional Experience
                </h2>
                <div className="space-y-3">
                  {resume.professionalExperience.map(exp => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline text-[12px]">
                        <div>
                          <span className="font-bold text-slate-900">{exp.role}</span>
                          <span className="text-slate-700"> | {exp.company}</span>
                          {exp.location && <span className="text-slate-500"> — {exp.location}</span>}
                        </div>
                        <span className="font-semibold text-slate-700 text-[11.5px]">{exp.dates}</span>
                      </div>
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-[11.5px] text-slate-800">
                        {exp.bullets.map((b, idx) => (
                          <li key={idx} className="leading-snug">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={b}
                                  onChange={e => updateExpBullet(exp.id, idx, e.target.value)}
                                  className="w-full p-1 border text-xs rounded"
                                />
                                <button
                                  onClick={() => removeExpBullet(exp.id, idx)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              b.replace(/^[-•*]\s*/, '')
                            )}
                          </li>
                        ))}
                      </ul>
                      {isEditing && (
                        <button
                          onClick={() => addExpBullet(exp.id)}
                          className="mt-1 text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add bullet
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. PROJECTS */}
            {resume.projects?.length > 0 && (
              <section className="mb-4">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
                  Projects
                </h2>
                <div className="space-y-3">
                  {resume.projects.map(proj => (
                    <div key={proj.id}>
                      <div className="flex justify-between items-baseline text-[12px]">
                        <div>
                          <span className="font-bold text-slate-900">{proj.title}</span>
                          {proj.techStack?.length > 0 && (
                            <span className="text-slate-600 text-[11px]"> [{proj.techStack.join(', ')}]</span>
                          )}
                          {proj.link && (
                            <a
                              href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 ml-2 text-[11px] hover:underline"
                            >
                              [Link]
                            </a>
                          )}
                        </div>
                        {proj.dates && <span className="text-slate-600 text-[11.5px]">{proj.dates}</span>}
                      </div>
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-[11.5px] text-slate-800">
                        {proj.bullets.map((b, idx) => (
                          <li key={idx} className="leading-snug">
                            {b.replace(/^[-•*]\s*/, '')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 6. EDUCATION */}
            {resume.education?.length > 0 && (
              <section className="mb-4">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
                  Education
                </h2>
                <div className="space-y-1.5">
                  {resume.education.map(edu => (
                    <div key={edu.id} className="flex justify-between items-baseline text-[12px]">
                      <div>
                        <span className="font-bold text-slate-900">{edu.degree}</span>
                        <span className="text-slate-700"> | {edu.institution}</span>
                        {edu.location && <span className="text-slate-500">, {edu.location}</span>}
                        {edu.score && <span className="text-slate-600 text-[11px]"> — Score: {edu.score}</span>}
                      </div>
                      {edu.graduationYear && (
                        <span className="text-slate-600 text-[11.5px] font-medium">{edu.graduationYear}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 7. CERTIFICATIONS & ACHIEVEMENTS */}
            {resume.certificationsAndAchievements?.length > 0 && (
              <section className="mb-2">
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
                  Certifications & Achievements
                </h2>
                <ul className="list-disc pl-4 space-y-0.5 text-[11.5px] text-slate-800">
                  {resume.certificationsAndAchievements.map(cert => (
                    <li key={cert.id} className="leading-snug">
                      <strong className="text-slate-900">{cert.title}</strong>
                      {cert.issuer && <span className="text-slate-600"> — {cert.issuer}</span>}
                      {cert.date && <span className="text-slate-500"> ({cert.date})</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Standard Footer Note */}
          <footer className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-widest">
            Standard ATS Single-Column Layout • Verified Format
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ATSResumeDocument;
