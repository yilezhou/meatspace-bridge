import React from 'react';
import { User, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Worker } from './WorkerMarker';

interface WorkerListProps {
  workers: Worker[];
  isLoading?: boolean;
  onWorkerClick?: (worker: Worker) => void;
}

const statusLabels = {
  active: 'Available',
  idle: 'Busy',
  offline: 'Offline',
};

const statusBadgeColors = {
  active: 'bg-green-100 text-green-800',
  idle: 'bg-yellow-100 text-yellow-800',
  offline: 'bg-gray-100 text-gray-800',
};

export const WorkerList: React.FC<WorkerListProps> = ({ workers, isLoading, onWorkerClick }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <MapPin className="mb-2 h-10 w-10 opacity-20" />
        <p>No workers found in this area.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {workers.map((worker) => (
        <button
          key={worker.id}
          onClick={() => onWorkerClick?.(worker)}
          className="flex items-center gap-4 p-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
        >
          <div className="relative h-12 w-12 flex-shrink-0">
            {worker.avatar_url ? (
              <img
                src={worker.avatar_url}
                alt={worker.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-200 text-slate-500">
                <User className="h-6 w-6" />
              </div>
            )}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
              worker.status === 'active' ? 'bg-green-500' :
              worker.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-500'
            )} />
          </div>
          
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-slate-900">{worker.name}</h4>
            <div className="mt-1 flex items-center gap-2">
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                statusBadgeColors[worker.status]
              )}>
                {statusLabels[worker.status]}
              </span>
              <span className="text-xs text-slate-500">0.5 km away</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
