async function loadCategories() {
  const grid = document.getElementById('categoryGrid');
  const select = document.getElementById('categorySelect');
  try {
    const categories = await apiRequest('/categories');

    if (categories.length === 0) {
      grid.innerHTML = `<p class="text-muted">No categories yet — run <code>npm run seed</code> on the backend first.</p>`;
      return;
    }

    grid.innerHTML = categories.map(c => `
      <a class="category-card" href="search.html?categoryId=${c._id}">
        <div class="icon">${c.icon || '🔧'}</div>
        <div class="name">${c.name}</div>
        <div class="name-hi">${c.nameHi || ''}</div>
      </a>
    `).join('');

    select.innerHTML = `<option value="">Select a service</option>` +
      categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
  } catch (err) {
    grid.innerHTML = `<p class="error-text">Could not load categories: ${err.message}</p>`;
  }
}

document.getElementById('homeSearchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const categoryId = document.getElementById('categorySelect').value;
  const location = document.getElementById('locationInput').value;
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', categoryId);
  if (location) params.set('city', location);
  window.location.href = `search.html?${params.toString()}`;
});

loadCategories();
