// Categories page - Department data, filtering, and search
console.log('Categories script loaded');

const categories = window.VELA_CATALOG;

// Maps data-dept attribute values to category ids
const DEPT_KEY_TO_ID = {
  footwear: 'dept-01',
  couture: 'dept-02',
  jewelry: 'dept-03',
  timepieces: 'dept-04',
};

const viewState = { dept: 'all', query: '' };

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

// ---- live lot state + favorites (watchlist) state ----
let favoriteUserId = null;
let favoritedLotIds = new Set();
let lotStatesById = new Map();

async function loadLotStates() {
  try {
    const res = await fetch('/api/lots');
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.lots)) {
      lotStatesById = new Map(
        data.lots.map(l => [
          String(l.lotId),
          { currentBid: l.currentBid, auctionStatus: l.auctionStatus || 'active' },
        ])
      );
    }
  } catch (e) {
    console.error('Load lot states error:', e);
  }
}

async function loadUserFavorites() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return;
  try {
    const parsed = JSON.parse(storedUser);
    favoriteUserId = parsed.id;
  } catch (e) {}
  if (!favoriteUserId) return;
  try {
    const res = await fetch(`/api/watchlist/${favoriteUserId}`);
    const data = await res.json();
    favoritedLotIds = new Set((data.watchlist || []).map(item => String(item.lotId)));
  } catch (e) {
    console.error('Load favorites error:', e);
  }
}

async function toggleFavorite(lotId) {
  if (!favoriteUserId) {
    window.location.href = 'sign-in.html';
    return;
  }
  const isFav = favoritedLotIds.has(String(lotId));
  try {
    if (isFav) {
      await fetch(`/api/watchlist/${favoriteUserId}/${lotId}`, { method: 'DELETE' });
      favoritedLotIds.delete(String(lotId));
    } else {
      await fetch(`/api/watchlist/${favoriteUserId}/${lotId}`, { method: 'POST' });
      favoritedLotIds.add(String(lotId));
    }
  } catch (e) {
    console.error('Toggle favorite error:', e);
  }
}

function isFavorited(lotId) {
  return favoritedLotIds.has(String(lotId));
}

function lotCardHTML(item) {
  const fav = isFavorited(item.lotId);
  const heartIcon = fav ? 'favorite' : 'favorite_border';
  const heartClass = fav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500';
  const liveState = lotStatesById.get(String(item.lotId));
  const isClosed = liveState && liveState.auctionStatus === 'closed';
  const displayBid = liveState && liveState.currentBid != null ? liveState.currentBid : item.startingBid;
  const statusDotClass = isClosed ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse';
  const statusTextClass = isClosed ? 'text-rose-300' : 'text-emerald-300';
  const statusLabel = isClosed ? 'Closed' : 'Live Floor';
  const bidLabel = isClosed ? 'Final Bid' : 'Current Bid';
  const actionBtnClass = isClosed
    ? 'w-full py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-label-md text-label-md font-semibold transition-all shadow-sm flex items-center justify-center gap-2'
    : 'w-full py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95';
  const actionLabel = isClosed ? 'Auction Closed' : 'Place Floor Bid';
  const actionIcon = isClosed ? 'lock' : 'gavel';

  return `
    <div class="group bg-surface-container-lowest rounded-xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        <div class="relative h-64 w-full overflow-hidden bg-slate-900">
          <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
          <div class="absolute top-3 left-3 flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-mono text-label-sm font-semibold">Lot #${escapeHtml(item.lotId)}</span>
            <button data-favorite-lot="${escapeHtml(item.lotId)}" class="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-[18px] ${heartClass} transition-all hover:scale-110">
              <span class="material-symbols-outlined">${heartIcon}</span>
            </button>
          </div>
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <span class="text-xs uppercase tracking-widest font-mono text-blue-200">${escapeHtml(item.brand)}</span>
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full ${statusDotClass}"></span>
              <span class="text-xs font-semibold uppercase tracking-wider font-mono ${statusTextClass}">${statusLabel}</span>
            </div>
          </div>
        </div>
        <div class="p-space-md">
          <h3 class="font-headline-sm text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-space-sm">
            ${escapeHtml(item.name)}
          </h3>
          <div class="flex items-baseline justify-between pt-2 border-t border-slate-100">
            <div>
              <div class="text-xs text-on-surface-variant font-label-sm uppercase tracking-wider">${bidLabel}</div>
              <div class="text-xl font-bold font-mono text-primary mt-0.5">${formatCurrency(displayBid)}</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-on-surface-variant font-label-sm uppercase tracking-wider">Estimate</div>
              <div class="text-xs font-mono text-slate-600 mt-1">${escapeHtml(item.estimate)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="p-space-md pt-0">
        <a href="live-auction.html?lot=${encodeURIComponent(item.lotId)}" class="${actionBtnClass}">
          <span>${actionLabel}</span>
          <span class="material-symbols-outlined text-title-md">${actionIcon}</span>
        </a>
      </div>
    </div>
  `;
}

function setGrid(items) {
  document.getElementById('categoryLotsGrid').innerHTML = items.map(lotCardHTML).join('');
}

