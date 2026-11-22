// Index page - Bid interaction and timer logic
let currentBid = 142500;
let currentIncrement = 2500;
let timerSeconds = 36;

function updateBidButton() {
  const nextBid = currentBid + currentIncrement;
  const btnText = document.getElementById('btn-text');
  if (btnText) {
    btnText.textContent = `Raise Hand • Bid $${nextBid.toLocaleString()}`;
  }
}

function selectIncrement(val) {
  currentIncrement = val;
  document.querySelectorAll('.inc-btn').forEach(btn => {
    btn.classList.remove('bg-primary-container', 'text-on-primary');
    btn.classList.add('bg-surface-container', 'text-on-surface');
  });
  event.target.classList.remove('bg-surface-container', 'text-on-surface');
  event.target.classList.add('bg-primary-container', 'text-on-primary');
  updateBidButton();
}

function simulateBid() {
  currentBid += currentIncrement;
  const disp = document.getElementById('current-bid-display');
  if (disp) {
    disp.textContent = `$${currentBid.toLocaleString()}`;
    disp.classList.add('scale-110');
    setTimeout(() => disp.classList.remove('scale-110'), 200);
  }
  timerSeconds = 45;
  updateBidButton();
}

setInterval(() => {
  if (timerSeconds > 0) {
    timerSeconds--;
    const timerDisp = document.getElementById('hammer-timer');
    if (timerDisp) {
      timerDisp.textContent = `00:${timerSeconds < 10 ? '0' : ''}${timerSeconds}`;
    }
  }
}, 1000);