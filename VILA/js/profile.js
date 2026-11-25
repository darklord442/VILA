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
  const watchlistList = document.getElementById('watchlistItemsList');
  const purchasedCountBadge = document.getElementById('purchasedCountBadge');
  const watchlistCountBadge = document.getElementById('watchlistCountBadge');
  const purchasedSectionCount = document.getElementById('purchasedSectionCount');
  const watchlistSectionCount = document.getElementById('watchlistSectionCount');
  const tabButtons = document.querySelectorAll('[data-tab]');
  const tabSections = document.querySelectorAll('[data-section]');

  const accountMemberId = document.getElementById('accountMemberId');
  const accountPaddle = document.getElementById('accountPaddle');
  const accountEmail = document.getElementById('accountEmail');

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
  async function loadWatchlist() {
    try {
      const res = await fetch(`/api/watchlist/${userId}`);
      const data = await res.json();
      const items = data.watchlist || [];
      const countText = `${items.length} Items`;
      if (watchlistCountBadge) watchlistCountBadge.textContent = countText;
      if (watchlistSectionCount) watchlistSectionCount.textContent = countText;
      renderWatchlist(items);
    } catch (err) {
      console.error('Load watchlist error:', err);
      if (watchlistCountBadge) watchlistCountBadge.textContent = '0 Items';
      if (watchlistSectionCount) watchlistSectionCount.textContent = '0 Items';
      if (watchlistList) watchlistList.innerHTML = `<p class="text-on-surface-variant text-center py-space-lg">Failed to load watchlist.</p>`;
    }
  }

  function watchlistItemHTML(item) {
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
                <span class="font-body-sm text-[13px] text-on-surface-variant">Watchlist</span>
              </div>
              <h3 class="font-headline-sm text-[18px] text-on-surface font-bold leading-tight">${escapeHtml(name)}</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">${escapeHtml(brand)} • Estimate ${escapeHtml(est)}</p>
            </div>
            <div class="pt-space-sm mt-space-xs border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-space-sm">
              <div></div>
              <div class="flex items-center gap-2">
                <button class="h-9 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container font-label-sm text-label-sm text-on-surface transition-colors flex items-center gap-1" data-remove-watchlist="${escapeHtml(item.lotId)}">
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

  function renderWatchlist(items) {
    if (!watchlistList) return;
    if (items.length === 0) {
      watchlistList.innerHTML = `<p class="text-on-surface-variant text-center py-space-lg">Your watchlist is empty.</p>`;
      return;
    }
    watchlistList.innerHTML = items.map(watchlistItemHTML).join('');
    setupRemoveButtons('watchlist');
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
  loadWatchlist();
  showTab('purchased');
});
