let myProvider = null;
let myBookings = [];
let pendingServices = []; // { categoryId, subcategoryId, subcategoryName, price }
let categories = [];
let newCoords = null;

const WORK_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // ['requests', 'profile', 'availability'].forEach(t => {
      ['requests', 'profile', 'availability', 'reviews'].forEach(t => {
      document.getElementById(`tab-${t}`).style.display = t === btn.dataset.tab ? 'block' : 'none';
    });
  });
});

// ---------- Profile summary header ----------
function renderProfileSummary() {
  const el = document.getElementById('profileSummaryCard');
  if (!myProvider) { el.innerHTML = `<p class="text-muted">No profile found.</p>`; return; }

  const name = myProvider.businessName || getUser()?.name || 'Provider';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const categoryName = myProvider.category?.name || 'No category set';
  const subcategoryName = myProvider.subcategory?.name;
  const location = [myProvider.location?.area, myProvider.location?.city].filter(Boolean).join(', ') || 'Location not set';
  const verified = myProvider.isVerified || myProvider.verification?.status === 'approved';

  el.innerHTML = `
    <div class="profile-header">
      ${myProvider.photo
        ? `<img src="${myProvider.photo}" alt="${name}" style="width:84px;height:84px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
        : `<div class="provider-avatar" style="width:84px;height:84px;font-size:1.7rem;">${initials}</div>`
      }
      <div style="flex:1;">
        <h2>${name} ${verified
          ? '<span class="badge">Verified</span>'
          : '<span class="badge" style="background:rgba(232,163,61,0.18);color:#8a5c0f;">Pending Verification</span>'}
        </h2>
        <div class="meta-row">
          <span>${categoryName}${subcategoryName ? ' · ' + subcategoryName : ''}</span>
          <span>${location}</span>
          <span>${myProvider.experienceYears || 0} yrs experience</span>
          <span class="rating">★ ${myProvider.ratingAvg || 'New'} (${myProvider.ratingCount || 0})</span>
        </div>
      </div>
    </div>
  `;
}

// ---------- Stats ----------
function renderStats() {
  const grid = document.getElementById('statsGrid');
  const newReq = myBookings.filter(b => b.status === 'requested').length;
  const inProgress = myBookings.filter(b => ['accepted','in_progress'].includes(b.status)).length;
  const completed = myBookings.filter(b => b.status === 'completed').length;

  grid.innerHTML = `
    <div class="stat-card"><div class="num">${newReq}</div><div class="label">New Requests</div></div>
    <div class="stat-card"><div class="num">${inProgress}</div><div class="label">In Progress</div></div>
    <div class="stat-card"><div class="num">${completed}</div><div class="label">Completed</div></div>
    <div class="stat-card"><div class="num">${myProvider?.ratingAvg || 'New'}</div><div class="label">Rating (${myProvider?.ratingCount || 0} reviews)</div></div>
    <div class="stat-card"><div class="num">${myProvider?.profileViews || 0}</div><div class="label">Profile Views</div></div>
  `;
}

// ---------- Requests tab ----------
function renderRequests() {
  const el = document.getElementById('tab-requests');
  if (myBookings.length === 0) {
    el.innerHTML = `<div class="empty-state">No booking requests yet. Complete your profile so customers can find you.</div>`;
    return;
  }

  const nextStatus = { requested: 'accepted', accepted: 'in_progress', in_progress: 'completed' };
  const nextLabel = { requested: 'Accept', accepted: 'Start Job', in_progress: 'Mark Completed' };

  el.innerHTML = myBookings.map(b => `
    <div class="booking-row">
      <div>
        <strong>${b.subcategoryId?.name || 'Service'}</strong> — ${b.customerId?.userId?.name || 'Customer'}
        <div class="text-muted" style="font-size:.85rem;">
          ${b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString() : ''} ${b.scheduledTime || ''} · ${b.address || ''}
        </div>
        <div class="text-muted" style="font-size:.85rem;">${b.problemDescription || ''}</div>
      </div>
      <div class="flex items-center" style="gap:8px;">
        <span class="status-pill status-${b.status}">${b.status.replace('_',' ')}</span>
        ${nextStatus[b.status] ? `<button class="btn btn-outline" data-id="${b._id}" data-next="${nextStatus[b.status]}">${nextLabel[b.status]}</button>` : ''}
        ${b.status === 'requested' ? `<button class="btn btn-outline" data-id="${b._id}" data-next="cancelled" style="color:var(--color-danger);border-color:var(--color-danger);">Decline</button>` : ''}
      </div>
    </div>
  `).join('');

  el.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await apiRequest(`/bookings/${btn.dataset.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: btn.dataset.next })
        });
        await loadBookings();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

