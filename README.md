HireLens
HireLens is an evidence-based AI-assisted resume screening and candidate analysis platform. It helps recruiters evaluate resumes against a job description, compare candidates, view rankings, and inspect the evidence extracted from resumes.

🚀 How to Run the Project
1. Prerequisites
Install the following before running HireLens:
Node.js — preferably Node.js 18 or newer
npm
A modern web browser such as Chrome, Edge, or Firefox
Check your installations:
```bash
node --version
npm --version
```
---
2. Clone the Repository
After pushing this project to GitHub, clone it using:
```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
```
Move into the project folder:
```bash
cd HireLens
```
> Replace `YOUR-USERNAME/YOUR-REPOSITORY` with your actual GitHub repository.
---
3. Install Dependencies
Run:
```bash
npm install
```
This installs both the frontend and backend dependencies defined in `package.json`.
---
▶️ Start HireLens
HireLens uses two processes:
React/Vite frontend
Express backend API
You should run both.
Terminal 1 — Start the Backend
From the project root:
```bash
npm run server
```
The backend will start at:
```text
http://localhost:5000
```
You can verify that it is working by opening:
```text
http://localhost:5000/api/health
```
A successful response looks similar to:
```json
{
  "status": "online",
  "service": "HireLens AI REST API"
}
```
---
Terminal 2 — Start the Frontend
Open another terminal in the project folder and run:
```bash
npm run dev
```
Vite will start the frontend at:
```text
http://localhost:3000
```
Open the displayed address in your browser.
---
🔐 Login
HireLens uses Firebase Authentication.
On the login page:
Open HireLens.
Select the login/sign-in option.
Use the configured Google authentication option.
After successful authentication, you will be taken into the application.
If you fork or substantially redeploy the project under your own Firebase project, update the Firebase configuration in:
```text
src/firebase.js
```
Also make sure Google Sign-In is enabled in your Firebase Authentication settings.
---
📄 How to Analyze One Resume
Use Analyze when you want to evaluate one candidate.
Steps
Open the Analyze page.
Upload the candidate's resume.
Supported resume formats:
PDF
DOCX
Enter or paste the Job Description.
Start the analysis.
Wait for the processing screen to finish.
HireLens generates a candidate analysis.
The result can include:
Candidate name
Email
Phone
LinkedIn
Extracted skills
Experience information
Education information
Matched requirements
Missing requirements
Fit score
Recommendation
Main strengths
Main gaps
Evidence fields
---
📚 How to Analyze Multiple Resumes
Use Bulk Analyze when comparing several candidates for the same role.
Steps
Open Bulk Analyze.
Select multiple resume files.
Enter the job description.
Start the analysis.
Wait for processing to finish.
Open the Rankings page.
HireLens processes the resumes and ranks candidates according to their calculated fit scores.
---
🏆 Candidate Rankings
The Rankings page displays candidates ordered by their fit score.
Use it to:
Identify the strongest candidates
Compare candidate scores
Open individual candidate reports
Review matched and missing requirements
---
👤 Candidate Analysis
Open a candidate from the dashboard or rankings to view their detailed report.
The candidate report provides a more detailed view of:
Overall fit
Skills match
Experience match
Education match
Strengths
Gaps
Matched requirements
Missing requirements
Extracted candidate profile
---
🔎 Evidence Explorer
The Evidence Explorer is used to inspect the information extracted from a candidate's resume.
It helps you understand why a candidate received particular matches or gaps instead of relying only on the final score.
---
👥 Candidate Comparison
The Comparison page can be used to compare candidates side-by-side.
This is useful when several applicants have similar fit scores and you want to inspect their differences before making a decision.
---
🕒 Analysis History
The History page records completed resume evaluations.
It can be used to review previous candidate analyses and their fit scores.
---
⚙️ Backend API
The Express backend runs on:
```text
http://localhost:5000
```
Available endpoints include:
Method	Endpoint	Purpose
GET	`/api/health`	Check backend status
GET	`/api/candidates`	Get all candidates
GET	`/api/candidates/:id`	Get one candidate
GET	`/api/candidates/:id/evidence`	Get candidate evidence
GET	`/api/history`	Get analysis history
POST	`/api/analyze`	Analyze one resume
POST	`/api/analyze/bulk`	Analyze multiple resumes
The frontend communicates with the backend through:
```text
src/services/apiClient.js
```
The current local API base URL is:
```text
http://localhost:5000/api
```
---
📁 Project Structure
```text
HireLens/
│
├── public/
│   ├── favicon.svg
│   └── HireLens_product_demo_teaser_16x9.mp4
│
├── server/
│   ├── data/
│   │   └── store.json
│   │
│   ├── routes/
│   │   └── api.js
│   │
│   ├── services/
│   │   ├── extractor.js
│   │   ├── fieldExtractor.js
│   │   ├── jdAnalyzer.js
│   │   ├── profileConsolidator.js
│   │   ├── segmenter.js
│   │   └── storage.js
│   │
│   └── index.js
│
├── src/
│   ├── components/
│   ├── data/
│   ├── pages/
│   ├── services/
│   │   ├── analysisEngine.js
│   │   └── apiClient.js
│   │
│   ├── App.jsx
│   ├── firebase.js
│   └── main.jsx
│
├── package.json
├── package-lock.json
├── vite.config.js
├── firebase.json
└── README.md
```
---
🧠 How the Analysis Works
At a high level, the analysis pipeline is:
```text
Resume Upload
      ↓
Resume Text Extraction
      ↓
Candidate Information Extraction
      ↓
Job Description Analysis
      ↓
Resume ↔ Job Matching
      ↓
Fit Score & Recommendation
      ↓
Candidate Profile
      ↓
Evidence / Rankings / History
```
For PDF files, HireLens uses `pdf-parse`.
For DOCX files, HireLens uses Mammoth to extract the document text.
---
💾 Data Storage
The backend currently uses a local JSON file:
```text
server/data/store.json
```
Candidate profiles and analysis history are stored there.
Important
If you are deploying HireLens for production or multiple users, replace the JSON storage layer with a proper database such as:
Firebase Firestore
PostgreSQL
MongoDB
MySQL
The current JSON storage is intended mainly for development, demonstrations, and prototype usage.
---
🔄 Backend Fallback
If the frontend cannot reach the Express backend, HireLens has a client-side fallback analysis engine.
This logic is located in:
```text
src/services/analysisEngine.js
```
Therefore, some parts of the application can still operate even if the backend is unavailable.
For the complete resume extraction and persistence workflow, however, running the backend is recommended.
---
📦 Production Build
To create a production frontend build:
```bash
npm run build
```
The generated files will be placed in:
```text
dist/
```
To preview the production build locally:
```bash
npm run preview
```
---
🌐 Firebase Hosting
The project contains a `firebase.json` configuration for Firebase Hosting.
After configuring Firebase CLI and authenticating with your Firebase account, build the application:
```bash
npm run build
```
Then deploy the frontend:
```bash
firebase deploy
```
> The deployed frontend still needs access to the backend API. The current `src/services/apiClient.js` points to `http://localhost:5000/api`, so production deployment requires changing the API URL to your deployed backend URL.
---
⚠️ Important Notes Before Deployment
1. Backend URL
The current frontend API client uses:
```text
http://localhost:5000/api
```
For a deployed application, change this to the URL of your hosted backend.
2. Firebase Configuration
If using your own Firebase project, update:
```text
src/firebase.js
```
with your Firebase Web App configuration.
3. Resume File Size
The backend currently accepts resume uploads up to:
```text
10 MB per file
```
4. Local Storage
Candidate data is stored in:
```text
server/data/store.json
```
Do not treat this JSON file as a production database.
---
🐛 Troubleshooting
Frontend does not start
Try:
```bash
npm install
npm run dev
```
If the port is already in use, stop the existing Vite process and run the command again.
---
Backend does not start
Try:
```bash
npm install
npm run server
```
Then check:
```text
http://localhost:5000/api/health
```
---
Resume analysis fails
Check that:
The backend is running.
The resume is PDF or DOCX.
The file is smaller than 10 MB.
A job description has been entered.
The browser console does not show network errors.
---
Login does not work
Check the Firebase Authentication configuration and ensure Google Sign-In is enabled for the Firebase project being used.
---
👨‍💻 Development Commands
Command	Description
`npm install`	Install dependencies
`npm run dev`	Start frontend development server
`npm run server`	Start Express backend
`npm run build`	Build frontend for production
`npm run preview`	Preview production frontend
---
🤝 Contributing
Contributions are welcome.
Fork the repository.
Create a feature branch.
```bash
git checkout -b feature/your-feature
```
Make your changes.
Test the frontend and backend.
Commit your changes.
```bash
git add .
git commit -m "Add your feature"
```
Push the branch.
```bash
git push origin feature/your-feature
```
Open a Pull Request.
---
📜 License
This project is currently intended for educational, demonstration, and development purposes.
If you plan to distribute or deploy HireLens commercially, add an appropriate open-source or proprietary license to this repository.
---
⭐ HireLens
Evidence-based candidate screening made easier.
If you find this project useful, consider giving the repository a ⭐ on GitHub.
