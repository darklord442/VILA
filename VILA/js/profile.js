// Profile page - Purchased Items & Watchlist with add/remove
document.addEventListener('DOMContentLoaded', async () => {
  const userRaw = localStorage.getItem('user');
  if (!userRaw) {
    window.location.href = 'sign-in.html';
    return;
  }
  const user = JSON.parse(userRaw);
  const userId = user.id;

  // ---- DOM elements ----
  const purchasedList = document.getElementById('purchasedItemsList');
  const favoritesList = document.getElementById('favoritesItemsList');
  const purchasedCountBadge = document.getElementById('purchasedCountBadge');
  const favoritesCountBadge = document.getElementById('favoritesCountBadge');
  const purchasedSectionCount = document.getElementById('purchasedSectionCount');
  const favoritesSectionCount = document.getElementById('favoritesSectionCount');
  const tabButtons = document.querySelectorAll('[data-tab]');
  const tabSections = document.querySelectorAll('[data-section]');

  const accountMemberId = document.getElementById('accountMemberId');
  const accountPaddle = document.getElementById('accountPaddle');
  const accountEmail = document.getElementById('accountEmail');

  // ---- profile picture ----
  const profilePictureInput = document.getElementById('profilePictureInput');
  const profilePicturePreview = document.getElementById('profilePicturePreview');
  const headerProfilePicture = document.getElementById('headerProfilePicture');
  const headerProfileInitials = document.getElementById('headerProfileInitials');
  const resetProfilePictureBtn = document.getElementById('resetProfilePictureBtn');
  const navProfileImg = document.querySelector('header img[alt="Profile"]');

  // Load saved profile picture from localStorage
  let profilePictureUrl = localStorage.getItem(`profilePicture_${userId}`);

  function applyProfilePicture(url) {
    profilePictureUrl = url;
    if (url) {
      localStorage.setItem(`profilePicture_${userId}`, url);
      // Update user object in localStorage
      try {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const u = JSON.parse(userRaw);
          u.profilePicture = url;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch (e) { console.error('Save profile picture to user error:', e); }

      // Update all avatar displays
      if (profilePicturePreview) profilePicturePreview.src = url;
      if (headerProfilePicture) {
        headerProfilePicture.src = url;
        headerProfilePicture.classList.remove('hidden');
      }
      if (headerProfileInitials) headerProfileInitials.classList.add('hidden');
      if (navProfileImg) navProfileImg.src = url;
    } else {
      localStorage.removeItem(`profilePicture_${userId}`);
      try {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const u = JSON.parse(userRaw);
          delete u.profilePicture;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch (e) { console.error('Remove profile picture from user error:', e); }

      if (profilePicturePreview) profilePicturePreview.src = '';
      if (headerProfilePicture) {
        headerProfilePicture.classList.add('hidden');
      }
      if (headerProfileInitials) headerProfileInitials.classList.remove('hidden');
      if (navProfileImg) navProfileImg.src = 'https://lh3.googleusercontent.com/aida/ALJJyrAhoX5W4abndDkmZ2XCkkHcgcUiINghN7_PM_tErSPaow9kEOnspGvKLfB7pfczMcqUqxQpvYXd2GAmgQOyxSVmj6Z5IwQL7k7deXJJmFwO4lJptaz9jQQ6d5LzT8ixlNLbMCIDXhIcKcJ06yXxFwG-tL31pVObhSKWuBFhrZoBs1GggyqagQni0wcppSSDP1BNYcCQw6e1KKC5oNQDjH8kNHl_kXGiNIs5IFXhK7aS';
    }
  }

  // Initialize profile picture on load
  if (profilePictureUrl) {
    applyProfilePicture(profilePictureUrl);
  }

  // Handle file selection
  if (profilePictureInput) {
    profilePictureInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Please choose an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        applyProfilePicture(event.target.result);
        profilePictureInput.value = ''; // reset input
      };
      reader.readAsDataURL(file);
    });
  }

  // Reset to default
  if (resetProfilePictureBtn) {
    resetProfilePictureBtn.addEventListener('click', () => {
      applyProfilePicture(null);
    });
  }

  // ---- helpers ----
  function findCatalogLot(lotId) {
    for (const dept of (window.VELA_CATALOG || [])) {
      const item = dept.items.find(i => String(i.lotId) === String(lotId));
      if (item) return item;
    }
    return null;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---- tab switching ----
  function showTab(tabId) {
    tabButtons.forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('border-primary-container', isActive);
      btn.classList.toggle('text-primary-container', isActive);
      btn.classList.toggle('border-transparent', !isActive);
      btn.classList.toggle('text-on-surface-variant', !isActive);
    });
    tabSections.forEach(sec => {
      sec.classList.toggle('hidden', sec.getAttribute('data-section') !== tabId);
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.getAttribute('data-tab')));
  });

  // ---- populate account details from localStorage user ----
  if (accountMemberId) accountMemberId.textContent = user.memberId || 'VL-84920';
  if (accountPaddle) accountPaddle.textContent = user.paddle || '#8492';
  if (accountEmail) accountEmail.textContent = user.email || '';

  // ---- purchased items ----
  async function loadPurchased() {
    try {
      const res = await fetch(`/api/purchased/${userId}`);
      const data = await res.json();
      const items = data.purchased || [];
      const countText = `${items.length} Items Total`;
      if (purchasedCountBadge) purchasedCountBadge.textContent = countText;
      if (purchasedSectionCount) purchasedSectionCount.textContent = countText;
      renderPurchased(items);
    } catch (err) {
      console.error('Load purchased error:', err);
      if (purchasedCountBadge) purchasedCountBadge.textContent = '0 Items Total';
      if (purchasedSectionCount) purchasedSectionCount.textContent = '0 Items Total';
      if (purchasedList) purchasedList.innerHTML = `<p class="text-on-surface-variant text-center py-space-lg">Failed to load purchased items.</p>`;
    }
  }

  function purchaseItemHTML(item) {
    const lot = findCatalogLot(item.lotId);
    const price = item.pricePaid ? formatCurrency(item.pricePaid) : (lot ? formatCurrency(lot.startingBid) : '-');
    const img = lot ? lot.img : '';
    const name = lot ? lot.name : `Lot #${item.lotId}`;
    const brand = lot ? lot.brand : '';
    const date = item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString() : '';

    return `
      <article class="bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-space-md hover:border-primary-container/40 transition-all shadow-sm">
        <div class="flex flex-col sm:flex-row gap-space-md">
          <div class="w-full sm:w-36 h-36 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-low relative">
            ${img ? `<img class="w-full h-full object-cover" src="${escapeHtml(img)}" alt="${escapeHtml(name)}">` : `<div class="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant text-[12px]">No Image</div>`}
            <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-sm font-label-sm text-[11px] text-on-surface font-medium">Lot #${escapeHtml(item.lotId)}</span>
          </div>
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <div class="flex flex-wrap items-center justify-between gap-1 mb-1">
                <span class="font-body-sm text-[13px] text-on-surface-variant">${date}</span>
              </div>
              <h3 class="font-headline-sm text-[18px] text-on-surface font-bold leading-tight">${escapeHtml(name)}</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">${escapeHtml(brand)} • Lot #${escapeHtml(item.lotId)}</p>
            </div>
            <div class="pt-space-sm mt-space-xs border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-space-sm">
              <div>
                <span class="font-label-sm text-label-sm text-on-surface-variant block">Winning Hammer Bid</span>
                <span class="font-headline-sm text-headline-sm text-primary-container font-bold">${escapeHtml(price)}</span>
              </div>
              <div class="flex items-center gap-2">
                <button class="h-9 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container font-label-sm text-label-sm text-on-surface transition-colors flex items-center gap-1" data-remove-purchased="${escapeHtml(item.lotId)}">
                  <span class="material-symbols-outlined text-[16px]">remove</span> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderPurchased(items) {
    if (!purchasedList) return;
    if (items.length === 0) {
      purchasedList.innerHTML = `<p class="text-on-surface-variant text-center py-space-lg">No purchased items yet.</p>`;
      return;
    }
    purchasedList.innerHTML = items.map(purchaseItemHTML).join('');
    setupRemoveButtons('purchased');
  }

  // ---- watchlist ----
  async function loadFavorites() {
    try {
      const res = await fetch(`/api/watchlist/${userId}`);
      const data = await res.json();
      const items = data.watchlist || [];
      const countText = `${items.length} Items`;
      if (favoritesCountBadge) favoritesCountBadge.textContent = countText;
      if (favoritesSectionCount) favoritesSectionCount.textContent = countText;
      renderFavorites(items);
    } catch (err) {
      console.error('Load favorites error:', err);
      if (favoritesCountBadge) favoritesCountBadge.textContent = '0 Items';
      if (favoritesSectionCount) favoritesSectionCount.textContent = '0 Items';
      if (favoritesList) favoritesList.innerHTML = `<p class="text-on-surface-variant text-center py-space-lg">Failed to load favorites.</p>`;
    }
  }

  function favoriteItemHTML(item) {
    const lot = findCatalogLot(item.lotId);
    const img = lot ? lot.img : '';
    const name = lot ? lot.name : `Lot #${item.lotId}`;
    const brand = lot ? lot.brand : '';
    const est = lot ? lot.estimate : '-';

    return `
      <article class="bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-space-md hover:border-primary-container/40 transition-all shadow-sm">
        <div class="flex flex-col sm:flex-row gap-space-md">
          <div class="w-full sm:w-36 h-36 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-low relative">
            ${img ? `<img class="w-full h-full object-cover" src="${escapeHtml(img)}" alt="${escapeHtml(name)}">` : `<div class="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant text-[12px]">No Image</div>`}
            <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-sm font-label-sm text-[11px] text-on-surface font-medium">Lot #${escapeHtml(item.lotId)}</span>
          </div>
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <div class="flex flex-wrap items-center justify-between gap-1 mb-1">
                <span class="font-body-sm text-[13px] text-on-surface-variant">Favorite</span>
              </div>
              <h3 class="font-headline-sm text-[18px] text-on-surface font-bold leading-tight">${escapeHtml(name)}</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">${escapeHtml(brand)} • Estimate ${escapeHtml(est)}</p>
            </div>
            <div class="pt-space-sm mt-space-xs border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-space-sm">
              <div></div>
              <div class="flex items-center gap-2">
                <button class="h-9 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container font-label-sm text-label-sm text-on-surface transition-colors flex items-center gap-1" data-remove-favorites="${escapeHtml(item.lotId)}">
                  <span class="material-symbols-outlined text-[16px]">remove</span> Remove
                </button>
                <a href="live-auction.html?lot=${escapeHtml(item.lotId)}" class="h-9 px-3.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-sm text-label-sm transition-colors flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">gavel</span> Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderFavorites(items) {
    if (!favoritesList) return;
    if (items.length === 0) {
      favoritesList.innerHTML = `<p class="text-on-surface-variant text-center py-space-lg">Your favorites are empty.</p>`;
      return;
    }
    favoritesList.innerHTML = items.map(favoriteItemHTML).join('');
    setupRemoveButtons('favorites');
  }

  // ---- remove button handlers (event delegation via direct binding) ----
  function setupRemoveButtons(type) {
    const attr = `data-remove-${type}`;
    document.querySelectorAll(`[${attr}]`).forEach(btn => {
      // remove old listeners by cloning, then add fresh
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', async () => {
        const lotId = newBtn.getAttribute(attr);
        try {
          const res = await fetch(`/api/${type}/${userId}/${lotId}`, { method: 'DELETE' });
          if (res.ok) {
            if (type === 'purchased') loadPurchased();
            else loadWatchlist();
          } else {
            const data = await res.json().catch(() => ({}));
            alert(data.message || 'Failed to remove item');
          }
        } catch (err) {
          alert('Could not reach the server');
        }
      });
    });
  }

  // ---- initial load ----
  loadPurchased();
  loadFavorites();
  showTab('purchased');
});
