"use client";

import { useState, useEffect } from "react";

interface FinancialStatements {
  ticker?: string;
  companyName?: string;
  currentStockPrice?: number;
  sharesOutstanding?: number;
  sector?: string;
  revenue?: number;
  operatingIncome?: number;
  netIncome?: number;
  totalAssets?: number;
  totalEquity?: number;
  operatingCashFlow?: number;
  freeCashFlow?: number;
}

interface HowardMarksInputs {
  // 기본 정보
  ticker: string;
  companyName: string;
  currentPrice: number;
  sharesOutstanding: number;
  sector: string;

  // Stage 1: Current Earning Power (현재 수익력)
  eps: number;
  roe: number;
  roa: number;
  operatingMargin: number;
  netMargin: number;
  operatingCashFlow: number;
  freeCashFlow: number;

  // 수익의 질과 안정성
  earningsVolatility: number; // EPS 표준편차
  revenueStability: number; // 1-10 점수
  cyclicalityScore: number; // 1-5 점수 (5가 가장 안정)

  // Stage 2: Future Earning Power (미래 수익력)
  revenueGrowth3Y: number; // 3년 평균 성장률
  epsGrowth3Y: number; // 3년 평균 EPS 성장률
  expectedGrowthRate: number; // 향후 예상 성장률

  // 경쟁우위와 지속성
  competitiveAdvantage: 'strong' | 'moderate' | 'weak';
  moatSustainability: 'expanding' | 'stable' | 'eroding';
  industryPosition: 'leader' | 'challenger' | 'follower';
  marketShare: number; // %

  // Stage 3: Market Context & Psychology
  industryPE: number;
  marketPE: number;
  riskFreeRate: number; // %
  marketRiskPremium: number; // %
  companyBeta: number;

  // 재무 안정성
  debtToEquity: number;
  currentRatio: number;
  interestCoverage: number;

  // 2nd Level Thinking 요소
  marketCycle: 'early' | 'mid' | 'late' | 'recession';
  marketSentiment: 'euphoric' | 'optimistic' | 'neutral' | 'pessimistic' | 'panic';
  contrarianism: number; // 1-10 (10이 가장 역방향)
  riskPerception: 'low' | 'moderate' | 'high';
}

interface HowardMarksResult {
  // Stage 1: 현재 수익력 분석
  currentEarningPower: {
    normalizedEPS: number;
    sustainableEPS: number;
    qualityScore: number; // 0-100
    stabilityScore: number; // 0-100
    assessment: string;
  };

  // Stage 2: 미래 수익력 분석
  futureEarningPower: {
    projectedEPS: number; // 5년 후
    growthSustainability: number; // 0-100
    competitiveStrength: number; // 0-100
    futureAssessment: string;
  };

  // Stage 3: 2nd Level Thinking 분석
  secondLevelThinking: {
    marketContextScore: number; // 0-100
    contrarian: boolean;
    asymmetricRisk: boolean; // 상승잠재력 > 하락위험
    cycleOpportunity: number; // 0-10
    sentimentAnalysis: string;
  };

  // Howard Marks 체크리스트
  marksChecklist: {
    understandableBusiness: boolean; // 이해할 수 있는 사업
    sustainableAdvantage: boolean; // 지속가능한 경쟁우위
    consistentEarnings: boolean; // 일관된 수익력
    reasonablePrice: boolean; // 합리적 가격
    contrarianism: boolean; // 역방향 기회
    cyclePosition: boolean; // 유리한 사이클 위치
    riskAdjustedReturn: boolean; // 매력적 위험조정수익률
    score: number; // 7점 만점
  };

  // 통합 밸류에이션
  valuation: {
    intrinsicValue: number;
    fairValuePE: number;
    marginOfSafety: number;
    confidenceInterval: {
      low: number;
      high: number;
    };
  };

  // 최종 평가
  overallScore: number; // 0-100
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Avoid' | 'Strong Avoid';
  confidence: 'High' | 'Medium' | 'Low';
  timeHorizon: string;

  // 투자 논리 (2nd Level Thinking)
  investmentThesis: {
    primaryOpportunity: string;
    keyRisks: string[];
    contrarianism: string;
    cyclicalPosition: string;
    expectedScenarios: {
      bear: { probability: number; return: number };
      base: { probability: number; return: number };
      bull: { probability: number; return: number };
    };
  };
}

