# Lovable Implementation Guide: Meatspace-Bridge

To move from a "blueprint" to a "working product" in Lovable, you need to provide these four specific "Missing Links" to the AI.

## 1. The Supabase SQL "Day 1" Script
Lovable can generate the UI, but it often struggles to set up complex Postgres extensions like PostGIS and RLS policies correctly in one go.
**Action:** Copy the schema from `rentahuman-clone.md` into the Supabase SQL Editor first.

## 2. The Edge Function Handshake
RentAHuman's value is the **API**. Lovable handles frontend logic well, but we need to prompt it to create an **Edge Function** (via Supabase) that acts as the API endpoint for AI Agents to create tasks.
**Requirement:** An endpoint at `/api/v1/tasks/create` that accepts an API Key.

## 3. The "Evidence" Storage Bucket
We need a Supabase Storage bucket named `task-evidence`. 
**Requirement:** RLS policies on the bucket must ensure that only the human assigned to the task can upload, and only the hiring agent can view.

## 4. The Maps Integration
Since this is a geospatial app, Lovable needs a **Mapbox** or **Google Maps** API key.
**Action:** Add `NEXT_PUBLIC_MAPBOX_TOKEN` to the Lovable project settings.

---

### **Refined "Senior" Starter Prompt for Lovable:**
"Build a marketplace called Meatspace-Bridge. 
1. **Schema:** Use the PostGIS extension. Tables: `profiles` (with geolocation), `tasks` (hiring status), and `transactions`.
2. **Auth:** Implement a dual-persona signup (I am a Human / I am an Agent).
3. **Core Workflow:** Humans set their location and rate. Agents can 'Search' for humans within a radius.
4. **Verification:** Create a 'Submit Evidence' component where humans upload a photo to a Supabase bucket.
5. **Logic:** Use Row-Level Security so humans only see tasks they are assigned to."
