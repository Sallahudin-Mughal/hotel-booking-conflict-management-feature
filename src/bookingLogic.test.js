import test from 'node:test';
import assert from 'node:assert/strict';
import { datesOverlap, formatDate, isValidDateString, sortBookings, validateBooking } from './bookingLogic.js';

const existing = { guestName: 'Existing guest', checkIn: '2026-10-10', checkOut: '2026-10-15' };
const booking = (checkIn, checkOut) => ({ guestName: 'New guest', checkIn, checkOut });

test('accepts an available booking without changing inputs', () => {
  const candidate = Object.freeze(booking('2026-10-20', '2026-10-22'));
  const bookings = Object.freeze([Object.freeze(existing)]);
  assert.deepEqual(validateBooking(candidate, bookings), { valid: true, error: null });
  assert.equal(validateBooking(candidate).valid, true);
});

for (const [label, checkIn, checkOut, overlaps] of [
  ['partial overlap before', '2026-10-08', '2026-10-12', true],
  ['partial overlap after', '2026-10-12', '2026-10-18', true],
  ['identical dates', '2026-10-10', '2026-10-15', true],
  ['surrounds existing stay', '2026-10-09', '2026-10-16', true],
  ['inside existing stay', '2026-10-11', '2026-10-14', true],
  ['same check-in', '2026-10-10', '2026-10-12', true],
  ['same check-out', '2026-10-12', '2026-10-15', true],
  ['back-to-back before', '2026-10-08', '2026-10-10', false],
  ['back-to-back after', '2026-10-15', '2026-10-18', false],
  ['separate before', '2026-10-01', '2026-10-03', false],
  ['separate after', '2026-11-01', '2026-11-03', false],
]) {
  test(label, () => {
    assert.equal(datesOverlap(checkIn, checkOut, existing.checkIn, existing.checkOut), overlaps);
    const result = validateBooking(booking(checkIn, checkOut), [existing]);
    assert.equal(result.valid, !overlaps);
    assert.equal(result.error, overlaps ? 'These dates overlap an existing booking.' : null);
  });
}

test('checks every existing booking', () => {
  const later = booking('2026-11-01', '2026-11-05');
  assert.equal(validateBooking(booking('2026-11-02', '2026-11-04'), [existing, later]).valid, false);
});

test('rejects same-day and reversed stays before checking overlaps', () => {
  for (const candidate of [booking('2026-10-12', '2026-10-12'), booking('2026-10-14', '2026-10-11')]) {
    assert.deepEqual(validateBooking(candidate, [existing]), {
      valid: false, error: 'Check-out must be later than check-in.',
    });
  }
});

test('required fields take priority and whitespace-only names are rejected', () => {
  for (const candidate of [undefined, null, {},
    { ...existing, guestName: '   ' }, { ...existing, guestName: 123 },
    { ...existing, checkIn: '' }, { ...existing, checkOut: '' },
    { ...existing, checkIn: undefined }, { ...existing, checkOut: '   ' },
    { guestName: '', checkIn: '2026-10-15', checkOut: '2026-10-10' },
  ]) {
    assert.deepEqual(validateBooking(candidate, [existing]), {
      valid: false, error: 'Please enter a guest name, check-in, and check-out.',
    });
  }
});

test('allows past dates and stays across month and year boundaries', () => {
  for (const candidate of [booking('2000-01-01', '2000-01-02'),
    booking('2026-01-31', '2026-02-01'), booking('2026-12-31', '2027-01-01')]) {
    assert.equal(validateBooking(candidate).valid, true);
  }
});

test('rejects malformed and impossible calendar dates', () => {
  for (const value of ['2026-2-01', '2026-02-29', '2026-04-31', '2026-00-01',
    '2026-13-01', '2026-01-00', '2026-01-32', '0000-01-01',
    '1900-02-29', '2026-10-10T00:00:00Z', ' 2026-10-10', null, 123]) {
    assert.equal(isValidDateString(value), false, String(value));
  }
  for (const field of ['checkIn', 'checkOut']) {
    assert.deepEqual(validateBooking({ ...existing, [field]: '2026-02-30' }), {
      valid: false, error: 'Please enter valid dates in YYYY-MM-DD format.',
    });
  }
});

test('accepts leap days using Gregorian calendar rules', () => {
  for (const value of ['2024-02-29', '2000-02-29', '0001-01-01', '9999-12-31']) {
    assert.equal(isValidDateString(value), true);
  }
});

test('sorts by check-in then check-out without mutating the original array', () => {
  const later = Object.freeze(booking('2027-01-01', '2027-01-02'));
  const longer = Object.freeze(booking('2026-10-10', '2026-10-15'));
  const shorter = Object.freeze(booking('2026-10-10', '2026-10-12'));
  const tied = Object.freeze({ ...shorter, guestName: 'Another guest' });
  const input = Object.freeze([later, longer, shorter, tied]);
  assert.deepEqual(sortBookings(input), [shorter, tied, longer, later]);
  assert.deepEqual(input, [later, longer, shorter, tied]);
  assert.deepEqual(sortBookings([]), []);
  assert.notEqual(sortBookings(input), input);
});

test('formats dates directly from their string parts', () => {
  assert.equal(formatDate('2026-10-07'), '7 Oct 2026');
  assert.equal(formatDate('2024-02-29'), '29 Feb 2024');
  assert.equal(formatDate('2026-01-01'), '1 Jan 2026');
  assert.equal(formatDate('2026-12-31'), '31 Dec 2026');
  for (const value of ['', undefined, '2026-02-30']) assert.equal(formatDate(value), '');
});
