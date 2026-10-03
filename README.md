# HireLens AI — Evidence-Based AI Candidate Analyzer

HireLens is an intelligent, evidence-grounded resume analysis and candidate screening platform. It eliminates hallucinated screening decisions by strictly pairing extracted applicant data and job requirement evaluations with verbatim evidence quotes from submitted resumes.

---

## 🛠️ Architecture & Core Components

1. **Section Segmentation (`server/services/segmenter.js`)**: Deterministically segments candidate resumes into structured blocks (`CONTACT`, `SUMMARY`, `EDUCATION`, `EXPERIENCE`, `SKILLS`, `CERTIFICATIONS`, `PROJECTS`).
2. **Structured Field Extractor & Evidence Grounding (`server/services/fieldExtractor.js`)**: Extracts key candidate attributes and pairs each attribute with direct resume citations, confidence scores, and audit reasoning trails.
3. **Semantic Job Fit Analyzer (`server/services/jdAnalyzer.js`)**: Performs multi-factor alignment against target Job Descriptions (Skills 40%, Experience 25%, Education 15%, Requirements 20%), categorizing into Strong, Moderate, or Partial matches.
4. **Candidate Identity Consolidator (`server/services/profileConsolidator.js`)**: Deduplicates incoming resumes across multiple submissions, matching contact and experience signals to maintain a unified candidate history.
5. **Database Store (`server/services/storage.js`)**: Persistent data layer maintaining structured candidates and audit logs in `server/data/store.json`.
6. **React Frontend (`src/`)**: Real-time interactive UI with Live Candidate Rankings, Evidence Explorer, Fit Score breakdown, and Bulk Analysis mode.

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Node.js (v18.x or v20.x+)
- npm (v9.x+)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Backend API Server
```bash
npm run server
```
*API will start on `http://localhost:5000` (or `PORT` specified in environment).*

### 3. Run Frontend Development Server
```bash
npm run dev
```
*Vite dev server will start on `http://localhost:5173`.*

### 4. Build for Production
```bash
npm run build
```

### 5. Run Automated Tests
```bash
npm test
```

---

## 🧪 Evaluation & Test Coverage

### Run Automated Unit & Integration Tests:
```bash
npm test
```
The test suite deterministically verifies:
- File extraction (empty buffer errors, plain text extraction, unsupported format handling)
- Resume section segmentation accuracy
- Field extraction & evidence grounding linkage (`FOUND`, `NOT_FOUND`, `AMBIGUOUS`)
- Embedding vector generation & real cosine similarity calculation
- Job description requirement parsing
- Database persistence read/write operations
- Express REST API health, bad input handling, and 404 responses

### Run Benchmark Evaluation System:
```bash
node evaluate.js
```
The evaluation harness runs a labelled dataset of Candidate Resumes vs. Target Job Descriptions and calculates real classification metrics:
- **True Positives (TP)**, **True Negatives (TN)**, **False Positives (FP)**, **False Negatives (FN)**
- **Accuracy**, **Precision**, **Recall**, and **F1 Score**
