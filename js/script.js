// ============================================================
// script.js - ПОЛНАЯ ВЕРСИЯ С ЗАГРУЗКОЙ С GITHUB PAGES
// ============================================================

// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
  CACHE_TTL: 24 * 60 * 60 * 1000,
  ITEMS_PER_PAGE: 12,        // ← стало 12
  RECENT_COUNT: 4,
  MAX_ZOOM: 3,
  ZOOM_STEP: 0.3,
  DEBOUNCE_DELAY: 300
};

// ===== БАЗОВЫЙ URL ДЛЯ GITHUB PAGES =====
const BASE_URL = 'https://manspo.github.io';

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let manufacturerOrder = [];
let manufacturersData = {};

// ===== УПРАВЛЕНИЕ ЗАГРУЗКОЙ =====

function showLoadingScreen() {
    const overlay = document.getElementById('loadingOverlay');
    const content = document.getElementById('mainContent');
    
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.opacity = '1';
    }
    if (content) {
        content.classList.add('loading');
        content.classList.remove('loaded');
    }
}

function showErrorScreen(message) {
    const overlay = document.getElementById('loadingOverlay');
    const content = document.getElementById('mainContent');
    const status = document.getElementById('loadingStatus');
    
    if (status) {
        status.innerHTML = '😕 ' + (message || 'Не удалось загрузить данные');
        status.style.background = 'rgba(239, 68, 68, 0.9)';
        status.style.color = 'white';
    }
    
    const existingBtn = document.querySelector('#loadingOverlay .retry-btn');
    if (!existingBtn) {
        const btn = document.createElement('button');
        btn.className = 'retry-btn';
        btn.textContent = '🔄 Повторить';
        btn.style.cssText = `
            padding: 12px 32px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            pointer-events: all;
            transition: transform 0.2s;
        `;
        btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
        btn.onclick = retryLoadData;
        document.getElementById('loadingOverlay').appendChild(btn);
    }
}

function showContent() {
    const overlay = document.getElementById('loadingOverlay');
    const content = document.getElementById('mainContent');
    
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.opacity = '0';
    }
    if (content) {
        content.classList.remove('loading');
        content.classList.add('loaded');
    }
}

function updateProgress(percent, text) {
    const bar = document.getElementById('progressBar');
    const textEl = document.getElementById('progressText');
    const status = document.getElementById('loadingStatus');
    
    if (bar) bar.style.width = Math.min(100, Math.max(0, percent)) + '%';
    if (textEl) textEl.textContent = text || '';
    if (status && percent < 100) {
        status.textContent = 'Загрузка данных...';
        status.style.background = 'rgba(255,255,255,0.85)';
        status.style.color = 'var(--text)';
    } else if (status && percent >= 100) {
        status.textContent = '✅ Готово!';
        status.style.background = 'rgba(34, 197, 94, 0.9)';
        status.style.color = 'white';
    }
}

async function retryLoadData() {
    const btn = document.querySelector('#loadingOverlay .retry-btn');
    if (btn) btn.remove();
    
    const status = document.getElementById('loadingStatus');
    if (status) {
        status.textContent = 'Повторная попытка...';
        status.style.background = 'rgba(255,255,255,0.85)';
        status.style.color = 'var(--text)';
    }
    
    showLoadingScreen();
    updateProgress(0, 'Повторная попытка...');
    
    try {
        await initHome();
        updateProgress(100, 'Готово!');
        setTimeout(showContent, 400);
    } catch (error) {
        showErrorScreen('Не удалось загрузить данные. Проверьте интернет.');
    }
}

