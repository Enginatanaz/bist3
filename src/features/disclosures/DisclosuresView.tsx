import React, { useState, useEffect } from 'react';
import { KAPDisclosure, BISTStock } from '../../types';
import { apiClient } from '../../services/apiClient';
import { ShieldCheck, Search, Filter, ExternalLink, Calendar } from 'lucide-react';

interface DisclosuresViewProps {
  onSelectStock: (symbol: string) => void;
}

export const DisclosuresView: React.FC<DisclosuresViewProps> = ({ onSelectStock }) => {
  const [disclosures, setDisclosures] = useState<KAPDisclosure[]>([]);
  const [category, setCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    apiClient.getDisclosures()
      .then(res => {
        if (isMounted) setDisclosures(res);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const filtered = disclosures.filter(item => {
    if (category !== 'ALL' && item.category !== category) return false;
    if (search) {
      const q = search.toUpperCase();
      return item.symbol.includes(q) || item.title.toUpperCase().includes(q) || item.companyTitle.toUpperCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Kamuyu Aydınlatma Platformu (KAP) ve Şirket Bildirimleri
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Borsa İstanbul şirketlerinin resmî özel durum açıklamaları, finansal rapor duyuruları ve temettü kararları.
            </p>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['ALL', 'Özel Durum', 'Finansal Rapor', 'Temettü / Sermaye', 'Şirket Kararı'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded transition-colors ${
                  category === cat
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'Tüm Bildirimler' : cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Hisse kodu veya bildirim ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Disclosures Feed List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-xs text-slate-400 font-mono">
            KAP bildirim akışı yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-xs text-slate-500">
            Arama kriterine uygun KAP bildirimi bulunamadı.
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectStock(item.symbol)}
                    className="font-bold text-emerald-400 font-mono hover:underline"
                  >
                    {item.symbol}
                  </button>
                  <span className="text-slate-500">·</span>
                  <span className="font-semibold text-slate-200">{item.companyTitle}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                    {item.category}
                  </span>
                  {item.isImportant && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      Önemli
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.publishDate}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.summary}</p>

              <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                <button
                  onClick={() => onSelectStock(item.symbol)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {item.symbol} Analizine Git
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
