/**
 * main.js
 * 滚动叙事、动画交互与页面初始化
 */

(function () {
  'use strict';

  /** 粒子背景动画 */
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;
    let mouse = { x: null, y: null };

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2 + 0.5;
        this.alpha = Math.random() * 0.5 + 0.2;
        // 情绪色彩：蓝绿为正，红紫为负
        this.hue = Math.random() > 0.5 ? 180 + Math.random() * 40 : 340 + Math.random() * 30;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;

        if (mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            this.vx -= dx * 0.0003;
            this.vy -= dy * 0.0003;
          }
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.alpha})`;
        ctx.fill();
      }
    }

    function init() {
      resize();
      particles = Array.from({ length: Math.min(120, Math.floor(w * h / 12000)) }, () => new Particle());
    }

    function connect() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(100, 180, 200, ${0.15 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => { p.update(); p.draw(); });
      connect();
      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    init();
    animate();
  }

  /** GSAP 滚动叙事动画 */
  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // 章节标题入场
    gsap.utils.toArray('.chapter-title').forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      });
    });

    // 导语段落逐段显现
    gsap.utils.toArray('.lead-paragraph').forEach((el, i) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%' },
        y: 40,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.1,
        ease: 'power2.out'
      });
    });

    // 传播机制流程步骤
    gsap.utils.toArray('.flow-step').forEach((el, i) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 90%' },
        x: -30,
        opacity: 0,
        duration: 0.6,
        delay: i * 0.15,
        ease: 'back.out(1.2)'
      });
    });

    // 视差背景
    gsap.utils.toArray('.parallax-bg').forEach((el) => {
      gsap.to(el, {
        scrollTrigger: { trigger: el.parentElement, scrub: true },
        y: 80,
        ease: 'none'
      });
    });

    // 进度指示器
    ScrollTrigger.create({
      trigger: 'main',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const bar = document.getElementById('progress-bar');
        if (bar) bar.style.width = `${self.progress * 100}%`;
      }
    });
  }

  /** 情绪柱状图进入视口动画 */
  function setupChartObservers(computed) {
    ChartManager.animateChartOnVisible(
      'chart-emotion-bar',
      ChartManager.renderEmotionBar,
      computed.smp2020Emotions
    );

    const chartSections = ['chart-sentiment-donut', 'chart-wordcloud'];
    chartSections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const chart = ChartManager.instances[id];
            if (chart) chart.resize();
          }
        });
      }, { threshold: 0.2 });
      observer.observe(el);
    });
  }

  /** 注入导语中的真实数据引用 */
  function injectIntroDataSnippets(snippets) {
    const container = document.getElementById('intro-data-snippets');
    if (!container) return;

    if (!snippets.length) {
      container.innerHTML = `<p class="data-pending-inline">※ 国家统计局、CNNIC、教育部公开统计数据导入后，此处将自动引用真实数字。</p>`;
      return;
    }

    container.innerHTML = snippets.map((s) => `<p class="data-snippet">${s}</p>`).join('');
  }

  /** 导航与滚动提示 */
  function initNavigation() {
    const nav = document.getElementById('chapter-nav');
    const chapters = document.querySelectorAll('section[data-chapter]');

    if (nav && chapters.length) {
      nav.innerHTML = Array.from(chapters).map((s, i) =>
        `<a href="#${s.id}" class="nav-dot" data-index="${i + 1}" title="第${i + 1}章"></a>`
      ).join('');

      const dots = nav.querySelectorAll('.nav-dot');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = entry.target.dataset.chapter;
            dots.forEach((d) => d.classList.toggle('active', d.dataset.index === idx));
          }
        });
      }, { threshold: 0.4 });

      chapters.forEach((s) => observer.observe(s));
    }

    // 向下滚动提示
    const scrollHint = document.querySelector('.scroll-hint');
    if (scrollHint) {
      window.addEventListener('scroll', () => {
        scrollHint.style.opacity = window.scrollY > 100 ? '0' : '1';
      }, { passive: true });
    }
  }

  /** 主初始化流程 */
  async function init() {
    const loader = document.getElementById('loading-overlay');
    try {
      const store = await DataProcessor.loadAllData();
      const { computed } = store;

      // 初始化图表（基于真实数据）
      ChartManager.initAllCharts(computed);

      // 导语数据引用
      injectIntroDataSnippets(computed.introSnippets);

      // 图表动画观察器
      setupChartObservers(computed);

      // 数据加载状态面板
      renderDataStatus(store.loadStatus);

    } catch (err) {
      console.error('[Init] 数据加载失败:', err);
      document.querySelectorAll('.chart-container').forEach((el) => {
        ChartManager.showPending(el, '数据加载失败，请检查 /data 目录');
      });
    } finally {
      if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 600);
      }
    }

    initParticles();
    initScrollAnimations();
    initNavigation();

    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 800, once: true, offset: 80 });
    }
  }

  /** 显示各数据源加载状态 */
  function renderDataStatus(status) {
    const el = document.getElementById('data-status-panel');
    if (!el) return;

    const labels = {
      weibo: 'weibo_senti_100k',
      smp2020: 'SMP2020',
      cnnic: 'CNNIC',
      stats: '国家统计局',
      moe: '教育部'
    };

    el.innerHTML = Object.entries(status).map(([key, loaded]) => `
      <span class="status-badge ${loaded ? 'loaded' : 'pending'}">
        ${labels[key]}：${loaded ? '已加载' : '等待导入'}
      </span>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
