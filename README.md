# 🤖 bi bot — 웹사이트 자동 QA 테스트 봇

> 한국어 | [English](#-bi-bot--automated-website-qa-testing-bot)

---

## 📌 소개

**bi bot**은 URL 하나만 입력하면 웹사이트를 자동으로 테스트해주는 QA 봇입니다.  
실제 브라우저로 사이트에 접속해서 로그인, 버튼, 링크, 폼, 성능 등을 자동으로 검사하고, 결과를 실시간으로 보여줍니다.

--

## 🚀 바로 사용하기 (설치 없음)

아래 링크로 바로 접속해서 사용할 수 있어요. 아무것도 설치 안 해도 됩니다.

```
https://qa-bot-production-0ef9.up.railway.app
```

1. URL 입력창에 테스트하고 싶은 웹사이트 주소를 넣으세요
2. 테스트 옵션 선택 (로그인, 버튼, 링크 등)
3. **시작** 버튼 클릭
4. 왼쪽에서 실시간 브라우저 화면, 오른쪽에서 테스트 결과 확인

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🌐 페이지 로드 확인 | HTTP 상태코드 체크 (200, 404 등) |
| 🧩 기본 요소 확인 | 네비게이션, 메인 콘텐츠, 푸터 존재 여부 |
| 🔐 로그인 테스트 | 아이디/비밀번호 자동 입력 및 결과 확인 |
| 📝 회원가입 테스트 | 폼 필드 자동 입력 (실제 제출은 안 함) |
| 🖱️ 버튼 테스트 | 페이지 내 버튼 호버/반응 확인 |
| 📋 폼 유효성 테스트 | 입력 필드 구조 확인 |
| 🔗 링크 테스트 | 내부 링크 순회 및 404 감지 |
| 🖥️ 콘솔 오류 분석 | 브라우저 콘솔 에러 자동 수집 |
| ⚡ 성능 측정 | 페이지 로드 시간 측정 |
| 📸 실시간 스크린샷 | 봇이 보는 화면을 실시간으로 확인 |
| 🤖 AI 분석 | Groq AI가 테스트 결과를 한국어로 해석 |

---

## 🚀 바로 사용하기 (설치 없음)

아래 링크로 바로 접속해서 사용할 수 있어요. 아무것도 설치 안 해도 됩니다.

```
https://qa-bot-production-0ef9.up.railway.app
```

1. URL 입력창에 테스트하고 싶은 웹사이트 주소를 넣으세요
2. 테스트 옵션 선택 (로그인, 버튼, 링크 등)
3. **시작** 버튼 클릭
4. 왼쪽에서 실시간 브라우저 화면, 오른쪽에서 테스트 결과 확인

---

## 🛠️ 직접 설치해서 사용하기

직접 서버를 띄우고 싶은 분들을 위한 가이드입니다.  
처음이라도 순서대로 따라오면 됩니다.

---

### 1단계 — 필요한 프로그램 설치

아래 두 가지가 컴퓨터에 없으면 먼저 설치해야 합니다.

#### Node.js (18 버전 이상 필요)
- [nodejs.org](https://nodejs.org) 접속
- **LTS** 버튼 클릭해서 다운로드 후 설치
- 설치 후 터미널에서 확인:
  ```bash
  node -v   # v18.0.0 이상이면 OK
  npm -v    # 같이 설치됨
  ```

#### Git
- [git-scm.com](https://git-scm.com) 접속해서 설치
- 설치 후 터미널에서 확인:
  ```bash
  git --version   # git version 2.xx.x 이면 OK
  ```

> 터미널은 맥에서는 **Terminal**, 윈도우에서는 **cmd** 또는 **PowerShell**을 열면 됩니다.

---

### 2단계 — Groq API 키 발급 (무료)

bi bot의 AI 분석 기능은 **Groq**라는 서비스를 사용합니다. 완전 무료입니다.

1. [console.groq.com](https://console.groq.com) 접속
2. **Sign Up** 클릭 → Google 계정으로 가입 가능
3. 로그인 후 왼쪽 메뉴에서 **API Keys** 클릭
4. **Create API Key** 버튼 클릭
5. 이름 아무거나 입력 후 생성
6. `gsk_...` 로 시작하는 긴 문자열이 나오면 복사해서 어딘가에 저장해두세요

> ⚠️ 이 키는 한 번만 보여줍니다. 반드시 복사해두세요!

---

### 3단계 — 코드 받기

터미널을 열고 아래 명령어를 입력하세요.

```bash
git clone https://github.com/bigad2007/QA-bot.git
cd QA-bot/backend
```

---

### 4단계 — 패키지 설치

```bash
npm install
```

> 처음엔 시간이 좀 걸립니다. 완료될 때까지 기다려주세요.

---

### 5단계 — Playwright 브라우저 설치

bi bot은 실제 Chrome 브라우저(Chromium)를 사용합니다. 아래 명령어로 설치하세요.

```bash
npx playwright install chromium
```

> 브라우저 파일을 다운로드하는 거라 시간이 걸릴 수 있어요.

---

### 6단계 — 환경변수 설정

```bash
cp .env.example .env
```

생성된 `.env` 파일을 텍스트 편집기(메모장, VS Code 등)로 열어서 아래처럼 수정하세요.

```
GROQ_API_KEY=여기에_2단계에서_복사한_키_붙여넣기
NODE_ENV=production
```

> 맥에서 `.env` 파일이 안 보이면 숨김 파일이라서 그래요.  
> Finder에서 `Cmd + Shift + .` 누르면 숨김 파일이 보입니다.  
> 또는 VS Code에서 폴더를 열면 바로 보입니다.

---

### 7단계 — 서버 실행

```bash
npm start
```

터미널에 아래 메시지가 뜨면 성공입니다.

```
bi bot running on port 3000
```

브라우저에서 `http://localhost:3000` 접속하면 됩니다! 🎉

---

## ☁️ Railway에 직접 배포하기 (선택사항)

내 봇을 인터넷에 공개해서 다른 사람도 쓸 수 있게 하고 싶다면 Railway를 사용하세요.  
무료 플랜이 있습니다.

1. [railway.app](https://railway.app) 접속
2. **GitHub 계정**으로 로그인
3. **New Project** → **Deploy from GitHub repo** 선택
4. `QA-bot` 저장소 선택
5. 배포가 완료되면 상단 **Variables** 탭 클릭 후 환경변수 추가:
   - `GROQ_API_KEY` = 발급받은 Groq 키
   - `NODE_ENV` = `production`
6. **Settings → Networking → Generate Domain** 클릭하면 공개 URL이 생성됩니다

---

## 📁 폴더 구조

```
backend/
├── server.js        # 서버 진입점 (WebSocket, REST API)
├── bot.js           # 브라우저 자동화 핵심 로직
├── frontend/
│   └── index.html   # 프론트엔드 UI
├── Dockerfile       # Docker 설정 (Railway 배포용)
├── .env.example     # 환경변수 예시 파일
└── package.json     # 패키지 목록
```

---

## 🛠️ 기술 스택

- **Backend** — Node.js, Express, WebSocket
- **브라우저 자동화** — Playwright (Chromium)
- **AI** — Groq API (llama-3.3-70b)
- **배포** — Railway + Docker

---

## ❓ 자주 묻는 질문

**Q. 실제로 로그인이 되나요?**  
A. 테스트 계정으로 로그인을 시도하지만, 실제 개인정보는 저장하지 않습니다.

**Q. 회원가입 버튼까지 누르나요?**  
A. 폼 입력까지만 하고 실제 제출은 하지 않습니다. 실수로 가입되는 일 없어요.

**Q. 어떤 사이트든 다 되나요?**  
A. 대부분의 공개 웹사이트는 됩니다. 단, 봇 차단이 강한 사이트(Cloudflare 등)는 제한될 수 있어요.

**Q. npm install이 실패해요.**  
A. `node -v`로 버전 확인 후 18 미만이면 nodejs.org에서 최신 LTS 버전으로 다시 설치해주세요.

**Q. Groq API 키 없이도 되나요?**  
A. 기본 테스트는 돌아가지만, AI 코멘트 기능이 작동하지 않습니다.

**Q. `.env` 파일이 안 보여요.**  
A. `.`으로 시작하는 파일은 숨김 파일입니다. VS Code로 폴더를 열거나, 맥은 `Cmd + Shift + .`을 눌러보세요.

---

---

# 🤖 bi bot — Automated Website QA Testing Bot

> [한국어](#-bi-bot--웹사이트-자동-qa-테스트-봇) | English

---

## 📌 About

**bi bot** automatically tests your website just by entering a URL.  
It uses a real browser to check login, buttons, links, forms, performance, and more — all in real time.

No coding required. Just paste a URL.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌐 Page Load Check | HTTP status code verification (200, 404, etc.) |
| 🧩 Element Check | Navigation, main content, footer detection |
| 🔐 Login Test | Auto-fill credentials and verify result |
| 📝 Signup Test | Auto-fill form fields (no actual submission) |
| 🖱️ Button Test | Hover and interaction check for buttons |
| 📋 Form Validation | Input field structure analysis |
| 🔗 Link Test | Internal link crawl and 404 detection |
| 🖥️ Console Error Analysis | Automatic browser console error collection |
| ⚡ Performance Measurement | Page load time tracking |
| 📸 Live Screenshot | See exactly what the bot sees in real time |
| 🤖 AI Analysis | Groq AI interprets test results in plain language |

---

## 🚀 Use Instantly (No Install)

Just visit the link below — no setup needed.

```
https://qa-bot-production-0ef9.up.railway.app
```

1. Enter the URL of the website you want to test
2. Select test options (login, buttons, links, etc.)
3. Click **Start**
4. Watch the live browser on the left, results on the right

---

## 🛠️ Run It Yourself

Want to host your own instance? Follow the steps below.  
No experience needed — just go step by step.

---

### Step 1 — Install Required Programs

#### Node.js (version 18 or higher)
- Go to [nodejs.org](https://nodejs.org)
- Click **LTS** to download and install
- Verify in terminal:
  ```bash
  node -v   # Should show v18.0.0 or higher
  npm -v    # Installed automatically with Node.js
  ```

#### Git
- Go to [git-scm.com](https://git-scm.com) and install
- Verify in terminal:
  ```bash
  git --version   # Should show git version 2.xx.x
  ```

> On Mac, use **Terminal**. On Windows, use **cmd** or **PowerShell**.

---

### Step 2 — Get a Free Groq API Key

bi bot's AI analysis feature uses **Groq**. It's completely free.

1. Go to [console.groq.com](https://console.groq.com)
2. Click **Sign Up** — you can use a Google account
3. After logging in, click **API Keys** in the left sidebar
4. Click **Create API Key**
5. Give it any name and click Create
6. Copy the key (starts with `gsk_...`) and save it somewhere safe

> ⚠️ You'll only see this key once. Copy it before closing!

---

### Step 3 — Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/bigad2007/QA-bot.git
cd QA-bot/backend
```

---

### Step 4 — Install Packages

```bash
npm install
```

> This may take a minute. Just wait for it to finish.

---

### Step 5 — Install Playwright Browser

bi bot runs a real Chromium browser. Install it with:

```bash
npx playwright install chromium
```

> This downloads browser files — it might take a moment.

---

### Step 6 — Set Up Environment Variables

```bash
cp .env.example .env
```

Open the `.env` file in any text editor (Notepad, VS Code, etc.) and update it:

```
GROQ_API_KEY=paste_your_key_from_step_2_here
NODE_ENV=production
```

> If you can't see the `.env` file, it's a hidden file.  
> On Mac, press `Cmd + Shift + .` in Finder, or just open the folder in VS Code.

---

### Step 7 — Start the Server

```bash
npm start
```

If you see this message, it's working:

```
bi bot running on port 3000
```

Open `http://localhost:3000` in your browser. 🎉

---

## ☁️ Deploy to Railway (Optional)

Want to make your bot publicly accessible online? Use Railway — it has a free plan.

1. Go to [railway.app](https://railway.app) and log in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select the `QA-bot` repository
4. After deployment, go to the **Variables** tab and add:
   - `GROQ_API_KEY` = your key from Step 2
   - `NODE_ENV` = `production`
5. Go to **Settings → Networking → Generate Domain** to get a public URL

---

## 📁 Project Structure

```
backend/
├── server.js        # Server entry point (WebSocket, REST API)
├── bot.js           # Core browser automation logic
├── frontend/
│   └── index.html   # Frontend UI
├── Dockerfile       # Docker config (for Railway deployment)
├── .env.example     # Environment variable template
└── package.json     # Package list
```

---

## 🛠️ Tech Stack

- **Backend** — Node.js, Express, WebSocket
- **Browser Automation** — Playwright (Chromium)
- **AI** — Groq API (llama-3.3-70b)
- **Deployment** — Railway + Docker

---

## ❓ FAQ

**Q. Does it actually log in to my site?**  
A. It attempts login with test credentials, but no personal data is stored.

**Q. Will it actually submit signup forms?**  
A. No. It fills in the form fields but never clicks submit. Safe by design.

**Q. Does it work on any website?**  
A. Most public websites work. Sites with strong bot protection (e.g. Cloudflare) may be restricted.

**Q. npm install fails — what do I do?**  
A. Run `node -v` to check your version. If it's below 18, reinstall Node.js from nodejs.org.

**Q. Can I use it without a Groq API key?**  
A. Basic tests will still run, but AI-generated comments won't appear.

**Q. I can't find the `.env` file.**  
A. It's a hidden file (starts with a dot). Open the folder in VS Code, or press `Cmd + Shift + .` on Mac.

---

> Made with ☕ by bigad2007
