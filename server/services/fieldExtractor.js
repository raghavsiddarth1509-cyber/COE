import { segmentResumeSections } from './segmenter.js';

/**
 * Structured Field Extractor & Evidence Grounding Service:
 * Extracts candidate fields and binds exact source evidence quotes to each field.
 * Never infers missing facts or injects mock data.
 * Sets status strictly to FOUND, NOT_FOUND, or AMBIGUOUS.
 */
export function extractCandidateFields(rawText, fileName) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      fullName: 'Unknown Candidate',
      email: null,
      phone: null,
      linkedin: null,
      location: null,
      extractedProfile: {
        fullName: 'Unknown Candidate',
        email: null,
        phone: null,
        linkedin: null,
        location: null,
        education: null,
        latestExperience: null,
        skills: []
      },
      evidenceFields: {
        'NAME': {
          fieldId: 'NAME',
          category: 'Identity',
          status: 'NOT_FOUND',
          extractedValue: null,
          sourceSection: 'Document Body',
          evidenceText: 'Empty or invalid resume text provided.',
          confidence: 0,
          reasoningLog: [{ type: 'error', title: 'Input Error', detail: 'Empty document text.' }]
        },
        'SKILLS-LIST': {
          fieldId: 'SKILLS-LIST',
          category: 'Skills',
          status: 'NOT_FOUND',
          extractedValue: null,
          sourceSection: 'Skills',
          evidenceText: 'No skills could be identified in empty input.',
          confidence: 0,
          reasoningLog: [{ type: 'error', title: 'Extraction Error', detail: 'Document contains no content.' }]
        },
        'EDU-DEGREE': {
          fieldId: 'EDU-DEGREE',
          category: 'Education',
          status: 'NOT_FOUND',
          extractedValue: null,
          sourceSection: 'Education',
          evidenceText: 'No education evidence found.',
          confidence: 0,
          reasoningLog: [{ type: 'error', title: 'Extraction Error', detail: 'Document contains no content.' }]
        },
        'CONTACT-INFO': {
          fieldId: 'CONTACT-INFO',
          category: 'Contact Info',
          status: 'NOT_FOUND',
          extractedValue: null,
          sourceSection: 'Contact Information',
          evidenceText: 'No contact information found.',
          confidence: 0,
          reasoningLog: [{ type: 'error', title: 'Extraction Error', detail: 'Document contains no content.' }]
        }
      },
      rawText: rawText || ''
    };
  }

  const sections = segmentResumeSections(rawText);
  const textLower = rawText.toLowerCase();

  // 1. Name Extraction
  // Prefer explicit name from contact or first non-empty line
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let fullName = null;
  let nameStatus = 'NOT_FOUND';
  let nameEvidence = 'Name was not explicitly declared in resume text.';

  for (const line of lines.slice(0, 5)) {
    // Check if line looks like a name (2-4 words, alphabetic, no symbols/colons)
    if (/^[A-Z][a-zA-Z'.]+(\s+[A-Z][a-zA-Z'.]+){1,3}$/.test(line) && !/resume|curriculum|vitae|profile|summary|contact|email|phone/i.test(line)) {
      fullName = line;
      nameStatus = 'FOUND';
      nameEvidence = `Identified name header: "${line}"`;
      break;
    }
  }

  if (!fullName) {
    // Derive from file name if cleanly formatted
    const cleanFileName = (fileName || '').replace(/\.[^/.]+$/, '').trim();
    if (cleanFileName && !/resume|cv|document|upload|file/i.test(cleanFileName)) {
      const parts = cleanFileName.split(/[_-\s]+/).filter(Boolean);
      if (parts.length >= 2 && parts.length <= 4) {
        fullName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        nameStatus = 'AMBIGUOUS';
        nameEvidence = `Derived candidate name from filename "${fileName}" (not explicitly verified in body text).`;
      }
    }
  }

  if (!fullName) {
    fullName = 'Unknown Candidate';
    nameStatus = 'NOT_FOUND';
  }

  // 2. Email Extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = rawText.match(emailRegex);
  const email = emails ? emails[0] : null;
  const emailStatus = email ? 'FOUND' : 'NOT_FOUND';
  const emailEvidence = email
    ? `Extracted email address: "${email}"`
    : 'No valid email address format found in resume text.';

  // 3. Phone Extraction
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  const phones = rawText.match(phoneRegex);
  const phone = phones ? phones[0] : null;
  const phoneStatus = phone ? 'FOUND' : 'NOT_FOUND';
  const phoneEvidence = phone
    ? `Extracted phone number: "${phone}"`
    : 'No phone number format detected in resume text.';

  // 4. LinkedIn Extraction
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
  const linkedinMatch = rawText.match(linkedinRegex);
  const linkedin = linkedinMatch ? linkedinMatch[0] : null;
  const linkedinStatus = linkedin ? 'FOUND' : 'NOT_FOUND';
  const linkedinEvidence = linkedin
    ? `Extracted LinkedIn profile URL: "${linkedin}"`
    : 'No LinkedIn profile URL found in resume text.';

  // 5. Location Extraction
  let location = null;
  let locationStatus = 'NOT_FOUND';
  let locationEvidence = 'No clear location or city/state pattern identified in resume text.';
  const locRegex = /([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})\b/;
  const locMatch = rawText.match(locRegex);
  if (locMatch) {
    location = `${locMatch[1].trim()}, ${locMatch[2].trim()}`;
    locationStatus = 'FOUND';
    locationEvidence = `Extracted location: "${location}"`;
  }

  // 6. Skills Extraction
  const technicalGlossary = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    'React', 'Node.js', 'Express', 'Vue', 'Angular', 'Next.js', 'Redux', 'HTML', 'CSS', 'Tailwind',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Linux'
  ];

  const extractedSkills = [];
  technicalGlossary.forEach(tech => {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(rawText)) {
      extractedSkills.push(tech);
    }
  });

  const skillsStatus = extractedSkills.length > 0 ? 'FOUND' : 'NOT_FOUND';
  const skillsEvidenceText = extractedSkills.length > 0
    ? (sections.SKILLS
        ? `Technical Skills declared in section: ${sections.SKILLS}`
        : `Identified skills throughout text: ${extractedSkills.join(', ')}`)
    : 'No standard technical skills detected in the document.';

  // 7. Education Extraction
  let degree = null;
  let institution = null;
  let educationStatus = 'NOT_FOUND';
  let educationEvidence = 'No degree or accredited academic institution found in resume text.';

  const degreeRegex = /\b(bachelor(?:'s)?(?:\s+of\s+[a-zA-Z]+)?|master(?:'s)?(?:\s+of\s+[a-zA-Z]+)?|phd|doctorate|b\.s\.|m\.s\.|b\.a\.|m\.a\.|b\.tech|m\.tech)\b[^,\n.]*/i;
  const degreeMatch = (sections.EDUCATION || rawText).match(degreeRegex);
  if (degreeMatch) {
    degree = degreeMatch[0].trim();
  }

  const institutionRegex = /\b([a-zA-Z\s]+(?:university|college|institute|polytechnic)|(?:university|college|institute|polytechnic)\s+of\s+[a-zA-Z\s]+)\b/i;
  const targetEduText = sections.EDUCATION ? sections.EDUCATION : rawText;
  // If no EDUCATION section, only match institution if degree was also found or in EDUCATION section
  const instMatch = targetEduText.match(institutionRegex);
  if (instMatch && (sections.EDUCATION || degree)) {
    institution = instMatch[0].trim();
  }

  if (degree && institution) {
    educationStatus = 'FOUND';
    educationEvidence = `Verified Degree & Institution: "${degree}" at "${institution}"`;
  } else if (degree || institution) {
    educationStatus = 'AMBIGUOUS';
    educationEvidence = `Partial education record identified: ${degree || institution} (institution or degree title missing).`;
  }

  const educationSummary = educationStatus !== 'NOT_FOUND'
    ? `${degree || 'Degree unspecified'}${institution ? ' — ' + institution : ''}`
    : null;

  // 8. Experience Extraction
  let latestExperience = null;
  let experienceStatus = 'NOT_FOUND';
  let experienceEvidence = 'No clear professional work history found.';

  if (sections.EXPERIENCE && sections.EXPERIENCE.trim()) {
    const expLines = sections.EXPERIENCE.split('\n').filter(Boolean);
    if (expLines.length > 0) {
      latestExperience = expLines[0];
      experienceStatus = 'FOUND';
      experienceEvidence = `Latest role excerpt: "${latestExperience}"`;
    }
  }

  // Build Structured Field Models & Evidence Dictionary
  const extractedProfile = {
    fullName,
    email,
    phone,
    linkedin,
    location,
    education: educationSummary,
    latestExperience,
    skills: extractedSkills.map(sk => ({ name: sk, verified: true }))
  };

  const evidenceFields = {
    'NAME': {
      fieldId: 'NAME',
      category: 'Identity',
      status: nameStatus,
      extractedValue: fullName !== 'Unknown Candidate' ? fullName : null,
      sourceSection: 'Document Header',
      evidenceText: nameEvidence,
      confidence: nameStatus === 'FOUND' ? 95 : nameStatus === 'AMBIGUOUS' ? 60 : 0,
      reasoningLog: [
        { type: nameStatus === 'FOUND' ? 'success' : 'info', title: 'Name Grounding', detail: nameEvidence }
      ]
    },
    'SKILLS-LIST': {
      fieldId: 'SKILLS-LIST',
      category: 'Skills',
      status: skillsStatus,
      extractedValue: extractedSkills.length > 0 ? extractedSkills.join(', ') : null,
      sourceSection: sections.SKILLS ? 'Technical Skills' : 'Extracted Body Text',
      evidenceText: skillsEvidenceText,
      confidence: skillsStatus === 'FOUND' ? 95 : 0,
      reasoningLog: [
        { type: skillsStatus === 'FOUND' ? 'success' : 'warning', title: 'Skills Extraction', detail: skillsEvidenceText }
      ]
    },
    'EDU-DEGREE': {
      fieldId: 'EDU-DEGREE',
      category: 'Education',
      status: educationStatus,
      extractedValue: educationSummary,
      sourceSection: sections.EDUCATION ? 'Education' : 'Document Body',
      evidenceText: educationEvidence,
      confidence: educationStatus === 'FOUND' ? 95 : educationStatus === 'AMBIGUOUS' ? 60 : 0,
      reasoningLog: [
        { type: educationStatus === 'FOUND' ? 'success' : 'info', title: 'Education Verification', detail: educationEvidence }
      ]
    },
    'CONTACT-INFO': {
      fieldId: 'CONTACT-INFO',
      category: 'Contact Info',
      status: (emailStatus === 'FOUND' || phoneStatus === 'FOUND') ? 'FOUND' : 'NOT_FOUND',
      extractedValue: [email, phone, linkedin].filter(Boolean).join(' | ') || null,
      sourceSection: 'Contact Information',
      evidenceText: [emailEvidence, phoneEvidence, linkedinEvidence].join(' | '),
      confidence: (emailStatus === 'FOUND' && phoneStatus === 'FOUND') ? 98 : emailStatus === 'FOUND' ? 85 : 0,
      reasoningLog: [
        { type: 'info', title: 'Contact Verification', detail: 'Parsed contact coordinates directly from document.' }
      ]
    }
  };

  return {
    fullName,
    email,
    phone,
    linkedin,
    location,
    extractedProfile,
    evidenceFields,
    rawText
  };
}
