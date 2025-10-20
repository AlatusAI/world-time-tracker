import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Helper to auto-fit map bounds to both cities
function FitBounds({ city1, city2 }) {
  const map = useMap();
  useEffect(() => {
    if (city1 && city2 && city1.lat && city2.lat) {
      const bounds = [
        [city1.lat, city1.lon],
        [city2.lat, city2.lon],
      ];
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [city1, city2, map]);
  return null;
}

export default function CompareView() {
  const [mode, setMode] = useState("compare");
  const [city1, setCity1] = useState("London");
  const [city2, setCity2] = useState("Tokyo");
  const [singleCity, setSingleCity] = useState("London");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Fetch single city ---
  const fetchSingle = () => {
    if (!singleCity) return;
    setLoading(true);
    fetch("/api/city/" + encodeURIComponent(singleCity))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch city");
        return res.json();
      })
      .then((json) => {
        console.log("Single city API response:", json);
        setData(json);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // --- Fetch comparison ---
  const fetchComparison = () => {
    if (!city1 || !city2) return;
    setLoading(true);
    fetch(
      "/api/compare/" +
        encodeURIComponent(city1) +
        "/" +
        encodeURIComponent(city2)
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch comparison");
        return res.json();
      })
      .then((json) => {
        console.log("Compare API response:", json);
        setData(json);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // --- Render marker with permanent tooltip card ---
  const renderMarker = (c, color) => {
    if (!c || !c.lat || !c.lon) return null;

    const icon = new L.Icon({
      iconUrl:
        color === "blue"
          ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          : "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
      iconSize: [32, 32],
    });

    return (
      <Marker position={[c.lat, c.lon]} icon={icon}>
        <Tooltip permanent direction="top" offset={[0, -20]} opacity={1}>
          <div
            className="w-56 h-48 rounded-lg text-white flex flex-col justify-end p-3 shadow-lg"
            style={{
              backgroundImage: `url(https://source.unsplash.com/400x300/?${c.city})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h3 className="font-bold text-lg">
              {c.city}, {c.country}
            </h3>
            <p>{c.temperature}°C — {c.description}</p>
            <p>Humidity: {c.humidity}% | Wind: {c.wind} m/s</p>
            <p>
              {c.localTime
                ? new Date(c.localTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </p>
          </div>
        </Tooltip>
      </Marker>
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-6">
      {/* Title + controls */}
      <h1 className="text-4xl font-bold text-gray-800 mb-6 z-10">
        {mode === "single" ? "Single City Weather" : "Compare Cities"}
      </h1>

      <div className="flex gap-4 mb-6 z-10">
        <button
          onClick={() => {
            setMode("single");
            setData(null);
          }}
          className={`px-4 py-2 rounded ${
            mode === "single" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
        >
          Single City
        </button>
        <button
          onClick={() => {
            setMode("compare");
            setData(null);
          }}
          className={`px-4 py-2 rounded ${
            mode === "compare" ? "bg-blue-700 text-white" : "bg-gray-200"
          }`}
        >
          Compare Cities
        </button>
      </div>

      {/* Inputs */}
      {mode === "single" ? (
        <div className="flex gap-4 mb-6 z-10">
          <input
            type="text"
            value={singleCity}
            onChange={(e) => setSingleCity(e.target.value)}
            placeholder="Enter city"
            className="border rounded px-3 py-2 w-40"
          />
          <button
            onClick={fetchSingle}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Get Weather
          </button>
        </div>
      ) : (
        <div className="flex gap-4 mb-6 z-10">
          <input
            type="text"
            value={city1}
            onChange={(e) => setCity1(e.target.value)}
            placeholder="City 1"
            className="border rounded px-3 py-2 w-40"
          />
          <input
            type="text"
            value={city2}
            onChange={(e) => setCity2(e.target.value)}
            placeholder="City 2"
            className="border rounded px-3 py-2 w-40"
          />
          <button
            onClick={fetchComparison}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Compare
          </button>
        </div>
      )}

      {/* Loading / error */}
      {loading && <p className="text-gray-700 z-10">Loading...</p>}
      {error && <p className="text-red-500 z-10">{error}</p>}

      {/* Map always visible */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution=""
          />
          {mode === "compare" && data && (
            <>
              <FitBounds city1={data.city1} city2={data.city2} />
              {renderMarker(data.city1, "blue")}
              {renderMarker(data.city2, "red")}
            </>
          )}
        </MapContainer>
      </div>

      {/* Single city fallback card */}
      {mode === "single" && data && (
        <div className="mt-6 z-10 bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2">
            {data.city}, {data.country}
          </h2>
          <p>{data.temperature}°C — {data.description}</p>
          <p>Humidity: {data.humidity}% | Wind: {data.wind} m/s</p>
          <p>
            {new Date(data.localTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}