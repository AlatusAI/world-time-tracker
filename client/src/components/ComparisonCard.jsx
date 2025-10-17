export default function ComparisonCard({ cityA, cityB }) {
  if (!cityA || !cityB) return null;

  const tA = new Date(cityA.localTime);
  const tB = new Date(cityB.localTime);
  const diffMs = Math.abs(tA - tB);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

  const tempDelta = Math.round(cityA.temperature - cityB.temperature);
  const humidityDelta = cityA.humidity - cityB.humidity;
  const windDelta = (cityA.wind - cityB.wind).toFixed(2);

  return (
    <div className="bg-yellow-200/20 backdrop-blur rounded-xl shadow-lg p-4 w-full max-w-2xl border border-yellow-300/30 mt-6">
      <h3 className="text-lg font-bold mb-2">Comparison</h3>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div className="bg-white/10 rounded p-3 border border-white/20">
          <div className="text-white/70">Time difference</div>
          <div className="font-semibold">{diffHours}h {diffMinutes}m</div>
        </div>
        <div className="bg-white/10 rounded p-3 border border-white/20">
          <div className="text-white/70">Temperature delta</div>
          <div className="font-semibold">{tempDelta}°C</div>
        </div>
        <div className="bg-white/10 rounded p-3 border border-white/20">
          <div className="text-white/70">Humidity delta</div>
          <div className="font-semibold">{humidityDelta}%</div>
        </div>
        <div className="bg-white/10 rounded p-3 border border-white/20">
          <div className="text-white/70">Wind delta</div>
          <div className="font-semibold">{windDelta} m/s</div>
        </div>
      </div>
    </div>
  );
}
