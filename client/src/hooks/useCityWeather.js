import { useState, useEffect } from "react";

export default function useCityWeather(city) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!city) return;

    setLoading(true);
    fetch(`/api/city/${encodeURIComponent(city)}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch weather");
        return res.json();
      })
      .then(json => {
        setData(json);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [city]);

  return { data, loading, error };
}