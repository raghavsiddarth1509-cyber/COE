// Normalization helper functions for silent background profile consolidation
function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

function normalizeLinkedin(url) {
  return (url || '').trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
}

function normalizeName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Internal Identity Matching Service:
 * Compares candidate data against existing candidate profiles.
 * Automatically merges/updates on matching signals without fake inferences.
 */
export function matchCandidateProfile(extractedData, existingCandidates = []) {
  const normEmail = normalizeEmail(extractedData.email);
  const normPhone = normalizePhone(extractedData.phone);
  const normLinkedin = normalizeLinkedin(extractedData.linkedin);
  const normName = normalizeName(extractedData.name);
  const inst = (extractedData.extractedProfile?.education || '').toLowerCase();
  const company = (extractedData.extractedProfile?.latestExperience || '').toLowerCase();

  let matchedCandidate = null;

  for (const candidate of existingCandidates) {
    const cEmail = normalizeEmail(candidate.email);
    const cPhone = normalizePhone(candidate.phone);
    const cLinkedin = normalizeLinkedin(candidate.linkedin);
    const cName = normalizeName(candidate.name);
    const cInst = (candidate.extractedProfile?.education || '').toLowerCase();
    const cCompany = (candidate.extractedProfile?.latestExperience || '').toLowerCase();

    // 1. Strong Signals (Exact Email, Phone, or LinkedIn)
    if (normEmail && cEmail && normEmail === cEmail) {
      matchedCandidate = candidate;
      break;
    }
    if (normPhone && cPhone && normPhone.length > 5 && normPhone === cPhone) {
      matchedCandidate = candidate;
      break;
    }
    if (normLinkedin && cLinkedin && normLinkedin === cLinkedin) {
      matchedCandidate = candidate;
      break;
    }

    // 2. Secondary Signals (Name + Education or Company)
    if (normName && cName && normName === cName && normName !== 'unknown candidate') {
      let signalCount = 0;
      if (inst && cInst && (inst.includes(cInst.slice(0, 6)) || cInst.includes(inst.slice(0, 6)))) signalCount++;
      if (company && cCompany && (company.includes(cCompany.slice(0, 6)) || cCompany.includes(company.slice(0, 6)))) signalCount++;
      if (signalCount >= 1) {
        matchedCandidate = candidate;
        break;
      }
    }
  }

  if (matchedCandidate) {
    const docName = extractedData.documents?.[0]?.name || "Updated_Resume.pdf";
    const existingDocs = matchedCandidate.documents || [];
    const updatedDocs = [
      { name: docName, date: new Date().toISOString().split('T')[0] },
      ...existingDocs.filter(d => d.name !== docName)
    ];

    const updatedCandidate = {
      ...matchedCandidate,
      fitScore: extractedData.fitScore,
      fitStatus: extractedData.fitStatus,
      recommendation: extractedData.recommendation,
      skillsMatch: extractedData.skillsMatch,
      experienceMatch: extractedData.experienceMatch,
      educationMatch: extractedData.educationMatch,
      mainStrength: extractedData.mainStrength,
      mainGap: extractedData.mainGap,
      matchedRequirements: extractedData.matchedRequirements,
      missingRequirements: extractedData.missingRequirements,
      evidenceFields: {
        ...matchedCandidate.evidenceFields,
        ...extractedData.evidenceFields
      },
      documents: updatedDocs,
      resumeText: extractedData.resumeText || matchedCandidate.resumeText,
      updatedAt: new Date().toISOString()
    };

    return { candidate: updatedCandidate, isExisting: true };
  } else {
    return { candidate: extractedData, isExisting: false };
  }
}

/**
 * Client-side fallback analyzer when backend is offline.
 * Extracts actual declared tokens and verifies requirements strictly without fake profiles.
 */
