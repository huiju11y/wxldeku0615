/**
 * dataProcessor.js
 * 数据新闻作品 —— 真实数据读取与计算模块
 * 严禁硬编码统计数字，所有图表数据均由此模块从 /data 目录动态计算
 */

const DATA_PATHS = {
  weibo: 'data/weibo_senti_100k.csv',
  smp2020: 'data/smp2020.csv',
  cnnic: 'data/cnnic.json',
  stats: 'data/stats.json',
  moe: 'data/moe.json'
};

/** SMP2020 情绪标签映射 */
const EMOTION_MAP = {
  0: '中性',
  1: '喜悦',
  2: '悲伤',
  3: '愤怒',
  4: '惊讶',
  5: '恐惧',
  neutral: '中性',
  happy: '喜悦',
  sad: '悲伤',
  angry: '愤怒',
  surprise: '惊讶',
  fear: '恐惧',
  中性: '中性',
  喜悦: '喜悦',
  悲伤: '悲伤',
  愤怒: '愤怒',
  惊讶: '惊讶',
  恐惧: '恐惧'
};

/** 中文停用词（高频词分析用） */
const STOPWORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '那', '他', '她', '它', '我们', '你们', '他们', '这个', '那个',
  '什么', '怎么', '为什么', '可以', '没', '吗', '吧', '啊', '呢', '哦', '嗯',
  '还', '又', '把', '被', '让', '给', '对', '从', '以', '与', '及', '等', '之',
  'http', 'https', 'cn', 'com', 'www', 't', '转发', '微博', '视频', '图片'
]);

const PENDING_MSG = '等待导入真实数据';

/** 全局数据缓存 */
const DataStore = {
  weibo: null,
  smp2020: null,
  cnnic: null,
  stats: null,
  moe: null,
  computed: null,
  loadStatus: {}
};

/**
 * 解析 CSV 文本为行对象数组
 */
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^\uFEFF/, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const row = {};
    // 处理含逗号的引号字段
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim().replace(/^"|"$/g, '');
    });
    rows.push(row);
  }
  return rows;
}

/**
 * 加载文本文件
 */
async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`无法加载 ${path}: ${res.status}`);
  return res.text();
}

/**
 * 加载 JSON 文件
 */
async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`无法加载 ${path}: ${res.status}`);
  return res.json();
}

/**
 * 检查 JSON 数据源是否已导入有效数据
 */
function isJsonDataLoaded(jsonData) {
  if (!jsonData || jsonData.status !== 'loaded') return false;
  return jsonData.indicators?.some((ind) =>
    ind.series?.some((s) => s.value !== null && s.value !== undefined && s.year)
  );
}

/**
 * 加载全部数据源
 */
async function loadAllData() {
  const results = await Promise.allSettled([
    fetchText(DATA_PATHS.weibo).then((t) => parseCSV(t)),
    fetchText(DATA_PATHS.smp2020).then((t) => parseCSV(t)),
    fetchJSON(DATA_PATHS.cnnic),
    fetchJSON(DATA_PATHS.stats),
    fetchJSON(DATA_PATHS.moe)
  ]);

  DataStore.weibo = results[0].status === 'fulfilled' ? results[0].value : null;
  DataStore.smp2020 = results[1].status === 'fulfilled' ? results[1].value : null;
  DataStore.cnnic = results[2].status === 'fulfilled' ? results[2].value : null;
  DataStore.stats = results[3].status === 'fulfilled' ? results[3].value : null;
  DataStore.moe = results[4].status === 'fulfilled' ? results[4].value : null;

  DataStore.loadStatus = {
    weibo: DataStore.weibo?.length > 1,
    smp2020: DataStore.smp2020?.length > 1,
    cnnic: isJsonDataLoaded(DataStore.cnnic),
    stats: isJsonDataLoaded(DataStore.stats),
    moe: isJsonDataLoaded(DataStore.moe)
  };

  DataStore.computed = computeAllMetrics();
  return DataStore;
}

/**
 * 计算微博正负向情绪分布
 */
function computeWeiboSentiment(rows) {
  if (!rows || rows.length < 2) {
    return { ready: false, message: PENDING_MSG };
  }

  let positive = 0;
  let negative = 0;

  rows.forEach((row) => {
    const label = String(row.label ?? row.sentiment ?? '').trim();
    if (label === '1' || label.toLowerCase() === 'positive') {
      positive++;
    } else if (label === '0' || label.toLowerCase() === 'negative') {
      negative++;
    }
  });

  const total = positive + negative;
  if (total === 0) {
    return { ready: false, message: PENDING_MSG };
  }

  return {
    ready: true,
    positive,
    negative,
    total,
    positivePct: ((positive / total) * 100).toFixed(2),
    negativePct: ((negative / total) * 100).toFixed(2)
  };
}

/**
 * 计算 SMP2020 六种情绪频次
 */
