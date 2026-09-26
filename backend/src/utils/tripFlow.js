// Shared helpers for the trip flow:
//   draft (build itinerary) -> Save Itinerary (locked) -> organizer books -> public / invite -> travelers join

const BOOKED_STATUSES = ['confirmed', 'completed'];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// A trip counts as booked once the organizer's own booking exists
// (bookings.controller sets status = 'confirmed' only for the organizer).
const isBooked = (trip) => BOOKED_STATUSES.includes(trip.status);
const isItinerarySaved = (trip) => !!trip.itinerary_saved_at;

// Category used for the read-only budget breakdown shown in the UI.
function categoryOf(item) {
  if (item.hotel_id) return 'accommodation';
  if (item.restaurant_id) return 'food';
  if (item.cruise_id) return 'transportation';
  if (item.place_id) return 'activities';
  switch (String(item.custom_type || '').toLowerCase()) {
    case 'hotel':
    case 'accommodation':
      return 'accommodation';
    case 'restaurant':
    case 'food':
      return 'food';
    case 'transportation':
      return 'transportation';
    default:
      return 'activities';
  }
}

// Per-person cost by category, derived ONLY from itinerary item costs.
function costBreakdown(items) {
  const out = { accommodation: 0, transportation: 0, activities: 0, food: 0 };
  for (const it of items) out[categoryOf(it)] += Number(it.cost_per_person) || 0;
  Object.keys(out).forEach((k) => { out[k] = round2(out[k]); });
  return out;
}

const sumItems = (items) => round2(items.reduce((s, it) => s + (Number(it.cost_per_person) || 0), 0));

async function isOrganizer(queryable, tripId, userId) {
  const r = await queryable.query(
    `SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2 AND role = 'organizer'`,
    [tripId, userId]
  );
  return !!r.rows[0];
}

module.exports = { BOOKED_STATUSES, round2, isBooked, isItinerarySaved, categoryOf, costBreakdown, sumItems, isOrganizer };
