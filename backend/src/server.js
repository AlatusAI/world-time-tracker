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

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- Helper to fetch weather + local time ---
async function getCityWeather(city) {
  if (!OPENWEATHER_API_KEY) {
    throw new Error("OPENWEATHER_API_KEY is not set");
  }

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