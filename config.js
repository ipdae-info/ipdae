/**
 * ============================================================
 *  설정 파일 (config.js)
 * ============================================================
 *
 *  📂 DB 구조: Google Sheets 1개 파일 + 6개 시트 탭
 *
 *  [입영공고 DB]
 *  ├── 탭 1: 육군_현역병      (지역별 공고)
 *  ├── 탭 2: 육군_모집병      (병과별 공고)
 *  ├── 탭 3: 해군             (병과별 공고)
 *  ├── 탭 4: 공군             (병과별 공고)
 *  ├── 탭 5: 해병대           (병과별 공고)
 *  └── 탭 6: 카투사           (단일 공고)
 *
 * ============================================================
 *
 *  📋 시트 구조 (그룹 묶음 방식)
 *
 *  같은 group ID = 하나의 카드 (그룹 내 행들은 일정이 같다고 가정)
 *  카드 클릭 시 해당 그룹의 모든 행이 모달 표에 표시됨
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  [육군_현역병 시트] - 지역 기반
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  헤더: group | groupTitle | item | applyStart | applyEnd | enlistStart | enlistEnd | link
 *
 *  예시:
 *  G001 | 2026년 7월 본인선택 입영 | 서울 | 2026.05.01 | 2026.05.07 | 2026.07.06 |  | https://...
 *  G001 | 2026년 7월 본인선택 입영 | 경기 | 2026.05.01 | 2026.05.07 | 2026.07.13 |  | https://...
 *  G001 | 2026년 7월 본인선택 입영 | 부산 | 2026.05.01 | 2026.05.07 | 2026.07.20 |  | https://...
 *
 *  → 카드 1장: "2026년 7월 본인선택 입영" / 모달에 지역별 표
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  [육군_모집병 / 해군 / 공군 / 해병대 시트] - 병과 기반
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  헤더: group | groupTitle | item | applyStart | applyEnd | enlistStart | enlistEnd | link
 *
 *  예시 (육군_모집병):
 *  G001 | 2026년 7월 기술행정병 | 운전병       | 2026.05.01 | 2026.05.10 | 2026.07.15 |  | https://...
 *  G001 | 2026년 7월 기술행정병 | 감시장비운용병 | 2026.05.01 | 2026.05.10 | 2026.07.15 |  | https://...
 *  G001 | 2026년 7월 기술행정병 | 의무병       | 2026.05.01 | 2026.05.10 | 2026.07.15 |  | https://...
 *  G002 | 2026년 8월 전문특기병 | 어학병       | 2026.06.01 | 2026.06.10 | 2026.08.18 |  | https://...
 *  G002 | 2026년 8월 전문특기병 | JSA경비병    | 2026.06.01 | 2026.06.10 | 2026.08.18 |  | https://...
 *
 *  → 카드 2장:
 *     · "2026년 7월 기술행정병" (병과 3개)
 *     · "2026년 8월 전문특기병" (병과 2개)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  [카투사 시트] - 단일 항목
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  헤더는 동일. group과 item은 같은 값으로 입력 (또는 item 비움)
 *
 *  G001 | 2027년 입영 카투사 | KATUSA | 2026.09.10 | 2026.09.16 | 2027.02 | 2027.11 | https://...
 *
 *  → 카드 1장: "2027년 입영 카투사" / 모달에 단일 정보
 *
 * ============================================================
 *
 *  📝 컬럼 설명
 *  - group       : 그룹 ID (G001, G002 등 자유롭게)
 *  - groupTitle  : 카드에 표시될 공고 제목
 *  - item        : 세부 항목 (지역명, 병과명 등)
 *  - applyStart  : 신청 시작일 (2026.05.01)
 *  - applyEnd    : 신청 마감일 (단일이면 비움)
 *  - enlistStart : 입영 시작일
 *  - enlistEnd   : 입영 마감일 (단일이면 비움)
 *  - link        : 공식 공지 URL (그룹 내에서 동일)
 *
 *  ⚠️ 같은 group 안의 행들은 일정이 같아야 자연스럽습니다.
 *     일정이 다르면 group ID를 분리하세요.
 *
 * ============================================================
 *
 *  📡 게시 방법
 *  1. Google Sheets에서 파일 → 공유 → 웹에 게시
 *  2. 첫 드롭다운: 시트 탭 선택
 *  3. 두 번째: "쉼표로 구분된 값(.csv)"
 *  4. 게시 → URL 복사 (output=csv 로 끝남)
 *  5. 6개 탭에 대해 반복
 *
 * ============================================================
 */

