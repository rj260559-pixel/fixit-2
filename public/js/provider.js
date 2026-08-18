const providerId = new URLSearchParams(window.location.search).get('id');
const container = document.getElementById('profileContainer');

function stars(n) {
  const full = Math.round(n || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

async function loadProfile() {
  if (!providerId) {
    container.innerHTML = `<p class="error-text">No provider specified.</p>`;
    return;
  }

  try {
    const p = await apiRequest(`/providers/${providerId}`);
    const reviews = await apiRequest(`/reviews/provider/${providerId}`);
    const name = p.businessName || p.userId?.name || 'Provider';

    const servicesHtml = (p.services || []).map(s => `
      <div class="tag" style="padding:6px 12px;">
        ${s.subcategoryId?.name || 'Service'} ${s.price ? `— ₹${s.price} (${s.priceUnit.replace('_',' ')})` : ''}
      </div>
    `).join('');

    const reviewsHtml = reviews.length
      ? reviews.map(r => `
        <div class="review-item">
          <div class="flex items-center justify-between">
            <strong>${r.customerId?.userId?.name || 'Customer'}</strong>
            <span class="stars">${stars(r.rating)}</span>
          </div>
          <p class="text-muted mt-1">${r.comment || ''}</p>
        </div>
      `).join('')
      : `<p class="text-muted">No reviews yet.</p>`;

    container.innerHTML = `
      <div class="card">
        <div class="profile-header">
          <div class="provider-avatar" style="width:84px;height:84px;font-size:1.7rem;">
            ${name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
          </div>
          <div style="flex:1;">
            <h2>${name} ${p.verification?.status === 'approved' ? '<span class="badge">Verified</span>' : ''}</h2>
            <div class="meta-row">
              <span class="rating">${stars(p.ratingAvg)} ${p.ratingAvg || 'New'}</span>
              <span>${p.ratingCount || 0} reviews</span>
              <span>${p.experienceYears || 0} yrs experience</span>
              <span>${p.location?.city || 'Location not set'}</span>
            </div>
            <p class="mt-2">${p.about || 'This provider has not added a description yet.'}</p>
          </div>
        </div>

        <h3 class="mt-3">Services offered</h3>
        <div class="tags">${servicesHtml || '<span class="text-muted">No services added yet.</span>'}</div>

        <h3 class="mt-3">Availability</h3>
        <p class="text-muted">
          ${(p.availability?.workingDays || []).join(', ')} · ${p.availability?.startTime || ''} – ${p.availability?.endTime || ''}
          ${p.availability?.isAvailableNow ? ' · <span style="color:var(--color-success);font-weight:600;">Available now</span>' : ''}
        </p>

        <button class="btn btn-accent mt-3" id="requestServiceBtn">Request Service</button>

        <h3 class="mt-3">Reviews</h3>
        <div id="reviewsList">${reviewsHtml}</div>
      </div>
    `;

    document.getElementById('requestServiceBtn').addEventListener('click', () => {
      if (!getToken()) {
        window.location.href = `login.html?redirect=booking.html?providerId=${providerId}`;
        return;
      }
      window.location.href = `booking.html?providerId=${providerId}`;
    });

  } catch (err) {
    container.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
}

loadProfile();
