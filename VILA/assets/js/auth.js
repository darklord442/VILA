document.addEventListener('DOMContentLoaded', () => {
  const showError = (message) => {
    alert(message);
  };

  // ---------- Register ----------
  const fullNameInput = document.getElementById('full-name');
  const regEmailInput = document.getElementById('reg-email');
  const regPasswordInput = document.getElementById('reg-password');

  if (fullNameInput && regEmailInput && regPasswordInput) {
    const form = fullNameInput.closest('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullNameInput.value.trim(),
            email: regEmailInput.value.trim(),
            password: regPasswordInput.value,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          showError(data.message || 'Registration failed');
          return;
        }

        alert('Account created! Please sign in.');
        window.location.href = 'sign-in.html';
      } catch (err) {
        showError('Could not reach the server');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }

  // ---------- Sign In ----------
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');

  if (emailInput && passwordInput) {
    const form = emailInput.closest('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          showError(data.message || 'Sign in failed');
          return;
        }

        // Save the logged-in user for other pages
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'index.html';
      } catch (err) {
        showError('Could not reach the server');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }
});
