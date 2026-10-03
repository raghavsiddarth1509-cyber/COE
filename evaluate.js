import { extractCandidateFields } from './server/services/fieldExtractor.js';
import { analyzeJobFit } from './server/services/jdAnalyzer.js';

/**
 * HireLens Model Evaluation Dataset & Performance Metrics Runner
 *
 * This dataset consists of labelled Ground Truth pairs:
 * - Match = 1 (Relevant candidate for Job Description)
 * - Match = 0 (Irrelevant / Mismatched candidate for Job Description)
 *
 * It evaluates actual system classification:
 * - True Positives (TP)
 * - True Negatives (TN)
 * - False Positives (FP)
 * - False Negatives (FN)
 * - Accuracy, Precision, Recall, F1 Score
 */

const EVALUATION_DATASET = [
  // 1. Full-Stack / Backend Engineer Match (Positive)
  {
    id: 'eval-pos-1',
    label: 1, // TRUE MATCH
    resumeName: 'backend_lead.txt',
    resumeText: `
David Miller
Email: dmiller@eng.io
Phone: 415-555-0192
San Francisco, CA

Experience
Senior Backend Engineer at CloudMatrix (2020 - 2024)
Designed microservices in Go, Python, and Node.js. Optimized PostgreSQL queries and deployed on AWS with Docker.

Education
Master of Science in Computer Science
Georgia Institute of Technology

Skills
Python, Node.js, Go, PostgreSQL, AWS, Docker, REST API, Git
`,
    jobDescription: `
Senior Backend Engineer
- 4+ years experience with Python or Node.js
- Production experience with PostgreSQL and relational data modeling
- Hands-on experience with Docker and AWS
- Bachelor's or Master's degree in CS or equivalent
`
  },

  // 2. Frontend React Engineer Match (Positive)
  {
    id: 'eval-pos-2',
    label: 1, // TRUE MATCH
    resumeName: 'frontend_specialist.txt',
    resumeText: `
Elena Rostova
Email: elena.rostova@designcode.dev
Phone: 206-555-8832

Experience
Frontend Engineer at WebScale UI (2021 - Present)
Built customer-facing interfaces with React, TypeScript, Tailwind CSS, and Next.js.
Integrated REST APIs and GraphQL endpoints.

Education
Bachelor of Science in Software Engineering
University of Washington

Skills
React, TypeScript, JavaScript, CSS, HTML, REST API, Git
`,
    jobDescription: `
Frontend Engineer
- Strong proficiency in React and TypeScript
- Experience building responsive web applications
- Experience integrating with REST APIs
- Degree in Software Engineering or related field
`
  },

  // 3. DevOps / Cloud Specialist Match (Positive)
  {
    id: 'eval-pos-3',
    label: 1, // TRUE MATCH
    resumeName: 'devops_eng.txt',
    resumeText: `
Marcus Vance
Email: mvance@cloudops.net
Phone: 512-555-9011

Experience
DevOps & Infrastructure Engineer at InfraSys (2019 - Present)
Maintained Kubernetes clusters, automated CI/CD pipelines, managed AWS and GCP infrastructure.

Education
Bachelor of Science in Information Technology
Purdue University

Skills
AWS, GCP, Docker, Kubernetes, CI/CD, Linux, Python
`,
    jobDescription: `
Cloud & DevOps Engineer
- Experience managing AWS and Kubernetes
- Proficiency with Docker containerization and CI/CD pipelines
- Linux administration and automation using Python
`
  },

  // 4. Chef / Culinary Profile (Negative for Senior Software Engineer)
  {
    id: 'eval-neg-1',
    label: 0, // TRUE NON-MATCH
    resumeName: 'executive_chef.txt',
    resumeText: `
Chef Antoine Dupont
Email: chef.antoine@bistrogourmet.com
Phone: 212-555-4921
New York, NY

Experience
Executive Chef at Le Grand Bistro (2018 - Present)
Managed kitchen brigade of 15 cooks. Created seasonal tasting menus, oversaw inventory, and ensured food safety standards.

Education
Culinary Arts Diploma
French Culinary Institute

Skills
Menu Development, Pastry, French Cuisine, Food Safety, Inventory Management
`,
    jobDescription: `
Senior Software Engineer
- 4+ years of backend programming in Python, Java, or Node.js
- Relational databases (PostgreSQL / MySQL)
- Docker containerization and AWS deployment
- Bachelor's degree in Computer Science
`
  },

  // 5. Accountant / Auditor (Negative for Machine Learning Engineer)
  {
    id: 'eval-neg-2',
    label: 0, // TRUE NON-MATCH
    resumeName: 'senior_accountant.txt',
    resumeText: `
Patricia Higgins, CPA
Email: patricia.cpa@ledgerbooks.com
Phone: 312-555-7788

Experience
Senior Auditor at KPMG (2019 - 2024)
Conducted financial audits, tax reconciliation, GAAP compliance, and corporate financial statements.

Education
Bachelor of Business Administration in Accounting
University of Illinois

Skills
GAAP, Tax Accounting, Financial Audit, Excel, QuickBooks
`,
    jobDescription: `
Senior Machine Learning Engineer
- Deep learning architectures (PyTorch / TensorFlow)
- Distributed model training on GPU clusters
- Python, Docker, and ML pipeline automation
- Degree in Computer Science, Statistics, or Math
`
  },

  // 6. Real Estate Broker (Negative for Mobile Developer)
  {
    id: 'eval-neg-3',
    label: 0, // TRUE NON-MATCH
    resumeName: 'real_estate_broker.txt',
    resumeText: `
Robert Sterling
Email: rsterling@primeproperties.com
Phone: 305-555-3211
Miami, FL

Experience
Licensed Real Estate Broker at Prime Realty (2017 - Present)
Closed over $40M in residential luxury transactions. Marketed premier listings and negotiated buyer contracts.

Education
Bachelor of Arts in Communications
Florida State University

Skills
Contract Negotiation, Luxury Sales, Property Appraisal, Client Relations
`,
    jobDescription: `
Senior Mobile Engineer (iOS / Android)
- 4+ years building native mobile applications using Swift or Kotlin
- Experience with mobile architecture patterns (MVVM / Clean)
- REST API integration and automated UI testing
`
  }
];

