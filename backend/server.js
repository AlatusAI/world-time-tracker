require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
const NodeCache = require('node-cache');
const app = express();
app.use(cors());
app.use(express.json());
const cache = new NodeCache({ stdTTL: 600 });

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'q required' });
  res.json([{ id: 1, name: 'Dili', country_name: 'Timor-Leste', lat: -8.556858, lon: 125.560324, tz: 'Asia/Dili', images: [] }]);
});

app.get('/api/city/:id', async (req, res) => {
  const id = Number(req.params.id || 0);
  if (id === 1) {
    return res.json({
      id: 1, name: 'Dili', country_name: 'Timor-Leste',
      lat: -8.556858, lon: 125.560324, tz: 'Asia/Dili', images: []
    });
  }
  res.status(404).json({ error: 'not found' });
});

app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
  const key = `weather:${lat},${lon}`;
  let data = cache.get(key);
  if (data) return res.json(data);

  const keyApi = process.env.OPENWEATHER_API_KEY;
  if (!keyApi) return res.status(500).json({ error: 'missing OPENWEATHER_API_KEY' });

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${keyApi}`;
  try {
    const r = await fetch(url);
    const json = await r.json();
    const out = { temp: json.main?.temp, desc: json.weather?.[0]?.description, icon: json.weather?.[0]?.icon };
    cache.set(key, out);
    res.json(out);
  } catch (e) {
    console.error('weather error', e);
    res.status(500).json({ error: 'weather fetch failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
