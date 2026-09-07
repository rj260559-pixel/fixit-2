function setMessage(type, text) {
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');

  if (errorMsg) errorMsg.textContent = type === 'error' ? text : '';
  if (successMsg) successMsg.textContent = type === 'success' ? text : '';
}

function setSubmitState(button, isLoading, label) {
  if (!button) return;
  button.disabled = isLoading;
  button.dataset.defaultText = button.dataset.defaultText || button.textContent;
  button.textContent = isLoading ? label : button.dataset.defaultText;
}

function afterLogin(data) {
  setToken(data.token);
  setUser({ _id: data._id, name: data.name, email: data.email, role: data.role });

  const redirect = new URLSearchParams(window.location.search).get('redirect');
  if (redirect) {
    window.location.href = redirect;
  } else if (data.role === 'provider') {
    window.location.href = 'dashboard-provider.html';
  } else if (data.role === 'admin') {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'dashboard-customer.html';
  }
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value || '';
    const submitBtn = e.target.querySelector('button[type="submit"]');

    setMessage('error', '');
    setMessage('success', '');

    if (!email || !password) {
      setMessage('error', 'Email and password are required.');
      return;
    }

    setSubmitState(submitBtn, true, 'Logging in...');

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setMessage('success', 'Login successful. Redirecting...');
      setTimeout(() => afterLogin(data), 300);
    } catch (err) {
      setMessage('error', err.message || 'Invalid email or password.');
      setSubmitState(submitBtn, false);
    }
  });
}

const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name')?.value?.trim();
    const email = document.getElementById('email')?.value?.trim();
    const phone = document.getElementById('phone')?.value?.trim();
    const password = document.getElementById('password')?.value || '';
    const role = document.getElementById('role')?.value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    setMessage('error', '');
    setMessage('success', '');

    if (!name || !email || !phone || !password || !role) {
      setMessage('error', 'Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setMessage('error', 'Password must be at least 6 characters long.');
      return;
    }

    setSubmitState(submitBtn, true, 'Creating account...');

    try {
      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password, role })
      });
      setMessage('success', 'Account created successfully. Redirecting...');
      setTimeout(() => afterLogin(data), 300);
    } catch (err) {
      setMessage('error', err.message || 'Could not create your account.');
      setSubmitState(submitBtn, false);
    }
  });
}
