# Life Manager 코드 이해 문서

## 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [전체 아키텍처](#2-전체-아키텍처)
3. [디렉토리 구조](#3-디렉토리-구조)
4. [Docker 구성](#4-docker-구성)
5. [백엔드 핵심 코드](#5-백엔드-핵심-코드)
6. [프론트엔드 핵심 코드](#6-프론트엔드-핵심-코드)
7. [데이터 흐름 요약](#7-데이터-흐름-요약)

---

## 1. 프로젝트 개요

가계부·서류·일정·투두·메모·AI챗봇을 하나의 웹에서 통합 관리하는 자기관리 플랫폼.

| 항목 | 내용 |
|------|------|
| 프론트엔드 | React 18 + Vite + Tailwind CSS |
| 백엔드 | Python FastAPI + SQLAlchemy |
| 데이터베이스 | MySQL 8.0 |
| AI | OpenAI GPT-4o-mini |
| 컨테이너 | Docker Compose |

---

## 2. 전체 아키텍처

```
브라우저 (localhost:3000)
    │
    ▼
[Nginx] - React 빌드 파일 서빙
    │ /api/* → proxy
    ▼
[FastAPI] (localhost:8000)
    │
    ├── JWT 인증 검증
    ├── 비즈니스 로직
    ├── OpenAI API 호출 (AI 챗봇)
    │
    ▼
[MySQL] (내부 3306)

[phpMyAdmin] (localhost:8080) - DB 시각적 관리
```

**요청 흐름**: 브라우저 → Nginx → FastAPI → MySQL  
**인증 방식**: JWT Bearer Token (localStorage에 저장, 7일 유효)

---

## 3. 디렉토리 구조

```
final/
├── docker-compose.yml       # 4개 서비스 정의
├── .env                     # 환경변수 (API 키, DB 비밀번호)
│
├── back/                    # FastAPI 백엔드
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py          # 앱 진입점, 라우터 등록
│       ├── config.py        # 환경변수 로드
│       ├── database.py      # SQLAlchemy 엔진/세션
│       ├── models.py        # DB 테이블 정의 (ORM)
│       ├── schemas/         # Pydantic 요청·응답 스키마
│       ├── routers/         # API 엔드포인트
│       └── utils/
│           ├── auth.py      # JWT 생성·검증
│           └── ai.py        # GPT 컨텍스트 구성 + 호출
│
└── front/                   # React 프론트엔드
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.jsx           # 라우팅 정의
        ├── api/index.js      # axios 인스턴스 + API 함수
        ├── store/authStore.js # Zustand 전역 인증 상태
        ├── components/
        │   ├── layout/       # Sidebar, Layout
        │   └── common/       # Modal, FloatingChat
        └── pages/            # 각 기능 페이지
```

---

## 4. Docker 구성

### docker-compose.yml 핵심 구조

```yaml
services:
  db:          # MySQL — healthcheck로 준비 완료 확인
  phpmyadmin:  # localhost:8080 에서 DB 웹 관리
  backend:     # FastAPI — db healthy 이후 시작
  frontend:    # React+Nginx — localhost:3000
```

**서비스 의존 순서**: `db 준비됨` → `backend 시작` → `frontend 시작`

`db`에 healthcheck가 걸려 있어, MySQL이 실제로 쿼리를 받을 수 있는 상태가 되어야 backend가 뜬다. `database.py`에도 재시도 로직이 있다.

```python
# database.py - 연결 재시도 로직
def create_engine_with_retry(url, retries=10, delay=5):
    for attempt in range(retries):
        try:
            engine = create_engine(url, pool_pre_ping=True)
            with engine.connect() as conn:
                pass
            return engine
        except OperationalError:
            if attempt < retries - 1:
                time.sleep(delay)
```

---

## 5. 백엔드 핵심 코드

### 5-1. DB 모델 (models.py)

SQLAlchemy ORM으로 테이블을 Python 클래스로 정의. 앱 시작 시 `Base.metadata.create_all(bind=engine)`으로 테이블 자동 생성.

```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nickname = Column(String(100), default="")
    gender = Column(Enum("male", "female", "other"), nullable=True)
    profile_picture = Column(String(500), nullable=True)
    # 관계: 한 User는 여러 LedgerItem, Todo, Memo 등을 가짐
    ledger_items = relationship("LedgerItem", back_populates="user", cascade="all, delete-orphan")
```

`cascade="all, delete-orphan"`: 유저 삭제 시 관련 데이터 모두 자동 삭제.

**테이블 목록**:
- `users` — 계정 정보
- `ledger_items` — 가계부 항목 (name, price, necessity, item_date)
- `documents` — 서류 메타데이터 + 파일 경로
- `schedules` — 일정 (start_datetime, end_datetime, color)
- `todos` — 할 일 (due_date, is_completed, completed_at)
- `memo_folders` — 메모 폴더
- `memos` — 메모 본문 (folder_id FK)
- `chat_messages` — AI 대화 기록

---

### 5-2. 인증 (utils/auth.py + routers/auth.py)

비밀번호는 bcrypt로 해싱, JWT로 로그인 상태 유지.

```python
# utils/auth.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("sub")
    return db.query(User).filter(User.id == int(user_id)).first()
```

`get_current_user`는 FastAPI의 `Depends()`로 각 라우터에 주입된다. 토큰이 없거나 만료되면 401 반환.

```python
# routers/auth.py - 로그인
@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))
```

---

### 5-3. 가계부 (routers/ledger.py)

월별 합계와 전월 비교가 핵심.

```python
@router.get("/summary", response_model=LedgerSummary)
def get_summary(year: int = None, month: int = None, ...):
    # 이번 달 항목
    this_month_items = [i for i in items if i.item_date.year == year and i.item_date.month == month]
    total = sum(i.price for i in this_month_items)

    # 저번 달 항목
    prev_year, prev_month = (year, month-1) if month > 1 else (year-1, 12)
    prev_total = sum(i.price for i in prev_items)

    return LedgerSummary(total=total, prev_total=prev_total, items=this_month_items)
```

프론트에서 `total - prev_total > 0`이면 빨간색, `< 0`이면 초록색으로 표시.

---

### 5-4. 투두리스트 (routers/todos.py)

날짜 필터와 7일 자동 정리가 핵심.

```python
@router.get("/")
def list_todos(due_date: Optional[date] = None, ...):
    query = db.query(Todo).filter(Todo.user_id == current_user.id)
    if due_date is not None:
        if due_date == date.today():
            # 오늘: 오늘 마감 + 날짜 없는 항목 모두 포함
            query = query.filter(or_(Todo.due_date == today, Todo.due_date == None))
        else:
            query = query.filter(Todo.due_date == due_date)

@router.delete("/cleanup")
def cleanup_old_todos(...):
    cutoff = date.today() - timedelta(days=7)
    db.query(Todo).filter(
        Todo.user_id == current_user.id,
        Todo.due_date != None,
        Todo.due_date < cutoff,
    ).delete(synchronize_session=False)
```

---

### 5-5. 서류 관리 - HTML 미리보기 (routers/documents.py)

DOCX/XLSX/PPTX를 HTML로 변환해 브라우저에서 바로 보여줌.

```python
@router.get("/{doc_id}/html-preview")
def html_preview_document(doc_id: int, ...):
    if ext in ("docx", "doc"):
        document = DocxDocument(doc.file_path)
        body = ""
        for para in document.paragraphs:
            text = html.escape(para.text)
            body += f"<p>{text}</p>"
        return HTMLResponse(content=f"<html>...{body}...</html>")

    elif ext in ("xlsx", "xls"):
        wb = openpyxl.load_workbook(doc.file_path, read_only=True)
        # 시트별 탭 + HTML 테이블 생성
        return HTMLResponse(content=...)

    elif ext in ("pptx", "ppt"):
        prs = Presentation(doc.file_path)
        # 슬라이드별 텍스트 추출
        return HTMLResponse(content=...)
```

프론트에서는 `<iframe srcDoc={html}>` 로 렌더링. 파일 자체가 아닌 **변환된 HTML**을 표시하므로 인증 토큰 없이도 렌더링 가능.

---

### 5-6. AI 챗봇 (utils/ai.py + routers/chat.py)

채팅 시 사용자 데이터를 시스템 프롬프트에 삽입해서 GPT에 전달.

```python
# chat.py - 채팅 요청 처리
@router.post("/")
def send_message(data: ChatRequest, ...):
    # 1. 사용자의 모든 데이터 조회
    ledger_items = db.query(LedgerItem).filter(...).all()
    todos = db.query(Todo).filter(...).all()
    schedules = db.query(Schedule).filter(...).all()
    documents = db.query(Document).filter(...).all()

    # 2. 컨텍스트 문자열 생성
    context = build_user_context(current_user, ledger_items, todos, schedules, documents)

    # 3. GPT 호출
    ai_response = get_ai_response(data.message, context)

    # 4. DB에 대화 저장
    chat_msg = ChatMessage(user_message=data.message, ai_response=ai_response)
    db.add(chat_msg)
```

```python
# ai.py - GPT에 전달되는 컨텍스트 구조
"""
현재 날짜: 2026년 06월 06일
사용자: 홍길동

[가계부]
이번 달 지출 3개:
  - 커피: 4,500원 (필요성: 하)
  이번 달 총 지출: 52,000원

[투두리스트]
미완료 할 일 2개 (오늘 마감 1개):
  1. 보고서 제출 [마감: 2026-06-06]

[오늘 일정] ...
[서류 관리] ...
"""
# → 메모 내용은 의도적으로 제외 (개인정보 보호)
```

---

## 6. 프론트엔드 핵심 코드

### 6-1. 인증 상태 관리 (store/authStore.js)

Zustand를 사용한 전역 상태. localStorage와 동기화.

```javascript
const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),  // 새로고침 시 토큰 복원

  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
}))
```

---

### 6-2. API 요청 (api/index.js)

axios 인터셉터로 모든 요청에 토큰 자동 첨부, 401 시 자동 로그아웃.

```javascript
// 요청 인터셉터 - 토큰 자동 주입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답 인터셉터 - 인증 만료 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'  // 자동 로그인 페이지로
    }
    return Promise.reject(error)
  }
)
```

---

### 6-3. 레이아웃 & 인증 보호 (App.jsx + Layout.jsx)

```jsx
// App.jsx - 라우트 보호
function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

// Layout.jsx - 유저 정보 자동 로드
useEffect(() => {
  if (!token) { navigate('/login'); return }
  if (!user) {
    profileAPI.getMe()
      .then((res) => setUser(res.data))
      .catch(() => navigate('/login'))
  }
}, [token])
```

토큰은 있지만 user 정보가 없을 때(새로고침 등) `/profile/me`를 호출해 자동 복원.

---

### 6-4. 서류 뷰어 - Blob 방식 (Documents.jsx)

`<img src>` 나 `<iframe src>`에 직접 API URL을 쓰면 인증 헤더를 넣을 수 없다. 그래서 **fetch로 Blob을 받아 Object URL로 변환**하는 방식 사용.

```javascript
// 인증 헤더가 필요한 파일을 브라우저에서 렌더링하는 방법
const blob = await documentAPI.fetchBlob(doc.id)   // Bearer 토큰 포함 fetch
const url = URL.createObjectURL(blob)               // 임시 브라우저 URL 생성
setBlobUrl(url)

// 사용 후 메모리 해제
return () => { if (url) URL.revokeObjectURL(url) }
```

DOCX/XLSX/PPTX는 Blob 방식이 아닌 **HTML 변환 방식**을 사용:

```jsx
// 백엔드가 HTML로 변환해서 반환 → iframe srcDoc으로 렌더링
{htmlContent && (
  <iframe srcDoc={htmlContent} sandbox="allow-scripts" style={{ height: '75vh' }} />
)}
```

---

### 6-5. 일정 캘린더 - IME 버그 수정 포인트 (Schedule.jsx)

한글 입력 버그의 원인과 해결법.

```jsx
// ❌ 잘못된 패턴 - ScheduleForm이 Schedule 안에 정의됨
function Schedule() {
  const [form, setForm] = useState(...)

  // form이 바뀔 때마다 Schedule 리렌더 → ScheduleForm이 새 함수로 재생성
  // → React가 "다른 컴포넌트"로 인식 → DOM 언마운트/리마운트 → IME 깨짐
  function ScheduleForm() { ... }
  return <Modal><ScheduleForm /></Modal>
}

// ✅ 올바른 패턴 - 컴포넌트 밖에 정의
function ScheduleForm({ form, onChange }) { ... }  // 안정적인 참조

function Schedule() {
  return <Modal><ScheduleForm form={form} onChange={setForm} /></Modal>
}
```

---

### 6-6. 투두리스트 - 날짜 스트립 (Todo.jsx)

오늘 기준 -7일 ~ +14일 날짜 버튼 스트립. 과거는 읽기 전용.

```jsx
const isPast = isBefore(startOfDay(selectedDate), startOfDay(today))

// 과거 날짜 선택 시: 추가 폼 숨김, 수정·삭제 버튼 비활성화
{!isPast && (
  <input value={input} onChange={...} placeholder="할 일 입력" />
)}

{!isPast && (
  <button onClick={() => setDeleteTarget(todo)}><Trash2 /></button>
)}
```

---

### 6-7. 메모 - 드래그 앤 드롭 (Memo.jsx)

HTML5 기본 Drag & Drop API 사용. 별도 라이브러리 불필요.

```jsx
// 메모 아이템 - 드래그 시작
<div draggable onDragStart={(e) => e.dataTransfer.setData('memoId', String(memo.id))}>

// 폴더 - 드롭 대상
<div
  onDragOver={(e) => { e.preventDefault(); setDragOverFolder(folder.id) }}
  onDrop={async (e) => {
    const memoId = parseInt(e.dataTransfer.getData('memoId'))
    await memoAPI.update(memoId, { folder_id: folder.id })
    fetchAll()
  }}
>
```

`folder_id: null`로 업데이트 시 폴더 없음(전체)으로 이동. 백엔드에서 `model_dump(exclude_unset=True)`를 써야 `null` 값이 정상 반영됨.

```python
# routers/memos.py - null 포함 업데이트
update_data = data.model_dump(exclude_unset=True)  # 명시적으로 보낸 필드만 추출
for field, value in update_data.items():
    setattr(memo, field, value)  # folder_id=null도 그대로 적용
```

---

## 7. 데이터 흐름 요약

### 로그인 흐름
```
입력(이메일+비번) → POST /auth/login
→ DB에서 유저 조회 → bcrypt 비번 검증
→ JWT 생성(유효기간 7일) → 프론트 localStorage 저장
→ 이후 모든 API 요청에 Authorization: Bearer {token} 자동 첨부
```

### AI 챗봇 흐름
```
메시지 입력 → POST /chat/
→ DB에서 가계부·투두·일정·서류 조회
→ 데이터를 텍스트로 변환 → 시스템 프롬프트에 삽입
→ OpenAI GPT-4o-mini 호출
→ 응답을 DB 저장 + 프론트에 반환
```

### 서류 파일 뷰어 흐름
```
"보기" 클릭
→ 이미지/PDF/텍스트: fetch(인증헤더) → Blob → ObjectURL → img/iframe
→ DOCX/XLSX/PPTX: GET /html-preview (인증헤더) → HTML 문자열 반환 → iframe srcDoc
→ 미지원 형식(HWP 등): "미리보기 불가" 안내 + 다운로드 버튼
```
