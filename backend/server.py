from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import io
import json
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from pypdf import PdfReader
from starlette.middleware.cors import CORSMiddleware
import docx

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=1500)
db = client[os.environ["DB_NAME"]]


class InMemoryCursor:
    def __init__(self, documents: list[dict]):
        self.documents = documents

    def sort(self, field: str, direction: int):
        self.documents.sort(key=lambda document: document.get(field), reverse=direction < 0)
        return self

    def limit(self, count: int):
        self.documents = self.documents[:count]
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        if not self.documents:
            raise StopAsyncIteration
        return self.documents.pop(0)


class InMemoryCollection:
    def __init__(self):
        self.documents: list[dict] = []

    @staticmethod
    def matches(document: dict, query: dict) -> bool:
        return all(document.get(field) == value for field, value in query.items())

    async def create_index(self, *args, **kwargs):
        return None

    async def find_one(self, query: dict):
        for document in self.documents:
            if self.matches(document, query):
                return dict(document)
        return None

    async def insert_one(self, document: dict):
        document = dict(document)
        document.setdefault("_id", ObjectId())
        self.documents.append(document)

        class InsertResult:
            inserted_id = document["_id"]

        return InsertResult()

    async def update_one(self, query: dict, operations: dict, upsert: bool = False):
        document = next((item for item in self.documents if self.matches(item, query)), None)
        if document is None and upsert:
            document = dict(query)
            document["_id"] = ObjectId()
            self.documents.append(document)
        if document is None:
            return None
        for field, amount in operations.get("$inc", {}).items():
            document[field] = document.get(field, 0) + amount
        for field, value in operations.get("$setOnInsert", {}).items():
            if document.get(field) is None:
                document[field] = value
        for field, value in operations.get("$set", {}).items():
            document[field] = value
        return None

    async def delete_one(self, query: dict):
        for index, document in enumerate(self.documents):
            if self.matches(document, query):
                self.documents.pop(index)

                class DeleteResult:
                    deleted_count = 1

                return DeleteResult()

        class DeleteResult:
            deleted_count = 0

        return DeleteResult()

    def find(self, query: dict, projection: dict | None = None):
        documents = []
        for document in self.documents:
            if not self.matches(document, query):
                continue
            copy = dict(document)
            for field, include in (projection or {}).items():
                if not include:
                    copy.pop(field, None)
            documents.append(copy)
        return InMemoryCursor(documents)


class InMemoryDatabase:
    def __init__(self):
        self.users = InMemoryCollection()
        self.login_attempts = InMemoryCollection()
        self.analyses = InMemoryCollection()

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(minutes=60)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    secure = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
    response.set_cookie("access_token", create_access_token(user_id, email),
                        httponly=True, secure=secure, samesite="none" if secure else "lax",
                        max_age=3600, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user_id),
                        httponly=True, secure=secure, samesite="none" if secure else "lax",
                        max_age=604800, path="/")


def public_user(doc: dict) -> dict:
    return {"id": str(doc["_id"]), "name": doc["name"], "email": doc["email"],
            "role": doc.get("role", "user")}


class RegisterBody(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return public_user(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------- Auth ----------------

@api_router.post("/auth/register")
async def register(body: RegisterBody, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    doc = {"name": body.name.strip(), "email": email,
           "password_hash": hash_password(body.password),
           "role": "user", "created_at": datetime.now(timezone.utc)}
    result = await db.users.insert_one(doc)
    set_auth_cookies(response, str(result.inserted_id), email)
    return {"id": str(result.inserted_id), "name": doc["name"], "email": email, "role": "user"}


@api_router.post("/auth/login")
async def login(body: LoginBody, request: Request, response: Response):
    email = body.email.lower()
    identifier = f"{request.client.host}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("locked_until"):
        locked_until = attempt["locked_until"]
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"attempts": 1},
             "$setOnInsert": {"created_at": datetime.now(timezone.utc)}},
            upsert=True)
        updated = await db.login_attempts.find_one({"identifier": identifier})
        if updated.get("attempts", 0) >= 5:
            await db.login_attempts.update_one(
                {"identifier": identifier},
                {"$set": {"locked_until": datetime.now(timezone.utc) + timedelta(minutes=15),
                          "attempts": 0}})
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    set_auth_cookies(response, str(user["_id"]), email)
    return public_user(user)


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    secure = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
    response.set_cookie("access_token", create_access_token(str(user["_id"]), user["email"]),
                        httponly=True, secure=secure, samesite="none" if secure else "lax",
                        max_age=3600, path="/")
    return {"ok": True}


# ---------------- Resume Analysis ----------------

