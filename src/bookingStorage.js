import { sortBookings, validateBooking } from './bookingLogic.js';

export const BOOKINGS_STORAGE_KEY = 'booking-conflict-checker:demo-apartment:v1';

// Reject the whole collection if one record is corrupt, rather than hiding
// individual reservations and making their dates appear available.
function isValidCollection(value) {
  if (!Array.isArray(value)) return false;
  const checked = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    if (!validateBooking(item, checked).valid) return false;
    checked.push(item);
  }
  return true;
}

function prepareBookings(bookings) {
  return sortBookings(bookings.map(({ guestName, checkIn, checkOut }) => ({
    guestName: guestName.trim(), checkIn, checkOut,
  })));
}

// Resolve localStorage inside try/catch: even accessing it can throw.
// Injecting a storage object lets tests exercise failures without a browser.
export function loadBookings(storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    const stored = target.getItem(BOOKINGS_STORAGE_KEY);
    if (stored === null) return { bookings: [], error: null };
    const parsed = JSON.parse(stored);
    if (!isValidCollection(parsed)) {
      return { bookings: [], error: 'Saved booking data is invalid. Starting with an empty list.' };
    }
    return { bookings: prepareBookings(parsed), error: null };
  } catch {
    return { bookings: [], error: 'Saved bookings could not be read. Starting with an empty list.' };
  }
}

export function saveBookings(bookings, storage) {
  try {
    if (!isValidCollection(bookings)) {
      return { saved: false, error: 'Invalid bookings could not be saved.' };
    }
    const target = storage === undefined ? globalThis.localStorage : storage;
    target.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(prepareBookings(bookings)));
    return { saved: true, error: null };
  } catch {
    return { saved: false, error: 'Bookings could not be saved. Please try again.' };
  }
}
