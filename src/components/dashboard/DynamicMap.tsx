// src/components/dashboard/DynamicMap.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import L, { LatLngExpression, Polyline as LeafletPolyline, Marker as LeafletMarker } from 'leaflet';

// 📚 Leaflet Core Styles
import 'leaflet/dist/leaflet.css';

// 🛣️ Leaflet Routing Machine Library and Styles
import 'leaflet-routing-machine'; 
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'; 

// Fix for default Leaflet icons (Blue Marker for Start)
const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom icon for the Help Center (Green Marker for End)
const helpCenterIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


interface DynamicMapProps {
  start: [number, number]; // [lat, lng]
  end: [number, number];   // [lat, lng]
  pathString: string;      // The textual path description (unused in map logic, but kept for interface consistency)
}

const DynamicMap = ({ start, end, pathString }: DynamicMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routingControlRef = useRef<any>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const fallbackRouteRef = useRef<LeafletPolyline | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = mapContainerRef.current;
    if (!container) return;

    try {
      if (!mapRef.current) {
        mapRef.current = L.map(container, {
          scrollWheelZoom: false,
        }).setView(start, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);

        markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      const map = mapRef.current;
      if (!map) return;

      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }

      if (markerLayerRef.current) {
        markerLayerRef.current.clearLayers();
      }
      if (fallbackRouteRef.current) {
        fallbackRouteRef.current.remove();
        fallbackRouteRef.current = null;
      }

      L.marker(start, { icon: defaultIcon }).addTo(markerLayerRef.current!);
      L.marker(end, { icon: helpCenterIcon }).addTo(markerLayerRef.current!);

      const routingApi = (L as any).Routing;
      if (!routingApi || typeof routingApi.control !== 'function' || typeof routingApi.osrmv1 !== 'function') {
        fallbackRouteRef.current = L.polyline([start, end], { color: 'red', opacity: 0.8, dashArray: '6 6' }).addTo(map);
        map.fitBounds(L.latLngBounds([start, end]).pad(0.12));
        return;
      }

      const routingControl = routingApi.control({
        waypoints: [
          L.latLng(start[0], start[1]),
          L.latLng(end[0], end[1]),
        ],
        routeWhileDragging: false,
        router: routingApi.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
        }),
        lineOptions: {
          styles: [{ color: 'blue', opacity: 0.8, weight: 6 }],
        },
        show: false,
        createMarker: (i: number, waypoint: any) => {
          const icon = i === 0 ? defaultIcon : helpCenterIcon;
          return L.marker(waypoint.latLng, { icon });
        },
      }).addTo(map);

      routingControlRef.current = routingControl;

      routingControl.on('routesfound', (e: any) => {
        const routes = e.routes;
        if (routes.length > 0) {
          const bounds = routes[0].coordinates.reduce(
            (b: L.LatLngBounds, p: L.LatLng) => b.extend(p),
            L.latLngBounds(routes[0].coordinates[0], routes[0].coordinates[0])
          );
          map.fitBounds(bounds.pad(0.1));
        }
      });

      routingControl.on('routingerror', () => {
        if (fallbackRouteRef.current) {
          fallbackRouteRef.current.remove();
          fallbackRouteRef.current = null;
        }
        fallbackRouteRef.current = L.polyline([start, end], { color: 'red', opacity: 0.8, dashArray: '6 6' }).addTo(map);
        map.fitBounds(L.latLngBounds([start, end]).pad(0.12));
      });
    } catch (error) {
      console.error('DynamicMap initialization failed:', error);
    }
  }, [start, end, pathString]); // Dependency array: re-run if coordinates change

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // The map container element
  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%', borderRadius: 'var(--radius)' }} />;
};

export default DynamicMap;