ANALYSIS_SYSTEM = """You are Plumb, an elite ATS resume analysis engine used by top recruiters.
Analyze the resume and return ONLY valid JSON (no markdown fences, no commentary) with this exact shape:
{
  "overall_score": <int 0-100>,
  "verdict": "<two or three word label, e.g. 'STRONG MATCH'>",
  "summary": "<2-3 sentence recruiter-style assessment>",
  "sub_scores": {
    "keyword_density": <int 0-100>,
    "impact_quantifiers": <int 0-100>,
    "executive_tone": <int 0-100>,
    "formatting_health": <int 0-100>
  },
  "skills_detected": ["<skill>", ... up to 12],
  "skills_missing": ["<high-value skill absent from resume>", ... up to 8],
  "strengths": ["<specific strength with evidence>", ... 3-5 items],
  "weaknesses": [{"issue": "<specific problem>", "fix": "<concrete fix>"}, ... 3-5 items],
  "rewrites": [{"before": "<actual weak bullet quoted from the resume>", "after": "<rewritten high-impact version with metrics>"}, ... 2-4 items]
}
If a target job description is provided, weight scoring toward alignment with it and fill skills_missing from its requirements."""


def extract_json(text: str) -> dict:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.S)
    if fence:
        text = fence.group(1)
    else:
        match = re.search(r"\{.*\}", text, re.S)
        if match:
            text = match.group(0)
    return json.loads(text)


class AnalyzeBody(BaseModel):
    resume_text: str = Field(min_length=50, max_length=20000)
    target_jd: str = Field(default="", max_length=10000)


def local_analysis(resume_text: str, target_jd: str) -> dict:
    text = resume_text.strip()
    lower_text = text.lower()
    target_lower = target_jd.lower()
    known_skills = [
        "Python", "JavaScript", "TypeScript", "React", "Node.js", "SQL", "PostgreSQL",
        "MongoDB", "Docker", "AWS", "Azure", "GCP", "GraphQL", "FastAPI", "Django",
        "Kubernetes", "Git", "REST APIs", "Machine Learning",
    ]
    skills_detected = [skill for skill in known_skills if skill.lower() in lower_text][:12]
    target_skills = [skill for skill in known_skills if skill.lower() in target_lower]
    skills_missing = [skill for skill in target_skills if skill.lower() not in lower_text][:8]
    bullets = [line.strip(" -") for line in text.splitlines() if line.strip().startswith(("-", "*"))]
    quantified = sum(bool(re.search(r"\d+%?|\$\d+|\b\d+[kKmM]?\b", bullet)) for bullet in bullets)
    impact_verbs = ("built", "led", "improved", "reduced", "increased", "delivered", "launched", "designed")
    impact_count = sum(any(bullet.lower().startswith(verb) for verb in impact_verbs) for bullet in bullets)
    keyword_score = min(100, 35 + len(skills_detected) * 5 + len(skills_missing) * 3)
    impact_score = min(100, 35 + quantified * 12 + impact_count * 8)
    tone_score = min(100, 55 + (10 if "experience" in lower_text else 0) + (10 if "senior" in lower_text else 0))
    formatting_score = min(100, 45 + (15 if "skills" in lower_text else 0) + (15 if "experience" in lower_text else 0))
    overall_score = round((keyword_score + impact_score + tone_score + formatting_score) / 4)
    strengths = [
        f"Detected {len(skills_detected)} relevant technical skills." if skills_detected else "Resume includes a clear professional narrative.",
        "Experience section is clearly separated and easy to scan." if "experience" in lower_text else "Resume content provides useful career context.",
        "Target role alignment was checked against the supplied job description." if target_jd.strip() else "Resume is ready for a targeted job-description comparison.",
    ]
    weaknesses = [
        {"issue": "Several bullets lack measurable outcomes.", "fix": "Add percentages, time saved, revenue, scale, or user impact to each achievement."},
        {"issue": "Some bullets use passive or low-impact phrasing.", "fix": "Lead each bullet with a strong action verb and state the result."},
        {"issue": "Target skills are not fully represented." if skills_missing else "Keyword coverage can be strengthened for each target role.",
         "fix": f"Add evidence for: {', '.join(skills_missing)}." if skills_missing else "Mirror the target role's terminology where it accurately reflects your experience."},
    ]
    rewrites = []
    for bullet in bullets[:3]:
        rewrites.append({
            "before": bullet,
            "after": f"{bullet.rstrip('.')} and delivered measurable improvements across reliability, speed, or customer impact.",
        })
    if not rewrites:
        rewrites = [{
            "before": "Add an achievement bullet with a measurable result.",
            "after": "Delivered a measurable improvement by applying the relevant tools and process to a high-priority business outcome.",
        }]
    return {
        "overall_score": overall_score,
        "verdict": "STRONG MATCH" if overall_score >= 75 else "PROMISING BASE" if overall_score >= 55 else "NEEDS REWORK",
        "summary": "Local analysis is available without an external AI provider. The resume has been scored for structure, skills, impact language, and measurable evidence.",
        "sub_scores": {
            "keyword_density": keyword_score,
            "impact_quantifiers": impact_score,
            "executive_tone": tone_score,
            "formatting_health": formatting_score,
        },
        "skills_detected": skills_detected,
        "skills_missing": skills_missing,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "rewrites": rewrites[:4],
    }


