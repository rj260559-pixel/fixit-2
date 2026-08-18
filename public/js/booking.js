const bookingProviderId = new URLSearchParams(window.location.search).get('providerId');
const area = document.getElementById('bookingCardArea');

async function init() {
  if (!requireLogin()) return;

  if (getUser()?.role !== 'customer') {
    area.innerHTML = `<p class="error-text">Only customer accounts can request a service. Please login as a customer.</p>`;
    return;
  }

  try {
    const provider = await apiRequest(`/providers/${bookingProviderId}`);
    const name = provider.businessName || provider.userId?.name || 'Provider';

    const options = (provider.services || [])
      .map(s => `<option value="${s.subcategoryId?._id}">${s.subcategoryId?.name || 'Service'}</option>`)
      .join('');

    area.innerHTML = `
      <p class="text-muted">Booking with <strong>${name}</strong></p>
      <form id="bookingForm" class="mt-2">
        <div class="form-group">
          <label>Service</label>
          <select id="subcategoryId" required>${options || '<option value="">No services listed</option>'}</select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="scheduledDate" required />
          </div>
          <div class="form-group">
            <label>Time</label>
            <input type="time" id="scheduledTime" required />
          </div>
        </div>
        <div class="form-group">
          <label>Address</label>
          <input type="text" id="address" placeholder="Full address for the visit" required />
        </div>
        <div class="form-group">
          <label>Describe the problem</label>
          <textarea id="problemDescription" rows="4" placeholder="e.g. AC not cooling, making noise"></textarea>
        </div>
        <button type="submit" class="btn btn-accent btn-block">Submit Request</button>
        <p class="error-text" id="errorMsg"></p>
        <p class="success-text" id="successMsg"></p>
      </form>
    `;

    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorMsg = document.getElementById('errorMsg');
      const successMsg = document.getElementById('successMsg');
      errorMsg.textContent = '';
      successMsg.textContent = '';

      try {
        await apiRequest('/bookings', {
          method: 'POST',
          body: JSON.stringify({
            providerId: bookingProviderId,
            subcategoryId: document.getElementById('subcategoryId').value,
            scheduledDate: document.getElementById('scheduledDate').value,
            scheduledTime: document.getElementById('scheduledTime').value,
            address: document.getElementById('address').value,
            problemDescription: document.getElementById('problemDescription').value
          })
        });
        successMsg.textContent = 'Request sent! Redirecting to your bookings…';
        setTimeout(() => window.location.href = 'dashboard-customer.html', 1200);
      } catch (err) {
        errorMsg.textContent = err.message;
      }
    });

  } catch (err) {
    area.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
}

init();
