import React, { useState, useEffect } from 'react';
import {
  ScreenerStockResult,
  ScreenerProfile,
  ScreenerScheduleConfig,
  CustomIndicatorRule,
  ExcludedStockReason
} from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  Filter,
  Search,
  Sliders,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Save,
  Play,
  RotateCcw,
  AlertTriangle,
  Server,
  Zap,
  BarChart2,
  Activity,
  Check,
  Eye,
  Settings,
  HelpCircle
} from 'lucide-react';

interface ScreenerViewProps {
  onSelectStock: (symbol: string) => void;
  onAddToWatchlist?: (symbol: string) => void;
}

// All 24 Built-in Conditions defined in FAZ 3
const CONDITION_DEFINITIONS: {
  id: string;
  name: string;
  category: 'EMA' | 'BOLLINGER' | 'SUPPORT_RESISTANCE' | 'PATTERNS' | 'MOMENTUM_VOLUME';
  description: string;
}[] = [
  // 1. Hareketli Ortalamalar (EMA)
  { id: 'EMA5_CROSS_ABOVE_EMA20', name: 'EMA5/EMA20 yukarı kesişimi', category: 'EMA', description: 'Kısa vadeli EMA5 ortalaması EMA20 ortalamasını yukarı keserek boğa dönüş sinyali üretir.' },
  { id: 'EMA5_CROSS_BELOW_EMA20', name: 'EMA5/EMA20 aşağı kesişimi', category: 'EMA', description: 'EMA5 ortalaması EMA20 ortalamasını aşağı keserek düşüş/düzeltme sinyali üretir.' },
  { id: 'PRICE_ABOVE_EMA5', name: 'Fiyatın EMA5 üzerinde olması', category: 'EMA', description: 'Son işlem fiyatı anlık dinamik EMA5 destek seviyesinin üzerindedir.' },
  { id: 'PRICE_ABOVE_EMA20', name: 'Fiyatın EMA20 üzerinde olması', category: 'EMA', description: 'Fiyat ana kısa-orta vadeli EMA20 referans trend çizgisinin üzerindedir.' },

  // 2. Bollinger Bantları
  { id: 'BB_CROSS_ABOVE_MIDDLE', name: 'Bollinger orta bant yukarı kırılımı', category: 'BOLLINGER', description: 'Fiyat EMA20 Bollinger orta bandını yukarı yönlü kırarak pozitif banda geçer.' },
  { id: 'BB_CROSS_BELOW_MIDDLE', name: 'Bollinger orta bant aşağı kırılımı', category: 'BOLLINGER', description: 'Fiyat Bollinger orta bandını aşağı kırarak negatif düzeltme bandına geçer.' },

  // 3. Destek ve Direnç Seviyeleri
  { id: 'SUPPORT_NEAR_1PCT', name: 'Desteğe %1 yakınlık', category: 'SUPPORT_RESISTANCE', description: 'Fiyat tespit edilen en yakın matematiksel destek bölgesine %1 veya daha yakındır.' },
  { id: 'SUPPORT_NEAR_1_5PCT', name: 'Desteğe %1,5 yakınlık', category: 'SUPPORT_RESISTANCE', description: 'Fiyat en yakın destek bölgesine %1.5 veya daha yakındır.' },
  { id: 'SUPPORT_NEAR_2PCT', name: 'Desteğe %2 yakınlık', category: 'SUPPORT_RESISTANCE', description: 'Fiyat en yakın destek bölgesine %2 veya daha yakındır.' },
  { id: 'RESISTANCE_NEAR_2PCT', name: 'Dirence yakınlık', category: 'SUPPORT_RESISTANCE', description: 'Fiyat en yakın direnç bölgesine %2 veya daha yakındır.' },
  { id: 'SUPPORT_BREAK', name: 'Destek kırılımı', category: 'SUPPORT_RESISTANCE', description: 'Fiyat destek seviyesini teyitli kapanışla aşağı yönlü kırmıştır.' },
  { id: 'RESISTANCE_BREAK', name: 'Direnç kırılımı', category: 'SUPPORT_RESISTANCE', description: 'Fiyat direnç seviyesini teyitli kapanışla yukarı yönlü kırarak alan açmıştır.' },

  // 4. Teknik Grafik Formasyonları
  { id: 'PATTERN_ASCENDING_TRIANGLE', name: 'Yükselen üçgen', category: 'PATTERNS', description: 'Yatay direnç ve yükselen dipler ile oluşan boğa kırılım adayı.' },
  { id: 'PATTERN_DESCENDING_TRIANGLE', name: 'Düşen üçgen', category: 'PATTERNS', description: 'Yatay destek ve alçalan tepeler ile oluşan ayı kırılım adayı.' },
  { id: 'PATTERN_SYMMETRICAL_TRIANGLE', name: 'Simetrik üçgen', category: 'PATTERNS', description: 'Daralan fiyat koridoru ve sıkışma sonrası yön arayışı.' },
  { id: 'PATTERN_TOBO', name: 'TOBO (Ters Omuz Baş Omuz)', category: 'PATTERNS', description: 'Düşüş trendi sonunda güvenilir boğa dönüş formasyonu.' },
  { id: 'PATTERN_OBO', name: 'OBO (Omuz Baş Omuz)', category: 'PATTERNS', description: 'Yükseliş trendi tepesinde oluşan ayı dönüş formasyonu.' },
  { id: 'PATTERN_FALLING_WEDGE', name: 'Düşen kama', category: 'PATTERNS', description: 'Daralan eğimli kama yapısından yukarı kırılım potansiyeli.' },
  { id: 'PATTERN_RISING_WEDGE', name: 'Yükselen kama', category: 'PATTERNS', description: 'Daralan eğimli kama yapısından aşağı kırılım riski.' },
  { id: 'PATTERN_CHANNEL_UP', name: 'Yükselen kanal', category: 'PATTERNS', description: 'Düzenli yükselen dip ve tepelerden oluşan yükseliş kanalı.' },
  { id: 'PATTERN_CHANNEL_DOWN', name: 'Düşen kanal', category: 'PATTERNS', description: 'Alçalan dip ve tepelerden oluşan düşüş kanalı.' },

  // 5. Hacim, Zirve ve Göreceli Güç
  { id: 'VOLUME_SURGE', name: 'Hacim artışı', category: 'MOMENTUM_VOLUME', description: 'Günlük işlem hacmi 20 barlık ortalama hacmin en az 1.2 katına ulaşmıştır.' },
  { id: 'NEAR_ALL_TIME_HIGH', name: 'Tarihsel zirveye yakınlık', category: 'MOMENTUM_VOLUME', description: 'Fiyat periyodun gördüğü en yüksek zirve seviyesine %3.5 yakınlıktadır.' },
  { id: 'RELATIVE_STRENGTH_OUTPERFORM', name: 'Endekse göre göreceli güç artışı', category: 'MOMENTUM_VOLUME', description: 'Hissenin son 20 barlık getirisi BIST 100 endeksinin üzerinde pozitif ayrışmaktadır.' }
];

