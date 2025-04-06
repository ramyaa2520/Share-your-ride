import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
// Replace the CSS import with inline CSS that will be included during build
// import 'leaflet/dist/leaflet.css';

// LocationIQ API key
const API_KEY = 'pk.c61dfc5608103dcf469a185a22842c95';

const MapComponent = ({
  center = { lat: 28.6139, lng: 77.2090 }, // Default to Delhi, India
  zoom = 12,
  markers = [],
  polyline = null,
  height = '400px',
  width = '100%',
  onClick = null,
  onMarkerClick = null,
  showCurrentLocation = false
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize the map
  useEffect(() => {
    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      try {
        // Check if leaflet is already loaded
        if (!window.L) {
          // Use dynamic import to load leaflet
          const L = await import('leaflet');
          window.L = L.default || L;
          
          // Also import the CSS
          await import('leaflet/dist/leaflet.css');
          
          // Fix Leaflet's default icon paths
          delete window.L.Icon.Default.prototype._getIconUrl;
          window.L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
        }
        
        // Initialize map if container exists and map doesn't exist yet
        if (mapContainerRef.current && !mapInstanceRef.current) {
          // Create map instance
          const map = window.L.map(mapContainerRef.current).setView(
            [center.lat, center.lng], 
            zoom
          );
          
          // Add LocationIQ tile layer
          window.L.tileLayer(
            `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${API_KEY}`,
            {
              attribution: '© LocationIQ © OpenStreetMap contributors',
              maxZoom: 18
            }
          ).addTo(map);
          
          // Save map instance to ref
          mapInstanceRef.current = map;
          
          // Add click handler if provided
          if (onClick) {
            map.on('click', (event) => {
              onClick({
                lat: event.latlng.lat,
                lng: event.latlng.lng
              });
            });
          }
          
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map. Please try again later.');
        setLoading(false);
      }
    };
    
    loadLeaflet();
    
    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center and zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom]);

  // Handle markers
  useEffect(() => {
    const addMarkers = async () => {
      // Clear existing markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => {
          if (mapInstanceRef.current) {
            marker.remove();
          }
        });
        markersRef.current = [];
      }
      
      // Add new markers if map exists
      if (mapInstanceRef.current && markers.length > 0 && window.L) {
        markers.forEach(markerData => {
          // Create marker
          const marker = window.L.marker(
            [markerData.position.lat, markerData.position.lng],
            {
              title: markerData.title
            }
          ).addTo(mapInstanceRef.current);
          
          // Add popup if info is provided
          if (markerData.info) {
            marker.bindPopup(markerData.info);
          }
          
          // Add click handler if provided
          if (onMarkerClick) {
            marker.on('click', () => {
              onMarkerClick(markerData);
            });
          }
          
          // Save marker to ref
          markersRef.current.push(marker);
        });
      }
    };
    
    if (mapInstanceRef.current && window.L) {
      addMarkers();
    }
  }, [markers, onMarkerClick, mapInstanceRef.current]);

  // Handle polyline
  useEffect(() => {
    const drawPolyline = async () => {
      // Clear existing polyline
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      
      // Draw new polyline if map exists and path is provided
      if (mapInstanceRef.current && polyline && polyline.path && polyline.path.length > 1 && window.L) {
        // Convert path to array of latLng
        const path = polyline.path.map(point => [point.lat, point.lng]);
        
        // Create polyline
        const line = window.L.polyline(path, {
          color: polyline.options?.strokeColor || '#3388ff',
          weight: polyline.options?.strokeWeight || 3,
          opacity: polyline.options?.strokeOpacity || 1.0
        }).addTo(mapInstanceRef.current);
        
        // Save polyline to ref
        polylineRef.current = line;
        
        // Fit bounds if needed
        if (polyline.fitBounds !== false) {
          mapInstanceRef.current.fitBounds(line.getBounds());
        }
      }
    };
    
    if (mapInstanceRef.current && window.L) {
      drawPolyline();
    }
  }, [polyline, mapInstanceRef.current]);

  // Handle current location
  useEffect(() => {
    const getCurrentLocation = () => {
      if (showCurrentLocation && mapInstanceRef.current && window.L) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              
              // Clear existing current location marker
              if (currentLocationMarkerRef.current) {
                currentLocationMarkerRef.current.remove();
                currentLocationMarkerRef.current = null;
              }
              
              // Create a blue marker for current location
              const currentLocationIcon = window.L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
              });
              
              // Add marker for current location
              const marker = window.L.marker([latitude, longitude], {
                title: 'Your Location',
                icon: currentLocationIcon
              }).addTo(mapInstanceRef.current);
              
              marker.bindPopup('Your current location').openPopup();
              
              // Pan to current location
              mapInstanceRef.current.setView([latitude, longitude], zoom);
              
              // Save marker to ref
              currentLocationMarkerRef.current = marker;
            },
            (error) => {
              console.error('Error getting current location:', error);
              setError('Unable to get your current location.');
            }
          );
        } else {
          setError('Geolocation is not supported by your browser.');
        }
      }
    };
    
    if (showCurrentLocation && mapInstanceRef.current && window.L) {
      getCurrentLocation();
    }
    
    // Cleanup function
    return () => {
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.remove();
        currentLocationMarkerRef.current = null;
      }
    };
  }, [showCurrentLocation, zoom, mapInstanceRef.current]);

  // Handle map resize on window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Box sx={{ position: 'relative', height, width }}>
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1000
        }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box 
        ref={mapContainerRef} 
        sx={{ 
          height: '100%', 
          width: '100%',
          '& .leaflet-container': {
            height: '100%',
            width: '100%',
            zIndex: 1
          }
        }} 
      />
    </Box>
  );
};

export default MapComponent; 