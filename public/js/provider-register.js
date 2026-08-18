const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;

function showFieldError(id, message) {
  const el = document.getElementById(`err-${id}`);
  if (el) el.textContent = message || '';
}
function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

async function loadCategories() {
  const select = document.getElementById('category');
  const categories = await apiRequest('/categories');
  select.innerHTML = `<option value="">Select category</option>` +
    categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
}

async function loadSubcategories(categoryId) {
  const select = document.getElementById('subcategory');
  if (!categoryId) {
    select.innerHTML = `<option value="">Select category first</option>`;
    return;
  }
  const subs = await apiRequest(`/categories/${categoryId}/subcategories`);
  select.innerHTML = `<option value="">Select subcategory</option>` +
    subs.map(s => `<option value="${s._id}">${s.name}</option>`).join('');
}

document.getElementById('category').addEventListener('change', (e) => loadSubcategories(e.target.value));

function validateForm(values) {
  clearFieldErrors();
  let isValid = true;
  const fail = (id, msg) => { showFieldError(id, msg); isValid = false; };

  if (!values.name.trim()) fail('name', 'Full name is required');
  if (!values.email.trim()) fail('email', 'Email is required');
  else if (!EMAIL_RE.test(values.email)) fail('email', 'Enter a valid email address');

  if (!values.phone.trim()) fail('phone', 'Phone number is required');
  else if (!PHONE_RE.test(values.phone)) fail('phone', 'Enter a valid 10-digit phone number');

  if (!values.password) fail('password', 'Password is required');
  else if (values.password.length < 6) fail('password', 'Password must be at least 6 characters');

  if (!values.confirmPassword) fail('confirmPassword', 'Please confirm your password');
  else if (values.password !== values.confirmPassword) fail('confirmPassword', 'Passwords do not match');

  if (!values.category) fail('category', 'Please select a category');
  if (!values.subcategory) fail('subcategory', 'Please select a subcategory');

  if (!values.city.trim()) fail('city', 'City is required');

  if (!values.pincode.trim()) fail('pincode', 'Pincode is required');
  else if (!PINCODE_RE.test(values.pincode)) fail('pincode', 'Enter a valid 6-digit pincode');

  return isValid;
}

document.getElementById('providerRegisterForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  formError.textContent = '';
  formSuccess.textContent = '';

  const values = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    password: document.getElementById('password').value,
    confirmPassword: document.getElementById('confirmPassword').value,
    category: document.getElementById('category').value,
    subcategory: document.getElementById('subcategory').value,
    experience: document.getElementById('experience').value,
    description: document.getElementById('description').value,
    city: document.getElementById('city').value,
    area: document.getElementById('area').value,
    pincode: document.getElementById('pincode').value,
    profilePhoto: document.getElementById('profilePhoto').value
  };

  if (!validateForm(values)) return;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account…';

  try {
    const data = await apiRequest('/providers/register', {
      method: 'POST',
      body: JSON.stringify(values)
    });
    setToken(data.token);
    setUser({ _id: data.userId, name: data.name, email: data.email, role: data.role });
    formSuccess.textContent = 'Account created! Redirecting to your dashboard…';
    setTimeout(() => window.location.href = 'dashboard-provider.html', 900);
  } catch (err) {
    formError.textContent = err.message;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Provider Account';
  }
});

loadCategories();
