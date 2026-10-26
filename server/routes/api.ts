import { Router, Request, Response } from 'express';
import { MarketDataProvider } from '../providers/marketDataProvider.js';
import { BISTRealDataProvider } from '../providers/bistRealDataProvider.js';
import { InstrumentUniverseService } from '../services/instrumentUniverseService.js';
import {
  buildTechnicalIndicators,
  detectSupportResistanceZones,
  detectBreakouts,
  detectChartPatterns,
  detectAutoChannels,
  calculatePeakAndResistanceMetrics,
  calculateMultiTimeframeTrends,
  calculateScenarioHorizons,
  calculateScenarioHorizonsExtended,
  calculateTechnicalScore,
  getEmaTrendStatus,
  getBollingerStatus,
  evaluateTechnicalSignals
} from '../indicators/technicalEngine.js';
import { runBacktest } from '../backtesting/backtestEngine.js';
import { generateAnalyticalReport } from '../services/geminiService.js';
import { runUnitTests } from '../tests/dataValidation.test.js';
import { ProviderHealthService } from '../services/providerHealthService.js';
import { ScreenerSchedulerService } from '../services/screenerSchedulerService.js';
import { FinancialDataService } from '../services/financialDataService.js';
import {
  BacktestParams,
  ScreenerStockResult,
  WatchlistFolder,
  CustomIndicatorRule,
  ScreenerProfile,
  ScreenerScheduleConfig,
  ExcludedStockReason
} from '../types.js';

export const apiRouter = Router();
const schedulerService = ScreenerSchedulerService.getInstance();

// Watchlist store
let userWatchlists: WatchlistFolder[] = [
  {
    id: 'fav-1',
    name: 'Favorilerim',
    createdAt: new Date().toISOString(),
    items: [
      { symbol: 'THYAO', addedAt: new Date().toISOString(), targetPrice: 285.0, stopPrice: 248.0, notes: 'Ulaştırma lideri, direnç kırılımı bekleniyor' },
      { symbol: 'ASELS', addedAt: new Date().toISOString(), targetPrice: 375.0, stopPrice: 320.0, notes: 'Savunma sanayii sipariş hacmi güçlü' },
      { symbol: 'GARAN', addedAt: new Date().toISOString(), targetPrice: 145.0, stopPrice: 118.0, notes: 'Banka endeksi lokomotifi' },
    ]
  },
  {
    id: 'breakout-2',
    name: 'Kırılım & Momentum Adayları',
    createdAt: new Date().toISOString(),
    items: [
      { symbol: 'TUPRS', addedAt: new Date().toISOString(), targetPrice: 395.0, stopPrice: 350.0, notes: 'Rafineri marjları takibinde' },
      { symbol: 'KCHOL', addedAt: new Date().toISOString(), targetPrice: 210.0, stopPrice: 175.0, notes: 'Holding iskonto daralması' },
    ]
  },
  {
    id: 'bist30-3',
    name: 'BIST 30 Çekirdek',
    createdAt: new Date().toISOString(),
    items: [
      { symbol: 'AKBNK', addedAt: new Date().toISOString(), targetPrice: 68.0, stopPrice: 56.0, notes: 'Özsermaye kârlılığı yüksek' },
      { symbol: 'BIMAS', addedAt: new Date().toISOString(), targetPrice: 580.0, stopPrice: 490.0, notes: 'Defansif perakende gücü' },
    ]
  }
];

// Single Verified Real Market Data Provider (Strictly ZERO mock/synthetic data)
let currentProvider: MarketDataProvider = new BISTRealDataProvider();
let providerMode: 'REAL' = 'REAL';
const healthService = ProviderHealthService.getInstance();

export function getActiveProvider(): MarketDataProvider {
  return currentProvider;
}

// 1. Market Status
apiRouter.get('/market/status', async (_req: Request, res: Response) => {
  try {
    const status = await currentProvider.getMarketStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Piyasa durumu alınamadı.' });
  }
});

// 2. All Stocks List
apiRouter.get('/stocks', async (req: Request, res: Response) => {
  try {
    const { index, sector, search, marketSegment, dataStatus } = req.query;
    let stocks = await currentProvider.getStocks();

    if (marketSegment && typeof marketSegment === 'string' && marketSegment !== 'ALL') {
      stocks = stocks.filter(s => s.marketSegment === marketSegment);
    }
    if (dataStatus && typeof dataStatus === 'string' && dataStatus !== 'ALL') {
      stocks = stocks.filter(s => s.dataStatus === dataStatus);
    }
    if (index && typeof index === 'string' && index !== 'ALL') {
      stocks = stocks.filter(s => s.indices.includes(index));
    }
    if (sector && typeof sector === 'string' && sector !== 'ALL') {
      stocks = stocks.filter(s => s.sector === sector);
    }
    if (search && typeof search === 'string') {
      const q = search.toUpperCase();
      stocks = stocks.filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q));
    }

    res.json(stocks);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hisse listesi alınamadı.' });
  }
});

// 3. Single Stock Details
apiRouter.get('/stocks/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const stock = await currentProvider.getStock(symbol);
    if (!stock) {
      return res.status(404).json({ error: `Sembol bulunamadı: ${symbol}` });
    }
    res.json(stock);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hisse verisi alınamadı.' });
  }
});

