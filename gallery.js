// Sample initial visual items (Replaced/supplemented automatically by CMS data)
const galleryData = [
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

// Initialize Gallery & Counts
document.addEventListener("DOMContentLoaded", () => {
  renderCategoryCounts(galleryData);
  renderGalleryGrid(galleryData);
  setupFilterListeners();
  setupLightboxListeners();
});

// Update the count badges dynamically
function renderCategoryCounts(items) {
  const counts = {
    all: items.length,
    Architecture: 0,
    "3D Visualization": 0,
    Murals: 0,
    Physical: 0
  };

  items.forEach(item => {
    if (counts[item.category] !== undefined) {
      counts[item.category]++;
    }
  });

  document.getElementById("count-all").textContent = counts.all;
  document.getElementById("count-Architecture").textContent = counts.Architecture;
  document.getElementById("count-3D Visualization").textContent = counts["3D Visualization"];
  document.getElementById("count-Murals").textContent = counts.Murals;
  document.getElementById("count-Physical").textContent = counts.Physical;
}

// Render Grid Cards
function renderGalleryGrid(items) {
  const grid = document.getElementById("galleryGrid");
  grid.innerHTML = "";

  if (items.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94a3b8;">No visual works found in this category.</p>`;
    return;
  }

  items.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "gallery-card";
    card.setAttribute("data-index", index);

    card.innerHTML = `
      <div class="card-media">
        <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='data:image/svg+xml;charset=UTF-8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\' viewBox=\\'0 0 400 300\\'><rect fill=\\'%231e293b\\' width=\\'400\\' height=\\'300\\'/><text fill=\\'%2364748b\\' font-size=\\'16\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\'>Image Preview</text></svg>'">
        <span class="card-category-tag">${item.category}</span>
      </div>
      <div class="card-info">
        <h3 class="card-title">${item.title}</h3>
        <div class="card-footer">
          <span class="card-cat-label">Category: ${item.category}</span>
          <span class="card-view-label">👁️ View</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openLightbox(item));
    grid.appendChild(card);
  });
}

// Filter button click logic
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

// View-Only Lightbox Logic
function openLightbox(item) {
  const modal = document.getElementById("lightboxModal");
  document.getElementById("lightboxImage").src = item.image;
  document.getElementById("lightboxCategory").textContent = item.category;
  document.getElementById("lightboxTitle").textContent = item.title;
  document.getElementById("lightboxNotes").textContent = item.notes || "No additional notes provided.";

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const modal = document.getElementById("lightboxModal");
  modal.classList.remove("open");
  document.body.style.overflow = "auto";
}

function setupLightboxListeners() {
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxOverlay").addEventListener("click", closeLightbox);
  
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}
