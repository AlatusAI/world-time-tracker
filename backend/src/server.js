import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

console.log("🔑 Loaded API key:", OPENWEATHER_API_KEY ? "✅" : "❌ MISSING");

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- Helper to fetch weather + local time + coords ---
async function getCityWeather(city) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("OPENWEATHER_API_KEY is not set");
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${OPENWEATHER_API_KEY}&units=metric`;

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`⚠️ Could not fetch weather for ${city}`);
    return {
      city,
      country: "N/A",
      lat: null,
      lon: null,
      localTime: new Date().toISOString(),
      temperature: null,
      description: "Unavailable",
      humidity: null,
      wind: null,
      icon: null,
    };
  }

  const data = await response.json();

  // Calculate local time using timezone offset
  const utcTime = new Date(Date.now() + new Date().getTimezoneOffset() * 60000);
  const localTime = new Date(utcTime.getTime() + data.timezone * 1000);

  return {
    city: data.name,
    country: data.sys.country,
    lat: data.coord.lat,
    lon: data.coord.lon,
    localTime: localTime.toISOString(), // normalized camelCase
    temperature: data.main.temp,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    wind: data.wind.speed,
    icon: data.weather[0].icon,
  };
}

// --- Route for single city ---
app.get("/api/city/:city", async (req, res) => {
  try {
    const cityData = await getCityWeather(req.params.city);
    res.json(cityData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Route to compare two cities ---
app.get("/api/compare/:city1/:city2", async (req, res) => {
  const { city1, city2 } = req.params;
  console.log("🔍 Compare route hit:", city1, city2);

  try {
    const [data1, data2] = await Promise.all([
      getCityWeather(city1),
      getCityWeather(city2),
    ]);

    res.json({
      city1: { ...data1 },
      city2: { ...data2 },
    });
  } catch (err) {
    console.error("Compare error:", err);
    res.status(500).json({ error: "Failed to fetch comparison" });
  }
});

// --- Serve frontend in production ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../client/dist")));

  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.join(__dirname, "../../client/dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});