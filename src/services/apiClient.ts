import {
  BISTStock,
  OHLCV,
  MarketStatus,
  TechnicalIndicators,
  SupportResistanceZone,
  ChartPattern,
  MultiTimeframeTrend,
  ScenarioHorizon,
  BacktestResult,
  KAPDisclosure,
  DataHealthReport,
  AnalyticalReport
} from '../types';

export const apiClient = {
  async getMarketStatus(): Promise<MarketStatus> {
    const res = await fetch('/api/market/status');
    if (!res.ok) throw new Error('Piyasa durumu alınamadı.');
    return res.json();
  },

  async getStocks(params?: {
    index?: string;
    sector?: string;
    search?: string;
    marketSegment?: string;
    dataStatus?: string;
  }): Promise<BISTStock[]> {
    const q = new URLSearchParams();
    if (params?.index) q.set('index', params.index);
    if (params?.sector) q.set('sector', params.sector);
    if (params?.search) q.set('search', params.search);
    if (params?.marketSegment) q.set('marketSegment', params.marketSegment);
    if (params?.dataStatus) q.set('dataStatus', params.dataStatus);

    const res = await fetch(`/api/stocks?${q.toString()}`);
    if (!res.ok) throw new Error('Hisseler alınamadı.');
    return res.json();
  },

  async getStock(symbol: string): Promise<BISTStock> {
    const res = await fetch(`/api/stocks/${symbol}`);
    if (!res.ok) throw new Error(`Hisse bulunamadı: ${symbol}`);
    return res.json();
  },

  async getOHLCV(symbol: string, timeframe: string = '1d', limit: number = 180, period?: string): Promise<{
    symbol: string;
    timeframe: string;
    period?: string;
    count: number;
    provider: string;
    isDelayed: boolean;
    delayMinutes?: number;
    coverage?: import('../types').HistoricalCoverage;
    candles: OHLCV[];
  }> {
    const q = new URLSearchParams({ timeframe, limit: limit.toString() });
    if (period) q.set('period', period);
    const res = await fetch(`/api/stocks/${symbol}/ohlcv?${q.toString()}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'OHLCV verisi alınamadı.');
    }
    return res.json();
  },

  async getUniverseAudit(): Promise<any> {
    const res = await fetch('/api/universe/audit');
    if (!res.ok) throw new Error('Evren denetim verisi alınamadı.');
    return res.json();
  },

  async getTechnical(symbol: string, timeframe: string = '1d', period?: string): Promise<{
    symbol: string;
    stock: BISTStock;
    timeframe: string;
    period?: string;
    indicators: TechnicalIndicators;
    zones: SupportResistanceZone[];
    breakouts?: import('../types').BreakoutEvent[];
    patterns: ChartPattern[];
    autoChannels?: import('../types').AutoChannel[];
    peakMetrics?: import('../types').PeakAndResistanceMetrics;
    trends: MultiTimeframeTrend[];
    candleCount: number;
    lastCandleDate: string;
    provider: string;
    isDelayed: boolean;
  }> {
    const q = new URLSearchParams({ timeframe });
    if (period) q.set('period', period);
    const res = await fetch(`/api/stocks/${symbol}/technical?${q.toString()}`);
    if (!res.ok) throw new Error('Teknik analiz verisi alınamadı.');
    return res.json();
  },

  async getScenarios(symbol: string): Promise<import('../types').ExtendedScenarioResult> {
    const res = await fetch(`/api/stocks/${symbol}/scenarios`);
    if (!res.ok) throw new Error('Senaryo verisi alınamadı.');
    return res.json();
  },

  async generateAiReport(symbol: string): Promise<AnalyticalReport> {
    const res = await fetch(`/api/stocks/${symbol}/ai-report`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Yapay zeka analitik raporu üretilemedi.');
    return res.json();
  },

  async runBacktest(params: any): Promise<BacktestResult> {
    const res = await fetch('/api/backtest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Backtest simülasyonu başarısız oldu.');
    return res.json();
  },

  async runScreener(filters: Record<string, string>): Promise<{
    totalCount: number;
    screenedUniverseSize: number;
    totalUniverseSize: number;
    candidateCount?: number;
    page: number;
    pageSize: number;
    totalPages: number;
    timeframe: string;
    lastDataTime: string;
    completedCandlesEnforced?: boolean;
    logic: 'AND' | 'OR';
    activeConditions?: string[];
    results: import('../types').ScreenerStockResult[];
    excludedCount: number;
    excludedStocks: import('../types').ExcludedStockReason[];
  }> {
    const q = new URLSearchParams(filters);
    const res = await fetch(`/api/screener?${q.toString()}`);
    if (!res.ok) throw new Error('Tarama filtresi uygulanamadı.');
    return res.json();
  },

  async getScreenerProfiles(): Promise<import('../types').ScreenerProfile[]> {
    const res = await fetch('/api/screener/profiles');
    if (!res.ok) throw new Error('Tarama profilleri alınamadı.');
    return res.json();
  },

  async saveScreenerProfile(profile: import('../types').ScreenerProfile): Promise<import('../types').ScreenerProfile> {
    const res = await fetch('/api/screener/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Tarama profili kaydedilemedi.');
    return res.json();
  },

  async deleteScreenerProfile(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/screener/profiles/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Tarama profili silinemedi.');
    return res.json();
  },

  async getScreenerSchedules(): Promise<{
    server: any;
    schedules: import('../types').ScreenerScheduleConfig[];
    recentLogs: any[];
  }> {
    const res = await fetch('/api/screener/schedules');
    if (!res.ok) throw new Error('Tarama zamanlayıcıları alınamadı.');
    return res.json();
  },

  async saveScreenerSchedule(config: import('../types').ScreenerScheduleConfig): Promise<import('../types').ScreenerScheduleConfig> {
    const res = await fetch('/api/screener/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Tarama zamanlayıcı kaydedilemedi.');
    return res.json();
  },

  async runScreenerSchedule(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/screener/schedules/${id}/run`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Tarama zamanlayıcısı çalıştırılamadı.');
    return res.json();
  },

  async getScreenerCalendar(): Promise<any> {
    const res = await fetch('/api/screener/calendar');
    if (!res.ok) throw new Error('Piyasa takvim durumu alınamadı.');
    return res.json();
  },

  async getWatchlists(): Promise<import('../types').WatchlistFolder[]> {
    const res = await fetch('/api/watchlist');
    if (!res.ok) throw new Error('İzleme listeleri alınamadı.');
    return res.json();
  },

  async saveWatchlists(folders: import('../types').WatchlistFolder[]): Promise<any> {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folders })
    });
    if (!res.ok) throw new Error('İzleme listeleri kaydedilemedi.');
    return res.json();
  },


  async getDisclosures(symbol?: string): Promise<KAPDisclosure[]> {
    const url = symbol ? `/api/disclosures?symbol=${symbol}` : '/api/disclosures';
    const res = await fetch(url);
    if (!res.ok) throw new Error('KAP bildirimleri alınamadı.');
    return res.json();
  },

  async getHealthReport(): Promise<DataHealthReport & { telemetry?: any }> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Sağlık raporu alınamadı.');
    return res.json();
  },

  async runUnitTests(): Promise<{ allPassed: boolean; testsCount: number; results: { name: string; passed: boolean; message: string }[] }> {
    const res = await fetch('/api/tests/run');
    if (!res.ok) throw new Error('Birim testleri çalıştırılamadı.');
    return res.json();
  },

  async getSettings(): Promise<{
    providerMode: string;
    providerName: string;
    isRealData: boolean;
    isDelayed: boolean;
    delayMinutes: number;
    hasGeminiKey: boolean;
  }> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Ayarlar alınamadı.');
    return res.json();
  },

  async updateSettings(mode: 'REAL' | 'DEMO'): Promise<any> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    if (!res.ok) throw new Error('Ayar güncellenemedi.');
    return res.json();
  },

  // FAZ 5 Methods:
  async getROEGrowth(): Promise<{
    totalCount: number;
    formula: string;
    comparablePeriod: string;
    companies: import('../types').ROEGrowthCompany[];
  }> {
    const res = await fetch('/api/financials/roe-growth');
    if (!res.ok) throw new Error('ROE büyüme verileri alınamadı.');
    return res.json();
  },

  async getEarningsCalendar(symbol?: string): Promise<import('../types').EarningsCalendarItem[]> {
    const url = symbol ? `/api/stocks/${symbol}/earnings-calendar` : '/api/financials/calendar';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Bilanço takvimi alınamadı.');
    return res.json();
  },

  async getDividendCalendar(symbol?: string): Promise<import('../types').DividendCalendarItem[]> {
    const url = symbol ? `/api/stocks/${symbol}/dividend-calendar` : '/api/financials/dividends';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Temettü takvimi alınamadı.');
    return res.json();
  },

  async getCompanyNews(symbol: string): Promise<import('../types').CompanyNewsItem[]> {
    const res = await fetch(`/api/stocks/${symbol}/news`);
    if (!res.ok) throw new Error('Şirket haberleri alınamadı.');
    return res.json();
  },

  async getTechnicalSignalAudit(symbol: string, timeframe: string = '1d', period: string = '1y'): Promise<import('../types').TechnicalSignalAudit> {
    const q = new URLSearchParams({ timeframe, period });
    const res = await fetch(`/api/stocks/${symbol}/technical-report?${q.toString()}`);
    if (!res.ok) throw new Error('Teknik sinyal denetim raporu alınamadı.');
    return res.json();
  }
};