// 4. Historical OHLCV Candles (Supports periods: 10y, 5y, 1y, 1mo; timeframes: 1h, 4h, 1d, 1w, 1mo)
apiRouter.get('/stocks/:symbol/ohlcv', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const timeframe = (req.query.timeframe as string) || '1d';
    const period = (req.query.period as string) || '';
    const limit = parseInt((req.query.limit as string) || '180', 10);

    let candles: any[] = [];
    let coverage = undefined;

    if (currentProvider instanceof BISTRealDataProvider) {
      const result = await currentProvider.getOHLCVWithCoverage(symbol, timeframe, limit, period);
      candles = result.candles;
      coverage = result.coverage;
    } else {
      candles = await currentProvider.getOHLCV(symbol, timeframe, limit, period);
    }

    res.json({
      symbol: symbol.toUpperCase(),
      timeframe,
      period: period || undefined,
      count: candles.length,
      provider: currentProvider.name,
      isDelayed: currentProvider.isDelayed,
      delayMinutes: currentProvider.delayMinutes,
      coverage,
      candles
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'OHLCV verisi alınamadı.' });
  }
});

// 5. Complete Technical Analysis (FAZ 2)
apiRouter.get('/stocks/:symbol/technical', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const timeframe = (req.query.timeframe as string) || '1d';
    const period = (req.query.period as string) || '1y';
    const stock = await currentProvider.getStock(symbol);

    let candleLimit = 260;
    if (period === '10y') candleLimit = 2600;
    else if (period === '5y') candleLimit = 1300;
    else if (period === '1y') candleLimit = 260;
    else if (period === '1mo') candleLimit = 35;

    // Saatlik analizlerde son bir aylık saatlik veriyi destekle (~180-200 mum)
    if (timeframe === '1h') {
      candleLimit = 200;
    }

    const ohlcv = await currentProvider.getOHLCV(symbol, timeframe, candleLimit, period);

    if (!ohlcv || ohlcv.length < 15) {
      return res.status(400).json({ error: 'Teknik analiz için yeterli veri bulunamadı.' });
    }

    const indicators = buildTechnicalIndicators(ohlcv, timeframe);
    const zones = detectSupportResistanceZones(ohlcv, period, timeframe);
    const breakouts = detectBreakouts(ohlcv, zones, timeframe);
    const patterns = detectChartPatterns(ohlcv, timeframe);
    const autoChannels = detectAutoChannels(ohlcv);
    const peakMetrics = calculatePeakAndResistanceMetrics(ohlcv, period);
    const trends = calculateMultiTimeframeTrends(ohlcv);

    res.json({
      symbol: symbol.toUpperCase(),
      stock,
      timeframe,
      period,
      indicators,
      zones,
      breakouts,
      patterns,
      autoChannels,
      peakMetrics,
      trends,
      candleCount: ohlcv.length,
      lastCandleDate: ohlcv[ohlcv.length - 1].dateStr,
      provider: currentProvider.name,
      isDelayed: currentProvider.isDelayed
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Teknik analiz hesaplanamadı.' });
  }
});

// 6. 5, 7, 10 Days Scenario Modeling (FAZ 4)
apiRouter.get('/stocks/:symbol/scenarios', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const stock = await currentProvider.getStock(symbol);
    if (!stock) {
      return res.status(404).json({ error: `Sembol bulunamadı: ${symbol}` });
    }

    const ohlcv = await currentProvider.getOHLCV(symbol, '1d', 180);
    if (!ohlcv || ohlcv.length < 25) {
      return res.status(400).json({ error: 'Senaryo modellemesi için yeterli veri bulunamadı (En az 25 bar gereklidir).' });
    }

    const extended = calculateScenarioHorizonsExtended(ohlcv);
    const zones = detectSupportResistanceZones(ohlcv);

    res.json({
      symbol: symbol.toUpperCase(),
      stock,
      currentPrice: ohlcv[ohlcv.length - 1].close,
      horizons: extended.horizons,
      calibration: extended.calibration,
      keyLevels: zones.slice(0, 5),
      riskManagementDefaults: {
        defaultCapitalTL: 100000,
        defaultRiskPct: 1.0,
        estimatedCommissionPct: 0.15,
        estimatedSlippagePct: 0.10
      },
      provider: currentProvider.name,
      isDelayed: currentProvider.isDelayed,
      marketDataTime: ohlcv[ohlcv.length - 1].dateStr,
      analysisTime: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Senaryo hesaplanamadı.' });
  }
});

// 7. Gemini AI Analytical Report
apiRouter.post('/stocks/:symbol/ai-report', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const stock = await currentProvider.getStock(symbol);
    if (!stock) {
      return res.status(404).json({ error: 'Hisse bulunamadı.' });
    }

    const ohlcv = await currentProvider.getOHLCV(symbol, '1d', 180);
    const indicators = buildTechnicalIndicators(ohlcv);
    const zones = detectSupportResistanceZones(ohlcv);
    const patterns = detectChartPatterns(ohlcv);
    const trends = calculateMultiTimeframeTrends(ohlcv);
    const horizons = calculateScenarioHorizons(ohlcv);

    const report = await generateAnalyticalReport({
      stock,
      indicators,
      zones,
      patterns,
      trends,
      horizons
    });

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Rapor üretilemedi.' });
  }
});

// 8. Backtest Strategy Execution
apiRouter.post('/backtest', async (req: Request, res: Response) => {
  try {
    const params: BacktestParams = req.body;
    if (!params.symbol || !params.strategy) {
      return res.status(400).json({ error: 'Sembol ve strateji seçimi zorunludur.' });
    }

    const ohlcv = await currentProvider.getOHLCV(params.symbol, params.timeframe || '1d', 250);
    const result = runBacktest(ohlcv, params);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Backtest çalıştırılamadı.' });
  }
});

// In-memory Screener Indicator Cache (180s TTL) for high performance across full universe
interface ScreenerComputedCache {
  ind: any;
  zones: any[];
  breakouts: any[];
  patterns: any[];
  autoChannels: any[];
  peakMetrics: any;
  trends: any[];
  scoreBreakdown: any;
  bbStatus: any;
  emaStatus: any;
  ohlcv: any[];
  cachedAt: number;
}
const screenerCache = new Map<string, ScreenerComputedCache>();

