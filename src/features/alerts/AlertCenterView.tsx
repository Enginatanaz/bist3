import React, { useState } from 'react';
import { BISTStock } from '../../types';
import { Bell, Plus, Trash2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AlertItem {
  id: string;
  symbol: string;
  type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT' | 'MACD_CROSS';
  targetValue?: number;
  createdAt: string;
  isTriggered: boolean;
  notes?: string;
}

interface AlertCenterViewProps {
  stocks: BISTStock[];
  onSelectStock: (symbol: string) => void;
}

export const AlertCenterView: React.FC<AlertCenterViewProps> = ({
  stocks,
  onSelectStock
}) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'al_1',
      symbol: 'THYAO',
      type: 'PRICE_ABOVE',
      targetValue: 320.0,
      createdAt: 'Bugün 11:20',
      isTriggered: false,
      notes: '320 TL direnç kırılımı alarmlı'
    },
    {
      id: 'al_2',
      symbol: 'GARAN',
      type: 'PRICE_ABOVE',
      targetValue: 115.0,
      createdAt: 'Bugün 14:10',
      isTriggered: true,
      notes: '115 TL psikolojik direnç aşıldı'
    },
    {
      id: 'al_3',
      symbol: 'ASELS',
      type: 'RSI_OVERSOLD',
      targetValue: 30.0,
      createdAt: 'Dün 16:45',
      isTriggered: false,
      notes: 'RSI 30 altı aşırı satım kontrolü'
    }
  ]);

  const [symbol, setSymbol] = useState(stocks[0]?.symbol || 'THYAO');
  const [type, setType] = useState<AlertItem['type']>('PRICE_ABOVE');
  const [targetValue, setTargetValue] = useState<number>(315);
  const [notes, setNotes] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: AlertItem = {
      id: `al_${Date.now()}`,
      symbol,
      type,
      targetValue: type === 'PRICE_ABOVE' || type === 'PRICE_BELOW' ? targetValue : undefined,
      createdAt: 'Şimdi',
      isTriggered: false,
      notes: notes || `${symbol} için ${type} alarmı`
    };
    setAlerts([newAlert, ...alerts]);
    setIsAdding(false);
    setNotes('');
  };

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const triggerMockAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, isTriggered: true } : a));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            Fiyat ve Teknik İndikatör Alarm Merkezi
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            BIST pay senetleri kritik destek/direnç seviyelerine, RSI aşırı bölgelerine veya MACD kesişimlerine ulaştığında bildirim alın.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-md transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Yeni Alarm Kur
        </button>
      </div>

      {/* Add Alert Form */}
      {isAdding && (
        <form onSubmit={handleAddAlert} className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3 text-xs">
          <div className="font-bold text-slate-200 text-sm">Yeni Alarm Parametreleri</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Hisse</label>
              <select
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono font-bold focus:border-emerald-500 focus:outline-none"
              >
                {stocks.map(s => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} - {s.lastPrice > 0 ? `${s.lastPrice} TL` : s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Alarm Türü</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="PRICE_ABOVE">Fiyat Seviyesi Üzerine Çıkınca</option>
                <option value="PRICE_BELOW">Fiyat Seviyesi Altına İnce</option>
                <option value="RSI_OVERSOLD">RSI (14) &lt; 30 (Aşırı Satım)</option>
                <option value="RSI_OVERBOUGHT">RSI (14) &gt; 70 (Aşırı Alım)</option>
                <option value="MACD_CROSS">MACD Pozitif Kesişim</option>
              </select>
            </div>

            {(type === 'PRICE_ABOVE' || type === 'PRICE_BELOW') && (
              <div>
                <label className="block text-slate-400 font-medium mb-1">Hedef Fiyat (TL)</label>
                <input
                  type="number"
                  step="0.05"
                  value={targetValue}
                  onChange={e => setTargetValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-medium mb-1">Özel Not (Opsiyonel)</label>
              <input
                type="text"
                placeholder="Örn: Fibonacci direnci"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200 border border-slate-700 rounded transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded transition-colors"
            >
              Alarmı Kaydet
            </button>
          </div>
        </form>
      )}

      {/* Alerts List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-[11px] text-slate-400 font-medium uppercase border-b border-slate-800">
            <tr>
              <th className="py-3 px-3.5">Hisse</th>
              <th className="py-3 px-3.5">Alarm Kuralı</th>
              <th className="py-3 px-3.5">Hedef Değer</th>
              <th className="py-3 px-3.5">Not</th>
              <th className="py-3 px-3.5 text-center">Durum</th>
              <th className="py-3 px-3.5 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs tabular-nums">
            {alerts.map(a => {
              const ruleText = a.type === 'PRICE_ABOVE'
                ? 'Fiyat Üzerine Çıkınca'
                : a.type === 'PRICE_BELOW'
                ? 'Fiyat Altına İnce'
                : a.type === 'RSI_OVERSOLD'
                ? 'RSI < 30 Aşırı Satım'
                : a.type === 'RSI_OVERBOUGHT'
                ? 'RSI > 70 Aşırı Alım'
                : 'MACD Pozitif Kesişim';

              return (
                <tr key={a.id} className="hover:bg-slate-800/40">
                  <td
                    onClick={() => onSelectStock(a.symbol)}
                    className="py-2.5 px-3.5 font-bold text-slate-100 hover:text-emerald-400 cursor-pointer"
                  >
                    {a.symbol}
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-300">{ruleText}</td>
                  <td className="py-2.5 px-3.5 text-slate-200">
                    {a.targetValue ? `${a.targetValue} TL` : '-'}
                  </td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-400">{a.notes || '-'}</td>
                  <td className="py-2.5 px-3.5 text-center font-sans">
                    {a.isTriggered ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        Tetiklendi
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-900">
                        Aktif İzleniyor
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-right space-x-2">
                    {!a.isTriggered && (
                      <button
                        onClick={() => triggerMockAlert(a.id)}
                        className="text-[10px] text-slate-400 hover:text-emerald-400 border border-slate-800 hover:border-slate-700 px-2 py-0.5 rounded"
                      >
                        Test Tetikle
                      </button>
                    )}
                    <button
                      onClick={() => removeAlert(a.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
