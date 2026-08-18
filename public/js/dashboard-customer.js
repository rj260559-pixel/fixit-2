let allBookings = [];
let activeBookingForReview = null;

async function loadBookings() {
  const list = document.getElementById('bookingsList');
  try {
    allBookings = await apiRequest('/bookings/my');
    renderBookings('all');
  } catch (err) {
    list.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
}

function renderBookings(filter) {
  const list = document.getElementById('bookingsList');
  const bookings = filter === 'all' ? allBookings : allBookings.filter(b => b.status === filter);

  if (bookings.length === 0) {
    list.innerHTML = `<div class="empty-state">No bookings here yet. <a href="search.html" style="color:var(--color-primary);font-weight:600;">Browse services</a> to make your first request.</div>`;
    return;
  }

  list.innerHTML = bookings.map(b => `
    <div class="booking-row">
      <div>
        <strong>${b.subcategoryId?.name || 'Service'}</strong> with ${b.providerId?.userId?.name || b.providerId?.businessName || 'Provider'}
        <div class="text-muted" style="font-size:.85rem;">
          ${b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString() : ''} ${b.scheduledTime || ''} · ${b.address || ''}
        </div>
      </div>
      <div class="flex items-center" style="gap:10px;">
        <span class="status-pill status-${b.status}">${b.status.replace('_',' ')}</span>
        ${b.status === 'completed' ? `<button class="btn btn-outline" data-review-id="${b._id}">Leave Review</button>` : ''}
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-review-id]').forEach(btn => {
    btn.addEventListener('click', () => openReviewModal(btn.getAttribute('data-review-id')));
  });
}

document.getElementById('tabBar').addEventListener('click', (e) => {
  if (!e.target.matches('.tab-btn')) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  renderBookings(e.target.getAttribute('data-filter'));
});

function openReviewModal(bookingId) {
  activeBookingForReview = bookingId;
  document.getElementById('reviewError').textContent = '';
  document.getElementById('reviewModalOverlay').style.display = 'flex';
}
document.getElementById('cancelReviewBtn').addEventListener('click', () => {
  document.getElementById('reviewModalOverlay').style.display = 'none';
});
document.getElementById('submitReviewBtn').addEventListener('click', async () => {
  const errorEl = document.getElementById('reviewError');
  try {
    await apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: activeBookingForReview,
        rating: Number(document.getElementById('reviewRating').value),
        comment: document.getElementById('reviewComment').value
      })
    });
    document.getElementById('reviewModalOverlay').style.display = 'none';
    loadBookings();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

if (requireLogin()) loadBookings();
