const { chromium } = require('playwright');

class BotRunner {
  constructor(sessionId, config, onEvent) {
    this.sessionId = sessionId;
    this.config = config;
    this.onEvent = onEvent; // WebSocket으로 이벤트 전달하는 콜백
    this.browser = null;
    this.page = null;
    this.stopped = false;
    this.counts = { ok: 0, err: 0, warn: 0, fb: 0 };
  }

  // 이벤트 emit (WebSocket + DB 저장)
  emit(type, message, screenshot = null) {
    if (this.stopped) return;
    if (['ok','err','warn','fb'].includes(type)) {
      this.counts[type] = (this.counts[type] || 0) + 1;
    }
    this.onEvent({ type, message, screenshot, counts: { ...this.counts } });
  }

  emitLog(type, message) {
    this.onEvent({ type: 'log', logType: type, message });
  }

  emitStatus(text) {
    this.onEvent({ type: 'status', text });
  }

  emitAI(message) {
    this.onEvent({ type: 'ai_message', message });
  }

  emitProgress(current, total) {
    this.onEvent({ type: 'progress', current, total });
  }

  stop() {
    this.stopped = true;
  }

  async sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // 스크린샷 base64로 캡처
  async screenshot() {
    try {
      if (!this.page) return null;
      const buf = await this.page.screenshot({ type: 'jpeg', quality: 60, fullPage: false });
      return buf.toString('base64');
    } catch {
      return null;
    }
  }

  async run() {
    const cfg = this.config;

    try {
      // 브라우저 시작
      this.emitLog('info', '브라우저 시작 중...');
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
        ignoreHTTPSErrors: true,
      });

      // 콘솔 오류 캡처
      const consoleErrors = [];
      this.page = await context.newPage();
      this.page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      this.page.on('pageerror', err => consoleErrors.push(err.message));

      const steps = this.buildSteps(consoleErrors);
      const total = steps.length;

      for (let i = 0; i < steps.length; i++) {
        if (this.stopped) break;
        this.emitProgress(i + 1, total);
        this.emitStatus(`실행 중: ${steps[i].name}`);
        await steps[i].fn();
        await this.sleep(500);
      }

