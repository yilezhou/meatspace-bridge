import React, { useEffect, useRef, useState } from 'react';
import Map, { MapRef, ViewStateChangeEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { WorkerMarker, Worker } from './WorkerMarker';

// Access token from environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface MapboxWrapperProps {
  workers: Worker[];
  onBoundsChange?: (bounds: MapBounds) => void;
  onWorkerClick?: (worker: Worker) => void;
  initialViewState?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
}

const DEFAULT_VIEW_STATE = {
  latitude: 49.2827, // Vancouver
  longitude: -123.1207,
  zoom: 12,
};

/**
 * MapboxWrapper Component
 * Handles map initialization, marker rendering, and bounds change events.
 */
export const MapboxWrapper: React.FC<MapboxWrapperProps> = ({
  workers,
  onBoundsChange,
  onWorkerClick,
  initialViewState = DEFAULT_VIEW_STATE,
}) => {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState(initialViewState);

  // Function to calculate and emit current map bounds
  const updateBounds = () => {
    if (!mapRef.current) return;
    
    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    
    if (onBoundsChange) {
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      });
    }
  };

  // Initial bounds emission on mount
  useEffect(() => {
    if (mapRef.current) {
      updateBounds();
    }
  }, []);

  const handleMoveEnd = (e: ViewStateChangeEvent) => {
    setViewState(e.viewState);
    updateBounds();
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
        Mapbox token missing. Please set VITE_MAPBOX_TOKEN.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Map
        {...viewState}
        ref={mapRef}
        onMove={evt => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {/* Render markers for each worker */}
        {workers.map((worker) => (
          <WorkerMarker 
            key={worker.id} 
            worker={worker} 
            onClick={onWorkerClick}
          />
        ))}
      </Map>
    </div>
  );
};

export default MapboxWrapper;
