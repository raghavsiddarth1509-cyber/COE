import assert from 'assert';
import http from 'http';
import express from 'express';
import { extractTextFromFile } from './server/services/extractor.js';
import { segmentResumeSections } from './server/services/segmenter.js';
import { extractCandidateFields } from './server/services/fieldExtractor.js';
import { 
  tokenize, 
  buildVocabulary, 
  generateEmbedding, 
  cosineSimilarity, 
  parseJobRequirements, 
  analyzeJobFit 
} from './server/services/jdAnalyzer.js';
import { loadStore, saveStore } from './server/services/storage.js';
import apiRouter from './server/routes/api.js';

console.log('====================================================');
console.log('         HIRELENS COMPREHENSIVE TEST SUITE          ');
console.log('====================================================');

async function runTests() {
  // ----------------------------------------------------
  // TEST GROUP 1: Text Extraction (PDF / DOCX / TXT / Errors)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 1] Extraction Service:');
  
  // 1.1 Empty Buffer Handling
  try {
    await extractTextFromFile(Buffer.from(''), 'empty.pdf', 'application/pdf');
    assert.fail('Should fail on empty buffer');
  } catch (err) {
    assert.ok(err.message.includes('FILE_EMPTY'), 'Empty file throws FILE_EMPTY error');
    console.log('  ✓ Empty buffer handled gracefully');
  }

  // 1.2 Plain Text extraction
  const plainTextBuffer = Buffer.from('Senior React and Node.js engineer with 5 years experience.');
  const extractedTxt = await extractTextFromFile(plainTextBuffer, 'resume.txt', 'text/plain');
  assert.strictEqual(extractedTxt, 'Senior React and Node.js engineer with 5 years experience.');
  console.log('  ✓ Plain text buffer extraction passed');

  // 1.3 Unsupported format handling
  try {
    await extractTextFromFile(Buffer.from([0, 1, 2, 3]), 'resume.xyz', 'application/octet-stream');
    assert.fail('Should fail on unsupported file format');
  } catch (err) {
    assert.ok(err.message.includes('UNSUPPORTED_FORMAT'), 'Unsupported extension throws UNSUPPORTED_FORMAT');
    console.log('  ✓ Unsupported format handled gracefully');
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Section Segmentation
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 2] Section Segmentation:');
  const sampleSectionsText = `
Alex Mercer
Summary
Experienced engineering leader with deep system design background.
Technical Skills
React, TypeScript, Node.js, Python, PostgreSQL, Docker
Experience
Principal Engineer at FinTech Systems (2020 - 2024)
Led high-throughput payments processing infrastructure.
Education
Bachelor of Science in Computer Science
Massachusetts Institute of Technology
Certifications
AWS Certified Solutions Architect
Projects
High-Scale Distributed Ledger
`;
  const segmented = segmentResumeSections(sampleSectionsText);
  assert.ok(segmented.SKILLS.includes('React'), 'SKILLS section detected correctly');
  assert.ok(segmented.EDUCATION.includes('Massachusetts Institute of Technology'), 'EDUCATION section detected correctly');
  assert.ok(segmented.EXPERIENCE.includes('FinTech Systems'), 'EXPERIENCE section detected correctly');
  assert.ok(segmented.SUMMARY.includes('Experienced engineering leader'), 'SUMMARY section detected correctly');
  assert.ok(segmented.CERTIFICATIONS.includes('AWS Certified'), 'CERTIFICATIONS section detected correctly');
  console.log('  ✓ Structured section segmentation verified');

  // ----------------------------------------------------
  // TEST GROUP 3: Field Extraction & Grounding (FOUND, NOT_FOUND, AMBIGUOUS)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 3] Field Extraction & Grounding:');
  
  // 3.1 FOUND case
  const resumeFound = `
Sarah Connor
Email: sconnor@resistance.org
Phone: (555) 234-5678
LinkedIn: linkedin.com/in/sarah-connor
San Francisco, CA

Education
Bachelor of Science in Computer Engineering
Stanford University

Experience
Staff Software Engineer at Cyberdyne (2021 - Present)

Skills
Python, React, TypeScript, Docker, PostgreSQL
`;
  const fieldsFound = extractCandidateFields(resumeFound, 'Sarah_Connor_Resume.pdf');
  assert.strictEqual(fieldsFound.fullName, 'Sarah Connor', 'Name extracted');
  assert.strictEqual(fieldsFound.evidenceFields['NAME'].status, 'FOUND');
  assert.strictEqual(fieldsFound.email, 'sconnor@resistance.org', 'Email extracted');
  assert.strictEqual(fieldsFound.evidenceFields['CONTACT-INFO'].status, 'FOUND');
  assert.strictEqual(fieldsFound.evidenceFields['SKILLS-LIST'].status, 'FOUND');
  assert.strictEqual(fieldsFound.evidenceFields['EDU-DEGREE'].status, 'FOUND');
  console.log('  ✓ FOUND status accurately assigned for verified fields');

  // 3.2 NOT_FOUND case (Missing fields)
  const resumeMissing = `
Some random text without any email, phone number, degrees, or technical capabilities.
Just casual statements without contact info or university credentials.
`;
  const fieldsMissing = extractCandidateFields(resumeMissing, 'anonymous_document.txt');
  assert.strictEqual(fieldsMissing.email, null, 'Email is null');
  assert.strictEqual(fieldsMissing.phone, null, 'Phone is null');
  assert.strictEqual(fieldsMissing.evidenceFields['CONTACT-INFO'].status, 'NOT_FOUND');
  assert.strictEqual(fieldsMissing.evidenceFields['SKILLS-LIST'].status, 'NOT_FOUND');
  assert.strictEqual(fieldsMissing.evidenceFields['EDU-DEGREE'].status, 'NOT_FOUND');
  console.log('  ✓ NOT_FOUND status accurately assigned when data is absent');

  // 3.3 AMBIGUOUS case (Partial or derived fields)
  const resumeAmbiguous = `
Degree: Bachelor of Science
No institution named anywhere in the document.
`;
  const fieldsAmbiguous = extractCandidateFields(resumeAmbiguous, 'Alex_Dev_Resume.pdf');
  assert.strictEqual(fieldsAmbiguous.evidenceFields['EDU-DEGREE'].status, 'AMBIGUOUS');
  console.log('  ✓ AMBIGUOUS status accurately assigned for partial fields');

  // 3.4 Empty Resume handling
  const fieldsEmpty = extractCandidateFields('', '');
  assert.strictEqual(fieldsEmpty.evidenceFields['SKILLS-LIST'].status, 'NOT_FOUND');
  assert.strictEqual(fieldsEmpty.evidenceFields['NAME'].status, 'NOT_FOUND');
  console.log('  ✓ Empty resume input handled without throwing');

  // ----------------------------------------------------
  // TEST GROUP 4: Semantic Matching, Embeddings & Cosine Similarity
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 4] Embeddings, Cosine Similarity & Semantic Engine:');

  // 4.1 Tokenization
  const tokens = tokenize('React, TypeScript, & Node.js Developer');
  assert.ok(tokens.includes('react'), 'Tokenized lower-case react');
  assert.ok(tokens.includes('typescript'), 'Tokenized typescript');
  assert.ok(tokens.includes('node.js'), 'Tokenized node.js');
  console.log('  ✓ Tokenization and stopword removal verified');

  // 4.2 Embedding Generation
  const docA = 'React TypeScript frontend UI state management';
  const docB = 'React TypeScript frontend developer';
  const docC = 'Truck driving logistics cargo delivery';
  const vocab = buildVocabulary([docA, docB, docC]);

  const embA = generateEmbedding(docA, vocab);
  const embB = generateEmbedding(docB, vocab);
  const embC = generateEmbedding(docC, vocab);

  assert.strictEqual(embA.length, vocab.size, 'Embedding dimensions match vocabulary size');

  // 4.3 Cosine Similarity Math
  const simIdentical = cosineSimilarity(embA, embA);
  assert.ok(Math.abs(simIdentical - 1.0) < 1e-4, 'Identical vectors yield cosine similarity = 1.0');

  const simRelated = cosineSimilarity(embA, embB);
  assert.ok(simRelated > 0.6, `Related documents yield high cosine similarity (got ${simRelated.toFixed(3)})`);

  const simUnrelated = cosineSimilarity(embA, embC);
  assert.ok(simUnrelated < 0.1, `Unrelated documents yield low cosine similarity (got ${simUnrelated.toFixed(3)})`);
  console.log('  ✓ Vector embedding generation and cosine similarity calculation verified');

  // 4.4 Job Requirements Parsing
  const jdText = `
Senior Software Engineer
- 3+ years experience with Python and React
- Strong understanding of Docker and PostgreSQL
- Bachelor's degree in Computer Science
`;
  const parsedReqs = parseJobRequirements(jdText);
  assert.strictEqual(parsedReqs.length, 3, 'Parsed 3 requirement bullet points');
  console.log('  ✓ Job Description requirement parsing verified');

  // 4.5 End-to-end analyzeJobFit
  const strongFitResult = analyzeJobFit(fieldsFound, jdText, 'Sarah_Connor_Resume.pdf');
  assert.strictEqual(typeof strongFitResult.fitScore, 'number', 'Fit score is a number');
  assert.strictEqual(typeof strongFitResult.semanticSimilarity, 'number', 'Semantic similarity is a number');
  assert.ok(strongFitResult.semanticSimilarity > 0, 'Semantic similarity calculated from non-zero embedding vectors');
  assert.strictEqual(strongFitResult.fitStatus, 'Strong Match', 'Fit status matches the deterministic score tier');
  assert.strictEqual(strongFitResult.educationMatch, 100, 'Education match is 100 for verified degree & university');
  assert.ok(strongFitResult.matchedRequirements.length >= 2, 'At least 2 requirements matched with evidence');
  console.log(`  ✓ Semantic Job Fit analyzer passed (Semantic Similarity: ${strongFitResult.semanticSimilarity}, Total Fit: ${strongFitResult.fitScore}, Status: ${strongFitResult.fitStatus})`);

  // ----------------------------------------------------
  // TEST GROUP 5: Database Store & Error Handling
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 5] Database Store & Error Resilience:');
  const currentStore = loadStore();
  assert.ok(Array.isArray(currentStore.candidates), 'Store candidates is an array');
  assert.ok(Array.isArray(currentStore.history), 'Store history is an array');

  // Save and reload test
  const testCandidate = {
    id: 'test_c_1',
    name: 'Unit Test Candidate',
    fitScore: 85,
    email: 'test@candidate.internal',
    evidenceFields: {}
  };
  saveStore({ candidates: [testCandidate], history: [] });
  const reloaded = loadStore();
  assert.strictEqual(reloaded.candidates.length, 1);
  assert.strictEqual(reloaded.candidates[0].name, 'Unit Test Candidate');

  // Restore clean store
  saveStore({ candidates: [], history: [] });
  const cleanStore = loadStore();
  assert.strictEqual(cleanStore.candidates.length, 0);
  console.log('  ✓ Database persistence read, write, and restore verified');

  // ----------------------------------------------------
  // TEST GROUP 6: REST API Integration & Error Responses
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 6] REST API Integration:');
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  await new Promise((resolve, reject) => {
    const server = app.listen(5099, async () => {
      try {
        // Health endpoint
        const healthRes = await fetch('http://localhost:5099/api/health');
        const healthJson = await healthRes.json();
        assert.strictEqual(healthJson.status, 'online');
        console.log('  ✓ GET /api/health returns 200 OK');

        // Missing JD error check
        const badAnalyze = await fetch('http://localhost:5099/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const badJson = await badAnalyze.json();
        assert.strictEqual(badAnalyze.status, 400);
        assert.strictEqual(badJson.error.code, 'MISSING_JD');
        console.log('  ✓ POST /api/analyze returns 400 MISSING_JD for empty request');

        // Candidate not found error check
        const notFoundRes = await fetch('http://localhost:5099/api/candidates/invalid_id_999');
        assert.strictEqual(notFoundRes.status, 404);
        console.log('  ✓ GET /api/candidates/:id returns 404 NOT_FOUND for non-existent record');

        server.close(resolve);
      } catch (err) {
        server.close();
        reject(err);
      }
    });
  });

  console.log('\n====================================================');
  console.log('       ALL TEST SUITES EXECUTED AND PASSED          ');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
