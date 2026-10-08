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

  function doUpdate() {
    pendingUpdate = false;
    
    // Find score element
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

    // Create or ensure tracker exists
    let tracker = document.getElementById('gems-tracker');
    if (!tracker) {
      tracker = document.createElement('div');
      tracker.id = 'gems-tracker';
      tracker.innerHTML = [
        '<div class="tracker-title"><img src="https://www.ea.com/ea-sports-fc/ultimate-team/web-app/images/sbc/dustpoint.png" width="16" height="16" style="vertical-align: middle; margin-right: 4px;"> FC Napkin Math</div>',
        '<div class="tracker-bar-track"><div class="tracker-bar-fill"></div></div>',
        '<div class="tracker-row"><span>Collected</span><span class="val" id="gt-current"></span></div>',
        '<div class="tracker-row"><span>Required</span><span class="val" id="gt-required"></span></div>',
        '<div class="tracker-remaining" id="gt-remaining"></div>',
      ].join('');
      
      // Add to body if not already there
      if (!document.body.contains(tracker)) {
        document.body.appendChild(tracker);
      }
      trackerInserted = true;
    }

    // Show tracker and place it correctly  
    tracker.style.display = 'block';
    
    // Insert the tracker right after the ".rewards-container" (Group Rewards section)
    const rewardsContainer = document.querySelector('.rewards-container');
    if (rewardsContainer && tracker.parentNode !== rewardsContainer.parentNode) {
      const next = rewardsContainer.nextSibling;
      if (next) {
        rewardsContainer.parentNode.insertBefore(tracker, next);
      } else {
        rewardsContainer.parentNode.appendChild(tracker);
      }
    }

    const text = scoreEl.textContent.trim();
    
    // If the text hasn't changed, keep existing values
    if (text === lastScoreText) {
      return;
    }
    
    lastScoreText = text;

    const score = parseScore(text);
    if (!score) {
      return;
    }

    const diff = score.current - score.required;
    const filled = diff === 0;
    const overrun = diff > 0;

    // Progress bar: clamp at 100% regardless
    const pct = score.required > 0 ? Math.min((score.current / score.required) * 100, 100) : 100;
    const fill = tracker.querySelector('.tracker-bar-fill');
    if (fill) {
      fill.style.width = pct + '%';
      fill.classList.toggle('fulfilled', filled);
      fill.classList.toggle('over', overrun);
    }
    
    // Update all values with proper classes
    const currentEl = tracker.querySelector('#gt-current');
    const requiredEl = tracker.querySelector('#gt-required');
    const remainingEl = tracker.querySelector('#gt-remaining');
    
    if (currentEl) currentEl.textContent = score.current.toLocaleString();
    if (requiredEl) requiredEl.textContent = score.required.toLocaleString();
    
    if (remainingEl) {
      remainingEl.classList.remove('over');
      if (overrun) {
        remainingEl.innerHTML = diff.toLocaleString() + ' <span class="gems-word">gems too many</span>';
        remainingEl.classList.add('over');
      } else {
        if (filled) {
          remainingEl.textContent = 'Perfect';
          // Add the fulfilled class to make it have the green border/highlight
          tracker.classList.add('fulfilled');
          tracker.classList.remove('over');
        } else {
          remainingEl.innerHTML = Math.abs(diff).toLocaleString() + ' <span class="gems-word">gems left</span>';
          // Remove any highlight classes when not perfect
          tracker.classList.remove('fulfilled', 'over');
        }
      }
    }
    
    // Update tracker classes for proper styling
    tracker.classList.toggle('fulfilled', filled);
    tracker.classList.toggle('over', overrun);
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
    // Watch the entire document body
    obs.observe(document.body, { childList: true, subtree: true });
    observerInstalled = true;
  }

  // Start with a single check after a short delay 
  setTimeout(() => {
    doUpdate();
    ensureObserver();
  }, 100);

  // Light polling as fallback (every 6s)
  setInterval(doUpdate, 6000);
})();