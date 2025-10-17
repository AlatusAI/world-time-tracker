import React, { useState } from "react";
import useCityWeather from "./hooks/useCityWeather";
import WeatherCard from "./components/WeatherCard";

export default function App() {
  const [city, setCity] = useState("London");
  const { data, loading, error } = useCityWeather(city);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">World Time + Weather</h1>

      <input
        type="text"
        value={city}
        onChange={e => setCity(e.target.value)}
        placeholder="Enter city"
        className="border rounded px-3 py-2 mb-4 w-64"
      />

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {data && <WeatherCard weather={data} />}
    </div>
  );
}