      if (!this.stopped) {
        const shot = await this.screenshot();
        this.emitStatus('테스트 완료 ✓');
        this.emitProgress(total, total);
        this.emitAI(`📊 테스트 완료!\n- ✅ 정상: ${this.counts.ok}개\n- 🚨 오류: ${this.counts.err}개\n- ⚠️ 의심: ${this.counts.warn}개\n- 💬 피드백: ${this.counts.fb}개\n\n${this.counts.err > 0 ? '오류가 발견되었습니다. 로그를 확인해주세요!' : '모든 테스트가 정상 완료되었습니다! 🎉'}`);
        this.onEvent({ type: 'done', counts: { ...this.counts }, screenshot: shot });
      }

    } catch (err) {
      this.emitLog('err', `치명적 오류: ${err.message}`);
      this.onEvent({ type: 'error', message: err.message });
    } finally {
      if (this.browser) await this.browser.close().catch(() => {});
    }
  }

  buildSteps(consoleErrors) {
    const cfg = this.config;
    const steps = [];

    // ── 1. 페이지 로드 ──
    steps.push({ name: '페이지 로드', fn: async () => {
      this.emitLog('info', `접속 시도: ${cfg.targetUrl}`);
      try {
        const res = await this.page.goto(cfg.targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const status = res?.status() || 0;
        const shot = await this.screenshot();
        if (status >= 200 && status < 400) {
          this.emitLog('ok', `페이지 로드 성공 (HTTP ${status})`);
          this.emit('ok', `페이지 로드 성공 (HTTP ${status})`, shot);
        } else {
          this.emitLog('err', `페이지 로드 실패 (HTTP ${status})`);
          this.emit('err', `페이지 로드 실패 (HTTP ${status})`, shot);
          this.emitAI(`🚨 페이지가 HTTP ${status} 오류를 반환했습니다. 서버 상태를 확인해주세요.`);
        }
      } catch (e) {
        const shot = await this.screenshot();
        this.emitLog('err', `페이지 접근 불가: ${e.message}`);
        this.emit('err', `접근 불가: ${e.message}`, shot);
        this.emitAI(`🚨 사이트에 접근할 수 없습니다: ${e.message}`);
      }
    }});

    // ── 2. 기본 요소 확인 ──
    steps.push({ name: '기본 요소 확인', fn: async () => {
      this.emitLog('info', '기본 HTML 요소 확인 중...');
      const checks = [
        { selector: 'title', label: '페이지 제목' },
        { selector: 'nav, header, [role="navigation"]', label: '네비게이션' },
        { selector: 'main, #main, .main, [role="main"]', label: '메인 콘텐츠' },
        { selector: 'footer', label: '푸터' },
      ];
      for (const c of checks) {
        if (this.stopped) break;
        try {
          const el = await this.page.$(c.selector);
          if (el) {
            this.emitLog('ok', `${c.label} 존재 확인`);
            this.emit('ok', `${c.label} 요소 존재`);
          } else {
            this.emitLog('warn', `${c.label} 없음`);
            this.emit('warn', `${c.label} 요소 없음`);
          }
        } catch {}
      }
      const shot = await this.screenshot();
      if (shot) this.onEvent({ type: 'screenshot', data: shot });
    }});

    // ── 3. 로그인 테스트 ──
    if (cfg.useLogin) {
      steps.push({ name: '로그인 시도', fn: async () => {
        this.emitLog('info', '로그인 폼 탐색 중...');
        try {
          // 로그인 페이지 이동 시도
          const loginSelectors = [
            'a[href*="login"]', 'a[href*="signin"]', 'a[href*="로그인"]',
            'button:has-text("로그인")', 'button:has-text("Login")',
          ];
          let navigated = false;
          for (const sel of loginSelectors) {
            try {
              const el = await this.page.$(sel);
              if (el) { await el.click(); await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 }); navigated = true; break; }
            } catch {}
          }
          if (!navigated) {
            // 직접 /login 시도
            try { await this.page.goto(cfg.targetUrl + '/login', { timeout: 8000 }); } catch {}
          }

          await this.sleep(1000);
          const shot1 = await this.screenshot();
          if (shot1) this.onEvent({ type: 'screenshot', data: shot1 });

          // 아이디 입력
          const idSelectors = ['input[type="email"]','input[name="email"]','input[name="username"]','input[name="id"]','input[placeholder*="아이디"]','input[placeholder*="이메일"]'];
          const pwSelectors = ['input[type="password"]'];

          let idFilled = false, pwFilled = false;
          for (const sel of idSelectors) {
            try { await this.page.fill(sel, cfg.loginId || 'test@test.com'); idFilled = true; break; } catch {}
          }
          for (const sel of pwSelectors) {
            try { await this.page.fill(sel, cfg.loginPw || 'testpassword'); pwFilled = true; break; } catch {}
          }

          if (idFilled && pwFilled) {
            this.emitLog('info', '아이디/비밀번호 입력 완료');
            await this.sleep(500);

            // 로그인 버튼 클릭
            const submitSelectors = ['button[type="submit"]','input[type="submit"]','button:has-text("로그인")','button:has-text("Login")','button:has-text("Sign in")'];
            for (const sel of submitSelectors) {
              try {
                await this.page.click(sel, { timeout: 3000 });
                await this.page.waitForLoadState('domcontentloaded', { timeout: 8000 });
                break;
              } catch {}
            }

            await this.sleep(1500);
            const shot2 = await this.screenshot();

            // 로그인 성공 여부 판단
            const url = this.page.url();
            const hasError = await this.page.$('.error, .alert-danger, [role="alert"]').catch(() => null);

            if (hasError || url.includes('login') || url.includes('signin')) {
              this.emitLog('warn', '로그인 실패 또는 오류 메시지 감지');
              this.emit('warn', '로그인 실패 감지', shot2);
              this.emitAI('⚠️ 로그인이 실패했습니다. 자격증명을 확인하거나 회원가입이 필요할 수 있습니다.');
              if (cfg.useSignup) {
                this.emitLog('info', '→ 회원가입 플로우로 전환');
              }
            } else {
              this.emitLog('ok', `로그인 성공! 현재 URL: ${url}`);
              this.emit('ok', '로그인 성공', shot2);
              this.emitAI('✅ 로그인 성공! 대시보드 또는 메인 페이지로 이동됐습니다.');
            }
          } else {
            this.emitLog('warn', '로그인 폼을 찾을 수 없음');
            this.emit('warn', '로그인 폼 없음');
            this.emitAI('⚠️ 로그인 폼을 찾을 수 없었습니다. 셀렉터를 확인해주세요.');
          }
        } catch (e) {
          this.emitLog('err', `로그인 테스트 오류: ${e.message}`);
          this.emit('err', `로그인 오류: ${e.message}`);
        }
      }});
    }

    // ── 4. 회원가입 테스트 ──
    if (cfg.useSignup) {
      steps.push({ name: '회원가입 테스트', fn: async () => {
        this.emitLog('info', '회원가입 페이지 탐색 중...');
        try {
          const signupSelectors = ['a[href*="register"]','a[href*="signup"]','a[href*="join"]','a[href*="회원가입"]','button:has-text("회원가입")'];
          let navigated = false;
          for (const sel of signupSelectors) {
            try { const el = await this.page.$(sel); if (el) { await el.click(); await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 }); navigated = true; break; } } catch {}
          }
          if (!navigated) {
            try { await this.page.goto(cfg.targetUrl + '/register', { timeout: 8000 }); } catch {}
          }

          await this.sleep(1000);
          const shot = await this.screenshot();
          if (shot) this.onEvent({ type: 'screenshot', data: shot });

          // 각 필드 채우기
          const fieldMap = [
            { selectors: ['input[name="username"]','input[name="id"]','input[placeholder*="아이디"]'], value: cfg.signupId || 'bibot_test_user' },
            { selectors: ['input[type="email"]','input[name="email"]'], value: cfg.signupEmail || 'bibot@test.com' },
            { selectors: ['input[type="password"]','input[name="password"]'], value: cfg.signupPw || 'TestPass123!' },
          ];

          if (cfg.usePhone) fieldMap.push({ selectors: ['input[name="phone"]','input[placeholder*="전화"]','input[type="tel"]'], value: cfg.signupPhone || '010-1234-5678' });
          if (cfg.useRRN) fieldMap.push({ selectors: ['input[name="rrn"]','input[placeholder*="주민"]'], value: cfg.signupRRN || '000101-1234567' });

          let filled = 0;
          for (const field of fieldMap) {
            for (const sel of field.selectors) {
              try { await this.page.fill(sel, field.value); filled++; break; } catch {}
            }
          }

          this.emitLog('info', `회원가입 폼 ${filled}개 필드 입력 완료`);
          const shot2 = await this.screenshot();
          this.emit('ok', `회원가입 폼 입력 완료 (${filled}개 필드)`, shot2);
          this.emitAI(`✅ 회원가입 폼 입력 완료. ${filled}개 필드가 채워졌습니다.`);

          // 제출은 실제로 하지 않음 (실제 DB에 저장될 수 있어서 warn 처리)
          this.emitLog('warn', '회원가입 실제 제출은 생략 (실제 DB 영향 방지)');
          this.emit('warn', '회원가입 제출 생략 (안전 모드)');
        } catch (e) {
          this.emitLog('err', `회원가입 테스트 오류: ${e.message}`);
          this.emit('err', `회원가입 오류: ${e.message}`);
        }
      }});
    }

    // ── 5. 버튼 클릭 테스트 ──
    if (cfg.testButtons) {
      steps.push({ name: '버튼 클릭 테스트', fn: async () => {
        this.emitLog('info', '페이지 내 버튼 탐색 중...');
        try {
          await this.page.goto(cfg.targetUrl, { timeout: 10000 });
          await this.sleep(1000);

          const buttons = await this.page.$$('button, a[href], [role="button"]');
          const testCount = Math.min(buttons.length, 8);
          this.emitLog('info', `버튼 ${buttons.length}개 발견, ${testCount}개 테스트`);

          for (let i = 0; i < testCount; i++) {
            if (this.stopped) break;
            try {
              const btn = buttons[i];
              const text = (await btn.textContent() || '').trim().slice(0, 30);
              const isVisible = await btn.isVisible();
              if (!isVisible) continue;

              // 호버 테스트
              await btn.hover({ timeout: 2000 });
              await this.sleep(300);

              this.emitLog('ok', `버튼 [${text || i}] 호버 정상`);
              this.emit('ok', `버튼 "${text || '요소 ' + i}" 반응 정상`);
            } catch (e) {
              this.emitLog('warn', `버튼 [${i}] 접근 불가: ${e.message.slice(0, 60)}`);
              this.emit('warn', `버튼 접근 불가`);
            }
            await this.sleep(200);
          }

          const shot = await this.screenshot();
          if (shot) this.onEvent({ type: 'screenshot', data: shot });
        } catch (e) {
          this.emitLog('err', `버튼 테스트 오류: ${e.message}`);
        }
      }});
    }

    // ── 6. 폼 유효성 테스트 ──
    if (cfg.testForms) {
      steps.push({ name: '폼 유효성 테스트', fn: async () => {
        this.emitLog('info', '폼 요소 탐색 중...');
        try {
          const forms = await this.page.$$('form');
          this.emitLog('info', `폼 ${forms.length}개 발견`);

          for (let i = 0; i < Math.min(forms.length, 3); i++) {
            if (this.stopped) break;
            const inputs = await forms[i].$$('input:not([type="hidden"]):not([type="submit"])');
            this.emitLog('info', `폼 ${i+1}: 입력 필드 ${inputs.length}개`);

            if (inputs.length > 0) {
              this.emit('ok', `폼 ${i+1} 구조 정상 (${inputs.length}개 필드)`);
            } else {
              this.emit('warn', `폼 ${i+1}에 입력 필드 없음`);
            }
          }

          if (forms.length === 0) {
            this.emitLog('warn', '폼 요소 없음');
            this.emit('warn', '페이지에 폼 없음');
          }
        } catch (e) {
          this.emitLog('err', `폼 테스트 오류: ${e.message}`);
        }
      }});
    }

    // ── 7. 네비게이션 링크 테스트 ──
    if (cfg.testNav) {
      steps.push({ name: '네비게이션 테스트', fn: async () => {
        this.emitLog('info', '내부 링크 수집 중...');
        try {
          await this.page.goto(cfg.targetUrl, { timeout: 10000 });
          await this.sleep(1000);

          const links = await this.page.$$eval('a[href]', els =>
            els.map(e => e.href).filter(h => h && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('javascript:'))
          );

          const origin = new URL(cfg.targetUrl).origin;
          const internal = [...new Set(links.filter(l => l.startsWith(origin)))].slice(0, 6);
          this.emitLog('info', `내부 링크 ${internal.length}개 테스트`);

          for (const link of internal) {
            if (this.stopped) break;
            try {
              const res = await this.page.goto(link, { timeout: 8000 });
              const status = res?.status() || 0;
              await this.sleep(600);
              const shot = await this.screenshot();

              if (status >= 200 && status < 400) {
                this.emitLog('ok', `${link} → ${status}`);
                this.emit('ok', `링크 정상: ${link.replace(origin,'')}`, shot);
              } else if (status === 404) {
                this.emitLog('err', `${link} → 404 Not Found`);
                this.emit('err', `404 오류: ${link.replace(origin,'')}`, shot);
                this.emitAI(`🚨 링크 404 발견: \`${link.replace(origin,'')}\` — 라우팅 확인 필요!`);
                this.emit('fb', `피드백: ${link.replace(origin,'')} 404`);
              } else {
                this.emitLog('warn', `${link} → ${status}`);
                this.emit('warn', `링크 응답 이상 (${status}): ${link.replace(origin,'')}`);
              }
            } catch (e) {
              this.emitLog('err', `${link} 접근 실패: ${e.message.slice(0,60)}`);
              this.emit('err', `링크 접근 실패: ${link.replace(origin,'')}`);
            }
          }
        } catch (e) {
          this.emitLog('err', `네비게이션 테스트 오류: ${e.message}`);
        }
      }});
    }

    // ── 8. 콘솔 오류 분석 ──
    if (cfg.testConsole) {
      steps.push({ name: '콘솔 오류 분석', fn: async () => {
        this.emitLog('info', '콘솔 오류 분석 중...');
        await this.page.goto(cfg.targetUrl, { timeout: 10000 });
        await this.sleep(2000); // 오류 발생 대기

        if (consoleErrors.length === 0) {
          this.emitLog('ok', '콘솔 오류 없음 ✓');
          this.emit('ok', '콘솔 오류 없음');
        } else {
          for (const err of consoleErrors.slice(0, 5)) {
            this.emitLog('err', `콘솔 오류: ${err.slice(0, 120)}`);
            this.emit('err', `콘솔 오류: ${err.slice(0, 80)}`);
          }
          this.emit('fb', `콘솔 오류 ${consoleErrors.length}개 감지`);
          this.emitAI(`🚨 콘솔에서 ${consoleErrors.length}개 오류 감지:\n${consoleErrors.slice(0,3).map(e => `• ${e.slice(0,100)}`).join('\n')}`);
        }
      }});
    }

    // ── 9. 성능 체크 ──
    steps.push({ name: '성능 측정', fn: async () => {
      this.emitLog('info', '페이지 성능 측정 중...');
      try {
        const start = Date.now();
        await this.page.goto(cfg.targetUrl, { waitUntil: 'load', timeout: 15000 });
        const loadTime = Date.now() - start;

        const metrics = await this.page.evaluate(() => {
          const perf = performance.getEntriesByType('navigation')[0];
          return {
            domContentLoaded: Math.round(perf?.domContentLoadedEventEnd || 0),
            loadComplete: Math.round(perf?.loadEventEnd || 0),
          };
        });

        if (loadTime < 2000) {
          this.emitLog('ok', `로드 시간: ${loadTime}ms (빠름)`);
          this.emit('ok', `페이지 로드 ${loadTime}ms — 빠름 ✓`);
        } else if (loadTime < 5000) {
          this.emitLog('warn', `로드 시간: ${loadTime}ms (보통)`);
          this.emit('warn', `페이지 로드 ${loadTime}ms — 최적화 권장`);
          this.emitAI(`⚠️ 페이지 로드가 ${loadTime}ms 걸렸습니다. 이미지 최적화나 캐싱을 고려해보세요.`);
        } else {
          this.emitLog('err', `로드 시간: ${loadTime}ms (느림)`);
          this.emit('err', `페이지 로드 ${loadTime}ms — 심각하게 느림`);
          this.emitAI(`🚨 페이지 로드가 ${loadTime}ms로 매우 느립니다! 서버 응답 시간, 번들 크기, 이미지 최적화를 확인하세요.`);
          this.emit('fb', `성능 피드백: 로드 ${loadTime}ms`);
        }
      } catch (e) {
        this.emitLog('err', `성능 측정 실패: ${e.message}`);
      }
    }});

    return steps;
  }
}

module.exports = { BotRunner };
