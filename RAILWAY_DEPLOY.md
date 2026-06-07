# Railway 배포 가이드

## 전체 순서 요약
1. GitHub 레포지토리 생성 → 코드 업로드
2. Railway 프로젝트 생성
3. MySQL 데이터베이스 추가
4. 백엔드 서비스 배포
5. 프론트엔드 서비스 배포
6. 환경변수 연결 및 CORS 업데이트

---

## STEP 1 — GitHub 레포지토리 생성 및 코드 업로드

### 1-1. GitHub에서 새 레포지토리 생성

1. [github.com](https://github.com) 로그인
2. 우상단 **"+"** 버튼 → **"New repository"** 클릭
3. 설정:
   - Repository name: `life-manager` (원하는 이름)
   - Visibility: **Private** 권장 (API 키 등 민감 정보 포함)
   - README, .gitignore: **체크 해제** (이미 있음)
4. **"Create repository"** 클릭
5. 생성 후 나오는 URL 복사: `https://github.com/YOUR_USERNAME/life-manager.git`

### 1-2. 로컬에서 Git 초기화 및 업로드

프로젝트 폴더(`final/`)에서 PowerShell 실행:

```powershell
# Git 초기화
git init

# 모든 파일 스테이징 (.env는 .gitignore에 있어서 자동 제외됨)
git add .

# 첫 커밋
git commit -m "initial commit"

# GitHub 레포와 연결 (본인 URL로 교체)
git remote add origin https://github.com/YOUR_USERNAME/life-manager.git

# main 브랜치로 업로드
git branch -M main
git push -u origin main
```

> ⚠️ `.env` 파일은 `.gitignore`에 등록되어 있어 자동으로 제외됩니다.
> API 키, DB 비밀번호는 GitHub에 올라가지 않으니 안전합니다.

### 1-3. 업로드 확인

브라우저에서 `https://github.com/YOUR_USERNAME/life-manager` 접속해
`back/`, `front/`, `docker-compose.yml` 등이 올라갔는지 확인합니다.

---

## STEP 2 — Railway 프로젝트 생성

1. [railway.app](https://railway.app) 접속 → **"Login"** 클릭
2. **"Login with GitHub"** 선택 (GitHub 계정으로 로그인)
3. 로그인 후 대시보드에서 **"New Project"** 클릭
4. **"Empty Project"** 선택

> 프로젝트 이름은 나중에 설정 가능합니다.

---

## STEP 3 — MySQL 데이터베이스 추가

1. 프로젝트 대시보드 우상단 **"+ New"** 클릭
2. **"Database"** → **"Add MySQL"** 선택
3. MySQL 서비스가 자동 생성되어 대시보드에 표시됨

### 연결 정보 확인

MySQL 서비스 클릭 → **"Variables"** 탭에서 아래 값들을 확인해 둡니다
(백엔드 환경변수 설정 시 사용):

```
MYSQLHOST       (내부 호스트명)
MYSQLPORT       (3306)
MYSQLDATABASE   (railway)
MYSQLUSER       (root)
MYSQLPASSWORD   (자동 생성된 비밀번호)
```

---

## STEP 4 — 백엔드 배포

### 4-1. 백엔드 서비스 추가

1. **"+ New"** → **"GitHub Repo"** 클릭
2. GitHub 연동이 안 되어 있으면 **"Configure GitHub App"** 클릭해 권한 허용
3. `life-manager` 레포 선택 → **"Add Service"** 클릭

### 4-2. 백엔드 루트 디렉토리 설정

생성된 서비스 클릭 → **"Settings"** 탭:

| 항목 | 값 |
|------|----|
| Root Directory | `back` |
| Build Command | (비워두기, Dockerfile 자동 인식) |
| Start Command | (비워두기) |

설정 후 **"Deploy"** 또는 자동 재배포 대기.

### 4-3. 백엔드 환경변수 설정

같은 서비스의 **"Variables"** 탭에서 아래 값들을 하나씩 추가:

```
DATABASE_URL    = mysql+pymysql://${{MySQL.MYSQLUSER}}:${{MySQL.MYSQLPASSWORD}}@${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}
SECRET_KEY      = (아래 방법으로 생성한 랜덤 문자열)
OPENAI_API_KEY  = sk-proj-...
UPLOAD_DIR      = /app/uploads
CORS_ORIGINS    = http://localhost:3000
```

> **SECRET_KEY 생성 방법** (PowerShell):
> ```powershell
> -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | % {[char]$_})
> ```
> 또는 아무 긴 랜덤 문자열이면 됩니다.

> **`${{MySQL.MYSQLUSER}}` 형식** 은 Railway의 서비스 간 변수 참조입니다.
> MySQL 서비스 이름이 `MySQL`인지 확인하세요 (대시보드에서 서비스 이름 확인).

### 4-4. 백엔드 도메인 발급

**"Settings"** 탭 → **"Networking"** 섹션 → **"Generate Domain"** 클릭

`https://life-manager-backend-xxxx.railway.app` 형태의 URL이 발급됩니다.
**이 URL을 복사해둡니다** (프론트엔드 설정에 사용).

### 4-5. 백엔드 배포 확인

발급된 URL에 `/health` 를 붙여 브라우저에서 접속:

```
https://life-manager-backend-xxxx.railway.app/health
```

아래처럼 나오면 성공:
```json
{"status": "ok"}
```

API 문서 확인: `https://life-manager-backend-xxxx.railway.app/docs`

---

## STEP 5 — 프론트엔드 배포

### 5-1. 프론트엔드 서비스 추가

1. **"+ New"** → **"GitHub Repo"** → 동일한 `life-manager` 레포 선택
2. 이번엔 **다른 서비스**로 추가됨

### 5-2. 프론트엔드 루트 디렉토리 설정

생성된 서비스 클릭 → **"Settings"** 탭:

| 항목 | 값 |
|------|----|
| Root Directory | `front` |

### 5-3. 프론트엔드 환경변수 설정

**"Variables"** 탭에서:

```
VITE_API_URL = https://life-manager-backend-xxxx.railway.app
```

> STEP 4-4에서 복사한 백엔드 URL을 정확히 입력합니다.
> 이 값은 **빌드 시** React 코드에 삽입되므로 정확해야 합니다.

### 5-4. 프론트엔드 도메인 발급

**"Settings"** → **"Networking"** → **"Generate Domain"** 클릭

`https://life-manager-frontend-xxxx.railway.app` URL 획득.

---

## STEP 6 — CORS 업데이트

프론트엔드 URL을 백엔드에서 허용해야 합니다.

**백엔드 서비스** → **"Variables"** 탭에서 `CORS_ORIGINS` 값 수정:

```
CORS_ORIGINS = https://life-manager-frontend-xxxx.railway.app
```

저장하면 Railway가 백엔드를 자동 재배포합니다.

---

## STEP 7 — 최종 확인

| 서비스 | URL | 확인 내용 |
|--------|-----|-----------|
| 웹 앱 | `https://life-manager-frontend-xxxx.railway.app` | 로그인 화면 표시 |
| API | `https://life-manager-backend-xxxx.railway.app/docs` | Swagger 문서 표시 |
| 헬스체크 | `https://life-manager-backend-xxxx.railway.app/health` | `{"status":"ok"}` |

---

## 코드 수정 후 재배포 방법

Railway는 GitHub에 push하면 **자동으로 재배포**됩니다.

```powershell
# 코드 수정 후
git add .
git commit -m "수정 내용 설명"
git push origin main
```

push 즉시 Railway 대시보드에서 새 배포가 시작되는 것을 확인할 수 있습니다.

---

## 주의사항

### 업로드 파일 (서류 첨부)
Railway의 파일시스템은 **재배포 시 초기화**됩니다.
서류 파일을 영구 보관하려면 Railway Volume을 추가해야 합니다:
- 백엔드 서비스 → **"Volumes"** 탭 → **"Add Volume"**
- Mount Path: `/app/uploads`

### 요금
Railway 무료 플랜은 월 **$5 크레딧** 제공.
MySQL + 백엔드 + 프론트엔드 3개 서비스를 상시 운영하면 크레딧 소진 속도가 빠를 수 있습니다.
Hobby 플랜($5/월)으로 업그레이드하면 안정적으로 운영 가능합니다.

### 환경변수 확인 순서
배포가 안 될 때 체크리스트:
1. `DATABASE_URL`의 `${{MySQL.MYSQLUSER}}` 등에서 서비스 이름(`MySQL`)이 맞는지 확인
2. `VITE_API_URL`에 백엔드 URL이 정확히 입력되었는지 확인
3. `CORS_ORIGINS`에 프론트엔드 URL이 정확히 입력되었는지 확인
