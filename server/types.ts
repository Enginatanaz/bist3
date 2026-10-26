export type MarketSegment = 'YILDIZ_PAZAR' | 'ANA_PAZAR' | 'ALT_PAZAR' | 'POIP' | 'DIGER_PAZAR';
export type InstrumentDataStatus = 'VERIFIED' | 'STALE' | 'UNAVAILABLE' | 'INVALID' | 'NOT_TESTED';

export interface BISTStock {
  symbol: string;           // e.g. THYAO, GARAN, ASELS
  name: string;             // Türk Hava Yolları A.O.
  sector: string;           // Ulaştırma, Bankacılık, Savunma, Teknoloji, vb.
  subSector?: string;
  indices: string[];        // ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST ULASTIRMA']
  marketSegment: MarketSegment; // Yıldız, Ana, Alt, POIP, Diğer
  instrumentType: 'EQUITY';  // Strictly equity shares
  dataStatus: InstrumentDataStatus; // Doğrulandı, Eski, Veri Sağlanamıyor, Doğrulanamadı, Henüz Test Edilmedi
  lastVerifiedAt?: string | null;
  unavailableReason?: string | null;
  lastPrice: number;
  change: number;           // absolute price change
  changePercent: number;    // percentage change
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;           // Lot (shares)
  volumeTL: number;         // İşlem Hacmi (TL)
  marketCapTL: number;      // Piyasa Değeri (TL)
  pe?: number;              // F/K (Fiyat/Kazanç)
  pb?: number;              // PD/DD (Piyasa Değeri/Defter Değeri)
  dividendYield?: number;   // Temettü Verimi %
  freeFloatRate?: number;   // Halka Açıklık Oranı %
  status: 'ACTIVE' | 'HALTED' | 'SUSPENDED';
  formerSymbols?: string[]; // İşlem kodu değişen şirketler
  notes?: string;           // Özel pazar veya işlem durumu notu
  updatedAt: string;        // ISO timestamp of provider
  isDelayed: boolean;       // 15-dk gecikmeli mi?
  delayMinutes: number;     // 0 veya 15
}

export interface OHLCV {
  timestamp: number;        // Epoch ms
  dateStr: string;          // YYYY-MM-DD or HH:mm
  open: number;             // Ham açılış
  high: number;             // Ham en yüksek
  low: number;              // Ham en düşük
  close: number;            // Ham kapanış
  adjClose?: number;        // Bölünme / temettü düzeltilmiş kapanış
  volume: number;           // İşlem hacmi (lot)
  isValidated?: boolean;    // Kalite doğrulama uygulandı mı
  isClosed?: boolean;       // Tamamlanmış / kapanmış mum mu (seans içi açık mum değil)
  provider?: string;        // Veri sağlayıcısı
  providerTimestamp?: string;
  receivedAt?: string;
  validationStatus?: 'VALID' | 'CORRECTED' | 'REJECTED';
  validationErrors?: string[];
  timeframe?: string;
}

export interface HistoricalCoverage {
  requestedPeriod: string;
  earliestDate: string;
  latestDate: string;
  totalCandles: number;
  missingDatesCount: number;
  hasAdjustedPrices: boolean;
  formingCandlePresent: boolean;
}

export interface MarketStatus {
  isOpen: boolean;
  sessionPhase: 'PRE_MARKET' | 'CONTINUOUS_AUCTION' | 'CLOSING_SESSION' | 'CLOSED';
  exchangeLocalTime: string; // Istanbul time
  serverTime: string;
  providerName: string;
  delayMinutes: number;
  lastUpdated: string;
  bistIndices: {
    symbol: string;
    name: string;
    value: number;
    change: number;
    changePercent: number;
  }[];
}