// ===== УТИЛИТЫ =====

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;'
  };
  return String(text).replace(/[&<>"'/`]/g, m => map[m] || m);
}

function debounce(fn, delay = CONFIG.DEBOUNCE_DELAY) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function showError(message) {
  const toast = document.getElementById('errorToast');
  if (toast) {
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.background = '#ef4444';
    setTimeout(() => { toast.style.display = 'none'; }, 5000);
  } else {
    const newToast = document.createElement('div');
    newToast.id = 'errorToast';
    newToast.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: #ef4444; color: white; padding: 12px 24px;
      border-radius: 30px; z-index: 1001; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      max-width: 90%; text-align: center;
    `;
    newToast.textContent = message;
    document.body.appendChild(newToast);
    setTimeout(() => { newToast.remove(); }, 5000);
  }
}

function showSuccess(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #22c55e; color: white; padding: 12px 24px;
    border-radius: 30px; z-index: 1001; font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    max-width: 90%; text-align: center;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3000);
}

// ===== ЗАПРЕТ КОНТЕКСТНОГО МЕНЮ И DRAG-DROP =====
document.addEventListener('contextmenu', function(e) {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
    return false;
  }
});

document.addEventListener('dragstart', function(e) {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
    return false;
  }
});

// ===== СОЗДАНИЕ ПУСТОГО ИЗОБРАЖЕНИЯ (FALLBACK) =====
function createEmptyImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#999';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🖼️', 100, 100);
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
}

// ===== DATA LOADING =====

let seriesCache = {};
let seriesManufacturerMap = {};
let allSeriesData = null;
let isLoadingData = false;

async function loadData() {
    if (isLoadingData) {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (!isLoadingData && window.seriesIndex) {
                    clearInterval(check);
                    resolve(window.seriesIndex);
                }
            }, 50);
        });
    }
    
    if (window.seriesIndex) {
        return window.seriesIndex;
    }
    
    isLoadingData = true;
    
    try {
        console.log('🔍 Загрузка данных с:', `${BASE_URL}/data/index.json`);
        const res = await fetch(`${BASE_URL}/data/index.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const index = await res.json();
        index.forEach(s => { seriesManufacturerMap[s.id] = s.manufacturer; });
        window.seriesIndex = index;
        isLoadingData = false;
        return index;
    } catch (error) {
        isLoadingData = false;
        console.error('Ошибка загрузки индекса:', error);
        showError('Не удалось загрузить каталог. Проверьте соединение.');
        return [];
    }
}

async function loadSeriesById(id) {
    if (seriesCache[id]) return seriesCache[id];
    
    if (!window.seriesIndex) {
        await loadData();
    }
    
    const manufacturer = seriesManufacturerMap[id];
    if (!manufacturer) {
        console.error(`❌ Серия "${id}" не найдена в индексе`);
        return null;
    }
    
    try {
        const res = await fetch(`${BASE_URL}/data/series/${manufacturer}/${id}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        
        const series = await res.json();
        if (!series || !series.id) throw new Error(`Серия ${id} не найдена`);
        
        seriesCache[id] = series;
        return series;
    } catch (error) {
        console.error('Ошибка загрузки серии:', error);
        showError(`Не удалось загрузить серию ${id}`);
        return null;
    }
}

async function loadAllSeries() {
  try {
    const index = await loadData();
    const allSeries = [];
    
    for (const item of index) {
      try {
        const manufacturer = item.manufacturer;
        const res = await fetch(`${BASE_URL}/data/series/${manufacturer}/${item.id}.json`);
        if (!res.ok) continue;
        const data = await res.json();
        allSeries.push(data);
        seriesCache[data.id] = data;
      } catch (e) {
        console.error('Ошибка загрузки серии:', item.id, e);
      }
    }
    
    return allSeries;
  } catch (error) {
    console.error('Ошибка загрузки всех серий:', error);
    showError('Не удалось загрузить все серии');
    return [];
  }
}

// ===== ЗАГРУЗКА ПРОИЗВОДИТЕЛЕЙ =====
async function loadManufacturers() {
  try {
    const res = await fetch(`${BASE_URL}/data/manufacturers.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    manufacturersData = data;
    manufacturerOrder = Object.keys(data);
    window.manufacturers = data;
    return data;
  } catch (error) {
    console.error('Ошибка загрузки производителей:', error);
    const fallback = {
      'kinder': { ru: 'Киндер', en: 'Kinder' },
      'nestle': { ru: 'Нестле', en: 'Nestle' },
      'landrin': { ru: 'Ландрин', en: 'Landrin' }
    };
    manufacturersData = fallback;
    manufacturerOrder = Object.keys(fallback);
    window.manufacturers = fallback;
    return fallback;
  }
}

// ===== ОПРЕДЕЛЕНИЕ ПАПКИ ПРОИЗВОДИТЕЛЯ =====
function getManufacturerFolder(m) {
  // Используем ключ производителя как имя папки
  return m || 'other';
}

async function loadSocialLinks() {
  try {
    const res = await fetch(`${BASE_URL}/data/social.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch(error) {
    console.error('Ошибка загрузки социальных ссылок:', error);
    return [];
  }
}

async function loadAllDataWithCache(forceReload = false) {
  if (allSeriesData && !forceReload) return allSeriesData;
  
  if (forceReload) {
    try {
      localStorage.removeItem('allSeriesData');
      localStorage.removeItem('allSeriesDataTime');
    } catch(e) {}
  }
  
  try {
    const cached = localStorage.getItem('allSeriesData');
    const cacheTime = localStorage.getItem('allSeriesDataTime');
    
    if (cached && cacheTime && !forceReload) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < CONFIG.CACHE_TTL) {
        allSeriesData = JSON.parse(cached);
        console.log('✅ Загружено из кеша');
        return allSeriesData;
      }
    }
  } catch(e) {
    console.warn('Ошибка чтения кеша:', e);
  }
  
  console.log('⏳ Загрузка данных...');
  const data = await loadAllSeries();
  allSeriesData = data;
  
  try {
    localStorage.setItem('allSeriesData', JSON.stringify(data));
    localStorage.setItem('allSeriesDataTime', Date.now().toString());
    console.log('✅ Данные сохранены в кеш');
  } catch(e) {
    console.warn('Не удалось сохранить кеш:', e);
  }
  
  return data;
}

// ===== ФИЛЬТРЫ =====
function getFilterState() {
  const saved = localStorage.getItem('filterState');
  const defaultState = {
    catalog: { manufacturer: 'all', kind: 'all', sort: 'date-desc', search: '' },
    mycollection: { manufacturer: 'all', kind: 'all', search: '' },
    forsale: { manufacturer: 'all', kind: 'all', sort: 'date-desc', search: '', tab: 'figures' }
  };
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultState, ...parsed };
    } catch(e) {
      console.warn('Ошибка парсинга filterState:', e);
      return defaultState;
    }
  }
  return defaultState;
}

function saveFilterState(state) {
  try {
    localStorage.setItem('filterState', JSON.stringify(state));
  } catch(e) {
    console.warn('Не удалось сохранить состояние фильтров:', e);
  }
}

let filterState = getFilterState();

// ===== ЯЗЫК В URL =====
function updateUrlWithLang(lang) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
  } catch(e) {
    console.warn('Не удалось обновить URL:', e);
  }
}

function getLangFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get('lang');
  } catch(e) {
    return null;
  }
}

function initLangFromUrl() {
  const urlLang = getLangFromUrl();
  if (urlLang && (urlLang === 'ru' || urlLang === 'en')) {
    localStorage.setItem("lang", urlLang);
  }
}

// ===== ТЕМНАЯ ТЕМА =====
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const themeBtn = document.querySelector('.theme-switch');
  if (themeBtn) {
    themeBtn.innerHTML = savedTheme === 'light' ? '🌙' : '☀️';
    themeBtn.onclick = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      themeBtn.innerHTML = newTheme === 'light' ? '🌙' : '☀️';
    };
  }
}

// ===== ЗАГРУЗКА ИЗОБРАЖЕНИЙ С ЗАЩИТОЙ =====
function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        const timeout = setTimeout(() => {
            console.warn('⏱️ Таймаут загрузки:', src);
            resolve(createEmptyImage());
        }, 5000);
        
        img.onload = () => {
            clearTimeout(timeout);
            resolve(img);
        };
        
        img.onerror = () => {
            clearTimeout(timeout);
            console.warn('❌ Ошибка загрузки:', src);
            resolve(createEmptyImage());
        };
        
        img.src = src;
    });
}

// ===== ИЗВЛЕЧЕНИЕ ID ИЗ URL (ДЛЯ ВИДЕО) =====

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractVKId(url) {
  if (!url) return null;
  // https://vk.com/clip-230111118_456239019
  // https://vk.com/video-230111118_456239019
  // https://vk.com/video_ext.php?oid=-230111118&id=456239019
  const match1 = url.match(/vk\.com\/(?:clip|video)(-?\d+)_(\d+)/);
  if (match1) {
    return { oid: match1[1], id: match1[2] };
  }
  const match2 = url.match(/[?&]oid=(-?\d+).*[?&]id=(\d+)/);
  if (match2) {
    return { oid: match2[1], id: match2[2] };
  }
  return null;
}

function extractTikTokId(url) {
  if (!url) return null;
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

// ===== СОЗДАНИЕ БЛОКА ВИДЕО =====

function createVideosBlock(videos, currentLang) {
  if (!videos) return '';
  
  const embeds = [];
  const links = [];
  
  // ===== YouTube — встроенное =====
  if (videos.youtube && videos.youtube.length > 0) {
    videos.youtube.forEach(url => {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        embeds.push(`
          <div class="video-embed">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              loading="lazy">
            </iframe>
          </div>
        `);
      } else {
        links.push(`
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" 
             class="video-link youtube-link">
            <span class="video-link-icon">▶️</span>
            <span class="video-link-text">
              <span class="video-link-name">YouTube</span>
              <span class="video-link-hint">${currentLang === 'ru' ? 'Открыть видео' : 'Open video'}</span>
            </span>
          </a>
        `);
      }
    });
  }
  
  // ===== VK — встроенное =====
  if (videos.vk && videos.vk.length > 0) {
    videos.vk.forEach(url => {
      const vkData = extractVKId(url);
      if (vkData) {
        embeds.push(`
          <div class="video-embed">
            <iframe 
              src="https://vk.com/video_ext.php?oid=${vkData.oid}&id=${vkData.id}&hd=2"
              frameborder="0" 
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowfullscreen
              loading="lazy">
            </iframe>
          </div>
        `);
      } else {
        links.push(`
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" 
             class="video-link vk-link">
            <span class="video-link-icon">🔵</span>
            <span class="video-link-text">
              <span class="video-link-name">VK Видео</span>
              <span class="video-link-hint">${currentLang === 'ru' ? 'Открыть видео' : 'Open video'}</span>
            </span>
          </a>
        `);
      }
    });
  }
  
  // ===== TikTok — фолбэк-ссылка =====
  if (videos.tiktok && videos.tiktok.length > 0) {
    videos.tiktok.forEach(url => {
      links.push(`
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" 
           class="video-link tiktok">
          <span class="video-link-icon">🎵</span>
          <span class="video-link-text">
            <span class="video-link-name">TikTok</span>
            <span class="video-link-hint">${currentLang === 'ru' ? 'Открыть видео' : 'Open video'}</span>
          </span>
        </a>
      `);
    });
  }
  
  // ===== Instagram — фолбэк-ссылка =====
  if (videos.instagram && videos.instagram.length > 0) {
    videos.instagram.forEach(url => {
      links.push(`
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" 
           class="video-link instagram">
          <span class="video-link-icon">📸</span>
          <span class="video-link-text">
            <span class="video-link-name">Instagram</span>
            <span class="video-link-hint">${currentLang === 'ru' ? 'Открыть видео' : 'Open video'}</span>
          </span>
        </a>
      `);
    });
  }
  
  if (embeds.length === 0 && links.length === 0) return '';
  
  let html = `<div class="videos-section">
    <h2 data-i18n="videos">${currentLang === 'ru' ? 'Видео' : 'Videos'}</h2>`;
  
  // Встроенные видео — 2 в ряд
  if (embeds.length > 0) {
    html += `<div class="videos-embeds">${embeds.join('')}</div>`;
  }
  
  // Ссылки-фолбэки — 2 в ряд
  if (links.length > 0) {
    html += `<div class="videos-links">${links.join('')}</div>`;
  }
  
  html += `</div>`;
  
  return html;
}

// ===== QR-КОДЫ =====
function generateQRCode(figureId, seriesId, figureName, isSeries = false) {
  try {
    const currentLang = localStorage.getItem("lang") || "ru";

    const APP_SCHEME = 'kindercapsule://open';
    const WEB_BASE = 'https://manspo.github.io';
    
    let qrUrl;
    if (isSeries) {
      qrUrl = `${WEB_BASE}/series.html?id=${encodeURIComponent(seriesId)}`;
    } else {
      qrUrl = `${WEB_BASE}/series.html?id=${encodeURIComponent(seriesId)}#figure-${encodeURIComponent(figureId)}`;
    }

    const safeName = String(figureName || seriesId || "QR")
      .replace(/[^a-zA-Zа-яА-ЯёЁ0-9_-]/g, "_")
      .substring(0, 60);

    const modal = document.createElement("div");
    modal.className = "qr-modal";
    modal.innerHTML = `
      <div class="qr-modal-content">
        <button type="button" class="qr-modal-close">×</button>
        <h3 class="qr-title">${escapeHtml(isSeries ? (currentLang === 'ru' ? `Серия: ${figureName}` : `Series: ${figureName}`) : figureName)}</h3>
        <div class="qr-code-container"></div>
        <p class="qr-description">${currentLang === 'ru' ? 'QR-код' : 'QR code'}</p>
        <button type="button" class="qr-download-btn" id="qr-download-btn">💾 ${currentLang === 'ru' ? 'Сохранить в галерею' : 'Save to gallery'}</button>
      </div>
    `;
    document.body.appendChild(modal);

    const qrContainer = modal.querySelector(".qr-code-container");
    if (typeof QRCode === "undefined") {
      alert('Библиотека QR-кода не загружена');
      modal.remove();
      return;
    }

    new QRCode(qrContainer, {
      text: qrUrl,
      width: 240,
      height: 240,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    modal.querySelector(".qr-modal-close").onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    const downloadBtn = document.getElementById("qr-download-btn");
    if (downloadBtn) {
      downloadBtn.onclick = async function() {
        try {
          const canvas = qrContainer.querySelector("canvas");
          if (!canvas) {
            alert('QR-код ещё не создан');
            return;
          }

          const dataUrl = canvas.toDataURL("image/png");
          const base64Data = dataUrl.split(',')[1];
          const fileName = `QR_${safeName}_${Date.now()}.png`;

          if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            if (window.FileHelper) {
              try {
                const savedPath = await saveQRCodeNative(base64Data, fileName);
                if (savedPath) {
                  const msg = currentLang === 'ru'
                    ? `✅ QR-код сохранен в галерею!\n\n📁 Путь: ${savedPath}`
                    : `✅ QR code saved to gallery!\n\n📁 Path: ${savedPath}`;
                  alert(msg);
                  showSuccess('✅ QR-код сохранен в галерею');
                  modal.remove();
                  return;
                }
              } catch (nativeError) {
                console.warn('❌ Нативный метод не сработал:', nativeError);
              }
            }
            
            try {
              const Filesystem = window.Capacitor.Plugins.Filesystem;
              const Share = window.Capacitor.Plugins.Share;
              if (Filesystem) {
                const dirs = [
                  { dir: 3, name: 'Documents' },
                  { dir: 2, name: 'Cache' },
                  { dir: 1, name: 'Data' }
                ];
                for (const d of dirs) {
                  try {
                    const result = await Filesystem.writeFile({
                      path: fileName,
                      data: base64Data,
                      directory: d.dir,
                      recursive: true
                    });
                    alert(`✅ Сохранено в ${d.name}`);
                    if (Share) {
                      try {
                        await Share.share({
                          title: 'QR-код',
                          text: `QR-код для ${figureName}`,
                          url: result.uri,
                          dialogTitle: 'Открыть файл'
                        });
                      } catch (shareError) {}
                    }
                    showSuccess(`✅ QR-код сохранен в ${d.name}`);
                    modal.remove();
                    return;
                  } catch (dirError) {}
                }
              }
            } catch (fsError) {}
            throw new Error('Не удалось сохранить QR-код.');
          }
          
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => document.body.removeChild(link), 100);
          showSuccess('✅ QR-код скачан');
          modal.remove();

        } catch (error) {
          alert(`❌ Ошибка: ${error.message}`);
        }
      };
    }
  } catch (error) {
    console.error('❌ Ошибка генерации QR:', error);
    alert('Не удалось создать QR-код');
  }
}

// ===== СОХРАНЕНИЕ ЧЕК-ЛИСТА ЧЕРЕЗ НАТИВНЫЙ МЕТОД =====
async function saveChecklistNative(base64Data, fileName) {
    return new Promise((resolve, reject) => {
        try {
            if (!window.FileHelper) {
                reject(new Error('FileHelper не найден.'));
                return;
            }
            
            window._checklistSaveCallback = function(result) {
                if (result && result !== 'null') {
                    resolve(result);
                } else {
                    reject(new Error('Не удалось сохранить чек-лист'));
                }
                window._checklistSaveCallback = null;
            };
            
            window.FileHelper.saveChecklist(base64Data, fileName);
            
            setTimeout(() => {
                if (window._checklistSaveCallback) {
                    window._checklistSaveCallback = null;
                    reject(new Error('Таймаут сохранения чек-листа'));
                }
            }, 15000);
            
        } catch (error) {
            reject(error);
        }
    });
}

window.saveChecklistNative = saveChecklistNative;

// ===== СОХРАНЕНИЕ QR ЧЕРЕЗ НАТИВНЫЙ МЕТОД =====
async function saveQRCodeNative(base64Data, fileName) {
    return new Promise((resolve, reject) => {
        try {
            if (!window.FileHelper) {
                reject(new Error('FileHelper не найден.'));
                return;
            }
            
            window._qrSaveCallback = function(result) {
                if (result && result !== 'null') {
                    resolve(result);
                } else {
                    reject(new Error('Не удалось сохранить файл'));
                }
            };
            
            window.FileHelper.saveQRCode(base64Data, fileName);
            
            setTimeout(() => {
                if (window._qrSaveCallback) {
                    window._qrSaveCallback = null;
                    reject(new Error('Таймаут сохранения'));
                }
            }, 10000);
            
        } catch (error) {
            reject(error);
        }
    });
}

// ===== ГАЛЕРЕЯ =====
let lightboxImages = [];
let currentLightboxIndex = 0;
let currentZoom = 1;
let isPanning = false;
let startX = 0, startY = 0, translateX = 0, translateY = 0;

window.openLightbox = function(index, images) {
  try {
    lightboxImages = images || [];
    currentLightboxIndex = typeof index === 'number' ? index : 0;
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const counter = document.getElementById('imageCounter');
    
    resetZoom();
    document.body.style.overflow = 'hidden';
    
    if (lightbox && img && lightboxImages.length > 0) {
      const idx = Math.min(Math.max(currentLightboxIndex, 0), lightboxImages.length - 1);
      img.src = lightboxImages[idx];
      if (counter) counter.textContent = `${idx + 1} / ${lightboxImages.length}`;
      lightbox.style.display = 'flex';
      
      img.onload = function() { initZoomFeatures(); };
      if (img.complete) setTimeout(() => initZoomFeatures(), 50);
    }
  } catch(error) {
    console.error('Ошибка открытия лайтбокса:', error);
  }
};

function resetZoom() {
  const img = document.getElementById('lightboxImg');
  if (!img) return;
  currentZoom = 1;
  translateX = 0; translateY = 0;
  img.style.transform = 'scale(1) translate(0px, 0px)';
  img.classList.remove('zoomed');
  img.style.cursor = 'zoom-in';
}

function zoomIn() {
  const img = document.getElementById('lightboxImg');
  if (!img) return;
  if (currentZoom < CONFIG.MAX_ZOOM) {
    currentZoom = Math.min(CONFIG.MAX_ZOOM, currentZoom + CONFIG.ZOOM_STEP);
    img.style.transform = `scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
    if (currentZoom > 1) {
      img.classList.add('zoomed');
      img.style.cursor = 'grab';
    }
  }
}

function zoomOut() {
  const img = document.getElementById('lightboxImg');
  if (!img) return;
  if (currentZoom > 1) {
    currentZoom = Math.max(1, currentZoom - CONFIG.ZOOM_STEP);
    if (currentZoom <= 1) { translateX = 0; translateY = 0; }
    img.style.transform = `scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
    if (currentZoom <= 1) {
      img.classList.remove('zoomed');
      img.style.cursor = 'zoom-in';
    }
  }
}

function initZoomFeatures() {
  const img = document.getElementById('lightboxImg');
  if (!img) return;
  
  if (img._touchStartHandler) img.removeEventListener('touchstart', img._touchStartHandler);
  if (img._touchMoveHandler) img.removeEventListener('touchmove', img._touchMoveHandler);
  if (img._touchEndHandler) img.removeEventListener('touchend', img._touchEndHandler);
  
  document.getElementById('zoomInBtn').onclick = (e) => { e.stopPropagation(); zoomIn(); };
  document.getElementById('zoomOutBtn').onclick = (e) => { e.stopPropagation(); zoomOut(); };
  document.getElementById('zoomResetBtn').onclick = (e) => { e.stopPropagation(); resetZoom(); };
  
  img.onclick = (e) => {
    e.stopPropagation();
    if (currentZoom > 1) resetZoom();
    else zoomIn();
  };
  
  img.onmousedown = (e) => {
    if (currentZoom <= 1) return;
    e.preventDefault();
    isPanning = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    img.style.cursor = 'grabbing';
  };
  
  window.onmousemove = (e) => {
    if (!isPanning || currentZoom <= 1) return;
    e.preventDefault();
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    img.style.transform = `scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
  };
  
  window.onmouseup = () => {
    if (isPanning) {
      isPanning = false;
      if (img) img.style.cursor = 'grab';
    }
  };
  
  let touchStartDistance = 0, touchStartZoom = 1;
  let isTouching = false, isPanningTouch = false;
  let panStartX = 0, panStartY = 0;
  let swipeStartX = 0, swipeStartTime = 0, isSwiping = false;
  
  function handleTouchStart(e) {
    e.preventDefault();
    swipeStartX = e.touches[0].clientX;
    swipeStartTime = Date.now();
    isSwiping = true;
    
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistance = Math.hypot(dx, dy);
      touchStartZoom = currentZoom;
      isTouching = true;
      isSwiping = false;
    }
    
    if (currentZoom > 1 && e.touches.length === 1) {
      isPanningTouch = true;
      panStartX = e.touches[0].clientX - translateX;
      panStartY = e.touches[0].clientY - translateY;
      isSwiping = false;
    }
  }
  
  function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && isPanningTouch && currentZoom > 1) {
      translateX = e.touches[0].clientX - panStartX;
      translateY = e.touches[0].clientY - panStartY;
      img.style.transform = `scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
      isSwiping = false;
    }
    
    if (e.touches.length === 2 && isTouching) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      let scale = touchStartZoom * (distance / touchStartDistance);
      scale = Math.min(CONFIG.MAX_ZOOM, Math.max(1, scale));
      
      if (scale !== currentZoom) {
        currentZoom = scale;
        img.style.transform = `scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
        if (currentZoom > 1) {
          img.classList.add('zoomed');
          img.style.cursor = 'grab';
        } else {
          img.classList.remove('zoomed');
          img.style.cursor = 'zoom-in';
          translateX = 0; translateY = 0;
          img.style.transform = 'scale(1) translate(0px, 0px)';
        }
      }
      isSwiping = false;
    }
  }
  
  function handleTouchEnd(e) {
    e.preventDefault();
    
    if (isSwiping && currentZoom <= 1) {
      const deltaX = e.changedTouches[0].clientX - swipeStartX;
      const deltaTime = Date.now() - swipeStartTime;
      if (Math.abs(deltaX) > 50 && deltaTime < 300) {
        if (deltaX > 0) prevLightboxImage();
        else nextLightboxImage();
      }
    }
    
    isPanningTouch = false;
    isTouching = false;
    isSwiping = false;
    if (currentZoom <= 1) { translateX = 0; translateY = 0; }
  }
  
  img._touchStartHandler = handleTouchStart;
  img._touchMoveHandler = handleTouchMove;
  img._touchEndHandler = handleTouchEnd;
  
  img.addEventListener('touchstart', handleTouchStart, { passive: false });
  img.addEventListener('touchmove', handleTouchMove, { passive: false });
  img.addEventListener('touchend', handleTouchEnd);
  img.addEventListener('touchcancel', handleTouchEnd);
}

window.closeLightbox = function() {
  document.getElementById('lightbox').style.display = 'none';
  document.body.style.overflow = '';
};

window.prevLightboxImage = function() {
  if (lightboxImages.length > 0) {
    currentLightboxIndex = (currentLightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    const img = document.getElementById('lightboxImg');
    resetZoom();
    img.src = lightboxImages[currentLightboxIndex];
    document.getElementById('imageCounter').textContent = `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
    setTimeout(() => initZoomFeatures(), 100);
  }
};

window.nextLightboxImage = function() {
  if (lightboxImages.length > 0) {
    currentLightboxIndex = (currentLightboxIndex + 1) % lightboxImages.length;
    const img = document.getElementById('lightboxImg');
    resetZoom();
    img.src = lightboxImages[currentLightboxIndex];
    document.getElementById('imageCounter').textContent = `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
    setTimeout(() => initZoomFeatures(), 100);
  }
};

// ===== ПЕРЕВОДЫ =====
function applyTranslations() {
  const lang = localStorage.getItem("lang") || "ru";
  
  document.querySelectorAll('.flag').forEach(flag => {
    flag.classList.toggle('active', flag.dataset.lang === lang);
  });
  
  fetch(`lang/${lang}.json`)
    .then(r => r.json())
    .then(dict => {
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        if (dict[key]) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = dict[key];
          } else {
            el.textContent = dict[key];
          }
        }
      });
      
      if (dict.title_home) document.title = dict.title_home;
      
      const sortSelect = document.getElementById('sortSelect');
      if (sortSelect) {
        Array.from(sortSelect.options).forEach(option => {
          const keyMap = {
  'date-desc': 'sort_date_desc',
  'date-asc': 'sort_date_asc',
  'name': 'sort_name_asc',
  'name-desc': 'sort_name_desc',
  'year': 'sort_year_asc',
  'year-desc': 'sort_year_desc'
};
          const key = keyMap[option.value];
          if (key && dict[key]) option.textContent = dict[key];
        });
      }
    })
    .catch(() => console.warn('Translation not available for:', lang));
}

function setLang(lang) {
  localStorage.setItem("lang", lang);
  updateUrlWithLang(lang);
  window.location.reload();
}

// ===== HOME PAGE =====
async function initHome() {
  showLoadingScreen();
  updateProgress(0, 'Начинаем загрузку...');
  
  try {
    if (filterState.catalog) {
      filterState.catalog.search = '';
      filterState.catalog.manufacturer = 'all';
      filterState.catalog.kind = 'all';
    }
    if (filterState.mycollection) {
      filterState.mycollection.search = '';
      filterState.mycollection.manufacturer = 'all';
      filterState.mycollection.kind = 'all';
    }
    if (filterState.forsale) {
      filterState.forsale.search = '';
      filterState.forsale.manufacturer = 'all';
      filterState.forsale.tab = 'figures';
    }
    if (filterState.videos) {
      filterState.videos.search = '';
    }
    saveFilterState(filterState);
    
    updateProgress(20, 'Загрузка списка серий...');
    
    const [data, manufacturers] = await Promise.all([
      loadData(),
      loadManufacturers()
    ]);
    
    updateProgress(50, 'Обработка данных...');
    window.manufacturers = manufacturers;
    const filteredData = data.filter(s => s.visible !== false);
    
    updateProgress(70, 'Обновление статистики...');
    await updateStats(filteredData);
    
    updateProgress(85, 'Загрузка последних серий...');
    loadLatestSeries(filteredData);
    
    updateProgress(95, 'Загрузка соцсетей...');
    const socialLinks = await loadSocialLinks();
    loadSocialGrid(socialLinks);
    applyTranslations();
    
    updateProgress(100, 'Готово!');
    setTimeout(showContent, 400);
    
  } catch(error) {
    console.error('Ошибка инициализации главной страницы:', error);
    const errorMsg = error.message === 'Превышено время ожидания' 
      ? 'Сервер не отвечает. Проверьте интернет.'
      : 'Не удалось загрузить данные. Проверьте соединение.';
    showErrorScreen(errorMsg);
    showError('Не удалось загрузить главную страницу');
  }
}

// ===== ЗАГРУЗКА СТАТИСТИКИ =====
async function loadStats() {
  try {
    const res = await fetch(`${BASE_URL}/data/stats.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
    return null;
  }
}

// ===== ОБНОВЛЕНИЕ СТАТИСТИКИ (НОВАЯ ВЕРСИЯ) =====
async function updateStats(data) {
  try {
    const totalSeriesSpan = document.getElementById('totalSeries');
    const totalFiguresSpan = document.getElementById('totalFigures');
    const totalInsertsSpan = document.getElementById('totalInserts');
    const totalForSaleSpan = document.getElementById('totalForSaleItems');
    const totalManufacturersSpan = document.getElementById('totalManufacturers');
    
    // Пробуем загрузить готовый stats.json
    const stats = await loadStats();
    
    if (stats) {
      // ✅ Мгновенно — используем готовые цифры
      if (totalSeriesSpan) totalSeriesSpan.textContent = stats.totalSeries;
      if (totalFiguresSpan) totalFiguresSpan.textContent = stats.totalFigures;
      if (totalInsertsSpan) totalInsertsSpan.textContent = stats.totalInserts;
      if (totalForSaleSpan) totalForSaleSpan.textContent = stats.totalForSale;
      if (totalManufacturersSpan) totalManufacturersSpan.textContent = stats.totalManufacturers;
      
      console.log('✅ Статистика загружена из stats.json');
      return;
    }
    
    // ⚠️ Фолбэк — если stats.json нет
    console.warn('⚠️ stats.json не найден, считаем вручную');
    
    if (totalSeriesSpan) totalSeriesSpan.textContent = data.length;
    
    if (totalManufacturersSpan) {
      try {
        const manufacturers = await loadManufacturers();
        totalManufacturersSpan.textContent = Object.keys(manufacturers).length;
      } catch {
        totalManufacturersSpan.textContent = '0';
      }
    }
    
    if (totalFiguresSpan || totalInsertsSpan || totalForSaleSpan) {
      const allSeries = await loadAllDataWithCache();
      let figuresCount = 0, insertsCount = 0, forSaleCount = 0;
      allSeries.forEach(series => {
        figuresCount += series.figures?.length || 0;
        insertsCount += series.inserts?.length || 0;
        forSaleCount += series.figures?.filter(f => f.forsale).length || 0;
        forSaleCount += series.extras?.filter(e => e.forsale).length || 0;
        forSaleCount += series.inserts?.filter(i => i.forsale).length || 0;
        forSaleCount += series.variants?.filter(v => v.forsale).length || 0;
      });
      if (totalFiguresSpan) totalFiguresSpan.textContent = figuresCount;
      if (totalInsertsSpan) totalInsertsSpan.textContent = insertsCount;
      if (totalForSaleSpan) totalForSaleSpan.textContent = forSaleCount;
    }
  } catch(error) {
    console.error('Ошибка обновления статистики:', error);
  }
}

async function initAbout() {
  try {
    await loadManufacturers();
    const data = await loadData();
    await updateStats(data);
    applyTranslations();
  } catch(error) {
    console.error('Ошибка инициализации about:', error);
    showError('Не удалось загрузить страницу "О нас"');
  }
}

function loadSocialGrid(socialLinks) {
  const grid = document.getElementById('socialGrid');
  if (!grid) return;
  
  if (!socialLinks || socialLinks.length === 0) {
    const currentLang = localStorage.getItem("lang") || "ru";
    grid.innerHTML = `<p style="text-align: center; color: #6b7280;">
      ${currentLang === 'ru' ? 'Социальные сети будут добавлены позже' : 'Social networks will be added later'}
    </p>`;
    return;
  }
  
  grid.innerHTML = socialLinks.map(social => `
    <a href="${escapeHtml(social.url)}" class="home-card social-card" target="_blank" rel="noopener noreferrer" style="border-top: 3px solid ${escapeHtml(social.color || '#4f46e5')};">
      <div class="social-icon-wrapper">
        <img src="${escapeHtml(social.icon)}" class="social-icon-img" alt="${escapeHtml(social.name)}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'icon\' style=\'color: ${escapeHtml(social.color || '#4f46e5')}; font-size: 32px;\'>${escapeHtml(social.icon_emoji || '🔗')}</div>'">
      </div>
      <div class="home-title">${escapeHtml(social.name)}</div>
    </a>
  `).join('');
}

function loadLatestSeries(data) {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  
  const latest = data.slice(0, 3);
  const currentLang = localStorage.getItem("lang") || "ru";
  
  grid.innerHTML = latest.map(s => {
    const name = currentLang === 'en' && s.name_en ? s.name_en : s.name;
    const imageUrl = s.cover ? `${BASE_URL}/${s.cover}` : 'images/placeholder.svg';
    return `
      <a href="series.html?id=${escapeHtml(s.id)}" class="featured-card">
        <img src="${imageUrl}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.src='images/placeholder.svg'">
        <div class="featured-info">
          <h3>${escapeHtml(name)}</h3>
          <span class="featured-year">${escapeHtml(s.year)}</span>
        </div>
      </a>
    `;
  }).join('');
}

// ===== ЗАГРУЗКА ВИДЕО =====
async function loadVideos() {
  try {
    const res = await fetch(`${BASE_URL}/data/videos.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Ошибка загрузки видео:', error);
    return [];
  }
}

// ===== ЗАГРУЗКА ТОВАРОВ НА ПРОДАЖУ =====
async function loadForsale() {
  try {
    const res = await fetch(`${BASE_URL}/data/forsale.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
    return [];
  }
}

// ===== ЗАГРУЗКА КОЛЛЕКЦИИ =====
async function loadCollection() {
  try {
    const res = await fetch(`${BASE_URL}/data/collection.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Ошибка загрузки коллекции:', error);
    return [];
  }
}

// ===== ФИЛЬТРЫ ПО ТИПУ =====
function initKindFilters(containerId, currentKind, onKindChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const kinds = [
    { value: 'all', label_ru: 'Все', label_en: 'All' },
    { value: '', label_ru: 'Обычные', label_en: 'Regular' },
    { value: 'joy', label_ru: 'Джой', label_en: 'Joy' },
    { value: 'maxi', label_ru: 'Макси', label_en: 'Maxi' },
    { value: 'giant', label_ru: 'Гигант', label_en: 'Giant' }
  ];
  
  const currentLang = localStorage.getItem("lang") || "ru";
  
  container.innerHTML = kinds.map(kind => `
    <button class="kind-btn ${currentKind === kind.value ? 'active' : ''}" data-kind="${kind.value}">
      ${currentLang === 'ru' ? kind.label_ru : kind.label_en}
    </button>
  `).join('');
  
  container.querySelectorAll('.kind-btn').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.kind-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onKindChange(btn.dataset.kind);
    };
  });
}

// ===== ЗАГРУЗКА ПОИСКОВОГО ИНДЕКСА =====
async function loadSearch() {
  try {
    const res = await fetch(`${BASE_URL}/data/search.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Ошибка загрузки поискового индекса:', error);
    return [];
  }
}

// ===== CATALOG =====
async function initCatalog() {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;
  
  try {
    await loadManufacturers();
    let data = await loadData();
    data = data.filter(s => s.visible !== false);
    const manufacturers = await loadManufacturers();
    
    const sort = document.getElementById("sortSelect");
    const searchInput = document.getElementById("searchInput");
    
    const urlParams = new URLSearchParams(window.location.search);
    const yearParam = urlParams.get('year');
    const manufacturerParam = urlParams.get('manufacturer');
    
    let currentFilter = filterState.catalog.manufacturer || 'all';
    let currentKindFilter = filterState.catalog.kind || 'all';
    let currentSort = filterState.catalog.sort || 'date-desc';
    let searchQuery = filterState.catalog.search || '';
    
    if (manufacturerParam && manufacturerParam !== 'all') {
      currentFilter = manufacturerParam;
      filterState.catalog.manufacturer = manufacturerParam;
      searchQuery = '';
      filterState.catalog.search = '';
    }
    if (yearParam) {
      searchQuery = yearParam;
      filterState.catalog.search = yearParam;
    }
    
    const filterGroup = document.querySelector('.filter-group');
    if (filterGroup) {
      const uniqueManufacturers = [...new Set(data.map(s => s.manufacturer))];
      const sortedManufacturers = manufacturerOrder.filter(m => uniqueManufacturers.includes(m));
      const currentLang = localStorage.getItem("lang") || "ru";
      
      filterGroup.innerHTML = '<button class="filter-btn" data-filter="all" data-i18n="all">Все</button>';
      sortedManufacturers.forEach(m => {
        const displayName = manufacturers[m]?.[currentLang] || m;
        filterGroup.innerHTML += `<button class="filter-btn" data-filter="${m}">${displayName}</button>`;
      });
      
      const activeBtn = document.querySelector(`.filter-btn[data-filter="${currentFilter}"]`);
      if (activeBtn) activeBtn.classList.add('active');
      else document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');
    }
    
    const kindFiltersWrapper = document.getElementById('kindFiltersWrapper');
    if (kindFiltersWrapper) {
      initKindFilters('kindFilters', currentKindFilter, (newKind) => {
        currentKindFilter = newKind;
        filterState.catalog.kind = currentKindFilter;
        saveFilterState(filterState);
        render();
      });
    }
    
    function updateKindFiltersVisibility() {
      if (kindFiltersWrapper) {
        if (currentFilter === 'kinder') {
          kindFiltersWrapper.style.display = 'block';
        } else {
          kindFiltersWrapper.style.display = 'none';
          if (currentKindFilter !== 'all') {
            currentKindFilter = 'all';
            filterState.catalog.kind = 'all';
            saveFilterState(filterState);
            render();
          }
        }
      }
    }
    
    if (sort) {
      sort.value = currentSort;
      sort.onchange = () => {
        currentSort = sort.value;
        filterState.catalog.sort = currentSort;
        saveFilterState(filterState);
        render();
      };
    }
    
    if (searchInput) {
      searchInput.value = searchQuery;
      searchInput.oninput = debounce((e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        filterState.catalog.search = searchQuery;
        saveFilterState(filterState);
        render();
      }, CONFIG.DEBOUNCE_DELAY);
    }
    
    document.querySelectorAll("[data-filter]").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        filterState.catalog.manufacturer = currentFilter;
        saveFilterState(filterState);
        updateKindFiltersVisibility();
        render();
      };
    });
    
    async function render() {
      let list = [...data];
      const currentLang = localStorage.getItem("lang") || "ru";
      
      if (currentFilter !== "all") {
        list = list.filter(s => s.manufacturer === currentFilter);
      }
      
      if (currentKindFilter !== "all" && currentFilter === 'kinder') {
        if (currentKindFilter === '') {
          list = list.filter(s => !s.kind || s.kind === '');
        } else {
          list = list.filter(s => s.kind === currentKindFilter);
        }
      }
      
      // ===== ПОИСК (С КОДАМИ И НАЗВАНИЯМИ) =====
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        
        // Загружаем поисковый индекс (один раз)
        if (!window.searchIndex) {
          window.searchIndex = await loadSearch();
        }
        
        const matchedSeriesIds = new Set();
        
        // 1. Поиск по сериям
        list.forEach(s => {
          const nameRu = (s.name || '').toLowerCase();
          const nameEn = (s.name_en || s.name || '').toLowerCase();
          const yearStr = (s.year || '').toString();
          if (nameRu.includes(query) || nameEn.includes(query) || yearStr.includes(query)) {
            matchedSeriesIds.add(s.id);
          }
        });
        
        // 2. Поиск по фигуркам
        window.searchIndex.forEach(item => {
          const code = (item.code || '').toLowerCase();
          const nameRu = (item.name || '').toLowerCase();
          const nameEn = (item.name_en || '').toLowerCase();
          
          if (code.includes(query) || nameRu.includes(query) || nameEn.includes(query)) {
            matchedSeriesIds.add(item.seriesId);
          }
        });
        
        list = list.filter(s => matchedSeriesIds.has(s.id));
      }
      
      // ===== СОРТИРОВКА =====
      if (currentSort === "year") {
        list.sort((a, b) => a.year - b.year);
      } else if (currentSort === "year-desc") {
        list.sort((a, b) => b.year - a.year);
      } else if (currentSort === "name") {
        list.sort((a, b) => {
          const nameA = (currentLang === 'en' && a.name_en ? a.name_en : a.name).toLowerCase();
          const nameB = (currentLang === 'en' && b.name_en ? b.name_en : b.name).toLowerCase();
          return nameA.localeCompare(nameB);
        });
      } else if (currentSort === "name-desc") {
        list.sort((a, b) => {
          const nameA = (currentLang === 'en' && a.name_en ? a.name_en : a.name).toLowerCase();
          const nameB = (currentLang === 'en' && b.name_en ? b.name_en : b.name).toLowerCase();
          return nameB.localeCompare(nameA);
        });
      }
      
      grid.innerHTML = '';
      
      if (list.length === 0) {
        grid.innerHTML = '<p class="empty-message" data-i18n="nothing_found">Ничего не найдено</p>';
        applyTranslations();
        return;
      }
      
      for (const s of list) {
        const card = document.createElement('a');
        card.href = `series.html?id=${s.id}`;
        card.className = 'catalog-card';
        
        const name = currentLang === 'en' && s.name_en ? s.name_en : s.name;
        const manufacturerName = manufacturers[s.manufacturer]?.[currentLang] || s.manufacturer;
        
        const imageUrl = s.cover ? `${BASE_URL}/${s.cover}` : 'images/placeholder.svg';
        
        card.innerHTML = `
          <img src="${imageUrl}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.src='images/placeholder.svg'">
          <div class="card-body">
            <h3>${escapeHtml(name)}</h3>
            <div class="year">${escapeHtml(s.year)} · ${escapeHtml(manufacturerName)}</div>
          </div>
        `;
        
        grid.appendChild(card);
        
        // ===== БЕЙДЖИ СОВПАДЕНИЙ ПО ФИГУРКАМ =====
        if (searchQuery && window.searchIndex) {
          const query = searchQuery.toLowerCase().trim();
          const matchedFigures = window.searchIndex.filter(item => 
            item.seriesId === s.id && (
              (item.code || '').toLowerCase().includes(query) ||
              (item.name || '').toLowerCase().includes(query) ||
              (item.name_en || '').toLowerCase().includes(query)
            )
          );
          
          if (matchedFigures.length > 0) {
            const badgesHtml = matchedFigures.slice(0, 3).map(f => `
              <span class="search-match-badge">
                ${f.code ? `<b>${escapeHtml(f.code)}</b>` : ''}
                ${escapeHtml(f.name || f.name_en || '')}
              </span>
            `).join('');
            
            const moreHtml = matchedFigures.length > 3 
              ? `<span class="search-match-more">+${matchedFigures.length - 3}</span>` 
              : '';
            
            card.querySelector('.card-body').insertAdjacentHTML('beforeend', `
              <div class="search-matches">${badgesHtml}${moreHtml}</div>
            `);
          }
        }
      }
      applyTranslations();
    }saveFilterState(filterState);
    
    updateKindFiltersVisibility();
    render();
  } catch(error) {
    console.error('Ошибка инициализации каталога:', error);
    showError('Не удалось загрузить каталог');
    grid.innerHTML = `<p class="error-message">❌ Ошибка загрузки каталога. Попробуйте обновить страницу.</p>`;
  }
}


