# Mount Kalisungan Tourist Tracking System — Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Database Schema](#database-schema)
6. [Pages & Routes](#pages--routes)
7. [Authentication & Authorization](#authentication--authorization)
8. [AI Trail Assistant](#ai-trail-assistant)
9. [Interactive Map](#interactive-map)
10. [Booking System](#booking-system)
11. [Role-Based Dashboards](#role-based-dashboards)
12. [Deployment](#deployment)

---

## Project Overview

The **Mount Kalisungan Tourist Tracking System** is a web-based application designed for managing and enhancing the hiking experience at **Mount Kalisungan** (622m) located in **Calauan, Laguna, Philippines** (14.1475°N, 121.3454°E).

The system serves three user roles — **Hikers**, **Rangers**, and **Administrators** — providing real-time GPS tracking, AI-powered trail assistance, smart booking with QR code passes, and comprehensive admin dashboards.

This is a **thesis project (2026)** built to demonstrate how modern web technologies can improve trail safety, visitor management, and mountain tourism operations.

---

## Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI component library |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Pre-built accessible UI components |
| **Framer Motion** | Animations and transitions |
| **React Router v6** | Client-side routing |
| **TanStack React Query** | Server state management |
| **Leaflet + React-Leaflet** | Interactive map rendering |
| **Recharts** | Data visualization / charts |
| **React Markdown** | Markdown rendering for AI chat |
| **qrcode.react** | QR code generation |
| **date-fns** | Date formatting utilities |
| **Sonner** | Toast notifications |
| **Lucide React** | Icon library |
| **Zod** | Schema validation |
| **React Hook Form** | Form state management |

### Backend (SupaBase Cloud)
| Technology | Purpose |
|---|---|
| **Supabase (via Cloud)** | Database, Auth, Edge Functions, Realtime |
| **PostgreSQL** | Relational database |
| **Row Level Security (RLS)** | Data access control |
| **Deno Edge Functions** | Serverless backend logic |
| **AI Chatbot Gateway** | Cloud LLM access (provider-configurable) |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React + Vite)        │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Pages   │  │  Hooks   │  │  Components  │   │
│  │ (Routes) │  │ (Auth,   │  │ (UI, Layout) │   │
│  │          │  │  State)  │  │              │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
│                       │                          │
│           ┌───────────┴──────────┐               │
│           │  Supabase Client SDK │               │
│           └───────────┬──────────┘               │
└───────────────────────┼──────────────────────────┘
                        │ HTTPS
┌───────────────────────┼──────────────────────────┐
│              SupaBase Cloud (Backend)             │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Auth     │  │ Database │  │ Edge         │   │
│  │ (Email   │  │ (Postgres│  │ Functions    │   │
│  │  + Pass) │  │  + RLS)  │  │ (trail-chat) │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
│                                     │            │
│                          ┌──────────┴─────┐      │
│                          │ AI Chat Bot    │      │
│                          │ Gateway        │      │
│                          │ (Cloud LLM)    │      │
│                          └────────────────┘      │
└──────────────────────────────────────────────────┘
```

---

## Features

### 🗺️ Interactive Trail Map
- **Leaflet-based** map centered on Mt. Kalisungan (14.1475°N, 121.3454°E)
- **3 tile layer options**: Street (OpenStreetMap), Topographic (OpenTopoMap), Satellite (Esri)
- **3 color-coded trail routes**:
  - 🔴 Summit Trail (Hard) — 3.2 km, 622m elevation
  - 🔵 River Trail (Easy) — 2.1 km, 350m elevation
  - 🟡 Ridge Trail (Moderate) — 2.8 km, 480m elevation
- **Points of Interest (POI)**: Trailhead, Summit, Campsite, River Crossing, Viewpoint, Ranger Station
- **Zone overlays**: Camping Zone (green), Restricted Wildlife Area (red)
- **GPS live tracking** with Strava-like stats (distance, time, pace)
- **Off-trail deviation alerts** (warns when >100m from nearest trail)
- **Offline tile caching** via Browser Cache API

### 🤖 AI Trail Assistant
- Powered by a **cloud LLM** via the app's AI gateway
- **Streaming responses** with real-time text rendering
- Expert knowledge about Mt. Kalisungan: trails, safety, flora/fauna, gear, weather
- **Quick question prompts** for common queries
- Markdown-formatted responses

### 📅 Smart Booking System
- **Calendar-based date selection** with future-only dates
- **Daily capacity management** (default 100 hikers/day)
- **Remaining slot display** with color-coded warnings
- **QR code pass generation** for trailhead check-in
- **Group booking** support (1–20 people)
- **Emergency contact** collection
- Booking data stored in database with RLS policies

### 👤 Authentication & Role System
- **Email + password** authentication
- **3 user roles**: Admin, Ranger, Hiker
- Role-based access to dashboards
- Profile management with emergency contacts
- Session persistence with auto-refresh tokens

### 📊 Role-Based Dashboards
- **Admin Dashboard** (`/admin`): Analytics, visitor tracking, zone management
- **Ranger Dashboard** (`/ranger`): Trail condition reports, hiker monitoring
- **Hiker Dashboard** (`/hiker`): Personal hike history, booking status

### 🔔 Real-Time Notifications
- Toast notifications via **Sonner** for booking confirmations, GPS errors, off-trail warnings, and cache status

---

## Database Schema

### Tables

| Table | Description |
|---|---|
| `profiles` | User profile data (name, phone, emergency contact, avatar) |
| `user_roles` | Maps users to roles (`admin`, `ranger`, `hiker`) |
| `trail_zones` | Trail/zone definitions with coordinates, capacity, difficulty |
| `bookings` | Hike reservations with QR codes and emergency info |
| `hiker_sessions` | Active/completed hike sessions with distance tracking |
| `hiker_locations` | GPS breadcrumb trail (lat, lng, altitude, timestamp) |
| `trail_reports` | Ranger-submitted trail condition reports |
| `chat_messages` | AI chat message history per user |
| `daily_capacity` | Per-date visitor capacity limits and counts |

### Key Relationships
- `hiker_locations` → `hiker_sessions` (foreign key)
- `hiker_sessions` → `bookings` (foreign key)
- `hiker_sessions` → `trail_zones` (foreign key)
- `trail_reports` → `trail_zones` (foreign key)

### Enums
- `app_role`: `admin` | `ranger` | `hiker`

### Database Functions
- `has_role(_role, _user_id)`: Checks if a user has a specific role

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing Page | Hero section, feature showcase, CTA |
| `/login` | Login | Email/password sign-in |
| `/register` | Register | Account creation with full name |
| `/map` | Interactive Map | Trail map with GPS tracking |
| `/chat` | AI Assistant | Conversational trail guide |
| `/booking` | Booking | Reserve hike dates with QR passes |
| `/admin` | Admin Dashboard | System analytics & management |
| `/ranger` | Ranger Dashboard | Trail reports & hiker monitoring |
| `/hiker` | Hiker Dashboard | Personal hike history |
| `*` | 404 Not Found | Fallback route |

---

## Authentication & Authorization

### Flow
1. User registers at `/register` with email, password, and full name
2. Email verification is required before sign-in
3. On login, the system fetches the user's role from `user_roles` table
4. Role determines dashboard access and data visibility
5. Sessions persist via `localStorage` with auto-refresh tokens

### Auth Context (`useAuth` hook)
```typescript
const { user, role, loading, signIn, signUp, signOut } = useAuth();
```

Provides: current user object, resolved role, loading state, and auth methods.

---

## AI Trail Assistant

### Backend Edge Function: `trail-chat`
- **Endpoint**: `{SUPABASE_URL}/functions/v1/trail-chat`
- **Model**: configurable via environment (see `AI_MODEL`)
- **Streaming**: Server-Sent Events (SSE) for real-time response delivery
- **System prompt**: Comprehensive Mt. Kalisungan expert knowledge including:
  - Trail details (3 routes with difficulty/distance/elevation)
  - Safety guidelines and emergency procedures
  - Required gear checklist
  - Flora & fauna information
  - Seasonal recommendations

### Error Handling
- `429` → Rate limit exceeded
- `402` → Usage limit / credits needed
- `500` → General AI service error

---

## Interactive Map

### Map Technology
- **Leaflet 1.9.4** with **React-Leaflet 4.2.1** bindings
- Custom `DivIcon` markers for POI types (checkpoint, summit, camp, water, viewpoint, ranger)
- Polyline trails with configurable colors and weights
- Polygon zone overlays with dashed borders and semi-transparent fills

### GPS Tracking
- Uses `navigator.geolocation.watchPosition()` with high accuracy
- Calculates distance via **Haversine formula**
- Tracks elapsed time and computes pace (min/km)
- Draws user's path as a dashed green polyline
- **Off-trail detection**: Alerts when user is >100m from any trail point

### Offline Support
- Caches OpenStreetMap tiles in a 7×7 grid (zoom level 15) around Mt. Kalisungan
- Uses the Browser **Cache API** (`caches.open('map-tiles-v1')`)

---

## Booking System

### Workflow
1. User selects a future date on the calendar
2. System checks `daily_capacity` for remaining slots
3. User fills group size + emergency contact info
4. On confirmation:
   - Booking record created in `bookings` table
   - Unique QR code generated (`KALISUNGAN-{userId}-{date}-{timestamp}`)
   - `daily_capacity.current_count` incremented
5. QR code displayed for trailhead check-in

---

## Deployment

### Build
```bash
bun install
bun run build
```

### Development
```bash
bun run dev
```

### Environment Variables
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Backend API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public anon key for client |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier |

### Edge Function Secrets
| Secret | Description |
|---|---|
| `AI_API_KEY` | AI gateway authentication key |
| `AI_GATEWAY_URL` | (Optional) AI gateway base URL |
| `AI_MODEL` | (Optional) model identifier |

---

## Project Structure

```
src/
├── App.tsx                    # Root component with routing
├── main.tsx                   # Entry point
├── index.css                  # Global styles & design tokens
├── components/
│   ├── layout/
│   │   └── Navbar.tsx         # Navigation bar
│   ├── ui/                    # shadcn/ui components
│   └── NavLink.tsx            # Navigation link helper
├── hooks/
│   ├── useAuth.tsx            # Authentication context & hook
│   ├── use-mobile.tsx         # Mobile detection hook
│   └── use-toast.ts           # Toast notification hook
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client (auto-generated)
│       └── types.ts           # Database types (auto-generated)
├── lib/
│   ├── map-data.ts            # Trail coordinates, POI, zones, utils
│   └── utils.ts               # General utilities (cn helper)
├── pages/
│   ├── Index.tsx              # Landing page
│   ├── Login.tsx              # Sign-in page
│   ├── Register.tsx           # Registration page
│   ├── MapPage.tsx            # Interactive trail map
│   ├── ChatPage.tsx           # AI assistant chat
│   ├── BookingPage.tsx        # Hike booking with QR
│   ├── AdminDashboard.tsx     # Admin analytics
│   ├── RangerDashboard.tsx    # Ranger tools
│   ├── HikerDashboard.tsx     # Hiker profile
│   └── NotFound.tsx           # 404 page
└── types/
    └── index.ts               # TypeScript type definitions

supabase/
├── config.toml                # Backend configuration
└── functions/
    └── trail-chat/
        └── index.ts           # AI chat edge function
```

---

*Last updated: February 2026*