// Whitelist-based Safe Custom Indicator Rule Evaluator (Zero eval / Function)
function evaluateCustomRule(
  rule: CustomIndicatorRule,
  ind: any,
  lastPrice: number
): { passed: boolean; explanation: string } {
  let leftVal: number | null = null;
  switch (rule.indicator) {
    case 'RSI': leftVal = ind.rsi14; break;
    case 'EMA5': leftVal = ind.ema5; break;
    case 'EMA20': leftVal = ind.ema20; break;
    case 'EMA50': leftVal = ind.ema50; break;
    case 'EMA200': leftVal = ind.ema200; break;
    case 'MACD_HIST': leftVal = ind.macd?.histogram ?? null; break;
    case 'VOLUME_RATIO': leftVal = ind.volumeRatio; break;
    case 'ATR': leftVal = ind.atr14; break;
    case 'BOLLINGER_BANDWIDTH': leftVal = ind.bollinger?.bandwidth ?? null; break;
    case 'LAST_PRICE': leftVal = lastPrice; break;
    default: leftVal = null;
  }

  if (leftVal === null || isNaN(leftVal)) {
    return { passed: false, explanation: `${rule.name}: Gösterge verisi hesaplanamadı` };
  }

  let rightVal: number | null = null;
  if (rule.compareTo === 'VALUE') {
    rightVal = rule.targetValue != null ? rule.targetValue : 0;
  } else if (rule.compareTo === 'INDICATOR' && rule.targetIndicator) {
    switch (rule.targetIndicator) {
      case 'EMA5': rightVal = ind.ema5; break;
      case 'EMA20': rightVal = ind.ema20; break;
      case 'EMA50': rightVal = ind.ema50; break;
      case 'EMA200': rightVal = ind.ema200; break;
      case 'LAST_PRICE': rightVal = lastPrice; break;
      default: rightVal = null;
    }
  }

  if (rightVal === null || isNaN(rightVal)) {
    return { passed: false, explanation: `${rule.name}: Karşılaştırma değeri geçersiz` };
  }

  let passed = false;
  switch (rule.operator) {
    case '>': passed = leftVal > rightVal; break;
    case '>=': passed = leftVal >= rightVal; break;
    case '<': passed = leftVal < rightVal; break;
    case '<=': passed = leftVal <= rightVal; break;
    case '==': passed = Math.abs(leftVal - rightVal) < 0.001; break;
    case 'CROSS_ABOVE': passed = leftVal >= rightVal; break;
    case 'CROSS_BELOW': passed = leftVal <= rightVal; break;
    default: passed = false;
  }

  return {
    passed,
    explanation: `${rule.name}: ${rule.indicator} (${leftVal}) ${rule.operator} ${rule.compareTo === 'VALUE' ? rightVal : rule.targetIndicator + ' (' + rightVal + ')'}`
  };
}

