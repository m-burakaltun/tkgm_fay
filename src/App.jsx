import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Default icon for Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function App() {
  const [mahalleId, setMahalleId] = useState('');
  const [parselNo, setParselNo] = useState('');
  const [adaNo, setAdaNo] = useState('');
  const [parselData, setParselData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const defaultCenter = [39.9334, 32.8597]; // Ankara koordinatları
  const defaultZoom = 7;

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setParselData(null);

    try {
      const response = await fetch('http://localhost:3000/parsel-sorgula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mahalle_id: mahalleId, parsel_no: parselNo, ada_no: adaNo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API isteği başarısız oldu.');
      }

      const data = await response.json();
      setParselData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>TKGM Parsel ve Fay Sorgulama</h1>
      </header>
      <div className="container">
        <div className="input-section">
          <input
            type="text"
            placeholder="Mahalle ID"
            value={mahalleId}
            onChange={(e) => setMahalleId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Parsel No"
            value={parselNo}
            onChange={(e) => setParselNo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Ada No (Opsiyonel)"
            value={adaNo}
            onChange={(e) => setAdaNo(e.target.value)}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Sorgulanıyor...' : 'Sorgula'}
          </button>
        </div>

        {error && <p className="error-message">Hata: {error}</p>}

        <div className="map-section">
          <MapContainer
            center={parselData?.parselKoordinat ? [parselData.parselKoordinat[1], parselData.parselKoordinat[0]] : defaultCenter}
            zoom={parselData?.parselKoordinat ? 13 : defaultZoom}
            style={{ height: '600px', width: '100%' }}
            key={JSON.stringify(parselData?.parselKoordinat)}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />

            {parselData?.parselKoordinat && (
              <Marker position={[parselData.parselKoordinat[1], parselData.parselKoordinat[0]]}>
                <Popup>Ada Parsel Konumu</Popup>
              </Marker>
            )}

            {parselData?.nearbyFaults &&
              parselData.nearbyFaults.map((fault, index) => {
                // Fay hattı bir LineString ise Polyline olarak çiz
                if (Array.isArray(fault.coordinates[0])) {
                  const polylinePositions = fault.coordinates.map(coord => [coord[1], coord[0]]);
                  return (
                    <Polyline key={index} positions={polylinePositions} color="red">
                      <Popup>{fault.name} ({fault.distance} km)</Popup>
                    </Polyline>
                  );
                } else { // Fay hattı bir Point ise Marker olarak çiz
                  return (
                    <Marker key={index} position={[fault.coordinates[1], fault.coordinates[0]]} icon={L.divIcon({className: 'fault-icon', html: `<div style="background-color: red; border-radius: 50%; width: 10px; height: 10px;"></div>`})}>
                      <Popup>{fault.name} ({fault.distance} km)</Popup>
                    </Marker>
                  );
                }
              })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;