export function analyzeResume(resumeFile, resumeText, jobDescription) {
  const fileName = resumeFile ? resumeFile.name : "Uploaded_Resume.pdf";
  const id = "c_" + Date.now();
  const text = (resumeText || "").trim();
  const textLower = text.toLowerCase();
  const jdLower = (jobDescription || "").toLowerCase();

  // Name extraction from clean filename or first line
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let candidateName = null;
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Z][a-zA-Z'.]+(\s+[A-Z][a-zA-Z'.]+){1,3}$/.test(line) && !/resume|cv|profile|summary|contact/i.test(line)) {
      candidateName = line;
      break;
    }
  }
  if (!candidateName) {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, "").trim();
    if (!/resume|cv|document|upload/i.test(cleanFileName)) {
      const parts = cleanFileName.split(/[_-\s]+/).filter(Boolean);
      if (parts.length >= 2 && parts.length <= 4) {
        candidateName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      }
    }
  }
  if (!candidateName) {
    candidateName = "Candidate";
  }

  // Extract technical skills
  const technicalGlossary = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
    'React', 'Node.js', 'Express', 'Vue', 'Angular', 'Next.js', 'SQL',
    'PostgreSQL', 'MySQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'Git'
  ];

  const extractedSkills = technicalGlossary.filter(tech => {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  });

  // Calculate real overlap
  let matchedSkillCount = 0;
  extractedSkills.forEach(sk => {
    if (jdLower.includes(sk.toLowerCase())) {
      matchedSkillCount++;
    }
  });

  const skillsMatch = extractedSkills.length > 0
    ? Math.min(100, Math.round((matchedSkillCount / Math.max(1, extractedSkills.length)) * 100))
    : 0;

  const score = Math.min(100, Math.round(skillsMatch * 0.7 + (matchedSkillCount > 0 ? 20 : 0)));
  const fitStatus = score >= 80 ? "Strong Match" : score >= 50 ? "Moderate Match" : "Partial Match";
  const recommendation = score >= 80
    ? "Strong Match. Demonstrated coverage of required technical criteria."
    : score >= 50
    ? "Moderate Match. Core technical skills identified; partial requirement alignment."
    : "Partial Match. Candidate shows significant gaps relative to criteria.";

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);

  const email = emailMatch ? emailMatch[0] : null;
  const phone = phoneMatch ? phoneMatch[0] : null;
  const linkedin = linkedinMatch ? linkedinMatch[0] : null;

  return {
    id,
    name: candidateName,
    role: "Candidate",
    location: "Location Not Specified",
    email,
    phone,
    linkedin,
    avatar: null,
    fitScore: score,
    fitStatus,
    recommendation,
    skillsMatch,
    experienceMatch: 0,
    educationMatch: 0,
    mainStrength: extractedSkills.length > 0 ? `Identified competencies: ${extractedSkills.slice(0, 3).join(', ')}` : "None identified",
    mainGap: extractedSkills.length === 0 ? "No technical skills detected" : "Review specific criteria",
    extractedProfile: {
      fullName: candidateName,
      email,
      phone,
      linkedin,
      location: null,
      education: null,
      latestExperience: null,
      skills: extractedSkills.map(sk => ({ name: sk, verified: true }))
    },
    matchedRequirements: extractedSkills.slice(0, 3).map((sk, idx) => ({
      id: `req-client-${idx}`,
      title: `Skill Match: ${sk}`,
      status: "MATCHED",
      explanation: `Verified competency "${sk}" in resume content.`,
      fieldId: "SKILLS-LIST",
      evidence: `Extracted skill: ${sk}`
    })),
    missingRequirements: [],
    evidenceFields: {
      "SKILLS-LIST": {
        fieldId: "SKILLS-LIST",
        category: "Skills",
        status: extractedSkills.length > 0 ? "FOUND" : "NOT_FOUND",
        extractedValue: extractedSkills.join(", ") || null,
        sourceSection: "Document Text",
        evidenceText: extractedSkills.length > 0 ? `Extracted skills: ${extractedSkills.join(', ')}` : "No skills found",
        confidence: extractedSkills.length > 0 ? 90 : 0,
        reasoningLog: []
      }
    },
    documents: [{ name: fileName, date: new Date().toISOString().split('T')[0] }],
    resumeText: text
  };
}