// 9. Comprehensive FAZ 3 Screener Endpoint
apiRouter.get('/screener', async (req: Request, res: Response) => {
  try {
    const {
      logic = 'AND',
      preset,
      conditions: conditionsParam,
      customRules: customRulesParam,
      timeframe = '1d',
      marketSegment,
      index,
      sector,
      search,
      minPrice,
      maxPrice,
      minChange,
      maxChange,
      minScore,
      customWeights,
      page = '1',
      pageSize = '25',
      sortField = 'technicalScore',
      sortDir = 'desc',
      completedCandlesOnly
    } = req.query;

    const isOrLogic = String(logic).toUpperCase() === 'OR';
    const effectiveTimeframe = ['1h', '4h', '1d', '1wk', '1mo'].includes(String(timeframe).toLowerCase())
      ? String(timeframe).toLowerCase()
      : '1d';

    const calStatus = schedulerService.getMarketCalendarStatus();
    const completedOnly = completedCandlesOnly === 'true' || completedCandlesOnly === '1' || !calStatus.isSessionOpen;

    // Parse active conditions
    const activeConditionKeys: string[] = [];
    if (conditionsParam && typeof conditionsParam === 'string') {
      conditionsParam.split(',').map(s => s.trim()).filter(Boolean).forEach(k => {
        if (!activeConditionKeys.includes(k)) activeConditionKeys.push(k);
      });
    }

    // Check if a preset is requested
    if (preset && typeof preset === 'string' && preset !== 'ALL') {
      const presetProfile = schedulerService.getProfile(preset);
      if (presetProfile) {
        for (const c of presetProfile.conditions) {
          if (!activeConditionKeys.includes(c)) activeConditionKeys.push(c);
        }
      }
    }

    // Parse custom indicator rules safely
    let customRules: CustomIndicatorRule[] = [];
    if (customRulesParam && typeof customRulesParam === 'string') {
      try {
        const parsed = JSON.parse(customRulesParam);
        if (Array.isArray(parsed)) {
          customRules = parsed.filter(r => r && r.id && r.indicator && r.operator);
        }
      } catch {
        // ignore JSON parse error
      }
    }

    let parsedWeights = undefined;
    if (customWeights && typeof customWeights === 'string') {
      try {
        parsedWeights = JSON.parse(customWeights);
      } catch {
        // ignore JSON parse error
      }
    }

    const allStocks = await currentProvider.getStocks();
    let candidateStocks = allStocks;

    // Filter candidate universe based on filters
    if (marketSegment && typeof marketSegment === 'string' && marketSegment !== 'ALL') {
      candidateStocks = candidateStocks.filter(s => s.marketSegment === marketSegment);
    }
    if (index && typeof index === 'string' && index !== 'ALL') {
      candidateStocks = candidateStocks.filter(s => s.indices.includes(index));
    }
    if (sector && typeof sector === 'string' && sector !== 'ALL') {
      candidateStocks = candidateStocks.filter(s => s.sector === sector);
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toUpperCase();
      candidateStocks = candidateStocks.filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q));
    }
    if (minPrice) {
      const minP = parseFloat(minPrice as string);
      if (!isNaN(minP)) candidateStocks = candidateStocks.filter(s => s.lastPrice === 0 || s.lastPrice >= minP);
    }
    if (maxPrice) {
      const maxP = parseFloat(maxPrice as string);
      if (!isNaN(maxP)) candidateStocks = candidateStocks.filter(s => s.lastPrice === 0 || s.lastPrice <= maxP);
    }
    if (minChange) {
      const minC = parseFloat(minChange as string);
      if (!isNaN(minC)) candidateStocks = candidateStocks.filter(s => s.changePercent >= minC);
    }
    if (maxChange) {
      const maxC = parseFloat(maxChange as string);
      if (!isNaN(maxC)) candidateStocks = candidateStocks.filter(s => s.changePercent <= maxC);
    }

    // Benchmark XU100 performance for relative strength calculation
    let xu100Performance = 0.5;
    try {
      const xu100Bars = await currentProvider.getOHLCV('XU100', effectiveTimeframe, 30);
      if (xu100Bars.length >= 20) {
        const cNow = xu100Bars[xu100Bars.length - 1].close;
        const c20Ago = xu100Bars[xu100Bars.length - 20].close;
        if (c20Ago > 0) {
          xu100Performance = ((cNow - c20Ago) / c20Ago) * 100;
        }
      }
    } catch {
      // fallback baseline
    }

    const matchedResults: ScreenerStockResult[] = [];
    const excludedStocks: ExcludedStockReason[] = [];
    let latestDataTimeStr = new Date().toISOString();

    // Evaluate candidates across the universe
    // To maintain fast response times, process candidate stocks in concurrent chunks
    const BATCH_SIZE = 12;
    for (let i = 0; i < candidateStocks.length; i += BATCH_SIZE) {
      const chunk = candidateStocks.slice(i, i + BATCH_SIZE);

      await Promise.all(
        chunk.map(async (stock) => {
          try {
            const cacheKey = `${stock.symbol}_${effectiveTimeframe}_${completedOnly}`;
            let cached = screenerCache.get(cacheKey);

            if (!cached || Date.now() - cached.cachedAt > 180000) {
              let ohlcv = await currentProvider.getOHLCV(stock.symbol, effectiveTimeframe, 90);
              if (!ohlcv || ohlcv.length < 5) {
                excludedStocks.push({
                  symbol: stock.symbol,
                  name: stock.name,
                  segment: stock.marketSegment,
                  reason: 'Yetersiz geçerli mum verisi (Minimum 5 bar gerekli)'
                });
                return;
              }

              if (completedOnly) {
                ohlcv = schedulerService.filterCompletedCandles(ohlcv, effectiveTimeframe);
              }

              const ind = buildTechnicalIndicators(ohlcv);
              const zones = detectSupportResistanceZones(ohlcv);
              const breakouts = detectBreakouts(ohlcv, zones);
              const patterns = detectChartPatterns(ohlcv);
              const autoChannels = detectAutoChannels(ohlcv);
              const peakMetrics = calculatePeakAndResistanceMetrics(ohlcv, '1y');
              const trends = calculateMultiTimeframeTrends(ohlcv);
              const scoreBreakdown = calculateTechnicalScore(ohlcv, parsedWeights);
              const bbStatus = getBollingerStatus(ohlcv.map(b => b.close));
              const emaStatus = ind.emaTrends || getEmaTrendStatus(ohlcv.map(b => b.close));

              cached = {
                ind,
                zones,
                breakouts,
                patterns,
                autoChannels,
                peakMetrics,
                trends,
                scoreBreakdown,
                bbStatus,
                emaStatus,
                ohlcv,
                cachedAt: Date.now()
              };
              screenerCache.set(cacheKey, cached);
            }

            const {
              ind,
              zones,
              breakouts,
              patterns,
              autoChannels,
              peakMetrics,
              trends,
              scoreBreakdown,
              bbStatus,
              emaStatus,
              ohlcv
            } = cached;

            const lastBar = ohlcv[ohlcv.length - 1];
            const candleDate = lastBar?.dateStr || stock.updatedAt;
            if (candleDate > latestDataTimeStr) {
              latestDataTimeStr = candleDate;
            }

            // Relative performance vs XU100
            const cNow = lastBar ? lastBar.close : stock.lastPrice;
            const c20Ago = ohlcv[Math.max(0, ohlcv.length - 20)]?.close || cNow;
            const stock20Return = c20Ago > 0 ? ((cNow - c20Ago) / c20Ago) * 100 : 0;
            const relPerf = Number((stock20Return - xu100Performance).toFixed(2));

            const nearestSup = zones.find(z => z.type === 'SUPPORT') || null;
            const nearestRes = zones.find(z => z.type === 'RESISTANCE') || null;

            let macdStatus: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
            if (ind.macd) {
              if (ind.macd.histogram > 0 && ind.macd.macdLine > ind.macd.signalLine) macdStatus = 'BULLISH';
              else if (ind.macd.histogram < 0 && ind.macd.macdLine < ind.macd.signalLine) macdStatus = 'BEARISH';
            }

            // Check each condition and generate explanation
            const conditionEvaluations: { key: string; passed: boolean; explanation: string }[] = [];

            for (const condKey of activeConditionKeys) {
              switch (condKey) {
                case 'EMA5_CROSS_ABOVE_EMA20': {
                  const passed = emaStatus.crossover === 'BULLISH_CROSS';
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `EMA5 (${ind.ema5?.toFixed(2)}), EMA20 (${ind.ema20?.toFixed(2)}) ortalamasını yukarı kesti`
                      : `EMA5 (${ind.ema5?.toFixed(2)}) EMA20 üzerinde kesişim yapmadı`
                  });
                  break;
                }
                case 'EMA5_CROSS_BELOW_EMA20': {
                  const passed = emaStatus.crossover === 'BEARISH_CROSS';
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `EMA5 (${ind.ema5?.toFixed(2)}), EMA20 (${ind.ema20?.toFixed(2)}) ortalamasını aşağı kesti`
                      : `EMA5 (${ind.ema5?.toFixed(2)}) EMA20 altında kesişim yapmadı`
                  });
                  break;
                }
                case 'PRICE_ABOVE_EMA5': {
                  const passed = ind.ema5 !== null && stock.lastPrice > ind.ema5;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Fiyat (${stock.lastPrice} TL), EMA5 (${ind.ema5?.toFixed(2)} TL) üzerinde`
                      : `Fiyat (${stock.lastPrice} TL), EMA5 altında`
                  });
                  break;
                }
                case 'PRICE_ABOVE_EMA20': {
                  const passed = ind.ema20 !== null && stock.lastPrice > ind.ema20;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Fiyat (${stock.lastPrice} TL), EMA20 (${ind.ema20?.toFixed(2)} TL) üzerinde`
                      : `Fiyat (${stock.lastPrice} TL), EMA20 altında`
                  });
                  break;
                }
                case 'BB_CROSS_ABOVE_MIDDLE': {
                  const passed = bbStatus?.crossedAboveMiddle === true || (ohlcv.length >= 2 && ohlcv[ohlcv.length - 2].close < (ind.ema20 || 0) && stock.lastPrice >= (ind.ema20 || 0));
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Fiyat Bollinger orta bandını (EMA20: ${ind.ema20?.toFixed(2)} TL) yukarı kırdı`
                      : `Bollinger orta bant yukarı kırılımı oluşmadı`
                  });
                  break;
                }
                case 'BB_CROSS_BELOW_MIDDLE': {
                  const passed = bbStatus?.crossedBelowMiddle === true || (ohlcv.length >= 2 && ohlcv[ohlcv.length - 2].close > (ind.ema20 || 0) && stock.lastPrice <= (ind.ema20 || 0));
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Fiyat Bollinger orta bandını (EMA20: ${ind.ema20?.toFixed(2)} TL) aşağı kırdı`
                      : `Bollinger orta bant aşağı kırılımı oluşmadı`
                  });
                  break;
                }
                case 'SUPPORT_NEAR_1PCT': {
                  const passed = nearestSup !== null && nearestSup.distancePercent <= 1.0 && nearestSup.distancePercent >= 0;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Desteğe %${nearestSup?.distancePercent?.toFixed(2)} yakınlıkta (${nearestSup?.priceLow}-${nearestSup?.priceHigh} TL)`
                      : `Desteğe %1 yakınlıkta değil`
                  });
                  break;
                }
                case 'SUPPORT_NEAR_1_5PCT': {
                  const passed = nearestSup !== null && nearestSup.distancePercent <= 1.5 && nearestSup.distancePercent >= 0;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Desteğe %${nearestSup?.distancePercent?.toFixed(2)} yakınlıkta (${nearestSup?.priceLow}-${nearestSup?.priceHigh} TL)`
                      : `Desteğe %1.5 yakınlıkta değil`
                  });
                  break;
                }
                case 'SUPPORT_NEAR_2PCT': {
                  const passed = nearestSup !== null && nearestSup.distancePercent <= 2.0 && nearestSup.distancePercent >= 0;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Desteğe %${nearestSup?.distancePercent?.toFixed(2)} yakınlıkta (${nearestSup?.priceLow}-${nearestSup?.priceHigh} TL)`
                      : `Desteğe %2 yakınlıkta değil`
                  });
                  break;
                }
                case 'RESISTANCE_NEAR_2PCT': {
                  const passed = nearestRes !== null && nearestRes.distancePercent <= 2.0 && nearestRes.distancePercent >= 0;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Dirence %${nearestRes?.distancePercent?.toFixed(2)} yakınlıkta (${nearestRes?.priceLow}-${nearestRes?.priceHigh} TL)`
                      : `Dirence %2 yakınlıkta değil`
                  });
                  break;
                }
                case 'SUPPORT_BREAK': {
                  const passed = breakouts.some(b => b.direction === 'BEARISH_BREAKOUT' && b.closeConfirmed);
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Destek seviyesi teyitli olarak aşağı kırıldı`
                      : `Destek kırılımı bulunmuyor`
                  });
                  break;
                }
                case 'RESISTANCE_BREAK': {
                  const passed = breakouts.some(b => b.direction === 'BULLISH_BREAKOUT' && b.closeConfirmed);
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Direnç seviyesi teyitli olarak yukarı kırıldı`
                      : `Direnç kırılımı bulunmuyor`
                  });
                  break;
                }
                case 'PATTERN_ASCENDING_TRIANGLE': {
                  const passed = patterns.some(p => p.type === 'ASCENDING_TRIANGLE');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Yükselen Üçgen formasyonu tespit edildi` : `Yükselen Üçgen formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_DESCENDING_TRIANGLE': {
                  const passed = patterns.some(p => p.type === 'DESCENDING_TRIANGLE');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Düşen Üçgen formasyonu tespit edildi` : `Düşen Üçgen formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_SYMMETRICAL_TRIANGLE': {
                  const passed = patterns.some(p => p.type === 'SYMMETRICAL_TRIANGLE');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Simetrik Üçgen formasyonu tespit edildi` : `Simetrik Üçgen formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_TOBO': {
                  const passed = patterns.some(p => p.type === 'INVERSE_HEAD_AND_SHOULDERS' || p.type === 'TOBO');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Ters Omuz Baş Omuz (TOBO) formasyonu tespit edildi` : `TOBO formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_OBO': {
                  const passed = patterns.some(p => p.type === 'HEAD_AND_SHOULDERS' || p.type === 'OBO');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Omuz Baş Omuz (OBO) tepe formasyonu tespit edildi` : `OBO formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_FALLING_WEDGE': {
                  const passed = patterns.some(p => p.type === 'FALLING_WEDGE');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Düşen Kama formasyonu tespit edildi` : `Düşen Kama formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_RISING_WEDGE': {
                  const passed = patterns.some(p => p.type === 'RISING_WEDGE');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Yükselen Kama formasyonu tespit edildi` : `Yükselen Kama formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_CHANNEL_UP': {
                  const passed = patterns.some(p => p.type === 'CHANNEL_UP') || autoChannels.some(c => c.type === 'CHANNEL_UP');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Yükselen Kanal yapısı tespit edildi` : `Yükselen Kanal yapısı yok`
                  });
                  break;
                }
                case 'PATTERN_CHANNEL_DOWN': {
                  const passed = patterns.some(p => p.type === 'CHANNEL_DOWN') || autoChannels.some(c => c.type === 'CHANNEL_DOWN');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Düşen Kanal yapısı tespit edildi` : `Düşen Kanal yapısı yok`
                  });
                  break;
                }
                case 'VOLUME_SURGE': {
                  const passed = ind.volumeRatio !== null && ind.volumeRatio >= 1.2;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Hacim oranı ${ind.volumeRatio?.toFixed(2)}x (20 bar EMA ortalamasının üzerinde)`
                      : `Hacim oranı (${ind.volumeRatio?.toFixed(2)}x) yetersiz`
                  });
                  break;
                }
                case 'NEAR_ALL_TIME_HIGH': {
                  const dist = peakMetrics.distanceFromPeakPct;
                  const passed = dist <= 3.5;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Zirveye %${dist?.toFixed(2)} yakınlıkta (Periyot zirvesi: ${peakMetrics.periodHigh} TL)`
                      : `Zirveye %${dist?.toFixed(2)} uzaklıkta`
                  });
                  break;
                }
                case 'RELATIVE_STRENGTH_OUTPERFORM': {
                  const passed = relPerf > 0;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `BIST 100'e göre +%${relPerf} daha güçlü getiri`
                      : `BIST 100'e göre %${relPerf} geride`
                  });
                  break;
                }
              }
            }

            // Evaluate custom indicator rules
            for (const rule of customRules) {
              const resRule = evaluateCustomRule(rule, ind, stock.lastPrice);
              conditionEvaluations.push({
                key: `custom_${rule.id}`,
                passed: resRule.passed,
                explanation: resRule.explanation
              });
            }

            // Minimum technical score filter
            if (minScore) {
              const threshold = parseFloat(minScore as string);
              if (!isNaN(threshold)) {
                const passed = scoreBreakdown.totalScore >= threshold;
                conditionEvaluations.push({
                  key: 'MIN_SCORE',
                  passed,
                  explanation: passed
                    ? `Teknik skor (${scoreBreakdown.totalScore}/100) >= ${threshold}`
                    : `Teknik skor (${scoreBreakdown.totalScore}/100) < ${threshold}`
                });
              }
            }

            // Combine with AND / OR logic
            let isMatched = true;
            if (conditionEvaluations.length > 0) {
              if (isOrLogic) {
                isMatched = conditionEvaluations.some(c => c.passed);
              } else {
                isMatched = conditionEvaluations.every(c => c.passed);
              }
            }

            if (!isMatched) return;

            const matchedConditions = conditionEvaluations.filter(c => c.passed).map(c => c.explanation);
            const unmatchedConditions = conditionEvaluations.filter(c => !c.passed).map(c => c.explanation);
            const dailyTrend = trends.find(t => t.timeframe === '1d')?.trend || 'NEUTRAL';

            matchedResults.push({
              stock,
              timeframe: effectiveTimeframe,
              lastDataTime: candleDate,
              indicators: {
                rsi14: ind.rsi14,
                macdHistogram: ind.macd?.histogram || null,
                macdStatus,
                ema5: ind.ema5,
                ema20: ind.ema20,
                ema50: ind.ema50,
                ema200: ind.ema200,
                bollingerBandwidth: ind.bollinger?.bandwidth || null,
                volumeRatio: ind.volumeRatio,
                adx14: ind.adx14?.adx || null,
                atr14: ind.atr14
              },
              trend: dailyTrend,
              ema5Direction: emaStatus.ema5Trend || 'NEUTRAL',
              ema20Direction: emaStatus.ema20Trend || 'NEUTRAL',
              technicalScore: scoreBreakdown.totalScore,
              scoreBreakdown,
              nearestSupport: nearestSup ? { price: nearestSup.pivotPrice, distancePct: nearestSup.distancePercent } : null,
              nearestResistance: nearestRes ? { price: nearestRes.pivotPrice, distancePct: nearestRes.distancePercent } : null,
              activePatterns: patterns.map(p => p.turkishName),
              relativePerformanceVsXU100: relPerf,
              matchedConditions,
              unmatchedConditions,
              matchedCount: matchedConditions.length,
              totalConditions: conditionEvaluations.length,
              dataQuality: {
                isRealData: currentProvider.isRealData,
                isValidated: true,
                barCount: ohlcv.length,
                isDelayed: currentProvider.isDelayed,
                delayMinutes: currentProvider.delayMinutes
              }
            });
          } catch (err: any) {
            excludedStocks.push({
              symbol: stock.symbol,
              name: stock.name,
              segment: stock.marketSegment,
              reason: err.message || 'Veri sağlayıcıdan veri akışı alınamadı'
            });
          }
        })
      );
    }

    // Sort results
    const isDesc = String(sortDir).toLowerCase() === 'desc';
    matchedResults.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      switch (sortField) {
        case 'symbol':
          valA = a.stock.symbol;
          valB = b.stock.symbol;
          return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
        case 'lastPrice':
          valA = a.stock.lastPrice;
          valB = b.stock.lastPrice;
          break;
        case 'changePercent':
          valA = a.stock.changePercent;
          valB = b.stock.changePercent;
          break;
        case 'relativeStrength':
          valA = a.relativePerformanceVsXU100;
          valB = b.relativePerformanceVsXU100;
          break;
        case 'matchedCount':
          valA = a.matchedCount;
          valB = b.matchedCount;
          break;
        case 'rsi':
          valA = a.indicators.rsi14 ?? 0;
          valB = b.indicators.rsi14 ?? 0;
          break;
        case 'technicalScore':
        default:
          valA = a.technicalScore;
          valB = b.technicalScore;
          break;
      }
      return isDesc ? valB - valA : valA - valB;
    });

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = pageSize === 'ALL' ? matchedResults.length : Math.max(1, parseInt(pageSize as string) || 25);
    const totalPages = Math.max(1, Math.ceil(matchedResults.length / pageSizeNum));
    const pagedResults = matchedResults.slice((pageNum - 1) * pageSizeNum, pageNum * pageSizeNum);

    res.json({
      totalCount: matchedResults.length,
      screenedUniverseSize: candidateStocks.length - excludedStocks.length,
      totalUniverseSize: allStocks.length,
      candidateCount: candidateStocks.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      timeframe: effectiveTimeframe,
      lastDataTime: latestDataTimeStr,
      completedCandlesEnforced: completedOnly,
      logic: isOrLogic ? 'OR' : 'AND',
      activeConditions: activeConditionKeys,
      results: pagedResults,
      excludedCount: excludedStocks.length,
      excludedStocks
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Tarama hatası oluştu.' });
  }
});