// ===== MY COLLECTION (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ) =====
async function initMyCollection() {
  const grid = document.getElementById("collectionGrid");
  if (!grid) return;
  
  try {
    await loadManufacturers();
    const manufacturers = await loadManufacturers();
    
    // ===== ЗАГРУЗКА ЧЕРЕЗ COLLECTION.JSON =====
    const allSeries = await loadCollection();
    
    const searchInput = document.getElementById("searchInput");
    let searchQuery = filterState.mycollection.search || '';
    let currentFilter = filterState.mycollection.manufacturer || 'all';
    let currentKindFilter = filterState.mycollection.kind || 'all';
    
    const filterGroup = document.querySelector('.filter-group');
    if (filterGroup) {
      const uniqueManufacturers = [...new Set(allSeries.map(s => s.manufacturer))];
      const sortedManufacturers = manufacturerOrder.filter(m => uniqueManufacturers.includes(m));
      const currentLang = localStorage.getItem("lang") || "ru";
      
      filterGroup.innerHTML = '<button class="filter-btn" data-filter="all" data-i18n="all">Все</button>';
      sortedManufacturers.forEach(m => {
        const displayName = manufacturers[m]?.[currentLang] || m;
        filterGroup.innerHTML += `<button class="filter-btn" data-filter="${m}">${displayName}</button>`;
      });
      
      const activeBtn = document.querySelector(`.filter-btn[data-filter="${currentFilter}"]`);
      if (activeBtn) activeBtn.classList.add('active');
      else document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');
      
      document.querySelectorAll("[data-filter]").forEach(btn => {
        btn.onclick = () => {
          document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          currentFilter = btn.dataset.filter;
          filterState.mycollection.manufacturer = currentFilter;
          saveFilterState(filterState);
          render();
        };
      });
    }
    
    const kindFiltersWrapper = document.getElementById('kindFiltersWrapper');
    if (kindFiltersWrapper) {
      initKindFilters('kindFilters', currentKindFilter, (newKind) => {
        currentKindFilter = newKind;
        filterState.mycollection.kind = currentKindFilter;
        saveFilterState(filterState);
        render();
      });
    }
    
    function updateKindFiltersVisibility() {
      if (kindFiltersWrapper) {
        if (currentFilter === 'kinder') {
          kindFiltersWrapper.style.display = 'block';
        } else {
          kindFiltersWrapper.style.display = 'none';
          if (currentKindFilter !== 'all') {
            currentKindFilter = 'all';
            filterState.mycollection.kind = 'all';
            saveFilterState(filterState);
            render();
          }
        }
      }
    }
    
    if (searchInput) {
      searchInput.value = searchQuery;
      searchInput.oninput = debounce((e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        filterState.mycollection.search = searchQuery;
        saveFilterState(filterState);
        render();
      }, CONFIG.DEBOUNCE_DELAY);
    }
    
    function render() {
      let list = [...allSeries];
      const currentLang = localStorage.getItem("lang") || "ru";
      
      if (currentFilter !== "all") {
        list = list.filter(s => s.manufacturer === currentFilter);
      }
      if (currentKindFilter !== "all" && currentFilter === 'kinder') {
        if (currentKindFilter === '') {
          list = list.filter(s => !s.kind || s.kind === '');
        } else {
          list = list.filter(s => s.kind === currentKindFilter);
        }
      }
      if (searchQuery) {
        list = list.filter(s => {
          const nameRu = (s.name || '').toLowerCase();
          const nameEn = (s.name_en || s.name || '').toLowerCase();
          return nameRu.includes(searchQuery) || nameEn.includes(searchQuery);
        });
      }
      
      const totalOwnedFiguresSpan = document.getElementById('totalOwnedFigures');
      const totalOwnedSeriesSpan = document.getElementById('totalOwnedSeries');
      if (totalOwnedFiguresSpan) {
        const totalFigures = list.reduce((sum, s) => sum + (s.totalOwned || 0), 0);
        totalOwnedFiguresSpan.textContent = totalFigures;
      }
      if (totalOwnedSeriesSpan) {
        totalOwnedSeriesSpan.textContent = list.length;
      }
      
      grid.innerHTML = "";
      if (list.length === 0) {
        grid.innerHTML = '<p class="empty-message" data-i18n="empty_collection">В коллекции пока нет серий</p>';
        applyTranslations();
        return;
      }
      
      list.forEach(s => {
        const a = document.createElement("a");
        a.href = `series.html?id=${s.id}#collection`;
        a.className = "catalog-card collection-card";
        const name = currentLang === 'en' && s.name_en ? s.name_en : s.name;
        const manufacturerName = manufacturers[s.manufacturer]?.[currentLang] || s.manufacturer;
        
        const collectionText = currentLang === 'ru' 
          ? `В коллекции: ${s.totalOwned} шт. из ${s.totalItems}` 
          : `In collection: ${s.totalOwned} pcs of ${s.totalItems}`;
        
        const imageUrl = s.cover ? `${BASE_URL}/${s.cover}` : 'images/placeholder.svg';
        
        a.innerHTML = `
          <img src="${imageUrl}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.src='images/placeholder.svg'">
          <div class="card-body">
            <h3>${escapeHtml(name)}</h3>
            <div class="year">${escapeHtml(s.year)} · ${escapeHtml(manufacturerName)}</div>
            <div class="collection-stats">${escapeHtml(collectionText)}</div>
            ${s.forSaleCount > 0 ? `<div class="forsale-count">💰 ${currentLang === 'ru' ? 'Есть в продаже' : 'For sale'}</div>` : ''}
          </div>
        `;
        grid.appendChild(a);
      });
      applyTranslations();
    }
    
    updateKindFiltersVisibility();
    render();
  } catch(error) {
    console.error('Ошибка инициализации коллекции:', error);
    showError('Не удалось загрузить коллекцию');
    grid.innerHTML = `<p class="error-message">❌ Ошибка загрузки коллекции. Попробуйте обновить страницу.</p>`;
  }
}

