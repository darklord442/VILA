// Live Auction page - Bidding console, chat, reactions, realtime WebSocket sync
let activeBidTarget = 145000;
let currentLotId = null; // null = default (non-catalog) lot

// Derive paddle + display name from logged-in user, fallback to a unique session paddle
const storedUser = localStorage.getItem('user');
const parsedUser = storedUser ? (() => { try { return JSON.parse(storedUser); } catch (e) { return null; } })() : null;
const myPaddle = parsedUser ? `#${String(parsedUser.id || Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}` : `#${Math.floor(Math.random() * 9000) + 1000}`;
const myDisplayName = `Paddle ${myPaddle} (You)`;

// Push the dynamic paddle into the HTML paddle displays
function updatePaddleDisplays() {
  document.querySelectorAll('#paddle-id-display, #console-paddle').forEach(el => {
    el.textContent = myPaddle;
  });
}
updatePaddleDisplays();

// WebSocket status UI
const wsStatusEl = document.getElementById('ws-status');
function setWSStatus(connected) {
  wsConnected = connected;
  if (wsStatusEl) {
    wsStatusEl.textContent = connected ? 'Connected' : 'Disconnected';
    wsStatusEl.className = connected
      ? 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse'
      : 'w-2 h-2 rounded-full bg-rose-500';
  }
}

// ---------- Helpers ----------

