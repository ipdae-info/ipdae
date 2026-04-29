# 군 입대 모집 공고 사이트

육군·해군·공군·해병대·카투사 입대 모집 공고를 한눈에 보여주는 정적 사이트입니다.

## 📁 파일 구성

```
military-recruitment/
├── index.html      # 메인 페이지
├── styles.css      # 스타일시트
├── config.js       # ⚙️ 설정 파일 (Google Sheets URL 입력)
├── app.js          # 메인 로직
└── README.md       # 이 문서
```

---

## 🚀 시작하기 (3단계)

### **1단계. Google Sheets DB 만들기**

1. [Google Sheets](https://sheets.google.com) 에서 새 시트 생성
2. **첫 번째 행에 정확히 아래 헤더를 입력하세요** (영문, 대소문자 일치):

| branch | category | mos | applyStart | applyEnd | enlistStart | enlistEnd | link |
|--------|----------|-----|-----------|----------|-------------|-----------|------|
| 육군   | 모집     | 운전병 | 2026.05.01 | 2026.05.10 | 2026.07.15 | | https://... |
| 해군   | 모집     | 잠수함 승조원 | 2026.05.10 | 2026.05.20 | 2026.08.03 | | https://... |
| 공군   | 모집     | 항공통제 | 2026.05 | 2026.06 | 2026.07 | | https://... |
| 육군   | 징집     | 징집 | 2026.05.05 | | 2026.06.20 | | https://... |

**컬럼 설명:**

| 컬럼 | 설명 | 예시 |
|------|------|------|
| `branch` | **육군 / 해군 / 공군 / 해병대 / 카투사** 중 하나 (정확히 일치) | 육군 |
| `category` | **모집** 또는 **징집** | 모집 |
| `mos` | 병과명 (자유 텍스트). 징집인 경우 "징집"으로 적어도 됨 | 운전병 |
| `applyStart` | 신청 **시작**일 | 2026.05.01 |
| `applyEnd` | 신청 **마감**일 (시작일과 같으면 비워둬도 됨) | 2026.05.10 |
| `enlistStart` | 입영 **시작**일 | 2026.07.15 |
| `enlistEnd` | 입영 **마감**일 (시작일과 같으면 비워둬도 됨) | (비워둠) |
| `link` | 공식 공지 URL (선택) | https://mma.go.kr/ |

### **💡 날짜 입력 규칙**

#### **일자가 정해진 경우**
- `2026.05.01` 형식으로 입력

#### **"5월 중" 처럼 일자가 없는 경우**
- `2026.05` 형식으로 입력 (월만 입력)

#### **단일 날짜인 경우 (시작=끝)**
- `applyEnd`(또는 `enlistEnd`)를 **비워두면** 자동으로 시작일만 표시됨
- 예: `applyStart=2026.05.01`, `applyEnd=비움` → 화면에 "2026.05.01"
- 예: `applyStart=2026.05.01`, `applyEnd=2026.05.10` → 화면에 "2026.05.01 ~ 2026.05.10"

### **2단계. Google Sheets를 CSV로 게시하기**

1. 시트 메뉴: **파일(File) → 공유(Share) → 웹에 게시(Publish to web)**
2. 게시 대화상자에서:
   - **링크(Link)** 탭 선택
   - 첫 드롭다운: **"전체 문서"** 또는 시트 이름 선택
   - 두 번째 드롭다운: **"쉼표로 구분된 값(.csv)"** 선택
3. **게시(Publish)** 버튼 클릭 → 확인 → **나오는 URL을 복사** (`...output=csv`로 끝나는 URL)
4. ⚠️ "공유 가능한 링크"가 아니라 **"웹에 게시 URL"** 입니다. 다릅니다!

### **3단계. config.js 수정**

`config.js`를 열고 아래 두 줄을 수정하세요:

```javascript
const CONFIG = {
  SHEET_CSV_URL: '여기에_2단계에서_복사한_URL_붙여넣기',
  USE_DUMMY_DATA: false,   // ← false 로 변경!
  HIDE_PAST_NOTICES: true,
  CACHE_MINUTES: 5,
};
```

이제 `index.html`을 브라우저로 열면 시트 데이터가 보입니다.

---

## 🌐 호스팅 & 도메인 연결

### **추천 조합: GitHub Pages (무료) + 가비아 도메인**

- **호스팅 비용:** 무료 (영구)
- **도메인 비용:** 연 1만~2만원 (.com / .kr 기준)

### **A. GitHub Pages로 배포하기**

1. **GitHub 계정 생성** ([github.com](https://github.com), 무료)

2. **새 저장소(Repository) 만들기**
   - 이름: 아무거나 (예: `military-recruitment`)
   - **Public**으로 설정 (Private은 GitHub Pages 무료 플랜에서 안 됨)

3. **파일 업로드**
   - 저장소 페이지에서 **"uploading an existing file"** 클릭
   - `index.html`, `styles.css`, `config.js`, `app.js` 모두 드래그 앤 드롭
   - 아래 **"Commit changes"** 클릭

4. **Pages 활성화**
   - 저장소 상단 메뉴: **Settings → Pages**
   - **Source** 항목: `Deploy from a branch` 선택
   - **Branch:** `main` / 폴더 `/ (root)` 선택 → **Save**
   - 1~2분 후 같은 페이지에 `https://USERNAME.github.io/REPO-NAME/` URL이 표시됨
   - 이 URL로 접속하면 사이트가 보입니다 ✅

### **B. 도메인 구입 & 연결**

#### **도메인 구입 (가비아 기준)**

1. [가비아](https://www.gabia.com) 접속 → 원하는 도메인 검색 (예: `mma-board.kr`)
2. 결제 → 마이페이지에서 도메인 관리 가능

다른 옵션:
- **Cloudflare Registrar** (영문, 가장 저렴, 원가에 가까움)
- **Namecheap** (해외, .com이 저렴)

#### **GitHub Pages에 도메인 연결**

**1. GitHub 저장소에 CNAME 파일 추가**

저장소에 `CNAME`이라는 파일(확장자 없음) 만들고 안에 도메인만 적기:

```
mma-board.kr
```

**2. GitHub Settings → Pages → Custom domain**

도메인 입력 → Save → `Enforce HTTPS` 체크

**3. 가비아 DNS 설정**

가비아 마이페이지 → 도메인 관리 → **DNS 정보** → DNS 설정에서 아래 레코드 추가:

| 타입 | 호스트 | 값/위치 | TTL |
|------|--------|---------|-----|
| A | @ | 185.199.108.153 | 3600 |
| A | @ | 185.199.109.153 | 3600 |
| A | @ | 185.199.110.153 | 3600 |
| A | @ | 185.199.111.153 | 3600 |
| CNAME | www | USERNAME.github.io. | 3600 |

> `USERNAME`은 본인 GitHub 사용자명. 끝에 점(.) 까먹지 마세요.

**4. 기다리기**

DNS 전파에 보통 10분~1시간 (최대 24시간). HTTPS 인증서 자동 발급도 동일.

---

## ✏️ 공고 추가/수정/삭제

Google Sheets에 행을 추가/수정/삭제만 하면 끝입니다.
- 사이트 새로고침 시 최대 5분 캐시 후 반영 (`config.js`의 `CACHE_MINUTES` 변경 가능)
- 사용자가 캐시 무시하고 바로 보고 싶다면 강제 새로고침 (Ctrl+Shift+R)

### **지난 공고는 자동으로 숨겨집니다**
신청 마감일(`applyEnd`)이 오늘보다 과거이면 자동 숨김. 마감일이 비어있으면 시작일 기준.

이 동작을 끄고 싶다면 `config.js`의 `HIDE_PAST_NOTICES`를 `false`로.

---

## 🔧 자주 발생하는 문제

### **시트를 수정했는데 사이트에 안 나와요**
- 5분 캐시 때문일 수 있음. 강제 새로고침(Ctrl+Shift+R) 또는 시크릿 모드로 접속
- 그래도 안 되면 Google Sheets 게시 URL이 정확한지 확인

### **"데이터를 불러올 수 없습니다" 에러**
- `SHEET_CSV_URL`이 **"웹에 게시 URL"**(끝이 `output=csv`)인지 확인
- 시트가 게시 상태인지 확인 (게시 해제하면 안 됨)

### **필터가 작동 안 해요**
- 시트의 `branch` 컬럼 값이 정확히 **육군/해군/공군/해병대/카투사** 중 하나인지 확인
- 띄어쓰기, 오타 등 정확히 일치해야 함

### **날짜가 이상하게 표시돼요**
- 시작과 끝이 같으면 **end 컬럼은 비워두세요**
- 일자가 없는 경우 `2026.05` 처럼 월까지만 적으세요
- 점(`.`), 하이픈(`-`), 슬래시(`/`) 모두 가능하지만 **점(`.`) 사용 권장**

---

## 🎨 디자인 커스터마이징

`styles.css` 상단의 `:root` 영역에서 색상을 바꿀 수 있습니다:

```css
:root {
  --bg: #f5fafd;             /* 전체 배경 */
  --bg-card: #ffffff;        /* 카드 배경 */
  --sky: #4ba3e0;            /* 메인 하늘색 (강조) */
  --sky-deep: #2e7fb8;       /* 진한 하늘색 */
  --sky-light: #e3f1fb;      /* 연한 하늘색 */
  --ink: #0f1e2e;            /* 본문 글자색 */
  /* ... */
}
```

군별 카드 글자 색상도 바꿀 수 있습니다 (`styles.css` 검색: `.card[data-branch=`).

---

## 📌 주의사항

- 본 사이트는 정보 모음용입니다. **정확한 입영 정보는 반드시 각 군 공식 사이트에서 재확인**하세요.
- Google Sheets는 **누구나 URL을 알면 읽기 가능**합니다. 민감 정보를 넣지 마세요.
- 공고는 정확하게 입력하고, 출처를 확인 가능한 link 컬럼을 꼭 채우는 것을 권장합니다.

---

## 📞 추가로 필요할 만한 것

- **방문자 통계:** Google Analytics 4 무료 (HTML head에 코드 한 줄 추가)
- **검색엔진 노출:** Google Search Console 등록 (sitemap.xml 추가)
- **OG 이미지/공유 미리보기:** `<meta property="og:...">` 태그 추가
- **PWA(앱처럼 설치):** manifest.json + service worker 추가

필요하시면 위 항목들도 만들어드릴 수 있어요.
