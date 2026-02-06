import React from 'react';
import { Marker } from 'react-map-gl';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Worker {
  id: string;
  lat: number;
  lng: number;
  status: 'active' | 'idle' | 'offline';
  name: string;
  avatar_url?: string;
}

interface WorkerMarkerProps {
  worker: Worker;
  onClick?: (worker: Worker) => void;
}

const statusColors = {
  active: 'bg-green-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-500',
};

export const WorkerMarker: React.FC<WorkerMarkerProps> = ({ worker, onClick }) => {
  return (
    <Marker
      latitude={worker.lat}
      longitude={worker.lng}
      anchor="bottom"
      onClick={e => {
        // If we want to prevent map click events
        e.originalEvent.stopPropagation();
        onClick?.(worker);
      }}
    >
      <div className="group relative cursor-pointer">
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 scale-0 rounded bg-slate-900 px-2 py-1 text-xs text-white transition-all group-hover:scale-100">
          {worker.name}
        </div>
        
        {/* Marker Icon */}
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110",
          statusColors[worker.status]
        )}>
          {worker.avatar_url ? (
            <img src={worker.avatar_url} alt={worker.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-white" />
          )}
        </div>
        
        {/* Status indicator dot */}
        <div className={cn(
          "absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white",
          statusColors[worker.status]
        )} />
      </div>
    </Marker>
  );
};