function runEvaluation() {
  console.log('====================================================');
  console.log('      HIRELENS MODEL EVALUATION BENCHMARK           ');
  console.log('====================================================\n');

  let TP = 0;
  let TN = 0;
  let FP = 0;
  let FN = 0;

  const resultsTable = [];

  // Decision Threshold: Fit Score >= 60 is classified as Match (1), else Non-Match (0)
  const THRESHOLD = 60;

  for (const item of EVALUATION_DATASET) {
    const fields = extractCandidateFields(item.resumeText, item.resumeName);
    const fit = analyzeJobFit(fields, item.jobDescription, item.resumeName);

    const predicted = fit.fitScore >= THRESHOLD ? 1 : 0;
    const actual = item.label;

    if (actual === 1 && predicted === 1) TP++;
    else if (actual === 0 && predicted === 0) TN++;
    else if (actual === 0 && predicted === 1) FP++;
    else if (actual === 1 && predicted === 0) FN++;

    resultsTable.push({
      Resume: item.resumeName,
      GroundTruth: actual === 1 ? 'MATCH' : 'NON-MATCH',
      SemanticSim: fit.semanticSimilarity,
      FitScore: fit.fitScore,
      Prediction: predicted === 1 ? 'MATCH' : 'NON-MATCH',
      Correct: actual === predicted ? '✓' : '✗'
    });
  }

  console.table(resultsTable);

  const total = EVALUATION_DATASET.length;
  const accuracy = (TP + TN) / total;
  const precision = (TP + FP) > 0 ? TP / (TP + FP) : 0;
  const recall = (TP + FN) > 0 ? TP / (TP + FN) : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  console.log('\n---------------- METRICS SUMMARY ----------------');
  console.log(`True Positives  (TP) : ${TP}`);
  console.log(`True Negatives  (TN) : ${TN}`);
  console.log(`False Positives (FP) : ${FP}`);
  console.log(`False Negatives (FN) : ${FN}`);
  console.log(`Accuracy             : ${(accuracy * 100).toFixed(1)}%`);
  console.log(`Precision            : ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall               : ${(recall * 100).toFixed(1)}%`);
  console.log(`F1 Score             : ${(f1 * 100).toFixed(1)}%`);
  console.log('--------------------------------------------------\n');
}

runEvaluation();