export interface TechnicalIndicators {
  ema5: number | null;
  ema9: number | null;
  ema20: number | null;
  ema50: number | null;
  ema100: number | null;
  ema200: number | null;
  emaTrends?: {
    ema5: number | null;
    ema20: number | null;
    ema5Trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    ema20Trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    mainTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    crossover: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'ABOVE' | 'BELOW' | 'NEUTRAL';
    lastCandleTime: string;
    timeframe: string;
    ema5Direction?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    ema20Direction?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    primaryTrend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    crossoverLabel?: string;
  };
  rsi14: number | null;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  } | null;
  bollinger: {
    upper: number;
    middle: number; // EMA20 middle line
    lower: number;
    bandwidth: number;
    percentB: number;
  } | null;
  atr14: number | null;
  stochastic: {
    k: number;
    d: number;
  } | null;
  stochRsi: {
    k: number;
    d: number;
  } | null;
  adx14: {
    adx: number;
    pdi: number;
    ndi: number;
  } | null;
  parabolicSar: number | null;
  ichimoku: {
    tenkanSen: number;
    kijunSen: number;
    senkouSpanA: number;
    senkouSpanB: number;
    chikouSpan: number;
  } | null;
  cci20: number | null;
  williamsR14: number | null;
  roc12: number | null;
  obv: number | null;
  vwap: number | null;
  volumeEma20: number | null;
  volumeRatio: number | null; // Güncel hacim / 20 günlük EMA hacim
}

export interface SupportResistanceZone {
  id: string;
  type: 'SUPPORT' | 'RESISTANCE';
  priceLow: number;
  priceHigh: number;
  pivotPrice: number;
  strengthScore: number;     // 1-100
  touchCount: number;
  lastTestedDate: string;
  distancePercent: number;  // Distance from current price
  roleReversals?: number;    // Destek-direnç rol değişimi sayısı
  status?: 'HOLDING' | 'TESTED' | 'BROKEN' | 'ACTIVE';
  period?: string;
  timeframe?: string;
  colorHex?: string;
  price?: number;
  lastTouchDate?: string;
}

export interface BreakoutEvent {
  id: string;
  date: string;
  priceLevel: number;
  direction: 'BULLISH_BREAKOUT' | 'BEARISH_BREAKOUT';
  timeframe: string;
  closeConfirmed: boolean;
  wickPenetrationOnly: boolean;
  volumeConfirmed: boolean;
  volumeRatio?: number;
  subsequentMovePct?: number;
  dateStr?: string;
  levelPrice?: number;
  hasVolumeConfirmation?: boolean;
}

export interface AutoChannel {
  id: string;
  type: 'CHANNEL_UP' | 'CHANNEL_DOWN' | 'CHANNEL_HORIZONTAL';
  label: string;
  slope: number;
  upperIntercept: number;
  lowerIntercept: number;
  startIdx: number;
  endIdx: number;
  startDate: string;
  endDate: string;
  upperPriceNow: number;
  lowerPriceNow: number;
  touches: number;
  channelType?: 'CHANNEL_UP' | 'CHANNEL_DOWN' | 'CHANNEL_HORIZONTAL';
}

export interface UserDrawing {
  id: string;
  symbol: string;
  type: 'TREND_LINE' | 'HORIZONTAL_LINE' | 'SUPPORT_LINE' | 'RESISTANCE_LINE' | 'PARALLEL_CHANNEL';
  color: string;
  points: { dateStr: string; price: number; x?: number; y?: number }[];
  createdAt: string;
}

export interface PeakAndResistanceMetrics {
  lastPrice: number;
  marketDataTime: string;
  periodHigh: number;
  distanceFromPeakPct: number;
  nearestResistance: SupportResistanceZone | null;
  distanceToResistancePct: number | null;
  nearestSupport: SupportResistanceZone | null;
  distanceToSupportPct: number | null;
  period: string;
  lastVerifiedPrice?: number;
}

export interface ChartPattern {
  id: string;
  type:
    | 'ASCENDING_TRIANGLE'
    | 'DESCENDING_TRIANGLE'
    | 'SYMMETRICAL_TRIANGLE'
    | 'INVERSE_HEAD_AND_SHOULDERS'
    | 'HEAD_AND_SHOULDERS'
    | 'DOUBLE_BOTTOM'
    | 'DOUBLE_TOP'
    | 'TRIPLE_BOTTOM'
    | 'TRIPLE_TOP'
    | 'FALLING_WEDGE'
    | 'RISING_WEDGE'
    | 'FLAG'
    | 'BULL_FLAG'
    | 'BEAR_FLAG'
    | 'PENNANT'
    | 'CHANNEL_UP'
    | 'CHANNEL_DOWN'
    | 'CHANNEL_HORIZONTAL';
  turkishName: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  status: 'FORMING' | 'CONFIRMED' | 'INVALIDATED';
  necklinePrice: number;
  targetPrice: number;
  stopLossPrice: number;
  confidenceScore: number;  // 0-100
  description: string;
  detectedIndex: number;
  startDate?: string;
  boundaries?: { upper: number; lower: number; upperSlope?: number; lowerSlope?: number; upperLevel?: number; lowerLevel?: number };
  invalidationCondition?: string;
  timeframe?: string;
}

