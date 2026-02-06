# Frontend Architecture Spec - Phase 1: Meatspace-Bridge

**Date:** 2026-02-05
**Role:** Lead Frontend Architect
**Status:** Draft

## 1. Technology Stack

This project will utilize a modern, performance-oriented stack focused on developer experience and type safety.

*   **Build Tool:** [Vite](https://vitejs.dev/) (v5+) - For lightning-fast HMR and optimized builds.
*   **Framework:** [React](https://react.dev/) (v18+) - Component-based UI library.
*   **Language:** [TypeScript](https://www.typescriptlang.org/) (v5+) - Strict type safety is mandatory.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v3+) - Utility-first CSS framework.
*   **UI Component Library:** [shadcn/ui](https://ui.shadcn.com/) - Reusable components built with Radix UI and Tailwind CSS.
    *   *Rationale:* Provides accessibility out-of-the-box while allowing full customization via Tailwind.
*   **Icons:** `lucide-react` - Consistent, lightweight icon set.
*   **Maps:** `mapbox-gl` - Vector tile rendering for the core map interface.

## 2. Routing Architecture

We will use **React Router v6** (specifically the Data Router APIs like `createBrowserRouter`) to handle client-side routing.

### Route Definitions

| Path | Component | Description | Access |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | Public marketing/login entry point. | Public |
| `/dashboard` | `DashboardLayout` -> `DashboardView` | Main authenticated view. Displays the map, active task list, and status summary. | Auth Required |
| `/tasks/new` | `CreateTaskView` | Form interface for defining new physical tasks (location, bounty, description). | Auth Required |
| `/profile` | `ProfileView` | User settings, reputation score, and history. | Auth Required |

### Layout Structure
- **RootLayout:** Handles global providers (Theme, Auth, Toast).
- **AuthLayout:** Wraps public pages (Landing/Login).
- **DashboardLayout:** Wraps authenticated pages. Includes the persistent `Sidebar` or `TopNav` and the background `MapWrapper` context if needed.

## 3. State Management Strategy

We will adopt a **hybrid state management approach** to separate server state from client UI state.

### A. Server State: React Query (TanStack Query v5)
*   **Role:** Handling data fetching, caching, synchronization, and optimistic updates.
*   **Why:** Eliminates the need for global stores (Redux) to hold backend data.
*   **Keys:**
    *   `['tasks', 'list']`: Active tasks on the map.
    *   `['user', 'profile']`: Current user metadata.
    *   `['bounties', { id }]`: Specific bounty details.

### B. Client State: Zustand
*   **Role:** Managing strictly client-side UI state that needs to be accessed globally.
*   **Store: `useMapStore`**
    *   `viewState`: { latitude, longitude, zoom }
    *   `selectedTaskId`: ID of the task currently highlighted on the map.
    *   `filterSettings`: { showCompleted, minBounty, radius }
*   **Store: `useUIStore`**
    *   `isSidebarOpen`: Boolean toggles.
    *   `activeModal`: Null | 'create-task' | 'confirm-action'.

## 4. Map Integration (Mapbox GL JS)

Direct DOM manipulation by Mapbox must be isolated from React's virtual DOM to prevent reconciliation conflicts.

### Component: `<MapboxWrapper />`

**Responsibilities:**
1.  **Initialization:** Instantiate `new mapboxgl.Map()` inside a `useEffect` hook, targeting a ref `div`.
2.  **Cleanup:** Call `map.remove()` on unmount.
3.  **Reactive Props:** Watch props (e.g., `markers`, `zoom`) and update the map instance imperatively (e.g., `map.flyTo()`, `marker.setLngLat()`).

**Implementation Sketch:**

```tsx
// src/components/map/MapboxWrapper.tsx
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapStore } from '@/stores/map-store';

export const MapboxWrapper = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { viewState, setViewState } = useMapStore();

  useEffect(() => {
    if (map.current) return; // Initialize only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/dark-v11', // Cyberpunk aesthetic
      center: [viewState.lng, viewState.lat],
      zoom: viewState.zoom
    });

    map.current.on('move', () => {
      // Sync map movement back to global store
      const center = map.current!.getCenter();
      setViewState({
        lng: center.lng,
        lat: center.lat,
        zoom: map.current!.getZoom()
      });
    });
  }, []);

  return <div ref={mapContainer} className="h-full w-full absolute inset-0" />;
};
```

### Markers & Overlays
*   Use **React Portals** or `mapboxgl.Marker` with custom DOM elements to render React components inside the map canvas.
*   **`TaskMarker` Component:** A distinct UI component (pin) rendered into a DOM node, then attached to the map instance.

## 5. Folder Structure (Feature-First)

```text
src/
├── components/         # Generic shared UI (Button, Input - Shadcn)
├── features/           # Feature-based modules
│   ├── auth/           # Login/Signup logic
│   ├── map/            # Mapbox wrapper, layers, markers
│   ├── tasks/          # Task creation, listing, details
│   └── profile/        # User profile management
├── hooks/              # Global hooks (useDebounce)
├── lib/                # Utils (axios instance, tailwind merge)
├── routes/             # Route definitions
├── stores/             # Zustand stores
└── App.tsx
```

## 6. Next Steps
1.  Initialize Vite project with TypeScript.
2.  Install Tailwind & Shadcn UI.
3.  Set up React Router & basic layouts.
4.  Implement `MapboxWrapper` POC.
