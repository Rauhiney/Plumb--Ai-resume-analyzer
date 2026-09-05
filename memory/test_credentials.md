# Test Credentials

## Admin (test credentials — reseed anytime via backend restart)
- Email: admin@nexus.cv
- Password: admin123
- Role: admin

## Demo User
- Email: demo@nexus.cv
- Password: demo1234
- Role: user

## Auth endpoints
- POST /api/auth/register {name, email, password}
- POST /api/auth/login {email, password}
- POST /api/auth/logout
- GET  /api/auth/me
- POST /api/auth/refresh

## App endpoints
- POST /api/analyze {resume_text, target_jd?} (auth)
- POST /api/extract-text (multipart file: pdf/docx/txt) (auth)
- GET  /api/analyses (auth)
- GET/DELETE /api/analyses/{id} (auth)