function setHeader(badge, title, subtitle, countText) {
  document.getElementById('categoryDeptBadge').textContent = badge;
  document.getElementById('categoryTitle').textContent = title;
  document.getElementById('categorySubtitle').textContent = subtitle;
  document.getElementById('categoryActiveLotsCount').textContent = countText;
}

function renderAllLots() {
  const allItems = categories.flatMap(dept => dept.items);
  setHeader('All Departments', 'Catalog Lots', 'All authenticated lots across every department.', `${allItems.length} Catalog Lots`);
  setGrid(allItems);
}

function renderDeptLots(deptKey) {
  const deptId = DEPT_KEY_TO_ID[deptKey] || deptKey;
  const dept = categories.find(c => c.id === deptId);
  if (!dept) return;
  setHeader(dept.department, dept.name, 'Curated active floor session lots and authenticated archive inventory.', `${dept.items.length} Active Lots`);
  setGrid(dept.items);
}

function renderSearchResults(query) {
  const q = query.trim().toLowerCase();
  const allItems = categories.flatMap(dept => dept.items);
  const filtered = allItems.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.brand.toLowerCase().includes(q) ||
    item.lotId.includes(q)
  );
  setHeader('Search Results', 'Filtered Lots', `Showing ${filtered.length} lots matching "${query.trim()}"`, `${filtered.length} Results`);
  setGrid(filtered);
}

function renderCurrentView() {
  if (viewState.query.trim()) {
    renderSearchResults(viewState.query);
  } else if (viewState.dept === 'all') {
    renderAllLots();
  } else {
    renderDeptLots(viewState.dept);
  }
}

function showAllCategories() {
  viewState.dept = 'all';
  viewState.query = '';
  const searchInput = document.getElementById('categorySearchInput');
  if (searchInput) searchInput.value = '';
  document.getElementById('allCategoriesOverview').classList.remove('hidden');
  document.getElementById('categoryLotView').classList.remove('hidden');
  renderAllLots();
  updateFilterStyles('all');
}

function showDepartment(deptKey) {
  viewState.dept = deptKey;
  viewState.query = '';
  const searchInput = document.getElementById('categorySearchInput');
  if (searchInput) searchInput.value = '';
  renderDeptLots(deptKey);
  document.getElementById('allCategoriesOverview').classList.add('hidden');
  document.getElementById('categoryLotView').classList.remove('hidden');
  window.scrollTo({ top: document.getElementById('categoryLotView').offsetTop - 100, behavior: 'smooth' });
  updateFilterStyles(deptKey);
}

function updateFilterStyles(deptKey) {
  document.querySelectorAll('#categoryFilterBar button').forEach(btn => {
    const btnDept = btn.getAttribute('data-dept');
    const isActive = btnDept === deptKey;
    btn.classList.toggle('bg-primary', isActive);
    btn.classList.toggle('text-on-primary', isActive);
    btn.classList.toggle('bg-surface-container-lowest', !isActive);
    btn.classList.toggle('text-on-surface', !isActive);
    const badge = btn.querySelector('span:last-child');
    if (badge) {
      badge.classList.toggle('bg-primary-container', isActive);
      badge.classList.toggle('text-on-primary', isActive);
      badge.classList.toggle('bg-surface-container-high', !isActive);
      badge.classList.toggle('text-on-surface-variant', !isActive);
    }
  });
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
  await Promise.all([loadUserFavorites(), loadLotStates()]);
  showAllCategories();

  // Filter bar buttons
  document.querySelectorAll('#categoryFilterBar button').forEach(button => {
    button.addEventListener('click', function() {
      const dept = this.getAttribute('data-dept');
      if (dept === 'all') {
        showAllCategories();
      } else {
        showDepartment(dept);
      }
    });
  });

  // Category card explore buttons
  document.querySelectorAll('#allCategoriesOverview button[data-dept]').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const dept = this.getAttribute('data-dept');
      if (dept) showDepartment(dept);
    });
  });

  // Back button
  document.getElementById('backToAllCategoriesBtn')?.addEventListener('click', showAllCategories);

  // Search input
  const searchInput = document.getElementById('categorySearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      viewState.query = e.target.value;
      if (viewState.query.trim()) {
        document.getElementById('allCategoriesOverview').classList.add('hidden');
        document.getElementById('categoryLotView').classList.remove('hidden');
        renderSearchResults(viewState.query);
      } else {
        showAllCategories();
      }
    });
  }

  // Favorite button delegation (re-checked on every render via data attribute)
  document.getElementById('categoryLotsGrid').addEventListener('click', async (e) => {
    const heartBtn = e.target.closest('[data-favorite-lot]');
    if (!heartBtn) return;
    e.preventDefault();
    e.stopPropagation();
    const lotId = heartBtn.getAttribute('data-favorite-lot');
    await toggleFavorite(lotId);
    const isFav = isFavorited(lotId);
    const icon = heartBtn.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = isFav ? 'favorite' : 'favorite_border';
    }
    heartBtn.classList.toggle('text-rose-500', isFav);
    heartBtn.classList.toggle('text-slate-400', !isFav);
    heartBtn.classList.toggle('hover:text-rose-500', !isFav);
  });
});
