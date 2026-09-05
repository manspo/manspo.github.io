// ============================================================
// script.js - ПОЛНАЯ ВЕРСИЯ С ЗАГРУЗКОЙ С GITHUB PAGES
// ============================================================

// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
  CACHE_TTL: 24 * 60 * 60 * 1000,
  ITEMS_PER_PAGE: 10,
  RECENT_COUNT: 5,
  MAX_ZOOM: 3,
  ZOOM_STEP: 0.3,
  DEBOUNCE_DELAY: 300
};

// ===== БАЗОВЫЙ URL ДЛЯ GITHUB PAGES =====
const BASE_URL = 'https://manspo.github.io/kindercapsule';

// ===== УПРАВЛЕНИЕ ЗАГРУЗКОЙ (НОВАЯ ВЕРСИЯ) =====

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
    
    // Показываем кнопку "Повторить"
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

// ===== ПОВТОРНАЯ ЗАГРУЗКА =====
async function retryLoadData() {
    // Удаляем кнопку "Повторить"
    const btn = document.querySelector('#loadingOverlay .retry-btn');
    if (btn) btn.remove();
    
    // Сбрасываем статус
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

// ===== DATA LOADING =====

let seriesCache = {};
let seriesManufacturerMap = {};
let allSeriesData = null;

// 1. Загрузка индекса (списка всех серий) с параллельной предзагрузкой
async function loadData() {
    // Если данные уже загружаются через preload - ждем их
    if (window.dataPromise) {
        try {
            const index = await window.dataPromise;
            window.dataPromise = null;
            index.forEach(s => { seriesManufacturerMap[s.id] = s.manufacturer; });
            window.seriesIndex = index;
            return index;
        } catch (error) {
            console.error('Ошибка предзагрузки:', error);
            // Продолжаем с обычной загрузкой
        }
    }
    
    try {
        console.log('🔍 Загрузка данных с:', `${BASE_URL}/data/index.json`);
        const res = await fetch(`${BASE_URL}/data/index.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const index = await res.json();
        index.forEach(s => { seriesManufacturerMap[s.id] = s.manufacturer; });
        window.seriesIndex = index;
        return index;
    } catch (error) {
        console.error('Ошибка загрузки индекса:', error);
        showError('Не удалось загрузить каталог. Проверьте соединение.');
        return [];
    }
}

// 2. Загрузка конкретной серии
async function loadSeriesById(id) {
  if (seriesCache[id]) return seriesCache[id];
  
  try {
    const manufacturer = seriesManufacturerMap[id];
    if (!manufacturer) {
      await loadData();
      return loadSeriesById(id);
    }
    
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

// 3. Загрузка всех серий
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

// 4. Загрузка производителей
async function loadManufacturers() {
  try {
    const res = await fetch(`${BASE_URL}/data/manufacturers.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error('Ошибка загрузки производителей:', error);
    return {};
  }
}

// 5. Загрузка социальных ссылок
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

// 6. Загрузка с кешем
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
const manufacturerOrder = [
  'kinder', 'nestle', 'landrin', 'maraja', 'tomy', 'tombola',
  'rubezahl', 'zweifal', 'kartel', 'rtrade', 'zaini', 'konfitoy',
  'panini', 'danone', 'milka', 'haribo', 'union', 'ozmo',
  'zabavnyjsyurpriz', 'dolcipreziosi'
];

function getFilterState() {
  const saved = localStorage.getItem('filterState');
  const defaultState = {
    catalog: { manufacturer: 'all', kind: 'all', sort: 'date-desc', search: '' },
    mycollection: { manufacturer: 'all', kind: 'all', search: '' },
    forsale: { manufacturer: 'all', kind: 'all', sort: 'name', search: '', tab: 'figures' }
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

// ===== QR-КОДЫ (ПОЛНАЯ ВЕРСИЯ С НАТИВНЫМ СОХРАНЕНИЕМ И ГЛУБОКИМИ ССЫЛКАМИ) =====
function generateQRCode(figureId, seriesId, figureName, isSeries = false) {
  try {
    const currentLang = localStorage.getItem("lang") || "ru";

    // Схема для приложения
    const APP_SCHEME = 'kindercapsule://open';
    const WEB_BASE = 'https://manspo.github.io/kindercapsule';
    
    // Формируем URL для QR-кода (используем универсальную ссылку)
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

    // Генерируем QR-код с URL, который ведет на сайт
    // При сканировании на Android с установленным приложением - откроется приложение
    // Благодаря intent-filter в манифесте
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

          console.log('📝 Начинаем сохранение...');
          console.log('📝 Имя файла:', fileName);
          console.log('📝 Capacitor:', window.Capacitor);

          // --- ЕСЛИ МЫ В ПРИЛОЖЕНИИ (Capacitor) ---
          if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            console.log('✅ Capacitor нативная платформа');
            
            // ПРОБУЕМ НАТИВНЫЙ МЕТОД ЧЕРЕЗ FileHelper
            if (window.FileHelper) {
              try {
                console.log('✅ Используем нативный FileHelper');
                
                const savedPath = await saveQRCodeNative(base64Data, fileName);
                
                if (savedPath) {
                  const msg = currentLang === 'ru'
                    ? `✅ QR-код сохранен в галерею!\n\n📁 Путь: ${savedPath}\n\nПроверьте галерею или папку "Капсула"`
                    : `✅ QR code saved to gallery!\n\n📁 Path: ${savedPath}\n\nCheck gallery or "Капсула" folder`;
                  
                  alert(msg);
                  showSuccess('✅ QR-код сохранен в галерею');
                  modal.remove();
                  return;
                }
              } catch (nativeError) {
                console.warn('❌ Нативный метод не сработал:', nativeError);
              }
            }
            
            // FALLBACK: Пробуем Filesystem
            try {
              const Filesystem = window.Capacitor.Plugins.Filesystem;
              const Share = window.Capacitor.Plugins.Share;
              
              if (Filesystem) {
                console.log('📁 Пробуем Filesystem...');
                
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
                    
                    console.log(`✅ Сохранено в ${d.name}:`, result.uri);
                    
                    const msg = currentLang === 'ru'
                      ? `✅ QR-код сохранен!\n\n📁 Папка: ${d.name}\n📄 Файл: ${fileName}\n📂 Путь: ${result.uri}`
                      : `✅ QR code saved!\n\n📁 Folder: ${d.name}\n📄 File: ${fileName}\n📂 Path: ${result.uri}`;
                    
                    alert(msg);
                    
                    if (Share) {
                      try {
                        await Share.share({
                          title: 'QR-код',
                          text: `QR-код для ${figureName}`,
                          url: result.uri,
                          dialogTitle: 'Открыть файл'
                        });
                      } catch (shareError) {
                        console.warn('Share не доступен:', shareError);
                      }
                    }
                    
                    showSuccess(`✅ QR-код сохранен в ${d.name}`);
                    modal.remove();
                    return;
                    
                  } catch (dirError) {
                    console.warn(`❌ Не удалось сохранить в ${d.name}:`, dirError.message);
                  }
                }
              }
            } catch (fsError) {
              console.error('❌ Ошибка Filesystem:', fsError);
            }
            
            throw new Error('Не удалось сохранить QR-код. Попробуйте другой метод.');
          }
          
          // ===== FALLBACK (браузер) =====
          console.log('🌐 Используем браузерный fallback');
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => document.body.removeChild(link), 100);
          showSuccess('✅ QR-код скачан');
          modal.remove();

        } catch (error) {
          console.error('❌ ОШИБКА:', error);
          const msg = currentLang === 'ru'
            ? `❌ Не удалось сохранить QR-код:\n\n${error.message}\n\nПроверьте консоль для деталей`
            : `❌ Failed to save QR code:\n\n${error.message}\n\nCheck console for details`;
          alert(msg);
        }
      };
    }
  } catch (error) {
    console.error('❌ Ошибка генерации QR:', error);
    alert('Не удалось создать QR-код');
  }
}

