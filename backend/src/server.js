import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// For Node < 18, uncomment:
// import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// ---------------- Helpers ----------------

function normalizeCityQuery(city) {
  const c = (city || "").trim().toLowerCase();
  if (c === "washington") return "Washington, D.C.,US";
  if (c === "dili") return "Dili,TL";
  return city;
}

async function fetchCityImage(cityName) {
  const normalized = (cityName || "").trim();

  // Try Wikipedia search → summary
  try {
    const searchUrl =
      `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
      `&list=search&srsearch=${encodeURIComponent(normalized)}`;
    const res = await fetch(searchUrl);
    if (res.ok) {
      const json = await res.json();
      const firstTitle = json?.query?.search?.[0]?.title;
      if (firstTitle) {
        const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`;
        const pageRes = await fetch(pageUrl, { headers: { accept: "application/json" } });
        if (pageRes.ok) {
          const pageJson = await pageRes.json();
          const img = pageJson?.originalimage?.source || pageJson?.thumbnail?.source || null;
          if (img) return img;
        }
      }
    }
  } catch (_) {}

  // Try direct summary by name
  try {
    const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalized)}`;
    const res = await fetch(pageUrl, { headers: { accept: "application/json" } });
    if (res.ok) {
      const json = await res.json();
      const img = json?.originalimage?.source || json?.thumbnail?.source || null;
      if (img) return img;
    }
  } catch (_) {}

  // Fallback to Unsplash
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(`${normalized},city,skyline`)}`;
}

async function geocodeCity(city) {
  const q = normalizeCityQuery(city);
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status} ${res.statusText}`);
  const arr = await res.json();
  if (!arr.length) throw new Error("City not found");
  return {
    lat: arr[0].lat,
    lon: arr[0].lon,
    name: arr[0].name,
    country: arr[0].country,
    state: arr[0].state || null
  };
}

async function fetchTimeZoneId(lat, lon) {
  const tsSec = Math.floor(Date.now() / 1000);
  const tzUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${tsSec}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(tzUrl);
  if (!res.ok) return "UTC";
  const json = await res.json();
  if (json.status !== "OK") return "UTC";
  return json.timeZoneId || "UTC";
}

async function getCityWeather(city) {
  if (!OPENWEATHER_API_KEY) throw new Error("OPENWEATHER_API_KEY is not set");
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not set");

  const geo = await geocodeCity(city);

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${geo.lat}&lon=${geo.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) throw new Error(`Weather fetch failed: ${weatherRes.status} ${weatherRes.statusText}`);
  const data = await weatherRes.json();

  const timeZoneId = await fetchTimeZoneId(geo.lat, geo.lon);
  const imageUrl = await fetchCityImage(geo.name);

  return {
    city: geo.name,
    country: geo.country,
    lat: geo.lat,
    lon: geo.lon,
    utcEpochMs: Date.now(),
    timeZoneId,
    temperature: data?.main?.temp ?? null,
    description: data?.weather?.[0]?.description ?? null,
    humidity: data?.main?.humidity ?? null,
    wind: data?.wind?.speed ?? null,
    icon: data?.weather?.[0]?.icon ?? null,
    sunrise: data?.sys?.sunrise ? data.sys.sunrise * 1000 : null,
    sunset: data?.sys?.sunset ? data.sys.sunset * 1000 : null,
    imageUrl
  };
}

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateFlight(lat1, lon1, lat2, lon2) {
  const distanceKm = haversine(lat1, lon1, lat2, lon2);
  const avgSpeedKmH = 900; // commercial jet cruise
  const hours = distanceKm / avgSpeedKmH;
  return { distanceKm, hours };
}

// ---------------- Routes ----------------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/city/:city", async (req, res) => {
  try {
    const cityData = await getCityWeather(req.params.city);
    res.json(cityData);
  } catch (err) {
    console.error("City route error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/compare/:city1/:city2", async (req, res) => {
  try {
    const [data1, data2] = await Promise.all([
      getCityWeather(req.params.city1),
      getCityWeather(req.params.city2),
    ]);
    const { distanceKm, hours } = estimateFlight(
      data1.lat, data1.lon, data2.lat, data2.lon
    );
    res.json({ city1: data1, city2: data2, flightHours: hours, distanceKm });
  } catch (err) {
    console.error("Compare route error:", err);
    res.status(500).json({ error: "Failed to fetch comparison" });
  }
});

// Autocomplete search suggestions
app.get("/api/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${OPENWEATHER_API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Search failed: ${r.status} ${r.statusText}`);
    const arr = await r.json();
    const results = arr.map(c => ({
      name: c.name,
      country: c.country,
      state: c.state || null,
      lat: c.lat,
      lon: c.lon
    }));
    res.json(results);
  } catch (err) {
    console.error("Search route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 5-day forecast (daily highs/lows via 3h intervals)
app.get("/api/forecast/:city", async (req, res) => {
  try {
    const geo = await geocodeCity(req.params.city);
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${geo.lat}&lon=${geo.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Forecast fetch failed: ${r.status} ${r.statusText}`);
    const data = await r.json();

    const days = {};
    data.list.forEach((entry) => {
      const date = new Date(entry.dt * 1000).toISOString().split("T")[0];
      if (!days[date]) days[date] = { temps: [], icons: [], desc: [] };
      days[date].temps.push(entry.main.temp);
      days[date].icons.push(entry.weather[0].icon);
      days[date].desc.push(entry.weather[0].description);
    });

    const forecast = Object.entries(days).slice(0, 5).map(([date, info]) => {
      const avg = info.temps.reduce((a, b) => a + b, 0) / info.temps.length;
      return {
        date,
        avgTemp: Math.round(avg),
        min: Math.min(...info.temps),
        max: Math.max(...info.temps),
        icon: info.icons[0],
        description: info.desc[0]
      };
    });

    res.json({ city: geo.name, country: geo.country, forecast });
  } catch (err) {
    console.error("Forecast route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// NEW: Air Quality Index
app.get("/api/aqi/:city", async (req, res) => {
  try {
    const geo = await geocodeCity(req.params.city);
    const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${geo.lat}&lon=${geo.lon}&appid=${OPENWEATHER_API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`AQI fetch failed: ${r.status} ${r.statusText}`);
    const json = await r.json();
    const first = json?.list?.[0];
    const aqi = first?.main?.aqi ?? null;
    const comps = first?.components ?? null;
    res.json({
      city: geo.name,
      country: geo.country,
      aqi,
      components: comps
        ? {
            pm2_5: comps.pm2_5,
            pm10: comps.pm10,
            o3: comps.o3,
            no2: comps.no2
          }
        : null
    });
  } catch (err) {
    console.error("AQI route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- Static (production) ----------------
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

// ---------------- Start ----------------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});