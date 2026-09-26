// Teal "bubble" rating readout (TripAdvisor style), shared by every reviewable listing.
export function Bubbles({ value, size = 16 }) {
  const numeric = Number(value) || 0;
  return (
    <div className="flex items-center gap-[3px]" aria-label={`${numeric.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((bubble) => {
        const fill = Math.max(0, Math.min(100, (numeric - (bubble - 1)) * 100));
        return (
          <span
            key={bubble}
            className="relative block rounded-full bg-gray-200 overflow-hidden"
            style={{ width: size, height: size }}
          >
            <span className="absolute left-0 top-0 bottom-0 bg-[#00AA88]" style={{ width: `${fill}%` }} />
          </span>
        );
      })}
    </div>
  );
}

// Compact "4.5 ●●●●○ (12 reviews)" line for detail-page headers and cards.
export default function RatingBubbles({ rating, reviewCount, size = 16 }) {
  const score = Number(rating) || 0;
  const count = Number(reviewCount) || 0;
  if (!score && !count) {
    return <span className="text-sm text-gray-400">No reviews yet</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-gray-900 leading-none">{score.toFixed(1)}</span>
      <Bubbles value={score} size={size} />
      {count > 0 && (
        <span className="text-sm text-gray-500">({count.toLocaleString()} review{count === 1 ? '' : 's'})</span>
      )}
    </div>
  );
}
