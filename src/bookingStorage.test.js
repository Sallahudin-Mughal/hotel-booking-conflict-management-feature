import test from 'node:test';
import assert from 'node:assert/strict';
import { BOOKINGS_STORAGE_KEY, loadBookings, saveBookings } from './bookingStorage.js';

const earlier = { guestName: 'First guest', checkIn: '2026-10-10', checkOut: '2026-10-15' };
const later = { guestName: 'Second guest', checkIn: '2026-10-15', checkOut: '2026-10-18' };

function memoryStorage(initial = null) {
  const items = new Map(initial === null ? [] : [[BOOKINGS_STORAGE_KEY, initial]]);
  return {
    getItem(key) { return items.get(key) ?? null; },
    setItem(key, value) { items.set(key, value); },
  };
}

test('missing data starts empty without an error', () => {
  assert.deepEqual(loadBookings(memoryStorage()), { bookings: [], error: null });
});

test('round-trips valid bookings, sorted and with dates preserved as strings', () => {
  const storage = memoryStorage();
  assert.deepEqual(saveBookings([later, earlier], storage), { saved: true, error: null });
  assert.deepEqual(loadBookings(storage), { bookings: [earlier, later], error: null });
  // A second load represents a new consumer reading the persisted value.
  assert.deepEqual(loadBookings(storage).bookings, [earlier, later]);
});

test('saves and loads an empty collection', () => {
  const storage = memoryStorage(JSON.stringify([earlier]));
  assert.equal(saveBookings([], storage).saved, true);
  assert.equal(storage.getItem(BOOKINGS_STORAGE_KEY), '[]');
  assert.deepEqual(loadBookings(storage), { bookings: [], error: null });
});

test('corrupt JSON starts empty and leaves the stored value untouched', () => {
  const storage = memoryStorage('{broken');
  const result = loadBookings(storage);
  assert.deepEqual(result.bookings, []);
  assert.ok(result.error);
  assert.equal(storage.getItem(BOOKINGS_STORAGE_KEY), '{broken');
});

test('rejects invalid shapes, dates, ranges, and overlapping stored records', () => {
  const invalid = [null, {}, 'bookings', 12, [null], [[]],
    [{ ...earlier, guestName: ' ' }], [{ ...earlier, guestName: 12 }],
    [{ checkIn: earlier.checkIn, checkOut: earlier.checkOut }],
    [{ ...earlier, checkIn: '2026-02-30' }],
    [{ ...earlier, checkOut: earlier.checkIn }],
    [{ ...earlier, checkOut: '2026-10-09' }],
    [earlier, { ...later, checkIn: '2026-10-14' }],
  ];
  for (const value of invalid) {
    const stored = JSON.stringify(value);
    const storage = memoryStorage(stored);
    assert.deepEqual(loadBookings(storage).bookings, []);
    assert.ok(loadBookings(storage).error);
    assert.equal(storage.getItem(BOOKINGS_STORAGE_KEY), stored);
    assert.equal(saveBookings(value, storage).saved, false);
    assert.equal(storage.getItem(BOOKINGS_STORAGE_KEY), stored);
  }
});

test('read failures return an empty collection and an error', () => {
  assert.ok(loadBookings({ getItem() { throw new Error('Blocked'); } }).error);
  assert.deepEqual(loadBookings(null).bookings, []);
});

test('write failures are reported and never claim success', () => {
  assert.deepEqual(saveBookings([earlier], {
    setItem() { throw new Error('Quota exceeded'); },
  }), { saved: false, error: 'Bookings could not be saved. Please try again.' });
  assert.equal(saveBookings([earlier], null).saved, false);
});

test('access to the browser storage property can fail safely', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('Security error'); },
  });
  try {
    assert.ok(loadBookings().error);
    assert.equal(saveBookings([earlier]).saved, false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('uses browser localStorage by default', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, value: memoryStorage(),
  });
  try {
    assert.equal(saveBookings([earlier]).saved, true);
    assert.deepEqual(loadBookings().bookings, [earlier]);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('normalizes names and strips extra fields without changing inputs', () => {
  const input = Object.freeze({ ...earlier, guestName: ' First guest ', extra: 'ignored' });
  const storage = memoryStorage();
  assert.equal(saveBookings(Object.freeze([input]), storage).saved, true);
  assert.deepEqual(loadBookings(storage).bookings, [earlier]);
  assert.equal(input.guestName, ' First guest ');
  assert.equal(input.extra, 'ignored');
  assert.deepEqual(loadBookings(memoryStorage(JSON.stringify([input]))).bookings, [earlier]);
});
