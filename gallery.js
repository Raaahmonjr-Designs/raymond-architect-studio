// Data model loaded from CMS content
const galleryData = [
  {
    title: "Minimalist Pavilion Study",
    category: "Architecture",
    image: "assets/uploads/pavilion.jpg",
    notes: "High-resolution elevation and natural daylight study."
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
    notes: "Geometric wall installation on raw textured concrete."
  },
  {
    title: "Timber Lattice Pavilion",
    category: "Physical",
    image: "assets/uploads/timber-model.jpg",
    notes: "Laser-cut balsa physical scale model."
  },
  {
    title: "Atrium Daylight Simulation",
    category: "3D Visualization",
    image: "assets/uploads/atrium-daylight.jpg",
    notes: "Volumetric sunlight penetration study."
  },
  {
    title: "Civic Plaza Masterplan",
    category: "Architecture",
    image: "assets/uploads/civic-plaza.jpg",
    notes: "Circulation and public axis schematic."
  }
];

document.addEventListener("DOMContentLoaded", () => {
  renderCategoryCounts(galleryData);
  renderGalleryGrid(galleryData);
  setupFilterListeners();
  setupLightbox();
});

function renderCategoryCounts(items) {
  const counts = {
    all: items.length,
    Architecture: 0,
    Murals: 0,
    "3D Visualization": 0,
    Physical: 0
  };

  items.forEach(item => {
    if (counts[item.category] !== undefined) {
      counts[item.category]++;
    }
  });

  document.getElementById("count-all").textContent = counts.all;
  document.getElementById("count-Architecture").textContent = counts.Architecture;
  document.getElementById("count-Murals").textContent = counts.Murals;
  document.getElementById("count-3D Visualization").textContent = counts["3D Visualization"];
  document.getElementById("count-Physical").textContent = counts.Physical;
}

function renderGalleryGrid(items) {
  const grid = document.getElementById("galleryGrid");
  grid.innerHTML = "";

  if (items.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted); padding: 40px 0;">No items found in this category.</p>`;
    return;
  }

  items.forEach((item, index) => {
    const code = String(index + 1).padStart(2, '0');
    const card = document.createElement("div");
    card.className = "gallery-card";

    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.style.display='none'">
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
}

function setupFilterListeners() {
  const buttons = document.querySelectorAll(".filter-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const cat = btn.getAttribute("data-category");
      if (cat === "all") {
        renderGalleryGrid(galleryData);
      } else {
        const filtered = galleryData.filter(i => i.category === cat);
        renderGalleryGrid(filtered);
      }
    });
  });
}

function openLightbox(item, code) {
  const modal = document.getElementById("lightboxModal");
  document.getElementById("lightboxImage").src = item.image;
  document.getElementById("lightboxCategory").textContent = `[${code}] ${item.category.toUpperCase()}`;
  document.getElementById("lightboxTitle").textContent = item.title;
  document.getElementById("lightboxNotes").textContent = item.notes || "";

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const modal = document.getElementById("lightboxModal");
  modal.classList.remove("open");
  document.body.style.overflow = "auto";
}

function setupLightbox() {
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxOverlay").addEventListener("click", closeLightbox);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}