// ===== ОБРАБОТКА ГЛУБОКИХ ССЫЛОК =====
(function handleDeepLinkInApp() {
    // Проверяем, есть ли параметр id в URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (id && window.location.pathname.includes('series.html')) {
        console.log('📱 Открыто через глубокую ссылку, серия:', id);
        // Если уже на странице series.html, ничего не делаем
        // Страница уже загружена
    }
})();

// ===== СОХРАНЕНИЕ ЧЕК-ЛИСТА ЧЕРЕЗ НАТИВНЫЙ МЕТОД =====
async function saveChecklistNative(base64Data, fileName) {
    return new Promise((resolve, reject) => {
        try {
            if (!window.FileHelper) {
                reject(new Error('FileHelper не найден. Проверьте настройки приложения.'));
                return;
            }
            
            console.log('✅ Используем нативный FileHelper для чек-листа');
            
            window._checklistSaveCallback = function(result) {
                console.log('📝 Результат сохранения чек-листа:', result);
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

// ===== СОХРАНЕНИЕ ЧЕРЕЗ НАТИВНЫЙ МЕТОД =====
async function saveQRCodeNative(base64Data, fileName) {
    return new Promise((resolve, reject) => {
        try {
            if (!window.FileHelper) {
                reject(new Error('FileHelper не найден. Проверьте настройки приложения.'));
                return;
            }
            
            window._qrSaveCallback = function(result) {
                console.log('📝 Результат сохранения:', result);
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
    saveFilterState(filterState);
    
    updateProgress(20, 'Загрузка списка серий...');
    
    // Загружаем всё параллельно
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
    
    // Небольшая задержка для плавного перехода
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

async function updateStats(data) {
  try {
    const totalSeriesSpan = document.getElementById('totalSeries');
    const totalFiguresSpan = document.getElementById('totalFigures');
    const totalInsertsSpan = document.getElementById('totalInserts');
    const totalForSaleSpan = document.getElementById('totalForSaleItems');
    const totalManufacturersSpan = document.getElementById('totalManufacturers');
    
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
      const allSeries = await loadAllSeries();
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

// ===== CATALOG (ИСПРАВЛЕН) =====
async function initCatalog() {
  const grid = document.getElementById("catalogGrid");
  if (!grid) return;
  
  try {
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
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        list = list.filter(s => {
          const nameRu = (s.name || '').toLowerCase();
          const nameEn = (s.name_en || s.name || '').toLowerCase();
          const yearStr = (s.year || '').toString();
          return nameRu.includes(query) || nameEn.includes(query) || yearStr.includes(query);
        });
      }
      
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
      }
      applyTranslations();
    }
    
    updateKindFiltersVisibility();
    render();
  } catch(error) {
    console.error('Ошибка инициализации каталога:', error);
    showError('Не удалось загрузить каталог');
    grid.innerHTML = `<p class="error-message">❌ Ошибка загрузки каталога. Попробуйте обновить страницу.</p>`;
  }
}

// ===== MY COLLECTION =====
async function initMyCollection() {
  const grid = document.getElementById("collectionGrid");
  if (!grid) return;
  
  try {
    await loadData();
    
    let seriesData = window.seriesIndex || [];
    seriesData = seriesData.filter(s => s.visible !== false);
    const manufacturers = await loadManufacturers();
    
    const fullSeriesData = [];
    for (const item of seriesData) {
      const full = await loadSeriesById(item.id);
      if (full) fullSeriesData.push(full);
    }
    
    let seriesWithCollection = fullSeriesData.filter(series => 
      series.figures?.some(f => f.owned) || 
      series.extras?.some(e => e.owned)
    );
    
    const searchInput = document.getElementById("searchInput");
    let searchQuery = filterState.mycollection.search || '';
    let currentFilter = filterState.mycollection.manufacturer || 'all';
    let currentKindFilter = filterState.mycollection.kind || 'all';
    
    const filterGroup = document.querySelector('.filter-group');
    if (filterGroup) {
      const uniqueManufacturers = [...new Set(seriesWithCollection.map(s => s.manufacturer))];
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
      let list = [...seriesWithCollection];
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
        const totalFigures = list.reduce((sum, s) => 
          sum + (s.figures?.filter(f => f.owned).length || 0) + 
          (s.extras?.filter(e => e.owned).length || 0), 0
        );
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
        const ownedFigures = s.figures?.filter(f => f.owned).length || 0;
        const ownedExtras = s.extras?.filter(e => e.owned).length || 0;
        const totalOwnedItems = ownedFigures + ownedExtras;
        const totalFigures = s.figures?.length || 0;
        const totalExtras = s.extras?.length || 0;
        const totalItems = totalFigures + totalExtras;
        const collectionText = currentLang === 'ru' 
          ? `В коллекции: ${totalOwnedItems} шт. из ${totalItems}` 
          : `In collection: ${totalOwnedItems} pcs of ${totalItems}`;
        
        const forSaleFigures = (s.figures || []).filter(f => f.forsale);
        const forSaleCount = forSaleFigures.length;
        
        const imageUrl = s.cover ? `${BASE_URL}/${s.cover}` : 'images/placeholder.svg';
        
        a.innerHTML = `
          <img src="${imageUrl}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.src='images/placeholder.svg'">
          <div class="card-body">
            <h3>${escapeHtml(name)}</h3>
            <div class="year">${escapeHtml(s.year)} · ${escapeHtml(manufacturerName)}</div>
            <div class="collection-stats">${escapeHtml(collectionText)}</div>
            ${forSaleCount > 0 ? `<div class="forsale-count">💰 ${currentLang === 'ru' ? 'Есть в продаже' : 'For sale'}</div>` : ''}
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

// ===== FOR SALE =====
async function initForSale() {
  const grid = document.getElementById("forsaleGrid");
  if (!grid) return;
  
  try {
    await loadData();
    
    let seriesData = window.seriesIndex || [];
    seriesData = seriesData.filter(s => s.visible !== false);
    const manufacturers = await loadManufacturers();
    let currentLang = localStorage.getItem("lang") || "ru";
    
    const fullSeriesData = [];
    for (const item of seriesData) {
      const full = await loadSeriesById(item.id);
      if (full) fullSeriesData.push(full);
    }
    
    let figureItems = [], extraItems = [], insertItems = [], variantItems = [], fullSeriesItems = [];
    
    fullSeriesData.forEach(series => {
      if (series.fullSeriesForSale === true) {
        fullSeriesItems.push({
          id: series.id,
          name: (currentLang === 'en' && series.name_en) ? series.name_en : series.name,
          image: series.cover,
          avito: series.fullSeriesAvito || '',
          seriesId: series.id,
          seriesName: (currentLang === 'en' && series.name_en) ? series.name_en : series.name,
          seriesYear: series.year,
          manufacturer: series.manufacturer,
          type: 'full',
          price: series.fullSeriesPrice || '',
          date_added: series.fullSeriesDateAdded || series.date_added || ''
        });
      }
      
      ['figures', 'variants', 'extras', 'inserts'].forEach(cat => {
        if (series[cat]) {
          const typeMap = {
            'figures': 'figure',
            'variants': 'variant',
            'extras': 'extra',
            'inserts': 'insert'
          };
          const type = typeMap[cat];
          const target = cat === 'figures' ? figureItems :
                        cat === 'variants' ? variantItems :
                        cat === 'extras' ? extraItems : insertItems;
          
          series[cat].forEach(item => {
            if (item.forsale === true) {
              target.push({
                id: item.id,
                seriesId: series.id,
                name: (currentLang === 'en' && item.name_en) ? item.name_en : item.name,
                image: item.image,
                avito: item.avito,
                seriesName: (currentLang === 'en' && series.name_en) ? series.name_en : series.name,
                seriesYear: series.year,
                manufacturer: series.manufacturer,
                price: item.price || '',
                condition: (currentLang === 'en' ? item.condition_en : item.condition) || '',
                type: type,
                code: item.code || '',
                date_added: item.date_added || series.date_added || ''
              });
            }
          });
        }
      });
    });
    
    let currentManufacturer = filterState.forsale.manufacturer || 'all';
    let currentSearch = filterState.forsale.search || '';
    let currentSort = filterState.forsale.sort || 'name';
    
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
      if (currentSort === 'year') {
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
      
      const saleLink = item.avito && item.avito !== '' ? item.avito : '#';
      const manufacturerName = manufacturers[item.manufacturer]?.[currentLang] || item.manufacturer;
      
      const typeLabels = {
        'figure': currentLang === 'ru' ? 'Фигурка' : 'Figure',
        'variant': currentLang === 'ru' ? 'Вариант' : 'Variant',
        'extra': currentLang === 'ru' ? 'Доп' : 'Extra',
        'insert': currentLang === 'ru' ? 'Вкладыш' : 'Insert',
        'full': currentLang === 'ru' ? 'Полная серия' : 'Full series'
      };
      
      const imageUrl = item.image ? `${BASE_URL}/${item.image}` : 'images/placeholder.svg';
      
      div.innerHTML = `
        <a href="${item.type === 'full' ? `series.html?id=${item.seriesId}` : `figure.html?series=${item.seriesId}&fig=${item.id}`}">
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
        ${saleLink !== '#' ? `<a href="${escapeHtml(saleLink)}" class="forsale-buy-link" target="_blank" rel="noopener noreferrer">🛒</a>` : ''}
      `;
      
      return div;
    }
    
    const filterGroup = document.querySelector('.filter-group');
    if (filterGroup) {
      const allItems = [...figureItems, ...variantItems, ...extraItems, ...insertItems, ...fullSeriesItems];
      const uniqueMans = [...new Set(allItems.map(i => i.manufacturer))];
      const sortedMans = manufacturerOrder.filter(m => uniqueMans.includes(m));
      
      filterGroup.innerHTML = '<button class="filter-btn" data-filter="all">' + (currentLang === 'ru' ? 'Все' : 'All') + '</button>';
      sortedMans.forEach(m => {
        const displayName = manufacturers[m]?.[currentLang] || m;
        filterGroup.innerHTML += `<button class="filter-btn" data-filter="${m}">${displayName}</button>`;
      });
      
      const activeBtn = document.querySelector(`.filter-btn[data-filter="${currentManufacturer}"]`);
      if (activeBtn) activeBtn.classList.add('active');
      else document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');
      
      document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.onclick = () => {
          document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
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
      
      if (recent.length > 0) {
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        divider.innerHTML = `🆕 ${currentLang === 'ru' ? 'Недавно добавленное' : 'Recently added'}`;
        grid.appendChild(divider);
        recent.forEach(item => grid.appendChild(createItemCard(item)));
      }
      
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
      if (avitoLink !== '#') {
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

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallback = new Image();
      fallback.src = 'images/placeholder.svg';
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => resolve(null);
    };
    img.src = src;
  });
}

async function generateCollage(seriesId, seriesName, figures, extras, variants, lang) {
  return new Promise(async (resolve, reject) => {
    try {
      const allItems = [...figures, ...extras, ...variants];
      const loadedImages = [];
      for (const item of allItems) {
        const imageUrl = item.image ? `${BASE_URL}/${item.image}` : 'images/placeholder.svg';
        const img = await loadImage(imageUrl);
        loadedImages.push({ item, img: img || new Image() });
      }
      const imageMap = new Map();
      loadedImages.forEach(({ item, img }) => {
        imageMap.set(item.id || item.name, img);
      });
      
      const itemsPerRow = 4;
      const itemSize = 300;
      const padding = 20;
      const headerHeight = 80;
      
      const figureRows = Math.ceil(figures.length / itemsPerRow);
      const extraRows = Math.ceil(extras.length / itemsPerRow);
      const variantRows = Math.ceil(variants.length / itemsPerRow);
      
      const totalWidth = itemsPerRow * (itemSize + padding) + padding;
      let totalHeight = padding;
      if (figures.length > 0) totalHeight += headerHeight + figureRows * (itemSize + padding);
      if (extras.length > 0) totalHeight += headerHeight + extraRows * (itemSize + padding);
      if (variants.length > 0) totalHeight += headerHeight + variantRows * (itemSize + padding);
      
      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      
      let currentY = padding;
      
      async function drawGroup(items, title, startY) {
        let y = startY;
        ctx.font = `bold ${Math.floor(headerHeight * 0.4)}px Inter, system-ui`;
        ctx.fillStyle = '#4f46e5';
        ctx.fillText(title, padding, y + headerHeight * 0.6);
        y += headerHeight;
        
        let currentX = padding;
        let col = 0;
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const num = i + 1;
          const itemCode = item.code || '';
          const img = imageMap.get(item.id || item.name);
          
          ctx.fillStyle = '#f5f7fb';
          ctx.fillRect(currentX, y, itemSize, itemSize);
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 2;
          ctx.strokeRect(currentX, y, itemSize, itemSize);
          
          if (img && img.complete && img.naturalWidth > 0) {
            const maxImgSize = itemSize - 80;
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
            const imgX = currentX + (itemSize - drawWidth) / 2;
            const imgY = y + 35 + (maxImgSize - drawHeight) / 2;
            ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);
          } else {
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(currentX + 10, y + 35, itemSize - 20, itemSize - 80);
            ctx.fillStyle = '#999';
            ctx.font = `${Math.floor(itemSize * 0.1)}px Inter`;
            ctx.fillText('🖼️', currentX + itemSize/2 - 15, y + itemSize/2);
          }
          
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.translate(currentX + itemSize/2, y + itemSize/2);
          ctx.rotate(-Math.PI / 4);
          ctx.font = `bold ${Math.floor(itemSize * 0.22)}px Inter, system-ui`;
          ctx.fillStyle = '#ffff00';
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 4;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('CAPSULE', 0, 0);
          ctx.restore();
          
          ctx.font = `bold ${Math.floor(itemSize * 0.14)}px Inter, system-ui`;
          ctx.fillStyle = '#4f46e5';
          ctx.shadowColor = 'transparent';
          ctx.textAlign = 'left';
          ctx.fillText(num.toString(), currentX + 15, y + 50);
          
          if (itemCode) {
            ctx.font = `bold ${Math.floor(itemSize * 0.09)}px monospace`;
            ctx.fillStyle = '#4f46e5';
            ctx.fillText(itemCode, currentX + 15, y + 80);
          }
          
          currentX += itemSize + padding;
          col++;
          if (col >= itemsPerRow) {
            col = 0;
            currentX = padding;
            y += itemSize + padding;
          }
        }
        if (col !== 0) y += itemSize + padding;
        return y;
      }
      
      if (figures.length > 0) {
        currentY = await drawGroup(figures, lang === 'ru' ? 'ФИГУРКИ' : 'FIGURES', currentY);
        currentY += padding;
      }
      if (extras.length > 0) {
        currentY = await drawGroup(extras, lang === 'ru' ? 'ДОПЫ' : 'EXTRAS', currentY);
        currentY += padding;
      }
      if (variants.length > 0) {
        currentY = await drawGroup(variants, lang === 'ru' ? 'ВАРИАНТЫ' : 'VARIANTS', currentY);
        currentY += padding;
      }
      
      const jpegData = canvas.toDataURL('image/jpeg', 0.95);
      resolve(jpegData);
    } catch (error) {
      console.error('Ошибка создания коллажа:', error);
      reject(error);
    }
  });
}

// ===== СКАЧИВАНИЕ ЧЕК-ЛИСТА (ИСПРАВЛЕННАЯ ВЕРСИЯ) =====
async function downloadCollage(seriesId, seriesName) {
  try {
    const lang = localStorage.getItem("lang") || "ru";
    showLoadingToast(lang === 'ru' ? 'Генерация чек-листа...' : 'Generating checklist...');
    
    const series = await loadSeriesById(seriesId);
    if (!series) {
      showError(lang === 'ru' ? 'Ошибка загрузки серии' : 'Error loading series');
      hideLoadingToast();
      return;
    }
    
    const figures = series.figures || [];
    const extras = series.extras || [];
    const variants = series.variants || [];
    
    if (figures.length === 0 && extras.length === 0 && variants.length === 0) {
      showError(lang === 'ru' ? 'Нет элементов для чек-листа' : 'No items for checklist');
      hideLoadingToast();
      return;
    }
    
    const jpegData = await generateCollage(seriesId, series.name, figures, extras, variants, lang);
    const base64Data = jpegData.split(',')[1];
    const safeName = seriesName.replace(/[^a-zа-яё0-9]/gi, '_');
    const fileName = `checklist_${safeName}_${Date.now()}.jpg`;
    
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      console.log('✅ Capacitor нативная платформа для чек-листа');
      
      if (window.FileHelper) {
        try {
          console.log('✅ Используем нативный FileHelper для чек-листа');
          
          const savedPath = await saveChecklistNative(base64Data, fileName);
          
          if (savedPath) {
            const msg = lang === 'ru'
              ? `✅ Чек-лист сохранен в галерею!\n\n📁 Путь: ${savedPath}\n\nПроверьте галерею или папку "Капсула"`
              : `✅ Checklist saved to gallery!\n\n📁 Path: ${savedPath}\n\nCheck gallery or "Капсула" folder`;
            
            alert(msg);
            hideLoadingToast();
            showSuccess('✅ Чек-лист сохранен в галерею');
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
          console.log('📁 Пробуем Filesystem для чек-листа...');
          
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
              
              console.log(`✅ Чек-лист сохранен в ${d.name}:`, result.uri);
              
              const msg = lang === 'ru'
                ? `✅ Чек-лист сохранен!\n\n📁 Папка: ${d.name}\n📄 Файл: ${fileName}`
                : `✅ Checklist saved!\n\n📁 Folder: ${d.name}\n📄 File: ${fileName}`;
              
              alert(msg);
              
              if (Share) {
                try {
                  await Share.share({
                    title: 'Чек-лист',
                    text: `Чек-лист серии ${seriesName}`,
                    url: result.uri,
                    dialogTitle: 'Открыть файл'
                  });
                } catch (shareError) {
                  console.warn('Share не доступен:', shareError);
                }
              }
              
              hideLoadingToast();
              showSuccess(`✅ Чек-лист сохранен в ${d.name}`);
              return;
              
            } catch (dirError) {
              console.warn(`❌ Не удалось сохранить в ${d.name}:`, dirError.message);
            }
          }
        }
      } catch (fsError) {
        console.error('❌ Ошибка Filesystem:', fsError);
      }
      
      throw new Error('Не удалось сохранить чек-лист. Попробуйте другой метод.');
    }
    
    console.log('🌐 Используем браузерный fallback для чек-листа');
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
  }
}

// ===== ОБРАБОТКА ГЛУБОКИХ ССЫЛОК ДЛЯ QR-КОДОВ =====
function handleDeepLink() {
    // Проверяем URL на наличие параметра id
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    // Также проверяем hash (для ссылок вида #figure-xxx)
    const hash = window.location.hash;
    const figureMatch = hash.match(/figure-([^&]+)/);
    
    console.log('📱 Обработка глубокой ссылки:', { id, hash, figureMatch });
    
    if (id) {
        console.log('📱 Открыто через глубокую ссылку, серия:', id);
        // Перенаправляем на страницу серии
        setTimeout(() => {
            window.location.href = `series.html?id=${id}`;
        }, 100);
        return true;
    }
    
    if (figureMatch) {
        const figureId = figureMatch[1];
        console.log('📱 Открыто через глубокую ссылку, фигурка:', figureId);
        // Перенаправляем на страницу фигурки (нужно найти серию)
        // В данном случае просто показываем сообщение
        showSuccess(`🔍 Открыта фигурка: ${figureId}`);
        return true;
    }
    
    return false;
}

// Вызываем при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Если это главная страница, проверяем глубокие ссылки
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        handleDeepLink();
    }
});

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  initLangFromUrl();
  const path = window.location.pathname;
  
  try {
    if (path.includes('catalog.html')) {
      initCatalog();
    } else if (path.includes('series.html')) {
      initSeries();
    } else if (path.includes('figure.html')) {
      initFigure();
    } else if (path.includes('mycollection.html')) {
      initMyCollection();
    } else if (path.includes('forsale.html')) {
      initForSale();
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

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('✅ Service Worker зарегистрирован:', registration.scope);
      })
      .catch(function(error) {
        console.log('❌ Ошибка регистрации Service Worker:', error);
      });
  });
}