const CONFIG = {
  /**
   * 시트별 CSV URL 매핑
   */
  SHEETS: [
    { branch: '육군 현역병', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=141518284&single=true&output=csv', itemLabel: '지역' },
    { branch: '육군 모집병', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=0&single=true&output=csv',    itemLabel: '병과' },
    { branch: '해군',       url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=1514166856&single=true&output=csv',           itemLabel: '병과' },
    { branch: '공군',       url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=2043380112&single=true&output=csv',       itemLabel: '병과' },
    { branch: '해병대',     url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=1319193307&single=true&output=csv',         itemLabel: '병과' },
    { branch: '카투사',     url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=1720311161&single=true&output=csv',         itemLabel: '구분' },
  ],

  // 테스트용 더미 데이터 사용 (실제 운영 시 false)
  USE_DUMMY_DATA: false,

  // 지난 공고 자동 숨김 (신청 마감일 기준)
  HIDE_PAST_NOTICES: true,

  // 캐시 시간 (분)
  CACHE_MINUTES: 5,
};

// ============================================================
// 더미 데이터 (테스트용)
// ============================================================
const DUMMY_DATA = [
  // ===== 육군 현역병 (지역별 - 여러 행 유지) =====
  { branch: '육군 현역병', group: 'G001', groupTitle: '2026년 7월 본인선택 입영', item: '서울', applyStart: '2026.05.01', applyEnd: '2026.05.07', enlistStart: '2026.07.06', enlistEnd: '', link: 'https://www.mma.go.kr/' },
  { branch: '육군 현역병', group: 'G001', groupTitle: '2026년 7월 본인선택 입영', item: '경기북부, 인천', applyStart: '2026.05.01', applyEnd: '2026.05.07', enlistStart: '2026.07.13', enlistEnd: '', link: 'https://www.mma.go.kr/' },
  { branch: '육군 현역병', group: 'G001', groupTitle: '2026년 7월 본인선택 입영', item: '경기남부', applyStart: '2026.05.01', applyEnd: '2026.05.07', enlistStart: '2026.07.13', enlistEnd: '', link: 'https://www.mma.go.kr/' },
  { branch: '육군 현역병', group: 'G001', groupTitle: '2026년 7월 본인선택 입영', item: '부산, 경남', applyStart: '2026.05.01', applyEnd: '2026.05.07', enlistStart: '2026.07.20', enlistEnd: '', link: 'https://www.mma.go.kr/' },
  { branch: '육군 현역병', group: 'G001', groupTitle: '2026년 7월 본인선택 입영', item: '대구, 경북', applyStart: '2026.05.01', applyEnd: '2026.05.07', enlistStart: '2026.07.20', enlistEnd: '', link: 'https://www.mma.go.kr/' },
  { branch: '육군 현역병', group: 'G002', groupTitle: '2026년 8월 본인선택 입영', item: '서울, 인천', applyStart: '2026.06.05', applyEnd: '2026.06.12', enlistStart: '2026.08.10', enlistEnd: '', link: 'https://www.mma.go.kr/' },
  { branch: '육군 현역병', group: 'G002', groupTitle: '2026년 8월 본인선택 입영', item: '경기, 강원', applyStart: '2026.06.05', applyEnd: '2026.06.12', enlistStart: '2026.08.17', enlistEnd: '', link: 'https://www.mma.go.kr/' },
 
  // ===== 육군 모집병 (1행에 병과 콤마로 모두) =====
  { branch: '육군 모집병', group: 'G001', groupTitle: '2026년 7월 기술행정병', item: '운전, 감시장비운용, 의무, 취사, 군악', applyStart: '2026.05.01', applyEnd: '2026.05.10', enlistStart: '2026.07.15', enlistEnd: '', link: 'https://www.mma.go.kr/' },
  { branch: '육군 모집병', group: 'G002', groupTitle: '2026년 8월 전문특기병', item: '어학병, JSA경비병, 의장병, 33경호병', applyStart: '2026.06.01', applyEnd: '2026.06.10', enlistStart: '2026.08.18', enlistEnd: '', link: 'https://www.mma.go.kr/' },
 
  // ===== 해군 (1행에 병과 콤마로 모두) =====
  { branch: '해군', group: 'G001', groupTitle: '2026년 8월 해군 일반기술병', item: '함정요원, 항공요원, 취사, 정비', applyStart: '2026.05.10', applyEnd: '2026.05.20', enlistStart: '2026.08.03', enlistEnd: '', link: 'https://www.navy.mil.kr/' },
  { branch: '해군', group: 'G002', groupTitle: '2026년 9월 해군 전문특기병', item: '잠수함 승조원, UDT/SEAL, SSU', applyStart: '2026.05.25', applyEnd: '2026.06.05', enlistStart: '2026.09.01', enlistEnd: '', link: 'https://www.navy.mil.kr/' },
 
  // ===== 공군 =====
  { branch: '공군', group: 'G001', groupTitle: '2026년 7월 공군 일반기술병', item: '일반', applyStart: '2026.05', applyEnd: '2026.06', enlistStart: '2026.07', enlistEnd: '', link: 'https://www.airforce.mil.kr/' },
  { branch: '공군', group: 'G002', groupTitle: '2026년 8월 공군 전문기술병', item: '전자계산, 의무, 기계, 차량운전, 통신전자전기', applyStart: '2026.06.01', applyEnd: '2026.06.10', enlistStart: '2026.08.25', enlistEnd: '', link: 'https://www.airforce.mil.kr/' },
 
  // ===== 해병대 =====
  { branch: '해병대', group: 'G001', groupTitle: '2026년 9월 해병대 모집병', item: '일반보병, 수색, 전차, 포병', applyStart: '2026.06.01', applyEnd: '2026.06.10', enlistStart: '2026.09.10', enlistEnd: '', link: 'https://www.rokmc.mil.kr/' },
 
  // ===== 카투사 =====
  { branch: '카투사', group: 'G001', groupTitle: '2027년 입영 KATUSA', item: 'KATUSA', applyStart: '2026.09.10', applyEnd: '2026.09.16', enlistStart: '2027.02', enlistEnd: '2027.11', link: 'https://www.mma.go.kr/' },
];
