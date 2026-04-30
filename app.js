/**
 * 군 입대 신청 모아보기 - Application Logic
 *
 * 데이터 구조: 행은 그룹(group)으로 묶이며, 같은 그룹은 하나의 카드로 표시됨.
 * 카드 클릭 시 해당 그룹의 모든 행이 모달에 표시됨.
 */

// ===== 상태 =====
const state = {
  rows: [],          // 원본 행들 (정규화됨)
  groups: [],        // 그룹화된 카드 목록
  filters: {
    branch: 'all',
    search: '',
  },
  sortBy: 'enlist',
  modalViewMode: 'table',  // 'table' or 'inline'
};

// ===== DOM =====
const els = {
  grid: document.getElementById('cardGrid'),
  loading: document.getElementById('loadingState'),
  empty: document.getElementById('emptyState'),
  search: document.getElementById('searchInput'),
  branchChips: document.querySelectorAll('#branchFilter .chip'),
  sortBtns: document.querySelectorAll('.sort-btn'),
  visibleCount: document.getElementById('visibleCount'),
  // 모달
  modal: document.getElementById('modal'),
  modalBackdrop: document.getElementById('modalBackdrop'),
  modalClose: document.getElementById('modalClose'),
  modalBranch: document.getElementById('modalBranch'),
  modalTitle: document.getElementById('modalTitle'),
  modalMeta: document.getElementById('modalMeta'),
  modalBody: document.getElementById('modalBody'),
  modalLink: document.getElementById('modalLink'),
};

// ===== Init =====
init();

async function init() {
  bindEvents();

  try {
    const data = await loadNotices();
    state.rows = data;
    state.groups = groupRows(data);
    render();
  } catch (err) {
    console.error('데이터 로드 실패:', err);
    showError(err.message);
  }
}

// ===== 데이터 로드 =====
async function loadNotices() {
  if (CONFIG.USE_DUMMY_DATA) {
    console.warn('⚠️ 더미 데이터 사용 중. config.js에서 SHEETS의 url을 설정하고 USE_DUMMY_DATA를 false로 바꾸세요.');
    return DUMMY_DATA.map(normalize);
  }

  const cached = getCache();
  if (cached) return cached.map(normalize);

  if (!Array.isArray(CONFIG.SHEETS) || CONFIG.SHEETS.length === 0) {
    throw new Error('config.js의 SHEETS 배열이 비어있습니다.');
  }

  const results = await Promise.allSettled(
    CONFIG.SHEETS.map(async (sheet) => {
      if (!sheet.url || sheet.url.includes('YOUR_') || !sheet.url.startsWith('http')) {
        console.warn(`⚠️ ${sheet.branch} 시트 URL이 설정되지 않았습니다.`);
        return [];
      }

      try {
        const res = await fetch(sheet.url);
        if (!res.ok) {
          console.error(`❌ ${sheet.branch} 시트 로드 실패 (${res.status})`);
          return [];
        }
        const text = await res.text();
        const rows = parseCSV(text);

        return rows.map(row => ({
          ...row,
          branch: sheet.branch,
        }));
      } catch (err) {
        console.error(`❌ ${sheet.branch} 시트 에러:`, err);
        return [];
      }
    })
  );

  const allRows = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

  if (allRows.length === 0) {
    console.warn('⚠️ 모든 시트가 비어있거나 로드에 실패했습니다.');
  }

  setCache(allRows);
  return allRows.map(normalize);
}

// ===== CSV 파서 =====
function parseCSV(text) {
  if (!text || typeof text !== 'string') return [];
  text = text.replace(/^\uFEFF/, '');

  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^\uFEFF/, ''));

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || '').trim();
    });
    return row;
  }).filter(row => {
    return Object.values(row).some(v => v && String(v).trim());
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
  if (!row || typeof row !== 'object') row = {};

  return {
    branch: (row.branch || '').trim(),
    group: (row.group || '').trim(),
    groupTitle: (row.groupTitle || '').trim(),
    item: (row.item || '').trim(),
    applyStart: (row.applyStart || '').trim(),
    applyEnd: (row.applyEnd || '').trim(),
    enlistStart: (row.enlistStart || '').trim(),
    enlistEnd: (row.enlistEnd || '').trim(),
    link: (row.link || '').trim(),
    _applyStartObj: parseDate(row.applyStart),
    _applyEndObj: parseDate(row.applyEnd) || parseDate(row.applyStart),
    _enlistStartObj: parseDate(row.enlistStart),
  };
}

function parseDate(str) {
  if (!str) return null;
  let match = str.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    if (y === '0000') return null;
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  match = str.match(/(\d{4})[.\-\/](\d{1,2})/);
  if (match) {
    const [, y, m] = match;
    if (y === '0000') return null;
    return new Date(parseInt(y), parseInt(m), 0);
  }
  return null;
}

// ===== 행 → 그룹 변환 =====
// 같은 (branch, group) 조합의 행들을 하나의 그룹으로 묶음
function groupRows(rows) {
  const map = new Map();

  rows.forEach(row => {
    if (!row.item && !row.groupTitle) return;  // 유효하지 않은 행 제외

    const key = `${row.branch}::${row.group || row.groupTitle || row.item}`;

    if (!map.has(key)) {
      map.set(key, {
        branch: row.branch,
        groupId: row.group,
        title: row.groupTitle || row.item,  // groupTitle 없으면 item을 제목으로
        applyStart: row.applyStart,
        applyEnd: row.applyEnd,
        enlistStart: row.enlistStart,
        enlistEnd: row.enlistEnd,
        link: row.link,
        _applyStartObj: row._applyStartObj,
        _applyEndObj: row._applyEndObj,
        _enlistStartObj: row._enlistStartObj,
        items: [],
      });
    }

    const group = map.get(key);
    group.items.push({
      item: row.item,
      applyStart: row.applyStart,
      applyEnd: row.applyEnd,
      enlistStart: row.enlistStart,
      enlistEnd: row.enlistEnd,
    });
  });

  return Array.from(map.values());
}

// ===== 날짜 범위 포맷 =====
function formatDateRange(start, end) {
  if (!start) return '미정';
  if (!end || normalizeDateStr(start) === normalizeDateStr(end)) return start;
  return `${start} ~ ${end}`;
}

function normalizeDateStr(str) {
  return str.replace(/[\-\/]/g, '.').trim();
}

// ===== 캐시 =====
function getCache() {
  try {
    const raw = sessionStorage.getItem('notices_cache');
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CONFIG.CACHE_MINUTES * 60 * 1000) return null;
    return data;
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

  // 모달 닫기 이벤트
  els.modalClose.addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !els.modal.hidden) closeModal();
  });
}

