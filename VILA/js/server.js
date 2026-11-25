const express = require('express');
const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');
const { WebSocketServer } = require('ws');
const db = require('./db');
const { VELA_CATALOG } = require('./catalog');
require('dotenv').config();

const app = express();
app.use(express.json());

// Redirect trailing-slash .html URLs (e.g. /categories.html/ -> /categories.html)
app.get(/\.html\/$/, (req, res) => {
  res.redirect(301, req.path.replace(/\/$/, ''));
});

// Landing page: sign-in first
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/sign-in.html'));
});

// Explicit routes for all HTML pages
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/index.html'));
});

app.get('/live-auction.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/live-auction.html'));
});

app.get('/categories.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/categories.html'));
});

app.get('/sell.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/sell.html'));
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/profile.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/register.html'));
});

app.get('/sign-in.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/sign-in.html'));
});

// Serve the static frontend (HTML pages and images)
app.use(express.static(path.join(__dirname, '../pages')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname)));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// ============ Auth CRUD (users table) ============

// CREATE - register a new user
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'fullName, email and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email, created_at',
      [fullName, email, passwordHash]
    );

    res.status(201).json({ status: 'success', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'Email already registered' });
    }
    console.error('Register error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// READ - log in (verify credentials)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'email and password are required' });
    }

    const result = await db.query(
      'SELECT id, full_name, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    // Never send the hash back to the client
    const { password_hash, ...safeUser } = user;
    res.json({ status: 'success', user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// READ - get a user's profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, full_name, email, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.json({ status: 'success', user: result.rows[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// UPDATE - change name and/or password
app.put('/api/users/:id', async (req, res) => {
  try {
    const { fullName, password } = req.body;
    const updates = [];
    const values = [];

    if (fullName) {
      values.push(fullName);
      updates.push(`full_name = $${values.length}`);
    }
    if (password) {
      values.push(await bcrypt.hash(password, 10));
      updates.push(`password_hash = $${values.length}`);
    }
    if (updates.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Nothing to update' });
    }

    values.push(req.params.id);
    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length}
       RETURNING id, full_name, email, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.json({ status: 'success', user: result.rows[0] });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE - remove a user account
app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.json({ status: 'success', message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============ Auction Realtime (bids, chat, reactions) ============

// Create tables on startup (idempotent)
async function initAuctionTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS auction_bids (
        id SERIAL PRIMARY KEY,
        lot_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        bidder TEXT,
        paddle TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS auction_messages (
        id SERIAL PRIMARY KEY,
        lot_id TEXT,
        user_name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Auction tables ready');
  } catch (err) {
    console.error('Auction table init failed (continuing anyway):', err.message);
  }
}
initAuctionTables();

	// ============ User Purchased Items & Watchlist tables ============

	async function initUserItemTables() {
	  try {
	    await db.query(`
	      CREATE TABLE IF NOT EXISTS purchased_items (
	        id SERIAL PRIMARY KEY,
	        user_id INTEGER NOT NULL,
	        lot_id TEXT NOT NULL,
	        price_paid INTEGER,
	        purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	        UNIQUE(user_id, lot_id)
	      )
	    `);
	    await db.query(`
	      CREATE TABLE IF NOT EXISTS watchlist_items (
	        id SERIAL PRIMARY KEY,
	        user_id INTEGER NOT NULL,
	        lot_id TEXT NOT NULL,
	        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	        UNIQUE(user_id, lot_id)
	      )
	    `);
	    console.log('User item tables ready');
	  } catch (err) {
	    console.error('User item table init failed:', err.message);
	  }
	}
	initUserItemTables();

function findCatalogLot(lotId) {
  for (const dept of VELA_CATALOG) {
    const item = dept.items.find(i => String(i.lotId) === String(lotId));
    if (item) return { item, dept };
  }
  return null;
}

// ============ Auction Session State (per lot) ============

const auctionSessions = new Map();
const AUCTION_DURATION_MS = 30 * 60 * 1000; // 30 minutes per lot
const ANTI_SNIPE_WINDOW_MS = 10 * 1000;     // extend if bid in last 10 seconds
const ANTI_SNIPE_EXTENSION_MS = 60 * 1000;  // add 60 seconds

function initAuctionSessions() {
  for (const dept of VELA_CATALOG) {
    for (const item of dept.items) {
      auctionSessions.set(String(item.lotId), {
        lotId: String(item.lotId),
        endTime: Date.now() + AUCTION_DURATION_MS,
        status: 'active',
        startingBid: item.startingBid,
      });
    }
  }
  console.log(`Auction sessions initialized for ${auctionSessions.size} lots`);
}
initAuctionSessions();

function getAuctionSession(lotId) {
  return auctionSessions.get(String(lotId)) || null;
}

function startFreshAuction(lotId, startingBid) {
  // New round: clear any head-to-head call state from the previous round
  auctionDuels.delete(String(lotId));
  auctionSessions.set(String(lotId), {
    lotId: String(lotId),
    endTime: Date.now() + AUCTION_DURATION_MS,
    status: 'active',
    startingBid,
  });
  console.log(`Fresh auction started for Lot #${lotId}`);
}

function getAuctionState(lotId) {
  const session = getAuctionSession(lotId);
  if (!session) return null;
  const now = Date.now();
  let status = session.status;
  if (status === 'active' && now >= session.endTime) {
    status = 'closed';
    session.status = 'closed';
  }
  return {
    lotId: session.lotId,
    status,
    timeLeft: status === 'active' ? Math.max(0, session.endTime - now) : 0,
    endTime: session.endTime,
    startingBid: session.startingBid,
  };
}

function extendAuction(lotId, extraMs = ANTI_SNIPE_EXTENSION_MS) {
  const session = getAuctionSession(lotId);
  if (!session || session.status !== 'active') return false;
  session.endTime = Date.now() + extraMs;
  return true;
}

function closeAuction(lotId) {
  const session = getAuctionSession(lotId);
  if (!session) return null;
  session.status = 'closed';
  return session;
}

// ============ Auction Floor Call (head-to-head bidding duel) ============
// The server alternates the call between bidders: the first bidder leads,
// then the web calls the other person to answer. They go back and forth
// until a countdown expires without an answer — the current leader wins.

const DUEL_TURN_MS = 30 * 1000; // 30 seconds to answer each floor call

const auctionDuels = new Map();

function getDuel(lotId) {
  return auctionDuels.get(String(lotId)) || null;
}

function newDuel(lotId, leaderPaddle, leaderBidder, leaderAmount) {
  return {
    lotId: String(lotId),
    leaderPaddle, leaderBidder, leaderAmount,   // current high bidder
    challengerPaddle: null, challengerBidder: null, // paddle the server is calling
    callNumber: 0,
    deadline: Date.now() + DUEL_TURN_MS,        // countdown starts on the opening bid
    status: 'open',                              // open | decided
    winnerPaddle: null, winnerBidder: null, winnerAmount: null,
  };
}

function broadcastDuelCall(duel) {
  const timeLeft = Math.max(0, duel.deadline - Date.now());
  broadcast({
    type: 'auction_call',
    lotId: duel.lotId,
    callNumber: duel.callNumber,
    status: duel.status,
    turnPaddle: duel.challengerPaddle,
    turnBidder: duel.challengerBidder,
    leaderPaddle: duel.leaderPaddle,
    leaderBidder: duel.leaderBidder,
    leaderAmount: duel.leaderAmount,
    timeLeft,
    ts: new Date().toISOString(),
  });
}

function decideDuel(duel) {
  duel.status = 'decided';
  duel.winnerPaddle = duel.leaderPaddle;
  duel.winnerBidder = duel.leaderBidder;
  duel.winnerAmount = duel.leaderAmount;
  duel.deadline = null;
  return duel;
}

function broadcastDuelWon(duel) {
  broadcast({
    type: 'auction_won',
    lotId: duel.lotId,
    winnerPaddle: duel.winnerPaddle,
    winnerBidder: duel.winnerBidder,
    winningBid: duel.winnerAmount,
    callNumber: duel.callNumber,
    ts: new Date().toISOString(),
  });
  // Hammer falls: close the lot so no more bids are accepted
  closeAuction(duel.lotId);
  broadcast({
    type: 'auction_closed',
    lotId: duel.lotId,
    winner: duel.winnerBidder,
    winnerPaddle: duel.winnerPaddle,
    winningBid: duel.winnerAmount,
    ts: new Date().toISOString(),
  });
  console.log(`Lot #${duel.lotId} won by ${duel.winnerBidder} (${duel.winnerPaddle}) at $${duel.winnerAmount} after ${duel.callNumber} calls`);
}

// Close expired auctions every second and broadcast results
setInterval(async () => {
  for (const [lotId, session] of auctionSessions.entries()) {
    if (session.status === 'active' && Date.now() >= session.endTime) {
      session.status = 'closed';
      const top = await getTopBid(lotId);
      broadcast({
        type: 'auction_closed',
        lotId,
        winner: top ? top.bidder : null,
        winnerPaddle: top ? top.paddle : null,
        winningBid: top ? top.amount : null,
        ts: new Date().toISOString(),
      });
      console.log(`Auction closed for Lot #${lotId}. Winner: ${top ? top.bidder : 'none'} at $${top ? top.amount : 0}`);
    }
  }

  // Decide head-to-head calls whose countdown expired — the timer picks the winner
  for (const [lotId, duel] of auctionDuels.entries()) {
    if (duel.status === 'open' && duel.deadline && Date.now() >= duel.deadline) {
      decideDuel(duel);
      broadcastDuelWon(duel);
    }
  }
}, 1000);

async function getTopBid(lotId) {
  const result = await db.query(
    'SELECT amount, bidder, paddle, created_at FROM auction_bids WHERE lot_id = $1 ORDER BY amount DESC, id DESC LIMIT 1',
    [lotId]
  );
  return result.rows[0] || null;
}

function broadcast(payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(data);
  });
}

// Shared bid placement logic (REST + WS)
async function placeBid(lotId, amount, bidder, paddle) {
  const key = lotId ? String(lotId) : null;
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) {
    return { ok: false, error: 'A valid positive bid amount is required.' };
  }
  const found = key ? findCatalogLot(key) : null;
  const top = key ? await getTopBid(key) : null;
  const current = top ? top.amount : (found ? found.item.startingBid : 0);
  const floor = found ? found.item.startingBid : 1;
  if (num < floor) {
    return { ok: false, error: `Minimum opening bid${key ? ` for Lot #${key}` : ''} is $${floor.toLocaleString()}.` };
  }
  if (top && num <= top.amount) {
    return { ok: false, error: `Bid must exceed the current high bid of $${top.amount.toLocaleString()}.` };
  }
  const bidderName = bidder || 'Anonymous Paddle';
  const result = await db.query(
    'INSERT INTO auction_bids (lot_id, amount, bidder, paddle) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
    [key, num, bidderName, paddle || null]
  );
  const event = {
    type: 'bid',
    lotId: key,
    amount: num,
    bidder: bidderName,
    paddle: paddle || null,
    id: result.rows[0].id,
    ts: result.rows[0].created_at,
  };

  // ============ Floor call: alternate the call between bidders ============
  // 1st bid opens the floor. Then the web calls the other person to answer.
  // They go back and forth until a countdown expires without an answer — the
  // current leader wins the lot.
  let duel = getDuel(key);

  if (!duel) {
    // Opening bid of the lot: open the floor, waiting for a challenger.
    duel = newDuel(key, paddle || 'Anonymous Paddle', bidderName, num);
    auctionDuels.set(key, duel);
  } else if (duel.status === 'decided') {
    return { ok: false, error: 'This lot has been sold. Bidding is closed.' };
  } else {
    const me = paddle || 'Anonymous Paddle';
    const isLeader = String(me) === String(duel.leaderPaddle);
    const isOnCall = duel.challengerPaddle && String(me) === String(duel.challengerPaddle);

    if (isLeader) {
      // Leader raises their own ceiling; the called paddle still answers.
      duel.leaderAmount = num;
      duel.deadline = Date.now() + DUEL_TURN_MS;
    } else if (isOnCall || !duel.challengerPaddle) {
      // Counter-bid: answer the call and take the lead; the call flips back.
      const previousLeader = {
        paddle: duel.leaderPaddle,
        bidder: duel.leaderBidder,
        amount: duel.leaderAmount,
      };
      duel.leaderPaddle = me;
      duel.leaderBidder = bidderName;
      duel.leaderAmount = num;
      duel.challengerPaddle = previousLeader.paddle;
      duel.challengerBidder = previousLeader.bidder;
      duel.callNumber += 1;
      duel.deadline = Date.now() + DUEL_TURN_MS;
    } else {
      return { ok: false, error: `Head-to-head call in progress — ${duel.challengerBidder} (${duel.challengerPaddle}) is on the clock. Wait for the call to resolve.` };
    }
  }

  broadcastDuelCall(duel);

  // Anti-sniping: extend auction if a bid lands in the final 10 seconds
  const state = getAuctionState(key);
  if (state && state.status === 'active' && state.timeLeft <= ANTI_SNIPE_WINDOW_MS) {
    extendAuction(key);
  }

  // Broadcast bid + updated auction state so clients can sync timers
  const updatedState = getAuctionState(key);
  broadcast(event);
  broadcast({
    type: 'auction_state',
    lotId: key,
    ...updatedState,
    currentBid: num,
    currentBidder: bidderName,
    currentPaddle: paddle || null,
  });

  return { ok: true, event };
}

// Shared chat logic (REST + WS)
async function addChatMessage(lotId, userName, text) {
  const clean = String(text || '').trim().slice(0, 500);
  if (!clean) return null;
  const name = (userName || 'Guest').slice(0, 60);
  const key = lotId ? String(lotId) : null;
  const result = await db.query(
    'INSERT INTO auction_messages (lot_id, user_name, message) VALUES ($1, $2, $3) RETURNING id, created_at',
    [key, name, clean]
  );
  const event = {
    type: 'chat',
    lotId: key,
    user: name,
    text: clean,
    id: result.rows[0].id,
    ts: result.rows[0].created_at,
  };
  broadcast(event);
  return event;
}

// REST: list catalog lots with live bid state
app.get('/api/lots', async (req, res) => {
  try {
    const lots = [];
    for (const dept of VELA_CATALOG) {
      for (const item of dept.items) {
        const top = await getTopBid(item.lotId);
        lots.push({
          ...item,
          department: dept.department,
          deptName: dept.name,
          currentBid: top ? top.amount : item.startingBid,
          highBidder: top ? top.bidder : null,
        });
      }
    }
    res.json({ status: 'success', lots });
  } catch (err) {
    console.error('Lots error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// REST: place a bid
app.post('/api/lots/:lotId/bid', async (req, res) => {
  try {
    const { amount, bidder, paddle } = req.body || {};
    const result = await placeBid(req.params.lotId, amount, bidder, paddle);
    if (!result.ok) return res.status(400).json({ status: 'error', message: result.error });
    res.json({ status: 'success', bid: result.event });
  } catch (err) {
    console.error('Bid error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============ Auction State API ============

// GET - auction state for a lot (time left, status, current bid)
// Auto-resets a closed auction so a new bidding round starts on access
app.get('/api/auction/:lotId/state', async (req, res) => {
  try {
    const lotId = req.params.lotId;
    const state = getAuctionState(lotId);
    if (!state) {
      return res.status(404).json({ status: 'error', message: 'Lot not found' });
    }

    // Auto-reset: if the previous auction closed, start a fresh 30-minute round
    if (state.status === 'closed') {
      const found = findCatalogLot(lotId);
      startFreshAuction(lotId, found ? found.item.startingBid : 0);
      const top = await getTopBid(lotId);
      return res.json({
        status: 'success',
        lotId,
        auctionStatus: 'active',
        timeLeft: AUCTION_DURATION_MS,
        endTime: Date.now() + AUCTION_DURATION_MS,
        startingBid: found ? found.item.startingBid : 0,
        currentBid: top ? top.amount : (found ? found.item.startingBid : 0),
        currentBidder: top ? top.bidder : null,
        currentPaddle: top ? top.paddle : null,
        reset: true,
      });
    }

    const top = await getTopBid(state.lotId);
    res.json({
      status: 'success',
      lotId: state.lotId,
      auctionStatus: state.status,
      timeLeft: state.timeLeft,
      endTime: state.endTime,
      startingBid: state.startingBid,
      currentBid: top ? top.amount : state.startingBid,
      currentBidder: top ? top.bidder : null,
      currentPaddle: top ? top.paddle : null,
    });
  } catch (err) {
    console.error('Auction state error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST - place a bid through the auction system (validates open auction + anti-snipe)
app.post('/api/auction/:lotId/bid', async (req, res) => {
  try {
    const { amount, bidder, paddle } = req.body || {};
    const lotId = req.params.lotId;
    const state = getAuctionState(lotId);
    if (!state) {
      return res.status(404).json({ status: 'error', message: 'Lot not found' });
    }

    // Auto-reset: if the previous auction closed, start a fresh round before bidding
    if (state.auctionStatus === 'closed') {
      const found = findCatalogLot(lotId);
      startFreshAuction(lotId, found ? found.item.startingBid : 0);
    }

    const result = await placeBid(lotId, amount, bidder, paddle);
    if (!result.ok) return res.status(400).json({ status: 'error', message: result.error });
    const updated = getAuctionState(lotId);
    res.json({
      status: 'success',
      bid: result.event,
      auction: {
        lotId: updated.lotId,
        auctionStatus: updated.status,
        timeLeft: updated.timeLeft,
        currentBid: result.event.amount,
        currentBidder: result.event.bidder,
        currentPaddle: result.event.paddle,
      },
    });
  } catch (err) {
    console.error('Auction bid error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// REST: get recent chat for a lot (or all if none)
async function handleGetChat(req, res) {
  try {
    const lotId = req.params.lotId || req.query.lotId || null;
    const result = lotId
      ? await db.query('SELECT id, user_name, message, created_at FROM auction_messages WHERE lot_id = $1 ORDER BY id DESC LIMIT 50', [String(lotId)])
      : await db.query('SELECT id, user_name, message, created_at FROM auction_messages ORDER BY id DESC LIMIT 50');
    res.json({ status: 'success', messages: result.rows.reverse() });
  } catch (err) {
    console.error('Chat fetch error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}
app.get('/api/chat', handleGetChat);
app.get('/api/chat/:lotId', handleGetChat);

// REST: post a chat message
async function handlePostChat(req, res) {
  try {
    const { user, text } = req.body || {};
    const lotId = req.params.lotId || req.body.lotId || null;
    const event = await addChatMessage(lotId, user, text);
    if (!event) return res.status(400).json({ status: 'error', message: 'Message text is required' });
    res.status(201).json({ status: 'success', message: event });
  } catch (err) {
    console.error('Chat post error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
}
app.post('/api/chat', handlePostChat);
app.post('/api/chat/:lotId', handlePostChat);

// ============ User Purchased Items & Watchlist API ============

// GET - list purchased items for a user (enriched with catalog data)
app.get('/api/purchased/:userId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT lot_id, price_paid, purchased_at
       FROM purchased_items WHERE user_id = $1 ORDER BY purchased_at DESC`,
      [req.params.userId]
    );
    const items = result.rows.map(row => {
      const found = findCatalogLot(row.lot_id);
      return {
        lotId: row.lot_id,
        pricePaid: row.price_paid,
        purchasedAt: row.purchased_at,
        ...(found ? { item: found.item, dept: found.dept } : {}),
      };
    });
    res.json({ status: 'success', purchased: items });
  } catch (err) {
    console.error('Get purchased error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE - remove an item from purchased
app.delete('/api/purchased/:userId/:lotId', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM purchased_items WHERE user_id = $1 AND lot_id = $2 RETURNING id',
      [req.params.userId, req.params.lotId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Purchased item not found' });
    }
    res.json({ status: 'success', message: 'Removed from purchased items' });
  } catch (err) {
    console.error('Delete purchased error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET - list watchlist items for a user (enriched with catalog data)
app.get('/api/watchlist/:userId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT lot_id, added_at
       FROM watchlist_items WHERE user_id = $1 ORDER BY added_at DESC`,
      [req.params.userId]
    );
    const items = result.rows.map(row => {
      const found = findCatalogLot(row.lot_id);
      return {
        lotId: row.lot_id,
        addedAt: row.added_at,
        ...(found ? { item: found.item, dept: found.dept } : {}),
      };
    });
    res.json({ status: 'success', watchlist: items });
  } catch (err) {
    console.error('Get watchlist error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE - remove an item from watchlist
app.delete('/api/watchlist/:userId/:lotId', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM watchlist_items WHERE user_id = $1 AND lot_id = $2 RETURNING id',
      [req.params.userId, req.params.lotId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Watchlist item not found' });
    }
    res.json({ status: 'success', message: 'Removed from watchlist' });
  } catch (err) {
    console.error('Delete watchlist error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST - add an item to watchlist
app.post('/api/watchlist/:userId/:lotId', async (req, res) => {
  try {
    const result = await db.query(
      `INSERT INTO watchlist_items (user_id, lot_id) VALUES ($1, $2)
       ON CONFLICT (user_id, lot_id) DO NOTHING RETURNING id`,
      [req.params.userId, req.params.lotId]
    );
    res.json({ status: 'success', added: result.rows.length > 0 });
  } catch (err) {
    console.error('Add watchlist error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Create HTTP server wrapping Express
const server = http.createServer(app);

// Attach WebSocket server to the same HTTP server
const wss = new WebSocketServer({ server });

// 1. Example Express REST Endpoint querying PostgreSQL
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT current_database() AS db, NOW() AS server_time');
    res.json({ status: 'connected', data: result.rows[0] });
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 2. WebSocket: realtime auction events (bids, chat, reactions, state sync)
wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');

  ws.on('message', async (rawMessage) => {
    try {
      const payload = JSON.parse(rawMessage);

      switch (payload.type) {
        case 'bid': {
          const result = await placeBid(payload.lotId, payload.amount, payload.bidder, payload.paddle);
          ws.send(JSON.stringify({ type: 'bid_ack', ok: result.ok, error: result.error, bid: result.event }));
          break;
        }
        case 'chat': {
          const event = await addChatMessage(payload.lotId, payload.user, payload.text);
          ws.send(JSON.stringify({ type: 'chat_ack', ok: !!event, error: event ? null : 'Empty message' }));
          break;
        }
        case 'reaction': {
          // Ephemeral - broadcast only, not persisted
          broadcast({
            type: 'reaction',
            emoji: String(payload.emoji || '').slice(0, 16),
            user: payload.user || 'Guest',
            lotId: payload.lotId || null,
            ts: new Date().toISOString(),
          });
          break;
        }
        case 'state_request': {
          // Send current bid state + recent chat for a lot (or all lots if none)
          const lotId = payload.lotId || null;
          const lots = [];
          const deptList = lotId ? [VELA_CATALOG.find(d => d.items.some(i => String(i.lotId) === String(lotId)))] : VELA_CATALOG;
          for (const dept of deptList.filter(Boolean)) {
            for (const item of dept.items) {
              if (lotId && String(item.lotId) !== String(lotId)) continue;
              const top = await getTopBid(item.lotId);
              lots.push({
                lotId: item.lotId,
                brand: item.brand,
                name: item.name,
                currentBid: top ? top.amount : item.startingBid,
                highBidder: top ? top.bidder : null,
              });
            }
          }
          const chat = await db.query(
            lotId
              ? 'SELECT id, lot_id, user_name, message, created_at FROM auction_messages WHERE lot_id = $1 ORDER BY id DESC LIMIT 50'
              : 'SELECT id, lot_id, user_name, message, created_at FROM auction_messages ORDER BY id DESC LIMIT 50',
            lotId ? [String(lotId)] : []
          );
          ws.send(JSON.stringify({
            type: 'state',
            lots,
            messages: chat.rows.reverse().map(r => ({
              id: r.id, user: r.user_name, text: r.message, ts: r.created_at, lotId: r.lot_id,
            })),
          }));
          break;
        }
        default: {
          // Example: Fetch or insert data when a WS message arrives
          const result = await db.query('SELECT NOW() AS timestamp');
          ws.send(JSON.stringify({
            event: 'db_ack',
            received: payload,
            dbTime: result.rows[0].timestamp,
          }));
        }
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Express & WebSocket server running on http://localhost:${PORT}`);
});
