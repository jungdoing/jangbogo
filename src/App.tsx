import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, 
  MapPin, 
  Route, 
  Sparkles, 
  Clock, 
  Car, 
  Timer, 
  ClipboardList, 
  Lightbulb, 
  Gift, 
  Camera, 
  ShieldCheck, 
  Store,
  RefreshCw,
  Database,
  Download,
  AlertTriangle,
  ExternalLink,
  Edit,
  Save,
  CheckCircle2,
  Trash2,
  Link,
  Check
} from 'lucide-react';
import { 
  loadPublicGoogleSheet, 
  extractSpreadsheetId, 
  generateCSVTemplate, 
  DEFAULT_ITEMS_DATA,
  SheetPricingItem 
} from './lib/googleSheets';

const VEHICLES = [
  { id: 'compact', label: '경차', rate: 150 },
  { id: 'sedan', label: '중형세단', rate: 250 },
  { id: 'suv', label: '대형 SUV', rate: 350 }
];

const TIME_VALUES = [
  { id: 'day', label: '평일 한산한 낮', rate: 5000 },
  { id: 'rush', label: '퇴근/주말 정체', rate: 8000 }
];

const EMART_ROUND_TRIP_KM = 15.2;
const EMART_ROUND_TRIP_MINS = 50;

export default function App() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState('compact');
  const [timeVal, setTimeVal] = useState('day');

  // Dynamic pricing items state
  const [items, setItems] = useState<SheetPricingItem[]>(() => {
    const saved = localStorage.getItem('jangbogo_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => {
          let updated = { ...item };
          if (updated.id === 'egg' && updated.name === '계란 대란 35구') {
            updated.name = '계란 대란 30구';
          }
          if (updated.id === 'milk' && updated.name === '우유 가성비 1L') {
            updated.name = '우유 1L';
          }
          return updated;
        });
      } catch (e) {
        return DEFAULT_ITEMS_DATA;
      }
    }
    return DEFAULT_ITEMS_DATA;
  });

  const [spreadsheetUrl, setSpreadsheetUrl] = useState(() => {
    return localStorage.getItem('jangbogo_sheets_url') || '';
  });

  const [lastFetched, setLastFetched] = useState<string>(() => {
    return localStorage.getItem('jangbogo_last_fetched') || '수동 로컬 가격';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // State to track if the uploaded logo.png exists and loads properly
  const [logoError, setLogoError] = useState(false);

  // Tracks the last manual price modification date/time
  const [lastModifiedTime, setLastModifiedTime] = useState<string>(() => {
    return localStorage.getItem('jangbogo_last_modified') || '';
  });

  // States for in-app inline price editor
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPrices, setEditPrices] = useState({ emart: 0, good: 0, olle: 0, joggot: 0, martro: 0 });

  // Admin access state control (prevents visitor tampering)
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('jangbogo_admin_auth') === 'true';
  });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminLogin = () => {
    // Basic password '0402' for simplicity. User can easily use it
    if (adminPassword === '0402') {
      setIsAdmin(true);
      localStorage.setItem('jangbogo_admin_auth', 'true');
      setShowAdminModal(false);
      setAdminPassword('');
      setAdminError('');
    } else {
      setAdminError('비밀번호가 올바르지 않습니다. 관리자 비밀번호를 확인해 주세요.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsEditingMode(false);
    localStorage.removeItem('jangbogo_admin_auth');
  };

  // Save to localStorage whenever items state changes
  useEffect(() => {
    localStorage.setItem('jangbogo_items', JSON.stringify(items));
  }, [items]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  };

  const handleLoadSheet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!spreadsheetUrl) {
      setErrorMsg('구글 스프레드시트 주소(URL) 또는 ID를 입력해 주세요.');
      return;
    }

    const id = extractSpreadsheetId(spreadsheetUrl);
    if (!id) {
      setErrorMsg('올바른 구글 스프레드시트 URL 형식이 아닙니다.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await loadPublicGoogleSheet(id);
      setItems(data);
      const nowStr = new Date().toLocaleString('ko-KR', { 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }) + ' 구글시트동기화';
      setLastFetched(nowStr);
      localStorage.setItem('jangbogo_sheets_url', spreadsheetUrl);
      localStorage.setItem('jangbogo_last_fetched', nowStr);
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || '가져오기 실패. 공유 설정을 다시 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const csvContent = generateCSVTemplate(items);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `jangbogo_database_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetToDefault = () => {
    if (window.confirm('기본 가격 데이터로 초기화하시겠습니까? (수정하신 금액이 사라집니다.)')) {
      setItems(DEFAULT_ITEMS_DATA);
      setLastFetched('기본 가격 데이터');
      localStorage.removeItem('jangbogo_last_fetched');
    }
  };

  const startEditing = (item: SheetPricingItem) => {
    setEditingItemId(item.id);
    setEditPrices({
      emart: item.emart,
      good: item.good,
      olle: item.olle,
      joggot: item.joggot,
      martro: item.martro
    });
  };

  const cancelEditing = () => {
    setEditingItemId(null);
  };

  const saveEditedItem = (id: string) => {
    const nowStr = new Date().toLocaleString('ko-KR', { 
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const nowFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          emart: editPrices.emart,
          good: editPrices.good,
          olle: editPrices.olle,
          joggot: editPrices.joggot,
          martro: editPrices.martro,
          subName: `대형마트 ${editPrices.emart.toLocaleString()}원`,
          lastUpdated: nowStr
        };
      }
      return item;
    }));
    
    setLastFetched(nowStr + ' 수동수정');
    setLastModifiedTime(nowFormatted);
    localStorage.setItem('jangbogo_last_modified', nowFormatted);
    setEditingItemId(null);
  };

  // 계산 연산 로직
  const getCalculatedPrices = () => {
    if (selectedItems.length === 0) {
      return {
        emartRaw: 0,
        emartTotal: 0,
        localGood: 0,
        localOlle: 0,
        localJoggot: 0,
        localMartro: 0,
        opportunityCost: 0,
        bestStore: { name: '조끄뜨레마트', total: 0, dist: '도보 3분' },
        splitLowestSum: 0
      };
    }

    let emartRaw = 0;
    let localGood = 0;
    let localOlle = 0;
    let localJoggot = 0;
    let localMartro = 0;
    let splitLowestSum = 0;

    selectedItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        emartRaw += item.emart;
        localGood += item.good;
        localOlle += item.olle;
        localJoggot += item.joggot;
        localMartro += item.martro;

        splitLowestSum += Math.min(item.good, item.olle, item.joggot, item.martro);
      }
    });


    const activeVehicle = VEHICLES.find(v => v.id === vehicle) || VEHICLES[0];
    const activeTime = TIME_VALUES.find(t => t.id === timeVal) || TIME_VALUES[0];

    const fuelCost = Math.round(EMART_ROUND_TRIP_KM * activeVehicle.rate);
    const timeCost = Math.round(EMART_ROUND_TRIP_MINS * (activeTime.rate / 60));
    const opportunityCost = fuelCost + timeCost;
    const emartTotal = emartRaw + opportunityCost;

    const localMarts = [
      { key: 'good', name: '좋은마트 이도점', total: localGood, dist: '도보 5분' },
      { key: 'olle', name: '우리올레마트', total: localOlle, dist: '도보 4분' },
      { key: 'joggot', name: '조끄뜨레마트 이도점', total: localJoggot, dist: '도보 3분' },
      { key: 'martro', name: '마트로 이도센트럴점', total: localMartro, dist: '도보 9분 / 차로 2분' }
    ];

    localMarts.sort((a, b) => a.total - b.total);
    const bestStore = localMarts[0];

    return {
      emartRaw,
      emartTotal,
      localGood,
      localOlle,
      localJoggot,
      localMartro,
      opportunityCost,
      bestStore,
      splitLowestSum
    };
  };

  const results = getCalculatedPrices();
  const formatKrw = (val: number) => val.toLocaleString('ko-KR') + '원';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white pb-16">
      
      {/* 고정 실시간 상태 헤더 */}
      <header className="bg-slate-900 text-white py-2.5 px-4 text-xs font-semibold sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 live-pulse"></span>
        <span className="tracking-tight">골목 마트 4곳 실시간 물가 레이더 연동 완료 {lastModifiedTime ? `(${lastModifiedTime})` : '(오늘 오전 업데이트 완료)'}</span>
      </header>

      {/* Navigation Bar */}
      <nav className="h-16 px-3 sm:px-4 md:px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-[37px] z-40 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          <div className="w-8 h-8 relative shrink-0">
            {!logoError ? (
              <img 
                src="/assets/logo.png" 
                alt="장보고" 
                className="w-8 h-8 select-none object-contain rounded-lg"
                onError={() => setLogoError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <svg viewBox="0 0 200 200" className="w-8 h-8 select-none drop-shadow-sm">
                {/* Rounded App Icon Base */}
                <rect x="0" y="0" width="200" height="200" rx="46" fill="#D2E6FF" />
                <rect x="5" y="5" width="190" height="190" rx="42" fill="#EBF4FF" stroke="#90C2FC" strokeWidth="8" />
                
                {/* Radar Waves in Background */}
                <path d="M 30,105 A 70,70 0 0,1 170,105" fill="none" stroke="#2563EB" strokeWidth="3" strokeDasharray="6 6" opacity="0.4" />
                <path d="M 50,105 A 50,50 0 0,1 150,105" fill="none" stroke="#2563EB" strokeWidth="3" opacity="0.6" />
                <circle cx="100" cy="30" r="7" fill="#3B82F6" />
                <circle cx="42" cy="118" r="6" fill="#3B82F6" />
                <circle cx="158" cy="118" r="6" fill="#3B82F6" />
                <circle cx="170" cy="90" r="5" fill="#3B82F6" />
                <circle cx="30" cy="90" r="5" fill="#3B82F6" />

                {/* Cute Chibi Jangbogo Character */}
                {/* Hair (back) */}
                <path d="M 46,125 C 46,165 154,165 154,125 C 154,105 46,105 46,125 Z" fill="#2E3748" stroke="#1E293B" strokeWidth="5.5" />
                
                {/* Face Shape */}
                <circle cx="100" cy="122" r="52" fill="#FFF2E8" stroke="#1E293B" strokeWidth="5.5" />
                
                {/* Side Hair */}
                <path d="M 48,112 Q 56,132 62,147 Q 60,112 55,97 Z" fill="#2E3748" stroke="#1E293B" strokeWidth="5.5" />
                <path d="M 152,112 Q 144,132 138,147 Q 140,112 145,97 Z" fill="#2E3748" stroke="#1E293B" strokeWidth="5.5" />
                
                {/* Front Bangs */}
                <path d="M 72,92 Q 100,107 128,92 Q 100,77 72,92 Z" fill="#2E3748" stroke="#1E293B" strokeWidth="5.5" strokeLinejoin="round" />

                {/* Rosy Cheeks */}
                <ellipse cx="70" cy="132" rx="14" ry="9" fill="#FFAEAE" opacity="0.8" />
                <ellipse cx="130" cy="132" rx="14" ry="9" fill="#FFAEAE" opacity="0.8" />
                
                {/* Sparkling Happy Eyes */}
                <circle cx="75" cy="114" r="7.5" fill="#1E293B" />
                <circle cx="72.5" cy="111.5" r="2.5" fill="#FFFFFF" />
                <circle cx="125" cy="114" r="7.5" fill="#1E293B" />
                <circle cx="122.5" cy="111.5" r="2.5" fill="#FFFFFF" />

                {/* Happy Smile */}
                <path d="M 88,128 Q 100,146 112,128 Z" fill="#E64A56" stroke="#1E293B" strokeWidth="5" strokeLinejoin="round" />
                <path d="M 94,136 Q 100,128 106,136 Q 100,147 94,136 Z" fill="#FFB7BD" />

                {/* Jeonrib Hat (Blue Helm) */}
                {/* Hat Ribbon Decor (Left/Right ribbons) */}
                <path d="M 52,86 Q 30,98 22,128 Q 32,128 42,94 Z" fill="#2563EB" stroke="#1E293B" strokeWidth="5" />
                <path d="M 148,86 Q 170,98 178,128 Q 168,128 158,94 Z" fill="#2563EB" stroke="#1E293B" strokeWidth="5" />

                {/* Hat Dome */}
                <path d="M 52,88 C 52,38 148,38 148,88 Z" fill="#3B71CA" stroke="#1E293B" strokeWidth="5.5" strokeLinejoin="round" />
                
                {/* Hat brim border decoration */}
                <circle cx="100" cy="88" r="48" fill="none" stroke="#2563EB" strokeWidth="4" />

                {/* Visor/Brim */}
                <path d="M 45,89 C 45,83 155,83 155,89 C 155,98 45,98 45,89 Z" fill="#589BFC" stroke="#1E293B" strokeWidth="5.5" strokeLinejoin="round" />

                {/* Golden Hat Ornament Crest (Flower/Star Emblem) */}
                <circle cx="100" cy="74" r="14" fill="#FBBF24" stroke="#1E293B" strokeWidth="5.5" />
                {/* Inner detail of gold ornament */}
                <path d="M 94,74 Q 100,68 106,74 Q 100,80 94,74 Z" fill="#D97706" />
                <path d="M 100,68 Q 106,74 100,80 Q 94,74 100,68 Z" fill="#D97706" />

                {/* Gold Ball Top Crown Decor */}
                <line x1="100" y1="41" x2="100" y2="45" stroke="#1E293B" strokeWidth="5.5" />
                <circle cx="100" cy="30" r="10" fill="#FBBF24" stroke="#1E293B" strokeWidth="5.5" />

                {/* Blue Traditional Jacket/Jeonbok showing underneath at bottom */}
                <path d="M 68,172 L 100,162 L 132,172 L 142,201 L 58,201 Z" fill="#1D4ED8" stroke="#1E293B" strokeWidth="5.5" />
                <path d="M 68,172 L 100,162 L 132,172" fill="none" stroke="#FBBF24" strokeWidth="4.5" />
              </svg>
            )}
          </div>
          <span className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
            장바구니 레이더 장보고
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-xs md:text-sm font-semibold text-slate-600 mx-4 shrink-0">
          <a href="#calculator" className="hover:text-blue-600 transition-colors">물가 분석기</a>
          <a href="#prices" className="hover:text-blue-600 transition-colors">오늘의 시세표</a>
          <a href="#mission" className="hover:text-blue-600 transition-colors">이웃 상생미션</a>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] sm:text-[10px] md:text-xs font-bold bg-blue-50 text-blue-700 px-2 sm:px-2.5 py-1 rounded-full flex items-center gap-1 sm:gap-1.5 border border-blue-150 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
            골목 물가 실시간 연동 {lastModifiedTime && `(${lastModifiedTime})`}
          </span>
        </div>
      </nav>

      {/* 히어로 타이틀 영역 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50/60 pt-12 pb-14 px-4 border-b border-slate-200">
        {/* Background Character Watermark */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.12] pointer-events-none select-none overflow-hidden">
          <img 
            src="/assets/.aistudio/bogobogi.png" 
            alt="배경 캐릭터" 
            className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px] h-auto object-contain transition-all duration-300"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-100/30 blur-3xl rounded-full pointer-events-none" />
        
        <div className="max-w-md mx-auto text-center relative z-10 space-y-4">
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-wider border border-blue-100/70 shadow-3xs"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            기준: 우리 동네 중심가 앞 5분 슬세권 최저가 계산기
          </motion.span>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-black tracking-tight leading-tight mb-3 flex flex-col items-center gap-1.5 font-extrabold"
          >
            <span className="text-[26px]">장바구니 레이더</span>
            <span className="text-[37px] font-black text-blue-600 tracking-tight">장보고</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed max-w-sm mx-auto mb-6"
          >
            대형마트 배송비 채우려고 억지로 장바구니 쓸어담으셨나요? <br />
            오늘 저녁거리는 <strong>집 앞 5분 거리 골목 마트</strong>가 훨씬 경제적입니다.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-1.5 text-xs text-slate-500 bg-white/50 backdrop-blur-xs py-2 px-4 rounded-xl border border-slate-200/60 inline-flex"
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>최종 가격 업데이트: <strong className="text-slate-800">오늘 기준 ({lastModifiedTime ? lastModifiedTime : '실시간 매칭'})</strong></span>
          </motion.div>

          {/* 초밀착 반경 도보 시간 거리 가이드 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-left"
          >
            <div className="flex gap-3 items-start">
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                <Route className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-1">우리 동네 기점 골목 마트 정보</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  조끄뜨레 (도보 3분) | 우리올레 (도보 4분) | 좋은마트 (도보 5분) | 마트로 (도보 9분 / 차로 2분)
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 인터랙티브 장바구니 계산 보드 */}
      <section id="calculator" className="py-10 px-4 bg-white border-b border-slate-200">
        <div className="max-w-md mx-auto">
          <div className="bg-slate-900 text-white rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute right-0 top-0 opacity-5 -translate-y-6 translate-x-6 pointer-events-none">
              <Store className="w-56 h-56" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm md:text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                오늘 장볼 목록 원클릭 계산기
              </h3>
              <button 
                onClick={selectAll}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer"
              >
                {selectedItems.length === items.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-5 leading-normal">
              식자재를 터치해 보세요. 대형마트 원정 시 소요되는 <strong>실제 유류비와 도로 위 시간가치</strong>를 완벽히 반영해 동네 마트 픽업과 진짜 효율 차이를 분석해 드립니다.
            </p>

            {/* 품목 그리드 */}
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {items.map(item => {
                const isSelected = selectedItems.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all duration-150 active:scale-95 cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-semibold' 
                        : 'bg-slate-800/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <div className="truncate">
                      <p className="font-bold text-slate-200 text-xs truncate">{item.name}</p>
                      <p className="text-[9px] text-slate-500 truncate">{item.subName}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 원정 기회비용 커스텀 설정 */}
            <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-800/80 text-xs space-y-4">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                🚗 대형마트(노형동 왕복 약 15km) 원정 시 소모되는 기회비용
              </span>

              {/* 차종 선택 */}
              <div>
                <p className="text-[11px] text-slate-300 mb-2 font-medium flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-slate-405" />
                  1. 나의 자동차 정보 (유류 비용)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {VEHICLES.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setVehicle(v.id)}
                      className={`py-2 px-1.5 rounded-lg text-center text-xs font-semibold cursor-pointer transition-colors ${
                        vehicle === v.id 
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-400'
                      }`}
                    >
                      <span className="block text-[11px]">{v.label}</span>
                      <span className="block text-[8px] opacity-70 font-normal">km당 {v.rate}원</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 시간대 설정 */}
              <div>
                <p className="text-[11px] text-slate-300 mb-2 font-medium flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5 text-slate-405" />
                  2. 예상 이동 시간대 (정체에 따른 시간가치)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_VALUES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTimeVal(t.id)}
                      className={`py-2 px-1.5 rounded-lg text-center text-xs font-semibold cursor-pointer transition-colors ${
                        timeVal === t.id 
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-400'
                      }`}
                    >
                      <span className="block text-[11px]">{t.label}</span>
                      <span className="block text-[8px] opacity-70 text-slate-300 font-normal">시간당 {t.rate.toLocaleString()}원</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 결과 분석 보드 */}
            <div className="space-y-4">
              
              {/* 1. 대형마트 체감 지출 */}
              <div className="flex justify-between items-center pb-3.5 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-medium">🔴 대형마트 왕복 최종 체감 지출액</span>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500" id="emart-raw">
                    {selectedItems.length > 0 
                      ? `순수 상품가: ${formatKrw(results.emartRaw)} + 기회비용 ${formatKrw(results.opportunityCost)}`
                      : '0원'
                    }
                  </p>
                  <p className="text-lg font-bold text-rose-450">
                    {formatKrw(results.emartTotal)}
                  </p>
                </div>
              </div>

              {/* 2. 우리동네 최고의 픽업 마트 */}
              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <span className="text-[11px] text-blue-400 font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                      🟢 오늘의 최적 원스톱 픽업 마트
                    </span>
                    <p className="text-xs text-slate-200 mt-1">
                      {selectedItems.length > 0 
                        ? `${results.bestStore.name} 일괄 장보기`
                        : '체크리스트에 물품들을 담으면 매칭됩니다.'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold">
                      {selectedItems.length > 0 ? results.bestStore.dist : '슬세권'}
                    </span>
                    <p className="text-xl font-bold text-blue-400 mt-1">
                      {formatKrw(results.bestStore.total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. 판정 배너 */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedItems.length > 0 ? 'active' : 'inactive'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-blue-950/80 text-blue-300 rounded-xl py-3.5 px-4 text-center font-semibold text-xs leading-relaxed border border-blue-900/60"
                >
                  {selectedItems.length === 0 ? (
                    '위 목록에서 물품을 선택하시면 분석이 시작됩니다!'
                  ) : (
                    <div>
                      대형마트 대비 약 <span className="text-white font-extrabold underline">{formatKrw(results.emartTotal - results.bestStore.total)}</span> 이득!
                      <p className="text-[10px] text-slate-350 mt-1.5">
                        여러 마트를 각각 따로 돌면서 낭비하는 시간가치({formatKrw(results.bestStore.total - results.splitLowestSum)})를 비교하면,<br />
                        <span className="text-blue-400 font-bold">{results.bestStore.name}</span> 한 곳에서 일괄 구매하여 빠르게 집으로 복귀하는 것이 진짜 이득입니다!
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

            </div>

          </div>
        </div>
      </section>

      {/* 오늘자 이도2동 실시간 품목 시세표 */}
      <section id="prices" className="py-12 px-4 bg-slate-50 animate-fade-in">
        <div className="max-w-md mx-auto">
          
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-blue-600 animate-pulse" />
              오늘의 물가 실시간 최저가 가격표
            </h3>
            {isAdmin ? (
              <button
                onClick={() => setIsEditingMode(!isEditingMode)}
                className={`text-[10px] px-2.5 py-1 rounded-xl border font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isEditingMode 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Edit className="w-3 h-3" />
                시세 직접 수정
              </button>
            ) : (
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-[10px] px-2.5 py-1 rounded-xl border border-dashed border-slate-350 text-slate-500 bg-slate-900/5 hover:bg-slate-900/10 transition-all font-semibold flex items-center gap-1 cursor-pointer"
                title="가격 관리자 잠금해제"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                시세 직접 관리
              </button>
            )}
          </div>

          <div className="space-y-3.5 mb-8">
            {items.map(item => {
              const prices = [
                { name: '대형마트', value: item.emart, isEmart: true },
                { name: '좋은마트', value: item.good },
                { name: '우리올레', value: item.olle },
                { name: '조끄뜨레', value: item.joggot },
                { name: '마트로', value: item.martro }
              ];
              // Calculate minimum and maximum only among local stores (excluding emart for local minimum analysis if you wish, or include all. Let's include local stores only)
              const localPricesOnly = prices.filter(p => !p.isEmart);
              const minVal = Math.min(...localPricesOnly.map(p => p.value));
              const maxVal = Math.max(...localPricesOnly.map(p => p.value));

              const isItemEditing = editingItemId === item.id;

              return (
                <div 
                  key={item.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                    isItemEditing ? 'ring-2 ring-blue-500 border-transparent shadow-md bg-white' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-lg shrink-0">{item.emoji}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-xs md:text-sm text-slate-950 flex items-center gap-1 truncate">
                          {item.name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {isEditingMode && !isItemEditing && (
                        <button
                          onClick={() => startEditing(item)}
                          className="p-1 hover:bg-slate-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="가격 수정하기"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isItemEditing ? (
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-blue-200 mt-2 space-y-3 animate-fade-in text-left">
                      <div className="text-[11px] font-bold text-slate-705 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-blue-650">
                          <Edit className="w-3.5 h-3.5" />
                          실시간 마트 가격 수정 중
                        </span>
                        <span className="text-[9px] text-slate-400 font-normal">숫자만 입력해 주세요</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 text-center">
                        <div>
                          <label className="block text-[8px] text-slate-600 font-medium mb-0.5 truncate">대형마트</label>
                          <input 
                            type="number" 
                            step="10"
                            value={editPrices.emart} 
                            onChange={e => setEditPrices(prev => ({ ...prev, emart: Number(e.target.value) || 0 }))}
                            className="w-full text-[10px] p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-bold bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] text-slate-600 font-medium mb-0.5 truncate">좋은마트</label>
                          <input 
                            type="number" 
                            step="10"
                            value={editPrices.good} 
                            onChange={e => setEditPrices(prev => ({ ...prev, good: Number(e.target.value) || 0 }))}
                            className="w-full text-[10px] p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-bold bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] text-slate-600 font-medium mb-0.5 truncate">우리올레</label>
                          <input 
                            type="number" 
                            step="10"
                            value={editPrices.olle} 
                            onChange={e => setEditPrices(prev => ({ ...prev, olle: Number(e.target.value) || 0 }))}
                            className="w-full text-[10px] p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-bold bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] text-slate-600 font-medium mb-0.5 truncate">조끄뜨레</label>
                          <input 
                            type="number" 
                            step="10"
                            value={editPrices.joggot} 
                            onChange={e => setEditPrices(prev => ({ ...prev, joggot: Number(e.target.value) || 0 }))}
                            className="w-full text-[10px] p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-bold bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] text-slate-600 font-medium mb-0.5 truncate">마트로</label>
                          <input 
                            type="number" 
                            step="10"
                            value={editPrices.martro} 
                            onChange={e => setEditPrices(prev => ({ ...prev, martro: Number(e.target.value) || 0 }))}
                            className="w-full text-[10px] p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-bold bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 text-[11px] pt-1 border-t border-slate-100">
                        <button 
                          onClick={cancelEditing} 
                          className="px-2 py-0.5 text-slate-500 bg-slate-200 hover:bg-slate-300 rounded transition-colors cursor-pointer"
                        >
                          취소
                        </button>
                        <button 
                          onClick={() => saveEditedItem(item.id)} 
                          className="px-2.5 py-0.5 text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded flex items-center gap-0.5 transition-colors cursor-pointer"
                        >
                          <Save className="w-3 h-3" />
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                      {prices.map((p, pIdx) => {
                        const isMin = !p.isEmart && p.value === minVal;
                        const isMax = !p.isEmart && p.value === maxVal;
                        return (
                          <div 
                            key={pIdx}
                            className={`p-1.5 rounded-xl border ${
                              p.isEmart
                                ? 'bg-slate-100 border-slate-200 text-slate-550 font-medium'
                                : isMin 
                                ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold' 
                                : isMax 
                                ? 'bg-rose-50 border-rose-200 text-rose-950 font-bold' 
                                : 'bg-slate-50 border-slate-100 text-slate-600'
                            }`}
                          >
                            <p className="text-[8.5px] text-slate-400 mb-0.5 truncate">{p.name}</p>
                            <p className="font-extrabold text-[10.5px] truncate">{p.value.toLocaleString()}원</p>
                            {isMin && !p.isEmart && (
                              <span className="inline-block text-[7px] bg-blue-200 text-blue-900 px-1 py-0.2 rounded-full font-black mt-1 uppercase">
                                최저
                              </span>
                            )}
                            {isMax && !p.isEmart && (
                              <span className="inline-block text-[7px] bg-rose-200 text-rose-900 px-1 py-0.2 rounded-full font-black mt-1 uppercase">
                                최고
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 구글 스프레드시트 가격 연동 센터 (관리자 전용 로그인 후만 노출) */}
          {isAdmin && (
            <div className="bg-slate-900 text-white rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden border border-slate-800 text-left animate-fade-in mb-8">
              <div className="absolute right-0 top-0 opacity-5 -translate-y-6 translate-x-6 pointer-events-none">
                <Database className="w-56 h-56 text-blue-500" />
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm md:text-base font-bold flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  구글 스프레드시트 물가 DB 연동 센터
                </h3>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  spreadsheetUrl ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-405'
                }`}>
                  {spreadsheetUrl ? '시트 연동중' : '로컬 단독'}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                구글 시트에 수기로 기록된 마트 물가를 앱으로 고속 동기화 하거나, 현재 편집된 시세 데이터를 내려받아 구글 시트에 그대로 적용할 수 있습니다.
              </p>

              <form onSubmit={handleLoadSheet} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1.5 flex items-center gap-1">
                    <Link className="w-3 h-3 text-blue-400" />
                    연동할 구글 스프레드시트 주소(URL) 또는 ID 입력
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={spreadsheetUrl}
                      onChange={e => setSpreadsheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/your-id-here/edit"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      가져오기
                    </button>
                  </div>
                </div>

                {showSyncSuccess && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-900 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-bounce">
                    <CheckCircle2 className="w-4 h-4" />
                    스프레드시트에서 가격을 성공적으로 동기화하였습니다!
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 bg-rose-950/80 border border-rose-900 rounded-xl text-rose-350 text-[11px] space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      연동 실패 오류 원인
                    </p>
                    <p className="text-slate-300 leading-normal">{errorMsg}</p>
                    <p className="pt-1.5 font-bold text-white text-[10px]">💡 구글 시트 공유방법 확인:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[10px]">
                      <li>구글 시트 상단 우측의 <strong>[공유]</strong> 버튼을 누릅니다.</li>
                      <li>일반 액세스를 <strong>"링크가 있는 모든 사용자"</strong>, 역할은 <strong>"Viewer(뷰어)"</strong>로 설정합니다.</li>
                      <li>시트의 첫 행에는 순서 상관없이 헤더(<strong>"id", "품목명", "이름데코", "대형마트", "좋은마트", "우리올레", "조끄뜨레", "마트로", "마지막업데이트"</strong>)가 반드시 있어야 합니다.</li>
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    템플릿 CSV 다운로드
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-rose-400 border border-slate-750 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    체험 데이터로 리셋
                  </button>
                </div>
              </form>

              {/* 스프레드시트 팁 & 스크립트 연동 */}
              <div className="mt-4 bg-slate-800/40 p-4 rounded-xl border border-slate-850 text-xs text-slate-300 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  🛠️ 구글 시트 양방향 실시간 내보내기 자동화 (고급 기능)
                </span>
                <p className="text-[10.5px] text-slate-455 leading-normal">
                  현재 편집한 가격을 구글 스프레드시트에 즉각 백업하고 싶다면, 아래 구글 앱스 스크립트(Google Apps Script) 코드를 활용해 자동화 Web API를 구축하고 웹앱 배포 주소를 URL 창에 넣어 사용할 수 있습니다.
                </p>
                
                <details className="mt-1">
                  <summary className="text-[10px] text-blue-400 hover:text-blue-300 font-bold cursor-pointer select-none">
                    구글 앱스 스크립트 코드 확인/복사
                  </summary>
                  <pre className="mt-2 text-[9px] bg-slate-950 p-2.5 rounded-lg border border-slate-850 font-mono text-emerald-400 overflow-x-auto leading-normal">
  {`function doGet(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  function doPost(e) {
    var params = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var rowId = data[i][0]; // A열의 ID
      var updateItem = params.find(function(item) { return item.id === rowId; });
      if (updateItem) {
        sheet.getRange(i + 1, 4).setValue(updateItem.emart); // D열 대형마트
        sheet.getRange(i + 1, 5).setValue(updateItem.good);  // E열 좋은마트
        sheet.getRange(i + 1, 6).setValue(updateItem.olle);  // F열 우리올레
        sheet.getRange(i + 1, 7).setValue(updateItem.joggot); // G열 조끄뜨레
        sheet.getRange(i + 1, 8).setValue(updateItem.martro); // H열 마트로
        sheet.getRange(i + 1, 9).setValue(new Date());        // I열 시각
      }
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  }`}
                  </pre>
                  <p className="text-[9.5px] text-slate-450 mt-1.5 leading-normal">
                    설명: 구글 시트 ➔ <strong>[확장 프로그램]</strong> ➔ <strong>[Apps Script]</strong> ➔ 위 소스코드 입력 ➔ <strong>[배포]</strong> ➔ [새 배포] ➔ 유형: 웹앱 선택 ➔ '액세스할 수 있는 사용자' ➔ <strong>[모든 사용자]</strong>로 배포 후 완성된 주소를 넣으시면 양방향 연동이 작동합니다!
                  </p>
                </details>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* 로컬 골목상권 팁 */}
      <section className="py-4 px-4 bg-white">
        <div className="max-w-md mx-auto">
          <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100/50 text-left">
            <h4 className="font-bold text-slate-900 text-xs md:text-sm flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              장바구니 레이더 팁
            </h4>
            <p className="text-xs text-slate-650 leading-relaxed">
              여러 마트를 쪼개 사봤자 절약되는 돈은 <strong>몇 백 원</strong>에 불과합니다. 차라리 오늘 구매할 품목 합산 가치가 가장 나은 <strong className="text-slate-900">최적 마트 한 곳</strong>에서 모든 품목을 원스톱으로 담아 빠르게 픽업해 귀가하시는 것이 내 소중한 시간과 저녁 에너지를 지키는 지혜입니다!
            </p>
          </div>
        </div>
      </section>

      {/* 이웃 정보 공유 이벤트 참여 유도 및 톡방 복귀 */}
      <section id="mission" className="py-12 px-4 bg-gradient-to-b from-white to-blue-50/50 border-t border-slate-200/50">
        <div className="max-w-md mx-auto text-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3 shadow-xs">
            <Gift className="w-3.5 h-3.5 text-blue-700" />
            단톡방 회원 전용 인증 챌린지
          </span>
          
          <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">
            <span className="text-2xl text-blue-600 block mb-1">선착순 100명 한정!</span>
            오늘도 합리적 장보기 완료했다면?<br />
            영수증 인증하고 커피 기프티콘 받기 ☕️
          </h3>
          
          <p className="text-xs text-slate-500 mb-6 leading-relaxed max-w-xs mx-auto">
            "동네마트의 게릴라 특가 소식 및 누구보다 싸게 산 나의 초특템 영수증을 카카오톡 소통방에 올려주세요 추첨을 통해 커피 이용권을 보내드립니다."
          </p>

          <button 
            type="button"
            onClick={() => alert('공식 단톡방으로 이동합니다. 영수증 픽업 인증 사진을 남겨주시면 자동 응모됩니다!')}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-705 text-white font-extrabold text-sm py-4 rounded-2xl shadow-lg transition-transform active:scale-98 cursor-pointer mb-4"
          >
            <Camera className="w-4 h-4" />
            오픈카톡방 입장하고 영수증 인증하기
          </button>

          {/* 안전 보안 안내 */}
          <div className="bg-white/90 rounded-2xl p-4 border border-slate-200/60 text-left shadow-xs">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              100% 안심 로컬 연결 보장
            </span>
            <p className="text-[10px] text-slate-500 leading-normal mb-1.5">
              🔒 본 소통방은 공식 카카오 오픈채팅방으로 연결됩니다. 개인정보 수집이나 금전 요구가 없으므로 안심하고 입장하여 자세한 내용을 확인해 보세요.
            </p>
            <p className="text-[10px] text-slate-400">
              💡 동네마트의 게릴라 특가 소식을 알게되었다면? 소통방에 "제보" 문구와 사진을 공유해 주세요 (추첨 확률이 높아집니다.)
            </p>
          </div>
        </div>
      </section>

      {/* 관리자 인증 모달 */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 text-left font-sans"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-950">
                  물가 레이더 관리자 로그인
                </h3>
              </div>
              
              <p className="text-[11px] text-slate-500 leading-normal mb-5">
                동네 시트 동기화 및 실시간 가격 정보 직접 수정은 관리자만 가능합니다.<br/>
                테스트용 관리자 비밀번호: <strong className="text-blue-600 underline">0402</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    인증 권한 비밀번호
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (adminError) setAdminError('');
                    }}
                    placeholder="비밀번호(0402)를 입력해 주세요."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdminLogin();
                    }}
                  />
                </div>

                {adminError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[10.5px] px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminModal(false);
                      setAdminPassword('');
                      setAdminError('');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-center font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    돌아가기
                  </button>
                  <button
                    type="button"
                    onClick={handleAdminLogin}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-center font-extrabold py-3 px-4 rounded-xl text-xs transition-colors shadow-md hover:shadow-lg cursor-pointer"
                  >
                    인증하기
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 푸터 상생 명분 고지 */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center text-[10px] border-t border-slate-850">
        <div className="max-w-md mx-auto space-y-2">
          <p className="space-y-1">
            <span className="block text-xs md:text-sm font-black text-white">장바구니 레이더</span>
            <span className="block text-[10px] md:text-[11px] font-semibold text-slate-300">골목마트 소상공인 상생 지표 (MVP Stage 구남)</span>
          </p>
          <p className="leading-relaxed">
            본 사이트는 이웃 주민들의 지혜롭고 경제적인 골목 소비 권장 및 자영업자 연대를 돕기 위해 구축한 데이터 수집 실험 공간입니다.<br/>
            E-MAIL | choseoungmun@gmail.com
          </p>

          {/* 하단 관리자 로그인/로그아웃 트리거 */}
          <div className="pt-2 pb-1 flex justify-center">
            {isAdmin ? (
              <button
                onClick={handleAdminLogout}
                className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="관리자 로그아웃"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>관리자 로그아웃 (접속중)</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-450 hover:text-slate-200 border border-slate-700 font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="관리자 로그인"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>관리자 로그인</span>
              </button>
            )}
          </div>

          <p className="pt-3 border-t border-slate-800 text-slate-600">Copyright © 2026 CHOSEONGMUN ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

    </div>
  );
}
