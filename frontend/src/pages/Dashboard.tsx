import React, { useState, useMemo } from 'react';
import { Search, Filter, Menu, X, Layers } from 'lucide-react';
import { WorkerList } from '@/components/features/map/WorkerList';
import { MapboxWrapper, type MapBounds } from '@/components/features/map/MapboxWrapper';
import type { Worker } from '@/components/features/map/WorkerMarker';

// Mock data for initial implementation
const MOCK_WORKERS: Worker[] = [
  { id: '1', name: 'John Doe', lat: 49.2827, lng: -123.1207, status: 'active' },
  { id: '2', name: 'Jane Smith', lat: 49.2785, lng: -123.1082, status: 'idle' },
  { id: '3', name: 'Bob Wilson', lat: 49.2859, lng: -123.1312, status: 'offline' },
];

const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [viewState, setViewState] = useState({
    latitude: 49.2827,
    longitude: -123.1207,
    zoom: 13
  });

  const filteredWorkers = useMemo(() => {
    return MOCK_WORKERS.filter(w => 
      w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleWorkerClick = (worker: Worker) => {
    setViewState({
      latitude: worker.lat,
      longitude: worker.lng,
      zoom: 15
    });
  };

  const handleBoundsChange = (newBounds: MapBounds) => {
    setBounds(newBounds);
    console.log('Map bounds updated:', newBounds);
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className={`
        absolute inset-y-0 left-0 z-20 flex w-80 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out md:relative
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:-ml-80'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h1 className="text-xl font-bold text-slate-900">Sentinel Nexus</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="border-b border-slate-100 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Filter className="h-3 w-3" />
              Filters
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Layers className="h-3 w-3" />
              Layers
            </button>
          </div>
        </div>

        {/* Worker List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nearby Workers ({filteredWorkers.length})
            </h2>
          </div>
          <WorkerList 
            workers={filteredWorkers} 
            onWorkerClick={handleWorkerClick}
          />
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-100 p-4 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            Meatspace Bridge v0.1.0
          </p>
        </div>
      </aside>

      {/* Main Content (Map) */}
      <main className="relative flex-1 bg-slate-200">
        {/* Toggle Button (when sidebar closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-md bg-white shadow-md hover:bg-slate-50"
          >
            <Menu className="h-6 w-6 text-slate-600" />
          </button>
        )}

        <MapboxWrapper
          workers={filteredWorkers}
          onBoundsChange={handleBoundsChange}
          onWorkerClick={handleWorkerClick}
          initialViewState={viewState}
        />

        {/* Map Overlays (Top Right Controls) */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <div className="flex flex-col overflow-hidden rounded-md bg-white shadow-md">
            <button className="border-b border-slate-100 p-2 hover:bg-slate-50">
              <span className="text-lg font-bold text-slate-600">+</span>
            </button>
            <button className="p-2 hover:bg-slate-50">
              <span className="text-lg font-bold text-slate-600">−</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
