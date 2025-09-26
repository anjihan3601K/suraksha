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
  // Ref for the routing control layer
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    // This effect handles map initialization and updates.
    if (typeof window !== 'undefined' && mapContainerRef.current) {
      if (!mapRef.current) {
        // Initialize map if it doesn't exist
        mapRef.current = L.map(mapContainerRef.current, {
            scrollWheelZoom: false 
        }).setView(start, 13);

        // Add the OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);
      }

      const map = mapRef.current;

      // Clear previous routing control
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      
      // Initialize the Routing Control using OSRM (Open Source Routing Machine)
      const routingControl = (L.Routing as any).control({
          waypoints: [
              L.latLng(start[0], start[1]),
              L.latLng(end[0], end[1])
          ],
          routeWhileDragging: false,
          // Use OSRM as the routing engine (OpenStreetMap based)
          router: (L.Routing as any).osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1'
          }),
          // Customize the route line appearance
          lineOptions: {
              styles: [{ color: 'blue', opacity: 0.8, weight: 6 }]
          },
          // Hide the instructions panel initially, just show the map and path
          show: false, 
          // Use the custom icons for start/end markers
          createMarker: (i: number, waypoint: any, n: number) => {
              const icon = i === 0 ? defaultIcon : helpCenterIcon; // i=0 is start, i=n-1 is end
              return L.marker(waypoint.latLng, { icon: icon });
          }
      }).addTo(map);

      routingControlRef.current = routingControl;
      
      // Listen for the route calculation to finish and fit the map bounds to the entire route
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