// ===== VIDEOS PAGE (ВИДЕОАРХИВ) =====
async function initVideos() {
  const grid = document.getElementById("videosGrid");
  if (!grid) return;
  
  try {
    await loadManufacturers();
    const manufacturers = await loadManufacturers();
    const currentLang = localStorage.getItem("lang") || "ru";
    
    // ===== ЗАГРУЗКА ЧЕРЕЗ VIDEOS.JSON =====
    const allVideos = await loadVideos();
    
    // ===== СОСТОЯНИЕ =====
    let currentHost = localStorage.getItem('videosHost') || 'youtube';
    let currentSearch = filterState.videos?.search || '';
    let currentPage = 1;
    const ITEMS_PER_PAGE = 12;
    
    // ===== ФИЛЬТРЫ ХОСТИНГОВ =====
    const hosts = [
      { value: 'youtube', label: 'YouTube', icon: '▶️' },
      { value: 'vk', label: 'VK', icon: '🔵' },
      { value: 'tiktok', label: 'TikTok', icon: '🎵' },
      { value: 'instagram', label: 'Instagram', icon: '📸' }
    ];
    
    const filterGroup = document.getElementById('videosFilterGroup');
    if (filterGroup) {
      filterGroup.innerHTML = hosts.map(h => `
        <button class="filter-btn ${currentHost === h.value ? 'active' : ''}" data-host="${h.value}">
          ${h.icon} ${h.label}
        </button>
      `).join('');
      
      filterGroup.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
          filterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentHost = btn.dataset.host;
          localStorage.setItem('videosHost', currentHost);
          currentPage = 1;
          render();
        };
      });
    }
    
    // ===== ПОИСК =====
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = currentSearch;
      searchInput.oninput = debounce((e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        if (!filterState.videos) filterState.videos = {};
        filterState.videos.search = currentSearch;
        saveFilterState(filterState);
        currentPage = 1;
        render();
      }, CONFIG.DEBOUNCE_DELAY);
    }
    
    // ===== ИЗВЛЕЧЕНИЕ ID ИЗ URL =====
    function extractYouTubeId(url) {
      if (!url) return null;
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
      ];
      for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
      }
      return null;
    }
    
    function extractVKId(url) {
      if (!url) return null;
      const match1 = url.match(/vk\.com\/(?:clip|video)(-?\d+)_(\d+)/);
      if (match1) return { oid: match1[1], id: match1[2] };
      const match2 = url.match(/[?&]oid=(-?\d+).*[?&]id=(\d+)/);
      if (match2) return { oid: match2[1], id: match2[2] };
      return null;
    }
    
    function extractTikTokId(url) {
      if (!url) return null;
      const match = url.match(/\/video\/(\d+)/);
      return match ? match[1] : null;
    }
    
    // ===== СОЗДАНИЕ ПЛЕЕРА =====
    function createPlayer(video) {
      const host = video.host;
      const url = video.url;
      
      if (host === 'youtube') {
        const videoId = extractYouTubeId(url);
        if (videoId) {
          return `
            <div class="video-embed">
              <iframe 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy">
              </iframe>
            </div>
          `;
        }
      }
      
      if (host === 'vk') {
        const vkData = extractVKId(url);
        if (vkData) {
          return `
            <div class="video-embed">
              <iframe 
                src="https://vk.com/video_ext.php?oid=${vkData.oid}&id=${vkData.id}&hd=2"
                frameborder="0" 
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowfullscreen
                loading="lazy">
              </iframe>
            </div>
          `;
        }
      }
      
      if (host === 'tiktok') {
        const videoId = extractTikTokId(url);
        if (videoId) {
          return `
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="video-link tiktok">
              <span class="video-link-icon">🎵</span>
              <span class="video-link-text">
                <span class="video-link-name">TikTok</span>
                <span class="video-link-hint">${currentLang === 'ru' ? 'Открыть видео' : 'Open video'}</span>
              </span>
            </a>
          `;
        }
      }
      
      if (host === 'instagram') {
        return `
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="video-link instagram">
            <span class="video-link-icon">📸</span>
            <span class="video-link-text">
              <span class="video-link-name">Instagram</span>
              <span class="video-link-hint">${currentLang === 'ru' ? 'Открыть видео' : 'Open video'}</span>
            </span>
          </a>
        `;
      }
      
      // Фолбэк — ссылка
      return `
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="video-link">
          <span class="video-link-icon">🔗</span>
          <span class="video-link-text">
            <span class="video-link-name">${escapeHtml(host)}</span>
            <span class="video-link-hint">${currentLang === 'ru' ? 'Открыть' : 'Open'}</span>
          </span>
        </a>
      `;
    }
    
    // ===== ПАГИНАЦИЯ =====
    function renderPagination(totalItems, currentPage, itemsPerPage) {
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (totalPages <= 1) return null;
      
      const container = document.createElement('div');
      container.className = 'pagination';
      
      const prevBtn = document.createElement('button');
      prevBtn.className = 'page-btn';
      prevBtn.textContent = '‹';
      prevBtn.disabled = currentPage <= 1;
      prevBtn.onclick = () => {
        currentPage = Math.max(1, currentPage - 1);
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      container.appendChild(prevBtn);
      
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }
      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = () => {
          currentPage = i;
          render();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        container.appendChild(btn);
      }
      
      const nextBtn = document.createElement('button');
      nextBtn.className = 'page-btn';
      nextBtn.textContent = '›';
      nextBtn.disabled = currentPage >= totalPages;
      nextBtn.onclick = () => {
        currentPage = Math.min(totalPages, currentPage + 1);
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      container.appendChild(nextBtn);
      
      return container;
    }
    
    // ===== СОЗДАНИЕ КАРТОЧКИ ВИДЕО =====
    function createVideoCard(video) {
      const card = document.createElement('div');
      card.className = 'video-card';
      
      const seriesName = currentLang === 'en' && video.seriesName_en 
        ? video.seriesName_en 
        : video.seriesName;
      
      const manufacturerName = manufacturers[video.manufacturer]?.[currentLang] || video.manufacturer;
      
      card.innerHTML = `
        <div class="video-card-player">
          ${createPlayer(video)}
        </div>
        <a href="series.html?id=${escapeHtml(video.seriesId)}" class="video-card-series">
          <div class="video-card-series-icon">📚</div>
          <div class="video-card-series-info">
            <div class="video-card-series-name">${escapeHtml(seriesName)}</div>
            <div class="video-card-series-meta">${escapeHtml(video.year)} · ${escapeHtml(manufacturerName)}</div>
          </div>
        </a>
      `;
      
      return card;
    }
    
    // ===== РЕНДЕР =====
    function render() {
      // Фильтрация
      let filtered = allVideos.filter(v => v.host === currentHost);
      
      if (currentSearch) {
        const query = currentSearch.toLowerCase();
        filtered = filtered.filter(v => 
          (v.seriesName || '').toLowerCase().includes(query) ||
          (v.seriesName_en || '').toLowerCase().includes(query)
        );
      }
      
      // Счётчик
      const counter = document.getElementById('videosCounter');
      if (counter) {
        const label = currentLang === 'ru' ? 'Найдено видео' : 'Videos found';
        counter.textContent = `${label}: ${filtered.length}`;
      }
      
      // Пустой результат
      grid.innerHTML = '';
      if (filtered.length === 0) {
        const emptyMsg = currentLang === 'ru' 
          ? 'Видео не найдены' 
          : 'No videos found';
        grid.innerHTML = `<p class="empty-message">${emptyMsg}</p>`;
        return;
      }
      
      // Пагинация
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const paginated = filtered.slice(start, end);
      
      paginated.forEach(video => grid.appendChild(createVideoCard(video)));
      
      // Пагинация
      const pag = renderPagination(filtered.length, currentPage, ITEMS_PER_PAGE);
      if (pag) grid.appendChild(pag);
    }
    
    render();
  } catch(error) {
    console.error('Ошибка инициализации видеоархива:', error);
    showError('Не удалось загрузить видеоархив');
    grid.innerHTML = `<p class="error-message">❌ Ошибка загрузки. Попробуйте обновить страницу.</p>`;
  }
}

