/**
 * content-modal.js
 * Handles all ContentModal interactions.
 *
 * Each page (blog.astro, work.astro, …) sets:
 *   window.__contentPosts = [ { id, title, description, image, publishDate,
 *                               tags, views, readingTime, bodyHtml } ]
 *
 * This file listens for [data-expand-post] button clicks,
 * populates the modal shell, and manages:
 *   - Open / close with animation
 *   - Body scroll lock
 *   - Reading progress bar
 *   - Prev / Next navigation (buttons + Arrow keys + bottom nav)
 *   - Esc to close
 *   - Backdrop click to close
 *   - Copy link
 *   - Share (Web Share API with clipboard fallback)
 */

/** @type {Array<Object>} */
let posts = [];
let currentIndex = -1;

/* =========================================
   DOM refs — resolved once on init
========================================= */
let overlay, panel, backdrop,
    heroImg,
    titleEl, metaSlot, bodyEl,
    prevBtn, nextBtn,
    bottomPrev, bottomNext,
    prevTitleEl, nextTitleEl,
    closeBtn, copyBtn, shareBtn,
    progressBar;

function resolveRefs() {
  overlay    = document.getElementById('content-modal-overlay');
  panel      = document.getElementById('cm-panel');
  backdrop   = document.getElementById('cm-backdrop');
  heroImg    = document.getElementById('cm-hero-img');
  titleEl    = document.getElementById('cm-title');
  metaSlot   = document.getElementById('cm-meta-slot');
  bodyEl     = document.getElementById('cm-body');
  prevBtn    = document.getElementById('cm-prev-btn');
  nextBtn    = document.getElementById('cm-next-btn');
  bottomPrev = document.getElementById('cm-bottom-prev');
  bottomNext = document.getElementById('cm-bottom-next');
  prevTitleEl= document.getElementById('cm-prev-title');
  nextTitleEl= document.getElementById('cm-next-title');
  closeBtn   = document.getElementById('cm-close-btn');
  copyBtn    = document.getElementById('cm-copy-btn');
  shareBtn   = document.getElementById('cm-share-btn');
  progressBar= document.getElementById('cm-progress-bar');
}

/* =========================================
   OPEN / CLOSE
========================================= */
function openModal(index) {
  if (!overlay || index < 0 || index >= posts.length) return;
  currentIndex = index;
  populateModal(posts[index]);

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';

  // Trigger entrance animation on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
    });
  });

  // Reset scroll + progress
  const scroll = document.getElementById('cm-scroll');
  if (scroll) scroll.scrollTop = 0;
  if (progressBar) progressBar.style.width = '0%';

  // Focus the close button for accessibility
  setTimeout(() => closeBtn?.focus(), 320);
}

function closeModal() {
  if (!overlay || overlay.hidden) return;
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';

  // Wait for animation to finish before hiding
  setTimeout(() => {
    overlay.hidden = true;
    currentIndex = -1;
  }, 320);
}

