/**
 * ============================================================
 *  설정 파일 (config.js)
 * ============================================================
 *
 *  📌 Google Sheets에서 발행한 CSV URL을 SHEET_CSV_URL에 넣으세요.
 *
 *  발행 방법:
 *  1. Google Sheets 열기
 *  2. 파일(File) > 공유(Share) > 웹에 게시(Publish to web)
 *  3. "전체 문서" → "쉼표로 구분된 값(.csv)" 선택
 *  4. 게시(Publish) 버튼 클릭 → 나오는 URL을 복사
 *  5. 아래 SHEET_CSV_URL에 붙여넣기
 *  6. USE_DUMMY_DATA를 false로 변경
 *
 *  ⚠️ "공유 가능한 링크"가 아니라 "웹에 게시 URL"입니다!
 * ============================================================
 *
 *  📋 Google Sheets 컬럼 헤더 (1행에 정확히 입력):
 *
 *  branch | category | mos | applyStart | applyEnd | enlistStart | enlistEnd | link
 *
 *  - branch: 육군 / 해군 / 공군 / 해병대 / 카투사
 *  - category: 모집 / 징집
 *  - mos: 병과명 (예: 운전병, 의무병). 징집은 "징집"으로 적어도 됨
 *  - applyStart: 신청 시작일 (예: 2026.05.01 또는 2026.05)
 *  - applyEnd: 신청 마감일 (시작일과 같으면 비워둬도 됨)
 *  - enlistStart: 입영 시작일
 *  - enlistEnd: 입영 마감일 (시작일과 같으면 비워둬도 됨)
 *  - link: 공식 공지 URL (선택)
 *
 *  💡 "일"이 없는 경우 (예: "5월 중") → "2026.05" 형식으로 입력
 *  💡 시작과 끝이 동일 → end 컬럼 비워두면 자동으로 하나만 표시됨
 * ============================================================
 */

const CONFIG = {
  // Google Sheets CSV 게시 URL
  SHEET_CSV_URL: 'YOUR_PUBLISHED_CSV_URL_HERE',

  // 테스트용 더미 데이터 사용 (배포 시 false로)
  USE_DUMMY_DATA: true,

  // 지난 공고 자동 숨김 (신청 마감일 또는 시작일 기준)
  HIDE_PAST_NOTICES: true,

  // 캐시 시간 (분)
  CACHE_MINUTES: 5,
};

// 더미 데이터 (테스트용)
const DUMMY_DATA = [
  {
    branch: '육군', category: '모집', mos: '운전병',
    applyStart: '2026.05.01', applyEnd: '2026.05.10',
    enlistStart: '2026.07.15', enlistEnd: '2026.07.15',
    link: 'https://mma.go.kr/'
  },
  {
    branch: '해군', category: '모집', mos: '잠수함 승조원',
    applyStart: '2026.05.10', applyEnd: '2026.05.20',
    enlistStart: '2026.08.03', enlistEnd: '',
    link: 'https://www.navy.mil.kr/'
  },
  {
    branch: '공군', category: '모집', mos: '항공통제',
    applyStart: '2026.05', applyEnd: '2026.06',
    enlistStart: '2026.07', enlistEnd: '',
    link: 'https://www.airforce.mil.kr/'
  },
  {
    branch: '해병대', category: '모집', mos: '수색',
    applyStart: '2026.06.01', applyEnd: '',
    enlistStart: '2026.09.10', enlistEnd: '',
    link: 'https://www.rokmc.mil.kr/'
  },
  {
    branch: '카투사', category: '모집', mos: 'KATUSA',
    applyStart: '2026.05.20', applyEnd: '2026.05.27',
    enlistStart: '2026.10.05', enlistEnd: '',
    link: 'https://www.mma.go.kr/'
  },
  {
    branch: '육군', category: '징집', mos: '징집',
    applyStart: '2026.05.05', applyEnd: '',
    enlistStart: '2026.06.20', enlistEnd: '',
    link: 'https://www.mma.go.kr/'
  },
  {
    branch: '육군', category: '모집', mos: '의무병',
    applyStart: '2026.06.10', applyEnd: '2026.06.18',
    enlistStart: '2026.08.18', enlistEnd: '',
    link: 'https://www.mma.go.kr/'
  },
  {
    branch: '해군', category: '모집', mos: '특수전요원(UDT/SEAL)',
    applyStart: '2026.05.25', applyEnd: '2026.06.05',
    enlistStart: '2026.09.01', enlistEnd: '2026.09.05',
    link: 'https://www.navy.mil.kr/'
  },
  {
    branch: '공군', category: '모집', mos: '취사',
    applyStart: '2026.06', applyEnd: '',
    enlistStart: '2026.08.25', enlistEnd: '',
    link: 'https://www.airforce.mil.kr/'
  },
  {
    branch: '해병대', category: '모집', mos: '전차',
    applyStart: '2026.06.15', applyEnd: '',
    enlistStart: '2026.09.22', enlistEnd: '',
    link: 'https://www.rokmc.mil.kr/'
  },
  {
    branch: '육군', category: '모집', mos: '군악병',
    applyStart: '2026.07.01', applyEnd: '2026.07.10',
    enlistStart: '2026.10.13', enlistEnd: '',
    link: 'https://www.mma.go.kr/'
  },
  {
    branch: '카투사', category: '모집', mos: 'KATUSA 2차',
    applyStart: '2026.07.10', applyEnd: '2026.07.17',
    enlistStart: '2026.11.05', enlistEnd: '',
    link: 'https://www.mma.go.kr/'
  },
];
