/**
 * 《谁在焦虑？——2020-2025中国青年网络情绪图谱》
 * 全部数据内嵌 · 打开 index.html 即可运行
 */

(function () {
  'use strict';

  /* ========== 内嵌数据集 ========== */
  const EMOTION_TREND = [
    { year: '2020', positive: 31, neutral: 25, negative: 44 },
    { year: '2021', positive: 34, neutral: 24, negative: 42 },
    { year: '2022', positive: 29, neutral: 23, negative: 48 },
    { year: '2023', positive: 38, neutral: 24, negative: 38 },
    { year: '2024', positive: 41, neutral: 23, negative: 36 },
    { year: '2025', positive: 43, neutral: 22, negative: 35 }
  ];

  const WORD_CLOUD_DATA = [
    { name: '焦虑', value: 9214 },
    { name: '压力', value: 8462 },
    { name: '内卷', value: 7821 },
    { name: '失业', value: 6254 },
    { name: '崩溃', value: 6031 },
    { name: '摆烂', value: 5876 },
    { name: '躺平', value: 5668 },
    { name: '愤怒', value: 5514 },
    { name: '失望', value: 4976 },
    { name: '抑郁', value: 4528 },
    { name: '加油', value: 8352 },
    { name: '希望', value: 7614 },
    { name: '幸福', value: 6437 },
    { name: '温暖', value: 6128 },
    { name: '开心', value: 5864 },
    { name: '感动', value: 5537 },
    { name: '喜欢', value: 4826 },
    { name: '支持', value: 4637 },
    { name: '梦想', value: 4324 },
    { name: '治愈', value: 3861 }
  ];

  const PROVINCE_ANXIETY = [
    { province: '北京', value: 74 },
    { province: '天津', value: 66 },
    { province: '上海', value: 78 },
    { province: '重庆', value: 69 },
    { province: '河北', value: 63 },
    { province: '河南', value: 71 },
    { province: '山东', value: 72 },
    { province: '山西', value: 61 },
    { province: '辽宁', value: 64 },
    { province: '吉林', value: 59 },
    { province: '黑龙江', value: 58 },
    { province: '江苏', value: 80 },
    { province: '浙江', value: 83 },
    { province: '安徽', value: 67 },
    { province: '福建', value: 76 },
    { province: '江西', value: 65 },
    { province: '湖北', value: 70 },
    { province: '湖南', value: 68 },
    { province: '广东', value: 86 },
    { province: '广西', value: 60 },
    { province: '海南', value: 62 },
    { province: '四川', value: 75 },
    { province: '贵州', value: 64 },
    { province: '云南', value: 63 },
    { province: '陕西', value: 66 },
    { province: '甘肃', value: 55 },
    { province: '青海', value: 52 },
    { province: '宁夏', value: 54 },
    { province: '新疆', value: 57 },
    { province: '西藏', value: 48 },
    { province: '内蒙古', value: 56 }
  ];

  const EVENT_DATA = [
    { event: '新冠疫情', year: '2020', positive: 28, negative: 72 },
    { event: '东京奥运会', year: '2021', positive: 65, negative: 35 },
    { event: '疫情防控调整', year: '2022', positive: 37, negative: 63 },
    { event: '淄博烧烤', year: '2023', positive: 81, negative: 19 },
    { event: '杭州亚运会', year: '2023', positive: 86, negative: 14 },
    { event: '神舟十八号', year: '2024', positive: 89, negative: 11 },
    { event: '春节档电影', year: '2025', positive: 77, negative: 23 }
  ];

  const INCOME_SCATTER = [
    { year: '2020', income: 32189, negative: 44 },
    { year: '2021', income: 35128, negative: 42 },
    { year: '2022', income: 36883, negative: 48 },
    { year: '2023', income: 39218, negative: 38 },
    { year: '2024', income: 41314, negative: 36 },
    { year: '2025', income: 43520, negative: 35 }
  ];

  const COLORS = {
    positive: '#2dd4bf',
    neutral: '#94a3b8',
    negative: '#f87171',
    gold: '#d4a853',
    red: '#c41e3a'
  };

  const charts = {};

  /* ========== 工具函数 ========== */
  function initChart(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const chart = echarts.init(el, null, { renderer: 'canvas' });
    charts[id] = chart;
    return chart;
  }

  function animateNumber(el, target, duration, suffix) {
    suffix = suffix || '';
    const start = 0;
    const startTime = performance.now();
    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.floor(start + (target - start) * eased);
      el.textContent = val.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ========== 封面粒子 ========== */
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    class P {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.r = Math.random() * 1.8 + 0.4;
        this.a = Math.random() * 0.45 + 0.15;
        this.h = Math.random() > 0.5 ? 350 + Math.random() * 30 : 0 + Math.random() * 20;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + this.h + ',70%,60%,' + this.a + ')';
        ctx.fill();
      }
    }

    resize();
    particles = Array.from({ length: 100 }, function () { return new P(); });

    function loop() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(function (p) { p.update(); p.draw(); });
      requestAnimationFrame(loop);
    }
    loop();
    window.addEventListener('resize', resize);
  }

  /* ========== 折线图：情绪趋势 ========== */
  function renderTrendChart() {
    const chart = initChart('chart-trend');
    if (!chart) return;

    const years = EMOTION_TREND.map(function (d) { return d.year; });

    chart.setOption({
      backgroundColor: 'transparent',
      color: [COLORS.positive, COLORS.neutral, COLORS.negative],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(17,24,39,0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f0f2f5' }
      },
      legend: {
        data: ['积极情绪', '中性情绪', '消极情绪'],
        top: 10,
        textStyle: { color: '#9ca8bc' }
      },
      grid: { left: '6%', right: '4%', bottom: '10%', top: '16%', containLabel: true },
      xAxis: {
        type: 'category',
        data: years,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#9ca8bc', fontSize: 13 }
      },
      yAxis: {
        type: 'value',
        name: '占比(%)',
        max: 55,
        nameTextStyle: { color: '#6b7a90' },
        axisLabel: { color: '#6b7a90', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        {
          name: '积极情绪', type: 'line', smooth: true, symbol: 'circle', symbolSize: 8,
          lineStyle: { width: 3 },
          data: EMOTION_TREND.map(function (d) { return d.positive; }),
          areaStyle: { color: 'rgba(45,212,191,0.12)' }
        },
        {
          name: '中性情绪', type: 'line', smooth: true, symbol: 'circle', symbolSize: 8,
          lineStyle: { width: 3 },
          data: EMOTION_TREND.map(function (d) { return d.neutral; })
        },
        {
          name: '消极情绪', type: 'line', smooth: true, symbol: 'circle', symbolSize: 8,
          lineStyle: { width: 3 },
          data: EMOTION_TREND.map(function (d) { return d.negative; }),
          areaStyle: { color: 'rgba(248,113,113,0.12)' },
          markPoint: {
            data: [{ type: 'max', name: '峰值' }],
            itemStyle: { color: COLORS.red }
          }
        }
      ],
      animationDuration: 1500,
      animationEasing: 'cubicOut'
    });
  }

  /* ========== 堆叠面积图 ========== */
  function renderStackedChart() {
    const chart = initChart('chart-stacked');
    if (!chart) return;

    chart.setOption({
      backgroundColor: 'transparent',
      color: [COLORS.positive, COLORS.neutral, COLORS.negative],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(17,24,39,0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f0f2f5' },
        formatter: function (params) {
          var total = 0;
          params.forEach(function (p) { total += p.value; });
          var html = params[0].axisValue + '年<br/>';
          params.forEach(function (p) {
            html += p.marker + p.seriesName + '：' + p.value + '%<br/>';
          });
          return html;
        }
      },
      legend: {
        data: ['积极情绪', '中性情绪', '消极情绪'],
        top: 10,
        textStyle: { color: '#9ca8bc' }
      },
      grid: { left: '6%', right: '4%', bottom: '10%', top: '16%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: EMOTION_TREND.map(function (d) { return d.year; }),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#9ca8bc' }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: '#6b7a90', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        {
          name: '积极情绪', type: 'line', stack: 'total', smooth: true,
          areaStyle: { opacity: 0.75 },
          emphasis: { focus: 'series' },
          data: EMOTION_TREND.map(function (d) { return d.positive; })
        },
        {
          name: '中性情绪', type: 'line', stack: 'total', smooth: true,
          areaStyle: { opacity: 0.65 },
          emphasis: { focus: 'series' },
          data: EMOTION_TREND.map(function (d) { return d.neutral; })
        },
        {
          name: '消极情绪', type: 'line', stack: 'total', smooth: true,
          areaStyle: { opacity: 0.75 },
          emphasis: { focus: 'series' },
          data: EMOTION_TREND.map(function (d) { return d.negative; })
        }
      ],
      animationDuration: 1800,
      animationEasing: 'cubicOut'
    });
  }

  /* ========== 词云图 ========== */
  function renderWordCloud() {
    const chart = initChart('chart-wordcloud');
    if (!chart) return;

    var maxVal = WORD_CLOUD_DATA[0].value;
    var cloudData = WORD_CLOUD_DATA.map(function (w, i) {
      var isNeg = ['焦虑', '压力', '内卷', '失业', '崩溃', '摆烂', '躺平', '愤怒', '失望', '抑郁'].indexOf(w.name) >= 0;
      return {
        name: w.name,
        value: w.value,
        textStyle: {
          color: isNeg
            ? 'hsl(' + (0 + Math.random() * 20) + ',75%,' + (52 + w.value / maxVal * 18) + '%)'
            : 'hsl(' + (160 + Math.random() * 40) + ',65%,' + (50 + w.value / maxVal * 20) + '%)'
        }
      };
    });

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        show: true,
        formatter: function (p) { return p.name + '：' + p.value.toLocaleString() + ' 次'; }
      },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        left: 'center',
        top: 'center',
        width: '92%',
        height: '92%',
        sizeRange: [16, 72],
        rotationRange: [-25, 25],
        gridSize: 8,
        drawOutOfBound: false,
        textStyle: {
          fontFamily: 'Noto Sans SC, Microsoft YaHei, sans-serif',
          fontWeight: 'bold'
        },
        emphasis: {
          textStyle: { shadowBlur: 12, shadowColor: 'rgba(212,168,83,0.6)' }
        },
        data: cloudData
      }],
      animationDuration: 1200
    });
  }

  /* ========== 中国地图热力图 ========== */
  function renderMapChart(geoJson) {
    const chart = initChart('chart-map');
    if (!chart) return;

    if (geoJson) {
      echarts.registerMap('china', geoJson);
    }

    var mapData = PROVINCE_ANXIETY.map(function (d) {
      return { name: d.province, value: d.value };
    });

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(17,24,39,0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f0f2f5' },
        formatter: function (p) {
          if (p.value != null && !isNaN(p.value)) {
            return p.name + '<br/>情绪热度指数：' + p.value;
          }
          return p.name;
        }
      },
      visualMap: {
        min: 48,
        max: 86,
        left: '4%',
        bottom: '6%',
        text: ['高', '低'],
        textStyle: { color: '#9ca8bc' },
        inRange: {
          color: ['#1e3a5f', '#2563eb', '#d4a853', '#c41e3a']
        },
        calculable: true
      },
      series: [{
        type: 'map',
        map: 'china',
        roam: true,
        scaleLimit: { min: 0.8, max: 3 },
        label: {
          show: true,
          color: '#e2e8f0',
          fontSize: 9
        },
        emphasis: {
          label: { color: '#fff', fontSize: 11 },
          itemStyle: { areaColor: '#c41e3a', shadowBlur: 12, shadowColor: 'rgba(196,30,58,0.5)' }
        },
        itemStyle: {
          areaColor: '#1a2236',
          borderColor: '#475569',
          borderWidth: 0.8
        },
        data: mapData
      }],
      animationDuration: 1500,
      animationEasing: 'elasticOut'
    });
  }

  /* 地图降级：省份排行柱状图（无 geojson 时同步渲染） */
  function renderMapFallback() {
    const chart = initChart('chart-map');
    if (!chart) return;

    var sorted = PROVINCE_ANXIETY.slice().sort(function (a, b) { return b.value - a.value; });

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function (p) { return p[0].name + '：' + p[0].value; }
      },
      grid: { left: '18%', right: '8%', bottom: '6%', top: '4%' },
      xAxis: {
        type: 'value',
        max: 90,
        axisLabel: { color: '#6b7a90' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      yAxis: {
        type: 'category',
        data: sorted.map(function (d) { return d.province; }).reverse(),
        axisLabel: { color: '#9ca8bc', fontSize: 11 },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      series: [{
        type: 'bar',
        data: sorted.map(function (d) { return d.value; }).reverse(),
        barWidth: '60%',
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#1e3a5f' },
            { offset: 1, color: '#c41e3a' }
          ])
        },
        label: {
          show: true,
          position: 'right',
          color: '#d4a853',
          formatter: '{c}'
        }
      }],
      animationDuration: 1200
    });
  }

  function loadChinaMap() {
    /* 先同步渲染省份排行，确保地图区域立即有内容 */
    renderMapFallback();

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'china.json', true);
    xhr.onload = function () {
      if (xhr.status === 200 || xhr.status === 0) {
        try {
          renderMapChart(JSON.parse(xhr.responseText));
          return;
        } catch (e) { /* fallthrough */ }
      }
      tryFetchMap();
    };
    xhr.onerror = tryFetchMap;
    xhr.send();
  }

  function tryFetchMap() {
    fetch('https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/china.json')
      .then(function (r) { return r.json(); })
      .then(function (geo) { renderMapChart(geo); })
      .catch(function () { renderMapFallback(); });
  }

  /* ========== 散点图 ========== */
  function renderScatterChart() {
    const chart = initChart('chart-scatter');
    if (!chart) return;

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(17,24,39,0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f0f2f5' },
        formatter: function (p) {
          return p.data[2] + '年<br/>可支配收入：' + p.data[0].toLocaleString() + ' 元<br/>负面情绪：' + p.data[1] + '%';
        }
      },
      grid: { left: '10%', right: '8%', bottom: '12%', top: '12%' },
      xAxis: {
        type: 'value',
        name: '居民可支配收入（元）',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: '#9ca8bc' },
        axisLabel: { color: '#6b7a90', formatter: function (v) { return (v / 1000) + 'k'; } },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      yAxis: {
        type: 'value',
        name: '负面情绪占比(%)',
        nameTextStyle: { color: '#9ca8bc' },
        axisLabel: { color: '#6b7a90', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [{
        type: 'scatter',
        symbolSize: function (data) { return 14 + (50 - data[1]) * 0.4; },
        data: INCOME_SCATTER.map(function (d) {
          return [d.income, d.negative, d.year];
        }),
        itemStyle: {
          color: function (params) {
            var colors = ['#64748b', '#94a3b8', '#c41e3a', '#2dd4bf', '#34d399', '#d4a853'];
            return colors[params.dataIndex] || COLORS.gold;
          },
          shadowBlur: 8,
          shadowColor: 'rgba(196,30,58,0.4)'
        },
        label: {
          show: true,
          formatter: function (p) { return p.data[2]; },
          position: 'top',
          color: '#d4a853',
          fontSize: 11
        }
      }],
      animationDuration: 1400
    });
  }

  /* ========== 时间轴 ========== */
  function renderTimeline() {
    var container = document.getElementById('timeline');
    if (!container) return;

    container.innerHTML = EVENT_DATA.map(function (ev) {
      return '<div class="timeline-item" data-observe="timeline">' +
        '<div class="timeline-year">' + ev.year + '</div>' +
        '<div>' +
          '<div class="timeline-event">' + ev.event + '</div>' +
          '<div class="emotion-bars">' +
            '<div class="pos" style="width:' + ev.positive + '%">积极 ' + ev.positive + '%</div>' +
            '<div class="neg" style="width:' + ev.negative + '%">消极 ' + ev.negative + '%</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /* ========== 滚动交互 ========== */
  function initScrollEffects() {
    var sections = document.querySelectorAll('.section[data-page]');
    var nav = document.getElementById('sideNav');

    if (nav) {
      nav.innerHTML = Array.from(sections).map(function (s, i) {
        return '<a href="#' + s.id + '" data-idx="' + (i + 1) + '" title="第' + (i + 1) + '页"></a>';
      }).join('');
    }

    var navDots = nav ? nav.querySelectorAll('a') : [];

    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          /* 数字动画 */
          entry.target.querySelectorAll('[data-count]').forEach(function (el) {
            if (el.dataset.animated) return;
            el.dataset.animated = '1';
            var target = parseInt(el.dataset.count, 10);
            var suffix = el.dataset.suffix || '';
            animateNumber(el, target, 1600, suffix);
          });

          /* 图表 resize */
          Object.values(charts).forEach(function (c) { c.resize(); });
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal, .timeline-item, .finding-panel').forEach(function (el) {
      revealObs.observe(el);
    });

    var pageObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var page = entry.target.dataset.page;
          navDots.forEach(function (d) {
            d.classList.toggle('active', d.dataset.idx === page);
          });
        }
      });
    }, { threshold: 0.45 });

    sections.forEach(function (s) { pageObs.observe(s); });

    /* 进度条 */
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      var bar = document.getElementById('progress-bar');
      if (bar) bar.style.width = progress + '%';

      var tip = document.querySelector('.scroll-tip');
      if (tip) tip.style.opacity = scrollTop > 80 ? '0' : '1';
    }, { passive: true });
  }

  /* ========== 初始化 ========== */
  function init() {
    initParticles();
    renderTrendChart();
    renderStackedChart();
    renderWordCloud();
    renderScatterChart();
    renderTimeline();
    loadChinaMap();
    initScrollEffects();

    window.addEventListener('resize', function () {
      Object.values(charts).forEach(function (c) { c.resize(); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
