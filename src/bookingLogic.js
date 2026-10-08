const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Keep calendar dates as strings throughout; no timezone conversion is needed.
export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysInMonth[month - 1];
}

// Checkout is exclusive, so a guest may arrive on another guest's checkout day.
export function datesOverlap(newIn, newOut, existingIn, existingOut) {
  return newIn < existingOut && newOut > existingIn;
}

export function validateBooking(booking, existingBookings = []) {
  const { guestName, checkIn, checkOut } = booking ?? {};
  if (
    typeof guestName !== 'string' || !guestName.trim() ||
    typeof checkIn !== 'string' || !checkIn.trim() ||
    typeof checkOut !== 'string' || !checkOut.trim()
  ) {
    return { valid: false, error: 'Please enter a guest name, check-in, and check-out.' };
  }
  if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) {
    return { valid: false, error: 'Please enter valid dates in YYYY-MM-DD format.' };
  }
  if (checkOut <= checkIn) {
    return { valid: false, error: 'Check-out must be later than check-in.' };
  }
  if (existingBookings.some((existing) =>
    datesOverlap(checkIn, checkOut, existing.checkIn, existing.checkOut),
  )) {
    return { valid: false, error: 'These dates overlap an existing booking.' };
  }
  return { valid: true, error: null };
}

export function sortBookings(bookings) {
  return [...bookings].sort((a, b) => {
    if (a.checkIn !== b.checkIn) return a.checkIn < b.checkIn ? -1 : 1;
    if (a.checkOut !== b.checkOut) return a.checkOut < b.checkOut ? -1 : 1;
    return 0;
  });
}

export function formatDate(value) {
  if (!isValidDateString(value)) return '';
  const [year, month, day] = value.split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}
