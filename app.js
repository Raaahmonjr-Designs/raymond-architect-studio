let allProjects = [];

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

  // Direct CDN fallback to ensure media loads even before static site rebuilds
  return `https://raw.githubusercontent.com/ORICHA/raymond-architect-studio/main/${cleanPath}`;
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

// Fetch published markdown projects from GitHub API
async function loadCMSContent() {
  const grid = document.getElementById('media-grid');
  const loader = document.getElementById('loading-state');

  try {
    const cacheBuster = new Date().getTime();
    const response = await fetch(
      `https://api.github.com/repos/ORICHA/raymond-architect-studio/contents/content/projects?cache=${cacheBuster}`
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

    renderGrid(allProjects);
  } catch (error) {
    if (loader) {
      loader.innerText = 'No media published yet. Log into /admin to upload your first project.';
    }
  }
}

// Render media grid items
function renderGrid(items) {
  const grid = document.getElementById('media-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `<p class="text-neutral-500 text-sm col-span-full">No items in this category.</p>`;
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'bg-neutral-900 border border-neutral-800 p-4 transition hover:border-neutral-700 flex flex-col justify-between';

    // Flexible key lookup
    const videoFile = item.video || item['video upload'] || '';
    const thumbnailFile = item.thumbnail || item['featured image / thumbnail (optional)'] || '';
    
    const videoSrc = formatMediaPath(videoFile);
    const thumbSrc = formatMediaPath(thumbnailFile);

    let mediaHTML = '';
    if (videoFile && videoFile !== '') {
      mediaHTML = `
        <div class="mb-4 aspect-video bg-black rounded-sm overflow-hidden">
          <video controls preload="metadata" class="w-full h-full object-cover" poster="${thumbSrc}">
            <source src="${videoSrc}">
            Your browser does not support HTML5 video playback.
          </video>
        </div>`;
    } else if (thumbnailFile && thumbnailFile !== '') {
      mediaHTML = `
        <div class="aspect-video bg-neutral-800 mb-4 overflow-hidden cursor-pointer" onclick="openLightbox('${thumbSrc}', '${item.title || ''}')">
          <img src="${thumbSrc}" alt="${item.title || 'Project Image'}" class="w-full h-full object-cover hover:scale-105 transition duration-300">
        </div>`;
    } else {
      mediaHTML = `
        <div class="aspect-video bg-neutral-800 mb-4 flex items-center justify-center text-neutral-600 text-xs uppercase tracking-widest font-mono">
          No Media Attached
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

// Clean category filtering
function filterCategory(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('bg-sand', 'text-charcoal');
    btn.classList.add('border', 'border-neutral-700');
  });

  const selectedBtn = Array.from(document.querySelectorAll('.filter-btn')).find(
    btn => btn.innerText.trim().toLowerCase() === category.toLowerCase() || 
           (category === 'All' && btn.innerText.includes('All'))
  );

  if (selectedBtn) {
    selectedBtn.classList.add('bg-sand', 'text-charcoal');
    selectedBtn.classList.remove('border', 'border-neutral-700');
  }

  if (category === 'All') {
    renderGrid(allProjects);
  } else {
    const filtered = allProjects.filter(p => {
      if (!p.category) return false;
      return p.category.trim().toLowerCase() === category.trim().toLowerCase();
    });
    renderGrid(filtered);
  }
}

// Lightbox
function openLightbox(imageSrc, title) {
  const lightbox = document.getElementById('lightbox');
  const content = document.getElementById('lightbox-content');
  if (lightbox && content) {
    content.innerHTML = `<img src="${imageSrc}" alt="${title}" class="max-w-full max-h-[85vh] object-contain mx-auto border border-neutral-800">`;
    lightbox.classList.remove('hidden');
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', loadCMSContent);