// ---------- Profile tab ----------
function renderServiceTags() {
  const box = document.getElementById('serviceTagsList');
  box.innerHTML = pendingServices.map((s, i) => `
    
    <span class="tag">${s.subcategoryName} — ₹${Number(s.price) || 0} <a href="#" data-remove="${i}" style="color:var(--color-danger);margin-left:4px;">✕</a></span>
  `).join('') || '<span class="text-muted">No services added yet.</span>';

  box.querySelectorAll('[data-remove]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      pendingServices.splice(Number(link.dataset.remove), 1);
      renderServiceTags();
    });
  });
}

async function loadCategoriesForProfile() {
  categories = await apiRequest('/categories');
  const catSelect = document.getElementById('addCategorySelect');
  catSelect.innerHTML = categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
  await loadSubcategoriesForProfile(catSelect.value);
}
async function loadSubcategoriesForProfile(categoryId) {
  const subSelect = document.getElementById('addSubcategorySelect');
  if (!categoryId) { subSelect.innerHTML = ''; return; }
  const subs = await apiRequest(`/categories/${categoryId}/subcategories`);
  subSelect.innerHTML = subs.map(s => `<option value="${s._id}">${s.name}</option>`).join('');
}
document.getElementById('addCategorySelect').addEventListener('change', (e) => loadSubcategoriesForProfile(e.target.value));

document.getElementById('addServiceBtn').addEventListener('click', () => {
  const catSelect = document.getElementById('addCategorySelect');
  const subSelect = document.getElementById('addSubcategorySelect');
  if (!subSelect.value) return;
  pendingServices.push({
    categoryId: catSelect.value,
    subcategoryId: subSelect.value,
    subcategoryName: subSelect.options[subSelect.selectedIndex].text,
    price: Number(document.getElementById('addPrice').value) || 0
  });
  renderServiceTags();
});

async function fillProfileForm() {
  if (!myProvider) return;

  document.getElementById('businessName').value = myProvider.businessName || '';
  document.getElementById('about').value = myProvider.about || '';
  document.getElementById('experienceYears').value = myProvider.experienceYears || 0;
  document.getElementById('city').value = myProvider.location?.city || '';
  document.getElementById('area').value = myProvider.location?.area || '';
  document.getElementById('pincode').value = myProvider.location?.pincode || '';
  document.getElementById('serviceRadiusKm').value = myProvider.location?.serviceRadiusKm || 10;

  // pendingServices = (myProvider.services || []).map(s => ({
  //   categoryId: s.categoryId?._id || s.categoryId,
  //   subcategoryId: s.subcategoryId?._id || s.subcategoryId,
  //   subcategoryName: s.subcategoryId?.name || 'Service',
  //   price: s.price || 0
  // }));
pendingServices = (myProvider.services || []).map(s => ({
  categoryId: s.categoryId?._id || s.categoryId,
  subcategoryId: s.subcategoryId?._id || s.subcategoryId,
  subcategoryName: s.subcategoryId?.name || 'Service',
  price: Number(s.price) || 0
}));
  renderServiceTags();

  // Load saved category and subcategory into dropdowns
  if (pendingServices.length > 0) {
    const savedService = pendingServices[0];

    const catSelect = document.getElementById('addCategorySelect');
    const subSelect = document.getElementById('addSubcategorySelect');

    if (savedService.categoryId) {
      catSelect.value = savedService.categoryId;

      await loadSubcategoriesForProfile(savedService.categoryId);

      if (savedService.subcategoryId) {
        subSelect.value = savedService.subcategoryId;
      }
    }
  }

  document.getElementById('startTime').value =
    myProvider.availability?.startTime || '09:00';

  document.getElementById('endTime').value =
    myProvider.availability?.endTime || '18:00';

  document.getElementById('isAvailableNow').checked =
    !!myProvider.availability?.isAvailableNow;

  renderWorkingDays(myProvider.availability?.workingDays || []);
}

  