function computeSMP2020Emotions(rows) {
  if (!rows || rows.length < 2) {
    return { ready: false, message: PENDING_MSG };
  }

  const counts = {
    喜悦: 0, 愤怒: 0, 悲伤: 0, 恐惧: 0, 惊讶: 0, 中性: 0
  };

  rows.forEach((row) => {
    let emotion = row.emotion || row.label_name;
    if (!emotion && row.label !== undefined) {
      const num = parseInt(row.label, 10);
      emotion = EMOTION_MAP[num] || EMOTION_MAP[String(row.label).toLowerCase()];
    }
    if (emotion && counts[emotion] !== undefined) {
      counts[emotion]++;
    }
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return { ready: false, message: PENDING_MSG };
  }

  const data = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    pct: ((value / total) * 100).toFixed(2)
  }));

  return { ready: true, counts, total, data };
}

/**
 * 清洗微博文本
 */
function cleanWeiboText(text) {
  return text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/@\S+/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/#\S+#/g, '')
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ')
    .trim();
}

/**
 * 使用 Intl.Segmenter 进行中文分词并统计词频
 * 从真实微博文本自动计算，禁止手写关键词
 */
function computeWordFrequency(rows, sampleSize = 8000) {
  if (!rows || rows.length < 2) {
    return { ready: false, message: PENDING_MSG };
  }

  const textCol = rows[0].review ? 'review' : rows[0].text ? 'text' : 'content';
  const sample = rows.length > sampleSize
    ? rows.filter((_, i) => i % Math.ceil(rows.length / sampleSize) === 0)
    : rows;

  const docFreq = new Map();
  const termFreq = new Map();
  let docCount = 0;

  const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('zh-CN', { granularity: 'word' })
    : null;

  sample.forEach((row) => {
    const cleaned = cleanWeiboText(row[textCol] || '');
    if (cleaned.length < 4) return;

    docCount++;
    const docTerms = new Set();

    if (segmenter) {
      for (const seg of segmenter.segment(cleaned)) {
        const word = seg.segment.trim();
        if (word.length < 2 || STOPWORDS.has(word) || /^\d+$/.test(word)) continue;
        docTerms.add(word);
        termFreq.set(word, (termFreq.get(word) || 0) + 1);
      }
    } else {
      // 降级：双字切分
      for (let i = 0; i < cleaned.length - 1; i++) {
        const word = cleaned.slice(i, i + 2);
        if (STOPWORDS.has(word)) continue;
        docTerms.add(word);
        termFreq.set(word, (termFreq.get(word) || 0) + 1);
      }
    }

    docTerms.forEach((t) => docFreq.set(t, (docFreq.get(t) || 0) + 1));
  });

  if (termFreq.size === 0) {
    return { ready: false, message: PENDING_MSG };
  }

  // TF-IDF 计算
  const tfidf = [];
  termFreq.forEach((tf, term) => {
    const df = docFreq.get(term) || 1;
    const idf = Math.log((docCount + 1) / (df + 1)) + 1;
    tfidf.push({ name: term, value: tf * idf, tf, df });
  });

  tfidf.sort((a, b) => b.value - a.value);
  const topWords = tfidf.slice(0, 80);

  return {
    ready: true,
    words: topWords,
    docCount,
    sampleSize: sample.length,
    method: segmenter ? 'Intl.Segmenter + TF-IDF' : 'Bigram + TF-IDF'
  };
}

/**
 * 提取 JSON 指标时间序列（仅使用真实导入数据）
 */
function extractTimeSeries(jsonData, indicatorId) {
  if (!isJsonDataLoaded(jsonData)) {
    return { ready: false, message: PENDING_MSG };
  }

  const indicator = jsonData.indicators.find((i) => i.id === indicatorId);
  if (!indicator || !indicator.series?.length) {
    return { ready: false, message: PENDING_MSG };
  }

  const series = indicator.series
    .filter((s) => s.year && s.value !== null && s.value !== undefined)
    .sort((a, b) => a.year - b.year);

  if (!series.length) {
    return { ready: false, message: PENDING_MSG };
  }

  return {
    ready: true,
    name: indicator.name,
    unit: indicator.unit,
    years: series.map((s) => s.year),
    values: series.map((s) => s.value),
    series
  };
}

/**
 * 汇总社会压力相关指标（第六章）
 */
function computeSocialPressureMetrics() {
  const graduates = extractTimeSeries(DataStore.moe, 'graduates');
  const onlineHours = extractTimeSeries(DataStore.cnnic, 'daily_online_hours');
  const youthUnemployment = extractTimeSeries(DataStore.stats, 'youth_unemployment');
  const urbanEmployment = extractTimeSeries(DataStore.stats, 'urban_employment');

  const anyReady = [graduates, onlineHours, youthUnemployment, urbanEmployment].some((s) => s.ready);

  return {
    ready: anyReady,
    message: anyReady ? null : PENDING_MSG,
    graduates,
    onlineHours,
    youthUnemployment,
    urbanEmployment
  };
}

/**
 * 根据真实计算结果自动生成数据发现（第八章）
 */