// ===== FOR SALE (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ) =====
async function initForSale() {
  const grid = document.getElementById("forsaleGrid");
  if (!grid) return;
  
  try {
    await loadManufacturers();
    const manufacturers = await loadManufacturers();
    let currentLang = localStorage.getItem("lang") || "ru";
    
    // ===== ЗАГРУЗКА ЧЕРЕЗ FORSALE.JSON =====
    const allItems = await loadForsale();
    
    // Разбиваем по типам
    let figureItems = [], extraItems = [], insertItems = [], variantItems = [], fullSeriesItems = [];
    
    allItems.forEach(item => {
      const mapped = {
        id: item.id,
        seriesId: item.seriesId,
        name: (currentLang === 'en' && item.name_en) ? item.name_en : item.name,
        image: item.image,
        avito: item.avito,
        seriesName: (currentLang === 'en' && item.seriesName_en) ? item.seriesName_en : item.seriesName,
        seriesYear: item.seriesYear,
        manufacturer: item.manufacturer,
        price: (currentLang === 'en' && item.price_en) ? item.price_en : (item.price || ''),
        condition: (currentLang === 'en' ? item.condition_en : item.condition) || '',
        type: item.type,
        code: item.code || '',
        date_added: item.date_added || ''
      };
      
      if (item.type === 'full') fullSeriesItems.push(mapped);
      else if (item.type === 'figure') figureItems.push(mapped);
      else if (item.type === 'variant') variantItems.push(mapped);
      else if (item.type === 'extra') extraItems.push(mapped);
      else if (item.type === 'insert') insertItems.push(mapped);
    });
    
    let currentManufacturer = filterState.forsale.manufacturer || 'all';
    let currentSearch = filterState.forsale.search || '';
    let currentSort = filterState.forsale.sort || 'date-desc';
    
    let figuresPage = 1, variantsPage = 1, extrasPage = 1, insertsPage = 1, seriesPage = 1;
    
    const searchInput = document.getElementById("searchInput");
    const sortSelect = document.getElementById("sortSelect");
    
    if (searchInput) {
      searchInput.value = currentSearch;
      searchInput.oninput = debounce((e) => {
        currentSearch = e.target.value.toLowerCase();
        filterState.forsale.search = currentSearch;
        saveFilterState(filterState);
        figuresPage = 1; variantsPage = 1; extrasPage = 1; insertsPage = 1; seriesPage = 1;
        renderItems();
      }, CONFIG.DEBOUNCE_DELAY);
    }
    
    if (sortSelect) {
      sortSelect.value = currentSort;
      sortSelect.onchange = () => {
        currentSort = sortSelect.value;
        filterState.forsale.sort = currentSort;
        saveFilterState(filterState);
        figuresPage = 1; variantsPage = 1; extrasPage = 1; insertsPage = 1; seriesPage = 1;
        renderItems();
      };
    }
    
    function applyFiltersAndSort(items) {
      let filtered = [...items];
      if (currentManufacturer !== 'all') {
        filtered = filtered.filter(i => i.manufacturer === currentManufacturer);
      }
      if (currentSearch) {
        const query = currentSearch.toLowerCase();
        filtered = filtered.filter(i => 
          i.name.toLowerCase().includes(query) || 
          i.seriesName.toLowerCase().includes(query) ||
          (i.code && i.code.toLowerCase().includes(query))
        );
      }
      filtered.sort((a, b) => {
        const dateA = a.date_added ? new Date(a.date_added) : new Date(0);
        const dateB = b.date_added ? new Date(b.date_added) : new Date(0);
        return dateB - dateA;
      });
// Сортировка
if (currentSort === 'date-desc') {
  filtered.sort((a, b) => {
    const dateA = a.date_added ? new Date(a.date_added).getTime() : 0;
    const dateB = b.date_added ? new Date(b.date_added).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;
    return (a.name || '').localeCompare(b.name || '');
  });
} else if (currentSort === 'date-asc') {
  filtered.sort((a, b) => {
    const dateA = a.date_added ? new Date(a.date_added).getTime() : 0;
    const dateB = b.date_added ? new Date(b.date_added).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    return (a.name || '').localeCompare(b.name || '');
  });
} else if (currentSort === 'year') {
  filtered.sort((a, b) => a.seriesYear - b.seriesYear);
} else if (currentSort === 'year-desc') {
  filtered.sort((a, b) => b.seriesYear - a.seriesYear);
} else if (currentSort === 'name') {
  filtered.sort((a, b) => a.name.localeCompare(b.name));
} else if (currentSort === 'name-desc') {
  filtered.sort((a, b) => b.name.localeCompare(a.name));
}
      return filtered;
    }
    
    function getFilteredFigures() { return applyFiltersAndSort(figureItems); }
    function getFilteredVariants() { return applyFiltersAndSort(variantItems); }
    function getFilteredExtras() { return applyFiltersAndSort(extraItems); }
    function getFilteredInserts() { return applyFiltersAndSort(insertItems); }
    function getFilteredSeries() { return applyFiltersAndSort(fullSeriesItems); }
    
    function getRecentItems() {
      let all = [...figureItems, ...variantItems, ...extraItems, ...insertItems, ...fullSeriesItems];
      if (currentSearch) {
        const query = currentSearch.toLowerCase();
        all = all.filter(i => 
          i.name.toLowerCase().includes(query) || 
          i.seriesName.toLowerCase().includes(query) ||
          (i.code && i.code.toLowerCase().includes(query))
        );
      }
      all.sort((a, b) => {
        const dateA = a.date_added ? new Date(a.date_added) : new Date(0);
        const dateB = b.date_added ? new Date(b.date_added) : new Date(0);
        return dateB - dateA;
      });
      return all.slice(0, CONFIG.RECENT_COUNT);
    }
    
    function renderPagination(totalItems, currentPage, itemsPerPage, type) {
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (totalPages <= 1) return null;
      
      const container = document.createElement('div');
      container.className = 'pagination';
      
      const prevBtn = document.createElement('button');
      prevBtn.className = 'page-btn';
      prevBtn.textContent = '‹';
      prevBtn.disabled = currentPage <= 1;
      prevBtn.onclick = () => {
        const pageMap = {
          'figures': () => figuresPage = Math.max(1, figuresPage - 1),
          'variants': () => variantsPage = Math.max(1, variantsPage - 1),
          'extras': () => extrasPage = Math.max(1, extrasPage - 1),
          'inserts': () => insertsPage = Math.max(1, insertsPage - 1),
          'series': () => seriesPage = Math.max(1, seriesPage - 1)
        };
        if (pageMap[type]) pageMap[type]();
        renderItems();
      };
      container.appendChild(prevBtn);
      
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }
      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = () => {
          const pageMap = {
            'figures': () => figuresPage = i,
            'variants': () => variantsPage = i,
            'extras': () => extrasPage = i,
            'inserts': () => insertsPage = i,
            'series': () => seriesPage = i
          };
          if (pageMap[type]) pageMap[type]();
          renderItems();
        };
        container.appendChild(btn);
      }
      
      const nextBtn = document.createElement('button');
      nextBtn.className = 'page-btn';
      nextBtn.textContent = '›';
      nextBtn.disabled = currentPage >= totalPages;
      nextBtn.onclick = () => {
        const pageMap = {
          'figures': () => figuresPage = Math.min(totalPages, figuresPage + 1),
          'variants': () => variantsPage = Math.min(totalPages, variantsPage + 1),
          'extras': () => extrasPage = Math.min(totalPages, extrasPage + 1),
          'inserts': () => insertsPage = Math.min(totalPages, insertsPage + 1),
          'series': () => seriesPage = Math.min(totalPages, seriesPage + 1)
        };
        if (pageMap[type]) pageMap[type]();
        renderItems();
      };
      container.appendChild(nextBtn);
      
      return container;
    }
    
    function createItemCard(item) {
      const div = document.createElement('div');
      div.className = 'forsale-item-card';
      if (item.type === 'full') {
        div.classList.add('full-series-card');
      }
      
      const manufacturerName = manufacturers[item.manufacturer]?.[currentLang] || item.manufacturer;
      
      const typeLabels = {
        'figure': currentLang === 'ru' ? 'Фигурка' : 'Figure',
        'variant': currentLang === 'ru' ? 'Вариант' : 'Variant',
        'extra': currentLang === 'ru' ? 'Доп' : 'Extra',
        'insert': currentLang === 'ru' ? 'Вкладыш' : 'Insert',
        'full': currentLang === 'ru' ? 'Полная серия' : 'Full series'
      };
      
      const imageUrl = item.image ? `${BASE_URL}/${item.image}` : 'images/placeholder.svg';
      
      const linkUrl = item.type === 'full' ? `lot.html?id=${item.seriesId}` : `figure.html?series=${item.seriesId}&fig=${item.id}`;
      
      div.innerHTML = `
        <a href="${linkUrl}">
          <img src="${imageUrl}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.src='images/placeholder.svg'">
        </a>
        <div class="forsale-item-body">
          <div class="forsale-item-header">
            <span class="forsale-item-name">${escapeHtml(item.name)}</span>
            ${item.price ? `<span class="forsale-item-price">${escapeHtml(item.price)}</span>` : ''}
          </div>
          <div class="forsale-item-tags">
            <span class="tag tag-primary">${escapeHtml(typeLabels[item.type] || item.type)}</span>
            ${item.code ? `<span class="tag tag-code">${escapeHtml(item.code)}</span>` : ''}
            ${item.condition ? `<span class="tag tag-condition">⚠️ ${escapeHtml(item.condition)}</span>` : ''}
          </div>
          <div class="forsale-item-series">
            <a href="series.html?id=${item.seriesId}">${escapeHtml(item.seriesName)}</a>
            <span style="margin:0 4px;">·</span>
            ${escapeHtml(item.seriesYear)}
            <div class="forsale-item-manufacturer">
              <a href="forsale.html?manufacturer=${item.manufacturer}">${escapeHtml(manufacturerName)}</a>
            </div>
          </div>
        </div>
      `;
      
      return div;
    }
    
    // ===== ФИЛЬТРЫ ПРОИЗВОДИТЕЛЕЙ =====
    const filterGroup = document.getElementById('forsaleFilterGroup') || document.querySelector('.filter-group');
    if (filterGroup) {
      const uniqueMans = [...new Set(allItems.map(i => i.manufacturer))];
      const sortedMans = manufacturerOrder.filter(m => uniqueMans.includes(m));
      
      filterGroup.innerHTML = '';
      
      const allBtn = document.createElement('button');
      allBtn.className = 'filter-btn' + (currentManufacturer === 'all' ? ' active' : '');
      allBtn.dataset.filter = 'all';
      allBtn.textContent = currentLang === 'ru' ? 'Все' : 'All';
      filterGroup.appendChild(allBtn);
      
      sortedMans.forEach(m => {
        const displayName = manufacturers[m]?.[currentLang] || m;
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (currentManufacturer === m ? ' active' : '');
        btn.dataset.filter = m;
        btn.textContent = displayName;
        filterGroup.appendChild(btn);
      });
      
      filterGroup.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
          filterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentManufacturer = btn.dataset.filter;
          filterState.forsale.manufacturer = currentManufacturer;
          saveFilterState(filterState);
          figuresPage = 1; variantsPage = 1; extrasPage = 1; insertsPage = 1; seriesPage = 1;
          renderItems();
        };
      });
    }
    
    function renderItems() {
      const figures = getFilteredFigures();
      const variants = getFilteredVariants();
      const extras = getFilteredExtras();
      const inserts = getFilteredInserts();
      const series = getFilteredSeries();
      const recent = getRecentItems();
      
      const totalFigures = document.getElementById('totalFiguresForSale');
      const totalSeries = document.getElementById('totalSeriesForSale');
      if (totalFigures) totalFigures.textContent = figures.length + variants.length + extras.length + inserts.length;
      if (totalSeries) totalSeries.textContent = series.length;
      
      grid.innerHTML = '';
      
      if (figures.length > 0) {
        const totalPages = Math.ceil(figures.length / CONFIG.ITEMS_PER_PAGE);
        if (figuresPage > totalPages) figuresPage = totalPages || 1;
        const start = (figuresPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const end = start + CONFIG.ITEMS_PER_PAGE;
        const paginated = figures.slice(start, end);
        
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        divider.innerHTML = `📦 ${currentLang === 'ru' ? 'Фигурки' : 'Figures'} <span class="badge">${figures.length}</span>`;
        grid.appendChild(divider);
        paginated.forEach(item => grid.appendChild(createItemCard(item)));
        if (totalPages > 1) {
          const pag = renderPagination(figures.length, figuresPage, CONFIG.ITEMS_PER_PAGE, 'figures');
          if (pag) grid.appendChild(pag);
        }
      }
      
      if (variants.length > 0) {
        const totalPages = Math.ceil(variants.length / CONFIG.ITEMS_PER_PAGE);
        if (variantsPage > totalPages) variantsPage = totalPages || 1;
        const start = (variantsPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const end = start + CONFIG.ITEMS_PER_PAGE;
        const paginated = variants.slice(start, end);
        
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        divider.innerHTML = `🎲 ${currentLang === 'ru' ? 'Варианты' : 'Variants'} <span class="badge">${variants.length}</span>`;
        grid.appendChild(divider);
        paginated.forEach(item => grid.appendChild(createItemCard(item)));
        if (totalPages > 1) {
          const pag = renderPagination(variants.length, variantsPage, CONFIG.ITEMS_PER_PAGE, 'variants');
          if (pag) grid.appendChild(pag);
        }
      }
      
      if (extras.length > 0) {
        const totalPages = Math.ceil(extras.length / CONFIG.ITEMS_PER_PAGE);
        if (extrasPage > totalPages) extrasPage = totalPages || 1;
        const start = (extrasPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const end = start + CONFIG.ITEMS_PER_PAGE;
        const paginated = extras.slice(start, end);
        
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        divider.innerHTML = `🎁 ${currentLang === 'ru' ? 'Допы' : 'Extras'} <span class="badge">${extras.length}</span>`;
        grid.appendChild(divider);
        paginated.forEach(item => grid.appendChild(createItemCard(item)));
        if (totalPages > 1) {
          const pag = renderPagination(extras.length, extrasPage, CONFIG.ITEMS_PER_PAGE, 'extras');
          if (pag) grid.appendChild(pag);
        }
      }
      
      if (inserts.length > 0) {
        const totalPages = Math.ceil(inserts.length / CONFIG.ITEMS_PER_PAGE);
        if (insertsPage > totalPages) insertsPage = totalPages || 1;
        const start = (insertsPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const end = start + CONFIG.ITEMS_PER_PAGE;
        const paginated = inserts.slice(start, end);
        
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        divider.innerHTML = `📄 ${currentLang === 'ru' ? 'Вкладыши' : 'Inserts'} <span class="badge">${inserts.length}</span>`;
        grid.appendChild(divider);
        paginated.forEach(item => grid.appendChild(createItemCard(item)));
        if (totalPages > 1) {
          const pag = renderPagination(inserts.length, insertsPage, CONFIG.ITEMS_PER_PAGE, 'inserts');
          if (pag) grid.appendChild(pag);
        }
      }
      
      if (series.length > 0) {
        const totalPages = Math.ceil(series.length / CONFIG.ITEMS_PER_PAGE);
        if (seriesPage > totalPages) seriesPage = totalPages || 1;
        const start = (seriesPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const end = start + CONFIG.ITEMS_PER_PAGE;
        const paginated = series.slice(start, end);
        
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        divider.innerHTML = `📚 ${currentLang === 'ru' ? 'Полные серии' : 'Full series'} <span class="badge">${series.length}</span>`;
        grid.appendChild(divider);
        paginated.forEach(item => grid.appendChild(createItemCard(item)));
        if (totalPages > 1) {
          const pag = renderPagination(series.length, seriesPage, CONFIG.ITEMS_PER_PAGE, 'series');
          if (pag) grid.appendChild(pag);
        }
      }
      
      if (recent.length > 0) {
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        divider.innerHTML = `🆕 ${currentLang === 'ru' ? 'Недавно добавленное' : 'Recently added'}`;
        grid.appendChild(divider);
        recent.forEach(item => grid.appendChild(createItemCard(item)));
      }
      
      if (figures.length === 0 && variants.length === 0 && extras.length === 0 && inserts.length === 0 && series.length === 0 && recent.length === 0) {
        grid.innerHTML = '<p class="empty-message">' + (currentLang === 'ru' ? 'Нет товаров в продаже' : 'No items for sale') + '</p>';
      }
    }
    
    renderItems();
  } catch(error) {
    console.error('Ошибка инициализации for sale:', error);
    showError('Не удалось загрузить товары');
    grid.innerHTML = `<p class="error-message">❌ Ошибка загрузки товаров. Попробуйте обновить страницу.</p>`;
  }
}

// ===== СТРАНИЦА ЛОТА =====
async function initLot() {
  const container = document.getElementById("lotContainer");
  if (!container) return;

  const urlParams = new URLSearchParams(location.search);
  const seriesId = urlParams.get('id');

  if (!seriesId) {
    container.innerHTML = '<p class="error-message">❌ Лот не найден</p>';
    return;
  }

  try {
    const series = await loadSeriesById(seriesId);
    if (!series || series.visible === false) {
      container.innerHTML = '<p class="error-message">❌ Серия не найдена</p>';
      return;
    }

    if (!series.fullSeriesForSale) {
      container.innerHTML = '<p class="error-message">❌ Эта серия не продаётся целиком</p>';
      return;
    }

    const currentLang = localStorage.getItem("lang") || "ru";
    const manufacturers = await loadManufacturers();

    const name = currentLang === 'en' && series.name_en ? series.name_en : series.name;
    
    const description = currentLang === 'en' 
        ? (series.fullSeriesDescription_en || series.description_en || series.description || "Описание отсутствует")
        : (series.fullSeriesDescription || series.description || "Описание отсутствует");
    
    const manufacturerName = manufacturers[series.manufacturer]?.[currentLang] || series.manufacturer;
    const coverUrl = series.cover ? `${BASE_URL}/${series.cover}` : 'images/placeholder.svg';

    const price = currentLang === 'en' 
        ? (series.fullSeriesPrice_en || series.fullSeriesPrice || 'Price not specified')
        : (series.fullSeriesPrice || 'Цена не указана');
    
    const avitoLink = series.fullSeriesAvito || '#';
    
    const condition = currentLang === 'en' 
        ? (series.fullSeriesCondition_en || 'Condition not specified')
        : (series.fullSeriesCondition || 'Состояние не указано');
    
    const dateAdded = series.fullSeriesDateAdded ? new Date(series.fullSeriesDateAdded).toLocaleDateString() : '';

    const allImages = [];
    if (series.figures) allImages.push(...series.figures.map(f => f.image ? `${BASE_URL}/${f.image}` : 'images/placeholder.svg'));
    if (series.extras) allImages.push(...series.extras.map(e => e.image ? `${BASE_URL}/${e.image}` : 'images/placeholder.svg'));
    if (series.variants) allImages.push(...series.variants.map(v => v.image ? `${BASE_URL}/${v.image}` : 'images/placeholder.svg'));
    if (series.inserts) allImages.push(...series.inserts.map(i => i.image ? `${BASE_URL}/${i.image}` : 'images/placeholder.svg'));
    if (series.other) allImages.push(...series.other.map(o => o.image ? `${BASE_URL}/${o.image}` : 'images/placeholder.svg'));
    window.seriesGalleryImages = allImages;

    let mainImageSrc = coverUrl;
    let mainImageIndex = 0;

    if (series.cover) {
        mainImageSrc = coverUrl;
        const coverFull = `${BASE_URL}/${series.cover}`;
        const found = allImages.findIndex(img => img === coverFull);
        if (found !== -1) {
            mainImageIndex = found;
        }
    }
    else if (allImages.length > 0) {
        mainImageSrc = allImages[0];
        mainImageIndex = 0;
    }

    container.innerHTML = `
      <div class="figure-container lot-page">
        <h1 class="figure-title">${escapeHtml(name)}</h1>
        <div class="figure-content">
          <div class="figure-image-wrapper">
            <img src="${escapeHtml(mainImageSrc)}" 
                 alt="${escapeHtml(name)}" 
                 class="figure-image" 
                 onclick="openLightbox(${mainImageIndex}, window.seriesGalleryImages || [])" 
                 onerror="this.src='images/placeholder.svg'">
            <div class="figure-type-badge">📦 ${currentLang === 'ru' ? 'Полная серия' : 'Full series'}</div>
          </div>
          <div class="figure-info">
            <div class="figure-meta">
              <div class="figure-meta-item">
                <span class="meta-icon">🏷️</span>
                <a href="forsale.html?manufacturer=${escapeHtml(series.manufacturer)}" class="meta-link">${escapeHtml(manufacturerName)}</a>
              </div>
              <div class="figure-meta-item">
                <span class="meta-icon">📅</span>
                <span>${escapeHtml(series.year)}</span>
              </div>
              <div class="figure-meta-item">
                <span class="meta-icon">📚</span>
                <a href="series.html?id=${escapeHtml(series.id)}" class="meta-link">${currentLang === 'ru' ? 'Страница серии' : 'Series page'}</a>
              </div>
              ${price ? `<div class="figure-meta-item">
                <span class="meta-icon">💰</span>
                <span style="font-weight:700;color:var(--primary)">${escapeHtml(price)}</span>
              </div>` : ''}
              ${dateAdded ? `<div class="figure-meta-item">
                <span class="meta-icon">📆</span>
                <span>${currentLang === 'ru' ? 'Добавлено' : 'Added'}: ${escapeHtml(dateAdded)}</span>
              </div>` : ''}
            </div>

            ${condition ? `
              <div class="figure-condition">
                <span class="condition-icon">⚠️</span>
                <span class="condition-text">${escapeHtml(condition)}</span>
              </div>
            ` : ''}

            ${description ? `
              <div class="figure-description">
                <p>${escapeHtml(description).replace(/&lt;br&gt;/g, '<br>')}</p>
              </div>
            ` : ''}

            <div class="figure-actions">
              ${avitoLink !== '#' ? `<a href="${escapeHtml(avitoLink)}" class="figure-btn figure-btn-buy" target="_blank" rel="noopener noreferrer">🛒 ${currentLang === 'ru' ? 'Купить' : 'Buy'}</a>` : ''}
              <button class="figure-btn figure-btn-qr" onclick="generateQRCode('series', '${escapeHtml(series.id)}', '${escapeHtml(name).replace(/'/g, "\\'")}', true)">📱 QR-код</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.classList.add('lot-page');
    }

    applyTranslations();
  } catch (error) {
    console.error('Ошибка загрузки лота:', error);
    container.innerHTML = '<p class="error-message">❌ Ошибка загрузки лота</p>';
  }
}

// ===== SERIES PAGE =====
async function initSeries() {
  const box = document.getElementById("seriesContainer");
  if (!box) return;
  
  const id = new URLSearchParams(location.search).get("id");
  
  if (!id) {
    box.innerHTML = `
      <div class="error-message">
        <p>❌ Серия не указана</p>
        <button class="back-button" onclick="history.back()" style="margin-top: 20px;">← Вернуться назад</button>
      </div>
    `;
    return;
  }
  
  try {
    const s = await loadSeriesById(id);
    
    if (!s || s.visible === false) {
      box.innerHTML = `
        <div class="error-message">
          <p>❌ Серия "${escapeHtml(id)}" не найдена или скрыта</p>
          <button class="back-button" onclick="history.back()" style="margin-top: 20px;">← Вернуться назад</button>
        </div>
      `;
      return;
    }
    
    const manufacturers = await loadManufacturers();
    const currentLang = localStorage.getItem("lang") || "ru";
    const name = currentLang === 'en' && s.name_en ? s.name_en : s.name;
    const description = currentLang === 'en' && s.description_en ? s.description_en : (s.description || "Описание отсутствует");
    const manufacturerName = manufacturers[s.manufacturer]?.[currentLang] || s.manufacturer;
    
    const coverUrl = s.cover ? `${BASE_URL}/${s.cover}` : 'images/placeholder.svg';
    
    const allImages = [];
    if (s.figures) allImages.push(...s.figures.map(f => f.image ? `${BASE_URL}/${f.image}` : 'images/placeholder.svg'));
    if (s.extras) allImages.push(...s.extras.map(e => e.image ? `${BASE_URL}/${e.image}` : 'images/placeholder.svg'));
    if (s.variants) allImages.push(...s.variants.map(v => v.image ? `${BASE_URL}/${v.image}` : 'images/placeholder.svg'));
    if (s.inserts) allImages.push(...s.inserts.map(i => i.image ? `${BASE_URL}/${i.image}` : 'images/placeholder.svg'));
    if (s.other) allImages.push(...s.other.map(o => o.image ? `${BASE_URL}/${o.image}` : 'images/placeholder.svg'));
    window.seriesGalleryImages = allImages;
    
    const hasCollage = (s.figures && s.figures.length > 0) || 
                       (s.extras && s.extras.length > 0) || 
                       (s.variants && s.variants.length > 0);
    
    function createItemsList(items, type, startIndex) {
      if (!items || items.length === 0) return '';
      
      const typeMap = {
        'figures': { title: 'figures', name: 'Фигурки', nameEn: 'Figures' },
        'extras': { title: 'extras', name: 'Допы', nameEn: 'Extras' },
        'variants': { title: 'variants', name: 'Варианты', nameEn: 'Variants' },
        'inserts': { title: 'inserts', name: 'Вкладыши', nameEn: 'Inserts' },
        'other': { title: 'other', name: 'Прочее', nameEn: 'Other' }
      };
      const info = typeMap[type] || typeMap.other;
      
      return `
        <h2 data-i18n="${info.title}">${currentLang === 'en' ? info.nameEn : info.name}</h2>
        <div class="figures-list">
          ${items.map((item, idx) => {
            const itemName = currentLang === 'en' && item.name_en ? item.name_en : item.name;
            const globalIndex = startIndex + idx;
            const itemCode = item.code || '';
            const safeName = escapeHtml(itemName);
            const safeId = escapeHtml(item.id || idx);
            const safeSeriesId = escapeHtml(s.id);
            const imageUrl = item.image ? `${BASE_URL}/${item.image}` : 'images/placeholder.svg';
            
            return `
              <div class="figure-item ${type !== 'inserts' && item.owned ? 'owned' : ''} ${item.forsale ? 'forsale' : ''}">
                <div class="figure-number">${idx + 1}</div>
                <img src="${imageUrl}" alt="${safeName}" loading="lazy" onerror="this.src='images/placeholder.svg'" onclick="openLightbox(${globalIndex}, window.seriesGalleryImages)" style="cursor:pointer">
                <div class="figure-info">
                  <div class="figure-name">
                    <div>${safeName}</div>
                    ${itemCode ? `<div class="figure-code">${escapeHtml(itemCode)}</div>` : ''}
                  </div>
                  <button class="qr-btn" onclick="generateQRCode('${safeId}', '${safeSeriesId}', '${safeName.replace(/'/g, "\\'")}')" title="QR-код">📱</button>
                </div>
                ${item.forsale && item.avito ? `<a href="${escapeHtml(item.avito)}" class="avito-link" target="_blank" rel="noopener noreferrer">🛒</a>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    
    let figuresStartIndex = 0;
    let extrasStartIndex = s.figures?.length || 0;
    let variantsStartIndex = (s.figures?.length || 0) + (s.extras?.length || 0);
    let insertsStartIndex = (s.figures?.length || 0) + (s.extras?.length || 0) + (s.variants?.length || 0);
    let otherStartIndex = (s.figures?.length || 0) + (s.extras?.length || 0) + (s.variants?.length || 0) + (s.inserts?.length || 0);
    
    box.innerHTML = `
      <div class="series-header">
        <img class="series-cover" src="${coverUrl}" alt="${escapeHtml(name)}" onerror="this.src='images/placeholder.svg'">
        <div>
          <h1>${escapeHtml(name)}</h1>
          <div class="series-meta">
            <a href="catalog.html?year=${escapeHtml(s.year)}" class="series-year-link">${escapeHtml(s.year)}</a> · 
            <a href="catalog.html?manufacturer=${escapeHtml(s.manufacturer)}" class="series-manufacturer-link" data-manufacturer="${escapeHtml(s.manufacturer)}">${escapeHtml(manufacturerName)}</a>
          </div>
          <p>${escapeHtml(description)}</p>
          <button class="qr-btn-series" onclick="generateQRCode('series', '${escapeHtml(s.id)}', '${escapeHtml(name).replace(/'/g, "\\'")}', true)" data-i18n="qr_code_series">📱 QR-код серии</button>
        </div>
      </div>
      ${createItemsList(s.figures, 'figures', figuresStartIndex)}
      ${createItemsList(s.extras, 'extras', extrasStartIndex)}
      ${createItemsList(s.variants, 'variants', variantsStartIndex)}
      ${createItemsList(s.inserts, 'inserts', insertsStartIndex)}
      ${createItemsList(s.other, 'other', otherStartIndex)}
      ${hasCollage ? `<div class="collage-section"><button class="collage-download-btn" onclick="downloadCollage('${escapeHtml(s.id)}', '${escapeHtml(name).replace(/'/g, "\\'")}')">💾 ${currentLang === 'ru' ? 'Скачать чек-лист (JPG)' : 'Download checklist (JPG)'}</button></div>` : ''}
      ${createVideosBlock(s.videos, currentLang)}
    `;
    
    setTimeout(() => {
      initZoomFeatures();
      applyTranslations();
    }, 100);
  } catch(error) {
    console.error('Ошибка загрузки серии:', error);
    showError('Не удалось загрузить серию');
    box.innerHTML = `
      <div class="error-message">
        <p>❌ Ошибка загрузки серии</p>
        <button class="back-button" onclick="history.back()" style="margin-top: 20px;">← Вернуться назад</button>
      </div>
    `;
  }
}

// ===== FIGURE PAGE =====
async function initFigure() {
  const container = document.getElementById("figureContainer");
  if (!container) return;
  
  const urlParams = new URLSearchParams(location.search);
  const seriesId = urlParams.get('series');
  const figureId = urlParams.get('fig');
  
  if (!seriesId || !figureId) {
    container.innerHTML = '<p class="error-message">Фигурка не найдена</p>';
    return;
  }
  
  try {
    const series = await loadSeriesById(seriesId);
    if (!series) {
      container.innerHTML = '<p class="error-message">Серия не найдена</p>';
      return;
    }
    
    let figure = null;
    let figureType = null;
    let figureNumber = null;
    
    const categories = ['figures', 'extras', 'variants', 'inserts', 'other'];
    for (const cat of categories) {
      if (!figure && series[cat]) {
        const idx = series[cat].findIndex(f => f.id === figureId);
        if (idx !== -1) {
          figure = series[cat][idx];
          figureType = cat;
          figureNumber = idx + 1;
          break;
        }
      }
    }
    
    if (!figure) {
      container.innerHTML = '<p class="error-message">Фигурка не найдена</p>';
      return;
    }
    
    const currentLang = localStorage.getItem("lang") || "ru";
    const manufacturers = await loadManufacturers();
    const manufacturerName = manufacturers[series.manufacturer]?.[currentLang] || series.manufacturer;
    const name = currentLang === 'en' && figure.name_en ? figure.name_en : figure.name;
    const seriesName = currentLang === 'en' && series.name_en ? series.name_en : series.name;
    
    const typeNames = {
      figures: { ru: 'Фигурка', en: 'Figure', icon: '🎎' },
      extras: { ru: 'Доп', en: 'Extra', icon: '🎁' },
      variants: { ru: 'Вариант', en: 'Variant', icon: '🎲' },
      inserts: { ru: 'Вкладыш', en: 'Insert', icon: '📄' },
      other: { ru: 'Прочее', en: 'Other', icon: '📦' }
    };
    
    const typeIcon = typeNames[figureType]?.icon || '🎎';
    const typeName = typeNames[figureType]?.[currentLang] || figureType;
    
    const allSeriesImages = [];
    if (series.figures) allSeriesImages.push(...series.figures.map(f => f.image ? `${BASE_URL}/${f.image}` : 'images/placeholder.svg'));
    if (series.extras) allSeriesImages.push(...series.extras.map(e => e.image ? `${BASE_URL}/${e.image}` : 'images/placeholder.svg'));
    if (series.variants) allSeriesImages.push(...series.variants.map(v => v.image ? `${BASE_URL}/${v.image}` : 'images/placeholder.svg'));
    if (series.inserts) allSeriesImages.push(...series.inserts.map(i => i.image ? `${BASE_URL}/${i.image}` : 'images/placeholder.svg'));
    if (series.other) allSeriesImages.push(...series.other.map(o => o.image ? `${BASE_URL}/${o.image}` : 'images/placeholder.svg'));
    
    let imageIndex = allSeriesImages.findIndex(img => img === (figure.image ? `${BASE_URL}/${figure.image}` : 'images/placeholder.svg'));
    if (imageIndex === -1) imageIndex = 0;
    window.seriesGalleryImages = allSeriesImages;
    
    let infoHtml = '';
    const condition = currentLang === 'en' ? figure.condition_en : figure.condition;
    const price = figure.price || '';
    const avitoLink = figure.avito || '#';
    const isForsale = figure.forsale === true;
    
    if (condition) {
      infoHtml += `
        <div class="figure-condition">
          <span class="condition-icon">⚠️</span>
          <span class="condition-text">${escapeHtml(condition)}</span>
        </div>
      `;
    }
    
    if (isForsale) {
      if (avitoLink && avitoLink !== '#') {
        infoHtml += `
          <div style="margin-top: 10px;">
            <a href="${escapeHtml(avitoLink)}" class="figure-btn figure-btn-buy" target="_blank" rel="noopener noreferrer">
              🛒 ${currentLang === 'ru' ? 'Купить' : 'Buy'}${price ? ' · ' + escapeHtml(price) : ''}
            </a>
          </div>
        `;
      } else {
        infoHtml += `
          <div style="margin-top: 10px;">
            <span class="figure-btn figure-btn-disabled">
              🛒 ${currentLang === 'ru' ? 'В продаже, ссылки нет' : 'For sale, no link'}
            </span>
          </div>
        `;
      }
    }
    
    const figureCode = figure.code || '';
    const imageUrl = figure.image ? `${BASE_URL}/${figure.image}` : 'images/placeholder.svg';
    
    container.innerHTML = `
      <div class="figure-container">
        <h1 class="figure-title">${escapeHtml(name)}</h1>
        <div class="figure-content">
          <div class="figure-image-wrapper">
            <img src="${imageUrl}" alt="${escapeHtml(name)}" class="figure-image" onclick="openLightbox(${imageIndex}, window.seriesGalleryImages || [])" onerror="this.src='images/placeholder.svg'">
            <div class="figure-type-badge">
              ${escapeHtml(typeIcon)} ${escapeHtml(typeName)}${figureNumber ? ' #' + figureNumber : ''}
            </div>
          </div>
          <div class="figure-info">
            <div class="figure-meta">
              <div class="figure-meta-item">
                <span class="meta-icon">📦</span>
                <a href="series.html?id=${escapeHtml(series.id)}" class="meta-link">${escapeHtml(seriesName)} (${escapeHtml(series.year)})</a>
              </div>
              <div class="figure-meta-item">
                <span class="meta-icon">🏭</span>
                <a href="forsale.html?manufacturer=${escapeHtml(series.manufacturer)}" class="meta-link">${escapeHtml(manufacturerName)}</a>
              </div>
              ${figureCode ? `
                <div class="figure-meta-item">
                  <span class="meta-icon">📇</span>
                  <span class="figure-code-value">${escapeHtml(figureCode)}</span>
                </div>
              ` : ''}
            </div>
            <div class="figure-actions">
              ${infoHtml}
            </div>
          </div>
        </div>
      </div>
    `;
    
    applyTranslations();
  } catch(error) {
    console.error('Ошибка загрузки фигурки:', error);
    showError('Не удалось загрузить фигурку');
    container.innerHTML = '<p class="error-message">❌ Ошибка загрузки фигурки</p>';
  }
}

// ===== COLLAGE FUNCTIONS =====
let isDownloadingChecklist = false;

function showLoadingToast(message) {
  let toast = document.getElementById('loadingToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'loadingToast';
    toast.style.cssText = `
      position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
      background:#4f46e5; color:white; padding:12px 24px; border-radius:30px;
      z-index:1001; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = 'block';
}

function hideLoadingToast() {
  const toast = document.getElementById('loadingToast');
  if (toast) toast.style.display = 'none';
}

async function generateCollage(seriesId, seriesName, figures, extras, variants, lang) {
    return new Promise(async (resolve, reject) => {
        try {
            const allItems = [...figures, ...extras, ...variants];
            
            const imageMap = new Map();
            for (const item of allItems) {
                const imageUrl = item.image ? `${BASE_URL}/${item.image}` : 'images/placeholder.svg';
                const img = await loadImage(imageUrl);
                imageMap.set(item.id || item.name, img || createEmptyImage());
            }
            
            // ===== ПРОВЕРКА ДЕФОЛТНЫХ НАЗВАНИЙ =====
            function isDefaultName(item, type) {
                if (!item.name) return true;
                const nameRu = item.name.trim();
                const nameEn = (item.name_en || '').trim();
                
                const defaultPatterns = {
                    figure: [/^Фигурка\s+\d+$/i, /^Figure\s+\d+$/i],
                    extra: [/^Доп\s+\d+$/i, /^Extra\s+\d+$/i],
                    variant: [/^Вариант\s+\d+$/i, /^Variant\s+\d+$/i],
                    insert: [/^Вкладыш\s+\d+$/i, /^Insert\s+\d+$/i],
                    other: [/^Прочее\s+\d+$/i, /^Other\s+\d+$/i]
                };
                
                const patterns = defaultPatterns[type] || defaultPatterns.figure;
                return patterns.some(p => p.test(nameRu) || p.test(nameEn));
            }
            
            function hasAnyCode(items) {
                return items.some(item => item.code && item.code.trim());
            }
            
            function hasAnyCustomName(items, type) {
                return items.some(item => !isDefaultName(item, type));
            }
            
            // ===== РАЗМЕРЫ =====
            const itemsPerRow = 6;
            const itemSize = 220;
            const itemGap = 20;
            const padding = 40;
            const headerHeight = 260;
            const footerHeight = 70;
            const qrSize = 220;
            const groupHeaderHeight = 55;
            const labelGap = 6;
            const innerGap = 8;
            
            const codeRowHeight = 44;
            const nameRowHeight = 56;
            
            const figureRows = Math.ceil(figures.length / itemsPerRow);
            const extraRows = Math.ceil(extras.length / itemsPerRow);
            const variantRows = Math.ceil(variants.length / itemsPerRow);
            
            const totalWidth = padding * 2 + itemsPerRow * itemSize + (itemsPerRow - 1) * itemGap;
            
            const showCodeFigures = hasAnyCode(figures);
            const showNameFigures = hasAnyCustomName(figures, 'figure');
            const showCodeExtras = hasAnyCode(extras);
            const showNameExtras = hasAnyCustomName(extras, 'extra');
            const showCodeVariants = hasAnyCode(variants);
            const showNameVariants = hasAnyCustomName(variants, 'variant');
            
            function getCellHeight(showCode, showName) {
                let h = itemSize;
                h += labelGap + codeRowHeight;
                if (showName) h += labelGap + nameRowHeight;
                return h;
            }
            
            const figureCellHeight = getCellHeight(showCodeFigures, showNameFigures);
            const extraCellHeight = getCellHeight(showCodeExtras, showNameExtras);
            const variantCellHeight = getCellHeight(showCodeVariants, showNameVariants);
            
            const visibleGroups = [];
            if (figures.length > 0) visibleGroups.push({ rows: figureRows, cellHeight: figureCellHeight });
            if (extras.length > 0) visibleGroups.push({ rows: extraRows, cellHeight: extraCellHeight });
            if (variants.length > 0) visibleGroups.push({ rows: variantRows, cellHeight: variantCellHeight });
            
            let totalHeight = padding + headerHeight;
            
            visibleGroups.forEach((group, idx) => {
                totalHeight += groupHeaderHeight;
                totalHeight += group.rows * group.cellHeight + (group.rows - 1) * itemGap;
                if (idx < visibleGroups.length - 1) {
                    totalHeight += 10;
                }
            });
            
            totalHeight += footerHeight + padding;
            
            const SCALE = 1.5;
            const canvas = document.createElement('canvas');
            canvas.width = totalWidth * SCALE;
            canvas.height = totalHeight * SCALE;
            const ctx = canvas.getContext('2d');
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.scale(SCALE, SCALE);
            
            const BORDER_COLOR = '#141D35';
            const TEXT_COLOR = '#141D35';
            
            const langData = {
                ru: {
                    figures: '📦 ФИГУРКИ',
                    extras: '🎁 ДОПЫ',
                    variants: '🎲 ВАРИАНТЫ',
                    footer: 'Скачано с',
                    site: 'manspo.github.io',
                    checklist: 'ЧЕК-ЛИСТ',
                    scanMe: 'СКАНИРУЙ',
                    total: 'Всего'
                },
                en: {
                    figures: '📦 FIGURES',
                    extras: '🎁 EXTRAS',
                    variants: '🎲 VARIANTS',
                    footer: 'Downloaded from',
                    site: 'manspo.github.io',
                    checklist: 'CHECKLIST',
                    scanMe: 'SCAN ME',
                    total: 'Total'
                }
            };
            const t = langData[lang] || langData.ru;
            
            const bgGradient = ctx.createLinearGradient(0, 0, 0, totalHeight);
            bgGradient.addColorStop(0, '#ffffff');
            bgGradient.addColorStop(1, '#f5f7fb');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, totalWidth, totalHeight);
            
            ctx.save();
            ctx.globalAlpha = 0.03;
            ctx.fillStyle = '#4f46e5';
            ctx.beginPath();
            ctx.arc(totalWidth - 200, 100, 300, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(150, totalHeight - 150, 250, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            const logoImage = await loadImage(`${BASE_URL}/images/logo.webp`);
            const logoSize = 180;
            const logoX = (totalWidth - logoSize) / 2;
            const logoY = padding + 10;
            
            if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
                const imgW = logoImage.naturalWidth;
                const imgH = logoImage.naturalHeight;
                let drawW, drawH;
                if (imgW > imgH) {
                    drawW = logoSize;
                    drawH = (imgH / imgW) * logoSize;
                } else {
                    drawH = logoSize;
                    drawW = (imgW / imgH) * logoSize;
                }
                const drawX = logoX + (logoSize - drawW) / 2;
                const drawY = logoY + (logoSize - drawH) / 2;
                ctx.drawImage(logoImage, drawX, drawY, drawW, drawH);
            } else {
                ctx.font = 'bold 64px Inter, system-ui';
                ctx.fillStyle = TEXT_COLOR;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('КАПСУЛА', totalWidth / 2, logoY + logoSize / 2);
            }
            
            const titleY = padding + 20;
            
            ctx.fillStyle = '#4f46e5';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(padding, titleY, 6, 45, 3);
            } else {
                ctx.rect(padding, titleY, 6, 45);
            }
            ctx.fill();
            
            ctx.font = 'bold 38px Inter, system-ui';
            ctx.fillStyle = TEXT_COLOR;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(seriesName || 'Checklist', padding + 22, titleY - 3);
            
            ctx.font = 'bold 17px Inter, system-ui';
            ctx.fillStyle = TEXT_COLOR;
            ctx.globalAlpha = 0.7;
            ctx.fillText(t.checklist, padding, titleY + 65);
            ctx.globalAlpha = 1;
            
            const totalItems = figures.length + extras.length + variants.length;
            ctx.font = 'bold 17px Inter, system-ui';
            ctx.fillStyle = TEXT_COLOR;
            ctx.fillText(`${t.total}: ${totalItems}`, padding, titleY + 95);
            
            const qrImage = await loadImage(`${BASE_URL}/images/qrcodesite.png`);
            const qrX = totalWidth - padding - qrSize;
            const qrY = padding;
            
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
            ctx.shadowBlur = 24;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 20);
            } else {
                ctx.rect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
            }
            ctx.fill();
            ctx.restore();
            
            ctx.strokeStyle = BORDER_COLOR;
            ctx.lineWidth = 4;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 20);
            } else {
                ctx.rect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
            }
            ctx.stroke();
            
            if (qrImage && qrImage.complete && qrImage.naturalWidth > 0) {
                ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            } else {
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(qrX, qrY, qrSize, qrSize);
                ctx.fillStyle = TEXT_COLOR;
                ctx.font = 'bold 20px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('QR', qrX + qrSize/2, qrY + qrSize/2);
            }
            
            ctx.font = 'bold 16px Inter, system-ui';
            ctx.fillStyle = TEXT_COLOR;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(t.scanMe, qrX + qrSize/2, qrY + qrSize + 25);
            
            let currentY = padding + headerHeight;
            
            function drawCell(ctx, x, y, size, item, num, img, lang, showCode, showName, type) {
                const labelBg = '#FFFFFF';
                
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
                ctx.shadowBlur = 14;
                ctx.shadowOffsetY = 3;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(x, y, size, size, 16);
                } else {
                    ctx.rect(x, y, size, size);
                }
                ctx.fill();
                ctx.restore();
                
                ctx.strokeStyle = BORDER_COLOR;
                ctx.lineWidth = 4;
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(x, y, size, size, 16);
                } else {
                    ctx.rect(x, y, size, size);
                }
                ctx.stroke();
                
                if (img && img.complete && img.naturalWidth > 0) {
                    const maxImgSize = size - 10;
                    const imgWidth = img.naturalWidth;
                    const imgHeight = img.naturalHeight;
                    let drawWidth, drawHeight;
                    if (imgWidth > imgHeight) {
                        drawWidth = maxImgSize;
                        drawHeight = (imgHeight / imgWidth) * maxImgSize;
                    } else {
                        drawHeight = maxImgSize;
                        drawWidth = (imgWidth / imgHeight) * maxImgSize;
                    }
                    const imgX = x + (size - drawWidth) / 2;
                    const imgY = y + (size - drawHeight) / 2 + 5;
                    
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.save();
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x + 2, y + 2, size - 4, size - 4, 14);
                    } else {
                        ctx.rect(x + 2, y + 2, size - 4, size - 4);
                    }
                    ctx.clip();
                    
                    ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);
                    ctx.restore();
                } else {
                    ctx.fillStyle = '#f3f4f6';
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x + 10, y + 10, size - 20, size - 20, 12);
                    } else {
                        ctx.rect(x + 10, y + 10, size - 20, size - 20);
                    }
                    ctx.fill();
                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '48px Inter';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🖼️', x + size/2, y + size/2);
                }
                
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.translate(x + size/2, y + size/2);
                ctx.rotate(-Math.PI / 4);
                ctx.font = `bold ${Math.floor(size * 0.18)}px Inter, system-ui`;
                ctx.fillStyle = '#4f46e5';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('MANSUR', 0, 0);
                ctx.restore();
                
                let rowY = y + size + labelGap;
                const numBoxY = rowY;
                const hasCode = item.code && item.code.trim() && showCode;
                
                if (hasCode) {
                    const numBoxSize = codeRowHeight;
                    const numBoxX = x;
                    
                    ctx.fillStyle = labelBg;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(numBoxX, numBoxY, numBoxSize, numBoxSize, 8);
                    } else {
                        ctx.rect(numBoxX, numBoxY, numBoxSize, numBoxSize);
                    }
                    ctx.fill();
                    
                    ctx.strokeStyle = BORDER_COLOR;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(numBoxX, numBoxY, numBoxSize, numBoxSize, 8);
                    } else {
                        ctx.rect(numBoxX, numBoxY, numBoxSize, numBoxSize);
                    }
                    ctx.stroke();
                    
                    ctx.font = 'bold 26px Inter, system-ui';
                    ctx.fillStyle = TEXT_COLOR;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(num.toString(), numBoxX + numBoxSize/2, numBoxY + numBoxSize/2 + 1);
                    
                    const codeX = numBoxX + numBoxSize + innerGap;
                    const codeWidth = size - numBoxSize - innerGap;
                    
                    ctx.fillStyle = labelBg;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(codeX, numBoxY, codeWidth, numBoxSize, 8);
                    } else {
                        ctx.rect(codeX, numBoxY, codeWidth, numBoxSize);
                    }
                    ctx.fill();
                    
                    ctx.strokeStyle = BORDER_COLOR;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(codeX, numBoxY, codeWidth, numBoxSize, 8);
                    } else {
                        ctx.rect(codeX, numBoxY, codeWidth, numBoxSize);
                    }
                    ctx.stroke();
                    
                    let displayCode = item.code;
                    ctx.font = 'bold 22px monospace';
                    while (ctx.measureText(displayCode).width > codeWidth - 16 && displayCode.length > 3) {
                        displayCode = displayCode.substring(0, displayCode.length - 1);
                    }
                    if (displayCode !== item.code) {
                        displayCode = displayCode.substring(0, displayCode.length - 1) + '…';
                    }
                    
                    ctx.fillStyle = TEXT_COLOR;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(displayCode, codeX + codeWidth/2, numBoxY + numBoxSize/2 + 1);
                    
                } else {
                    const numBoxX = x;
                    const numBoxWidth = size;
                    
                    ctx.fillStyle = labelBg;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(numBoxX, numBoxY, numBoxWidth, codeRowHeight, 8);
                    } else {
                        ctx.rect(numBoxX, numBoxY, numBoxWidth, codeRowHeight);
                    }
                    ctx.fill();
                    
                    ctx.strokeStyle = BORDER_COLOR;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(numBoxX, numBoxY, numBoxWidth, codeRowHeight, 8);
                    } else {
                        ctx.rect(numBoxX, numBoxY, numBoxWidth, codeRowHeight);
                    }
                    ctx.stroke();
                    
                    ctx.font = 'bold 26px Inter, system-ui';
                    ctx.fillStyle = TEXT_COLOR;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(num.toString(), numBoxX + numBoxWidth/2, numBoxY + codeRowHeight/2 + 1);
                }
                
                rowY += codeRowHeight + labelGap;
                
                if (showName) {
                    const itemName = (lang === 'en' && item.name_en) ? item.name_en : item.name;
                    const isDefault = isDefaultName(item, type);
                    
                    ctx.fillStyle = labelBg;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x, rowY, size, nameRowHeight, 8);
                    } else {
                        ctx.rect(x, rowY, size, nameRowHeight);
                    }
                    ctx.fill();
                    
                    ctx.strokeStyle = BORDER_COLOR;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x, rowY, size, nameRowHeight, 8);
                    } else {
                        ctx.rect(x, rowY, size, nameRowHeight);
                    }
                    ctx.stroke();
                    
                    if (!isDefault && itemName) {
                        let displayName = itemName;
                        ctx.font = 'bold 18px Inter, system-ui';
                        ctx.fillStyle = TEXT_COLOR;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        
                        const maxWidth = size - 16;
                        const words = displayName.split(' ');
                        const lines = [];
                        let currentLine = '';
                        
                        for (const word of words) {
                            const testLine = currentLine ? currentLine + ' ' + word : word;
                            const metrics = ctx.measureText(testLine);
                            if (metrics.width > maxWidth && currentLine) {
                                lines.push(currentLine);
                                currentLine = word;
                            } else {
                                currentLine = testLine;
                            }
                        }
                        if (currentLine) lines.push(currentLine);
                        
                        const displayLines = lines.slice(0, 2);
                        const lineHeight = 22;
                        const totalTextHeight = displayLines.length * lineHeight;
                        const startY = rowY + (nameRowHeight - totalTextHeight) / 2 + lineHeight / 2;
                        
                        displayLines.forEach((line, idx) => {
                            ctx.fillText(line, x + size/2, startY + idx * lineHeight);
                        });
                    }
                }
            }
            
            async function drawGroup(items, title, startY, color, type, showCode, showName, cellHeight) {
                if (items.length === 0) return startY;
                
                let y = startY;
                const groupHeaderY = y;
                
                ctx.fillStyle = color;
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(padding, groupHeaderY, 5, 42, 3);
                } else {
                    ctx.rect(padding, groupHeaderY, 5, 42);
                }
                ctx.fill();
                
                ctx.font = 'bold 24px Inter, system-ui';
                ctx.fillStyle = TEXT_COLOR;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(title, padding + 25, groupHeaderY + 6);
                
                y += groupHeaderHeight;
                
                let col = 0;
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const num = i + 1;
                    const x = padding + col * (itemSize + itemGap);
                    const img = imageMap.get(item.id || item.name) || createEmptyImage();
                    
                    drawCell(ctx, x, y, itemSize, item, num, img, lang, showCode, showName, type);
                    
                    col++;
                    if (col >= itemsPerRow) {
                        col = 0;
                        y += cellHeight + itemGap;
                    }
                }
                
                if (col !== 0) y += cellHeight;
                
                return y;
            }
            
            if (figures.length > 0) {
                currentY = await drawGroup(figures, t.figures, currentY, '#4f46e5', 'figure', showCodeFigures, showNameFigures, figureCellHeight);
                if (extras.length > 0 || variants.length > 0) currentY += 10;
            }
            if (extras.length > 0) {
                currentY = await drawGroup(extras, t.extras, currentY, '#10b981', 'extra', showCodeExtras, showNameExtras, extraCellHeight);
                if (variants.length > 0) currentY += 10;
            }
            if (variants.length > 0) {
                currentY = await drawGroup(variants, t.variants, currentY, '#f59e0b', 'variant', showCodeVariants, showNameVariants, variantCellHeight);
            }
            
            const footerY = totalHeight - footerHeight;
            
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, footerY);
            ctx.lineTo(totalWidth - padding, footerY);
            ctx.stroke();
            
            ctx.font = 'bold 22px Inter, system-ui';
            ctx.fillStyle = TEXT_COLOR;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${t.footer} ${t.site}`, padding, footerY + footerHeight/2);
            
            const jpegData = canvas.toDataURL('image/jpeg', 0.95);
            resolve(jpegData);
        } catch (error) {
            console.error('Ошибка создания коллажа:', error);
            reject(error);
        }
    });
}

async function downloadCollage(seriesId, seriesName) {
    if (isDownloadingChecklist) {
        console.warn('⏳ Уже генерируется чек-лист');
        return;
    }
    
    isDownloadingChecklist = true;
    
    try {
        const lang = localStorage.getItem("lang") || "ru";
        showLoadingToast(lang === 'ru' ? 'Генерация чек-листа...' : 'Generating checklist...');
        
        const series = await loadSeriesById(seriesId);
        if (!series) {
            showError(lang === 'ru' ? 'Ошибка загрузки серии' : 'Error loading series');
            hideLoadingToast();
            isDownloadingChecklist = false;
            return;
        }
        
        const figures = series.figures || [];
        const extras = series.extras || [];
        const variants = series.variants || [];
        
        if (figures.length === 0 && extras.length === 0 && variants.length === 0) {
            showError(lang === 'ru' ? 'Нет элементов для чек-листа' : 'No items for checklist');
            hideLoadingToast();
            isDownloadingChecklist = false;
            return;
        }
        
        const seriesTitle = lang === 'en' && series.name_en ? series.name_en : series.name;
        
        const jpegData = await generateCollage(seriesId, seriesTitle, figures, extras, variants, lang);
        const base64Data = jpegData.split(',')[1];
        const safeName = seriesTitle.replace(/[^a-zа-яё0-9]/gi, '_');
        const fileName = `checklist_${safeName}_${Date.now()}.jpg`;
        
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            if (window.FileHelper) {
                try {
                    const savedPath = await saveChecklistNative(base64Data, fileName);
                    if (savedPath) {
                        alert(`✅ Чек-лист сохранен!\n\n📁 ${savedPath}`);
                        hideLoadingToast();
                        showSuccess('✅ Чек-лист сохранен');
                        isDownloadingChecklist = false;
                        return;
                    }
                } catch (nativeError) {}
            }
            
            try {
                const Filesystem = window.Capacitor.Plugins.Filesystem;
                if (Filesystem) {
                    const dirs = [
                        { dir: 3, name: 'Documents' },
                        { dir: 2, name: 'Cache' },
                        { dir: 1, name: 'Data' }
                    ];
                    for (const d of dirs) {
                        try {
                            const result = await Filesystem.writeFile({
                                path: fileName,
                                data: base64Data,
                                directory: d.dir,
                                recursive: true
                            });
                            alert(`✅ Сохранено в ${d.name}`);
                            hideLoadingToast();
                            showSuccess(`✅ Чек-лист сохранен`);
                            isDownloadingChecklist = false;
                            return;
                        } catch (dirError) {}
                    }
                }
            } catch (fsError) {}
            
            throw new Error('Не удалось сохранить чек-лист.');
        }
        
        const link = document.createElement("a");
        link.href = jpegData;
        link.download = `checklist_${safeName}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        hideLoadingToast();
        showSuccess('✅ Чек-лист скачан');
        
    } catch (error) {
        console.error('❌ Ошибка сохранения чек-листа:', error);
        hideLoadingToast();
        const lang = localStorage.getItem("lang") || "ru";
        showError(lang === 'ru' ? 'Не удалось сохранить чек-лист: ' + error.message : 'Failed to save checklist: ' + error.message);
    } finally {
        isDownloadingChecklist = false;
    }
}