document.getElementById('useLocationBtn').addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Location not supported.');
  navigator.geolocation.getCurrentPosition((pos) => {
    newCoords = [pos.coords.longitude, pos.coords.latitude];
    document.getElementById('coordsDisplay').textContent = `Location set: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
  }, () => alert('Could not get your location.'));
});

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const successEl = document.getElementById('profileSuccess');
  const errorEl = document.getElementById('profileError');
  successEl.textContent = '';
  errorEl.textContent = '';
// UPDATE SERVICE PRICE
  const catSelect = document.getElementById('addCategorySelect');
  const subSelect = document.getElementById('addSubcategorySelect');
  const currentPrice = Number(document.getElementById('addPrice').value) || 0;

  const existingService = pendingServices.find(
    s => s.categoryId === catSelect.value &&
         s.subcategoryId === subSelect.value
  );

  if (existingService) {
    existingService.price = currentPrice;
  }

  
    // aapka existing code...
  try {
    await apiRequest('/providers/me', {
      method: 'PUT',
      body: JSON.stringify({
        businessName: document.getElementById('businessName').value,
        about: document.getElementById('about').value,
        experienceYears: Number(document.getElementById('experienceYears').value) || 0,
        location: {
          ...(myProvider.location || {}),
          city: document.getElementById('city').value,
          area: document.getElementById('area').value,
          pincode: document.getElementById('pincode').value,
          serviceRadiusKm: Number(document.getElementById('serviceRadiusKm').value) || 10,
          coordinates: newCoords || myProvider.location?.coordinates || [0, 0]
        },
        services: pendingServices.map(s => ({
          categoryId: s.categoryId,
          subcategoryId: s.subcategoryId,
          price: s.price,
          priceUnit: 'fixed'
        }))
      })
    });
    successEl.textContent = 'Profile saved! You are one step closer to going live once admin approves verification.';
    await loadMyProvider();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// ---------- Availability tab ----------
// function renderWorkingDays(selected) {
//   const box = document.getElementById('workingDaysBox');
//   box.innerHTML = WORK_DAYS.map(d => `
//     <label style="font-weight:400;"><input type="checkbox" value="${d}" ${selected.includes(d) ? 'checked' : ''} style="width:auto;" /> ${d}</label>
//   `).join('');
// }

// document.getElementById('availabilityForm').addEventListener('submit', async (e) => {
//   e.preventDefault();
//   const checked = Array.from(document.querySelectorAll('#workingDaysBox input:checked')).map(i => i.value);
//   try {
//     await apiRequest('/providers/me', {
//       method: 'PUT',
//       body: JSON.stringify({
//         availability: {
//           workingDays: checked,
//           startTime: document.getElementById('startTime').value,
//           endTime: document.getElementById('endTime').value,
//           isAvailableNow: document.getElementById('isAvailableNow').checked
//         }
//       })
//     });
//     document.getElementById('availSuccess').textContent = 'Availability updated!';
//     await loadMyProvider();
//   } catch (err) {
//     alert(err.message);
//   }
// });
async function loadMyProvider() {
  try {
    myProvider = await apiRequest('/providers/me');

    renderProfileSummary();
    renderStats();

    try {
      await fillProfileForm();
    } catch (err) {
      console.error('Profile form load error:', err);
    }

    } catch (err) {
    console.error('Provider profile load error:', err);

    document.getElementById('profileSummaryCard').innerHTML =
      `<p class="error-text">Unable to load provider profile.</p>`;

    document.getElementById('statsGrid').innerHTML = '';
  }
}

// ---------- Loaders ----------


// ---------- Loaders ----------
async function loadProviderReviews() {
  const el = document.getElementById('providerReviews');

  try {
    const reviews = await apiRequest(`/reviews/provider/${myProvider._id}`);

    console.log('Provider reviews:', reviews);

    if (!reviews || reviews.length === 0) {
      el.innerHTML = `<p class="text-muted">No customer reviews yet.</p>`;
      return;
    }

    el.innerHTML = reviews.map(review => {
      const customerName = review.customerId?.userId?.name || 'Customer';

      const stars =
        '★'.repeat(review.rating) +
        '☆'.repeat(5 - review.rating);

      return `
        <div class="card" style="margin-bottom:12px;">
          <strong>${customerName}</strong>

          <div class="rating" style="margin:6px 0;">
            ${stars}
          </div>

          <p>${review.comment || 'No comment provided.'}</p>

          <small class="text-muted">
            ${new Date(review.createdAt).toLocaleDateString()}
          </small>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Reviews load error:', err);
    el.innerHTML = `<p class="error-text">Unable to load reviews.</p>`;
  }
}
async function loadBookings() {
  try {
    myBookings = await apiRequest('/bookings/my');
  } catch (err) {
    console.error('Bookings load error:', err);
    myBookings = [];
  }

  renderRequests();
  renderStats();
}

(async function init() {
  if (!requireLogin()) return;
  if (getUser()?.role !== 'provider') {
    document.getElementById('tab-requests').innerHTML = `<p class="error-text">This dashboard is for provider accounts only.</p>`;
    return;
  }
  await loadCategoriesForProfile();
  await loadMyProvider();
  await loadBookings();
  await loadProviderReviews();
})();