@api_router.post("/analyze")
async def analyze(body: AnalyzeBody, user: dict = Depends(get_current_user)):
    prompt = f"RESUME:\n{body.resume_text[:15000]}"
    if body.target_jd.strip():
        prompt += f"\n\nTARGET JOB DESCRIPTION:\n{body.target_jd[:8000]}"

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except ModuleNotFoundError:
        logger.warning("LLM integration unavailable; using local analysis")
        data = local_analysis(body.resume_text, body.target_jd)
    else:
        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"resume-{uuid.uuid4()}",
            system_message=ANALYSIS_SYSTEM,
        ).with_model("gemini", "gemini-3-flash-preview")
        try:
            raw = await chat.send_message(UserMessage(text=prompt))
            data = extract_json(raw)
        except json.JSONDecodeError:
            logger.error("Gemini returned non-JSON: %s", raw[:500])
            raise HTTPException(status_code=502, detail="AI returned an unreadable response. Try again.")
        except Exception as e:
            logger.exception("Analysis failed")
            raise HTTPException(status_code=502, detail=f"Analysis engine error: {e}")

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "resume_excerpt": body.resume_text[:400],
        "resume_text": body.resume_text[:20000],
        "target_jd": body.target_jd[:10000] if body.target_jd.strip() else "",
        "result": data,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.analyses.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/extract-text")
async def extract_text(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    content = await file.read()
    name = (file.filename or "").lower()
    try:
        if name.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        elif name.endswith(".docx"):
            document = docx.Document(io.BytesIO(content))
            text = "\n".join(p.text for p in document.paragraphs)
        else:
            text = content.decode("utf-8", errors="ignore")
    except Exception:
        raise HTTPException(status_code=422, detail="Could not parse this file. Paste the text instead.")
    text = text.strip()
    if len(text) < 50:
        raise HTTPException(status_code=422, detail="Not enough readable text found in the file.")
    return {"text": text[:15000], "filename": file.filename}


def serialize_analysis(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


@api_router.get("/analyses")
async def list_analyses(user: dict = Depends(get_current_user)):
    cursor = db.analyses.find(
        {"user_id": user["id"]},
        {"resume_text": 0, "target_jd": 0},
    ).sort("created_at", -1).limit(50)
    return [serialize_analysis(doc) async for doc in cursor]


@api_router.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str, user: dict = Depends(get_current_user)):
    doc = await db.analyses.find_one({"id": analysis_id, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return serialize_analysis(doc)


@api_router.delete("/analyses/{analysis_id}")
async def delete_analysis(analysis_id: str, user: dict = Depends(get_current_user)):
    result = await db.analyses.delete_one({"id": analysis_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"message": "Plumb AI analysis engine online"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def seed_users():
    seeds = [
        (os.environ.get("ADMIN_EMAIL", "admin@nexus.cv"),
         os.environ.get("ADMIN_PASSWORD", "admin123"), "Admin", "admin"),
        ("demo@nexus.cv", "demo1234", "Demo Candidate", "user"),
    ]
    for email, password, name, role in seeds:
        existing = await db.users.find_one({"email": email})
        if existing is None:
            await db.users.insert_one({
                "name": name, "email": email, "password_hash": hash_password(password),
                "role": role, "created_at": datetime.now(timezone.utc)})
        elif not verify_password(password, existing["password_hash"]):
            await db.users.update_one({"email": email},
                                      {"$set": {"password_hash": hash_password(password)}})


@app.on_event("startup")
async def startup():
    global db
    try:
        await client.admin.command("ping")
    except Exception:
        db = InMemoryDatabase()
        logger.warning("MongoDB unavailable; using in-memory database")
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.analyses.create_index([("user_id", 1), ("created_at", -1)])
    await seed_users()
    credentials = f"""# Test Credentials

## Admin (test credentials — reseed anytime via backend restart)
- Email: {os.environ.get("ADMIN_EMAIL", "admin@nexus.cv")}
- Password: {os.environ.get("ADMIN_PASSWORD", "admin123")}
- Role: admin

## Demo User
- Email: demo@nexus.cv
- Password: demo1234
- Role: user

## Auth endpoints
- POST /api/auth/register {{name, email, password}}
- POST /api/auth/login {{email, password}}
- POST /api/auth/logout
- GET  /api/auth/me
- POST /api/auth/refresh

## App endpoints
- POST /api/analyze {{resume_text, target_jd?}} (auth)
- POST /api/extract-text (multipart file: pdf/docx/txt) (auth)
- GET  /api/analyses (auth)
- GET/DELETE /api/analyses/{{id}} (auth)
"""
    credentials_path = ROOT_DIR.parent / "memory" / "test_credentials.md"
    credentials_path.parent.mkdir(parents=True, exist_ok=True)
    credentials_path.write_text(credentials)
    logger.info("Startup complete: users seeded, indexes ensured")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