export interface TechnicalScoreWeights {
  trend: number;      // e.g. 25
  momentum: number;   // e.g. 25
  volume: number;     // e.g. 20
  volatility: number; // e.g. 15
  structure: number;  // e.g. 15
}

export interface TechnicalScoreBreakdown {
  totalScore: number; // 0-100
  isComputable: boolean;
  missingIndicators: string[];
  weights: TechnicalScoreWeights;
  components: {
    trend: { score: number; maxScore: number; details: string };
    momentum: { score: number; maxScore: number; details: string };
    volume: { score: number; maxScore: number; details: string };
    volatility: { score: number; maxScore: number; details: string };
    structure: { score: number; maxScore: number; details: string };
  };
  evaluationText: string;
  disclaimer: string;
}

export interface ScenarioHorizon {
  days: 5 | 7 | 10;
  bullish: {
    probability: number;      // e.g. 52%
    targetLow: number;
    targetHigh: number;
    expectedGainPct: number;
    triggerCondition: string;
    invalidationPrice: number;
  };
  base: {
    probability: number;      // e.g. 28%
    corridorLow: number;
    corridorHigh: number;
    triggerCondition: string;
  };
  bearish: {
    probability: number;      // e.g. 20%
    targetLow: number;
    targetHigh: number;
    expectedLossPct: number;
    triggerCondition: string;
    invalidationPrice: number;
  };
  volatilityEstimatePct: number; // e.g. 4.2% ATR 10-day projected
  var95LossPct: number;         // 95% Parametric VaR
  riskRewardRatio: number;
}

export interface ScenarioCalibrationReport {
  modelStatus: 'EXPERIMENTAL' | 'CALIBRATED';
  sampleBars: number;
  historicalVolatilityAnnualized: number;
  dailyVolatilityPct: number;
  dailySkewness: number;
  dailyKurtosis: number;
  historicalCalibration: {
    bucket70PctTheoretical: number;
    bucket70PctRealized: number;
    brierScore: number;
    calibrationStatus: 'WELL_CALIBRATED' | 'ACCEPTABLE' | 'DRIFTING';
  };
  regime: 'LOW_VOL_TRENDING' | 'HIGH_VOL_CHOPPY' | 'BREAKOUT_MOMENTUM' | 'CONSOLIDATION';
  dataSufficiencyScore: number;
}

export interface ExtendedScenarioResult {
  symbol: string;
  stock: BISTStock;
  currentPrice: number;
  horizons: {
    horizon5d: ScenarioHorizon;
    horizon7d: ScenarioHorizon;
    horizon10d: ScenarioHorizon;
  };
  calibration: ScenarioCalibrationReport;
  keyLevels: SupportResistanceZone[];
  riskManagementDefaults: {
    defaultCapitalTL: number;
    defaultRiskPct: number;
    estimatedCommissionPct: number;
    estimatedSlippagePct: number;
  };
  provider: string;
  isDelayed: boolean;
  marketDataTime: string;
  analysisTime: string;
}

export interface ScreenerStockResult {
  stock: BISTStock;
  timeframe: string;
  lastDataTime: string;
  indicators: {
    rsi14: number | null;
    macdHistogram: number | null;
    macdStatus: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    ema5: number | null;
    ema20: number | null;
    ema50: number | null;
    ema200: number | null;
    bollingerBandwidth: number | null;
    volumeRatio: number | null;
    adx14: number | null;
    atr14: number | null;
  };
  trend: 'STRONG_BULL' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEAR';
  ema5Direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  ema20Direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  technicalScore: number;
  scoreBreakdown: TechnicalScoreBreakdown;
  nearestSupport: { price: number; distancePct: number } | null;
  nearestResistance: { price: number; distancePct: number } | null;
  activePatterns: string[];
  relativePerformanceVsXU100: number; // % relative return over 20 bars
  matchedConditions: string[];
  unmatchedConditions: string[];
  matchedCount: number;
  totalConditions: number;
  dataQuality: {
    isRealData: boolean;
    isValidated: boolean;
    barCount: number;
    isDelayed?: boolean;
    delayMinutes?: number;
  };
}

