import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
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
  const [il, setIl] = useState('');
  const [ilce, setIlce] = useState('');
  const [parselNo, setParselNo] = useState('');
  const [adaNo, setAdaNo] = useState('');
  const [parselData, setParselData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const defaultCenter = [39.9334, 32.8597]; // Ankara koordinatları
  const defaultZoom = 7;

  const handleSearch = async () => {
    // Form validasyonu
    if (!il.trim() || !ilce.trim() || !parselNo.trim()) {
      setError('Lütfen il, ilçe ve parsel numarasını giriniz.');
      return;
    }

    setLoading(true);
    setError(null);
    setParselData(null);

    try {
      const response = await fetch('http://localhost:3000/parsel-sorgula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          il: il.trim(), 
          ilce: ilce.trim(), 
          parsel_no: parselNo.trim(), 
          ada_no: adaNo.trim() 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Parsel bulunamadı. Lütfen bilgileri kontrol ediniz.');
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
            placeholder="İl (örn: Ankara)"
            value={il}
            onChange={(e) => setIl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <input
            type="text"
            placeholder="İlçe (örn: Çankaya)"
            value={ilce}
            onChange={(e) => setIlce(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <input
            type="text"
            placeholder="Parsel No"
            value={parselNo}
            onChange={(e) => setParselNo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <input
            type="text"
            placeholder="Ada No (Opsiyonel)"
            value={adaNo}
            onChange={(e) => setAdaNo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Sorgulanıyor...' : 'Sorgula'}
          </button>
        </div>

        {error && <p className="error-message">Hata: {error}</p>}

        {parselData && (
          <div className="result-info">
            <h3>Parsel Bilgileri</h3>
            <p><strong>İl:</strong> {il}</p>
            <p><strong>İlçe:</strong> {ilce}</p>
            <p><strong>Parsel No:</strong> {parselNo}</p>
            {adaNo && <p><strong>Ada No:</strong> {adaNo}</p>}
            <p><strong>Bulunan Fay Sayısı:</strong> {parselData.nearbyFaults?.length || 0}</p>
            {parselData.nearbyFaults && parselData.nearbyFaults.length > 0 && (
              <div className="fault-list">
                <h4>50km Yarıçapındaki Faylar:</h4>
                <ul>
                  {parselData.nearbyFaults.map((fault, index) => (
                    <li key={index}>
                      {fault.name} - {fault.distance} km uzaklıkta
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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
              <>
                <Marker 
                  position={[parselData.parselKoordinat[1], parselData.parselKoordinat[0]]}
                  icon={L.divIcon({
                    className: 'parsel-icon', 
                    html: `<div style="background-color: blue; border-radius: 50%; width: 15px; height: 15px; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.7);"></div>`,
                    iconSize: [15, 15],
                    iconAnchor: [7.5, 7.5]
                  })}
                >
                  <Popup>
                    <strong>Parsel Konumu</strong><br/>
                    İl: {il}<br/>
                    İlçe: {ilce}<br/>
                    Parsel No: {parselNo}<br/>
                    {adaNo && `Ada No: ${adaNo}`}
                  </Popup>
                </Marker>
                
                {/* 50km yarıçapında daire */}
                <Circle
                  center={[parselData.parselKoordinat[1], parselData.parselKoordinat[0]]}
                  radius={50000} // 50km = 50000 metre
                  pathOptions={{
                    color: 'orange',
                    fillColor: 'orange',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                >
                  <Popup>50km Yarıçap - Fay Arama Alanı</Popup>
                </Circle>
              </>
            )}

            {parselData?.nearbyFaults &&
              parselData.nearbyFaults.map((fault, index) => {
                // Fay hattı bir LineString ise Polyline olarak çiz
                if (Array.isArray(fault.coordinates[0])) {
                  const polylinePositions = fault.coordinates.map(coord => [coord[1], coord[0]]);
                  return (
                    <Polyline 
                      key={index} 
                      positions={polylinePositions} 
                      color="red" 
                      weight={3}
                      opacity={0.8}
                    >
                      <Popup>{fault.name} ({fault.distance} km uzaklıkta)</Popup>
                    </Polyline>
                  );
                } else { // Fay hattı bir Point ise Marker olarak çiz
                  return (
                    <Marker 
                      key={index} 
                      position={[fault.coordinates[1], fault.coordinates[0]]} 
                      icon={L.divIcon({
                        className: 'fault-icon', 
                        html: `<div style="background-color: red; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                        iconSize: [12, 12],
                        iconAnchor: [6, 6]
                      })}
                    >
                      <Popup>{fault.name} ({fault.distance} km uzaklıkta)</Popup>
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

