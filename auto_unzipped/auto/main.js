const STORAGE_KEY_CARS = 'avto_market_cars_v8';
const STORAGE_KEY_FAVS = 'avto_market_favs_v1';
const STORAGE_KEY_THEME = 'avto_market_ios_theme_v1';

let cars = loadCars();
let favorites = loadFavorites();
let activeCategory = 'All';
let favoritesOnly = false;
let currentTheme = loadTheme();
let deferredPwaPrompt = null;

function loadTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (_) {}
  return 'dark';
}

function setIosTheme(mode, animateThumb = true) {
  currentTheme = mode === 'light' ? 'light' : 'dark';
  const isDark = currentTheme === 'dark';

  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme) metaTheme.setAttribute('content', isDark ? '#000000' : '#F2F2F7');

  const appleBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleBar) appleBar.setAttribute('content', isDark ? 'black-translucent' : 'default');

  const btnLight = document.getElementById('seg-light');
  const btnDark = document.getElementById('seg-dark');
  const thumb = document.getElementById('ios-segment-thumb');
  if (btnLight) btnLight.setAttribute('aria-pressed', String(!isDark));
  if (btnDark) btnDark.setAttribute('aria-pressed', String(isDark));

  if (thumb) {
    const targetX = isDark ? '100%' : '0%';
    if (animateThumb && window.gsap) {
      gsap.to(thumb, { x: targetX, duration: 0.36, ease: 'back.out(1.45)' });
    } else {
      thumb.style.transform = `translateX(${targetX})`;
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY_THEME, currentTheme);
  } catch (_) {}
}

function loadCars() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CARS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return [...INITIAL_CARS];
}

function saveCars() {
  try {
    localStorage.setItem(STORAGE_KEY_CARS, JSON.stringify(cars));
  } catch (_) {}
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVS);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favorites));
  } catch (_) {}
  updateFavCounter();
}

function updateFavCounter() {
  const el = document.getElementById('fav-count');
  if (el) el.textContent = favorites.length;
}

function updateStats() {
  const totalEl = document.getElementById('stat-total-cars');
  if (totalEl) totalEl.textContent = cars.length;
}

function formatPrice(num) {
  return '$' + Number(num || 0).toLocaleString('en-US');
}

function formatMileage(km) {
  return Number(km || 0).toLocaleString('en-US') + ' km';
}

function selectCategory(category) {
  activeCategory = category;
  document.querySelectorAll('.cat-tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.category === category);
  });
  applyFilters();
}

function toggleFavoritesOnly() {
  favoritesOnly = !favoritesOnly;
  const btn = document.getElementById('btn-favorites-filter');
  if (btn) btn.classList.toggle('is-active', favoritesOnly);
  applyFilters();
}

function resetAllFilters() {
  activeCategory = 'All';
  favoritesOnly = false;
  const searchEl = document.getElementById('search-input');
  const fuelEl = document.getElementById('fuel-filter');
  const sortEl = document.getElementById('sort-filter');
  const favBtn = document.getElementById('btn-favorites-filter');

  if (searchEl) searchEl.value = '';
  if (fuelEl) fuelEl.value = 'all';
  if (sortEl) sortEl.value = 'featured';
  if (favBtn) favBtn.classList.remove('is-active');

  document.querySelectorAll('.cat-tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.category === 'All');
  });
  applyFilters();
}

function applyFilters() {
  const query = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
  const fuel = document.getElementById('fuel-filter')?.value || 'all';
  const sort = document.getElementById('sort-filter')?.value || 'featured';

  let list = cars.filter((car) => {
    const matchesCat = activeCategory === 'All' || car.category === activeCategory;
    const matchesFuel = fuel === 'all' || car.fuel === fuel;
    const matchesFav = !favoritesOnly || favorites.includes(car.id);
    const matchesQuery =
      !query ||
      car.brand.toLowerCase().includes(query) ||
      car.model.toLowerCase().includes(query) ||
      car.city.toLowerCase().includes(query) ||
      car.category.toLowerCase().includes(query) ||
      String(car.year).includes(query);

    return matchesCat && matchesFuel && matchesFav && matchesQuery;
  });

  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'year-desc') list.sort((a, b) => b.year - a.year);
  else if (sort === 'mileage-asc') list.sort((a, b) => a.mileage - b.mileage);
  else list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

  renderCars(list);
}

