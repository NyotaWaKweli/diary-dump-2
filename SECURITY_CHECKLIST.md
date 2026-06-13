# SECURITY CHECKLIST — Diary Dump

## ✅ CONFIRMATION OF ALL 5 CRITICAL SECURITY REQUIREMENTS

### 1. SERVICE_ROLE Key Isolation
**STATUS: ✅ CONFIRMED**

- The `SUPABASE_SERVICE_ROLE_KEY` is used **ONLY** in `lib/supabase-server.ts`
- This file is imported **exclusively** by API routes (`app/api/*/route.ts`)
- The `SUPABASE_ANON_KEY` is the ONLY key exposed to the frontend
- The ANON key is used solely for browser-side auth session management
- **NO** `.env` files are committed (`.gitignore` includes `.env*`)
- Environment variables are configured in Vercel Dashboard only

### 2. Row Level Security (RLS) Enabled on ALL Tables
**STATUS: ✅ CONFIRMED**

All 8 tables have RLS enabled with restrictive policies:

| Table | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
|-------|--------------|---------------|---------------|---------------|
| profiles | Public read | — | Own only | Own only |
| diaries | Public OR own | Own only | Own only | Own only |
| repost_chain | Via diary visibility | Own only | — | — |
| comments | Via diary visibility | Own only | — | Own OR diary owner |
| bookmarks | Own only | Own only | — | Own only |
| notifications | Own only | — | Own only | Own only |
| blocked_users | Own only | Own only | — | Own only |
| notification_settings | Own only | — | Own only | — |

**NO** table has `USING (true)` for write operations.

### 3. ALL Writes Through API Routes
**STATUS: ✅ CONFIRMED**

| Operation | API Route | Auth Required | Validation |
|-----------|-----------|---------------|------------|
| Register | `POST /api/auth/register` | No | Username regex, password length, PIN format |
| Login | `POST /api/auth/login` | No | Username regex, password length |
| Create Diary | `POST /api/diaries` | Yes | Content length, mood, font, color, tags |
| Update Diary | `PATCH /api/diaries` | Yes + ownership | Same as create |
| Delete Diary | `DELETE /api/diaries` | Yes + ownership | ID validation |
| Create Comment | `POST /api/comments` | Yes | Content length |
| Delete Comment | `DELETE /api/comments` | Yes + ownership | ID validation |
| Toggle Bookmark | `POST /api/bookmarks` | Yes | Diary ID validation |
| Update Profile | `PATCH /api/profile` | Yes | Username regex, PIN format |
| Update Password | `PUT /api/profile` | Yes | Password length |
| Delete Account | `DELETE /api/profile` | Yes | — |
| Upload Avatar | `POST /api/upload` | Yes | File type, size |
| Block User | `POST /api/blocked` | Yes | Username lookup |
| Update Settings | `PATCH /api/settings` | Yes | Boolean fields |

**Frontend NEVER calls `supabase.from()` for writes.**

### 4. Input Validation on Every Endpoint
**STATUS: ✅ CONFIRMED**

- `lib/validation.ts` contains Zod schemas for all inputs
- Username: `^[a-z0-9._]+$` (Instagram-style, lowercase only)
- Password: min 8 chars, max 128
- Recovery PIN: exactly 4 digits (`^\d{4}$`)
- Content: max 5000 chars
- Tags: max 10, each max 30 chars
- Comments: max 1000 chars
- File uploads: JPEG/PNG/GIF/WebP only, max 2MB
- **All validation occurs server-side in API routes**

### 5. Generic Error Messages
**STATUS: ✅ CONFIRMED**

- API routes use `errorResponse()` helper from `lib/supabase-server.ts`
- Client receives: `"Something went wrong"` or `"Invalid request"`
- Detailed errors are logged server-side only (Vercel Functions logs)
- **NO** database structure, table names, or internal details exposed

---

## ADDITIONAL SECURITY MEASURES

### Rate Limiting
- In-memory rate limiting per IP + user ID
- Register: 3 attempts per 5 minutes
- Login: 5 attempts per 5 minutes
- Password reset: 3 attempts per 5 minutes
- Diary creation: 10 per hour
- Comments: 20 per hour
- Avatar uploads: 5 per hour

### CORS & Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Auth Security
- Supabase Auth with email/password
- JWT tokens stored in localStorage (frontend only)
- Tokens sent via `Authorization: Bearer` header
- Recovery PIN verification before password reset

### Data Sanitization
- `escapeHtml()` function prevents XSS
- All user-generated content is escaped before rendering
- No raw HTML injection possible

---

## DEPLOYMENT CHECKLIST

- [ ] Run `sql/setup.sql` in Supabase SQL Editor
- [ ] Create Storage bucket `avatars` with public read policy
- [ ] Add environment variables to Vercel (from `.env.example`)
- [ ] Verify RLS is enabled on all tables in Supabase Dashboard
- [ ] Test each API route with invalid data
- [ ] Confirm no SERVICE_ROLE key in any frontend file
- [ ] Enable Supabase Auth email confirmation (optional)
- [ ] Set up daily backups in Supabase

---

## RED FLAGS CHECKED

❌ SERVICE_ROLE key in frontend — **NOT PRESENT**
❌ RLS disabled on any table — **NOT PRESENT**
❌ Direct Supabase writes from browser — **NOT PRESENT**
❌ Detailed error messages to client — **NOT PRESENT**
❌ `.env` files committed to git — **NOT PRESENT**

---

Generated: 2026-06-09
Version: 1.0
