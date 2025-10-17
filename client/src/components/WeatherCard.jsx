import React from "react";

export default function WeatherCard({ weather }) {
  if (!weather) return null;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 w-64">
      <h2 className="text-xl font-bold mb-2">
        {weather.city}, {weather.country}
      </h2>
      <p className="text-gray-600">{weather.description}</p>
      <p className="text-2xl font-semibold">{weather.temperature}°C</p>
      <p className="text-sm">Humidity: {weather.humidity}%</p>
      <p className="text-sm">Wind: {weather.wind} m/s</p>
      <p className="text-sm">
        Local time: {new Date(weather.localTime).toLocaleString()}
      </p>
    </div>
  );
}
