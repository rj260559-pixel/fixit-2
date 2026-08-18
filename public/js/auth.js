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
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = '';
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      afterLogin(data);
    } catch (err) {
      errorMsg.textContent = err.message;
    }
  });
}

const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = '';
    try {
      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          phone: document.getElementById('phone').value,
          password: document.getElementById('password').value,
          role: document.getElementById('role').value
        })
      });
      afterLogin(data);
    } catch (err) {
      errorMsg.textContent = err.message;
    }
  });
}
