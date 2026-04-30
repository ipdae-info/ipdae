/**
 * 군 입대 신청 모아보기 - Application Logic
 *
 * 데이터 구조: 행은 그룹(group)으로 묶이며, 같은 그룹은 하나의 카드로 표시됨.
 * 카드 클릭 시 해당 그룹의 모든 행이 모달에 표시됨.
 */

// ===== 상태 =====
const state = {
  groups: [],          // 그룹화된 카드 목록
  filteredGroups: [],  // 현재 필터링된 그룹 (이벤트 위임용)
  filters: {
    branch: 'all',
    search: '',
  },
  sortBy: 'enlist',
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
// 그룹의 신청/입영 일자 범위는 항목들의 min~max로 자동 계산
function groupRows(rows) {
  const map = new Map();

  rows.forEach(row => {
    if (!row.item && !row.groupTitle) return;  // 유효하지 않은 행 제외

    const key = `${row.branch}::${row.group || row.groupTitle || row.item}`;

    if (!map.has(key)) {
      map.set(key, {
        branch: row.branch,
        groupId: row.group,
        title: row.groupTitle || row.item,
        link: row.link,
        items: [],
      });
    }

    const group = map.get(key);
    // link가 비어있던 그룹에 link 있는 행 추가되면 채움
    if (!group.link && row.link) group.link = row.link;

    group.items.push({
      item: row.item,
      applyStart: row.applyStart,
      applyEnd: row.applyEnd,
      enlistStart: row.enlistStart,
      enlistEnd: row.enlistEnd,
      _applyStartObj: row._applyStartObj,
      _applyEndObj: row._applyEndObj,
      _enlistStartObj: row._enlistStartObj,
    });
  });

  // 각 그룹의 통합 일자 범위 계산
  const groups = Array.from(map.values());
  groups.forEach(g => {
    g.applyStart = computeMinDateStr(g.items, 'applyStart');
    g.applyEnd = computeMaxDateStr(g.items, 'applyEnd', 'applyStart');
    g.enlistStart = computeMinDateStr(g.items, 'enlistStart');
    g.enlistEnd = computeMaxDateStr(g.items, 'enlistEnd', 'enlistStart');

    // 정렬용 Date 객체
    g._applyStartObj = parseDate(g.applyStart);
    g._applyEndObj = parseDate(g.applyEnd) || parseDate(g.applyStart);
    g._enlistStartObj = parseDate(g.enlistStart);
  });

  return groups;
}

// 그룹 내 항목들에서 가장 빠른 날짜 문자열 반환
function computeMinDateStr(items, field) {
  let minDate = null;
  let minStr = '';
  items.forEach(item => {
    const str = item[field];
    if (!str) return;
    const d = parseDate(str);
    if (!d) return;
    if (!minDate || d < minDate) {
      minDate = d;
      minStr = str;
    }
  });
  return minStr;
}

// 그룹 내 항목들에서 가장 늦은 날짜 문자열 반환 (endField 우선, 없으면 startField)
function computeMaxDateStr(items, endField, startField) {
  let maxDate = null;
  let maxStr = '';
  items.forEach(item => {
    // end 우선, 없으면 start 사용
    const str = item[endField] || item[startField];
    if (!str) return;
    const d = parseDate(str);
    if (!d) return;
    if (!maxDate || d > maxDate) {
      maxDate = d;
      maxStr = str;
    }
  });
  return maxStr;
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

  // 카드 클릭 (이벤트 위임)
  els.grid.addEventListener('click', e => {
    const cardEl = e.target.closest('.card');
    if (!cardEl) return;
    e.preventDefault();
    const idx = parseInt(cardEl.dataset.idx, 10);
    if (isNaN(idx)) return;
    const group = state.filteredGroups?.[idx];
    if (group) openModal(group);
  });

  // 모달 닫기 이벤트
  els.modalClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });
  els.modalBackdrop.addEventListener('click', closeModal);
  // 모달 내부 클릭은 닫기 차단 (헤더 등 클릭 시 닫히지 않게)
  els.modal.addEventListener('click', (e) => {
    if (e.target === els.modal) closeModal();
  });
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

  // 현재 필터된 그룹을 저장 (이벤트 위임용)
  state.filteredGroups = filtered;

  if (filtered.length === 0) {
    els.grid.innerHTML = '';
    els.empty.hidden = false;
    return;
  }

  els.empty.hidden = true;
  els.grid.innerHTML = filtered.map((g, i) => renderCard(g, i)).join('');
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
    <button type="button" class="card" data-branch="${safeBranch}" data-idx="${idx}" style="animation-delay: ${Math.min(idx * 0.04, 0.4)}s">
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
  const first = group.items[0];
  const allSameDates = group.items.every(item =>
    item.applyStart === first.applyStart &&
    item.applyEnd === first.applyEnd &&
    item.enlistStart === first.enlistStart &&
    item.enlistEnd === first.enlistEnd
  );

  els.modalBody.innerHTML = renderModalBody(group, itemLabel, allSameDates);

  // 푸터 링크
  if (group.link) {
    els.modalLink.href = group.link;
    els.modalLink.style.display = 'inline-flex';
  } else {
    els.modalLink.style.display = 'none';
  }

  // 스크롤바 폭 측정 → 화면 흔들림 방지
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');

  // 모달 표시
  els.modal.hidden = false;
  els.modalBackdrop.hidden = false;
  els.modalBackdrop.style.display = 'block';
  els.modal.style.display = 'flex';
  document.body.classList.add('modal-open');
}

