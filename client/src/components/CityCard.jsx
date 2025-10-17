export default function CityCard({ data, title = null }) {
  if (!data) return null;

  const time = new Date(data.localTime);
  const timeStr = time.toLocaleString();

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl shadow-lg p-4 w-80 border border-white/20">
      <h2 className="text-xl font-bold">
        {title ?? `${data.city}, ${data.country}`}
      </h2>
      <p className="text-sm text-white/80 mt-1">{timeStr}</p>

      <div className="flex items-center gap-3 mt-3">
        <img
          src={`https://openweathermap.org/img/wn/${data.icon}.png`}
          alt={data.description}
          className="h-10 w-10"
        />
        <div>
          <div className="text-3xl font-semibold">
            {Math.round(data.temperature)}°C
          </div>
          <div className="text-white/80 text-sm capitalize">
            {data.description}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
        <div className="bg-white/5 rounded p-2 border border-white/10">
          <div className="text-white/60">Humidity</div>
          <div className="font-semibold">{data.humidity}%</div>
        </div>
        <div className="bg-white/5 rounded p-2 border border-white/10">
          <div className="text-white/60">Wind</div>
          <div className="font-semibold">{data.wind} m/s</div>
        </div>
        <div className="bg-white/5 rounded p-2 border border-white/10">
          <div className="text-white/60">TZ</div>
          <div className="font-semibold">{data.timezone}</div>
        </div>
      </div>
    </div>
  );
}