function fmtMoney(n) {
  return '$' + new Intl.NumberFormat('en-US').format(n);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ---------- Bid console ----------

function selectIncrement(amount, buttonElem) {
  activeBidTarget = amount;
  document.getElementById('custom-bid-input').value = amount;
  updateBidButtonText(amount);

  document.querySelectorAll('.increment-btn').forEach(btn => {
    btn.classList.remove('border-2', 'border-primary', 'bg-blue-50/80', 'bg-blue-50');
    btn.classList.add('bg-slate-50', 'border', 'border-slate-200');
  });
  if (buttonElem) {
    buttonElem.classList.remove('bg-slate-50', 'border', 'border-slate-200');
    buttonElem.classList.add('border-2', 'border-primary', 'bg-blue-50/80');
  }
}

function syncCustomBid(value) {
  const val = parseInt(value, 10);
  if (!isNaN(val)) {
    activeBidTarget = val;
    updateBidButtonText(val);
  }
}

function updateBidButtonText(amount) {
  const formatted = new Intl.NumberFormat('en-US').format(amount);
  document.getElementById('bid-btn-text').innerText = 'Raise Hand • Bid $' + formatted;
}

// Rebuild increment pills + custom input around a given high bid
function setupBidConsole(baseBid) {
  const inc = Math.max(500, Math.round((baseBid * 0.05) / 500) * 500);
  const amounts = [baseBid + inc, baseBid + inc * 2, baseBid + inc * 4];
  const incLabels = ['Standard Step', 'Power Jump', 'Floor Hammer Cut'];
  const incBtns = document.querySelectorAll('.increment-btn');
  incBtns.forEach((btn, i) => {
    if (i >= amounts.length) return;
    const delta = amounts[i] - baseBid;
    btn.setAttribute('onclick', `selectIncrement(${amounts[i]}, this)`);
    const spans = btn.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = `+ ${fmtMoney(delta)}`;
    if (spans[1]) spans[1].textContent = fmtMoney(amounts[i]);
    if (spans[2]) spans[2].textContent = incLabels[i] || '';
  });

  const input = document.getElementById('custom-bid-input');
  if (input) {
    input.min = baseBid;
    input.value = amounts[0];
  }
  setText('custom-bid-min-label', `Min: ${fmtMoney(baseBid)}`);

  activeBidTarget = amounts[0];
  updateBidButtonText(activeBidTarget);
  selectIncrement(amounts[0], incBtns[0]);
}

// ---------- Feed renderers ----------

function appendBidFeedEntry(amount, bidderText) {
  const formatted = new Intl.NumberFormat('en-US').format(amount);
  const feed = document.getElementById('bid-stream-feed');
  const newEntry = document.createElement('div');
  newEntry.className = "p-space-sm rounded-xl bg-blue-100/70 border border-blue-300 flex items-center justify-between text-slate-900 animate-bounce";
  newEntry.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="material-symbols-outlined text-primary text-headline-sm">how_to_reg</span>
      <div>
        <div class="font-label-sm text-label-sm text-primary uppercase font-extrabold tracking-wider">YOU ARE NOW HIGHEST BIDDER</div>
        <div class="font-label-md text-label-md text-slate-900 font-semibold">${escapeHtml(bidderText)} placed <strong class="text-primary font-bold">$${formatted}</strong></div>
      </div>
    </div>
    <span class="font-label-sm text-label-sm text-primary font-bold">Confirmed</span>
  `;
  feed.appendChild(newEntry);
  feed.scrollTop = feed.scrollHeight;
}

function renderChatMessage(m) {
  const feed = document.getElementById('bid-stream-feed');
  const initials = String(m.user || '?').slice(0, 2).toUpperCase();
  const el = document.createElement('div');
  el.className = "flex items-start gap-space-xs px-space-xs py-1";
  const avatar = document.createElement('div');
  avatar.className = "w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0 shadow-xs";
  avatar.textContent = initials;
  const body = document.createElement('div');
  body.className = "flex flex-col";
  const meta = document.createElement('div');
  meta.className = "flex items-baseline gap-space-xs";
  const nameEl = document.createElement('span');
  nameEl.className = "font-label-sm text-label-sm font-bold text-primary";
  nameEl.textContent = m.user;
  const timeEl = document.createElement('span');
  timeEl.className = "font-label-sm text-label-sm text-slate-400";
  timeEl.textContent = 'Just now';
  meta.appendChild(nameEl);
  meta.appendChild(timeEl);
  const textEl = document.createElement('p');
  textEl.className = "font-body-sm text-body-sm text-slate-800";
  textEl.textContent = m.text;
  body.appendChild(meta);
  body.appendChild(textEl);
  el.appendChild(avatar);
  el.appendChild(body);
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
}

function appendReactionEntry(emoji, userName) {
  const feed = document.getElementById('bid-stream-feed');
  const el = document.createElement('div');
  el.className = "flex items-center gap-2 px-space-xs py-1 text-body-sm text-slate-500";
  const emojiEl = document.createElement('span');
  emojiEl.className = "text-headline-sm";
  emojiEl.textContent = emoji;
  const label = document.createElement('span');
  label.className = "font-label-sm text-label-sm font-medium";
  label.textContent = `${userName} reacted`;
  el.appendChild(emojiEl);
  el.appendChild(label);
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
}

function appendSystemNote(text) {
  const feed = document.getElementById('bid-stream-feed');
  const el = document.createElement('div');
  el.className = "px-space-xs py-1 text-center";
  const span = document.createElement('span');
  span.className = "font-label-sm text-label-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-full px-3 py-1 inline-block";
  span.textContent = text;
  el.appendChild(span);
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
}

// ---------- User actions (WS with local fallback) ----------

function executeBid() {
  if (auctionEnded || (auctionState && auctionState.auctionStatus === 'closed')) {
    appendSystemNote('This auction has closed. Bidding is no longer accepted.');
    return;
  }
  if (!currentLotId) {
    appendSystemNote('No active lot selected.');
    return;
  }
  if (wsConnected && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'bid',
      lotId: currentLotId,
      amount: activeBidTarget,
      bidder: myDisplayName,
      paddle: myPaddle,
    }));
    console.log('WS bid sent:', { lotId: currentLotId, amount: activeBidTarget, bidder: myDisplayName, paddle: myPaddle });
    return; // UI updates when the broadcast 'bid' / 'auction_state' event arrives
  }
  // Offline fallback: local-only update
  const formatted = new Intl.NumberFormat('en-US').format(activeBidTarget);
  setText('display-current-bid', '$' + formatted);
  appendBidFeedEntry(activeBidTarget, myDisplayName);
  selectIncrement(activeBidTarget + 2500);
}

function handleSaleroomChat(e) {
  e.preventDefault();
  const input = document.getElementById('saleroom-chat-input');
  const text = input.value.trim();
  if (!text) return;
  if (wsConnected && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'chat', lotId: currentLotId, user: myDisplayName, text }));
    console.log('WS chat sent:', { lotId: currentLotId, user: myDisplayName, text });
    input.value = '';
    return; // rendered when broadcast arrives
  }
  renderChatMessage({ user: myDisplayName, text });
  input.value = '';
}

function sendQuickReaction(emoji) {
  if (wsConnected && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'reaction', emoji, user: myDisplayName, lotId: currentLotId }));
    console.log('WS reaction sent:', { emoji, user: myDisplayName, lotId: currentLotId });
    return;
  }
  appendReactionEntry(emoji, myDisplayName);
}

// ---------- WebSocket realtime layer ----------

let ws = null;
let wsConnected = false;

function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  try {
    ws = new WebSocket(`${proto}://${location.host}`);
  } catch (err) {
    console.warn('WebSocket connect failed:', err);
    setWSStatus(false);
    return;
  }
  ws.onopen = () => {
    setWSStatus(true);
    console.log('WS connected');
    ws.send(JSON.stringify({ type: 'state_request', lotId: currentLotId }));
  };
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      console.log('WS message received:', msg.type, msg);
      handleWSMessage(msg);
    } catch (err) { console.warn('Bad WS payload:', err); }
  };
  ws.onclose = () => {
    setWSStatus(false);
    setTimeout(connectWS, 3000); // auto-reconnect
  };
  ws.onerror = () => { setWSStatus(false); };
}