export interface CustomIndicatorRule {
  id: string;
  name: string;
  indicator: 'RSI' | 'EMA5' | 'EMA20' | 'EMA50' | 'EMA200' | 'MACD_HIST' | 'VOLUME_RATIO' | 'ATR' | 'BOLLINGER_BANDWIDTH' | 'LAST_PRICE';
  operator: '>' | '>=' | '<' | '<=' | '==' | 'CROSS_ABOVE' | 'CROSS_BELOW';
  compareTo: 'VALUE' | 'INDICATOR';
  targetValue?: number;
  targetIndicator?: string;
}

export interface ScreenerProfile {
  id: string;
  name: string;
  description?: string;
  isPreset?: boolean;
  timeframe: '1h' | '4h' | '1d' | '1wk' | '1mo';
  logic: 'AND' | 'OR';
  conditions: string[]; // condition IDs / keys
  customRules?: CustomIndicatorRule[];
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  createdAt: string;
  updatedAt: string;
}

export interface ScreenerScheduleConfig {
  id: string;
  profileId: string;
  profileName: string;
  mode: 'MANUAL' | 'POST_CLOSE' | 'SCHEDULED_TIME' | 'CONDITION_TRIGGERED';
  scheduledTimes?: string[]; // e.g. ["18:15", "11:00"]
  timeframe: '1h' | '4h' | '1d' | '1wk' | '1mo';
  enabled: boolean;
  notifyOnMatch?: boolean;
  lastRunAt?: string | null;
  lastRunSummary?: string | null;
  lastMatchCount?: number;
}

export interface ExcludedStockReason {
  symbol: string;
  name: string;
  segment: string;
  reason: string;
}

export interface MultiTimeframeTrend {
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w';
  label: string;
  trend: 'STRONG_BULL' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEAR';
  strengthScore: number; // 0-100
  rsi: number;
  summary: string;
}

export interface BacktestParams {
  symbol: string;
  timeframe: '1d' | '4h' | '1h';
  strategy: 'EMA_CROSSOVER' | 'RSI_REVERSAL' | 'MACD_CROSSOVER' | 'BOLLINGER_BREAKOUT' | 'SUPERTREND_MOMENTUM' | 'SMA_CROSSOVER';
  startDate?: string;
  endDate?: string;
  initialCapital: number;     // e.g. 100,000 TL
  slippagePct: number;        // e.g. 0.1% (kayma)
  commissionPct: number;      // e.g. 0.15% (komisyon)
  takeProfitPct?: number;     // e.g. 6%
  stopLossPct?: number;       // e.g. 3%
  parameters?: Record<string, number>;
}

export interface BacktestTrade {
  id: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  side: 'LONG';
  shares: number;
  pnlTL: number;
  returnPct: number;
  holdingDays: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'SIGNAL_EXIT' | 'END_OF_DATA';
}

export interface BacktestResult {
  symbol: string;
  strategyName: string;
  initialCapital: number;
  finalCapital: number;
  totalReturnPct: number;
  benchmarkReturnPct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  averageTradePct: number;
  totalCommissionsTL: number;
  totalSlippageTL: number;
  equityCurve: { dateStr: string; portfolioValue: number; benchmarkValue: number }[];
  trades: BacktestTrade[];
}

export interface KAPDisclosure {
  id: string;
  symbol: string;
  companyTitle: string;
  publishDate: string;
  title: string;
  summary: string;
  category: 'Özel Durum' | 'Finansal Rapor' | 'Temettü / Sermaye' | 'Halka Arz' | 'Şirket Kararı' | 'Diğer';
  isImportant: boolean;
}

