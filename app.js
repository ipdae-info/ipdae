/**
 * 군 입대 모집 공고 - Application Logic
 */

// ===== 상태 =====
const state = {
  notices: [],
  filters: {
    branch: 'all',
    category: 'all',
    search: '',
  },
  sortBy: 'enlist',  // 'enlist' (입영일자순, 기본) 또는 'apply' (신청일자순)
};

// ===== DOM =====
const els = {
  grid: document.getElementById('cardGrid'),
  loading: document.getElementById('loadingState'),
  empty: document.getElementById('emptyState'),
  search: document.getElementById('searchInput'),
  branchChips: document.querySelectorAll('#branchFilter .chip'),
  categoryChips: document.querySelectorAll('#categoryFilter .chip'),
  sortBtns: document.querySelectorAll('.sort-btn'),
  visibleCount: document.getElementById('visibleCount'),
};

// ===== Init =====
init();

async function init() {
  bindEvents();

  try {
    const data = await loadNotices();
    state.notices = data;
    render();
  } catch (err) {
    console.error('데이터 로드 실패:', err);
    showError(err.message);
  }
}

// ===== 데이터 로드 =====
async function loadNotices() {
  if (CONFIG.USE_DUMMY_DATA || !CONFIG.SHEET_CSV_URL || CONFIG.SHEET_CSV_URL.includes('YOUR_PUBLISHED_CSV_URL')) {
    console.warn('⚠️ 더미 데이터 사용 중. config.js에서 SHEET_CSV_URL을 설정하고 USE_DUMMY_DATA를 false로 바꾸세요.');
    return Promise.resolve(DUMMY_DATA.map(normalize));
  }

  const cached = getCache();
  if (cached) return cached;

  const res = await fetch(CONFIG.SHEET_CSV_URL);
  if (!res.ok) throw new Error(`시트 로드 실패 (${res.status})`);

  const text = await res.text();
  const data = parseCSV(text).map(normalize);

  setCache(data);
  return data;
}

// ===== CSV 파서 =====
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || '').trim();
    });
    return row;
  });
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === ',' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

// ===== 데이터 정규화 =====
function normalize(row) {
  return {
    branch: row.branch || '',
    category: row.category || '모집',
    mos: row.mos || '',
    applyStart: row.applyStart || '',
    applyEnd: row.applyEnd || '',
    enlistStart: row.enlistStart || '',
    enlistEnd: row.enlistEnd || '',
    link: row.link || '#',
    _applyStartObj: parseDate(row.applyStart),
    _applyEndObj: parseDate(row.applyEnd) || parseDate(row.applyStart),
    _enlistStartObj: parseDate(row.enlistStart),
  };
}

function parseDate(str) {
  if (!str) return null;
  // YYYY.MM.DD, YYYY-MM-DD, YYYY/MM/DD
  let match = str.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    if (y === '0000') return null;
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  // YYYY.MM (일 없음) - 월 마지막 날로 처리 (마감 비교용)
  match = str.match(/(\d{4})[.\-\/](\d{1,2})/);
  if (match) {
    const [, y, m] = match;
    if (y === '0000') return null;
    return new Date(parseInt(y), parseInt(m), 0); // 다음달 0일 = 이번달 마지막 날
  }
  return null;
}

// ===== 날짜 범위 포맷 =====
// 시작과 끝이 같거나 끝이 비어있으면 하나만, 다르면 "시작 ~ 끝"
function formatDateRange(start, end) {
  if (!start) return '미정';
  if (!end || normalizeDate(start) === normalizeDate(end)) {
    return start;
  }
  return `${start} ~ ${end}`;
}

// 비교용 정규화 (구분자 통일)
function normalizeDate(str) {
  return str.replace(/[\-\/]/g, '.').trim();
}

// ===== 캐시 =====
function getCache() {
  try {
    const raw = sessionStorage.getItem('notices_cache');
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CONFIG.CACHE_MINUTES * 60 * 1000) return null;
    return data.map(normalize);
  } catch { return null; }
}