function sameLot(a, b) {
  return String(a ?? '') === String(b ?? '');
}

function handleWSMessage(msg) {
  switch (msg.type) {
    case 'state':
      onStateSync(msg);
      break;
    case 'bid':
      if (sameLot(msg.lotId, currentLotId)) {
        setText('display-current-bid', fmtMoney(msg.amount));
        appendBidFeedEntry(msg.amount, msg.bidder || (msg.paddle ? `Paddle ${msg.paddle}` : 'Anonymous'));
        setupBidConsole(msg.amount);
      }
      break;
    case 'auction_state':
      if (sameLot(msg.lotId, currentLotId)) {
        auctionState = {
          lotId: msg.lotId,
          auctionStatus: msg.auctionStatus,
          timeLeft: msg.timeLeft,
          currentBid: msg.currentBid,
          currentBidder: msg.currentBidder,
          currentPaddle: msg.currentPaddle,
        };
        setText('display-current-bid', fmtMoney(msg.currentBid));
        renderAuctionUI();
      }
      break;
    case 'auction_closed':
      if (sameLot(msg.lotId, currentLotId)) {
        auctionEnded = true;
        auctionState = {
          lotId: msg.lotId,
          auctionStatus: 'closed',
          timeLeft: 0,
          currentBid: msg.winningBid,
          currentBidder: msg.winner,
          currentPaddle: msg.winnerPaddle,
        };
        renderAuctionUI();
        setText('display-current-bid', fmtMoney(msg.winningBid || 0));
        appendSystemNote(`🔨 AUCTION CLOSED — Won by ${msg.winner || 'no bids'} at ${fmtMoney(msg.winningBid || 0)}`);
        if (bidBtn) {
          bidBtn.disabled = true;
          bidBtn.classList.add('opacity-50', 'cursor-not-allowed');
          bidBtn.classList.remove('hover:bg-blue-700');
          const btnText = document.getElementById('bid-btn-text');
          if (btnText) btnText.textContent = 'Auction Closed';
        }
      }
      break;
    case 'chat':
      if (sameLot(msg.lotId, currentLotId)) {
        renderChatMessage({ user: msg.user, text: msg.text });
      }
      break;
    case 'reaction':
      appendReactionEntry(msg.emoji, msg.user || 'Guest');
      break;
    case 'bid_ack':
      if (!msg.ok) appendSystemNote(`Bid rejected: ${msg.error || 'invalid bid'}`);
      break;
    case 'chat_ack':
      if (!msg.ok) appendSystemNote(`Message rejected: ${msg.error || 'invalid'}`);
      break;
    case 'error':
      console.warn('Server WS error:', msg.message);
      break;
  }
}

function onStateSync(state) {
  const lot = (state.lots || []).find(l => sameLot(l.lotId, currentLotId));
  if (lot && lot.currentBid != null) {
    setText('display-current-bid', fmtMoney(lot.currentBid));
    setupBidConsole(lot.currentBid);
  }
  (state.messages || [])
    .filter(m => sameLot(m.lotId, currentLotId))
    .forEach(renderChatMessage);
}

// ---------- Catalog lot loading (?lot=LOT_ID) ----------

function findCatalogLot(lotId) {
  const catalog = window.VELA_CATALOG || [];
  for (const dept of catalog) {
    const item = dept.items.find(i => i.lotId === lotId);
    if (item) return { item, dept };
  }
  return null;
}