// ===== ОБРАБОТКА ГЛУБОКИХ ССЫЛОК =====
function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    const hash = window.location.hash;
    const figureMatch = hash.match(/figure-([^&]+)/);
    
    if (id) {
        setTimeout(() => {
            window.location.href = `series.html?id=${id}`;
        }, 100);
        return true;
    }
    
    if (figureMatch) {
        const figureId = figureMatch[1];
        showSuccess(`🔍 Открыта фигурка: ${figureId}`);
        return true;
    }
    
    return false;
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        handleDeepLink();
    }
});

// ===== INIT =====
document.addEventListener("DOMContentLoaded", async () => {
  initLangFromUrl();
  const path = window.location.pathname;
  
  try {
    await loadManufacturers();
    
    if (path.includes('catalog.html')) {
      initCatalog();
    } else if (path.includes('series.html')) {
      initSeries();
    } else if (path.includes('figure.html')) {
      initFigure();
    } else if (path.includes('lot.html')) {
      initLot();
    } else if (path.includes('mycollection.html')) {
      initMyCollection();
    } else if (path.includes('forsale.html')) {
      initForSale();
    } else if (path.includes('videos.html')) {
      initVideos();         // ← НОВОЕ
    } else if (path.includes('about.html')) {
      initAbout();
    } else {
      initHome();
    }
    
    initTheme();
    applyTranslations();
  } catch(error) {
    console.error('Ошибка инициализации:', error);
    showError('Произошла ошибка при загрузке страницы');
  }
});