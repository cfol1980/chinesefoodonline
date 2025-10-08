ChineseFoodOnline.com — Developer Handoff & Progress Summary

Environment:
Next.js 15 (App Router) + Firebase (Auth, Firestore, Storage, Functions)
Deployments:

Stage: stage.chinesefoodonline.com (Vercel)

Firebase Functions + Firestore rules synced

📦 Project Overview

A bilingual platform helping Chinese restaurants and food makers showcase menus, accept online orders, and manage daily operations through an integrated POS dashboard.

🧩 Stack Summary
Layer	Tech	Notes
Frontend	Next.js 15 (App Router)	Using layouts, server/client components split
Backend	Firebase (Auth, Firestore, Functions, Storage)	Deployed via Firebase CLI
Auth	Google Login, Phone Login	Firebase Authentication
Styling	Tailwind CSS + globals.css	Mobile-friendly, dark/light theme ready
Deployment	Vercel	Stage branch connected
Language	EN / 中文	Toggle in dashboard header
🗂️ Project Structure (key folders)
src/
 ├─ app/
 │   ├─ layout.tsx                 # Root layout (global styles, viewport)
 │   ├─ globals.css                # Global Tailwind styles (mobile-optimized)
 │   ├─ login/                     # Google + Phone login
 │   ├─ admin/                     # Admin dashboard base (add-support, users, roles)
 │   ├─ supporter-dashboard/       # Supporter dashboard main app
 │   │   ├─ layout.tsx             # Top nav layout with EN/中文 toggle
 │   │   ├─ SupporterDashboardClient.tsx  # Client-side logic wrapper
 │   │   ├─ SupporterContext.tsx          # Firestore-based context
 │   │   ├─ menu/
 │   │   │   ├─ CategoryManager.tsx       # CRUD categories
 │   │   │   ├─ ItemManager.tsx           # CRUD items
 │   │   │   ├─ storageUpload.ts          # Firebase Storage helper
 │   │   │   └─ page.tsx                  # Menu page (Tabs UI)
 │   │   ├─ orders/, reports/, settings/, staff/  # Feature placeholders
 │   │   └─ page.tsx                      # Dashboard home (Today)
 │   └─ [slug]/                           # Public supporter pages (QR landing)
 │
 ├─ components/
 │   ├─ AuthGuard.tsx                     # Route protection (to be completed)
 │   └─ ui/                               # Shared UI components
 │       ├─ button.tsx
 │       └─ tabs.tsx
 │
 ├─ lib/
 │   ├─ firebase.ts                       # Firebase client init
 │   ├─ firestoreMenu.ts                  # Firestore helpers (menu)
 │   ├─ roles.ts                          # Role types & mappings
 │   ├─ slugify.ts                        # Slug generator for supporter pages
 │   └─ utils.ts                          # Utility functions (class merge, etc.)
 │
 └─ functions/
     ├─ src/index.ts                      # Cloud Functions (roles, memberships)
     ├─ tsconfig.json
     └─ package.json

⚙️ Implemented Features
Feature	Status	Notes
Firebase Auth (Google)	✅	Fully working
Firebase Auth (Phone)	✅	Works in production; localhost Recaptcha fix optional
User Firestore doc sync	✅	Created on login
Role system (admin/supporter/owner)	✅	via Cloud Functions
Supporter dashboard UI	✅	Fully responsive top nav
Language toggle	✅	EN / 中文 switch
Menu categories CRUD	⚙️	Base UI, Firestore integration WIP
Menu items CRUD	⚙️	Base UI scaffolded
Global styling (inputs/buttons)	✅	Mobile-first via globals.css
Firebase Rules (Firestore/Storage)	✅	Role-aware and secure
🔐 Security Overview

Firestore rules:

Admins → full access

Supporter owners/managers → can write within their own /supporters/{slug}

Public read access for menus

Storage rules:

Supporter-specific folders (logos/{slug}, menu/{slug} etc.)

Only owner/admin can write

Public read access for media

Cloud Functions:

assignRole, updateUserRoles, searchUsers, getSupporterOwner callable

Automatically keeps /users/{uid} and /supporters/{id}/members/{uid} in sync

🎨 UI Overview
Root Layout (src/app/layout.tsx)

Geist Sans font

Responsive padding (max-w-screen-md)

Global Tailwind styles apply to all inputs/buttons

Theme color: #10b981 (emerald green)

Supporter Dashboard Layout (src/app/supporter-dashboard/layout.tsx)

Top navigation bar

Dropdown mobile menu

EN/中文 toggle in header

Link to supporter’s public page

Uses SupporterContext for dynamic data

🧭 Next Development Phases
Phase 2: Role-Based Access + AuthGuard

Complete AuthGuard.tsx to redirect unauthenticated users to /login

Wrap:

/supporter-dashboard/layout.tsx

/admin/layout.tsx

Connect SupporterContext to authenticated user roles (Firestore + claims)

Phase 3: Menu Management Polish

Complete Firestore CRUD for categories & items

Add reorder & image upload preview

Hook into supporter’s /supporters/{slug}/categories collection

Phase 4: Ordering System MVP

Add /orders tab for supporter dashboard

Create orders collection under /supporters/{slug}

Enable order status updates (new, accepted, ready, done)

Display live order list with sound alert

Phase 5: Public Supporter Pages

Build /[slug]/page.tsx → QR landing page

Fetch menu dynamically

Allow customer login + ordering flow

Phase 6+:

Payments (Stripe/WeChat/Alipay)

Reports + Analytics

POS (tablet-friendly UI)

🔧 Firebase Commands

Deploy functions:

cd functions
npm run build
firebase deploy --only functions


Serve locally:

firebase emulators:start


Deploy Firestore + Storage rules:

firebase deploy --only firestore:rules,storage:rules

🧪 Testing Checklist
Test	Expected
/login Google	Login succeeds, user doc created
/login Phone	SMS sent, verified, redirects to dashboard
/supporter-dashboard/menu	Tabs visible: Categories / Items
/supporter-dashboard	Shows header with logo + language toggle
Mobile view (Pixel 7)	Inputs clearly visible, text readable
Dark mode	Background + text contrast correct
🧭 Suggested Workflow Between Copilot & GPT-5
Task Type	Who Handles It Best
Quick boilerplate / repetitive CRUD code	💡 Copilot
Architectural decisions / schema / security / deployment setup	🤖 GPT-5 (me)
Debugging or refactoring	Co-op: Copilot drafts, GPT-5 explains/fixes
UI layout refinements	Copilot for code → GPT-5 for responsive review
✅ Next Actions for Copilot

Implement /src/components/AuthGuard.tsx:

Check Firebase Auth state.

Redirect unauthenticated users to /login.

Display loading spinner during state init.

Wrap /src/app/supporter-dashboard/layout.tsx inside <AuthGuard>.

Expand SupporterContext.tsx:

Load current user’s supporter role.

Provide isOwner, isManager, supporterId.

Prepare admin layout (/src/app/admin/layout.tsx) using same AuthGuard pattern but restrict to admin roles.