function loadLotFromQuery() {
  const lotId = new URLSearchParams(window.location.search).get('lot');
  if (!lotId) return;
  const found = findCatalogLot(lotId);
  if (!found) return;
  const { item, dept } = found;
  currentLotId = item.lotId;
  const bid = item.startingBid;

  const img = document.getElementById('lot-hero-img');
  if (img) {
    img.src = item.img;
    img.alt = `${item.brand} ${item.name}`;
  }

  setText('lot-count-badge', `LOT ${item.lotId} • Vault Certified`);
  setText('session-lot-label', `Lot #${item.lotId} — ${item.brand}`);
  setText('lot-reference', `${dept.department} • ${dept.name}`);
  setText('lot-title', `${item.brand} ${item.name}`);
  setText('lot-estimate', item.estimate);
  setText('lot-description', `Authenticated ${item.brand} — ${item.name}. Offered in ${dept.name} with a pre-sale estimate of ${item.estimate}. All VELA lots are escrow-verified and accompanied by full provenance documentation.`);
  setText('display-current-bid', fmtMoney(bid));

  // Update the four spec tiles
  const specs = item.specs || [];
  for (let i = 0; i < 4; i++) {
    const spec = specs[i];
    if (!spec) continue;
    setText(`spec-label-${i}`, spec.label);
    setText(`spec-value-${i}`, spec.value);
  }

  setupBidConsole(bid);
}

loadLotFromQuery();
connectWS();

// ---------- Auction state (server-synced timer + winner) ----------

let auctionState = null;
let auctionEnded = false;

const timerElem = document.getElementById('timer-display');
const timerBox = document.getElementById('hammer-timer');
const bidBtn = document.getElementById('bid-submit-btn');

function formatTimeLeft(ms) {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function renderAuctionUI() {
  if (!timerElem || !timerBox) return;

  if (auctionEnded || (auctionState && auctionState.auctionStatus === 'closed')) {
    timerBox.classList.remove('bg-blue-100', 'ring-2', 'ring-primary-container');
    timerBox.classList.add('bg-rose-50', 'border-rose-200');
    timerElem.textContent = 'CLOSED';
    timerElem.className = 'font-headline-sm text-headline-sm font-bold text-rose-600 tabular-nums';
    if (bidBtn) {
      bidBtn.disabled = true;
      bidBtn.classList.add('opacity-50', 'cursor-not-allowed');
      bidBtn.classList.remove('hover:bg-blue-700');
      const btnText = document.getElementById('bid-btn-text');
      if (btnText) btnText.textContent = 'Auction Closed';
    }
    return;
  }

  const timeLeft = auctionState ? auctionState.timeLeft : 0;
  timerElem.textContent = formatTimeLeft(timeLeft);

  // Visual warning in final 10 seconds
  if (timeLeft <= 10000 && timeLeft > 0) {
    timerBox.classList.add('bg-rose-50', 'border-rose-200', 'animate-pulse');
    timerBox.classList.remove('bg-blue-100', 'ring-2', 'ring-primary-container');
    timerElem.className = 'font-headline-sm text-headline-sm font-bold text-rose-600 tabular-nums';
  } else if (timeLeft > 0) {
    timerBox.classList.add('bg-blue-100', 'ring-2', 'ring-primary-container');
    timerBox.classList.remove('bg-rose-50', 'border-rose-200', 'animate-pulse');
    timerElem.className = 'font-headline-sm text-headline-sm font-bold text-primary-container tabular-nums';
  }

  // Show current leader under the bid display
  if (auctionState && auctionState.currentBidder) {
    const leaderBox = document.getElementById('current-leader');
    if (leaderBox) {
      leaderBox.innerHTML = `Led by <strong class="font-bold">${escapeHtml(auctionState.currentBidder)}</strong> at ${fmtMoney(auctionState.currentBid || 0)}`;
    }
  }
}

async function fetchAuctionState() {
  if (!currentLotId) return;
  try {
    const res = await fetch(`/api/auction/${currentLotId}/state`);
    const data = await res.json();
    if (data.status === 'success') {
      auctionState = {
        lotId: data.lotId,
        auctionStatus: data.auctionStatus,
        timeLeft: data.timeLeft,
        currentBid: data.currentBid,
        currentBidder: data.currentBidder,
        currentPaddle: data.currentPaddle,
      };
      renderAuctionUI();
    }
  } catch (err) {
    console.warn('Auction state fetch failed:', err);
  }
}

// Poll auction state every second for the countdown
setInterval(fetchAuctionState, 1000);

// Initial fetch once WS is connected
fetchAuctionState();
