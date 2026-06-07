# Vercel + Render + TiDB 배포 가이드

이 문서는 `front/`는 Vercel, `back/`은 Render, 데이터베이스는 TiDB Cloud를 사용해 배포하는 절차를 설명합니다.

파일 저장 방식은 이 단계에서 따로 다루지 않습니다.

## 전체 구조

```txt
사용자 브라우저
  -> Vercel: React/Vite 프론트엔드
  -> Render: FastAPI 백엔드
  -> TiDB Cloud: MySQL 호환 데이터베이스
```

## 배포 전 준비

필요한 계정:

- GitHub
- Vercel
- Render
- TiDB Cloud

프로젝트 구조:

```txt
final/
  front/   # React + Vite
  back/    # FastAPI
```

백엔드 주요 환경변수:

```txt
DATABASE_URL
SECRET_KEY
OPENAI_API_KEY
CORS_ORIGINS
UPLOAD_DIR
```

프론트엔드 주요 환경변수:

```txt
VITE_API_URL
```

## STEP 1. GitHub에 프로젝트 업로드

GitHub에서 새 repository를 만든 뒤, 프로젝트 루트(`final/`)에서 아래 명령을 실행합니다.

```powershell
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

주의:

- `.env`는 GitHub에 올리지 않습니다.
- `.env.example`만 공유용으로 남깁니다.
- API 키, DB 비밀번호, JWT 시크릿은 각 배포 서비스의 환경변수에 따로 입력합니다.

## STEP 2. TiDB Cloud 데이터베이스 생성

1. [TiDB Cloud](https://tidbcloud.com)에 로그인합니다.
2. 새 프로젝트 또는 기존 프로젝트를 선택합니다.
3. `Create Cluster`를 클릭합니다.
4. 개발/테스트 목적이면 Serverless 클러스터를 선택합니다.
5. 클러스터 이름을 입력하고 생성합니다.
6. 클러스터 생성이 끝나면 `Connect` 메뉴를 엽니다.

TiDB는 MySQL 호환 데이터베이스이므로 이 프로젝트의 `pymysql` 연결 방식을 그대로 사용할 수 있습니다.

## STEP 3. TiDB 접속 정보 확인

TiDB Cloud의 `Connect` 화면에서 아래 값을 확인합니다.

```txt
HOST
PORT
DATABASE
USERNAME
PASSWORD
CA CERT 옵션 또는 SSL 설정
```

Render 백엔드에는 아래 형식의 `DATABASE_URL`을 사용합니다.

```txt
mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/DATABASE?ssl_verify_cert=true
```

예시:

```txt
mysql+pymysql://app_user:password@gateway01.ap-northeast-2.prod.aws.tidbcloud.com:4000/life_manager?ssl_verify_cert=true
```

실제 값은 TiDB Cloud에서 발급된 값으로 바꿔야 합니다.

## STEP 4. Render에 백엔드 배포

1. [Render](https://render.com)에 로그인합니다.
2. `New +`를 클릭합니다.
3. `Web Service`를 선택합니다.
4. GitHub repository를 연결합니다.
5. 아래처럼 설정합니다.

| 항목 | 값 |
| --- | --- |
| Name | `life-manager-api` |
| Root Directory | `back` |
| Runtime | `Docker` |
| Branch | `main` |
| Dockerfile Path | `./Dockerfile` |

이 프로젝트의 `back/Dockerfile`은 FastAPI 앱을 실행하도록 이미 구성되어 있습니다.

```dockerfile
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Render는 `PORT` 환경변수를 자동으로 주입하므로 별도 포트 고정은 필요 없습니다.

## STEP 5. Render 백엔드 환경변수 설정

Render 서비스의 `Environment` 메뉴에서 아래 값을 추가합니다.

```txt
DATABASE_URL=mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/DATABASE?ssl_verify_cert=true
SECRET_KEY=충분히_긴_랜덤_문자열
OPENAI_API_KEY=sk-...
UPLOAD_DIR=/app/uploads
CORS_ORIGINS=http://localhost:5173
```

`SECRET_KEY`는 아래 PowerShell 명령으로 만들 수 있습니다.

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

처음에는 Vercel 주소가 아직 없으므로 `CORS_ORIGINS`에 임시로 로컬 주소를 넣어도 됩니다. 프론트엔드 배포 후 실제 Vercel 주소로 다시 수정합니다.

## STEP 6. Render 백엔드 배포 확인