function fuelBadgeClass(fuel) {
  if (fuel === 'Electric') return 'bg-[#34C759] text-black dark:bg-[#30D158] dark:text-black';
  if (fuel === 'Hybrid') return 'bg-[#007AFF] text-white dark:bg-[#0A84FF] dark:text-white';
  return 'bg-[#FF9500] text-black dark:bg-[#FF9F0A] dark:text-black';
}

function renderCars(list) {
  const grid = document.getElementById('cars-grid');
  const emptyState = document.getElementById('empty-state');
  const countEl = document.getElementById('results-count');

  if (countEl) countEl.textContent = `Showing ${list.length} ${list.length === 1 ? 'vehicle' : 'vehicles'}`;

  if (!list.length) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  grid.innerHTML = list
    .map((car) => {
      const isFav = favorites.includes(car.id);
      const phoneHref = `tel:${car.phone.replace(/\s+/g, '')}`;
      return `
        <article class="car-card ios-card overflow-hidden flex flex-col">
          <figure class="ios-image-wrap relative h-52 w-full overflow-hidden">
            <img
              src="${car.image}"
              alt="${car.brand} ${car.model}"
              loading="lazy"
              class="w-full h-full object-cover"
              onerror="this.src='https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80'"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25"></div>
            <div class="absolute top-3 left-3 flex items-center gap-1.5">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-black/70 text-white backdrop-blur-md">${car.year}</span>
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-black backdrop-blur-md">${car.condition}</span>
            </div>
            <button
              type="button"
              onclick="toggleFavorite('${car.id}', event)"
              aria-label="Save ${car.brand} ${car.model}"
              class="w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 active:scale-90 backdrop-blur-md flex items-center justify-center absolute top-3 right-3 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ${isFav ? 'text-[#FF3B30] fill-[#FF3B30]' : 'text-white'}" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
            <div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white">
              <span class="inline-flex items-center gap-1 bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full">${car.city}</span>
              <span class="px-2.5 py-1 rounded-full font-bold ${fuelBadgeClass(car.fuel)}">${car.fuel}</span>
            </div>
          </figure>

          <div class="p-5 flex-1 flex flex-col justify-between gap-4">
            <div>
              <div class="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-1">
                <span>${car.category}</span>
                <span>${car.seller}</span>
              </div>
              <h3 class="font-bold text-lg leading-snug line-clamp-1">${car.brand} ${car.model}</h3>
              <p class="text-2xl font-extrabold text-[#007AFF] dark:text-[#0A84FF] tabular-nums-price mt-1">${formatPrice(car.price)}</p>

              <div class="grid grid-cols-2 gap-2 text-xs opacity-75 mt-3 pt-3 border-t border-[var(--ios-hairline)]">
                <span class="tabular-nums-price">${formatMileage(car.mileage)}</span>
                <span class="truncate">${car.transmission}</span>
              </div>

              <div class="ios-inset-box mt-3 px-3 py-2 flex items-center justify-between gap-2">
                <a href="${phoneHref}" class="text-xs font-bold text-[#34C759] dark:text-[#30D158] hover:underline tabular-nums-price">${car.phone}</a>
                <button type="button" onclick="copyPhone('${car.phone}', event)" class="text-[11px] font-semibold opacity-75 hover:opacity-100 cursor-pointer">Copy</button>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button type="button" onclick="openCarDetails('${car.id}')" class="ios-btn-primary flex-1 py-2.5 px-3 text-xs sm:text-sm cursor-pointer">
                Details &amp; Test Drive
              </button>
              <a href="${phoneHref}" class="ios-pill-btn px-3 py-2.5 text-xs font-bold text-[#34C759] dark:text-[#30D158] shrink-0">Call</a>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  if (window.gsap) {
    gsap.fromTo(
      '.car-card',
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: { amount: 0.28, from: 'start' }, ease: 'power3.out', clearProps: 'transform' }
    );
  }
}

function toggleFavorite(id, event) {
  if (event) event.stopPropagation();
  const idx = favorites.indexOf(id);
  if (idx === -1) {
    favorites.push(id);
    showToast('Saved to Favorites', 'success');
  } else {
    favorites.splice(idx, 1);
    showToast('Removed from Favorites', 'info');
  }
  saveFavorites();
  applyFilters();
}

function copyPhone(phone, event) {
  if (event) event.stopPropagation();
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(phone).catch(() => {});
  showToast(`Copied ${phone}`, 'success');
}

function openCarDetails(id) {
  const car = cars.find((c) => c.id === id);
  if (!car) return;
  const phoneHref = `tel:${car.phone.replace(/\s+/g, '')}`;
  const content = document.getElementById('car-details-content');

  content.innerHTML = `
    <div class="relative h-60 sm:h-72 w-full">
      <img src="${car.image}" alt="${car.brand} ${car.model}" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25"></div>
      <button type="button" onclick="document.getElementById('car-details-modal').close()" class="w-9 h-9 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center font-bold absolute top-4 right-4 cursor-pointer">✕</button>
      <div class="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
        <div>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0A84FF] text-white">${car.category} • ${car.year}</span>
          <h3 class="text-2xl font-extrabold mt-1">${car.brand} ${car.model}</h3>
        </div>
        <div class="text-2xl font-extrabold text-[#64D2FF] tabular-nums-price">${formatPrice(car.price)}</div>
      </div>
    </div>
    <div class="p-6 space-y-5">
      <p class="text-sm opacity-75 leading-relaxed">${car.description}</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div class="ios-inset-box p-3"><div class="text-[11px] opacity-60">Mileage</div><div class="font-bold text-xs sm:text-sm mt-0.5 tabular-nums-price">${formatMileage(car.mileage)}</div></div>
        <div class="ios-inset-box p-3"><div class="text-[11px] opacity-60">Fuel</div><div class="font-bold text-xs sm:text-sm mt-0.5">${car.fuel}</div></div>
        <div class="ios-inset-box p-3"><div class="text-[11px] opacity-60">Transmission</div><div class="font-bold text-xs sm:text-sm mt-0.5 truncate">${car.transmission}</div></div>
        <div class="ios-inset-box p-3"><div class="text-[11px] opacity-60">City</div><div class="font-bold text-xs sm:text-sm mt-0.5">${car.city}</div></div>
      </div>
      <div class="ios-inset-box p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] opacity-60">Seller: <strong>${car.seller}</strong></div>
          <a href="${phoneHref}" class="text-sm font-extrabold text-[#34C759] dark:text-[#30D158] hover:underline tabular-nums-price">${car.phone}</a>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="copyPhone('${car.phone}')" class="ios-pill-btn px-3 py-1.5 text-xs cursor-pointer">Copy Number</button>
          <a href="${phoneHref}" class="ios-btn-primary px-3.5 py-1.5 text-xs">Call Seller</a>
        </div>
      </div>
      <form onsubmit="submitTestDrive(event, '${car.brand} ${car.model}')" class="space-y-3 pt-2 border-t border-[var(--ios-hairline)]">
        <h4 class="font-bold text-sm">Book a Test Drive</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" required placeholder="Your Full Name" class="input w-full h-10 rounded-xl ios-inset-box border-0 text-sm" />
          <input type="tel" required placeholder="+998 88 202 5252" class="input w-full h-10 rounded-xl ios-inset-box border-0 text-sm" />
        </div>
        <button type="submit" class="ios-btn-primary w-full py-2.5 text-sm cursor-pointer">Confirm Test Drive Request</button>
      </form>
    </div>
  `;

  const dialog = document.getElementById('car-details-modal');
  dialog.showModal();
  if (window.gsap) gsap.fromTo('#details-modal-box', { scale: 0.92, y: 18, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.34, ease: 'back.out(1.35)' });
}

function submitTestDrive(event, carName) {
  event.preventDefault();
  document.getElementById('car-details-modal').close();
  showToast(`Test drive requested for ${carName}!`, 'success');
}

function openSellModal() {
  const dialog = document.getElementById('sell-car-modal');
  dialog.showModal();
  if (window.gsap) gsap.fromTo('#sell-modal-box', { scale: 0.92, y: 18, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.34, ease: 'back.out(1.35)' });
}

function closeSellModal() {
  document.getElementById('sell-car-modal').close();
}

function setPresetImage(url) {
  const input = document.getElementById('new-image');
  if (input) input.value = url;
}

function handleAddCar(event) {
  event.preventDefault();
  const brand = document.getElementById('new-brand').value.trim();
  const model = document.getElementById('new-model').value.trim();
  const year = Number(document.getElementById('new-year').value) || 2025;
  const price = Number(document.getElementById('new-price').value) || 25000;
  const mileage = Number(document.getElementById('new-mileage').value) || 0;
  const category = document.getElementById('new-category').value;
  const fuel = document.getElementById('new-fuel').value;
  const city = document.getElementById('new-city').value.trim() || 'Tashkent';
  const transmission = document.getElementById('new-transmission').value.trim() || 'Automatic';
  const phone = document.getElementById('new-phone').value.trim() || '+998 88 202 5252';
  const image = document.getElementById('new-image').value.trim() || INITIAL_CARS[0].image;
  const description = document.getElementById('new-description').value.trim() || `${year} ${brand} ${model} listed on Avto Market.`;

  cars.unshift({
    id: 'car-' + Date.now(),
    brand,
    model,
    year,
    price,
    mileage,
    category,
    fuel,
    transmission,
    city,
    condition: mileage < 500 ? 'New' : 'Used',
    featured: true,
    phone,
    seller: 'Private Seller',
    image,
    description
  });

  saveCars();
  updateStats();
  closeSellModal();
  document.getElementById('sell-car-form').reset();
  document.getElementById('new-phone').value = '+998 88 202 5252';
  document.getElementById('new-image').value = INITIAL_CARS[0].image;
  resetAllFilters();
  showToast(`${brand} ${model} published!`, 'success');
}

function resetDemoData() {
  cars = [...INITIAL_CARS];
  favorites = [];
  saveCars();
  saveFavorites();
  updateStats();
  resetAllFilters();
  showToast('Catalog reset to 20 vehicles', 'info');
}

function initPwa() {
  const swBadge = document.getElementById('sw-status-badge');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => {
        if (swBadge) {
          swBadge.textContent = 'Active & Ready';
          swBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-[#34C759]/15 text-[#34C759] dark:text-[#30D158]';
        }
      })
      .catch(() => {
        if (swBadge) swBadge.textContent = 'Preview Mode';
      });
  } else if (swBadge) {
    swBadge.textContent = 'Ready (HTTPS/Localhost)';
  }

  const modeEl = document.getElementById('pwa-display-mode');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (modeEl) modeEl.textContent = isStandalone ? 'standalone (installed)' : 'browser tab';

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    document.getElementById('btn-install-pwa')?.classList.remove('hidden');
  });
}

function openPwaModal() {
  const dialog = document.getElementById('pwa-modal');
  dialog.showModal();
  if (window.gsap) gsap.fromTo('#pwa-modal-box', { scale: 0.92, y: 18, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.34, ease: 'back.out(1.35)' });
}

function closePwaModal() {
  document.getElementById('pwa-modal').close();
}

async function triggerPwaInstall() {
  if (!deferredPwaPrompt) return;
  deferredPwaPrompt.prompt();
  await deferredPwaPrompt.userChoice;
  deferredPwaPrompt = null;
  document.getElementById('btn-install-pwa')?.classList.add('hidden');
  closePwaModal();
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colorMap = {
    success: 'bg-[#34C759] text-black dark:bg-[#30D158] dark:text-black',
    info: 'bg-[#007AFF] text-white dark:bg-[#0A84FF] dark:text-white',
    error: 'bg-[#FF3B30] text-white dark:bg-[#FF453A] dark:text-white'
  };

  const toast = document.createElement('div');
  toast.className = `px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-xl ${colorMap[type] || colorMap.info}`;
  toast.textContent = message;
  container.appendChild(toast);

  if (window.gsap) {
    gsap.fromTo(toast, { opacity: 0, y: 20, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.4)' });
    gsap.to(toast, { opacity: 0, y: -10, duration: 0.25, delay: 2.3, onComplete: () => toast.remove() });
  } else {
    setTimeout(() => toast.remove(), 2500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setIosTheme(currentTheme, false);
  updateFavCounter();
  updateStats();
  applyFilters();
  initPwa();

  if (window.gsap) {
    gsap.from('.hero-stagger', { opacity: 0, y: 22, duration: 0.65, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' });
  }
});