import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
if (!process.env.OPENWEATHER_API_KEY) {
  console.warn("⚠️ OPENWEATHER_API_KEY is not set. Weather routes will fail.");
}
// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// --- Helper to fetch weather + local time ---
async function getCityWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not fetch weather for ${city}`);
  }

  const data = await response.json();

  // Calculate local time using timezone offset (in seconds)
  const utcTime = new Date(Date.now() + new Date().getTimezoneOffset() * 60000);
  const localTime = new Date(utcTime.getTime() + data.timezone * 1000);

  return {
    city: data.name,
    country: data.sys.country,
    timezone: `UTC${data.timezone / 3600 >= 0 ? "+" : ""}${data.timezone / 3600}`,
    localTime: localTime.toISOString(),
    temperature: data.main.temp,
    description: data.weather[0].description,
    humidity: data.main.humidity,
    wind: data.wind.speed,
    icon: data.weather[0].icon
  };
}

// --- Route for single city (keep it for testing) ---
app.get("/api/city/:city", async (req, res) => {
  try {
    const cityData = await getCityWeather(req.params.city);
    res.json(cityData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NEW: Route to compare two cities ---
app.get("/api/compare/:city1/:city2", async (req, res) => {
  try {
    const { city1, city2 } = req.params;
    const [data1, data2] = await Promise.all([
      getCityWeather(city1),
      getCityWeather(city2)
    ]);

    res.json({ city1: data1, city2: data2 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React build (client/dist)
app.use(express.static(path.join(__dirname, "client", "dist")));

// Catch-all: let React Router handle non-API routes
app.get("*", (req, res) => {
  // If request starts with /api, skip to next (don’t override API)
  if (req.path.startsWith("/api")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));