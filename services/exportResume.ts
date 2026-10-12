import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, ExternalHyperlink, BorderStyle } from 'docx';
import { jsPDF } from 'jspdf';
import { StandardATSResume } from '../types';

/**
 * Downloads a Blob directly in the browser
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a standardized, ATS-compliant Microsoft Word (.docx) document
 */
export async function downloadResumeAsDocx(resume: StandardATSResume, customFilename?: string): Promise<void> {
  const name = resume.contactInfo.fullName || 'Candidate';
  const cleanFilename = customFilename || `${name.replace(/\s+/g, '_')}_ATS_Resume.docx`;

  const children: Paragraph[] = [];

  // 1. Header: Full Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: resume.contactInfo.fullName.toUpperCase() || 'YOUR NAME',
          bold: true,
          size: 32, // 16pt
          font: 'Calibri',
          color: '1E293B',
        }),
      ],
    })
  );

  // Contact Info Line: Phone | Email | Location | LinkedIn | GitHub | Portfolio
  const contactParts: (TextRun | ExternalHyperlink)[] = [];
  const addContactItem = (text: string, link?: string) => {
    if (!text) return;
    if (contactParts.length > 0) {
      contactParts.push(new TextRun({ text: '  |  ', font: 'Calibri', size: 19, color: '64748B' }));
    }
    if (link) {
      contactParts.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text,
              style: 'Hyperlink',
              font: 'Calibri',
              size: 19,
              color: '2563EB',
              underline: {},
            }),
          ],
          link,
        })
      );
    } else {
      contactParts.push(new TextRun({ text, font: 'Calibri', size: 19, color: '334155' }));
    }
  };

  addContactItem(resume.contactInfo.phone);
  addContactItem(resume.contactInfo.email, resume.contactInfo.email ? `mailto:${resume.contactInfo.email}` : undefined);
  addContactItem(resume.contactInfo.location);
  if (resume.contactInfo.linkedin) addContactItem('LinkedIn', resume.contactInfo.linkedin.startsWith('http') ? resume.contactInfo.linkedin : `https://${resume.contactInfo.linkedin}`);
  if (resume.contactInfo.github) addContactItem('GitHub', resume.contactInfo.github.startsWith('http') ? resume.contactInfo.github : `https://${resume.contactInfo.github}`);
  if (resume.contactInfo.portfolio) addContactItem('Portfolio', resume.contactInfo.portfolio.startsWith('http') ? resume.contactInfo.portfolio : `https://${resume.contactInfo.portfolio}`);

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: contactParts,
    })
  );

  // Helper for ATS Section Heading
  const addSectionHeading = (title: string) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: '94A3B8',
            space: 4,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 23, // 11.5pt
            font: 'Calibri',
            color: '0F172A',
          }),
        ],
      })
    );
  };

  // 2. Professional Summary
  if (resume.professionalSummary && resume.professionalSummary.trim()) {
    addSectionHeading('Professional Summary');
    children.push(
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: resume.professionalSummary.trim(),
            font: 'Calibri',
            size: 21, // 10.5pt
            color: '1E293B',
          }),
        ],
      })
    );
  }

  // 3. Technical Skills
  const skills = resume.technicalSkills;
  const hasSkills =
    (skills.languages && skills.languages.length > 0) ||
    (skills.frameworks && skills.frameworks.length > 0) ||
    (skills.databases && skills.databases.length > 0) ||
    (skills.cloudDevops && skills.cloudDevops.length > 0) ||
    (skills.toolsPlatforms && skills.toolsPlatforms.length > 0);

  if (hasSkills) {
    addSectionHeading('Technical Skills');
    const skillRows: { label: string; items?: string[] }[] = [
      { label: 'Languages', items: skills.languages },
      { label: 'AI/ML', items: skills.aiMl },
      { label: 'Frameworks & Libraries', items: skills.frameworks },
      { label: 'Databases', items: skills.databases },
      { label: 'Cloud & DevOps', items: skills.cloudDevops },
      { label: 'Tools & Platforms', items: skills.toolsPlatforms },
    ];

    skillRows.forEach(row => {
      if (row.items && row.items.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `${row.label}: `, bold: true, font: 'Calibri', size: 21, color: '0F172A' }),
              new TextRun({ text: row.items.join(', '), font: 'Calibri', size: 21, color: '334155' }),
            ],
          })
        );
      }
    });
  }

  // 4. Professional Experience
  if (resume.professionalExperience && resume.professionalExperience.length > 0) {
    addSectionHeading('Professional Experience');
    resume.professionalExperience.forEach(exp => {
      // Role & Company Header with Date on right
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({ text: exp.role || 'Job Title', bold: true, font: 'Calibri', size: 21, color: '0F172A' }),
            new TextRun({ text: ` | ${exp.company || 'Company'}`, font: 'Calibri', size: 21, color: '334155' }),
            exp.location ? new TextRun({ text: ` — ${exp.location}`, font: 'Calibri', size: 21, color: '64748B' }) : new TextRun({ text: '' }),
            new TextRun({ text: `   (${exp.dates || 'Dates'})`, bold: true, font: 'Calibri', size: 20, color: '475569' }),
          ],
        })
      );

      // Bullets
      exp.bullets.forEach(bullet => {
        if (!bullet || !bullet.trim()) return;
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: bullet.replace(/^[-•*]\s*/, '').trim(),
                font: 'Calibri',
                size: 21,
                color: '1E293B',
              }),
            ],
          })
        );
      });
    });
  }

  // 5. Projects
  if (resume.projects && resume.projects.length > 0) {
    addSectionHeading('Projects');
    resume.projects.forEach(proj => {
      const headerRuns: (TextRun | ExternalHyperlink)[] = [
        new TextRun({ text: proj.title || 'Project Title', bold: true, font: 'Calibri', size: 21, color: '0F172A' }),
      ];

      if (proj.techStack && proj.techStack.length > 0) {
        headerRuns.push(new TextRun({ text: ` [${proj.techStack.join(', ')}]`, font: 'Calibri', size: 20, color: '475569' }));
      }

      if (proj.dates) {
        headerRuns.push(new TextRun({ text: `  (${proj.dates})`, font: 'Calibri', size: 20, color: '64748B' }));
      }

      if (proj.link) {
        headerRuns.push(new TextRun({ text: '  -  ', font: 'Calibri', size: 20, color: '64748B' }));
        headerRuns.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: 'Link',
                style: 'Hyperlink',
                font: 'Calibri',
                size: 20,
                color: '2563EB',
                underline: {},
              }),
            ],
            link: proj.link.startsWith('http') ? proj.link : `https://${proj.link}`,
          })
        );
      }

      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: headerRuns,
        })
      );

      proj.bullets.forEach(bullet => {
        if (!bullet || !bullet.trim()) return;
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: bullet.replace(/^[-•*]\s*/, '').trim(),
                font: 'Calibri',
                size: 21,
                color: '1E293B',
              }),
            ],
          })
        );
      });
    });
  }

  // 6. Education
  if (resume.education && resume.education.length > 0) {
    addSectionHeading('Education');
    resume.education.forEach(edu => {
      const eduRuns: TextRun[] = [
        new TextRun({ text: edu.degree || 'Degree', bold: true, font: 'Calibri', size: 21, color: '0F172A' }),
        new TextRun({ text: ` | ${edu.institution || 'Institution'}`, font: 'Calibri', size: 21, color: '334155' }),
      ];

      if (edu.location) {
        eduRuns.push(new TextRun({ text: `, ${edu.location}`, font: 'Calibri', size: 21, color: '64748B' }));
      }

      if (edu.graduationYear) {
        eduRuns.push(new TextRun({ text: `   (${edu.graduationYear})`, font: 'Calibri', size: 20, color: '475569' }));
      }

      if (edu.score) {
        eduRuns.push(new TextRun({ text: `  - CGPA/Percentage: ${edu.score}`, font: 'Calibri', size: 20, color: '475569' }));
      }

      children.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: eduRuns,
        })
      );
    });
  }

  // 7. Certifications and Achievements
  if (resume.certificationsAndAchievements && resume.certificationsAndAchievements.length > 0) {
    addSectionHeading('Certifications & Achievements');
    resume.certificationsAndAchievements.forEach(cert => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({ text: cert.title, bold: true, font: 'Calibri', size: 21, color: '0F172A' }),
            cert.issuer ? new TextRun({ text: ` - ${cert.issuer}`, font: 'Calibri', size: 21, color: '475569' }) : new TextRun({ text: '' }),
            cert.date ? new TextRun({ text: ` (${cert.date})`, font: 'Calibri', size: 20, color: '64748B' }) : new TextRun({ text: '' }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, cleanFilename);
}

/**
 * Generates and downloads a standardized, selectable-text A4 PDF resume with clean margins and typography
 */
export async function downloadResumeAsPdf(resume: StandardATSResume, customFilename?: string): Promise<void> {
  const name = resume.contactInfo.fullName || 'Candidate';
  const cleanFilename = customFilename || `${name.replace(/\s+/g, '_')}_ATS_Resume.pdf`;

  // A4 size: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const marginTop = 12;
  const marginBottom = 14;
  const usableWidth = pageWidth - marginX * 2;

  let y = marginTop;

  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  // Helper for Section Heading
  const renderSectionHeader = (title: string) => {
    checkPageOverflow(12);
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title.toUpperCase(), marginX, y);
    y += 1.5;
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.line(marginX, y, marginX + usableWidth, y);
    y += 4;
  };

  // 1. Name & Role Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const candidateName = (resume.contactInfo.fullName || 'YOUR NAME').toUpperCase();
  doc.text(candidateName, pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  // Contact Info Line
  const contactParts: string[] = [];
  if (resume.contactInfo.phone) contactParts.push(resume.contactInfo.phone);
  if (resume.contactInfo.email) contactParts.push(resume.contactInfo.email);
  if (resume.contactInfo.location) contactParts.push(resume.contactInfo.location);
  if (resume.contactInfo.linkedin) contactParts.push('LinkedIn');
  if (resume.contactInfo.github) contactParts.push('GitHub');
  if (resume.contactInfo.portfolio) contactParts.push('Portfolio');

  if (contactParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(contactParts.join('  |  '), pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  // 2. Professional Summary
  if (resume.professionalSummary && resume.professionalSummary.trim()) {
    renderSectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(30, 41, 59);
    const summaryLines = doc.splitTextToSize(resume.professionalSummary.trim(), usableWidth);
    checkPageOverflow(summaryLines.length * 4.2);
    doc.text(summaryLines, marginX, y);
    y += summaryLines.length * 4.2 + 2;
  }

  // 3. Technical Skills
  const skills = resume.technicalSkills;
  const skillRows: { label: string; items?: string[] }[] = [
    { label: 'Languages', items: skills.languages },
    { label: 'AI/ML', items: skills.aiMl },
    { label: 'Frameworks & Libraries', items: skills.frameworks },
    { label: 'Databases', items: skills.databases },
    { label: 'Cloud & DevOps', items: skills.cloudDevops },
    { label: 'Tools & Platforms', items: skills.toolsPlatforms },
  ].filter(r => r.items && r.items.length > 0);

  if (skillRows.length > 0) {
    renderSectionHeader('Technical Skills');
    skillRows.forEach(row => {
      checkPageOverflow(5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const labelText = `${row.label}: `;
      doc.text(labelText, marginX, y);
      const labelWidth = doc.getTextWidth(labelText);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const itemsText = (row.items || []).join(', ');
      const valLines = doc.splitTextToSize(itemsText, usableWidth - labelWidth);
      doc.text(valLines, marginX + labelWidth, y);
      y += Math.max(valLines.length * 4, 4);
    });
    y += 1.5;
  }

  // 4. Professional Experience
  if (resume.professionalExperience && resume.professionalExperience.length > 0) {
    renderSectionHeader('Professional Experience');
    resume.professionalExperience.forEach(exp => {
      checkPageOverflow(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(exp.role || 'Role', marginX, y);

      // Date right-aligned
      if (exp.dates) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8);
        doc.setTextColor(71, 85, 105);
        doc.text(exp.dates, marginX + usableWidth, y, { align: 'right' });
      }
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const companyLine = `${exp.company}${exp.location ? ` — ${exp.location}` : ''}`;
      doc.text(companyLine, marginX, y);
      y += 4;

      // Bullets
      exp.bullets.forEach(bullet => {
        if (!bullet || !bullet.trim()) return;
        const cleanBullet = bullet.replace(/^[-•*]\s*/, '').trim();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(30, 41, 59);
        const bulletLines = doc.splitTextToSize(cleanBullet, usableWidth - 5);
        checkPageOverflow(bulletLines.length * 4);
        doc.text('•', marginX + 1, y);
        doc.text(bulletLines, marginX + 5, y);
        y += bulletLines.length * 3.8 + 0.8;
      });
      y += 1.5;
    });
  }

  // 5. Projects
  if (resume.projects && resume.projects.length > 0) {
    renderSectionHeader('Projects');
    resume.projects.forEach(proj => {
      checkPageOverflow(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);

      let projTitle = proj.title || 'Project';
      if (proj.techStack && proj.techStack.length > 0) {
        projTitle += ` | [${proj.techStack.join(', ')}]`;
      }
      doc.text(projTitle, marginX, y);

      if (proj.dates) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(proj.dates, marginX + usableWidth, y, { align: 'right' });
      }
      y += 4;

      proj.bullets.forEach(bullet => {
        if (!bullet || !bullet.trim()) return;
        const cleanBullet = bullet.replace(/^[-•*]\s*/, '').trim();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(30, 41, 59);
        const bulletLines = doc.splitTextToSize(cleanBullet, usableWidth - 5);
        checkPageOverflow(bulletLines.length * 4);
        doc.text('•', marginX + 1, y);
        doc.text(bulletLines, marginX + 5, y);
        y += bulletLines.length * 3.8 + 0.8;
      });
      y += 1.5;
    });
  }

  // 6. Education
  if (resume.education && resume.education.length > 0) {
    renderSectionHeader('Education');
    resume.education.forEach(edu => {
      checkPageOverflow(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.2);
      doc.setTextColor(15, 23, 42);
      doc.text(edu.degree || 'Degree', marginX, y);

      if (edu.graduationYear) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(71, 85, 105);
        doc.text(edu.graduationYear, marginX + usableWidth, y, { align: 'right' });
      }
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(51, 65, 85);
      let institutionLine = edu.institution || '';
      if (edu.location) institutionLine += `, ${edu.location}`;
      if (edu.score) institutionLine += ` | Score: ${edu.score}`;
      doc.text(institutionLine, marginX, y);
      y += 4.5;
    });
  }

  // 7. Certifications & Achievements
  if (resume.certificationsAndAchievements && resume.certificationsAndAchievements.length > 0) {
    renderSectionHeader('Certifications & Achievements');
    resume.certificationsAndAchievements.forEach(cert => {
      checkPageOverflow(5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(30, 41, 59);
      let certText = cert.title;
      if (cert.issuer) certText += ` - ${cert.issuer}`;
      if (cert.date) certText += ` (${cert.date})`;
      const certLines = doc.splitTextToSize(certText, usableWidth - 5);
      doc.text('•', marginX + 1, y);
      doc.text(certLines, marginX + 5, y);
      y += certLines.length * 3.8 + 0.8;
    });
  }

  doc.save(cleanFilename);
}
