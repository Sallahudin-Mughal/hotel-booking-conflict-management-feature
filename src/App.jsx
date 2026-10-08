import { useEffect, useState } from 'react';
import { formatDate, sortBookings, validateBooking } from './bookingLogic.js';
import { loadBookings, saveBookings } from './bookingStorage.js';
import { DEMO_BOOKINGS } from './demoBookings.js';
import PropertyHero from './PropertyHero.jsx';

const EMPTY_FORM = { guestName: '', checkIn: '', checkOut: '' };

export default function App() {
  const [initialStorage] = useState(() => loadBookings());
  const [bookings, setBookings] = useState(initialStorage.bookings);
  const [storageError, setStorageError] = useState(initialStorage.error);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(
      () => setMessage(null),
      message.type === 'success' ? 5000 : 8000,
    );
    // A new message gets its own full display time.
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!storageError) return;
    const timeout = window.setTimeout(() => setStorageError(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [storageError]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage(null);
  }

  function submitBooking(event) {
    event.preventDefault();
    const candidate = { ...form, guestName: form.guestName.trim() };
    const validation = validateBooking(candidate, bookings);
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.error });
      return;
    }

    const nextBookings = sortBookings([...bookings, candidate]);
    const result = saveBookings(nextBookings);
    if (!result.saved) {
      setMessage({ type: 'error', text: result.error });
      return;
    }

    // Only update the UI and clear the form after persistence succeeds.
    setBookings(nextBookings);
    setStorageError(null);
    setForm(EMPTY_FORM);
    setMessage({
      type: 'success',
      text: `Booking saved for ${candidate.guestName}: ${formatDate(candidate.checkIn)} to ${formatDate(candidate.checkOut)}.`,
    });
  }

  function loadDemoData() {
    if (!window.confirm('Load demo data? This will replace all saved bookings for Demo Apartment with three demo bookings.')) {
      return;
    }
    const nextBookings = sortBookings(DEMO_BOOKINGS.map((booking) => ({ ...booking })));
    const result = saveBookings(nextBookings);
    if (!result.saved) {
      setMessage({ type: 'error', text: result.error });
      return;
    }
    setBookings(nextBookings);
    setStorageError(null);
    setMessage({ type: 'success', text: 'Demo data loaded. Three demo bookings are now saved.' });
  }

  return (
    <>
    <PropertyHero />
    <main>

      {storageError && <p className="message message-error" role="alert">{storageError}</p>}

      <section className="card" aria-labelledby="booking-form-title">
        <div className="section-heading"><div>
        <p className="section-kicker">PLAN THE NEXT ARRIVAL</p>
        <h2 id="booking-form-title">Add a booking</h2>
        <p className="section-description">Enter the guest's name and stay dates. All fields are required.</p>
        </div><span className="status-pill"><span /> Conflict checking enabled</span></div>
        <form onSubmit={submitBooking} noValidate>
          <div className="form-field guest-field">
            <label htmlFor="guest-name">Guest name</label>
            <input
              id="guest-name"
              name="guestName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Ayesha Khan"
              required
              value={form.guestName}
              onChange={updateField}
            />
          </div>
          <div className="form-field">
            <label htmlFor="check-in">Check-in</label>
            <input
              id="check-in"
              name="checkIn"
              type="date"
              required
              value={form.checkIn}
              onChange={updateField}
            />
          </div>
          <div className="form-field">
            <label htmlFor="check-out">Check-out</label>
            <input
              id="check-out"
              name="checkOut"
              type="date"
              required
              value={form.checkOut}
              onChange={updateField}
            />
          </div>
          <div className="form-actions">
            <button className="button-save" type="submit">
              <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 5 3 3 5-5" /></svg>
              <span>Save booking</span>
              
            </button>
          </div>
        </form>
      </section>

      <div aria-live="polite" aria-atomic="true">
        {message && (
          <p className={`message message-${message.type}`}>
            {message.text}
          </p>
        )}
      </div>

      <section className="card bookings-card" aria-labelledby="bookings-title">
        <div className="section-heading"><div>
        <p className="section-kicker">THE GUEST LIST</p>
        <h2 id="bookings-title">Bookings <span className="count">{bookings.length}</span></h2>
        <p className="section-description">Every stay, in check-in order. All in one place.</p>
        </div>
        <button className="button-secondary" type="button" onClick={loadDemoData} aria-describedby="demo-help">
          Load Demo Data
        </button>
        </div>
        <p id="demo-help" className="helper-text">Replaces all bookings with three example stays after confirmation.</p>
        {bookings.length === 0 ? (
          <div className="empty-state"><span className="empty-icon" aria-hidden="true">⌂</span><h3>Your next chapter starts with a guest.</h3><p>Add your first stay above, or explore with demo data.</p></div>
        ) : (
          <div className="table-scroll" role="region" aria-label="Bookings table" tabIndex={0}>
            <table>
              <caption>Guest stays for Demo Apartment</caption>
              <thead>
                <tr>
                  <th scope="col">Guest name</th>
                  <th scope="col">Check-in</th>
                  <th scope="col">Check-out</th>
                </tr>
              </thead>
              <tbody>
                {sortBookings(bookings).map((booking) => (
                  <tr key={`${booking.checkIn}/${booking.checkOut}`}>
                    <td>{booking.guestName}</td>
                    <td><time dateTime={booking.checkIn}>{formatDate(booking.checkIn)}</time></td>
                    <td><time dateTime={booking.checkOut}>{formatDate(booking.checkOut)}</time></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <footer><span>DEMO APARTMENT <span className="footer-dot">·</span> Booking Conflict Checker</span><span>Saved in this browser <span className="footer-dot">·</span> <a href="https://www.pexels.com/video/shot-of-a-hotel-room-with-an-open-door-7507165/" target="_blank" rel="noreferrer">Film by cottonbro studio / Pexels</a></span></footer>
    </main>
    </>
  );
}