function setCache(data) {
  try {
    sessionStorage.setItem('notices_cache', JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

// ===== 이벤트 =====
function bindEvents() {
  els.search.addEventListener('input', e => {
    state.filters.search = e.target.value.trim().toLowerCase();
    render();
  });

  els.branchChips.forEach(chip => {
    chip.addEventListener('click', () => {
      els.branchChips.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');
      state.filters.branch = chip.dataset.value;
      render();
    });
  });

  els.categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      els.categoryChips.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');
      state.filters.category = chip.dataset.value;
      render();
    });
  });

  els.sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      els.sortBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      state.sortBy = btn.dataset.sort;
      render();
    });
  });
}

// ===== 필터링 =====
function getFilteredNotices() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return state.notices
    .filter(n => {
      // 지난 공고 숨김 (신청 마감일 기준, 마감 없으면 시작일 기준)
      if (CONFIG.HIDE_PAST_NOTICES && n._applyEndObj) {
        if (n._applyEndObj < today) return false;
      }

      // 군 필터
      if (state.filters.branch !== 'all' && n.branch !== state.filters.branch) return false;

      // 구분 필터
      if (state.filters.category !== 'all' && n.category !== state.filters.category) return false;

      // 검색
      if (state.filters.search) {
        const haystack = `${n.branch} ${n.category} ${n.mos}`.toLowerCase();
        if (!haystack.includes(state.filters.search)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // 정렬 기준 선택: 입영 시작일 또는 신청 시작일
      const aDate = state.sortBy === 'enlist' ? a._enlistStartObj : a._applyStartObj;
      const bDate = state.sortBy === 'enlist' ? b._enlistStartObj : b._applyStartObj;

      // 날짜 없는 항목은 뒤로
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;

      return aDate - bDate;
    });
}

// ===== 렌더링 =====
function render() {
  const filtered = getFilteredNotices();

  els.loading.style.display = 'none';
  els.visibleCount.textContent = filtered.length;

  if (filtered.length === 0) {
    els.grid.innerHTML = '';
    els.empty.hidden = false;
    return;
  }

  els.empty.hidden = true;
  els.grid.innerHTML = filtered.map((n, i) => renderCard(n, i)).join('');
}

function renderCard(n, idx) {
  const isUrgent = isApplyUrgent(n._applyEndObj);
  const safeBranch = escapeHTML(n.branch);
  const safeCategory = escapeHTML(n.category);
  const safeMos = escapeHTML(n.mos);
  const safeApply = escapeHTML(formatDateRange(n.applyStart, n.applyEnd));
  const safeEnlist = escapeHTML(formatDateRange(n.enlistStart, n.enlistEnd));
  const safeLink = n.link && n.link !== '#' ? escapeAttr(n.link) : '';

  const isDraft = n.category === '징집';
  const linkAttrs = safeLink
    ? `href="${safeLink}" target="_blank" rel="noopener noreferrer"`
    : `href="#" onclick="event.preventDefault()"`;

  return `
    <a class="card" data-branch="${safeBranch}" ${linkAttrs} style="animation-delay: ${Math.min(idx * 0.04, 0.4)}s">
      <div class="card-header">
        <span class="branch-tag">${safeBranch}</span>
        <span class="category-tag ${isDraft ? 'draft' : ''}">${safeCategory}</span>
      </div>

      <div class="card-mos">${safeMos}</div>

      <div class="card-divider"></div>

      <div class="card-dates">
        <div class="date-block">
          <span class="date-label">신청일자</span>
          <span class="date-value ${isUrgent ? 'urgent' : ''}">${safeApply}</span>
        </div>
        <div class="date-block">
          <span class="date-label">입영일자</span>
          <span class="date-value">${safeEnlist}</span>
        </div>
      </div>

      <div class="card-footer">
        <span class="verify-label">📌 공식 공지에서 재확인 필수</span>
      </div>
    </a>
  `;
}

function isApplyUrgent(date) {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = (date - today) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

function showError(msg) {
  els.loading.style.display = 'none';
  els.grid.innerHTML = `
    <div class="error-state">
      <h3>데이터를 불러올 수 없습니다</h3>
      <p>${escapeHTML(msg)}</p>
    </div>
  `;
}

// ===== 보안 유틸 =====
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return escapeHTML(str);
}
