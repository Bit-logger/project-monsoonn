import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import './App.css';

// FINAL FIX: Hardcoding the full path for deployment
const greenIcon = L.icon({
  iconUrl: `/project-monsoonn/green-icon.png`,
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
});

const yellowIcon = L.icon({
  iconUrl: `/project-monsoonn/warning-icon.png`,
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
});

const redIcon = L.icon({
  iconUrl: `/project-monsoonn/red-icon.png`,
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
});

const severityIcons = {
  'Low': greenIcon,
  'Medium': yellowIcon,
  'High': redIcon
};

// Style for the drawn flood zones
const floodZoneStyle = {
  color: "red",
  weight: 2,
  fillColor: "#f03",
  fillOpacity: 0.5,
};

function App() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef({});
  const drawnItemsRef = useRef(null);

  const [markers, setMarkers] = useState([]);
  const [drawnShapes, setDrawnShapes] = useState([]);

  // Function to update a marker's severity
  const updateMarkerSeverity = (id, newSeverity) => {
    setMarkers(prevMarkers =>
      prevMarkers.map(marker =>
        marker.id === id ? { ...marker, severity: newSeverity } : marker
      )
    );
    if (layerRef.current[id]) {
      layerRef.current[id].setIcon(severityIcons[newSeverity]);
    }
  };

  // Function to delete a marker
  const deleteMarker = (id) => {
    setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== id));
    if (layerRef.current[id]) {
      mapInstance.current.removeLayer(layerRef.current[id]);
      delete layerRef.current[id];
    }
  };

  // This effect runs only once to initialize the map
  useEffect(() => {
    if (mapInstance.current === null) {
      const position = [17.4483, 78.3915]; // Madhapur, Hyderabad
      const map = L.map(mapRef.current).setView(position, 15);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      // Initialize the draw control in the top-right corner
      const drawControl = new L.Control.Draw({
        position: 'topright',
        edit: { featureGroup: drawnItems },
        draw: {
          polygon: true,
          rectangle: true,
          circle: true,
          polyline: false,
          marker: false
        }
      });
      map.addControl(drawControl);

      // Event handler for when a shape is created
      map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        layer.setStyle(floodZoneStyle); // Apply our custom style
        drawnItems.addLayer(layer);
        setDrawnShapes(prevShapes => [...prevShapes, layer.toGeoJSON()]);
      });

      // Event handler for adding markers on click
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const newMarkerId = Date.now();
        const newSeverity = 'Low';

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
        
        layerRef.current[newMarkerId] = leafletMarker;

        leafletMarker.on('popupopen', () => {
          const severitySelect = document.getElementById(`severity-select-${newMarkerId}`);
          if (severitySelect) severitySelect.value = markers.find(m => m.id === newMarkerId)?.severity || 'Low';
          
          if (severitySelect) {
            severitySelect.onchange = (event) => updateMarkerSeverity(newMarkerId, event.target.value);
          }
          
          const deleteBtn = document.getElementById(`delete-btn-${newMarkerId}`);
          if (deleteBtn) {
            deleteBtn.onclick = () => deleteMarker(newMarkerId);
          }
        });
      });
    }
  }, []);

  return (
    <>
      <div ref={mapRef} className="map-container" />
      <div className="sidebar">
        <h2>Reported Issues</h2>
        <ul>
          {markers.map((marker) => (
            <li key={marker.id}>
              Lat: {marker.lat.toFixed(4)}, Lng: {marker.lng.toFixed(4)}
              <br/>
              <small>Severity: {marker.severity}</small>
            </li>
          ))}
        </ul>
        <hr/>
        <h2>Drawn Flood Zones</h2>
        <ul>
          {drawnShapes.map((shape, index) => (
            <li key={index}>
              Zone {index + 1} ({shape.geometry.type})
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
