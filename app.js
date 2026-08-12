let allProjects = [];

// Fetch and parse CMS media markdown files
async function loadCMSContent() {
  const grid = document.getElementById('media-grid');
  const loader = document.getElementById('loading-state');

  try {
    // Netlify/GitHub API endpoint or direct static file listing
    // Fetches the repository directory contents where Decap CMS commits new files
    const response = await fetch('https://api.github.com/repos/ORICHA/raymond-architect-studio/contents/content/projects');
    
    if (!response.ok) {
      throw new Error('No uploaded content found yet.');
    }

    const files = await response.json();
    allProjects = [];

    for (const file of files) {
      if (file.name.endsWith('.md')) {
        const fileRes = await fetch(file.download_url);
        const text = await fileRes.text();
        const parsed = parseFrontmatter(text);
        if (parsed) allProjects.push(parsed);
      }
    }

    renderGrid(allProjects);
  } catch (error) {
    if (loader) {
      loader.innerText = 'No media published yet. Log into /admin to upload your first project.';
    }
  }
}

// Custom simple YAML frontmatter parser
function parseFrontmatter(text) {
  const match = text.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
  if (!match) return null;

  const yaml = match[1];
  const body = match[2].trim();
  const data = {};

  yaml.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      let val = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      data[key.trim()] = val;
    }
  });

  return { ...data, body };
}

// Render project items to HTML
function renderGrid(items) {
  const grid = document.getElementById('media-grid');
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `<p class="text-neutral-500 text-sm">No items in this category.</p>`;
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'bg-neutral-900 border border-neutral-800 p-4 transition hover:border-neutral-700 flex flex-col justify-between';

    let mediaHTML = '';
    if (item.video && item.video !== '') {
      mediaHTML = `
        <video controls class="w-full aspect-video object-cover mb-4 rounded-sm bg-black" poster="${item.thumbnail || ''}">
          <source src="${item.video}" type="video/mp4">
          Your browser does not support video playback.
        </video>`;
    } else if (item.thumbnail && item.thumbnail !== '') {
      mediaHTML = `
        <div class="aspect-video bg-neutral-800 mb-4 overflow-hidden cursor-pointer" onclick="openLightbox('${item.thumbnail}', '${item.title}')">
          <img src="${item.thumbnail}" alt="${item.title}" class="w-full h-full object-cover hover:scale-105 transition duration-300">
        </div>`;
    }

    card.innerHTML = `
      <div>
        ${mediaHTML}
        <span class="text-[10px] text-accent uppercase tracking-widest font-mono">[0${index + 1}] ${item.category || 'General'}</span>
        <h3 class="text-lg font-medium mt-1 text-sand">${item.title || 'Untitled Project'}</h3>
        <p class="text-neutral-400 text-xs mt-2 line-clamp-3">${item.body || ''}</p>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Category filter toggle
function filterCategory(category) {
  // Update button active state
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('bg-sand', 'text-charcoal');
    btn.classList.add('border', 'border-neutral-700');
    if (btn.innerText.toLowerCase() === category.toLowerCase() || (category === 'All' && btn.innerText.includes('All'))) {
      btn.classList.add('bg-sand', 'text-charcoal');
      btn.classList.remove('border', 'border-neutral-700');
    }
  });

  if (category === 'All') {
    renderGrid(allProjects);
  } else {
    const filtered = allProjects.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
    renderGrid(filtered);
  }
}

// Lightbox triggers
function openLightbox(imageSrc, title) {
  const lightbox = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  content.innerHTML = `<img src="${imageSrc}" alt="${title}" class="max-w-full max-h-[85vh] object-contain mx-auto border border-neutral-800">`;
  lightbox.classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadCMSContent);
