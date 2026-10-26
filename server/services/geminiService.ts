import { GoogleGenAI } from '@google/genai';
import {
  BISTStock,
  TechnicalIndicators,
  SupportResistanceZone,
  ChartPattern,
  MultiTimeframeTrend,
  ScenarioHorizon
} from '../types.js';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

export interface AnalyticalReportRequest {
  stock: BISTStock;
  indicators: TechnicalIndicators;
  zones: SupportResistanceZone[];
  patterns: ChartPattern[];
  trends: MultiTimeframeTrend[];
  horizons: {
    horizon5d: ScenarioHorizon;
    horizon7d: ScenarioHorizon;
    horizon10d: ScenarioHorizon;
  };
}

export interface AnalyticalReportResponse {
  summary: string;
  trendEvaluation: string;
  scenarioAnalysis: string;
  riskAndInvalidationRules: string;
  keyLevelsSummary: string;
  disclaimer: string;
  isAiGenerated: boolean;
}

/**
 * Generate structured analytical narrative report from deterministic financial results.
 * Follows Rule 4: "Yapay zekâ yalnızca hesaplanmış sonuçları açıklamak, karşılaştırmak
 * ve kullanıcının anlayacağı bir rapora dönüştürmek için kullanılacak."
 */
export async function generateAnalyticalReport(data: AnalyticalReportRequest): Promise<AnalyticalReportResponse> {
  const { stock, indicators, zones, patterns, trends, horizons } = data;
  const ai = getAI();

  const disclaimerText = 'YASAL UYARI: Burada yer alan analiz ve modellemeler yatırım danışmanlığı kapsamında olmayıp deterministik teknik göstergeler ve istatistiksel olasılık dağılımlarına dayanmaktadır. Sermaye piyasalarında kesinlik veya getiri garantisi bulunmamaktadır.';

  // If Gemini API is available, request objective professional financial commentary
  if (ai) {
    try {
      const prompt = `Sen Borsa İstanbul (BIST) piyasasında uzman, tarafsız ve risk bilinci yüksek bir Baş Nicel Analistsin.
Aşağıda ${stock.symbol} (${stock.name}) hissesine ait deterministik olarak hesaplanmış gerçek teknik göstergeler, formasyonlar, destek/direnç bölgeleri ve 5/7/10 günlük senaryo olasılıkları verilmiştir.

Verilen matematiksel veriler:
- Son Fiyat: ${stock.lastPrice} TL (Günlük Değişim: %${stock.changePercent})
- Sektör: ${stock.sector} | Endeksler: ${stock.indices.join(', ')}
- F/K: ${stock.pe || '-'} | PD/DD: ${stock.pb || '-'} | Temettü Verimi: %${stock.dividendYield || 0}
- RSI (14): ${indicators.rsi14 || '-'}
- MACD: Çizgi=${indicators.macd?.macdLine}, Sinyal=${indicators.macd?.signalLine}, Histogram=${indicators.macd?.histogram}
- Hareketli Ortalamalar: EMA5=${indicators.ema5}, EMA20=${indicators.ema20}, EMA50=${indicators.ema50}, EMA200=${indicators.ema200}
- EMA Trend Yönleri: EMA5=${indicators.emaTrends?.ema5Trend}, EMA20=${indicators.emaTrends?.ema20Trend}, Ana Trend=${indicators.emaTrends?.mainTrend}, Kesişim=${indicators.emaTrends?.crossover}
- Bollinger Bantları (EMA20 Orta Bant): Üst=${indicators.bollinger?.upper}, Orta=${indicators.bollinger?.middle}, Alt=${indicators.bollinger?.lower}, Bant Genişliği=%${indicators.bollinger?.bandwidth}
- ATR (14): ${indicators.atr14} TL (Günlük ortalama dalga boyu)
- Hacim Oranı (Günlük / 20 EMA Ort.): ${indicators.volumeRatio}x
- Tespit Edilen Formasyonlar: ${patterns.map(p => `${p.turkishName} (${p.status}, Hedef: ${p.targetPrice} TL, Stop: ${p.stopLossPrice} TL)`).join('; ') || 'Önemli formasyon bulunmuyor'}
- Destek & Direnç Bölgeleri: ${zones.map(z => `${z.type === 'SUPPORT' ? 'Destek' : 'Direnç'}: ${z.priceLow}-${z.priceHigh} TL (Güç: ${z.strengthScore}/100)`).join('; ')}
- 5 Günlük Senaryo Olasılıkları: Boğa %${horizons.horizon5d.bullish.probability} (Hedef ${horizons.horizon5d.bullish.targetLow}-${horizons.horizon5d.bullish.targetHigh} TL), Nötr %${horizons.horizon5d.base.probability}, Ayı %${horizons.horizon5d.bearish.probability} (Hedef ${horizons.horizon5d.bearish.targetLow}-${horizons.horizon5d.bearish.targetHigh} TL)
- 10 Günlük %95 Parametrik VaR Risk: -%${horizons.horizon10d.var95LossPct}

GÖREVİN:
Bu deterministik sonuçları yatırımcının kolayca anlayabileceği, abartısız, kesinlik veya al/sat tavsiyesi içermeyen profesyonel bir teknik rapora dönüştür.
Yanıtını JSON formatında şu anahtarlarla ver:
{
  "summary": "2-3 cümlelik genel durum ve hissenin anlık teknik görünümü",
  "trendEvaluation": "Kısa ve orta vadeli hareketli ortalamalar ile momentum göstergelerinin (RSI, MACD) yön analizi",
  "scenarioAnalysis": "5, 7 ve 10 günlük senaryo koridorlarının piyasa koşullarına göre yorumu",
  "riskAndInvalidationRules": "Bu analizi geçersiz kılacak kritik seviyeler ve olası piyasa riskleri",
  "keyLevelsSummary": "Önümüzdeki günlerde izlenmesi gereken en kritik 2 destek ve 2 direnç eşiği"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          summary: parsed.summary || `${stock.symbol} için teknik görünüm dengeli seyretmektedir.`,
          trendEvaluation: parsed.trendEvaluation || '',
          scenarioAnalysis: parsed.scenarioAnalysis || '',
          riskAndInvalidationRules: parsed.riskAndInvalidationRules || '',
          keyLevelsSummary: parsed.keyLevelsSummary || '',
          disclaimer: disclaimerText,
          isAiGenerated: true
        };
      }
    } catch {
      // Fallback to deterministic template below
    }
  }

  // Deterministic rule-based analytical report fallback (EMA Tabanlı)
  const isAboveEma20 = indicators.ema20 ? stock.lastPrice > indicators.ema20 : true;
  const isAboveEma50 = indicators.ema50 ? stock.lastPrice > indicators.ema50 : true;
  const isRsiOverbought = (indicators.rsi14 || 50) > 70;
  const isRsiOversold = (indicators.rsi14 || 50) < 30;

  let trendText = `${stock.symbol} ${stock.lastPrice} TL seviyesinde işlem görmekte olup `;
  if (isAboveEma20 && isAboveEma50) {
    trendText += 'kısa ve orta vadeli EMA20 ve EMA50 ortalamalarının üzerinde güçlü boğa trend yapısını korumaktadır. ';
  } else if (isAboveEma20) {
    trendText += 'EMA20 üzerinde pozitif ara trend bölgesindedir. ';
  } else {
    trendText += 'EMA20 ve EMA50 ortalamalarının altında temkinli/ayı baskılı bölgede hareket etmektedir. ';
  }

  if (isRsiOverbought) {
    trendText += `RSI göstergesi ${indicators.rsi14} değeri ile aşırı alım bölgesinde olup kâr satışları olasılığı göz önünde bulundurulmalıdır.`;
  } else if (isRsiOversold) {
    trendText += `RSI göstergesi ${indicators.rsi14} değeri ile aşırı satım bölgesinde olup tepki alımı potansiyeli taşımaktadır.`;
  } else {
    trendText += `RSI (14) ${indicators.rsi14} seviyesi ile nötr denge aralığındadır.`;
  }

  const nearestSupport = zones.find(z => z.type === 'SUPPORT');
  const nearestResistance = zones.find(z => z.type === 'RESISTANCE');

  return {
    summary: `${stock.symbol} hissesinde son fiyat ${stock.lastPrice} TL, günlük değişim %${stock.changePercent} düzeyindedir. Hacim rasyosu ${indicators.volumeRatio}x olup teknik volatilite kontrollü seyretmektedir.`,
    trendEvaluation: trendText,
    scenarioAnalysis: `Matematiksel modelleme; 5 günlük vadede %${horizons.horizon5d.bullish.probability} boğa, %${horizons.horizon5d.base.probability} dengeli ve %${horizons.horizon5d.bearish.probability} düzeltme olasılığı hesaplamıştır. 5 günlük volatilite koridoru ${horizons.horizon5d.bearish.targetLow} - ${horizons.horizon5d.bullish.targetHigh} TL bandını işaret etmektedir.`,
    riskAndInvalidationRules: `Pozitif senaryoyu geçersiz kılabilecek kritik stop seviyesi ${horizons.horizon5d.bullish.invalidationPrice} TL altı kalıcılıktır. 10 günlük vadede %95 güven aralığında maksimum tahmini dalgalanma riski %${horizons.horizon10d.var95LossPct} seviyesindedir.`,
    keyLevelsSummary: `Kritik Destek: ${nearestSupport ? `${nearestSupport.priceLow} - ${nearestSupport.priceHigh} TL (Güç: ${nearestSupport.strengthScore}/100)` : 'Mevcut veride destek teyidi aranıyor'}. Kritik Direnç: ${nearestResistance ? `${nearestResistance.priceLow} - ${nearestResistance.priceHigh} TL (Güç: ${nearestResistance.strengthScore}/100)` : 'Direnç eşiği hesaplanıyor'}.`,
    disclaimer: disclaimerText,
    isAiGenerated: false
  };
}
