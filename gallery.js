let allGalleryItems = [];

// Helper: Convert title into URL-friendly slug
function createSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Convert asset paths to direct GitHub Raw CDN links
function formatMediaPath(path) {
  if (!path) return '';
  path = path.trim().replace(/^["']|["']$/g, '');

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  let cleanPath = path.replace(/^\.\//, '').replace(/^\//, '');
  return `https://raw.githubusercontent.com/Raaahmonjr-Designs/raymond-architect-studio/main/${cleanPath}`;
}

// Robust YAML Frontmatter Parser
function parseFrontmatter(text) {
  const match = text.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (!match) return null;

  const yaml = match[1];
  const body = match[2].trim();
  const data = {};

  yaml.split('\n').forEach(line => {
    const cleanLine = line.replace('\r', '').trim();
    const colonIndex = cleanLine.indexOf(':');
    if (colonIndex !== -1) {
      const key = cleanLine.substring(0, colonIndex).trim().toLowerCase();
      let val = cleanLine.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      data[key] = val;
    }
  });

  return { ...data, body };
}

// Fetch markdown files from a specified folder path on GitHub
async function fetchFolderFiles(folderPath, cacheBuster) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/Raaahmonjr-Designs/raymond-architect-studio/contents/${folderPath}?cache=${cacheBuster}`
    );

    if (!response.ok) return [];

    const files = await response.json();
    const parsedItems = [];

    for (const file of files) {
      if (file.name.endsWith('.md')) {
        const fileRes = await fetch(`${file.download_url}?cache=${cacheBuster}`);
        const text = await fileRes.text();
        const parsed = parseFrontmatter(text);

        if (parsed) {
          // Look for image/thumbnail in either schema format
          const imagePath = parsed.image || parsed.thumbnail || parsed['featured image / thumbnail'] || parsed['image upload'] || '';
          
          if (imagePath) {
            parsedItems.push({
              title: parsed.title || parsed['title / caption'] || 'Untitled Work',
              category: parsed.category || 'General',
              image: formatMediaPath(imagePath),
              notes: parsed.notes || parsed.description || parsed.body || ''
            });
          }
        }
      }
    }

    return parsedItems;
  } catch (err) {
    console.warn(`Could not load files from ${folderPath}:`, err);
    return [];
  }
}

// Load content from BOTH content/gallery AND content/projects
async function loadGalleryContent() {
  const cacheBuster = new Date().getTime();

  try {
    // Parallel fetch from both collections
    const [galleryItems, projectItems] = await Promise.all([
      fetchFolderFiles('content/gallery', cacheBuster),
      fetchFolderFiles('content/projects', cacheBuster)
    ]);

    // Merge and deduplicate by title
    const combined = [...galleryItems, ...projectItems];
    const uniqueMap = new Map();

    combined.forEach(item => {
      if (!uniqueMap.has(item.title.toLowerCase().trim())) {
        uniqueMap.set(item.title.toLowerCase().trim(), item);
      }
    });

    allGalleryItems = Array.from(uniqueMap.values());
  } catch (error) {
    console.error('Error loading content:', error);
    allGalleryItems = [];
  }

  renderCategoryCounts(allGalleryItems);
  renderGalleryGrid(allGalleryItems);
}

// Calculate and render live category counts
function renderCategoryCounts(items) {
  const counts = {
    all: items.length,
    Architecture: 0,
    Murals: 0,
    "3D Visualization": 0,
    Physical: 0
  };

  items.forEach(item => {
    const cat = item.category ? item.category.trim() : '';
    if (counts[cat] !== undefined) {
      counts[cat]++;
    }
  });

  const countAll = document.getElementById("count-all");
  if (countAll) countAll.textContent = `(${counts.all})`;

  ['Architecture', 'Murals', '3D Visualization', 'Physical'].forEach(cat => {
    const el = document.getElementById(`count-${cat}`);
    if (el) el.textContent = `[${counts[cat]}]`;
  });
}

// Render Grid Cards
function renderGalleryGrid(items) {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (items.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted); padding: 40px 0; text-align: center; font-family: var(--font-mono); font-size: 0.85rem;">[00] No items found in this category.</p>`;
    return;
  }

  items.forEach((item, index) => {
    const code = String(index + 1).padStart(2, '0');
    const slug = createSlug(item.title);
    const card = document.createElement("div");
    card.className = "gallery-card";
    card.id = `item-${slug}`;

    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\' viewBox=\\'0 0 400 300\\'><rect fill=\\'%23141414\\' width=\\'400\\' height=\\'300\\'/><text fill=\\'%23555555\\' font-family=\\'monospace\\' font-size=\\'12\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\'>IMAGE PREVIEW</text></svg>'">
      </div>
      <div class="card-details">
        <div class="card-tag">[${code}] ${item.category.toUpperCase()}</div>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-notes">${item.notes || ''}</p>
      </div>
    `;

    card.addEventListener("click", () => openLightbox(item, code));
    grid.appendChild(card);
  });

  checkUrlHashForDirectView();
}

// Auto-open lightbox when navigated via link hash from index.html (e.g. gallery.html#dutse-work)
function checkUrlHashForDirectView() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;

  const matchIndex = allGalleryItems.findIndex(item => createSlug(item.title) === hash);
  if (matchIndex !== -1) {
    const item = allGalleryItems[matchIndex];
    const code = String(matchIndex + 1).padStart(2, '0');

    setTimeout(() => {
      const targetCard = document.getElementById(`item-${hash}`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      openLightbox(item, code);
    }, 200);
  }
}

// Category filter buttons
function setupFilterListeners() {
  const buttons = document.querySelectorAll(".filter-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const cat = btn.getAttribute("data-category");
      if (cat === "all") {
        renderGalleryGrid(allGalleryItems);
      } else {
        const filtered = allGalleryItems.filter(i => i.category.trim().toLowerCase() === cat.trim().toLowerCase());
        renderGalleryGrid(filtered);
      }
    });
  });
}

// Lightbox
function openLightbox(item, code) {
  const modal = document.getElementById("lightboxModal");
  if (!modal) return;

  document.getElementById("lightboxImage").src = item.image;
  document.getElementById("lightboxCategory").textContent = `[${code}] ${item.category.toUpperCase()}`;
  document.getElementById("lightboxTitle").textContent = item.title;
  document.getElementById("lightboxNotes").textContent = item.notes || "";

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const modal = document.getElementById("lightboxModal");
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "auto";
  }
}

function setupLightbox() {
  const closeBtn = document.getElementById("lightboxClose");
  const overlay = document.getElementById("lightboxOverlay");

  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  if (overlay) overlay.addEventListener("click", closeLightbox);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  window.addEventListener("hashchange", checkUrlHashForDirectView);
}

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
  setupFilterListeners();
  setupLightbox();
  loadGalleryContent();
});