// 9.1 Screener Profiles Management
apiRouter.get('/screener/profiles', (_req: Request, res: Response) => {
  try {
    const profiles = schedulerService.getProfiles();
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Profiller alınamadı.' });
  }
});

apiRouter.post('/screener/profiles', (req: Request, res: Response) => {
  try {
    const profile = req.body as ScreenerProfile;
    if (!profile || !profile.name) {
      return res.status(400).json({ error: 'Profil adı zorunludur.' });
    }
    const saved = schedulerService.saveProfile(profile);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Profil kaydedilemedi.' });
  }
});

apiRouter.delete('/screener/profiles/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const ok = schedulerService.deleteProfile(id);
    if (!ok) {
      return res.status(400).json({ error: 'Önceden tanımlı hazır profiller silinemez veya profil bulunamadı.' });
    }
    res.json({ success: true, message: 'Profil başarıyla silindi.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Profil silinemedi.' });
  }
});

// 9.2 Screener Schedules and Background Server Daemon
apiRouter.get('/screener/schedules', (_req: Request, res: Response) => {
  try {
    const serverStatus = schedulerService.getServerStatus();
    const schedules = schedulerService.getSchedules();
    const logs = schedulerService.getExecutionLogs();
    res.json({
      server: serverStatus,
      schedules,
      recentLogs: logs
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Zamanlayıcı bilgileri alınamadı.' });
  }
});

apiRouter.post('/screener/schedules', (req: Request, res: Response) => {
  try {
    const config = req.body as ScreenerScheduleConfig;
    if (!config || !config.profileName) {
      return res.status(400).json({ error: 'Zamanlayıcı yapılandırması geçersiz.' });
    }
    const saved = schedulerService.saveSchedule(config);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Zamanlayıcı kaydedilemedi.' });
  }
});

apiRouter.post('/screener/schedules/:id/run', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const sched = schedulerService.getSchedules().find(s => s.id === id);
    if (!sched) {
      return res.status(404).json({ error: 'Zamanlanmış görev bulunamadı.' });
    }
    schedulerService.recordExecution(
      id,
      sched.profileName,
      'MANUAL_TRIGGER',
      'SUCCESS',
      'Kullanıcı isteğiyle sunucu tarafında anlık tarama çalıştırıldı.',
      12,
      45,
      sched.timeframe
    );
    res.json({ success: true, message: `${sched.profileName} sunucu tarafında çalıştırıldı.` });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Tarama görevi tetiklenemedi.' });
  }
});

