# Plumb — AI Resume Analyzer | PRD

## Original Problem Statement
"Give 3d animation site for my project and my project is ai resume analyzer and i want tech theme"
User choices: landing page + working resume upload with AI analysis, dark theme (agent's choice), login system included.

## Architecture
- Frontend: React 19 + Tailwind + Framer Motion + Lenis + React Three Fiber (3D hero) — /app/frontend
- Backend: FastAPI + MongoDB (motor) — /app/backend/server.py
- AI: Plumb analysis engine with optional external provider integration
- Auth: custom JWT (httpOnly cookies, bcrypt, brute-force lockout, refresh tokens)
- Design spec: /app/design_guidelines.json (Bold Dark Cyber-Tech, cyan #00F3FF / emerald #00FF9D / violet #8B5CF6)

## User Personas
- Job seeker (candidate): uploads/pastes resume, gets ATS score + fixes
- Evaluator/recruiter demo: uses demo account to test the product fast

## Core Requirements (static)
1. 3D animated dark tech-themed landing page
2. Login/register system
3. Resume upload (PDF/DOCX/TXT) or paste → Plumb analysis
4. Results: overall score, sub-scores, skills matrix, strengths/weaknesses, bullet rewrites
5. Analysis history per user

## Implemented (2026-09-05)
- Landing: kinetic masked-line hero reveal, R3F wireframe icosahedron + particle field + scan ring (pointer-reactive), editorial marquee, numbered manifesto chapters (01–03), feature bento, CTA, footer
- Auth: register/login/logout/me/refresh, demo quick-fill button, admin + demo seeding on startup, 5-attempt lockout
- Dashboard: drag-drop file extract (pypdf/python-docx), resume buffer with scanline animation, optional Target JD matcher, 1-click sample resume
- Results: animated SVG score gauge, scoring vector bars, detected/missing skills pills, strengths, vulnerabilities with fixes, before/after rewrites with copy button
- Archive: history list with scores, reload past scan, delete
- Sonner toasts, lenis smooth scroll, data-testids throughout

## Verified
- POST /api/auth/login + /api/auth/me (cookies) ✓
- POST /api/analyze → structured Plumb analysis (score, sub-scores, skills, rewrites) ✓
- GET /api/analyses ✓
- E2E screenshot: demo login → sample → deep scan → gauge 62 → archive ✓

## Backlog
- P0: none blocking
- P1: PDF report export of analysis; shareable public result link
- P2: streaming analysis (SSE), resume version diff, pricing/payment tier, Google OAuth