function generateDataFindings(computed) {
  const findings = [];

  if (computed.weiboSentiment?.ready) {
    const { positive, negative, positivePct, negativePct, total } = computed.weiboSentiment;
    const dominant = positive >= negative ? '正向' : '负向';
    findings.push({
      type: 'weibo_sentiment',
      text: `在 weibo_senti_100k 数据集的 ${total.toLocaleString()} 条标注微博中，${dominant}情绪占比为 ${dominant === '正向' ? positivePct : negativePct}%，正向 ${positive.toLocaleString()} 条（${positivePct}%），负向 ${negative.toLocaleString()} 条（${negativePct}%）。`
    });
  }

  if (computed.smp2020Emotions?.ready) {
    const sorted = [...computed.smp2020Emotions.data].sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    findings.push({
      type: 'smp2020_emotion',
      text: `SMP2020 数据集中，出现频率最高的情绪是「${top.name}」（${top.value.toLocaleString()} 条，占 ${top.pct}%），最低为「${bottom.name}」（${bottom.pct}%）。`
    });
  }

  if (computed.wordFrequency?.ready) {
    const top3 = computed.wordFrequency.words.slice(0, 3);
    findings.push({
      type: 'keywords',
      text: `基于 ${computed.wordFrequency.sampleSize.toLocaleString()} 条微博样本的 ${computed.wordFrequency.method} 分析，高频关键词前三位为：${top3.map((w) => `「${w.name}」`).join('、')}。`
    });
  }

  // 计算各指标最大增幅年份
  const seriesList = [
    { key: 'graduates', data: computed.socialPressure?.graduates },
    { key: 'onlineHours', data: computed.socialPressure?.onlineHours },
    { key: 'youthUnemployment', data: computed.socialPressure?.youthUnemployment }
  ];

  seriesList.forEach(({ key, data }) => {
    if (!data?.ready || data.values.length < 2) return;
    let maxGrowth = -Infinity;
    let maxYear = null;
    for (let i = 1; i < data.values.length; i++) {
      const growth = data.values[i] - data.values[i - 1];
      if (growth > maxGrowth) {
        maxGrowth = growth;
        maxYear = data.years[i];
      }
    }
    if (maxYear) {
      findings.push({
        type: key,
        text: `「${data.name}」增长最快的年份为 ${maxYear} 年（较上年增加 ${maxGrowth}${data.unit}）。`
      });
    }
  });

  if (!findings.length) {
    findings.push({
      type: 'pending',
      text: PENDING_MSG
    });
  }

  return findings;
}

/**
 * 为导语章节生成可引用的公开数据摘要（仅使用已导入的真实数据）
 */
function generateIntroDataSnippets() {
  const snippets = [];

  if (DataStore.loadStatus.cnnic) {
    const users = extractTimeSeries(DataStore.cnnic, 'internet_users');
    if (users.ready) {
      const latest = users.series[users.series.length - 1];
      snippets.push(`据 CNNIC 报告，${latest.year} 年中国网民规模达 ${latest.value} ${users.unit}。`);
    }
  }

  if (DataStore.loadStatus.stats) {
    const unemployment = extractTimeSeries(DataStore.stats, 'youth_unemployment');
    if (unemployment.ready) {
      const latest = unemployment.series[unemployment.series.length - 1];
      snippets.push(`国家统计局数据显示，${latest.year} 年 16-24 岁城镇调查失业率为 ${latest.value}${unemployment.unit}。`);
    }
  }

  if (DataStore.loadStatus.moe) {
    const grads = extractTimeSeries(DataStore.moe, 'graduates');
    if (grads.ready) {
      const latest = grads.series[grads.series.length - 1];
      snippets.push(`教育部统计显示，${latest.year} 年全国高校毕业生 ${latest.value} ${grads.unit}。`);
    }
  }

  return snippets;
}

/**
 * 计算全部指标
 */
function computeAllMetrics() {
  const weiboSentiment = computeWeiboSentiment(DataStore.weibo);
  const smp2020Emotions = computeSMP2020Emotions(DataStore.smp2020);
  const wordFrequency = computeWordFrequency(DataStore.weibo);
  const socialPressure = computeSocialPressureMetrics();

  const computed = {
    weiboSentiment,
    smp2020Emotions,
    wordFrequency,
    socialPressure
  };

  computed.findings = generateDataFindings(computed);
  computed.introSnippets = generateIntroDataSnippets();

  return computed;
}

/**
 * 数据导入接口 —— 供外部脚本写入后刷新
 * @param {string} source - 'cnnic' | 'stats' | 'moe' | 'smp2020'
 * @param {object} payload - 导入的数据对象
 */
function importDataInterface(source, payload) {
  const validSources = ['cnnic', 'stats', 'moe'];
  if (!validSources.includes(source)) {
    console.warn('[DataImport] 不支持的数据源:', source);
    return false;
  }
  console.info(`[DataImport] 请将数据写入 data/${source}.json 后重新加载页面`);
  console.info('[DataImport] 期望格式:', payload);
  return true;
}

// 导出到全局
window.DataProcessor = {
  DATA_PATHS,
  PENDING_MSG,
  DataStore,
  loadAllData,
  computeAllMetrics,
  importDataInterface,
  extractTimeSeries,
  EMOTION_MAP
};
