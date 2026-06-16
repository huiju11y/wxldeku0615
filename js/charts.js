/**
 * charts.js
 * ECharts 图表模块 —— 所有图表绑定真实数据计算结果
 * 数据未就绪时显示「等待导入真实数据」
 */

const ChartManager = {
  instances: {},
  initialized: false
};

/** 情绪配色方案 */
const EMOTION_COLORS = {
  正向: '#4ECDC4',
  负向: '#FF6B6B',
  喜悦: '#FFD93D',
  愤怒: '#FF6B6B',
  悲伤: '#6C8EBF',
  恐惧: '#9B59B6',
  惊讶: '#F39C12',
  中性: '#95A5A6'
};

/**
 * 显示占位状态
 */
function showPending(el, message) {
  if (!el) return;
  el.innerHTML = `
    <div class="chart-pending">
      <div class="chart-pending-icon">📊</div>
      <p>${message || DataProcessor.PENDING_MSG}</p>
    </div>
  `;
}

/**
 * 初始化或获取 ECharts 实例
 */
function getChart(domId) {
  const el = document.getElementById(domId);
  if (!el) return null;

  if (ChartManager.instances[domId]) {
    ChartManager.instances[domId].dispose();
  }

  const chart = echarts.init(el, null, { renderer: 'canvas' });
  ChartManager.instances[domId] = chart;
  return chart;
}

/**
 * 第三章：微博正负向情绪环形图
 */
function renderSentimentDonut(data) {
  const chart = getChart('chart-sentiment-donut');
  if (!chart) return;

  if (!data?.ready) {
    showPending(document.getElementById('chart-sentiment-donut'), data?.message);
    return;
  }

  const option = {
    color: [EMOTION_COLORS['正向'], EMOTION_COLORS['负向']],
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${p.name}<br/>数量：${p.value.toLocaleString()}<br/>占比：${p.percent}%`
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#ccc', fontSize: 14 }
    },
    series: [{
      name: '情绪分布',
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#1a1a2e',
        borderWidth: 3
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%',
        color: '#eee',
        fontSize: 14
      },
      emphasis: {
        label: { fontSize: 18, fontWeight: 'bold' },
        itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.5)' }
      },
      data: [
        { name: '正向情绪', value: data.positive },
        { name: '负向情绪', value: data.negative }
      ]
    }]
  };

  chart.setOption(option);

  // 更新统计数字
  const statsEl = document.getElementById('sentiment-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-item"><span class="stat-num">${data.total.toLocaleString()}</span><span class="stat-label">总样本</span></div>
      <div class="stat-item positive"><span class="stat-num">${data.positivePct}%</span><span class="stat-label">正向占比</span></div>
      <div class="stat-item negative"><span class="stat-num">${data.negativePct}%</span><span class="stat-label">负向占比</span></div>
    `;
  }
}

/**
 * 第四章：六种情绪柱状图
 */
function renderEmotionBar(data, animate = false) {
  const chart = getChart('chart-emotion-bar');
  if (!chart) return;

  if (!data?.ready) {
    showPending(document.getElementById('chart-emotion-bar'), data?.message);
    return;
  }

  const colors = data.data.map((d) => EMOTION_COLORS[d.name] || '#888');

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0];
        const item = data.data.find((d) => d.name === p.name);
        return `${p.name}<br/>频次：${p.value.toLocaleString()}<br/>占比：${item?.pct || 0}%`;
      }
    },
    grid: { left: '8%', right: '5%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.data.map((d) => d.name),
      axisLabel: { color: '#ccc', fontSize: 13 },
      axisLine: { lineStyle: { color: '#444' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#888' },
      splitLine: { lineStyle: { color: '#333' } }
    },
    series: [{
      type: 'bar',
      data: data.data.map((d, i) => ({
        value: animate ? 0 : d.value,
        itemStyle: { color: colors[i], borderRadius: [6, 6, 0, 0] }
      })),
      barWidth: '50%',
      animationDuration: 1200,
      animationEasing: 'elasticOut',
      label: {
        show: true,
        position: 'top',
        color: '#ddd',
        formatter: (p) => p.value.toLocaleString()
      }
    }]
  };

  chart.setOption(option);

  if (animate) {
    setTimeout(() => {
      chart.setOption({
        series: [{
          data: data.data.map((d, i) => ({
            value: d.value,
            itemStyle: { color: colors[i], borderRadius: [6, 6, 0, 0] }
          }))
        }]
      });
    }, 100);
  }
}

/**
 * 第五章：词云图
 */
