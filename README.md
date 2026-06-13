# Diary Dump — Secure Edition

A secure, full-stack diary sharing application built with Next.js, Supabase, and Vercel.

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Browser   │ ──── │  Vercel API      │ ──── │  Supabase   │
│  (React)    │      │  (Serverless)    │      │ (PostgreSQL)│
│  ANON key   │      │  SERVICE_ROLE    │      │  RLS Enabled│
│  Read-only  │      │  Validation      │      │             │
└─────────────┘      └──────────────────┘      └─────────────┘
```

**All database writes go through Vercel API routes using the SERVICE_ROLE key.**

## File Structure

```
diary-dump-secure/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── recovery/route.ts
│   │   ├── blocked/route.ts
│   │   ├── bookmarks/route.ts
│   │   ├── comments/route.ts
│   │   ├── diaries/route.ts
│   │   ├── notifications/route.ts
│   │   ├── profile/route.ts
│   │   ├── settings/route.ts
│   │   ├── upload/route.ts
│   │   └── views/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── DiaryDump.tsx
│   ├── LoginOverlay.tsx
│   ├── RegisterOverlay.tsx
│   ├── ComposeOverlay.tsx
│   ├── DetailOverlay.tsx
│   ├── NotificationsOverlay.tsx
│   ├── ProfileOverlay.tsx
│   ├── SettingsOverlay.tsx
│   ├── BookmarksOverlay.tsx
│   ├── MyDiariesOverlay.tsx
│   ├── AboutOverlay.tsx
│   ├── FilterOverlay.tsx
│   └── styles.ts
├── lib/
│   ├── api-client.ts      # Frontend API client (NO Supabase direct calls)
│   ├── supabase-server.ts # Server-side Supabase (SERVICE_ROLE only)
│   ├── supabase-client.ts # Browser-safe Supabase (ANON key only)
│   └── validation.ts      # Zod schemas for input validation
├── sql/
│   └── setup.sql          # Database schema + RLS policies
├── public/
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── SECURITY_CHECKLIST.md
```

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run everything in `sql/setup.sql`
3. Go to Storage → Create bucket `avatars` → Make it public
4. Set bucket policies:
   - Upload: `auth.uid()::text = (storage.foldername(name))[1]`
   - Read: `bucket_id = 'avatars'`
5. Go to Settings → API → copy URL and keys

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**NEVER commit `.env.local` to git.**

### 3. Vercel Deployment

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy

### 4. Username Rules

Usernames follow Instagram format:
- **Lowercase** letters, numbers, underscores, dots only
- 3-30 characters
- Cannot start/end with `.` or `_`
- No consecutive dots or underscores
- Regex: `^[a-z0-9._]+$`

## Security Model

| Layer | Protection |
|-------|-----------|
| **API Routes** | All writes go through `/api/*` endpoints |
| **Auth** | JWT tokens via `Authorization: Bearer` header |
| **Validation** | Zod schemas on every endpoint |
| **Rate Limiting** | Per-IP + per-user limits |
| **RLS** | Enabled on all 8 tables |
| **Error Handling** | Generic messages to client, details logged server-side |
| **File Uploads** | Type + size validation before Storage |

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Sign in | No |
| PUT | `/api/auth/recovery` | Verify PIN | No |
| PATCH | `/api/auth/recovery` | Reset password | No (after PIN verify) |
| GET | `/api/diaries` | List diaries | No |
| POST | `/api/diaries` | Create diary | Yes |
| PATCH | `/api/diaries` | Update diary | Yes + owner |
| DELETE | `/api/diaries` | Delete diary | Yes + owner |
| GET | `/api/comments` | Get comments | No |
| POST | `/api/comments` | Add comment | Yes |
| DELETE | `/api/comments` | Delete comment | Yes + owner |
| GET | `/api/bookmarks` | List bookmarks | Yes |
| POST | `/api/bookmarks` | Toggle bookmark | Yes |
| GET | `/api/notifications` | Get notifications | Yes |
| PATCH | `/api/notifications` | Mark read | Yes |
| DELETE | `/api/notifications` | Clear all | Yes |
| GET | `/api/profile` | Get profile | Yes |
| PATCH | `/api/profile` | Update profile | Yes |
| PUT | `/api/profile` | Change password | Yes |
| DELETE | `/api/profile` | Delete account | Yes |
| POST | `/api/upload` | Upload avatar | Yes |
| GET | `/api/blocked` | List blocked | Yes |
| POST | `/api/blocked` | Block user | Yes |
| DELETE | `/api/blocked` | Unblock user | Yes |
| GET | `/api/settings` | Get settings | Yes |
| PATCH | `/api/settings` | Update settings | Yes |
| POST | `/api/views` | Batch view increment | No |

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## License

MIT — Built with care for those who need a safe space.
