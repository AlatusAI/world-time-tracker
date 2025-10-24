import React, { useRef, useEffect } from "react";
import Globe from "react-globe.gl";

// Format local time using UTC epoch + IANA zone
function formatLocalTime(utcEpochMs, timeZoneId) {
  if (!utcEpochMs || !timeZoneId) return "—";
  try {
    const formatter = new Intl.DateTimeFormat([], {
      timeZone: timeZoneId,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    return formatter.format(new Date(utcEpochMs));
  } catch {
    return "—";
  }
}

function getTzAbbr(utcEpochMs, timeZoneId) {
  try {
    const parts = new Intl.DateTimeFormat([], {
      timeZone: timeZoneId,
      timeZoneName: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date(utcEpochMs));
    return parts.find((p) => p.type === "timeZoneName")?.value || "";
  } catch {
    return "";
  }
}

export default function WorldGlobe({ cities }) {
  const globeRef = useRef();

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  return (
    <Globe
      ref={globeRef}
      width={window.innerWidth}
      height={window.innerHeight}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
      labelsData={cities}
      labelLat={(d) => d.lat}
      labelLng={(d) => d.lon}
      labelText={(d) => `${d.city}, ${d.country}`}
      labelSize={1.5}
      labelColor={() => "white"}
      labelTooltip={(d) => {
        const timeStr = formatLocalTime(d.utcEpochMs, d.timeZoneId);
        const tzAbbr = getTzAbbr(d.utcEpochMs, d.timeZoneId);
        return [
          `${d.city}, ${d.country}`,
          `Time: ${timeStr}${tzAbbr ? ` (${tzAbbr})` : ""}`,
          `Temp: ${d.temperature ?? "—"}°C`,
          `Weather: ${d.description ?? "—"}`,
          `Humidity: ${d.humidity ?? "—"}%`,
          `Wind: ${d.wind ?? "—"} m/s`,
        ].join("\n");
      }}
    />
  );
}