// ===== 필터링 =====
function getFilteredGroups() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return state.groups
    .filter(g => {
      // 지난 공고 숨김
      if (CONFIG.HIDE_PAST_NOTICES && g._applyEndObj) {
        if (g._applyEndObj < today) return false;
      }

      // 소속 필터
      if (state.filters.branch !== 'all' && g.branch !== state.filters.branch) return false;

      // 검색 (제목 + 모든 item 검색)
      if (state.filters.search) {
        const itemsText = g.items.map(i => i.item).join(' ');
        const haystack = `${g.branch} ${g.title} ${itemsText}`.toLowerCase();
        if (!haystack.includes(state.filters.search)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const aDate = state.sortBy === 'enlist' ? a._enlistStartObj : a._applyStartObj;
      const bDate = state.sortBy === 'enlist' ? b._enlistStartObj : b._applyStartObj;

      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate - bDate;
    });
}

// ===== 렌더링 =====
function render() {
  const filtered = getFilteredGroups();

  els.loading.style.display = 'none';
  els.visibleCount.textContent = filtered.length;

  if (filtered.length === 0) {
    els.grid.innerHTML = '';
    els.empty.hidden = false;
    return;
  }

  els.empty.hidden = true;
  els.grid.innerHTML = filtered.map((g, i) => renderCard(g, i)).join('');

  // 카드 클릭 이벤트 바인딩
  els.grid.querySelectorAll('.card').forEach((cardEl, idx) => {
    cardEl.addEventListener('click', e => {
      e.preventDefault();
      openModal(filtered[idx]);
    });
  });
}

function renderCard(g, idx) {
  const isUrgent = isApplyUrgent(g._applyEndObj);
  const safeBranch = escapeHTML(g.branch);
  const safeTitle = escapeHTML(g.title);
  const safeApply = escapeHTML(formatDateRange(g.applyStart, g.applyEnd));
  const safeEnlist = escapeHTML(formatDateRange(g.enlistStart, g.enlistEnd));

  // 카드 부제: 첫 항목 + (외 N개)
  const itemsCount = g.items.length;
  let summary = '';
  if (itemsCount > 0) {
    const firstItem = escapeHTML(g.items[0].item);
    if (itemsCount > 1) {
      summary = `${firstItem} 외 ${itemsCount - 1}개`;
    } else {
      summary = firstItem;
    }
  }

  // 항목 개수 뱃지
  const countBadge = itemsCount > 1
    ? `<span class="count-badge">${itemsCount}개 항목</span>`
    : '';

  return `
    <button type="button" class="card" data-branch="${safeBranch}" style="animation-delay: ${Math.min(idx * 0.04, 0.4)}s">
      <div class="card-header">
        <span class="branch-tag">${safeBranch}</span>
        ${countBadge}
      </div>

      <div class="card-mos">${safeTitle}</div>
      ${summary ? `<div class="card-summary">${summary}</div>` : ''}

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
        <span class="verify-label">📌 자세히 보기 · 공식 공지 확인</span>
      </div>
    </button>
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

// ===== 모달 =====
function openModal(group) {
  // 모달 헤더
  els.modalBranch.textContent = group.branch;
  els.modalTitle.textContent = group.title;

  const applyText = formatDateRange(group.applyStart, group.applyEnd);
  const enlistText = formatDateRange(group.enlistStart, group.enlistEnd);
  els.modalMeta.innerHTML = `
    <strong>신청</strong> ${escapeHTML(applyText)}
    &nbsp;·&nbsp;
    <strong>입영</strong> ${escapeHTML(enlistText)}
  `;

  // 모달 본문
  const sheetConfig = CONFIG.SHEETS.find(s => s.branch === group.branch);
  const itemLabel = sheetConfig?.itemLabel || '항목';

  // 항목별 일정이 모두 동일한지 확인 (단일 그룹인지 vs 항목별로 다른 그룹인지)
  const allSameDates = group.items.every(item =>
    item.enlistStart === group.items[0].enlistStart &&
    item.enlistEnd === group.items[0].enlistEnd
  );

  els.modalBody.innerHTML = renderModalBody(group, itemLabel, allSameDates);

  // 항목이 1개면 토글 숨김 (의미 없음)
  if (group.items.length <= 1) {
    const toggle = els.modalBody.querySelector('.view-toggle');
    if (toggle) toggle.style.display = 'none';
  }

  // 토글 버튼 이벤트
  els.modalBody.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.modalViewMode = btn.dataset.mode;
      els.modalBody.innerHTML = renderModalBody(group, itemLabel, allSameDates);
      bindViewToggle(group, itemLabel, allSameDates);
    });
  });

  // 푸터 링크
  if (group.link) {
    els.modalLink.href = group.link;
    els.modalLink.style.display = 'inline-flex';
  } else {
    els.modalLink.style.display = 'none';
  }

  // 모달 표시
  els.modal.hidden = false;
  els.modalBackdrop.hidden = false;
  document.body.classList.add('modal-open');
}

function bindViewToggle(group, itemLabel, allSameDates) {
  els.modalBody.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.modalViewMode = btn.dataset.mode;
      els.modalBody.innerHTML = renderModalBody(group, itemLabel, allSameDates);
      bindViewToggle(group, itemLabel, allSameDates);
    });
  });
}

function renderModalBody(group, itemLabel, allSameDates) {
  // 항목이 1개거나 카투사처럼 단일 정보면 → 단일 정보 카드
  if (group.items.length === 1) {
    return renderSingleDetail(group, itemLabel);
  }

  const tableActive = state.modalViewMode === 'table' ? 'active' : '';
  const inlineActive = state.modalViewMode === 'inline' ? 'active' : '';

  const toggle = `
    <div class="view-toggle">
      <button class="view-toggle-btn ${tableActive}" data-mode="table">표</button>
      <button class="view-toggle-btn ${inlineActive}" data-mode="inline">나열</button>
    </div>
  `;

  const content = state.modalViewMode === 'table'
    ? renderTableView(group, itemLabel, allSameDates)
    : renderInlineView(group, itemLabel);

  return toggle + content;
}

function renderSingleDetail(group, itemLabel) {
  const item = group.items[0];
  return `
    <div class="detail-single">
      <div class="detail-single-row">
        <span class="detail-single-label">${escapeHTML(itemLabel)}</span>
        <span class="detail-single-value">${escapeHTML(item.item || '-')}</span>
      </div>
      <div class="detail-single-row">
        <span class="detail-single-label">신청일자</span>
        <span class="detail-single-value">${escapeHTML(formatDateRange(item.applyStart, item.applyEnd))}</span>
      </div>
      <div class="detail-single-row">
        <span class="detail-single-label">입영일자</span>
        <span class="detail-single-value">${escapeHTML(formatDateRange(item.enlistStart, item.enlistEnd))}</span>
      </div>
    </div>
  `;
}

function renderTableView(group, itemLabel, allSameDates) {
  // 모든 일정이 같으면 항목만 보여주는 간단한 표
  if (allSameDates) {
    const rows = group.items.map((item, i) => `
      <tr>
        <td class="col-num">${i + 1}</td>
        <td>${escapeHTML(item.item || '-')}</td>
      </tr>
    `).join('');

    return `
      <table class="detail-table">
        <thead>
          <tr>
            <th class="col-num">No.</th>
            <th>${escapeHTML(itemLabel)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // 일정이 다르면 일정 컬럼도 함께
  const rows = group.items.map((item, i) => `
    <tr>
      <td class="col-num">${i + 1}</td>
      <td>${escapeHTML(item.item || '-')}</td>
      <td>${escapeHTML(formatDateRange(item.applyStart, item.applyEnd))}</td>
      <td>${escapeHTML(formatDateRange(item.enlistStart, item.enlistEnd))}</td>
    </tr>
  `).join('');

  return `
    <table class="detail-table">
      <thead>
        <tr>
          <th class="col-num">No.</th>
          <th>${escapeHTML(itemLabel)}</th>
          <th>신청일자</th>
          <th>입영일자</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderInlineView(group, itemLabel) {
  const items = group.items.map(i => escapeHTML(i.item)).filter(Boolean).join(', ');

  return `
    <div class="detail-inline">
      <span class="detail-inline-label">${escapeHTML(itemLabel)}:</span>
      <span class="detail-inline-items">${items}</span>
    </div>
  `;
}

function closeModal() {
  els.modal.hidden = true;
  els.modalBackdrop.hidden = true;
  document.body.classList.remove('modal-open');
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
