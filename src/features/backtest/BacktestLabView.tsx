import React, { useState } from 'react';
import { BISTStock, BacktestResult, BacktestParams } from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  Play,
  TrendingUp,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ShieldAlert,
  Percent
} from 'lucide-react';

interface BacktestLabViewProps {
  initialSymbol: string;
  stocks: BISTStock[];
  onSelectStock: (symbol: string) => void;
}

export const BacktestLabView: React.FC<BacktestLabViewProps> = ({
  initialSymbol,
  stocks,
  onSelectStock
}) => {
  const [symbol, setSymbol] = useState(initialSymbol || 'THYAO');
  const [strategy, setStrategy] = useState<BacktestParams['strategy']>('EMA_CROSSOVER');
  const [timeframe, setTimeframe] = useState<'1d' | '4h' | '1h'>('1d');
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [commissionPct, setCommissionPct] = useState<number>(0.15);
  const [slippagePct, setSlippagePct] = useState<number>(0.10);
  const [takeProfitPct, setTakeProfitPct] = useState<number>(6.0);
  const [stopLossPct, setStopLossPct] = useState<number>(3.0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunBacktest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.runBacktest({
        symbol,
        strategy,
        timeframe,
        initialCapital,
        commissionPct,
        slippagePct,
        takeProfitPct,
        stopLossPct
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Backtest çalıştırılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  // SVG Equity Curve calculations
  const equityCurve = result?.equityCurve || [];
  const minEquity = equityCurve.length > 0 ? Math.min(...equityCurve.map(e => Math.min(e.portfolioValue, e.benchmarkValue))) : 0;
  const maxEquity = equityCurve.length > 0 ? Math.max(...equityCurve.map(e => Math.max(e.portfolioValue, e.benchmarkValue))) : 100;
  const range = (maxEquity - minEquity) || 1;

  const chartW = 800;
  const chartH = 200;
  const pad = 30;

  const getX = (idx: number) => pad + (idx / (equityCurve.length - 1 || 1)) * (chartW - pad * 2);
  const getY = (val: number) => pad + (1 - (val - minEquity) / range) * (chartH - pad * 2);

  return (
    <div className="space-y-5">
      {/* Configuration Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              BIST Strateji Test Laboratuvarı (Gerçekçi Backtest Motoru)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              İşlem komisyonları (%{commissionPct}) ve kayma (slippage %{slippagePct}) payı dahil deterministik tarihsel simülasyon.
            </p>
          </div>

          <button
            onClick={handleRunBacktest}
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-md transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Hesaplanıyor...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Backtest'i Çalıştır
              </>
            )}
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {/* Stock Symbol */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Hisse Sembolü</label>
            <select
              value={symbol}
              onChange={e => {
                setSymbol(e.target.value);
                onSelectStock(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono font-bold focus:border-emerald-500 focus:outline-none"
            >
              {stocks.map(s => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} {s.lastPrice > 0 ? `(${s.lastPrice} TL)` : `(${s.name})`}
                </option>
              ))}
            </select>
          </div>

          {/* Strategy */}
          <div className="sm:col-span-2">
            <label className="block text-slate-400 font-medium mb-1">Test Edilecek Strateji</label>
            <select
              value={strategy}
              onChange={e => setStrategy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="EMA_CROSSOVER">EMA 20/50 Kesişimi (Golden / Death Cross)</option>
              <option value="RSI_REVERSAL">RSI Aşırı Satım / Tepki (RSI &lt; 30 Al / &gt; 70 Sat)</option>
              <option value="MACD_CROSSOVER">MACD Sinyal Kesişimi (12, 26, 9)</option>
              <option value="BOLLINGER_BREAKOUT">Bollinger Bandı Sıkışma &amp; Kırılım</option>
              <option value="SUPERTREND_MOMENTUM">Parabolic SAR / Trend Takip</option>
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Periyot</label>
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="1d">Günlük (1D)</option>
              <option value="4h">4 Saatlik (4H)</option>
              <option value="1h">1 Saatlik (1H)</option>
            </select>
          </div>

          {/* Capital */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Başlangıç (TL)</label>
            <input
              type="number"
              value={initialCapital}
              onChange={e => setInitialCapital(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Take Profit */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Kâr Al (TP %)</label>
            <input
              type="number"
              step="0.5"
              value={takeProfitPct}
              onChange={e => setTakeProfitPct(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Stop Loss */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Zarar Kes (SL %)</label>
            <input
              type="number"
              step="0.5"
              value={stopLossPct}
              onChange={e => setStopLossPct(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Frictions Notice */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
          <span>Aracı Kurum Komisyonu: %{commissionPct} · Likidite Kayma Payı (Slippage): %{slippagePct}</span>
          <span>BIST 100 Getirisi (Buy &amp; Hold) ile doğrudan kıyaslanır</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded">
          {error}
        </div>
      )}

      {/* Results View */}
      {result ? (
        <div className="space-y-4">
          {/* Key Metric Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Toplam Net Getiri</div>
              <div className={`text-lg font-bold font-mono tabular-nums ${
                result.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {result.totalReturnPct >= 0 ? `+${result.totalReturnPct}%` : `${result.totalReturnPct}%`}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                BIST 100: {result.benchmarkReturnPct >= 0 ? `+${result.benchmarkReturnPct}%` : `${result.benchmarkReturnPct}%`}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Kazanma Oranı</div>
              <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                %{result.winRatePct}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {result.winningTrades} Başarılı / {result.losingTrades} Kayıplı
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Kâr Faktörü (Profit Factor)</div>
              <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                {result.profitFactor}x
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Brüt Kâr / Brüt Zarar
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Maksimum Düşüş (DD)</div>
              <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
                -%{result.maxDrawdownPct}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Zirveden Düşüş
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Son Sermaye</div>
              <div className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                {result.finalCapital.toLocaleString('tr-TR')} TL
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Başlangıç: {result.initialCapital.toLocaleString('tr-TR')} TL
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Toplam Masraf (TL)</div>
              <div className="text-lg font-bold font-mono text-slate-300 tabular-nums">
                {(result.totalCommissionsTL + result.totalSlippageTL).toFixed(0)} TL
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Komisyon: {result.totalCommissionsTL} TL · Kayma: {result.totalSlippageTL} TL
              </div>
            </div>
          </div>

          {/* Equity Curve SVG Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <h3 className="font-bold text-slate-200">Sermaye Eğrisi (Equity Curve) vs BIST 100 Buy &amp; Hold</h3>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" />
                  Strateji Portföy Değeri
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-0.5 bg-slate-500 inline-block" />
                  BIST 100 Karşılaştırma
                </span>
              </div>
            </div>

            <div className="relative w-full overflow-hidden mt-3 bg-slate-950 rounded border border-slate-800">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-44 block">
                {/* Horizontal Baseline */}
                <line x1={pad} y1={getY(result.initialCapital)} x2={chartW - pad} y2={getY(result.initialCapital)} stroke="#334155" strokeDasharray="3 3" />

                {/* Benchmark Curve */}
                <path
                  d={equityCurve.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.benchmarkValue)}`).join(' ')}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />

                {/* Portfolio Equity Curve */}
                <path
                  d={equityCurve.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.portfolioValue)}`).join(' ')}
                  fill="none"
                  stroke={result.totalReturnPct >= 0 ? '#10b981' : '#f43f5e'}
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* Trade Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>İşlem Günlüğü (Trade Log - Toplam {result.trades.length} İşlem)</span>
              <span className="font-mono text-slate-400 text-[11px]">Komisyon &amp; Kayma Düşülmüştür</span>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] text-slate-400 font-medium uppercase border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Giriş Tarihi</th>
                    <th className="py-2.5 px-3 text-right">Giriş Fiyatı</th>
                    <th className="py-2.5 px-3">Çıkış Tarihi</th>
                    <th className="py-2.5 px-3 text-right">Çıkış Fiyatı</th>
                    <th className="py-2.5 px-3 text-right">Lot</th>
                    <th className="py-2.5 px-3 text-right">Net Kâr/Zarar</th>
                    <th className="py-2.5 px-3 text-right">Getiri %</th>
                    <th className="py-2.5 px-3 text-center">Çıkış Nedeni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs tabular-nums">
                  {result.trades.map((t, idx) => {
                    const isWin = t.pnlTL > 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 text-slate-300">{t.entryDate}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{t.entryPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-300">{t.exitDate}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{t.exitPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{t.shares.toLocaleString('tr-TR')}</td>
                        <td className={`py-2 px-3 text-right font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWin ? `+${t.pnlTL.toLocaleString('tr-TR')} TL` : `${t.pnlTL.toLocaleString('tr-TR')} TL`}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWin ? `+${t.returnPct}%` : `${t.returnPct}%`}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans ${
                            t.exitReason === 'TAKE_PROFIT'
                              ? 'bg-emerald-950 text-emerald-300'
                              : t.exitReason === 'STOP_LOSS'
                              ? 'bg-rose-950 text-rose-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {t.exitReason === 'TAKE_PROFIT' ? 'Kâr Al' : t.exitReason === 'STOP_LOSS' ? 'Zarar Kes' : 'Sinyal Çıkışı'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-xs text-slate-400">
          Stratejinizi ve risk parametrelerinizi belirledikten sonra yukarıdaki "Backtest'i Çalıştır" butonuna basarak tarihsel sermaye eğrisini ve detaylı işlem günlüğünü simüle edebilirsiniz.
        </div>
      )}
    </div>
  );
};
