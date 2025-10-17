import React, {useEffect, useState} from 'react';
import axios from 'axios';
function formatLocalTime(tz){
  try {
    const now = new Date();
    const time = new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:tz}).format(now);
    const date = new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric',timeZone:tz}).format(now);
    return `${date} — ${time}`;
  } catch { return new Date().toISOString(); }
}
export default function CityCard({city}){
  const [timeStr,setTimeStr]=useState(formatLocalTime(city.tz));
  const [weather,setWeather]=useState(null);
  useEffect(()=>{const id=setInterval(()=>setTimeStr(formatLocalTime(city.tz)),1000);return()=>clearInterval(id);},[city.tz]);
  useEffect(()=>{axios.get('http://localhost:3001/api/weather',{params:{lat:city.lat,lon:city.lon}}).then(r=>setWeather(r.data));},[city.lat,city.lon]);
  return(
    <div style={{border:'1px solid #ddd',borderRadius:8,padding:12}}>
      <h3>{city.name}, {city.country_name}</h3>
      <div style={{fontSize:12,color:'#666'}}>{timeStr}</div>
      <div style={{marginTop:10,height:120,background:'#f2f2f2',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center'}}>City image here</div>
      <div style={{marginTop:10}}>{weather ? (<div>{weather.temp}°C — {weather.desc}</div>) : <div>Loading weather…</div>}</div>
    </div>
  );
}
