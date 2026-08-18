const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('sc_token');
}
function setToken(token) {
  localStorage.setItem('sc_token', token);
}
function getUser() {
  const u = localStorage.getItem('sc_user');
  return u ? JSON.parse(u) : null;
}
function setUser(user) {
  localStorage.setItem('sc_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('sc_token');
  localStorage.removeItem('sc_user');
}
function requireLogin() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

async function apiRequest(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  let data = {};
  try { data = await res.json(); } catch (e) { /* no body */ }

  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// Renders the shared navbar into any element with id="navbar"
function renderNavbar() {
  const el = document.getElementById('navbar');
  if (!el) return;
  const user = getUser();

  let rightLinks = `
    <a href="login.html">Login</a>
    <a href="provider-register.html" class="nav-cta">Become a Provider</a>
  `;

  if (user) {
    let dashboardUrl = 'dashboard-customer.html';
    if (user.role === 'provider') dashboardUrl = 'dashboard-provider.html';
    if (user.role === 'admin') dashboardUrl = 'admin.html';
    rightLinks = `
      <a href="${dashboardUrl}">Hi, ${user.name.split(' ')[0]}</a>
      <a href="#" id="logoutBtn" class="nav-cta">Logout</a>
    `;
  }

  el.innerHTML = `
    <div class="navbar-inner">
      <a href="index.html" class="brand">ServiceConnect<span class="dot">.</span></a>
      <nav class="nav-links">
        <a href="index.html">Home</a>
        <a href="search.html">All Services</a>
        ${rightLinks}
      </nav>
    </div>
  `;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearAuth();
      window.location.href = 'index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', renderNavbar);