interface HowardMarksTabProps {
  financialData?: FinancialStatements;
  onResultUpdate?: (result: HowardMarksResult) => void;
}

export default function HowardMarksAnalyzer({ financialData, onResultUpdate }: HowardMarksTabProps) {
  const [inputs, setInputs] = useState<HowardMarksInputs>({
    ticker: '',
    companyName: '',
    currentPrice: 0,
    sharesOutstanding: 0,
    sector: '',
    eps: 0,
    roe: 0,
    roa: 0,
    operatingMargin: 0,
    netMargin: 0,
    operatingCashFlow: 0,
    freeCashFlow: 0,
    earningsVolatility: 0,
    revenueStability: 5,
    cyclicalityScore: 3,
    revenueGrowth3Y: 0,
    epsGrowth3Y: 0,
    expectedGrowthRate: 0,
    competitiveAdvantage: 'moderate',
    moatSustainability: 'stable',
    industryPosition: 'challenger',
    marketShare: 0,
    industryPE: 20,
    marketPE: 18,
    riskFreeRate: 4.5,
    marketRiskPremium: 6,
    companyBeta: 1.2,
    debtToEquity: 0.5,
    currentRatio: 1.5,
    interestCoverage: 10,
    marketCycle: 'mid',
    marketSentiment: 'neutral',
    contrarianism: 5,
    riskPerception: 'moderate'
  });

  const [result, setResult] = useState<HowardMarksResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 외부에서 전달받은 재무데이터를 inputs에 반영
  useEffect(() => {
    if (financialData) {
      setInputs(prev => ({
        ...prev,
        ticker: financialData.ticker || prev.ticker,
        companyName: financialData.companyName || prev.companyName,
        currentPrice: financialData.currentStockPrice || prev.currentPrice,
        sharesOutstanding: financialData.sharesOutstanding || prev.sharesOutstanding,
        sector: financialData.sector || prev.sector,
        eps: (financialData.netIncome / financialData.sharesOutstanding) || prev.eps,
        operatingCashFlow: financialData.operatingCashFlow || prev.operatingCashFlow,
        freeCashFlow: financialData.freeCashFlow || prev.freeCashFlow,
        operatingMargin: ((financialData.operatingIncome / financialData.revenue) * 100) || prev.operatingMargin,
        netMargin: ((financialData.netIncome / financialData.revenue) * 100) || prev.netMargin,
        roe: ((financialData.netIncome / financialData.totalEquity) * 100) || prev.roe,
        roa: ((financialData.netIncome / financialData.totalAssets) * 100) || prev.roa,
        // 기본값들은 그대로 유지하되 계산 가능한 것들만 업데이트
      }));
    }
  }, [financialData]);

  const handleInputChange = (field: keyof HowardMarksInputs, value: string | number) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadSampleData = () => {
    const sampleInputs: HowardMarksInputs = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      currentPrice: 150,
      sharesOutstanding: 15552000000,
      sector: 'Technology',
      eps: 6.43,
      roe: 160.1,
      roa: 28.3,
      operatingMargin: 29.0,
      netMargin: 25.3,
      operatingCashFlow: 122151000000,
      freeCashFlow: 99584000000,
      earningsVolatility: 0.8,
      revenueStability: 8,
      cyclicalityScore: 4,
      revenueGrowth3Y: 7.8,
      epsGrowth3Y: 9.1,
      expectedGrowthRate: 5,
      competitiveAdvantage: 'strong',
      moatSustainability: 'stable',
      industryPosition: 'leader',
      marketShare: 23.4,
      industryPE: 25,
      marketPE: 20,
      riskFreeRate: 4.5,
      marketRiskPremium: 6,
      companyBeta: 1.2,
      debtToEquity: 1.73,
      currentRatio: 0.88,
      interestCoverage: 39,
      marketCycle: 'late',
      marketSentiment: 'optimistic',
      contrarianism: 7,
      riskPerception: 'moderate'
    };
    setInputs(sampleInputs);
  };

  const analyzeHowardMarks = () => {
    setIsAnalyzing(true);

    try {
      const marketCap = inputs.currentPrice * inputs.sharesOutstanding;
      const pe = inputs.currentPrice / inputs.eps;

      // Stage 1: 현재 수익력 분석
      const cyclicalAdjustment = inputs.cyclicalityScore / 5;
      const normalizedEPS = inputs.eps * cyclicalAdjustment;

      const fcfToNetIncome = (inputs.freeCashFlow / inputs.sharesOutstanding) / inputs.eps;
      const earningsQualityFactor = Math.min(fcfToNetIncome, 1.2);
      const sustainableEPS = normalizedEPS * Math.min(earningsQualityFactor, 1);

      // 수익의 질 점수
      const qualityMetrics = [
        Math.min(inputs.operatingMargin / 20, 1) * 25,
        Math.min(fcfToNetIncome, 1) * 25,
        Math.min(inputs.roe / 15, 1) * 25,
        Math.min(inputs.roa / 10, 1) * 25
      ];
      const qualityScore = qualityMetrics.reduce((sum, score) => sum + score, 0);

      // 안정성 점수
      const stabilityMetrics = [
        (1 - Math.min(inputs.earningsVolatility / inputs.eps, 0.5)) * 30,
        (inputs.revenueStability / 10) * 35,
        (inputs.cyclicalityScore / 5) * 35
      ];
      const stabilityScore = stabilityMetrics.reduce((sum, score) => sum + score, 0);

      let assessment = '';
      if (qualityScore >= 80 && stabilityScore >= 80) {
        assessment = '탁월한 수익력 - 지속가능하고 안정적인 고품질 수익구조';
      } else if (qualityScore >= 65 && stabilityScore >= 65) {
        assessment = '우수한 수익력 - 양호한 수익 품질과 안정성';
      } else if (qualityScore >= 50 && stabilityScore >= 50) {
        assessment = '보통 수익력 - 평균적인 수익 창출 능력';
      } else {
        assessment = '부족한 수익력 - 수익의 질과 안정성에 우려';
      }

      const currentEarningPower = {
        normalizedEPS,
        sustainableEPS,
        qualityScore,
        stabilityScore,
        assessment
      };

      // Stage 2: 미래 수익력 분석
      const competitiveStrengthMap = { strong: 90, moderate: 65, weak: 35 };
      const moatSustainabilityMap = { expanding: 100, stable: 75, eroding: 40 };
      const positionMap = { leader: 85, challenger: 65, follower: 45 };

      const competitiveStrength = (
        competitiveStrengthMap[inputs.competitiveAdvantage] * 0.4 +
        moatSustainabilityMap[inputs.moatSustainability] * 0.35 +
        positionMap[inputs.industryPosition] * 0.25
      );

      const growthSustainability = Math.min(
        (inputs.expectedGrowthRate <= 15 ? 80 : 60) + // 현실적 성장률
        (inputs.revenueGrowth3Y > 0 ? 20 : 0), // 과거 성장 실적
        100
      );

      const compoundGrowthRate = Math.min(inputs.expectedGrowthRate, 12);
      const projectedEPS = sustainableEPS * Math.pow(1 + compoundGrowthRate / 100, 5);

      let futureAssessment = '';
      if (growthSustainability >= 80 && competitiveStrength >= 80) {
        futureAssessment = '강력한 성장 잠재력 - 지속가능한 고품질 성장 가능';
      } else if (growthSustainability >= 65 && competitiveStrength >= 65) {
        futureAssessment = '양호한 성장 잠재력 - 안정적인 성장 기대';
      } else {
        futureAssessment = '제한적 성장 잠재력 - 보통 수준의 성장';
      }

      const futureEarningPower = {
        projectedEPS,
        growthSustainability,
        competitiveStrength,
        futureAssessment
      };

      // Stage 3: 2nd Level Thinking
      const marketSentimentScore = {
        panic: 95, pessimistic: 80, neutral: 50, optimistic: 30, euphoric: 10
      }[inputs.marketSentiment];

      const cycleScore = {
        recession: 90, early: 75, mid: 50, late: 25
      }[inputs.marketCycle];

      const marketContextScore = (marketSentimentScore * 0.6) + (cycleScore * 0.4);

      const contrarian = inputs.contrarianism >= 7 &&
                        (inputs.marketSentiment === 'pessimistic' || inputs.marketSentiment === 'panic') &&
                        (pe < inputs.industryPE * 0.8);

      const upside = Math.max(0, (sustainableEPS * 15 - inputs.currentPrice) / inputs.currentPrice);
      const asymmetricRisk = upside > 0.3 && (inputs.debtToEquity < 1) && (inputs.currentRatio > 1.2);

      const cycleOpportunity = inputs.marketCycle === 'recession' ? 10 :
                              inputs.marketCycle === 'early' ? 8 :
                              inputs.marketCycle === 'mid' ? 5 : 2;

      let sentimentAnalysis = '';
      if (inputs.marketSentiment === 'panic' || inputs.marketSentiment === 'pessimistic') {
        sentimentAnalysis = '시장 공포/비관 시기 - 역방향 투자 기회 존재';
      } else if (inputs.marketSentiment === 'euphoric' || inputs.marketSentiment === 'optimistic') {
        sentimentAnalysis = '시장 낙관/열광 시기 - 주의가 필요한 환경';
      } else {
        sentimentAnalysis = '중립적 시장 환경 - 개별 기업 분석이 중요';
      }

      const secondLevelThinking = {
        marketContextScore,
        contrarian,
        asymmetricRisk,
        cycleOpportunity,
        sentimentAnalysis
      };

      // Howard Marks 체크리스트
      const marksChecklist = {
        understandableBusiness: inputs.revenueStability >= 7 && inputs.cyclicalityScore >= 3,
        sustainableAdvantage: inputs.competitiveAdvantage === 'strong' &&
                             inputs.moatSustainability !== 'eroding' && inputs.roe >= 15,
        consistentEarnings: inputs.earningsVolatility / inputs.eps < 0.3 &&
                           inputs.operatingMargin >= 10,
        reasonablePrice: pe < inputs.industryPE * 1.1 && pe < 25,
        contrarianism: contrarian,
        cyclePosition: cycleOpportunity >= 7,
        riskAdjustedReturn: (inputs.eps / inputs.currentPrice) > (inputs.riskFreeRate / 100) + 0.03,
        score: 0
      };

      marksChecklist.score = Object.values(marksChecklist).filter(v => typeof v === 'boolean' && v).length;

      // 통합 밸류에이션
      const baseMultiple = 15;
      const qualityAdjustment = (qualityScore / 100) * 5;
      const growthAdjustment = (growthSustainability / 100) * 8;
      const stabilityAdjustment = (stabilityScore / 100) * 4;
      const contrarianism = marketContextScore > 70 ? 3 : 0;

      const fairValuePE = baseMultiple + qualityAdjustment + growthAdjustment +
                         stabilityAdjustment + contrarianism;

      const intrinsicValue = sustainableEPS * fairValuePE;
      const marginOfSafety = ((intrinsicValue - inputs.currentPrice) / intrinsicValue) * 100;

      const valuation = {
        intrinsicValue,
        fairValuePE,
        marginOfSafety,
        confidenceInterval: {
          low: intrinsicValue * 0.8,
          high: intrinsicValue * 1.2
        }
      };

      // 최종 평가
      let overallScore = 0;
      overallScore += (qualityScore * 0.25); // 현재 수익력 품질
      overallScore += (stabilityScore * 0.15); // 수익 안정성
      overallScore += (competitiveStrength * 0.2); // 경쟁력
      overallScore += (growthSustainability * 0.15); // 성장 지속성
      overallScore += (marketContextScore * 0.15); // 시장 상황
      overallScore += (marksChecklist.score / 7 * 100 * 0.1); // 체크리스트

      let recommendation: HowardMarksResult['recommendation'] = 'Avoid';
      if (overallScore >= 85 && marginOfSafety > 25 && contrarian) recommendation = 'Strong Buy';
      else if (overallScore >= 75 && marginOfSafety > 15) recommendation = 'Buy';
      else if (overallScore >= 60 && marginOfSafety > 0) recommendation = 'Hold';
      else if (overallScore >= 40) recommendation = 'Avoid';
      else recommendation = 'Strong Avoid';

      const confidence: HowardMarksResult['confidence'] =
        (qualityScore >= 70 && stabilityScore >= 70 && marksChecklist.score >= 5) ? 'High' :
        (qualityScore >= 60 && stabilityScore >= 60 && marksChecklist.score >= 4) ? 'Medium' : 'Low';

      const timeHorizon = contrarian ? '3-7년 (역방향)' :
                         growthSustainability >= 70 ? '5-10년 (성장)' : '3-5년';

      // 투자 논리 (2nd Level Thinking)
      const primaryOpportunity = contrarian ?
        '시장 비관과 저평가가 만나는 역방향 투자 기회' :
        asymmetricRisk ? '제한적 하방 위험 대비 높은 상승 잠재력' :
        competitiveStrength >= 80 ? '지속가능한 경쟁우위 기반 장기 성장' :
        '평균적 위험 수준의 일반적 투자 기회';

      const keyRisks = [];
      if (inputs.debtToEquity > 1) keyRisks.push('높은 부채 수준');
      if (inputs.marketSentiment === 'euphoric') keyRisks.push('시장 과열 위험');
      if (inputs.cyclicalityScore <= 2) keyRisks.push('높은 경기순환성');
      if (pe > inputs.industryPE * 1.5) keyRisks.push('과도한 밸류에이션');

      const contrarianismText = contrarian ?
        '시장의 비관적 심리가 만든 기회 - "남들이 두려워할 때 탐욕스러워라"' :
        '일반적인 시장 환경 - 개별 기업 펀더멘털에 집중';

      const cyclicalPosition = cycleOpportunity >= 8 ?
        '사이클 하단부 - 최적의 진입 시점' :
        cycleOpportunity >= 5 ? '사이클 중간 - 적정한 투자 환경' :
        '사이클 상단부 - 신중한 접근 필요';

      const expectedScenarios = {
        bear: {
          probability: inputs.marketSentiment === 'euphoric' ? 40 : 25,
          return: marginOfSafety > 0 ? Math.max(-20, marginOfSafety * -0.5) : -30
        },
        base: {
          probability: 50,
          return: Math.min(Math.max(marginOfSafety * 0.7, 0), 25)
        },
        bull: {
          probability: inputs.marketSentiment === 'panic' ? 40 : 25,
          return: Math.min(marginOfSafety > 0 ? marginOfSafety * 1.2 : 10, 50)
        }
      };

      const investmentThesis = {
        primaryOpportunity,
        keyRisks,
        contrarianism: contrarianismText,
        cyclicalPosition,
        expectedScenarios
      };

      const analysisResult: HowardMarksResult = {
        currentEarningPower,
        futureEarningPower,
        secondLevelThinking,
        marksChecklist,
        valuation,
        overallScore,
        recommendation,
        confidence,
        timeHorizon,
        investmentThesis
      };

      setResult(analysisResult);
      onResultUpdate?.(analysisResult);

    } catch (error) {
      console.error('Howard Marks 분석 오류:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">
          🧠 하워드 막스 2nd Level Thinking 방법론
        </h2>
        <p className="text-purple-700 mb-4">
          "1차원적 사고를 넘어선 시장 심리와 사이클을 활용한 역방향 투자"
        </p>
        <div className="bg-white p-4 rounded-lg">
          <div className="font-semibold text-purple-800">핵심 철학:</div>
          <div className="text-purple-700 mt-2">
            <strong>1단계:</strong> 현재 수익력의 질과 지속성 평가<br />
            <strong>2단계:</strong> 미래 수익력과 경쟁우위 분석<br />
            <strong>3단계:</strong> 시장 심리와 사이클을 고려한 2nd Level Thinking<br />
            <span className="text-sm italic">"시장이 무엇을 할지가 아니라, 다른 투자자들이 무엇을 생각할지를 생각하라"</span>
          </div>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 기본 정보 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">기본 정보</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">티커</label>
                <input
                  type="text"
                  placeholder="AAPL"
                  value={inputs.ticker}
                  onChange={(e) => handleInputChange('ticker', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                <input
                  type="text"
                  placeholder="Apple Inc."
                  value={inputs.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">현재 주가 ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.currentPrice}
                  onChange={(e) => handleInputChange('currentPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EPS ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.eps}
                  onChange={(e) => handleInputChange('eps', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">섹터</label>
                <input
                  type="text"
                  placeholder="Technology"
                  value={inputs.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage 1: 현재 수익력 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Stage 1: 현재 수익력</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ROE (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.roe}
                  onChange={(e) => handleInputChange('roe', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ROA (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.roa}
                  onChange={(e) => handleInputChange('roa', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">영업이익률 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.operatingMargin}
                  onChange={(e) => handleInputChange('operatingMargin', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">순이익률 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.netMargin}
                  onChange={(e) => handleInputChange('netMargin', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EPS 변동성</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="표준편차"
                  value={inputs.earningsVolatility}
                  onChange={(e) => handleInputChange('earningsVolatility', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매출 안정성 (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={inputs.revenueStability}
                  onChange={(e) => handleInputChange('revenueStability', parseFloat(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">경기순환성 (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={inputs.cyclicalityScore}
                  onChange={(e) => handleInputChange('cyclicalityScore', parseFloat(e.target.value) || 3)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage 2: 미래 수익력 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Stage 2: 미래 수익력</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매출성장률 3Y (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.revenueGrowth3Y}
                  onChange={(e) => handleInputChange('revenueGrowth3Y', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EPS성장률 3Y (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.epsGrowth3Y}
                  onChange={(e) => handleInputChange('epsGrowth3Y', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예상 성장률 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.expectedGrowthRate}
                  onChange={(e) => handleInputChange('expectedGrowthRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">경쟁우위</label>
                <select
                  value={inputs.competitiveAdvantage}
                  onChange={(e) => handleInputChange('competitiveAdvantage', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                >
                  <option value="weak">약함</option>
                  <option value="moderate">보통</option>
                  <option value="strong">강함</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">해자 지속성</label>
                <select
                  value={inputs.moatSustainability}
                  onChange={(e) => handleInputChange('moatSustainability', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                >
                  <option value="eroding">약화</option>
                  <option value="stable">안정</option>
                  <option value="expanding">확장</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">업계 위치</label>
                <select
                  value={inputs.industryPosition}
                  onChange={(e) => handleInputChange('industryPosition', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                >
                  <option value="follower">팔로워</option>
                  <option value="challenger">도전자</option>
                  <option value="leader">리더</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시장점유율 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.marketShare}
                  onChange={(e) => handleInputChange('marketShare', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stage 3: 시장 상황 & 2nd Level Thinking */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Stage 3: 시장 심리 & 사이클</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">업계 PER</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.industryPE}
                  onChange={(e) => handleInputChange('industryPE', parseFloat(e.target.value) || 20)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시장 PER</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.marketPE}
                  onChange={(e) => handleInputChange('marketPE', parseFloat(e.target.value) || 18)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시장 사이클</label>
                <select
                  value={inputs.marketCycle}
                  onChange={(e) => handleInputChange('marketCycle', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                >
                  <option value="recession">경기침체</option>
                  <option value="early">초기 회복</option>
                  <option value="mid">중기 확장</option>
                  <option value="late">후기 확장</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시장 심리</label>
                <select
                  value={inputs.marketSentiment}
                  onChange={(e) => handleInputChange('marketSentiment', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                >
                  <option value="panic">공포</option>
                  <option value="pessimistic">비관</option>
                  <option value="neutral">중립</option>
                  <option value="optimistic">낙관</option>
                  <option value="euphoric">열광</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">역방향 지수 (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={inputs.contrarianism}
                  onChange={(e) => handleInputChange('contrarianism', parseFloat(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">위험 인식</label>
                <select
                  value={inputs.riskPerception}
                  onChange={(e) => handleInputChange('riskPerception', e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                >
                  <option value="low">낮음</option>
                  <option value="moderate">보통</option>
                  <option value="high">높음</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 재무 안정성 */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">재무 안정성</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부채비율</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.debtToEquity}
                  onChange={(e) => handleInputChange('debtToEquity', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유동비율</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.currentRatio}
                  onChange={(e) => handleInputChange('currentRatio', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이자보상배수</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.interestCoverage}
                  onChange={(e) => handleInputChange('interestCoverage', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">영업현금흐름 ($)</label>
                <input
                  type="number"
                  value={inputs.operatingCashFlow}
                  onChange={(e) => handleInputChange('operatingCashFlow', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">자유현금흐름 ($)</label>
                <input
                  type="number"
                  value={inputs.freeCashFlow}
                  onChange={(e) => handleInputChange('freeCashFlow', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={loadSampleData}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          📝 Apple 샘플 데이터
        </button>
        <button
          onClick={analyzeHowardMarks}
          disabled={isAnalyzing || !inputs.ticker}
          className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? '🔄 분석 중...' : '🚀 막스 분석 시작'}
        </button>
      </div>

      {/* 분석 결과 */}
      {result && (
        <div className="space-y-6">
          {/* 종합 결과 */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-8 rounded-lg border-2 border-purple-300">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-purple-800 mb-2">
                🧠 {inputs.ticker} 하워드 막스 분석 결과
              </h3>
              <div className="text-5xl font-bold mb-4">
                <span className={`
                  ${result.overallScore >= 85 ? 'text-green-600' :
                    result.overallScore >= 70 ? 'text-blue-600' :
                    result.overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'}
                `}>
                  {result.overallScore.toFixed(0)}점
                </span>
              </div>
              <div className={`text-2xl font-bold mb-2 ${
                result.recommendation === 'Strong Buy' ? 'text-green-600' :
                result.recommendation === 'Buy' ? 'text-blue-600' :
                result.recommendation === 'Hold' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {result.recommendation === 'Strong Buy' ? '🚀 강력 매수' :
                 result.recommendation === 'Buy' ? '✅ 매수' :
                 result.recommendation === 'Hold' ? '⏸️ 보유' : '❌ 회피'}
              </div>
              <div className="text-lg text-purple-700 font-medium">
                투자 기간: {result.timeHorizon}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ${result.valuation.intrinsicValue.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">내재가치</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className={`text-2xl font-bold ${
                  result.valuation.marginOfSafety > 20 ? 'text-green-600' :
                  result.valuation.marginOfSafety > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {result.valuation.marginOfSafety.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">안전 마진</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className={`text-2xl font-bold ${
                  result.secondLevelThinking.contrarian ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {result.secondLevelThinking.contrarian ? '✅ 역방향' : '❌ 순방향'}
                </div>
                <div className="text-sm text-gray-600">투자 기회</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {result.marksChecklist.score}/7
                </div>
                <div className="text-sm text-gray-600">막스 체크리스트</div>
              </div>
            </div>
          </div>

          {/* 3단계 분석 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 현재 수익력 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4">📊 Stage 1: 현재 수익력</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-purple-50 rounded">
                    <span className="text-gray-600">정상화 EPS:</span>
                    <div className="font-bold text-purple-600 text-lg">
                      ${result.currentEarningPower.normalizedEPS.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <span className="text-gray-600">지속가능 EPS:</span>
                    <div className="font-bold text-purple-600 text-lg">
                      ${result.currentEarningPower.sustainableEPS.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">수익 품질:</span>
                    <div className={`font-bold text-lg ${
                      result.currentEarningPower.qualityScore >= 80 ? 'text-green-600' :
                      result.currentEarningPower.qualityScore >= 60 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {result.currentEarningPower.qualityScore.toFixed(0)}/100
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">안정성:</span>
                    <div className={`font-bold text-lg ${
                      result.currentEarningPower.stabilityScore >= 80 ? 'text-green-600' :
                      result.currentEarningPower.stabilityScore >= 60 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {result.currentEarningPower.stabilityScore.toFixed(0)}/100
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-gray-800">
                    <strong>평가:</strong> {result.currentEarningPower.assessment}
                  </div>
                </div>
              </div>
            </div>

            {/* 미래 수익력 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-4">🔮 Stage 2: 미래 수익력</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded">
                    <span className="text-gray-600">5년 후 EPS:</span>
                    <div className="font-bold text-blue-600 text-lg">
                      ${result.futureEarningPower.projectedEPS.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <span className="text-gray-600">성장 지속성:</span>
                    <div className={`font-bold text-lg ${
                      result.futureEarningPower.growthSustainability >= 80 ? 'text-green-600' :
                      result.futureEarningPower.growthSustainability >= 60 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {result.futureEarningPower.growthSustainability.toFixed(0)}/100
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">경쟁력:</span>
                    <div className={`font-bold text-lg ${
                      result.futureEarningPower.competitiveStrength >= 80 ? 'text-green-600' :
                      result.futureEarningPower.competitiveStrength >= 60 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {result.futureEarningPower.competitiveStrength.toFixed(0)}/100
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-gray-800">
                    <strong>평가:</strong> {result.futureEarningPower.futureAssessment}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2nd Level Thinking */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-xl font-bold text-gray-800 mb-4">🧠 Stage 3: 2nd Level Thinking</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-lg font-bold text-purple-600">
                  {result.secondLevelThinking.marketContextScore.toFixed(0)}/100
                </div>
                <div className="text-sm text-gray-600">시장 상황 점수</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className={`text-lg font-bold ${result.secondLevelThinking.contrarian ? 'text-green-600' : 'text-gray-600'}`}>
                  {result.secondLevelThinking.contrarian ? '✅ 역방향 기회' : '❌ 일반 상황'}
                </div>
                <div className="text-sm text-gray-600">투자 기회</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className={`text-lg font-bold ${result.secondLevelThinking.asymmetricRisk ? 'text-green-600' : 'text-gray-600'}`}>
                  {result.secondLevelThinking.asymmetricRisk ? '✅ 비대칭' : '❌ 대칭적'}
                </div>
                <div className="text-sm text-gray-600">리스크/리턴</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-gray-800">
                <strong>시장 심리 분석:</strong> {result.secondLevelThinking.sentimentAnalysis}
              </div>
            </div>
          </div>

          {/* Howard Marks 체크리스트 */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-xl font-bold text-gray-800 mb-4">📋 하워드 막스 체크리스트</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'understandableBusiness', label: '이해할 수 있는 사업', desc: '안정적이고 예측 가능' },
                { key: 'sustainableAdvantage', label: '지속가능한 경쟁우위', desc: '강력한 해자 보유' },
                { key: 'consistentEarnings', label: '일관된 수익력', desc: '변동성 낮은 수익' },
                { key: 'reasonablePrice', label: '합리적 가격', desc: '업계 대비 적정 수준' },
                { key: 'contrarianism', label: '역방향 기회', desc: '시장 비관 시 매수' },
                { key: 'cyclePosition', label: '유리한 사이클 위치', desc: '사이클 하단부 기회' },
                { key: 'riskAdjustedReturn', label: '매력적 위험조정수익률', desc: '무위험수익률 + 3% 이상' }
              ].map((item) => (
                <div key={item.key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                  <span className={`text-2xl ${result.marksChecklist[item.key as keyof typeof result.marksChecklist] ? 'text-green-600' : 'text-red-600'}`}>
                    {result.marksChecklist[item.key as keyof typeof result.marksChecklist] ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 투자 논리 & 시나리오 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
            <h4 className="font-bold text-purple-800 mb-4">💡 2nd Level Thinking 투자 논리</h4>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg">
                <div className="font-semibold text-purple-800 mb-2">핵심 기회:</div>
                <div className="text-purple-700">{result.investmentThesis.primaryOpportunity}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg">
                  <div className="font-semibold text-blue-800 mb-2">역방향 관점:</div>
                  <div className="text-blue-700 text-sm">{result.investmentThesis.contrarianism}</div>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <div className="font-semibold text-green-800 mb-2">사이클 위치:</div>
                  <div className="text-green-700 text-sm">{result.investmentThesis.cyclicalPosition}</div>
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <div className="font-semibold text-gray-800 mb-3">예상 시나리오:</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="font-bold text-red-600">약세 ({result.investmentThesis.expectedScenarios.bear.probability}%)</div>
                    <div className="text-red-700">{result.investmentThesis.expectedScenarios.bear.return.toFixed(0)}%</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="font-bold text-blue-600">기본 ({result.investmentThesis.expectedScenarios.base.probability}%)</div>
                    <div className="text-blue-700">+{result.investmentThesis.expectedScenarios.base.return.toFixed(0)}%</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="font-bold text-green-600">강세 ({result.investmentThesis.expectedScenarios.bull.probability}%)</div>
                    <div className="text-green-700">+{result.investmentThesis.expectedScenarios.bull.return.toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 주요 위험요소 */}
          {result.investmentThesis.keyRisks.length > 0 && (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h4 className="font-bold text-red-800 mb-3">⚠️ 주요 위험요소</h4>
              <div className="space-y-2">
                {result.investmentThesis.keyRisks.map((risk, idx) => (
                  <div key={idx} className="text-sm text-red-700">• {risk}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 면책조항 */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          <strong>🎓 하워드 막스 방법론:</strong> 이 분석은 "투자에서 가장 중요한 것"의 2nd Level Thinking 개념과
          시장 사이클 분석을 기반으로 합니다. 실제 투자 시에는 시장 심리와 군중 심리에 대한 추가적인
          정성적 판단이 필요합니다.
        </div>
      </div>
    </div>
  );
}
