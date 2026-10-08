(function () {
  const SCORE_SELECTOR = '.ut-one-click-sbc-header-view--score-value';
  let lastScoreText = '';
  let pendingUpdate = false;
  let observerInstalled = false;
  let trackerInserted = false;

  function parseScore(text) {
    if (!text) return null;
    const parts = text.split('/');
    if (parts.length !== 2) return null;
    const current = parseInt(parts[0].replace(/,/g, '').trim(), 10);
    const required = parseInt(parts[1].replace(/,/g, '').trim(), 10);
    if (isNaN(current) || isNaN(required)) return null;
    return { current, required };
  }

  function getIconFromScore() {
    const scoreEl = document.querySelector(SCORE_SELECTOR);
    if (!scoreEl) return null;
    const iconEl = scoreEl.querySelector('.ut-one-click-sbc-header-view--score-icon');
    return iconEl ? iconEl.cloneNode(true) : null;
  }

  function ensureTracker(scoreEl) {
    let el = document.getElementById('gems-tracker');
    if (!el) {
      const icon = getIconFromScore();
      const iconHTML = icon ? icon.outerHTML : '';
      el = document.createElement('div');
      el.id = 'gems-tracker';
      el.innerHTML = [
        '<div class="tracker-title"><img src="https://www.ea.com/ea-sports-fc/ultimate-team/web-app/images/sbc/dustpoint.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;"> FC Napkin Math</div>',
        '<div class="tracker-bar-track"><div class="tracker-bar-fill"></div></div>',
        '<div class="tracker-row"><span>Collected</span><span class="val" id="gt-current"></span></div>',
        '<div class="tracker-row"><span>Required</span><span class="val" id="gt-required"></span></div>',
        '<div class="tracker-remaining" id="gt-remaining"></div>',
      ].join('');
      document.body.appendChild(el);
      trackerInserted = true;
    }
    return el;
  }

  function placeTracker() {
    if (!trackerInserted) return;
    const tracker = document.getElementById('gems-tracker');
    if (!tracker) {
      trackerInserted = false;
      return;
    }

    // Insert the tracker right after the ".rewards-container" (Group Rewards section)
    const rewardsContainer = document.querySelector('.rewards-container');
    if (!rewardsContainer) return;

    if (tracker.parentNode !== rewardsContainer.parentNode || tracker.nextElementSibling !== rewardsContainer.nextSibling) {
      const next = rewardsContainer.nextSibling;
      if (next) {
        rewardsContainer.parentNode.insertBefore(tracker, next);
      } else {
        rewardsContainer.parentNode.appendChild(tracker);
      }
    }
  }

  function doUpdate() {
    pendingUpdate = false;
    const scoreEl = document.querySelector(SCORE_SELECTOR);

    // If no score element found at all, hide tracker
    if (!scoreEl) {
      if (trackerInserted) {
        const tracker = document.getElementById('gems-tracker');
        if (tracker) tracker.style.display = 'none';
      }
      lastScoreText = '';
      return;
    }

    // Always show the tracker when score element exists
    const tracker = ensureTracker();
    if (tracker) tracker.style.display = 'block';
    
    // Make sure tracker is placed below the trigger section
    placeTracker();

    const text = scoreEl.textContent.trim();
    
    // If the text hasn't changed, keep existing values
    if (text === lastScoreText) {
      return;
    }
    
    lastScoreText = text;

    const score = parseScore(text);
    if (!score) {
      // Even if parsing fails, keep tracker visible with previous values or display error
      return;
    }

    const diff = score.current - score.required;
    const filled = diff === 0;
    const overrun = diff > 0;

    // Progress bar: clamp at 100% regardless
    const pct = score.required > 0 ? Math.min((score.current / score.required) * 100, 100) : 100;
    const fill = tracker.querySelector('.tracker-bar-fill');
    fill.style.width = pct + '%';
    fill.classList.toggle('fulfilled', filled);
    fill.classList.toggle('over', overrun);
    tracker.classList.toggle('fulfilled', filled);
    tracker.classList.toggle('over', overrun);

    tracker.querySelector('#gt-current').textContent = score.current.toLocaleString();
    tracker.querySelector('#gt-required').textContent = score.required.toLocaleString();

    const remEl = tracker.querySelector('#gt-remaining');
    if (overrun) {
      remEl.innerHTML = diff.toLocaleString() + ' <span class="gems-word">gems too many</span>';
      remEl.classList.add('over');
    } else {
      remEl.classList.remove('over');
      if (filled) {
        remEl.textContent = 'Perfect';
      } else {
        remEl.innerHTML = Math.abs(diff).toLocaleString() + ' <span class="gems-word">gems left</span>';
      }
    }
  }

  function scheduleUpdate() {
    if (!pendingUpdate) {
      pendingUpdate = true;
      requestAnimationFrame(doUpdate);
    }
  }

  function ensureObserver() {
    if (observerInstalled) return;
    const obs = new MutationObserver(scheduleUpdate);
    // Watch childList only for the SBC header area, not the entire document
    // This is much lighter than subtree + characterData
    const target = document.querySelector('.ut-one-click-sbc-section-view, .ut-one-click-sbc-review-view, [class*="sbc"]')
      || document.body;
    obs.observe(target, { childList: true, subtree: true });
    observerInstalled = true;
  }

  // Start with a single check after a short delay (let first paint settle)
  setTimeout(() => {
    doUpdate();
    ensureObserver();
  }, 500);

  // Light polling as fallback (every 6s)
  setInterval(doUpdate, 6000);
})();
