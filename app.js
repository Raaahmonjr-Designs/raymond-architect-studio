let allProjects = [];

// Helper to generate clean URL slug (e.g. "Dutse Renovation" -> "dutse-renovation")
function createSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Guarantees paths leading to uploads convert to direct Raw GitHub CDN URLs
function formatMediaPath(path) {
  if (!path) return '';
  path = path.trim().replace(/^["']|["']$/g, '');

  // If already full HTTP URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Strip leading slash or dot slash
  let cleanPath = path.replace(/^\.\//, '').replace(/^\//, '');

  // Direct CDN fallback to ensure media loads reliably from Raymond's repo
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

// Update the filter counter badges
function updateCategoryCounts(projects) {
  const counts = {
    all: projects.length,
    Architecture: 0,
    Murals: 0,
    "3D Visualization": 0,
    Physical: 0
  };

  projects.forEach(p => {
    const cat = p.category ? p.category.trim() : '';
    if (counts[cat] !== undefined) {
      counts[cat]++;
    }
  });

  const countAllEl = document.getElementById('count-all');
  if (countAllEl) countAllEl.textContent = `(${counts.all})`;

  ['Architecture', 'Murals', '3D Visualization', 'Physical'].forEach(cat => {
    const el = document.getElementById(`count-${cat}`);
    if (el) el.textContent = `[${counts[cat]}]`;
  });
}

// Fetch published markdown projects from GitHub API
async function loadCMSContent() {
  const grid = document.getElementById('media-grid');
  const loader = document.getElementById('loading-state');

  try {
    const cacheBuster = new Date().getTime();
    const response = await fetch(
      `https://api.github.com/repos/Raaahmonjr-Designs/raymond-architect-studio/contents/content/projects?cache=${cacheBuster}`
    );

    if (!response.ok) {
      throw new Error('No uploaded content found yet.');
    }

    const files = await response.json();
    allProjects = [];

    for (const file of files) {
      if (file.name.endsWith('.md')) {
        const fileRes = await fetch(`${file.download_url}?cache=${cacheBuster}`);
        const text = await fileRes.text();
        const parsed = parseFrontmatter(text);
        if (parsed) allProjects.push(parsed);
      }
    }

    updateCategoryCounts(allProjects);
    renderGrid(allProjects);
  } catch (error) {
    if (loader) {
      loader.innerText = 'No media published yet. Log into /admin to upload your first project.';
    }
  }
}

// Render media grid items linked directly to gallery.html#<slug>
function renderGrid(items) {
  const grid = document.getElementById('media-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `<p class="text-neutral-500 text-xs font-mono col-span-full py-8">No items found in this category.</p>`;
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'bg-cardBg border border-cardBorder p-4 transition hover:border-neutral-700 flex flex-col justify-between group';

    const slug = createSlug(item.title);
    const code = String(index + 1).padStart(2, '0');

    // Flexible key lookup
    const videoFile = item.video || item['video upload'] || '';
    const thumbnailFile = item.thumbnail || item['featured image / thumbnail (optional)'] || item.image || '';
    const pdfFile = item.pdf || item['architectural pdf / blueprint'] || '';

    const videoSrc = formatMediaPath(videoFile);
    const thumbSrc = formatMediaPath(thumbnailFile);
    const pdfSrc = formatMediaPath(pdfFile);

    let mediaHTML = '';
    if (videoFile && videoFile !== '') {
      mediaHTML = `
        <div class="mb-4 aspect-video bg-black rounded-sm overflow-hidden relative">
          <video controls preload="metadata" class="w-full h-full object-cover" poster="${thumbSrc}">
            <source src="${videoSrc}">
            Your browser does not support HTML5 video.
          </video>
        </div>`;
    } else if (thumbnailFile && thumbnailFile !== '') {
      mediaHTML = `
        <a href="gallery.html#${slug}" class="block aspect-video bg-neutral-900 mb-4 overflow-hidden relative">
          <img src="${thumbSrc}" alt="${item.title || 'Project Image'}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
        </a>`;
    } else {
      mediaHTML = `
        <a href="gallery.html#${slug}" class="block aspect-video bg-neutral-900 mb-4 flex items-center justify-center text-neutral-600 text-xs uppercase tracking-widest font-mono">
          View in Gallery
        </a>`;
    }

    // PDF Blueprint action button
    let pdfHTML = '';
    if (pdfFile && pdfFile !== '') {
      pdfHTML = `
        <a href="${pdfSrc}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-accent hover:text-sand transition border border-cardBorder bg-charcoal px-3 py-2 rounded-sm w-full justify-center">
          <span>📄 View PDF Blueprint</span>
        </a>`;
    }

    card.innerHTML = `
      <div class="flex flex-col h-full justify-between">
        <div>
          ${mediaHTML}
          <div class="flex justify-between items-center mb-1">
            <span class="text-[10px] text-accent uppercase tracking-widest font-mono">[${code}] ${item.category || 'General'}</span>
            <a href="gallery.html#${slug}" class="text-[10px] font-mono text-neutral-500 hover:text-accent transition">Gallery &rarr;</a>
          </div>
          <a href="gallery.html#${slug}" class="text-base font-medium mt-1 text-sand hover:text-accent transition block">
            ${item.title || 'Untitled Project'}
          </a>
          <p class="text-neutral-400 text-xs mt-2 line-clamp-3 leading-relaxed">${item.body || ''}</p>
        </div>
        ${pdfHTML}
      </div>
    `;

    grid.appendChild(card);
  });
}

// Clean category filtering
function filterCategory(category) {
  const buttons = document.querySelectorAll('.filter-btn');

  buttons.forEach(btn => {
    btn.classList.remove('active', 'bg-sand', 'text-charcoal');
    btn.classList.add('border', 'border-cardBorder', 'text-muted');
  });

  const selectedBtn = Array.from(buttons).find(btn => {
    const text = btn.innerText.trim().toLowerCase();
    if (category.toLowerCase() === 'all') return text.includes('all');
    return text.includes(category.toLowerCase());
  });

  if (selectedBtn) {
    selectedBtn.classList.add('active', 'bg-sand', 'text-charcoal');
    selectedBtn.classList.remove('border', 'border-cardBorder', 'text-muted');
  }

  if (category.toLowerCase() === 'all') {
    renderGrid(allProjects);
  } else {
    const filtered = allProjects.filter(p => {
      if (!p.category) return false;
      return p.category.trim().toLowerCase() === category.trim().toLowerCase();
    });
    renderGrid(filtered);
  }
}

// Lightbox modal helpers
function openLightbox(imageSrc, title) {
  const lightbox = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  if (lightbox && content) {
    content.innerHTML = `<img src="${imageSrc}" alt="${title}" class="max-w-full max-h-[85vh] object-contain mx-auto border border-cardBorder">`;
    lightbox.classList.remove('hidden');
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', loadCMSContent);