export interface UniverseStatistics {
  totalEquityCount: number;
  yildizPazarCount: number;
  anaPazarCount: number;
  altPazarCount: number;
  digerPazarCount: number;
  verifiedCount: number;
  staleCount: number;
  unavailableCount: number;
  notTestedCount: number;
  duplicateCount: number;
  nonEquityLeakCount: number;
  lastUniverseUpdateTime: string;
  unavailableSymbols: { symbol: string; segment: string; reason: string; timestamp: string }[];
}

export interface DataHealthReport {
  totalBistUniverseCount: number;
  activeCount: number;
  haltedCount: number;
  providerName: string;
  providerStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  isDelayed: boolean;
  delayMinutes: number;
  lastSyncTime: string;
  cacheHitRatio: number;
  validationCheck: {
    passed: boolean;
    highLowIntegrity: boolean;
    nonNegativeVolume: boolean;
    chronologicalOrder: boolean;
    deduplicated: boolean;
    gapDetectedCount: number;
  };
  indexDistribution: {
    bist30: number;
    bist50: number;
    bist100: number;
    bistTum: number;
  };
  universe?: UniverseStatistics;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: string;
  targetPrice?: number;
  stopPrice?: number;
  notes?: string;
}

export interface WatchlistFolder {
  id: string;
  name: string;
  createdAt: string;
  items: WatchlistItem[];
}

// ==========================================
// FAZ 5: Finansal Veriler, Takvimler ve Raporlama
// ==========================================

export interface EarningsCalendarItem {
  id: string;
  symbol: string;
  companyName: string;
  financialPeriod: string; // e.g. '2026/09 (3. Çeyrek)'
  scheduledDate: string; // e.g. '2026-11-09'
  dateStatus: 'EXACT' | 'ESTIMATED'; // Kesinleşmiş vs Tahmini
  source: string; // e.g. 'KAP / Borsa İstanbul Finansal Takvim Duyurusu'
  lastUpdated: string;
  isConfirmed: boolean;
  notes?: string;
}

export interface DividendCalendarItem {
  id: string;
  symbol: string;
  companyName: string;
  decisionStatus: 'APPROVED' | 'PROPOSED' | 'NOT_ANNOUNCED';
  grossPerShare: number | null; // TL
  netPerShare: number | null; // TL (%10 stopaj sonrası)
  exDividendDate: string | null; // Temettü Hak Kullanım Tarihi
  paymentDate: string | null; // Nakit Ödeme / Hesaba Geçiş Tarihi
  dividendYieldPct: number | null; // % Temettü Verimi
  yieldCalculationDate: string;
  source: string; // e.g. 'KAP Kâr Payı Dağıtım Bildirimi'
  isOfficial: boolean;
  notes?: string;
}

export interface CompanyNewsItem {
  id: string;
  symbol: string;
  title: string;
  source: string; // e.g. 'KAP', 'Matriks', 'Bloomberg HT', 'AA Finans'
  publishDate: string;
  originalUrl: string;
  lastUpdated: string;
  category: 'KAP_DISCLOSURE' | 'FINANCIAL_REPORT' | 'DIVIDEND' | 'CORPORATE_NEWS';
  summary?: string;
}

export interface ROEGrowthCompany {
  symbol: string;
  name: string;
  sector: string;
  lastReportedROE: number; // % (örn: 38.4)
  previousROE: number; // % (örn: 29.1)
  roeChangePct: number; // % puan fark (+9.3%)
  netIncomeTL: number; // Net dönem kârı
  avgEquityTL: number; // Ortalama öz sermaye
  formulaDescription: string; // 'Net Dönem Kârı / Ortalama Öz Sermaye × 100'
  financialPeriod: string; // '2026/06 (2. Çeyrek Konsolide)'
  previousPeriod: string; // '2025/06 (Karşılaştırılabilir Önceki Dönem)'
  announcementDate: string;
  source: string; // 'KAP Bağımsız Denetimden Geçmiş Bilanço'
  marketCapTL?: number;
}

export interface IndicatorSignalDetail {
  id: string;
  name: string;
  category: 'TREND' | 'MOMENTUM' | 'VOLATILITY' | 'VOLUME' | 'STRUCTURE';
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  valueStr: string;
  reason: string;
  isComputable: boolean;
  isIndependent: boolean;
  correlationNote?: string;
}