function renderWordCloud(data) {
  const chart = getChart('chart-wordcloud');
  if (!chart) return;

  if (!data?.ready) {
    showPending(document.getElementById('chart-wordcloud'), data?.message);
    return;
  }

  const maxVal = data.words[0]?.value || 1;
  const cloudData = data.words.slice(0, 60).map((w) => ({
    name: w.name,
    value: w.value,
    textStyle: {
      color: `hsl(${Math.random() * 60 + 180}, 65%, ${55 + (w.value / maxVal) * 20}%)`
    }
  }));

  const option = {
    tooltip: {
      show: true,
      formatter: (p) => `${p.name}<br/>TF-IDF 权重：${p.value.toFixed(2)}`
    },
    series: [{
      type: 'wordCloud',
      shape: 'circle',
      left: 'center',
      top: 'center',
      width: '95%',
      height: '95%',
      sizeRange: [14, 72],
      rotationRange: [-30, 30],
      gridSize: 8,
      drawOutOfBound: false,
      textStyle: {
        fontFamily: 'Noto Sans SC, Microsoft YaHei, sans-serif',
        fontWeight: 'bold'
      },
      emphasis: {
        textStyle: { shadowBlur: 10, shadowColor: '#4ECDC4' }
      },
      data: cloudData
    }]
  };

  chart.setOption(option);

  const metaEl = document.getElementById('wordcloud-meta');
  if (metaEl) {
    metaEl.textContent = `分析方法：${data.method} | 样本量：${data.sampleSize.toLocaleString()} 条`;
  }
}

/**
 * 第六章：社会压力折线/面积图
 */
function renderSocialPressureCharts(socialData) {
  renderSingleTimeSeries('chart-graduates', socialData.graduates, '#4ECDC4', 'line');
  renderSingleTimeSeries('chart-online-hours', socialData.onlineHours, '#FFD93D', 'area');
  renderSingleTimeSeries('chart-employment', socialData.youthUnemployment, '#FF6B6B', 'line');
  renderSingleTimeSeries('chart-urban-jobs', socialData.urbanEmployment, '#6C8EBF', 'area');
}

function renderSingleTimeSeries(domId, seriesData, color, type) {
  const chart = getChart(domId);
  if (!chart) return;

  if (!seriesData?.ready) {
    showPending(document.getElementById(domId), seriesData?.message);
    return;
  }

  const isArea = type === 'area';
  const option = {
    title: {
      text: seriesData.name,
      left: 'center',
      textStyle: { color: '#ddd', fontSize: 14, fontWeight: 'normal' }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (p) => `${p[0].axisValue} 年<br/>${seriesData.name}：${p[0].value} ${seriesData.unit}`
    },
    grid: { left: '10%', right: '8%', bottom: '15%', top: '18%' },
    xAxis: {
      type: 'category',
      data: seriesData.years,
      axisLabel: { color: '#aaa' },
      axisLine: { lineStyle: { color: '#444' } }
    },
    yAxis: {
      type: 'value',
      name: seriesData.unit,
      nameTextStyle: { color: '#888' },
      axisLabel: { color: '#888' },
      splitLine: { lineStyle: { color: '#2a2a3e' } }
    },
    series: [{
      type: 'line',
      data: seriesData.values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color, width: 3 },
      itemStyle: { color },
      areaStyle: isArea ? {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '80' },
          { offset: 1, color: color + '10' }
        ])
      } : undefined
    }]
  };

  chart.setOption(option);
}

/**
 * 渲染第八章数据发现
 */
function renderFindings(findings) {
  const container = document.getElementById('findings-list');
  if (!container) return;

  container.innerHTML = findings.map((f, i) => `
    <div class="finding-card" data-aos="fade-up" data-aos-delay="${i * 100}">
      <div class="finding-index">${String(i + 1).padStart(2, '0')}</div>
      <p class="finding-text">${f.text}</p>
    </div>
  `).join('');

  if (typeof AOS !== 'undefined') AOS.refresh();
}

/**
 * 初始化全部图表
 */
function initAllCharts(computed) {
  renderSentimentDonut(computed.weiboSentiment);
  renderEmotionBar(computed.smp2020Emotions, false);
  renderWordCloud(computed.wordFrequency);
  renderSocialPressureCharts(computed.socialPressure);
  renderFindings(computed.findings);
  ChartManager.initialized = true;
}

/**
 * 视口进入时触发动画
 */
function animateChartOnVisible(chartId, renderFn, data) {
  const el = document.getElementById(chartId);
  if (!el) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        renderFn(data, true);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(el);
}

/**
 * 窗口 resize 时重绘
 */
function handleResize() {
  Object.values(ChartManager.instances).forEach((c) => c.resize());
}

window.ChartManager = {
  initAllCharts,
  renderSentimentDonut,
  renderEmotionBar,
  renderWordCloud,
  renderSocialPressureCharts,
  renderFindings,
  animateChartOnVisible,
  handleResize,
  showPending
};

window.addEventListener('resize', handleResize);