/* =========================================
   POPULATE MODAL
========================================= */
function populateModal(post) {
  if (!post) return;

  // Hero image
  if (heroImg) {
    heroImg.src = post.image || '';
    heroImg.alt = post.title || '';
  }

  // Title
  if (titleEl) titleEl.textContent = post.title || '';

  // Metadata (render simple HTML inline)
  if (metaSlot) {
    const date = new Date(post.publishDate);
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    const views = post.views >= 1000
      ? `${(post.views / 1000).toFixed(1)}k`
      : String(post.views ?? 0);

    metaSlot.innerHTML = `
      <div class="cm-meta-inline">
        <span title="Reading time">⏱ ${post.readingTime ?? ''}</span>
        <span aria-hidden="true">·</span>
        <span title="Views">👁 ${views}</span>
        <span aria-hidden="true">·</span>
        <time datetime="${date.toISOString()}">${formattedDate}</time>
        ${post.tags?.length
          ? `<div class="cm-tags">${post.tags.map(t => `<span class="cm-tag">${t}</span>`).join('')}</div>`
          : ''
        }
      </div>
    `;
  }

  // Body HTML
  if (bodyEl) {
    bodyEl.innerHTML = post.bodyHtml || `<p>${post.description}</p>`;
  }

  // Nav button state
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < posts.length - 1;

  if (prevBtn) {
    prevBtn.disabled = !hasPrev;
  }
  if (nextBtn) {
    nextBtn.disabled = !hasNext;
  }
  if (bottomPrev) {
    bottomPrev.disabled = !hasPrev;
    if (prevTitleEl) prevTitleEl.textContent = hasPrev ? posts[currentIndex - 1].title : 'Previous';
  }
  if (bottomNext) {
    bottomNext.disabled = !hasNext;
    if (nextTitleEl) nextTitleEl.textContent = hasNext ? posts[currentIndex + 1].title : 'Next';
  }

  // Page title
  document.title = post.title ?? document.title;
}

/* =========================================
   READING PROGRESS
========================================= */
function setupProgressBar() {
  const scroll = document.getElementById('cm-scroll');
  if (!scroll || !progressBar) return;

  scroll.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = scroll;
    const max = scrollHeight - clientHeight;
    const pct = max > 0 ? Math.round((scrollTop / max) * 100) : 0;
    progressBar.style.width = `${pct}%`;
    progressBar.parentElement?.setAttribute('aria-valuenow', String(pct));
  }, { passive: true });
}

/* =========================================
   COPY LINK
========================================= */
function setupCopyLink() {
  if (!copyBtn) return;
  const label = document.getElementById('cm-copy-label');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (label) {
        label.textContent = 'Copied!';
        setTimeout(() => { label.textContent = 'Copy link'; }, 2000);
      }
    } catch {
      // Fallback: select + copy
      const temp = document.createElement('input');
      temp.value = window.location.href;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
  });
}

/* =========================================
   SHARE
========================================= */
function setupShare() {
  if (!shareBtn) return;
  shareBtn.addEventListener('click', async () => {
    const post = posts[currentIndex];
    if (!post) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: window.location.href,
        });
      } catch { /* user cancelled */ }
    } else {
      // Fallback: copy URL
      copyBtn?.click();
    }
  });
}

/* =========================================
   NAVIGATION
========================================= */
function goTo(index) {
  if (index < 0 || index >= posts.length) return;
  openModal(index);
}

function setupNavButtons() {
  prevBtn?.addEventListener('click', () => goTo(currentIndex - 1));
  nextBtn?.addEventListener('click', () => goTo(currentIndex + 1));
  bottomPrev?.addEventListener('click', () => goTo(currentIndex - 1));
  bottomNext?.addEventListener('click', () => goTo(currentIndex + 1));
}

/* =========================================
   KEYBOARD
========================================= */
function handleKeydown(e) {
  if (!overlay || overlay.hidden) return;
  if (e.key === 'Escape')       { e.preventDefault(); closeModal(); }
  if (e.key === 'ArrowLeft')    { e.preventDefault(); goTo(currentIndex - 1); }
  if (e.key === 'ArrowRight')   { e.preventDefault(); goTo(currentIndex + 1); }
}

/* =========================================
   EXPAND TRIGGER
========================================= */
function handleExpandClick(e) {
  const btn = e.target.closest('[data-expand-post]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const postId = btn.dataset.expandPost;
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return;
  openModal(idx);
}

/* =========================================
   INIT
========================================= */
export function initContentModal() {
  resolveRefs();
  if (!overlay) return; // modal not on this page

  // Load posts from page registry
  posts = window.__contentPosts ?? [];

  // Listeners
  document.addEventListener('click', handleExpandClick);
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', handleKeydown);

  setupNavButtons();
  setupProgressBar();
  setupCopyLink();
  setupShare();
}