export interface TechnicalSignalAudit {
  symbol: string;
  currentPrice: number;
  timeframe: string;
  lastDataTime: string;
  evaluatedIndicatorsCount: number; // Değerlendirilebilir indikatör sayısı
  uncomputableIndicatorsCount: number; // Hesaplanamayan göstergeler (asla AL veya nötr sayılmaz)
  buySignalsCount: number;
  sellSignalsCount: number;
  neutralSignalsCount: number;
  buySignalRatioPct: number; // (buySignalsCount / evaluatedIndicatorsCount) * 100
  sellSignalRatioPct: number;
  neutralSignalRatioPct: number;
  thresholdMet: boolean; // buySignalRatioPct >= 85.0
  requiredThresholdPct: number; // 85.0
  signals: IndicatorSignalDetail[];
  uncomputableList: { name: string; reason: string }[];
  warningMessage?: string;
  correlationWarning: string;
  legalDisclaimer: string;
}

// ==========================================
// FAZ 4: Endekse Göre Güçlü Hisseler ve Piyasa Riski Analizi
// ==========================================

export type MarketRegimeType = 
  | 'STRONG_BULL'   // Güçlü Yükseliş
  | 'WEAK_BULL'     // Zayıf Yükseliş
  | 'SIDEWAYS'      // Yatay
  | 'WEAK_BEAR'     // Zayıf Düşüş
  | 'STRONG_BEAR';   // Güçlü Düşüş

export interface MarketRegimeReport {
  indexSymbol: string;
  indexName: string;
  regime: MarketRegimeType;
  regimeLabel: string;
  currentPrice: number;
  ema20: number;
  ema20Slope: number;            // % slope over recent bars
  priceToEma20Pct: number;        // (Price - EMA20) / EMA20 * 100
  rsi14: number;
  priceStructure: 'HIGHER_HIGHS' | 'LOWER_LOWS' | 'RANGE_BOUND';
  description: string;
  methodologyExplanation: string;
  thresholds: {
    strongBullEmaSlopeMin: number;
    strongBearEmaSlopeMax: number;
    sidewaysSlopeThreshold: number;
    priceToEmaTolerancePct: number;
  };
  lastDataTime: string;
}

export interface RelativeStrengthPoint {
  timestamp: number;
  dateStr: string;
  stockPrice: number;
  indexPrice: number;
  rsRatio: number;               // StockPrice / IndexPrice
  normalizedStock: number;       // Base 100 at start
  normalizedIndex: number;       // Base 100 at start
  rsEma20?: number;
}

export interface RelativeStrengthMetrics {
  symbol: string;
  indexSymbol: string;
  timeframe: string;
  periodBars: number;
  stockReturnPct: number;
  indexReturnPct: number;
  relativeAlphaPct: number;      // StockReturn - IndexReturn
  rsRatioCurrent: number;
  rsRatioChangePct: number;
  rsTrend: 'EXPANDING' | 'CONTRACTING' | 'NEUTRAL';
  rsEmaSlope: number;
  points: RelativeStrengthPoint[];
  lastDataTime: string;
}

export type ScreenerCategory =
  | 'INDEX_UP_STOCK_STRONGER'    // 1. Endeks yükselirken endeksten daha güçlü hisseler
  | 'INDEX_UP_RS_EXPANDING'      // 2. Endeks yükselirken göreceli gücü artan hisseler
  | 'INDEX_SIDEWAYS_STOCK_GAINING' // 3. Endeks yatayken güç kazanan hisseler
  | 'INDEX_DOWN_STOCK_LESS_DROP' // 4. Endeks düşerken daha az gerileyen hisseler
  | 'INDEX_DOWN_STOCK_RISING'    // 5. Endeks düşerken yükselişini sürdüren hisseler
  | 'INDEX_DOWN_STOCK_RESILIENT' // 6. Endeks düşüşüne direnç gösteren hisseler
  | 'INDEX_RELATIVELY_WEAK'      // 7. Endekse kıyasla zayıflayan hisseler
  | 'DOWNSIDE_RISK_INCREASING';  // 8. Düşüş riski artan hisseler

