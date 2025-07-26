import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// All icons now point to local files in the `public` folder
const greenIcon = L.icon({
  iconUrl: '/green-icon.png',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
});

const yellowIcon = L.icon({
  iconUrl: '/warning-icon.png',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
});

const redIcon = L.icon({
  iconUrl: '/red-icon.png',
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
});

const severityIcons = {
  'Low': greenIcon,
  'Medium': yellowIcon,
  'High': redIcon
};

function App() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef({}); // To store references to marker layers

  // Marker state now includes severity
  const [markers, setMarkers] = useState([]);

  // Function to update a marker's severity
  const updateMarkerSeverity = (id, newSeverity) => {
    // Update the marker in the React state
    setMarkers(prevMarkers =>
      prevMarkers.map(marker =>
        marker.id === id ? { ...marker, severity: newSeverity } : marker
      )
    );
    // Update the icon on the map layer
    if (layerRef.current[id]) {
      layerRef.current[id].setIcon(severityIcons[newSeverity]);
    }
  };

  // Function to delete a marker
  const deleteMarker = (id) => {
    // Remove from the state
    setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== id));
    // Remove from the map
    if (layerRef.current[id]) {
      mapInstance.current.removeLayer(layerRef.current[id]);
      delete layerRef.current[id];
    }
  };

  useEffect(() => {
    // This effect runs only once to initialize the map
    if (mapInstance.current === null) {
      const position = [17.4483, 78.3915]; // Madhapur, Hyderabad
      const map = L.map(mapRef.current).setView(position, 15);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const newMarkerId = Date.now(); // Simple unique ID
        const newSeverity = 'Low'; // Default to Low severity

        // Add new marker to state with default severity
        const newMarkerData = { id: newMarkerId, lat, lng, severity: newSeverity };
        setMarkers(prevMarkers => [...prevMarkers, newMarkerData]);

        const popupContent = `
          <div class="popup-content">
            <b>Clogged Drain</b><br>
            <select id="severity-select-${newMarkerId}">
              <option value="Low">Low Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="High">High Severity</option>
            </select>
            <button id="delete-btn-${newMarkerId}">Delete Report</button>
          </div>
        `;

        const leafletMarker = L.marker([lat, lng], { icon: severityIcons[newSeverity] })
          .addTo(map)
          .bindPopup(popupContent);
        
        // Store the layer reference so we can access it later
        layerRef.current[newMarkerId] = leafletMarker;

        // Add event listeners to the popup's buttons AFTER it opens
        leafletMarker.on('popupopen', () => {
          // Set dropdown to current severity when popup opens
          const severitySelect = document.getElementById(`severity-select-${newMarkerId}`);
          if (severitySelect) severitySelect.value = markers.find(m => m.id === newMarkerId)?.severity || 'Low';

          // Add event listener for severity change
          if (severitySelect) {
            severitySelect.onchange = (event) => {
              updateMarkerSeverity(newMarkerId, event.target.value);
            };
          }

          // Add event listener for delete button
          const deleteBtn = document.getElementById(`delete-btn-${newMarkerId}`);
          if (deleteBtn) {
            deleteBtn.onclick = () => {
              deleteMarker(newMarkerId);
            };
          }
        });
      });
    }
  }, []); // Empty dependency array means this runs once on mount

  return (
    <>
      <div ref={mapRef} className="map-container" />
      <div className="sidebar">
        <h2>Reported Issues</h2>
        <ul>
          {markers.map((marker) => (
            <li key={marker.id}>
              Report #{marker.id} ({marker.severity})
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;