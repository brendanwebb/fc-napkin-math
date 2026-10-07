(function () {
  const SCORE_SELECTOR = '.ut-one-click-sbc-header-view--score-value';
  const TRACKER_ID = 'gems-tracker';
  const ICON_URL = 'https://www.ea.com/ea-sports-fc/ultimate-team/web-app/images/sbc/dustpoint.png';
  let lastScoreText = '';
  let lastScoreState = null;  // persisted through review/submit phase
  let pendingUpdate = false;
  let observerInstalled = false;
  let trackerCreated = false;
  let onSBCPage = false;
  let pollTimer = null;
  // Track URL for true page transitions (separate from DOM state changes during SBC)
  let currentPageUrl = '';

  /* ---- helpers ---- */

  function parseScore(text) {
    if (!text) return null;
    const parts = text.split('/');
    if (parts.length !== 2) return null;
    const current = parseInt(parts[0].replace(/,/g, '').trim(), 10);
    const required = parseInt(parts[1].replace(/,/g, '').trim(), 10);
    if (isNaN(current) || isNaN(required)) {
      console.debug('[FC Napkin Math] Failed to parse score:', JSON.stringify(text));
      return null;
    }
    return { current, required };
  }

  function makeTrackerHTML() {
    return [
      '<div class="tracker-title"><span class="tracker-icon-wrap"><img src="' + ICON_URL + '" width="16" height="16" style="vertical-align: middle; margin-right: 4px;" onerror="this.parentElement.style.display=\'none\'" alt=""></span><span>FC Napkin Math</span></div>',
      '<div class="tracker-bar-track"><div class="tracker-bar-fill"></div></div>',
      '<div class="tracker-row"><span>Collected</span><span class="val" id="gt-current"></span></div>',
      '<div class="tracker-row"><span>Required</span><span class="val" id="gt-required"></span></div>',
      '<div class="tracker-remaining" id="gt-remaining"></div>',
    ].join('');
  }

  function renderScoreState(score) {
    const tracker = document.getElementById(TRACKER_ID);
    if (!tracker) return;

    tracker.style.display = 'block';
    tracker.classList.remove('fulfilled', 'over');
    const fill = tracker.querySelector('.tracker-bar-fill');
    if (fill) fill.classList.remove('fulfilled', 'over');

    const diff = score.current - score.required;
    const filled = diff === 0;
    const overrun = diff > 0;

    const pct = score.required > 0 ? Math.min((score.current / score.required) * 100, 100) : 100;
    fill.style.width = pct + '%';
    fill.classList.toggle('fulfilled', filled);
    fill.classList.toggle('over', overrun);
    tracker.classList.toggle('fulfilled', filled);
    tracker.classList.toggle('over', overrun);

    const curEl = tracker.querySelector('#gt-current');
    const reqEl = tracker.querySelector('#gt-required');
    if (curEl) curEl.textContent = score.current.toLocaleString();
    if (reqEl) reqEl.textContent = score.required.toLocaleString();

    const remEl = tracker.querySelector('#gt-remaining');
    if (overrun) {
      remEl.innerHTML = diff.toLocaleString() + ' <span class="gems-word">gems too many</span>';
    } else {
      remEl.innerHTML = filled ? '<span class="perfect-text">Perfect</span>' : Math.abs(diff).toLocaleString() + ' <span class="gems-word">gems left</span>';
    }
  }

  function ensureTracker() {
    let el = document.getElementById(TRACKER_ID);
    if (!el) {
      // Re-create if DOM was wiped
      trackerCreated = false;
    }
    if (!trackerCreated) {
      el = document.createElement('div');
      el.id = TRACKER_ID;
      el.innerHTML = makeTrackerHTML();
      document.body.appendChild(el);
      trackerCreated = true;
    }
    return el;
  }

  function placeTracker() {
    if (!trackerCreated) return;
    const tracker = document.getElementById(TRACKER_ID);
    if (!tracker) {
      trackerCreated = false;
      return;
    }

    const rewardsContainer = document.querySelector('.rewards-container');
    if (!rewardsContainer) return;

    // Tracker must appear below .rewards-container in the DOM
    if (rewardsContainer.nextSibling === tracker) {
      return; // already in the right place
    }
    const next = rewardsContainer.nextSibling;
    if (next) {
      rewardsContainer.parentNode.insertBefore(tracker, next);
    } else {
      rewardsContainer.parentNode.appendChild(tracker);
    }
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(doUpdate, 6000);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function onLeaveSBC() {
    onSBCPage = false;
    stopPolling();
    observerInstalled = false;
    // Do NOT clear lastScoreState here — it must survive the transition
    // so the tracker remains visible while the score is still on screen.
    // lastScoreText is cleared so new scores will re-render.
    lastScoreText = '';
  }

  /* ---- SPA navigation detection ---- */

  function checkUrlChange() {
    const url = document.URL;
    if (url !== currentPageUrl) {
      currentPageUrl = url;
      // URL changed -- if score element is also gone, the user truly left the SBC
      if (!onSBCPage) return;
      const scoreEl = document.querySelector(SCORE_SELECTOR);
      if (!scoreEl) {
        onLeaveSBC();
      } else {
        // New SBC page with score
        onSBCPage = true;
      }
    }
  }

  /* ---- main update ---- */

  function doUpdate() {
    pendingUpdate = false;
    const scoreEl = document.querySelector(SCORE_SELECTOR);
    const hasScore = !!scoreEl;

    // Detect entering SBC page
    if (hasScore && !onSBCPage) {
      onSBCPage = true;
      ensureObserver();
      startPolling();
    }

    if (!scoreEl) {
      if (lastScoreState) {
        // Score hidden temporarily (e.g., during "Review Selection" phase) or
        // after navigation within the SBC flow (e.g., submit → new SBC page without score yet).
        // Keep the tracker visible with the last known state for as long as possible,
        // until a new SBC score element appears (which would indicate a new SBC).
        placeTracker();
        let tracker = ensureTracker();
        tracker.innerHTML = makeTrackerHTML();
        tracker.style.display = 'block';
        renderScoreState(lastScoreState);
        lastScoreText = '';
        return;
      }
      lastScoreText = '';
      return;
    }

    placeTracker();
    let tracker = ensureTracker();

    // Restore tracker HTML if it was wiped (e.g., during review/submit phase)
    if (tracker.querySelector('.tracker-title') === null) {
      tracker.innerHTML = makeTrackerHTML();
    }

    // Restore inline styles/classes the SPA may have stripped (review phase)
    if (!tracker.style.display) {
      tracker.style.display = 'block';
    }
    tracker.classList.remove('fulfilled', 'over');

    const text = scoreEl.textContent.trim();
    if (text === lastScoreText) return;
    lastScoreText = text;

    const score = parseScore(text);
    if (!score) return;

    lastScoreState = score;
    ensureTracker();

    tracker.style.display = 'block';
    renderScoreState(score);
  }

  function scheduleUpdate() {
    if (!pendingUpdate) {
      pendingUpdate = true;
      requestAnimationFrame(doUpdate);
    }
  }

  /* ---- observer ---- */

  function ensureObserver() {
    if (observerInstalled) return;
    const obs = new MutationObserver(scheduleUpdate);
    const target = document.querySelector('.ut-one-click-sbc-section-view')
      || document.querySelector('[class*="sbc"]')
      || document.body;
    obs.observe(target, { childList: true, subtree: true });
    observerInstalled = true;
  }

  /* ---- init ---- */

  setTimeout(function () {
    doUpdate();
    ensureObserver();
  }, 500);

  // Poll for URL changes to detect true page transitions
  setInterval(checkUrlChange, 1000);
})();