function renderModalBody(group, itemLabel, allSameDates) {
  // 항목이 1개거나 카투사처럼 단일 정보면 → 단일 정보 카드
  if (group.items.length === 1) {
    return renderSingleDetail(group, itemLabel);
  }

  // 항상 표 형식으로 표시
  return renderTableView(group, itemLabel, allSameDates);
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
  // 모든 일정이 같으면 항목들을 한 줄에 콤마로 나열
  if (allSameDates) {
    const itemsList = group.items
      .map(item => escapeHTML(item.item || ''))
      .filter(Boolean)
      .join(', ');

    return `
      <table class="detail-table">
        <thead>
          <tr>
            <th>${escapeHTML(itemLabel)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="col-items">${itemsList}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // 일정이 다르면 같은 일정끼리 묶어서 표시
  const dateGroups = new Map();
  group.items.forEach(item => {
    const key = `${item.applyStart}|${item.applyEnd}|${item.enlistStart}|${item.enlistEnd}`;
    if (!dateGroups.has(key)) {
      dateGroups.set(key, {
        applyStart: item.applyStart,
        applyEnd: item.applyEnd,
        enlistStart: item.enlistStart,
        enlistEnd: item.enlistEnd,
        items: [],
        _sortDate: item._applyStartObj,
      });
    }
    dateGroups.get(key).items.push(item.item);
  });

  // 신청일자 빠른 순으로 정렬
  const sortedDateGroups = Array.from(dateGroups.values()).sort((a, b) => {
    if (!a._sortDate && !b._sortDate) return 0;
    if (!a._sortDate) return 1;
    if (!b._sortDate) return -1;
    return a._sortDate - b._sortDate;
  });

  // 모든 항목의 입영일자가 동일한지 체크 (동일하면 입영일자 컬럼 생략)
  const enlistDatesAllSame = sortedDateGroups.every(dg =>
    dg.enlistStart === sortedDateGroups[0].enlistStart &&
    dg.enlistEnd === sortedDateGroups[0].enlistEnd
  );

  // 헤더 구성 (No. 컬럼 제거, 항목 컬럼이 먼저)
  const headers = enlistDatesAllSame
    ? `<th>${escapeHTML(itemLabel)}</th><th class="col-date">신청일자</th>`
    : `<th>${escapeHTML(itemLabel)}</th><th class="col-date">신청일자</th><th class="col-date">입영일자</th>`;

  const rows = sortedDateGroups.map(dg => {
    const applyText = escapeHTML(formatDateRange(dg.applyStart, dg.applyEnd));
    const enlistText = escapeHTML(formatDateRange(dg.enlistStart, dg.enlistEnd));
    const itemsList = dg.items.map(it => escapeHTML(it)).join(', ');

    if (enlistDatesAllSame) {
      return `
        <tr>
          <td class="col-items">${itemsList}</td>
          <td class="col-date">${applyText}</td>
        </tr>
      `;
    }
    return `
      <tr>
        <td class="col-items">${itemsList}</td>
        <td class="col-date">${applyText}</td>
        <td class="col-date">${enlistText}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="detail-table">
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function closeModal() {
  els.modal.hidden = true;
  els.modalBackdrop.hidden = true;
  els.modal.style.display = 'none';
  els.modalBackdrop.style.display = 'none';
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