export interface RelativeStrengthScreenerItem {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  changePercent: number;
  stockReturnPct: number;
  indexReturnPct: number;
  relativeAlphaPct: number;
  category: ScreenerCategory;
  categoryTitle: string;
  rsScore: number;               // 0-100
  technicalReason: string;
  isConfirmed: boolean;
  timeframe: string;
  indicators: {
    ema5: number | null;
    ema20: number | null;
    rsi14: number | null;
    volumeRatio: number | null;
    supportPrice?: number | null;
    distanceToSupportPct?: number | null;
  };
}

export type DualTrackConditionType =
  | 'INDEX_BELOW_EMA20'          // Endeks EMA20 altına indi
  | 'STOCK_BELOW_EMA20'          // Hisse EMA20 altına indi
  | 'EMA5_CROSS_EMA20_DOWN'      // EMA5, EMA20'yi aşağı kesti
  | 'STOCK_BROKE_SUPPORT'        // Hisse önemli desteğini kırdı
  | 'STOCK_LOST_RS'              // Hisse endekse göre güç kaybetti
  | 'RS_INDICATOR_RETREAT'       // Göreceli güç göstergesi geriledi
  | 'UPWARD_CHANNEL_BROKEN'      // Yükselen kanal aşağı kırıldı
  | 'RESISTANCE_REJECTION'       // Dirençten başarısız dönüş gerçekleşti
  | 'SUPPORT_BREAK_WITH_VOLUME'; // Hacim artışıyla destek kırıldı

export interface DualTrackConditionStatus {
  condition: DualTrackConditionType;
  title: string;
  description: string;
  isTriggered: boolean;
  valueDescription: string;
  triggeredAt?: string;
}

export interface DownsideRiskFactor {
  id: string;
  title: string;
  weight: number;                // e.g. 20
  isTriggered: boolean;
  detail: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DownsideRiskAssessment {
  symbol: string;
  indexSymbol: string;
  currentPrice: number;
  riskScore: number;             // 0-100 (Explainable multi-factor score)
  riskLevel: 'DÜŞÜK' | 'ORTA' | 'YÜKSEK' | 'KRİTİK';
  riskLevelColor: string;
  disclaimer: string;
  factors: DownsideRiskFactor[];
  summary: string;
  timeframe: string;
  evaluatedAt: string;
}

export interface MarketAlertRule {
  id: string;
  symbol: string;
  indexSymbol: string;
  timeframe: '1h' | '4h' | '1d' | '1w' | '1mo';
  conditions: DualTrackConditionType[];
  thresholdPrice?: number;
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string | null;
  lastTriggerReason?: string | null;
  notes?: string;
}

export interface AlertTriggerLog {
  id: string;
  alertId: string;
  symbol: string;
  indexSymbol: string;
  condition: DualTrackConditionType;
  conditionTitle: string;
  dataTimestamp: string;
  recordedAt: string;
  priceAtTrigger: number;
  indexPriceAtTrigger: number;
  explanation: string;
}

export interface RSBacktestParams {
  symbol: string;
  indexSymbol: string;
  timeframe: '1d' | '4h' | '1h';
  startDate?: string;
  endDate?: string;
  initialCapital: number;
  commissionPct: number;         // 0.15%
  slippagePct: number;           // 0.10%
  alphaThresholdPct: number;     // e.g. +1.0% alpha required to enter
  stopLossPct?: number;
  takeProfitPct?: number;
}

export interface RSBacktestResult {
  symbol: string;
  indexSymbol: string;
  timeframe: string;
  testPeriod: {
    startDate: string;
    endDate: string;
    totalBars: number;
  };
  initialCapital: number;
  finalCapital: number;
  stockReturnPct: number;
  indexReturnPct: number;
  relativeAlphaPct: number;      // StockReturn - IndexReturn
  strategyReturnPct: number;
  strategyAlphaVsIndex: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  totalCommissionsTL: number;
  totalSlippageTL: number;
  equityCurve: {
    dateStr: string;
    strategyValue: number;
    stockValue: number;
    indexValue: number;
  }[];
  trades: {
    id: string;
    entryDate: string;
    entryPrice: number;
    exitDate: string;
    exitPrice: number;
    returnPct: number;
    relativeAlphaPct: number;
    exitReason: string;
    pnlTL: number;
  }[];
  disclaimer: string;
}

