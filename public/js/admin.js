async function loadProviders(status) {
  const list = document.getElementById('adminList');
  list.innerHTML = `<p class="text-muted">Loading…</p>`;

  try {
    const providers = await apiRequest(`/admin/providers?status=${status}`);

    if (providers.length === 0) {
      list.innerHTML = `<div class="empty-state">No ${status} providers.</div>`;
      return;
    }

    list.innerHTML = providers.map(p => `
      <div class="booking-row">
        <div>
          <strong>${p.businessName || p.userId?.name}</strong>
          <div class="text-muted" style="font-size:.85rem;">
            ${p.userId?.email || ''} · ${p.userId?.phone || ''} · ${p.location?.city || 'No city set'}
          </div>
        </div>
        <div class="flex" style="gap:8px;">
          ${status !== 'approved' ? `<button class="btn btn-primary" data-action="approved" data-id="${p._id}">Approve</button>` : ''}
          ${status !== 'rejected' ? `<button class="btn btn-outline" data-action="rejected" data-id="${p._id}" style="color:var(--color-danger);border-color:var(--color-danger);">Reject</button>` : ''}
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiRequest(`/admin/providers/${btn.dataset.id}/verify`, {
            method: 'PUT',
            body: JSON.stringify({ status: btn.dataset.action })
          });
          loadProviders(status);
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    list.innerHTML = `<p class="error-text">${err.message}</p>`;
  }
}

document.getElementById('statusTabs').addEventListener('click', (e) => {
  if (!e.target.matches('.tab-btn')) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  loadProviders(e.target.dataset.status);
});

if (requireLogin()) {
  if (getUser()?.role !== 'admin') {
    document.getElementById('adminList').innerHTML = `<p class="error-text">Admin access only.</p>`;
  } else {
    loadProviders('pending');
  }
}
