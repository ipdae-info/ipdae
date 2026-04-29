/**
 * ============================================================
 *  설정 파일 (config.js)
 * ============================================================
 *
 *  📂 DB 구조: Google Sheets 1개 파일 + 6개 시트 탭
 *
 *  [입영공고 DB]
 *  ├── 탭 1: 육군_현역병      (특기 없이 입영, 본인선택)
 *  ├── 탭 2: 육군_모집병      (기술행정, 전문특기, 어학병 등)
 *  ├── 탭 3: 해군             (모집병)
 *  ├── 탭 4: 공군             (모집병)
 *  ├── 탭 5: 해병대           (모집병)
 *  └── 탭 6: 카투사           (추첨제)
 *
 *  📋 각 탭의 1행 헤더 (영문, 6개):
 *  mos | applyStart | applyEnd | enlistStart | enlistEnd | link
 *
 *  ※ branch 컬럼은 입력하지 않습니다. 시트 이름이 곧 분류.
 *
 * ============================================================
 *
 *  📡 게시 방법
 *  1. Google Sheets 열기
 *  2. 파일 → 공유 → 웹에 게시
 *  3. 첫 번째 드롭다운: 시트 탭 선택 (예: "육군_현역병")
 *  4. 두 번째 드롭다운: "쉼표로 구분된 값(.csv)"
 *  5. 게시 → URL 복사 (output=csv 로 끝남)
 *  6. 6개 탭에 대해 반복
 *
 * ============================================================
 */

const CONFIG = {
  /**
   * 시트별 CSV URL 매핑 (필터 라벨과 1:1 매칭)
   * 각 시트에는 해당 군/유형의 공고만 입력
   */
  SHEETS: [
    { branch: '육군 현역병', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=141518284&single=true&output=csv' },
    { branch: '육군 모집병', url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=0&single=true&output=csv' },
    { branch: '해군',       url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=1514166856&single=true&output=csv' },
    { branch: '공군',       url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=2043380112&single=true&output=csv' },
    { branch: '해병대',     url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=1319193307&single=true&output=csv' },
    { branch: '카투사',     url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGTB4lFRzCuCrEEc-csfbkaIYjFeHq3QBpjfpp-19BFqJj0R0CjnsD-g1REBC090IhchUIjFIClt25/pub?gid=1720311161&single=true&output=csv' },
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
  // 육군 현역병 (특기 없이 입영)
  {
    branch: '육군 현역병', mos: '본인선택 입영',
    applyStart: '2026.05.01', applyEnd: '2026.05.07',
    enlistStart: '2026.07.06', enlistEnd: '2026.07.06',
    link: 'https://www.mma.go.kr/'
  },
  {
    branch: '육군 현역병', mos: '본인선택 입영',
    applyStart: '2026.06.05', applyEnd: '2026.06.12',
    enlistStart: '2026.08.10', enlistEnd: '',
    link: 'https://www.mma.go.kr/'
  },

  // 육군 모집병 (기술행정, 전문특기 등)
  {
    branch: '육군 모집병', mos: '운전병',
    applyStart: '2026.05.01', applyEnd: '2026.05.10',
    enlistStart: '2026.07.15', enlistEnd: '',
    link: 'https://www.mma.go.kr/'
  },
  {
    branch: '육군 모집병', mos: '의무병',
    applyStart: '2026.06.10', applyEnd: '2026.06.18',
    enlistStart: '2026.08.18', enlistEnd: '',
    link: 'https://www.mma.go.kr/'
  },
  {
    branch: '육군 모집병', mos: '군악병',
    applyStart: '2026.07.01', applyEnd: '2026.07.10',
    enlistStart: '2026.10.13', enlistEnd: '',
    link: 'https://www.mma.go.kr/'
  },

  // 해군
  {
    branch: '해군', mos: '일반기술병',
    applyStart: '2026.05.10', applyEnd: '2026.05.20',
    enlistStart: '2026.08.03', enlistEnd: '',
    link: 'https://www.navy.mil.kr/'
  },
  {
    branch: '해군', mos: '특수전요원(UDT/SEAL)',
    applyStart: '2026.05.25', applyEnd: '2026.06.05',
    enlistStart: '2026.09.01', enlistEnd: '',
    link: 'https://www.navy.mil.kr/'
  },

  // 공군
  {
    branch: '공군', mos: '일반기술병',
    applyStart: '2026.05', applyEnd: '2026.06',
    enlistStart: '2026.07', enlistEnd: '',
    link: 'https://www.airforce.mil.kr/'
  },
  {
    branch: '공군', mos: '취사',
    applyStart: '2026.06', applyEnd: '',
    enlistStart: '2026.08.25', enlistEnd: '',
    link: 'https://www.airforce.mil.kr/'
  },

  // 해병대
  {
    branch: '해병대', mos: '일반보병',
    applyStart: '2026.06.01', applyEnd: '',
    enlistStart: '2026.09.10', enlistEnd: '',
    link: 'https://www.rokmc.mil.kr/'
  },
  {
    branch: '해병대', mos: '수색',
    applyStart: '2026.06.15', applyEnd: '',
    enlistStart: '2026.09.22', enlistEnd: '',
    link: 'https://www.rokmc.mil.kr/'
  },

  // 카투사
  {
    branch: '카투사', mos: 'KATUSA',
    applyStart: '2026.09.10', applyEnd: '2026.09.16',
    enlistStart: '2027.02', enlistEnd: '2027.11',
    link: 'https://www.mma.go.kr/'
  },
];
