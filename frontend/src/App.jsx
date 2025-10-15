import React, {useState, useEffect} from 'react';
import axios from 'axios';
import CityCard from './CityCard';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function App() {
  const [city, setCity] = useState(null);
  useEffect(()=> {
    axios.get('http://localhost:3001/api/city/1').then(r => setCity(r.data));
  }, []);
  return (
    <div style={{display:'flex', gap:20, padding:20}}>
      <div style={{width:400}}>
        {city ? <CityCard city={city}/> : <div>Loading…</div>}
      </div>
      <div style={{flex:1, minHeight:400}}>
        {city && (
          <MapContainer center={[city.lat, city.lon]} zoom={12} style={{height:400}}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            <Marker position={[city.lat, city.lon]}><Popup>{city.name}</Popup></Marker>
          </MapContainer>
        )}
      </div>
    </div>
  );
}
