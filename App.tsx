
import React, { useState, useRef, useEffect } from 'react';
import MatrixWorkflow from './components/MatrixWorkflow';
import SimilarExercisesWorkflow from './components/SimilarExercisesWorkflow';

// Khai báo kiểu cho window.aistudio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("TẠO ĐỀ KIỂM TRA BẰNG AI");
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const dropdownRef = useRef<HTMLLIElement>(null);
  const configRef = useRef<HTMLDivElement>(null);

  const allTabs = [
    "TẠO ĐỀ KIỂM TRA BẰNG AI",
    "TẠO BÀI TẬP TƯƠNG TỰ",
    "KIỂM TRA TRỰC TUYẾN",
    "BÀI TRÌNH CHIẾU",
    "HOẠT ĐỘNG KHỞI ĐỘNG",
    "HOẠT ĐỘNG NHÓM",
    "TRẮC NGHIỆM NHANH",
    "BÀI TẬP VẬN DỤNG",
    "INFOGRAPHIC",
    "SƠ ĐỒ TƯ DUY"
  ];

  const visibleTabs = allTabs.slice(0, 3);
  const hiddenTabs = allTabs.slice(3);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const connected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(connected);
      }
    };
    checkKey();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (configRef.current && !configRef.current.contains(event.target as Node)) {
        setIsAiConfigOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsDropdownOpen(false);
  };

  const handleOpenKeySelection = async () => {
    if (window.aistudio) {
      // Khi người dùng nhấn vào ô nhập, mở trình chọn khóa của hệ thống
      // Khóa sau đó sẽ tự động khả dụng qua process.env.API_KEY
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      setIsAiConfigOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* TẦNG 1: NAVBAR CHÍNH */}
      <header className="bg-primary text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-shrink-0 cursor-pointer group" onClick={() => setActiveTab(allTabs[0])}>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-primary shadow-lg group-hover:scale-110 transition-transform text-xs mb-0.5">
                  TQT
              </div>
              <span className="text-[7px] font-black text-white uppercase tracking-[0.1em] width-max leading-none opacity-90">Tiêu Quang Thạch</span>
            </div>
          </div>

          <div className="hidden md:block flex-grow overflow-hidden relative h-7 bg-white/10 rounded-full flex items-center mx-4">
            <div className="animate-marquee whitespace-nowrap flex items-center w-full">
              <span className="text-sm font-bold text-white/95 tracking-wide uppercase italic px-4 w-full text-center">
                Hệ thống dạy học và kiểm tra tạo bởi AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* NÚT CẤU HÌNH AI - GIỐNG ẢNH MẪU */}
            <div className="relative" ref={configRef}>
              <button 
                onClick={() => setIsAiConfigOpen(!isAiConfigOpen)}
                className={`flex items-center gap-2 p-2 rounded-xl transition-all ${isAiConfigOpen ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                <svg className={`w-6 h-6 transition-transform duration-500 ${isAiConfigOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {hasApiKey && <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]"></span>}
              </button>

              {isAiConfigOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#f8faff] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-blue-100 overflow-hidden animate-fade-in z-50">
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                      </svg>
                      <h3 className="text-2xl font-bold text-slate-800">Cấu hình AI</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                         <svg className="w-4 h-4 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
                           <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                         </svg>
                         <label className="text-sm font-bold text-slate-700">Google Gemini API Key:</label>
                      </div>
                      
                      {/* Ô NHẬP API DẠNG PASSWORD MASKED - CHỈ CHO PHÉP DÁN (QUA OPENSELECTKEY) */}
                      <div 
                        onClick={handleOpenKeySelection}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 cursor-text hover:border-blue-400 transition-all shadow-sm group overflow-hidden"
                      >
                        <p className="text-slate-400 font-medium text-sm tracking-widest truncate">
                          {hasApiKey ? '••••••••••••••••••••••••••••••••••••' : 'Nhấn để dán API Key...'}
                        </p>
                      </div>

                      <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        HD Lấy API Key tại đây
                      </a>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-blue-100">
                       <input 
                         type="checkbox" 
                         id="rememberKey" 
                         defaultChecked={true}
                         className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                       />
                       <label htmlFor="rememberKey" className="text-[14px] font-bold text-slate-600 cursor-pointer">
                          Ghi nhớ API Key (lưu trong trình duyệt)
                       </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-px h-8 bg-white/20 mx-1"></div>
            
            <button className="bg-secondary hover:bg-orange-600 text-white text-sm font-black px-5 py-2.5 rounded-xl transition shadow-lg whitespace-nowrap uppercase tracking-wider">Đăng ký</button>
          </div>
        </div>
      </header>

      {/* TẦNG 2: MENU CHỨC NĂNG */}
      <nav className="bg-secondary nav-shadow border-b border-orange-600 relative z-40">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex justify-center items-center gap-4 md:gap-8 py-3 text-[13px] font-black text-white uppercase tracking-tight">
            {visibleTabs.map((tab) => (
              <li 
                key={tab} 
                onClick={() => handleTabClick(tab)}
                className={`${activeTab === tab ? 'text-blue-900 border-b-2 border-blue-900' : 'hover:text-blue-900'} pb-1 cursor-pointer transition whitespace-nowrap`}
              >
                {tab}
              </li>
            ))}
            
            <li className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all border border-white/20 group ${hiddenTabs.includes(activeTab) ? 'bg-white/30 border-white' : 'bg-white/10 hover:bg-white/20'}`}
              >
                <span className={`text-[11px] font-black ${hiddenTabs.includes(activeTab) ? 'text-blue-900' : 'group-hover:text-blue-900'}`}>
                  {hiddenTabs.includes(activeTab) ? activeTab : 'XEM THÊM'}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 md:left-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 animate-fade-in z-50 overflow-hidden">
                  {hiddenTabs.map((tab) => (
                    <div 
                      key={tab}
                      className={`px-6 py-3 font-bold text-[12px] cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${activeTab === tab ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-secondary hover:text-white'}`}
                      onClick={() => handleTabClick(tab)}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-grow py-8 px-4">
        <div className={`max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl shadow-blue-900/10 min-h-[600px] overflow-hidden ${activeTab === "TẠO BÀI TẬP TƯƠNG TỰ" ? 'p-0 min-h-[800px]' : 'p-4 md:p-8'}`}>
          {activeTab === "TẠO ĐỀ KIỂM TRA BẰNG AI" && (
            <MatrixWorkflow />
          )}

          {activeTab === "TẠO BÀI TẬP TƯƠNG TỰ" && (
            <SimilarExercisesWorkflow />
          )}

          {activeTab !== "TẠO ĐỀ KIỂM TRA BẰNG AI" && activeTab !== "TẠO BÀI TẬP TƯƠNG TỰ" && (
            <div className="flex flex-col items-center justify-center h-[500px] text-gray-400 text-center p-6">
               <svg className="w-20 h-20 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
               <p className="text-xl font-bold uppercase tracking-widest italic">Tính năng {activeTab} đang được phát triển</p>
               <button 
                 onClick={() => setActiveTab(allTabs[0])}
                 className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition shadow-lg"
               >
                 Quay lại Tạo đề kiểm tra
               </button>
            </div>
          )}
        </div>
      </main>
      
      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center space-y-8">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                    TQT
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Created By</span>
                    <span className="text-sm font-black text-primary">Tiêu Quang Thạch</span>
                </div>
             </div>
          </div>
          <div className="flex justify-center gap-8 text-gray-400">
             <span className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Facebook</span>
             <span className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> Youtube</span>
             <span className="hover:text-primary cursor-pointer transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 bg-black rounded-full"></div> TikTok</span>
          </div>
          <div className="text-gray-400 font-medium text-center max-w-md">
            <p className="text-sm leading-relaxed">
              © 2026 Hệ thống dạy học và kiểm tra tạo bởi AI.
            </p>
            <p className="text-[10px] mt-2 text-gray-300">Sử dụng công nghệ Trí tuệ nhân tạo (AI) để hỗ trợ giáo viên tối ưu hoá công việc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
