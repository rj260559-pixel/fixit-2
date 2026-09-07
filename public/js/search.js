const params = new URLSearchParams(window.location.search);
let coords = null; // { lng, lat }

async function loadCategories() {
  const select = document.getElementById('categorySelect');
  const categories = await apiRequest('/categories');
  select.innerHTML = `<option value="">All categories</option>` +
    categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');

  const preselect = params.get('categoryId');
  if (preselect) {
    select.value = preselect;
    await loadSubcategories(preselect);
  }
}

async function loadSubcategories(categoryId) {
  const select = document.getElementById('subcategorySelect');
  if (!categoryId) {
    select.innerHTML = `<option value="">Any service</option>`;
    return;
  }
  const subs = await apiRequest(`/categories/${categoryId}/subcategories`);
  select.innerHTML = `<option value="">Any service</option>` +
    subs.map(s => `<option value="${s._id}">${s.name}</option>`).join('');

  const preselectSub = params.get('subcategoryId');
  if (preselectSub) select.value = preselectSub;
}

function providerInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function getPrimaryServiceLabel(provider) {
  const service = (provider.services || [])[0];
  const subName = service?.subcategoryId?.name || provider.category?.name || 'Service';
  const catName = service?.categoryId?.name || provider.category?.name || '';
  return catName ? `${catName} · ${subName}` : subName;
}

function renderProviders(providers) {
  const list = document.getElementById('providerList');
  document.getElementById('resultsHeading').textContent = `${providers.length} provider${providers.length !== 1 ? 's' : ''} found`;

  if (providers.length === 0) {
    list.innerHTML = `<div class="empty-state">No providers found for this filter yet. Try a different category or location.</div>`;
    return;
  }

  list.innerHTML = providers.map(p => {
    const name = p.businessName || p.userId?.name || 'Provider';
    const locationText = [p.location?.area, p.location?.city, p.location?.pincode].filter(Boolean).join(', ') || 'Location not specified';
    const ratingText = p.ratingAvg ? `★ ${p.ratingAvg.toFixed(1)}` : '★ New';
    const serviceTags = (p.services || []).slice(0, 4)
      .map(s => `<span class="tag">${s.subcategoryId?.name || 'Service'}</span>`).join('');

    return `
      <div class="provider-card">
        <div class="provider-avatar">${providerInitials(name)}</div>
        <div class="provider-info">
          <h3>${name} ${p.verification?.status === 'approved' ? '<span class="badge">Verified</span>' : ''}</h3>
          <div class="meta-row">
            <span class="rating">${ratingText}</span>
            <span>${p.ratingCount || 0} reviews</span>
            <span>${p.experienceYears || 0} yrs experience</span>
          </div>
          <div class="meta-row mt-1">
            <span>${getPrimaryServiceLabel(p)}</span>
            <span>${locationText}</span>
          </div>
          <p class="text-muted mt-1" style="font-size:.88rem;">${(p.about || '').slice(0, 120) || 'No description added yet.'}</p>
          <div class="tags">${serviceTags || '<span class="tag">General Service</span>'}</div>
          <div class="mt-2" style="display:flex; gap:10px; flex-wrap:wrap;">
            <a class="btn btn-outline" href="provider.html?id=${p._id}">View Profile</a>
            <button class="btn btn-accent book-provider-btn" type="button" data-provider-id="${p._id}">Book Service</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.book-provider-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const providerId = e.currentTarget.dataset.providerId;
      if (!getToken()) {
        window.location.href = `login.html?redirect=booking.html?providerId=${providerId}`;
        return;
      }
      window.location.href = `booking.html?providerId=${providerId}`;
    });
  });
}

async function runSearch() {
  const list = document.getElementById('providerList');
  list.innerHTML = `<p class="text-muted">Searching…</p>`;

  const categoryId = document.getElementById('categorySelect').value;
  const subcategoryId = document.getElementById('subcategorySelect').value;
  const city = document.getElementById('cityInput').value.trim();

  const query = new URLSearchParams();
  if (categoryId) query.set('categoryId', categoryId);
  if (subcategoryId) query.set('subcategoryId', subcategoryId);
  if (city) query.set('city', city);
  if (coords) {
    query.set('lng', coords.lng);
    query.set('lat', coords.lat);
  }

  try {
    const providers = await apiRequest(`/providers/search?${query.toString()}`);
    renderProviders(providers);
  } catch (err) {
    list.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
}

document.getElementById('categorySelect').addEventListener('change', async (e) => {
  await loadSubcategories(e.target.value);
  runSearch();
});

document.getElementById('subcategorySelect').addEventListener('change', () => runSearch());

document.getElementById('filterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  runSearch();
});

document.getElementById('useLocationBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Location is not supported in this browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      coords = { lng: pos.coords.longitude, lat: pos.coords.latitude };
      document.getElementById('useLocationBtn').textContent = '📍 Using your location';
      runSearch();
    },
    () => alert('Could not get your location. Please allow location access, or search by city instead.')
  );
});

(async function init() {
  const cityFromUrl = params.get('city');
  if (cityFromUrl) document.getElementById('cityInput').value = cityFromUrl;
  await loadCategories();
  runSearch();
})();
