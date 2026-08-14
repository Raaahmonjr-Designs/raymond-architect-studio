let allGalleryItems = [];

// Fallback seed items if repository gallery folder is empty
const defaultGalleryData = [
  {
    title: "Minimalist Pavilion Study",
    category: "Architecture",
    image: "assets/uploads/pavilion.jpg",
    notes: "High-resolution elevation and natural daylight framing study."
  },
  {
    title: "Facade Light Study",
    category: "3D Visualization",
    image: "assets/uploads/facade-light.jpg",
    notes: "Ray-traced evening illumination simulation."
  },
  {
    title: "Urban Concrete Mural",
    category: "Murals",
    image: "assets/uploads/urban-mural.jpg",
    notes: "Site-specific geometric mural installation on textured concrete."
  },
  {
    title: "Timber Lattice Pavilion",
    category: "Physical",
    image: "assets/uploads/timber-model.jpg",
    notes: "Laser-cut balsa wood physical concept model at 1:50 scale."
  },
  {
    title: "Atrium Daylight Simulation",
    category: "3D Visualization",
    image: "assets/uploads/atrium-daylight.jpg",
    notes: "Volumetric sunlight penetration study through canopy louvers."
  },
  {
    title: "Civic Plaza Masterplan",
    category: "Architecture",
    image: "assets/uploads/civic-plaza.jpg",
    notes: "Pedestrian circulation analysis and public gathering zones."
  }
];

// Helper: Convert title into URL-friendly slug (e.g., "Dutse Renovation" -> "dutse-renovation")
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

// YAML Frontmatter Parser
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

  return { ...data, notes: data.notes || body };
}

// Fetch published markdown items from GitHub API
async function loadGalleryContent() {
  try {
    const cacheBuster = new Date().getTime();
    const response = await fetch(
      `https://api.github.com/repos/Raaahmonjr-Designs/raymond-architect-studio/contents/content/gallery?cache=${cacheBuster}`
    );

    if (!response.ok) {
      throw new Error('Using fallback items.');
    }

    const files = await response.json();
    const fetchedItems = [];

    for (const file of files) {
      if (file.name.endsWith('.md')) {
        const fileRes = await fetch(`${file.download_url}?cache=${cacheBuster}`);
        const text = await fileRes.text();
        const parsed = parseFrontmatter(text);
        if (parsed) {
          fetchedItems.push({
            title: parsed.title || parsed['title / caption'] || 'Untitled Work',
            category: parsed.category || 'General',
            image: formatMediaPath(parsed.image || parsed['image upload'] || ''),
            notes: parsed.notes || parsed.body || ''
          });
        }
      }
    }

    allGalleryItems = fetchedItems.length > 0 ? fetchedItems : defaultGalleryData;
  } catch (error) {
    allGalleryItems = defaultGalleryData;
  }

  renderCategoryCounts(allGalleryItems);
  renderGalleryGrid(allGalleryItems);
}

// Calculate and render category counts
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

// Render Grid Cards with dynamic slugs
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

    const imgSrc = item.image.startsWith('http') ? item.image : formatMediaPath(item.image);

    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${imgSrc}" alt="${item.title}" loading="lazy" onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\' viewBox=\\'0 0 400 300\\'><rect fill=\\'%23141414\\' width=\\'400\\' height=\\'300\\'/><text fill=\\'%23555555\\' font-family=\\'monospace\\' font-size=\\'12\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\'>IMAGE PREVIEW</text></svg>'">
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

  // Check if visitor arrived with a direct project slug in the URL hash
  checkUrlHashForDirectView();
}

// Auto-open lightbox when navigated from index.html (e.g. gallery.html#dutse-renovation)
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

// Setup category tab filtering
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

// View-Only Lightbox Implementation
function openLightbox(item, code) {
  const modal = document.getElementById("lightboxModal");
  const imgSrc = item.image.startsWith('http') ? item.image : formatMediaPath(item.image);

  document.getElementById("lightboxImage").src = imgSrc;
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

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  setupFilterListeners();
  setupLightbox();
  loadGalleryContent();
});
