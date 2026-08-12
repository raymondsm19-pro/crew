/**
 * Small popup that shows where a punch happened on a map, using a keyless
 * OpenStreetMap embed plus a link out to Google Maps for directions.
 */
export type MapPoint = {
  label: string;
  lat: number;
  lng: number;
  accuracy?: number | null;
  detail?: string;
};

export function ClockInMap({ point, onClose }: { point: MapPoint; onClose: () => void }) {
  const { lat, lng } = point;
  const d = 0.0035;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-label="Clock-in location"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-4">
          <div>
            <h3 className="font-semibold">{point.label}</h3>
            {point.detail && <p className="text-sm text-muted-foreground">{point.detail}</p>}
            <p className="text-xs text-muted-foreground">
              {lat.toFixed(5)}, {lng.toFixed(5)}
              {point.accuracy ? ` · ±${Math.round(point.accuracy)} m` : ""}
            </p>
          </div>
          <button className="rounded-lg border border-border px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <iframe title="Clock-in location map" className="h-80 w-full border-0" src={embed} loading="lazy" />
        <div className="p-4">
          <a
            className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            href={`https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
