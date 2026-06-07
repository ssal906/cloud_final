# Life Manager - 자기관리 통합 플랫폼

## 서비스 접속 주소 (Docker 실행 후)

| 서비스 | URL | 설명 |
|--------|-----|------|
| 웹 앱 | http://localhost:3000 | React 프론트엔드 |
| API | http://localhost:8000 | FastAPI 백엔드 |
| API 문서 | http://localhost:8000/docs | Swagger UI |
| DB 관리 | http://localhost:8080 | phpMyAdmin |

## 시작 방법

### 1. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일 편집 - ANTHROPIC_API_KEY 설정 필수
```

### 2. Docker 실행
```bash
docker-compose up --build
```

### 3. 브라우저 접속
- http://localhost:3000 → 회원가입 후 사용

## 주요 기능

- **가계부**: 월별 지출 관리, 필요성(상/중/하) 분류, 전월 비교
- **서류 관리**: 파일 업로드/다운로드, Notion 연동, 웹에서 바로 보기
- **일정 관리**: 풀캘린더 뷰, 일정 색상 커스터마이징
- **투두리스트**: 할 일 관리, 월간 완료율 히트맵, 타이머/스톱워치
- **메모장**: 폴더 분류, 자유 형식 메모 작성
- **AI 챗봇**: GPT 기반, 사용자 데이터 인식 (가계부/투두/일정/서류)

## 기술 스택

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Python FastAPI + SQLAlchemy
- **Database**: MySQL 8.0
- **AI**: OpenAI GPT (gpt-4o-mini)
- **Container**: Docker + Docker Compose

## AI 챗봇 설정

`.env` 파일에서 `OPENAI_API_KEY`를 실제 OpenAI API 키로 변경하세요.
```
OPENAI_API_KEY=sk-...
```