Render에서 배포가 끝나면 서비스 URL이 발급됩니다.

예시:

```txt
https://life-manager-api.onrender.com
```

아래 주소를 브라우저에서 확인합니다.

```txt
https://life-manager-api.onrender.com/health
```

정상이라면 아래 응답이 나옵니다.

```json
{"status":"ok"}
```

API 문서는 아래 주소에서 확인할 수 있습니다.

```txt
https://life-manager-api.onrender.com/docs
```

## STEP 7. Vercel에 프론트엔드 배포

1. [Vercel](https://vercel.com)에 로그인합니다.
2. `Add New...` 또는 `New Project`를 클릭합니다.
3. GitHub repository를 선택합니다.
4. 아래처럼 설정합니다.

| 항목 | 값 |
| --- | --- |
| Framework Preset | `Vite` |
| Root Directory | `front` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

## STEP 8. Vercel 프론트엔드 환경변수 설정

Vercel 프로젝트의 `Settings` -> `Environment Variables`에서 아래 값을 추가합니다.

```txt
VITE_API_URL=https://life-manager-api.onrender.com
```

여기에는 STEP 6에서 확인한 Render 백엔드 URL을 넣습니다.

환경변수를 추가한 뒤 Vercel에서 다시 배포합니다.

## STEP 9. Render CORS 설정 업데이트

Vercel 배포가 끝나면 프론트엔드 URL이 발급됩니다.

예시:

```txt
https://life-manager.vercel.app
```

Render 백엔드의 `CORS_ORIGINS` 값을 아래처럼 수정합니다.

```txt
CORS_ORIGINS=https://life-manager.vercel.app
```

로컬 개발 환경도 함께 허용하고 싶다면 쉼표로 구분합니다.

```txt
CORS_ORIGINS=https://life-manager.vercel.app,http://localhost:5173
```

수정 후 Render 백엔드를 다시 배포합니다.

## STEP 10. 최종 확인

아래 순서로 확인합니다.

1. `https://life-manager-api.onrender.com/health` 접속
2. `https://life-manager-api.onrender.com/docs` 접속
3. `https://life-manager.vercel.app` 접속
4. 회원가입 또는 로그인 테스트
5. 할 일, 일정, 메모 등 DB에 저장되는 기능 테스트
6. AI 채팅 기능을 쓴다면 `OPENAI_API_KEY`가 정상인지 테스트

## 코드 수정 후 재배포

GitHub에 push하면 Vercel과 Render가 자동으로 새 배포를 시작합니다.

```powershell
git add .
git commit -m "update deployment"
git push origin main
```

## 자주 나는 문제

### 1. 프론트에서 API 호출이 실패함

확인할 것:

- Vercel의 `VITE_API_URL`이 Render 백엔드 URL인지 확인
- Render의 `CORS_ORIGINS`에 Vercel 프론트 URL이 들어갔는지 확인
- `VITE_API_URL` 수정 후 Vercel을 다시 배포했는지 확인

### 2. 백엔드가 TiDB에 연결하지 못함

확인할 것:

- `DATABASE_URL`의 host, port, username, password, database가 정확한지 확인
- TiDB Cloud에서 접속 허용 설정이 필요한지 확인
- 비밀번호에 특수문자가 있으면 URL 인코딩이 필요한지 확인
- `mysql+pymysql://...` 형식인지 확인

### 3. Render 배포는 됐는데 앱이 바로 응답하지 않음

Render 무료 인스턴스는 일정 시간 요청이 없으면 sleep 상태가 될 수 있습니다. 첫 요청은 시간이 조금 걸릴 수 있습니다.

### 4. DB 테이블이 자동 생성되는지 확인

현재 백엔드는 시작 시 아래 코드로 SQLAlchemy 모델 기준 테이블을 생성합니다.

```python
Base.metadata.create_all(bind=engine)
```

따라서 `DATABASE_URL`만 정상이라면 백엔드 시작 시 필요한 테이블이 생성됩니다.

## 환경변수 요약

Render 백엔드:

```txt
DATABASE_URL=mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/DATABASE?ssl_verify_cert=true
SECRET_KEY=충분히_긴_랜덤_문자열
OPENAI_API_KEY=sk-...
UPLOAD_DIR=/app/uploads
CORS_ORIGINS=https://life-manager.vercel.app
```

Vercel 프론트엔드:

```txt
VITE_API_URL=https://life-manager-api.onrender.com
```
