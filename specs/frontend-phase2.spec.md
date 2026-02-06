# Frontend Phase 2: Dashboard & Map View Specification

**Status:** Draft
**Role:** Lead Frontend Architect
**Target:** Meatspace-Bridge (Sentinel Nexus)

## 1. Overview
This phase implements the core operator interface: a geospatial dashboard for monitoring and dispatching physical workers. The layout consists of a persistent sidebar for list-based interactions and a full-screen map for spatial context.

## 2. Architecture & Layout

### 2.1. Layout Structure
- **Container:** CSS Grid / Flexbox layout.
- **Sidebar (`<DashboardSidebar />`):**
  - **Width:** Fixed (e.g., 350px) or collapsible.
  - **Content:** Search filters, `WorkerList`, status summary.
  - **Z-Index:** High (overlays map edge or squeezes map).
- **Main View (`<DashboardMap />`):**
  - **Size:** Flex-grow (takes remaining space).
  - **Library:** Mapbox GL JS (via `react-map-gl`) or Leaflet. *Decision: Mapbox GL JS for performance with many markers.*

### 2.2. State Management (Server State)
- **Tool:** TanStack Query (React Query).
- **Key Query:** `['workers', { bounds, filters }]`.
- **Stale Time:** ~30 seconds (workers move, but not instantly).

## 3. Data Integration

### 3.1. Edge Function: `search-workers`
- **Trigger:** Map move (debounce 500ms) or Filter change.
- **Parameters:**
  ```json
  {
    "minLat": 49.20,
    "maxLat": 49.30,
    "minLng": -123.20,
    "maxLng": -123.00,
    "status": ["active", "idle"],
    "skills": ["locksmith"]
  }
  ```
- **Response:** Array of lightweight worker objects (ID, Lat, Lng, Status, AvatarURL).

## 4. Component Specifications

### 4.1. `DashboardPage` (Page Component)
- **Responsibility:** Orchestrates layout, holds `mapBounds` state, manages filter state.
- **Hook:** `useWorkerSearch(bounds, filters)` -> returns `{ workers, isLoading, error }`.

### 4.2. `DashboardMap`
- **Props:** `workers`, `onBoundsChange`.
- **Behavior:**
  - Renders the map base layer.
  - Renders `WorkerMarker` components.
  - Calls `onBoundsChange` on `moveend` event.

### 4.3. `WorkerMarker`
- **Props:** `worker` (Object).
- **Visuals:**
  - **Pin Color:** Green (Available), Yellow (Busy), Gray (Offline).
  - **Content:** Small avatar or status dot.
- **Interaction:**
  - **Hover:** Show tooltip (Name, Rating).
  - **Click:** Open `WorkerDetail` drawer or modal.

### 4.4. `WorkerList` (Sidebar)
- **Props:** `workers`, `isLoading`.
- **Behavior:**
  - Displays list of workers currently visible in the map viewport (or global search results if search is active).
  - **Item:** `<WorkerCard worker={worker} />`
    - Avatar, Name, Distance (calculated from map center), Status badge.
    - Click pans map to worker.

## 5. Implementation Steps

1.  **Scaffold:** Create `src/pages/Dashboard.tsx` and layout shell.
2.  **Map Integration:** Install map library, render base map.
3.  **State Setup:** Create `useWorkerSearch` hook with React Query.
4.  **Connect:** Wire map `onMoveEnd` to update `bounds` state.
5.  **Markers:** Render dummy markers, then real data.
6.  **Sidebar:** Implement `WorkerList` synchronized with map data.

## 6. Future Considerations (Phase 3+)
- **Real-time updates:** WebSocket subscription (Supabase Realtime) for live position updates of *visible* workers.
- **Clustering:** If worker count > 100, implement server-side or client-side clustering.
