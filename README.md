# ميزان الشعر — Mizane Shiir
### Arabic Poetry Analyzer

A full-stack web application that analyzes Arabic poetry — detecting meter (بحر), rhyme (قافية), style figures (أساليب بلاغية), era, and themes using machine learning models.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Auth | BetterAuth |
| Database | NeonDB (Postgres) + Drizzle ORM |
| Backend | FastAPI (Python) |
| ML | TensorFlow, Keras, PyTorch, Transformers (HuggingFace) |

---

## Project Structure

```
mizane-shiir/
├── frontend/         # Next.js app
│   ├── src/
│   ├── lib/          # Auth and DB helpers
│   ├── drizzle/      # DB migrations and schema
│   └── ...
├── backend/          # FastAPI app
│   ├── app/
│   │   ├── services/ # ML analysis services
│   │   └── ...
│   └── requirements.txt
├── models/           # ⚠️ Not included in repo (see below)
└── .gitignore
```

---

## ⚠️ Models Folder

The `models/` folder contains large ML model files (`.h5`, `.pkl`, `.keras`, etc.) and is **not included in this repository** due to file size (~924MB).

> 📦 Download link will be added here once hosted (Google Drive / HuggingFace / OneDrive)

After downloading, place the folder at the root of the project:
```
mizane-shiir/
└── models/     ← place it here
```

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/mizane-shiir.git
cd mizane-shiir
```

### 2. Backend setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

### 4. Environment variables

Create a `.env.local` file inside the `frontend/` folder:
```env
# NeonDB
DATABASE_URL=your_neon_connection_string

# BetterAuth
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000

# Backend
BACKEND_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_URL=http://localhost:3000

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### 5. Run the app

**Backend:**
```bash
cd backend
venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Notes

- The `models/` folder must be downloaded separately and placed at the project root
- Never commit `.env.local`, `venv/`, `node_modules/`, or `models/` to Git
- Python 3.10+ recommended