export const ScreenerView: React.FC<ScreenerViewProps> = ({ onSelectStock, onAddToWatchlist }) => {
  // 1. Timeframe selection (1h, 4h, 1d, 1wk, 1mo)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '4h' | '1d' | '1wk' | '1mo'>('1d');

  // 2. Multi-condition selection & AND/OR logic
  const [selectedConditions, setSelectedConditions] = useState<string[]>([
    'EMA5_CROSS_ABOVE_EMA20',
    'PRICE_ABOVE_EMA20'
  ]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');

  // 3. Custom user-defined indicator conditions
  const [customRules, setCustomRules] = useState<CustomIndicatorRule[]>([]);
  const [showCustomRuleModal, setShowCustomRuleModal] = useState<boolean>(false);
  const [newRuleIndicator, setNewRuleIndicator] = useState<CustomIndicatorRule['indicator']>('RSI');
  const [newRuleOperator, setNewRuleOperator] = useState<CustomIndicatorRule['operator']>('<');
  const [newRuleCompareTo, setNewRuleCompareTo] = useState<'VALUE' | 'INDICATOR'>('VALUE');
  const [newRuleTargetValue, setNewRuleTargetValue] = useState<number>(30);
  const [newRuleTargetIndicator, setNewRuleTargetIndicator] = useState<string>('EMA50');
  const [newRuleName, setNewRuleName] = useState<string>('Aşırı Satım RSI');

  // 4. Saved profiles management
  const [profiles, setProfiles] = useState<ScreenerProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('preset-strong-bull');
  const [showSaveProfileModal, setShowSaveProfileModal] = useState<boolean>(false);
  const [profileNameInput, setProfileNameInput] = useState<string>('');
  const [profileDescInput, setProfileDescInput] = useState<string>('');

  // 5. Schedules, Calendar & Server Automation
  const [calendarStatus, setCalendarStatus] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [schedules, setSchedules] = useState<ScreenerScheduleConfig[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [completedCandlesOnly, setCompletedCandlesOnly] = useState<boolean>(false);

  // 6. Universe filters
  const [marketSegmentFilter, setMarketSegmentFilter] = useState<string>('ALL');
  const [indexFilter, setIndexFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(0);

  // 7. Results, Pagination & Excluded Stocks
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<ScreenerStockResult[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [screenedUniverseSize, setScreenedUniverseSize] = useState<number>(0);
  const [totalUniverseSize, setTotalUniverseSize] = useState<number>(0);
  const [lastDataTime, setLastDataTime] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [excludedStocks, setExcludedStocks] = useState<ExcludedStockReason[]>([]);
  const [showExcludedModal, setShowExcludedModal] = useState<boolean>(false);
  const [selectedStockExplanation, setSelectedStockExplanation] = useState<ScreenerStockResult | null>(null);

  // 8. Sorting
  const [sortField, setSortField] = useState<string>('technicalScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Active condition category tab for easy picking
  const [activeCategoryTab, setActiveCategoryTab] = useState<'ALL' | 'EMA' | 'BOLLINGER' | 'SUPPORT_RESISTANCE' | 'PATTERNS' | 'MOMENTUM_VOLUME'>('ALL');

  // Load profiles, calendar and schedules on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [profileList, cal, schedData] = await Promise.all([
        apiClient.getScreenerProfiles().catch(() => []),
        apiClient.getScreenerCalendar().catch(() => null),
        apiClient.getScreenerSchedules().catch(() => null)
      ]);
      if (profileList && profileList.length > 0) {
        setProfiles(profileList);
      }
      setCalendarStatus(cal);
      if (schedData) {
        setServerStatus(schedData.server);
        setSchedules(schedData.schedules || []);
      }
    } catch (err) {
      console.warn('İlk yükleme uyarısı:', err);
    }
  };

  // Run Screener API
  const executeScreen = async (pageToFetch: number = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        timeframe: selectedTimeframe,
        logic: filterLogic,
        conditions: selectedConditions.join(','),
        page: pageToFetch.toString(),
        pageSize: pageSize.toString(),
        sortField,
        sortDir
      };

      if (customRules.length > 0) {
        params.customRules = JSON.stringify(customRules);
      }
      if (marketSegmentFilter !== 'ALL') params.marketSegment = marketSegmentFilter;
      if (indexFilter !== 'ALL') params.index = indexFilter;
      if (sectorFilter !== 'ALL') params.sector = sectorFilter;
      if (searchTerm.trim() !== '') params.search = searchTerm.trim();
      if (minScore > 0) params.minScore = minScore.toString();
      if (completedCandlesOnly) params.completedCandlesOnly = 'true';

      const resp = await apiClient.runScreener(params);

      setResults(resp.results || []);
      setTotalCount(resp.totalCount || 0);
      setScreenedUniverseSize(resp.screenedUniverseSize || 0);
      setTotalUniverseSize(resp.totalUniverseSize || 0);
      setTotalPages(resp.totalPages || 1);
      setCurrentPage(resp.page || 1);
      setLastDataTime(resp.lastDataTime || new Date().toISOString());
      setExcludedStocks(resp.excludedStocks || []);
    } catch (err) {
      console.error('Tarama çalıştırma hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto trigger screen when primary parameters change
  useEffect(() => {
    executeScreen(1);
  }, [
    selectedTimeframe,
    filterLogic,
    selectedConditions,
    customRules,
    marketSegmentFilter,
    indexFilter,
    sectorFilter,
    minScore,
    completedCandlesOnly,
    sortField,
    sortDir,
    pageSize
  ]);

  const toggleCondition = (condId: string) => {
    setSelectedConditions(prev =>
      prev.includes(condId) ? prev.filter(id => id !== condId) : [...prev, condId]
    );
  };

  const selectAllConditionsInCategory = (cat: string) => {
    const catConditions = CONDITION_DEFINITIONS.filter(c => c.category === cat).map(c => c.id);
    setSelectedConditions(prev => {
      const next = new Set([...prev, ...catConditions]);
      return Array.from(next);
    });
  };

  const clearConditions = () => {
    setSelectedConditions([]);
  };

  // Apply a Profile (Preset or Custom)
  const applyProfile = (profile: ScreenerProfile) => {
    setActiveProfileId(profile.id);
    setSelectedTimeframe(profile.timeframe || '1d');
    setFilterLogic(profile.logic || 'AND');
    setSelectedConditions(profile.conditions || []);
    if (profile.customRules) {
      setCustomRules(profile.customRules);
    }
    if (profile.sortField) {
      setSortField(profile.sortField);
    }
    if (profile.sortDir) {
      setSortDir(profile.sortDir);
    }
  };

  // Save Current Setup as New Profile
  const handleSaveProfile = async () => {
    if (!profileNameInput.trim()) return;
    const newProfile: ScreenerProfile = {
      id: `profile-${Date.now()}`,
      name: profileNameInput.trim(),
      description: profileDescInput.trim() || 'Kullanıcı tanımlı tarama profili',
      isPreset: false,
      timeframe: selectedTimeframe,
      logic: filterLogic,
      conditions: selectedConditions,
      customRules,
      sortField,
      sortDir,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const saved = await apiClient.saveScreenerProfile(newProfile);
      setProfiles(prev => [...prev.filter(p => p.id !== saved.id), saved]);
      setActiveProfileId(saved.id);
      setShowSaveProfileModal(false);
      setProfileNameInput('');
      setProfileDescInput('');
    } catch (err) {
      console.error('Profil kaydetme hatası:', err);
    }
  };

  // Duplicate active profile
  const handleDuplicateProfile = () => {
    const current = profiles.find(p => p.id === activeProfileId);
    if (!current) return;
    setProfileNameInput(`${current.name} (Kopya)`);
    setProfileDescInput(current.description || '');
    setShowSaveProfileModal(true);
  };

  // Delete profile
  const handleDeleteProfile = async (id: string) => {
    try {
      await apiClient.deleteScreenerProfile(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
      setActiveProfileId('preset-strong-bull');
    } catch (err: any) {
      alert(err.message || 'Profil silinemedi.');
    }
  };

  // Add Custom Indicator Rule
  const handleAddCustomRule = () => {
    const rule: CustomIndicatorRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim() || `${newRuleIndicator} ${newRuleOperator} ${newRuleCompareTo === 'VALUE' ? newRuleTargetValue : newRuleTargetIndicator}`,
      indicator: newRuleIndicator,
      operator: newRuleOperator,
      compareTo: newRuleCompareTo,
      targetValue: newRuleTargetValue,
      targetIndicator: newRuleTargetIndicator
    };
    setCustomRules(prev => [...prev, rule]);
    setShowCustomRuleModal(false);
  };

  const handleRemoveCustomRule = (id: string) => {
    setCustomRules(prev => prev.filter(r => r.id !== id));
  };

  const filteredConditionDefinitions = activeCategoryTab === 'ALL'
    ? CONDITION_DEFINITIONS
    : CONDITION_DEFINITIONS.filter(c => c.category === activeCategoryTab);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header: Title & BIST Calendar / Server Daemon Live Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                BIST Çok Kriterli Akıllı Hisse Tarayıcısı
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                FAZ 3
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Merkezi BIST pay senedi evrenindeki tüm şirketler için deterministik göstergeler, formasyon kırılımları ve çoklu koşul filtreleme motoru.
            </p>
          </div>

          {/* BIST Calendar and Server Status Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Session Phase Badge */}
            <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
              calendarStatus?.isSessionOpen
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${calendarStatus?.isSessionOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{calendarStatus?.sessionPhase === 'CONTINUOUS_AUCTION' ? 'Sürekli Müzayede (Seans Açık)' : calendarStatus?.sessionPhase === 'CLOSING_SESSION' ? 'Kapanış Seansı' : 'Seans Kapalı'}</span>
            </div>

            {/* BIST Clock */}
            <div className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950 text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{calendarStatus?.localTimeStr || '14:30 (İstanbul)'}</span>
            </div>

            {/* Server Daemon Status */}
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sunucu Otomasyonu ve Zamanlanmış Görevleri Görüntüle"
            >
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sunucu Otomasyonu</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </button>
          </div>
        </div>

        {/* Holiday Banner if today is a public holiday */}
        {calendarStatus?.holidayName && (
          <div className="mt-3 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Bugün Borsa İstanbul Resmi Tatili: <strong>{calendarStatus.holidayName}</strong> (İşlem yapılmamaktadır).</span>
          </div>
        )}
      </div>

      {/* 2. Top Control Panel: Timeframe Selector & Primary Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Timeframe Selector (1h, 4h, 1d, 1wk, 1mo) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Zaman Dilimi:
          </span>
          {[
            { id: '1h', label: '1 Saat' },
            { id: '4h', label: '4 Saat' },
            { id: '1d', label: 'Günlük' },
            { id: '1wk', label: 'Haftalık' },
            { id: '1mo', label: 'Aylık' }
          ].map(tf => (
            <button
              key={tf.id}
              onClick={() => setSelectedTimeframe(tf.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTimeframe === tf.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Scan Modes & Execution Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Completed Candles Toggle (for post-close scan) */}
          <button
            onClick={() => setCompletedCandlesOnly(!completedCandlesOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              completedCandlesOnly
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Seans içi oluşumu devam eden açık mumu hariç tut, yalnızca tamamlanmış barları kullan"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tamamlanmış Mumlar
          </button>

          {/* Manual Run Now Button */}
          <button
            onClick={() => executeScreen(1)}
            disabled={isLoading}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isLoading ? 'Taranıyor...' : 'Taramayı Çalıştır'}
          </button>
        </div>
      </div>

      {/* 3. Profile Management Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Kayıtlı Profil:
          </span>
          <select
            value={activeProfileId}
            onChange={(e) => {
              const prof = profiles.find(p => p.id === e.target.value);
              if (prof) applyProfile(prof);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
          >
            <optgroup label="Önceden Tanımlı Hazır Stratejiler">
              {profiles.filter(p => p.isPreset).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
            {profiles.some(p => !p.isPreset) && (
              <optgroup label="Özel Kullanıcı Profillerim">
                {profiles.filter(p => !p.isPreset).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Profile Action Buttons */}
          <button
            onClick={() => {
              setProfileNameInput('');
              setProfileDescInput('');
              setShowSaveProfileModal(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
            title="Mevcut koşulları yeni profil olarak kaydet"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            Yeni Kaydet
          </button>

          <button
            onClick={handleDuplicateProfile}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
            title="Aktif profili kopyala"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            Kopyala
          </button>

          {activeProfileId && !profiles.find(p => p.id === activeProfileId)?.isPreset && (
            <button
              onClick={() => handleDeleteProfile(activeProfileId)}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs flex items-center gap-1 transition-colors"
              title="Özel profili sil"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Sil
            </button>
          )}
        </div>

        {/* Profile Active Description */}
        <div className="text-xs text-slate-400 italic">
          {profiles.find(p => p.id === activeProfileId)?.description || 'Kullanıcı tanımlı strateji filtreleri.'}
        </div>
      </div>

      {/* 4. Condition Builder & Multi-Select Engine */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        {/* Logic Toggle & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Koşul Birleştirme Mantığı:
            </span>
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setFilterLogic('AND')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  filterLogic === 'AND'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AND (Tümü Sağlansın)
              </button>
              <button
                onClick={() => setFilterLogic('OR')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  filterLogic === 'OR'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                OR (En Az Biri Sağlansın)
              </button>
            </div>
            <span className="text-[11px] text-slate-400 hidden lg:inline">
              {filterLogic === 'AND'
                ? '• Seçtiğiniz tüm koşulları aynı anda sağlayan hisseler listelenir.'
                : '• Seçtiğiniz koşullardan herhangi birini sağlayan hisseler listelenir.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomRuleModal(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Özel İndikatör Koşulu Ekle
            </button>
            <button
              onClick={clearConditions}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>

        {/* Category Tabs for Condition Discovery */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'Tüm Koşullar (24)' },
            { id: 'EMA', label: 'Hareketli Ortalamalar (4)' },
            { id: 'BOLLINGER', label: 'Bollinger Bantları (2)' },
            { id: 'SUPPORT_RESISTANCE', label: 'Destek & Direnç (6)' },
            { id: 'PATTERNS', label: 'Formasyonlar (9)' },
            { id: 'MOMENTUM_VOLUME', label: 'Hacim, Zirve & Güç (3)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeCategoryTab === tab.id
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Condition Chips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredConditionDefinitions.map(cond => {
            const isSelected = selectedConditions.includes(cond.id);
            return (
              <div
                key={cond.id}
                onClick={() => toggleCondition(cond.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'border-slate-700 bg-slate-900'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className={`text-xs font-semibold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {cond.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                    {cond.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Rules List if any exist */}
        {customRules.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Kişiye Özel Tanımlı İndikatör Koşulları ({customRules.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {customRules.map(rule => (
                <div
                  key={rule.id}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2"
                >
                  <span className="font-semibold">{rule.name}:</span>
                  <span className="font-mono text-[11px]">
                    {rule.indicator} {rule.operator} {rule.compareTo === 'VALUE' ? rule.targetValue : rule.targetIndicator}
                  </span>
                  <button
                    onClick={() => handleRemoveCustomRule(rule.id)}
                    className="p-0.5 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Universe Filters: Pazar, Endeks, Sektör, Arama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Pazar Segmenti
            </label>
            <select
              value={marketSegmentFilter}
              onChange={(e) => setMarketSegmentFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Tüm Pazarlar (BIST Pay)</option>
              <option value="YILDIZ_PAZAR">Yıldız Pazar (Büyük/Orta Ölçek)</option>
              <option value="ANA_PAZAR">Ana Pazar</option>
              <option value="ALT_PAZAR">Alt Pazar</option>
              <option value="POIP">PÖİP (Piyasa Öncesi)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Endeks
            </label>
            <select
              value={indexFilter}
              onChange={(e) => setIndexFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Tüm Endeksler</option>
              <option value="BIST 30">BIST 30</option>
              <option value="BIST 50">BIST 50</option>
              <option value="BIST 100">BIST 100</option>
              <option value="BIST TUM">BIST TÜM</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Sektör
            </label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Tüm Sektörler</option>
              <option value="Mali Kuruluşlar">Mali Kuruluşlar / Bankacılık</option>
              <option value="Sanayi">Sanayi ve İmalat</option>
              <option value="Teknoloji">Teknoloji ve Bilişim</option>
              <option value="Ulaştırma">Ulaştırma ve Havacılık</option>
              <option value="Holdingler">Holdingler</option>
              <option value="Enerji">Enerji ve Elektrik</option>
              <option value="Gayrimenkul">Gayrimenkul (GYO)</option>
              <option value="Hizmetler">Hizmetler ve Perakende</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Hisse / Şirket Ara
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ör. THYAO veya Aselsan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Summary Stats Bar & Excluded Stocks Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="text-slate-400">
            Merkezi Evren: <strong className="text-slate-200 font-mono">{totalUniverseSize}</strong> Pay
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">
            Taranan Hisse: <strong className="text-slate-200 font-mono">{screenedUniverseSize}</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400 font-semibold">
            Sağlanan Eşleşme: <strong className="font-mono text-emerald-300">{totalCount}</strong> Hisse
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">
            Periyot: <strong className="text-cyan-400 font-mono uppercase">{selectedTimeframe}</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">
            Son Veri: <strong className="text-slate-300 font-mono">{lastDataTime ? lastDataTime.substring(0, 16) : '-'}</strong>
          </span>
        </div>

        {/* Excluded Stocks Badge / Button */}
        {excludedStocks.length > 0 && (
          <button
            onClick={() => setShowExcludedModal(true)}
            className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Veri Alınamayan Hisseler ({excludedStocks.length})</span>
          </button>
        )}
      </div>

      {/* 6. Results Table with Complete Mandated Columns */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-3">Hisse</th>
                <th className="py-3 px-3">Şirket Adı</th>
                <th
                  onClick={() => {
                    setSortField('lastPrice');
                    setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                  }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
                >
                  Son Fiyat (TL)
                </th>
                <th className="py-3 px-3 text-center">Veri Zamanı</th>
                <th className="py-3 px-3 text-center">Periyot</th>
                <th className="py-3 px-3 text-center">EMA5 Yönü</th>
                <th className="py-3 px-3 text-center">EMA20 Yönü</th>
                <th
                  onClick={() => {
                    setSortField('relativeStrength');
                    setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                  }}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
                >
                  Göreceli Güç
                </th>
                <th className="py-3 px-3 text-center">En Yakın Destek</th>
                <th className="py-3 px-3 text-center">Dirence Uzaklık</th>
                <th className="py-3 px-3 text-center">Formasyon</th>
                <th
                  onClick={() => {
                    setSortField('matchedCount');
                    setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                  }}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
                >
                  Koşullar
                </th>
                <th className="py-3 px-3 text-center">Veri Kalitesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Borsa İstanbul pay evreni taranıyor, lütfen bekleyiniz...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <Info className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                    Seçilen kriterleri sağlayan hisse bulunamadı. Filtreleri genişleterek tekrar deneyiniz.
                  </td>
                </tr>
              ) : (
                results.map((res) => {
                  const stock = res.stock;
                  const isPositive = stock.changePercent >= 0;
                  const relPerfPos = res.relativePerformanceVsXU100 >= 0;

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock.symbol)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Hisse Kodu */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {stock.symbol}
                      </td>

                      {/* Şirket Adı */}
                      <td className="py-3 px-3 text-slate-300 max-w-[170px] truncate" title={stock.name}>
                        {stock.name}
                      </td>

                      {/* Son Doğrulanmış Fiyat */}
                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        <div className="text-slate-100">{stock.lastPrice.toFixed(2)}</div>
                        <div className={`text-[10px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}%{stock.changePercent.toFixed(2)}
                        </div>
                      </td>

                      {/* Veri Zamanı */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                        {res.lastDataTime ? res.lastDataTime.replace('T', ' ').substring(0, 16) : '-'}
                      </td>

                      {/* Seçilen Periyot */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono uppercase font-semibold">
                          {res.timeframe || selectedTimeframe}
                        </span>
                      </td>

                      {/* EMA5 Yönü */}
                      <td className="py-3 px-3 text-center">
                        {res.ema5Direction === 'BULLISH' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" /> Yükseliş
                          </span>
                        ) : res.ema5Direction === 'BEARISH' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                            <TrendingDown className="w-3.5 h-3.5" /> Düşüş
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            Yatay
                          </span>
                        )}
                      </td>

                      {/* EMA20 Yönü */}
                      <td className="py-3 px-3 text-center">
                        {res.ema20Direction === 'BULLISH' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" /> Yükseliş
                          </span>
                        ) : res.ema20Direction === 'BEARISH' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                            <TrendingDown className="w-3.5 h-3.5" /> Düşüş
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            Yatay
                          </span>
                        )}
                      </td>

                      {/* Göreceli Güç vs BIST 100 */}
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          relPerfPos
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {relPerfPos ? '+' : ''}{res.relativePerformanceVsXU100.toFixed(2)}%
                        </span>
                      </td>

                      {/* En Yakın Destek */}
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        {res.nearestSupport ? (
                          <div>
                            <span className="text-slate-200">{res.nearestSupport.price.toFixed(2)} TL</span>
                            <span className="text-[10px] text-emerald-400 block">(%{res.nearestSupport.distancePct.toFixed(1)})</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* En Yakın Dirence Uzaklık */}
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        {res.nearestResistance ? (
                          <div>
                            <span className="text-slate-200">{res.nearestResistance.price.toFixed(2)} TL</span>
                            <span className="text-[10px] text-amber-400 block">(%{res.nearestResistance.distancePct.toFixed(1)})</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Formasyon */}
                      <td className="py-3 px-3 text-center">
                        {res.activePatterns && res.activePatterns.length > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-[10px] font-semibold truncate max-w-[120px] inline-block" title={res.activePatterns.join(', ')}>
                            {res.activePatterns[0]}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Sağlanan Koşul Sayısı & Açıklama */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStockExplanation(res);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-mono font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
                          title="Hangi koşulların sağlandığını detaylı gör"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{res.matchedCount}/{res.totalConditions} Koşul</span>
                        </button>
                      </td>

                      {/* Veri Kalitesi Durumu */}
                      <td className="py-3 px-3 text-center text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-mono">
                          Doğrulandı {res.dataQuality.isDelayed ? '(15 Dk)' : ''}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Page Size Toolbar */}
        <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Sayfa <strong>{currentPage}</strong> / <strong>{totalPages}</strong> ({totalCount} toplam sonuç)
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Sayfa Başına:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(prev => prev - 1);
                  executeScreen(currentPage - 1);
                }
              }}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Önceki
            </button>

            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(prev => prev + 1);
                  executeScreen(currentPage + 1);
                }
              }}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1"
            >
              Sonraki
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Modal: Hangi Koşulların Sağlandığının Detaylı Açıklaması */}
      {selectedStockExplanation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  {selectedStockExplanation.stock.symbol} — Koşul Değerlendirme Raporu
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedStockExplanation.stock.name}</p>
              </div>
              <button
                onClick={() => setSelectedStockExplanation(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Sağlanan Koşullar ({selectedStockExplanation.matchedConditions.length})
                </h4>
                {selectedStockExplanation.matchedConditions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Hiçbir koşul sağlanmadı.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedStockExplanation.matchedConditions.map((exp, idx) => (
                      <li key={idx} className="text-xs text-slate-200 bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2 flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedStockExplanation.unmatchedConditions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-slate-500" />
                    Sağlanmayan Koşullar ({selectedStockExplanation.unmatchedConditions.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedStockExplanation.unmatchedConditions.map((exp, idx) => (
                      <li key={idx} className="text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex items-start gap-2">
                        <span className="text-slate-600 mt-0.5">•</span>
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedStockExplanation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Veri Alınamayan Hisseler ve Nedenleri */}
      {showExcludedModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Veri Alınamayan Hisseler ({excludedStocks.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Merkezi hisse evreninde yer alıp veri sağlayıcıdan akış alınamayan veya askıda olan paylar
                </p>
              </div>
              <button
                onClick={() => setShowExcludedModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60">
              {excludedStocks.map((exc) => (
                <div key={exc.symbol} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-mono font-bold text-slate-200">{exc.symbol} - {exc.name}</div>
                    <div className="text-[11px] text-slate-400">Segment: {exc.segment}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                      {exc.reason}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setShowExcludedModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal: Profil Kaydet */}
      {showSaveProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Save className="w-5 h-5 text-emerald-400" />
              Tarama Profilini Kaydet
            </h3>
            <p className="text-xs text-slate-400">
              Mevcut zaman dilimi, seçili {selectedConditions.length} koşul ve AND/OR mantığı profil olarak saklanır.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Profil Adı</label>
                <input
                  type="text"
                  placeholder="Ör. Hacimli Kırılım Stratejim"
                  value={profileNameInput}
                  onChange={(e) => setProfileNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Açıklama (İsteğe bağlı)</label>
                <textarea
                  placeholder="Profil stratejisi ve amaçları..."
                  value={profileDescInput}
                  onChange={(e) => setProfileDescInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSaveProfileModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={!profileNameInput.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-40"
              >
                Profili Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Modal: Kişiye Özel İndikatör Koşulu Ekle */}
      {showCustomRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Kişiye Özel İndikatör Kuralı Tanımla
            </h3>
            <p className="text-xs text-slate-400">
              Tamamen güvenli, whitelist tabanlı matematiksel koşul oluşturun.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kural Adı</label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gösterge</label>
                  <select
                    value={newRuleIndicator}
                    onChange={(e) => setNewRuleIndicator(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  >
                    <option value="RSI">RSI (14)</option>
                    <option value="EMA5">EMA (5)</option>
                    <option value="EMA20">EMA (20)</option>
                    <option value="EMA50">EMA (50)</option>
                    <option value="EMA200">EMA (200)</option>
                    <option value="VOLUME_RATIO">Hacim Oranı</option>
                    <option value="MACD_HIST">MACD Histogram</option>
                    <option value="ATR">ATR (14)</option>
                    <option value="BOLLINGER_BANDWIDTH">Bollinger Bant Genişliği</option>
                    <option value="LAST_PRICE">Son Fiyat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Operatör</label>
                  <select
                    value={newRuleOperator}
                    onChange={(e) => setNewRuleOperator(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  >
                    <option value=">">Büyüktür (&gt;)</option>
                    <option value=">=">Büyük Eşittir (&gt;=)</option>
                    <option value="<">Küçüktür (&lt;)</option>
                    <option value="<=">Küçük Eşittir (&lt;=)</option>
                    <option value="==">Eşittir (==)</option>
                    <option value="CROSS_ABOVE">Yukarı Kesişim</option>
                    <option value="CROSS_BELOW">Aşağı Kesişim</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Karşılaştırma Türü</label>
                  <select
                    value={newRuleCompareTo}
                    onChange={(e) => setNewRuleCompareTo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  >
                    <option value="VALUE">Sabit Sayısal Değer</option>
                    <option value="INDICATOR">Başka Bir İndikatör</option>
                  </select>
                </div>

                <div>
                  {newRuleCompareTo === 'VALUE' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Değer</label>
                      <input
                        type="number"
                        step="any"
                        value={newRuleTargetValue}
                        onChange={(e) => setNewRuleTargetValue(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Hedef İndikatör</label>
                      <select
                        value={newRuleTargetIndicator}
                        onChange={(e) => setNewRuleTargetIndicator(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      >
                        <option value="EMA5">EMA (5)</option>
                        <option value="EMA20">EMA (20)</option>
                        <option value="EMA50">EMA (50)</option>
                        <option value="EMA200">EMA (200)</option>
                        <option value="LAST_PRICE">Son Fiyat</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCustomRuleModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleAddCustomRule}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Kuralı Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Modal: Sunucu Tarafı Otomasyon ve Zamanlanmış Görevler */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  Sunucu Tarafı Otomatik Görev Yönetimi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tarayıcı kapalı olsa dahi Node.js sunucusunda arka planda bağımsız çalışan otomasyon motoru
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Daemon Health Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">SUNUCU DAEMON</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ÇALIŞIYOR
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">UPTIME (ÇALIŞMA)</span>
                <span className="text-slate-200">{serverStatus?.uptimeSeconds ? `${serverStatus.uptimeSeconds} sn` : 'Aktif'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SEANS KAPANISI</span>
                <span className="text-amber-400 font-semibold">{calendarStatus?.sessionCloseTimeStr || '18:15'}</span>
              </div>
            </div>

            {/* Configured Schedules List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Aktif Otomatik Görevler ({schedules.length}):
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {schedules.map(sched => (
                  <div
                    key={sched.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        {sched.profileName}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {sched.mode === 'POST_CLOSE' ? 'Seans Sonu Kapanış' : sched.mode === 'SCHEDULED_TIME' ? 'Zaman Ayarlı' : 'Koşul Tetiklemeli'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {sched.lastRunSummary || 'Sunucu zamanlayıcısı hazır'}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.runScreenerSchedule(sched.id);
                          alert(`${sched.profileName} sunucu tarafında çalıştırıldı.`);
                        } catch (err: any) {
                          alert(err.message || 'Çalıştırma başarısız.');
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Çalıştır
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