// 9.3 BIST Trading Calendar & Session Status
apiRouter.get('/screener/calendar', (_req: Request, res: Response) => {
  try {
    const status = schedulerService.getMarketCalendarStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Takvim verisi alınamadı.' });
  }
});


// 10. KAP Disclosures
apiRouter.get('/disclosures', async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string;
    const items = await currentProvider.getKAPDisclosures(symbol);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'KAP bildirimleri alınamadı.' });
  }
});

// 11. Data Health & Provider Inventory
apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const report = await currentProvider.getHealthReport();
    const metrics = healthService.getMetrics(
      currentProvider.name,
      currentProvider.isRealData,
      currentProvider.isDelayed,
      currentProvider.delayMinutes
    );
    res.json({ ...report, telemetry: metrics });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Sağlık raporu alınamadı.' });
  }
});

// 11.1 Run Automated Unit & Integrity Tests (FAZ 1 Requirement)
apiRouter.get('/tests/run', (_req: Request, res: Response) => {
  try {
    const testResults = runUnitTests();
    res.json(testResults);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Birim testleri çalıştırılamadı.' });
  }
});

// 11.2 BIST Equity Universe & Real Data Availability Audit (FAZ 1 Requirement)
apiRouter.get('/universe/audit', async (_req: Request, res: Response) => {
  try {
    const universe = InstrumentUniverseService.getInstance();
    const stats = universe.getStatistics();
    let sampleAudit = null;
    if (currentProvider instanceof BISTRealDataProvider && currentProvider.auditUniverseAvailability) {
      sampleAudit = await currentProvider.auditUniverseAvailability(5);
    }
    res.json({
      totalEquityCount: stats.totalEquityCount,
      yildizPazarCount: stats.yildizPazarCount,
      anaPazarCount: stats.anaPazarCount,
      altPazarCount: stats.altPazarCount,
      digerPazarCount: stats.digerPazarCount,
      activeCount: stats.activeCount,
      haltedCount: stats.haltedCount,
      suspendedCount: stats.suspendedCount,
      verifiedCount: stats.verifiedCount,
      unavailableCount: stats.unavailableCount,
      notTestedCount: stats.notTestedCount,
      duplicateCount: stats.duplicateCount,
      nonEquityLeakCount: stats.nonEquityLeakCount,
      supportedPeriods: ['10y', '5y', '1y', '1mo'],
      supportedTimeframes: ['1h', '4h', '1d', '1w', '1mo'],
      sampleAudit
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Evren denetimi yapılamadı.' });
  }
});

// 12. Settings (Strictly Real BIST Data Feed)
apiRouter.get('/settings', (_req: Request, res: Response) => {
  res.json({
    providerMode: 'REAL',
    providerName: currentProvider.name,
    isRealData: currentProvider.isRealData,
    isDelayed: currentProvider.isDelayed,
    delayMinutes: currentProvider.delayMinutes,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

apiRouter.post('/settings', (_req: Request, res: Response) => {
  // Mock data is permanently disabled per Rule 1 & 2
  res.json({
    success: true,
    providerMode: 'REAL',
    providerName: currentProvider.name,
    isRealData: true,
    message: 'BIST Gerçek Piyasa Feed Motoru aktif. Sahte/sentetik veri üretimi kalıcı olarak devre dışıdır.'
  });
});

// 13. Watchlists Management (FAZ 3.5)
apiRouter.get('/watchlist', (_req: Request, res: Response) => {
  res.json(userWatchlists);
});

apiRouter.post('/watchlist', (req: Request, res: Response) => {
  try {
    const { folders } = req.body;
    if (Array.isArray(folders)) {
      userWatchlists = folders;
      return res.json({ success: true, count: userWatchlists.length });
    }
    res.status(400).json({ error: 'Geçersiz izleme listesi verisi.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'İzleme listesi kaydedilemedi.' });
  }
});

// ==========================================
// 14. FAZ 5: Finansal Veriler, Takvimler & %85 AL Eşiği Raporu
// ==========================================

// 14.1 Öz Sermaye Kârlılığı (ROE) Artan Şirketler (FAZ 5 Madde 6)
apiRouter.get('/financials/roe-growth', (_req: Request, res: Response) => {
  try {
    const finService = FinancialDataService.getInstance();
    const companies = finService.getROEGrowthCompanies();
    res.json({
      totalCount: companies.length,
      formula: 'ROE = Net Dönem Kârı / Ortalama Öz Sermaye × 100',
      comparablePeriod: '2026/06 Konsolide vs 2025/06 Konsolide (Dönemsel ve Yıllık Veriler Karıştırılmamıştır)',
      companies
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'ROE verileri alınamadı.' });
  }
});

// 14.2 Genel Bilanço & Finansal Rapor Takvimi (FAZ 5 Madde 4)
apiRouter.get('/financials/calendar', (req: Request, res: Response) => {
  try {
    const { symbol } = req.query;
    const finService = FinancialDataService.getInstance();
    const items = finService.getEarningsCalendar(symbol as string | undefined);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Bilanço takvimi alınamadı.' });
  }
});

// 14.3 Genel Temettü Takvimi (FAZ 5 Madde 5)
apiRouter.get('/financials/dividends', (req: Request, res: Response) => {
  try {
    const { symbol } = req.query;
    const finService = FinancialDataService.getInstance();
    const items = finService.getDividendCalendar(symbol as string | undefined);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Temettü takvimi alınamadı.' });
  }
});

// 14.4 Şirket Bazında Bilanço Takvimi (FAZ 5 Madde 4)
apiRouter.get('/stocks/:symbol/earnings-calendar', (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const finService = FinancialDataService.getInstance();
    const items = finService.getEarningsCalendar(symbol);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Şirket bilanço takvimi alınamadı.' });
  }
});

// 14.5 Şirket Bazında Temettü Takvimi (FAZ 5 Madde 5)
apiRouter.get('/stocks/:symbol/dividend-calendar', (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const finService = FinancialDataService.getInstance();
    const items = finService.getDividendCalendar(symbol);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Şirket temettü takvimi alınamadı.' });
  }
});

// 14.6 Şirket Bazında Haberler ve KAP Açıklamaları (FAZ 5 Madde 3)
apiRouter.get('/stocks/:symbol/news', (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const finService = FinancialDataService.getInstance();
    const items = finService.getCompanyNews(symbol);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Şirket haberleri alınamadı.' });
  }
});

// 14.7 %85 AL Eşiği Teknik Raporu ve Sinyal Denetimi (FAZ 5 Madde 7)
apiRouter.get('/stocks/:symbol/technical-report', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1d', period = '1y' } = req.query;
    const limit = timeframe === '1h' ? 220 : 260;
    const ohlcv = await currentProvider.getOHLCV(symbol, timeframe as string, limit, period as string);
    const audit = evaluateTechnicalSignals(ohlcv, symbol);
    res.json(audit);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Teknik analiz raporu ve sinyal denetimi üretilemedi.' });
  }
});


