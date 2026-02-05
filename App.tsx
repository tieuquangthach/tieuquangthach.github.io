
import React, { useState, useEffect, useRef } from 'react';
import { AppData, Screen, BaiHoc, NguoiDung, HocSinh, DiemDanh, LopHoc, BaiTap, DeKiemTra, PhieuBaiTap } from './types';
import { INITIAL_DATA, LOGO_URL } from './constants';
import { supabase } from './services/supabaseClient';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import LessonList from './screens/LessonList';
import LessonDetail from './screens/LessonDetail';
import Results from './screens/Results';
import Leaderboard from './screens/Leaderboard';
import AIChat from './screens/AIChat';
import Attendance from './screens/Attendance';
import Remarks from './screens/Remarks';
import AdminDashboard from './screens/AdminDashboard';
import AdminLessons from './screens/AdminLessons';
import AdminStudents from './screens/AdminStudents';
import AdminClasses from './screens/AdminClasses';
import AdminWorksheets from './screens/AdminWorksheets';
import QuizSystem from './screens/QuizSystem';
import SmartWorksheet from './screens/SmartWorksheet';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>({ ...INITIAL_DATA, allHocSinh: [], allLopHoc: [] });
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.DASHBOARD);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedWorksheet, setSelectedWorksheet] = useState<PhieuBaiTap | null>(null);
  const [smartWorksheetGrade, setSmartWorksheetGrade] = useState<string>('6'); 
  const [smartWorksheetType, setSmartWorksheetType] = useState<'Luyện tập' | 'Tự luyện' | 'Tự luận'>('Luyện tập'); 
  const [user, setUser] = useState<NguoiDung | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [pendingClass, setPendingClass] = useState<string | null>(null);
  const [filterClassForAdmin, setFilterClassForAdmin] = useState<string | null>(null);
  
  const [previousAdminScreen, setPreviousAdminScreen] = useState<Screen | null>(null);

  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      const savedUser = localStorage.getItem('mathpro_user');
      
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const { data: dbUser, error } = await supabase
            .from('nguoi_dung')
            .select('*')
            .eq('username', parsedUser.username.toLowerCase())
            .single();
          
          if (dbUser && !error) {
            const mappedUser: NguoiDung = {
              id: dbUser.id,
              username: dbUser.username,
              vaiTro: dbUser.vai_tro
            };
            setUser(mappedUser);
            await fetchData(mappedUser); 
          } else {
            localStorage.removeItem('mathpro_user');
            setUser(null);
          }
        } catch (e) {
          localStorage.removeItem('mathpro_user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initApp();
  }, []);

  const fetchData = async (currentUser: NguoiDung | null) => {
    try {
      const [lessonsRes, studentsRes, attendanceRes, classesRes, bankRes, quizzesRes, worksheetRes] = await Promise.all([
        supabase.from('bai_hoc').select('*, bai_tap(*)'),
        supabase.from('hoc_sinh').select('*'),
        supabase.from('diem_danh').select('*'),
        supabase.from('lop_hoc').select('*'),
        supabase.from('ngan_hang_cau_hoi').select('*'),
        supabase.from('de_kiem_tra').select('*'),
        supabase.from('phieu_bai_tap').select('*').order('created_at', { ascending: false })
      ]);

      const mappedLessons: BaiHoc[] = (lessonsRes.data || []).map((l: any) => ({
        id: l.id,
        tenBai: l.ten_bai,
        lop: String(l.lop), // Ensure string for filter comparison
        chuong: l.chuong,
        lyThuyet: l.ly_thuyet,
        baiTap: (l.bai_tap || []).map((bt: any) => ({
          id: bt.id,
          loai: bt.loai,
          deBai: bt.de_bai,
          dapAn: bt.dap_an,
          dapAnDung: bt.dap_an_dung
        }))
      }));

      const mappedAllStudents: HocSinh[] = (studentsRes.data || []).map((s: any) => ({
        id: s.id,
        ten: s.ten,
        lop: String(s.lop),
        nhanXet: s.nhan_xet || "",
        diemSo: s.diem_so || { hocKy1: [], hocKy2: [] },
        thoiGianHoc: s.thoi_gian_hoc || { ngay: new Date().toISOString().split('T')[0], soPhut: 0 },
        username: s.username 
      }));

      const mappedAllClasses: LopHoc[] = (classesRes.data || []).map((c: any) => ({
        id: c.id,
        tenLop: c.ten_lop,
        khoi: String(c.khoi),
        ngayTao: c.created_at
      }));

      const mappedBank: BaiTap[] = (bankRes.data || []).map((b: any) => ({
        id: b.id,
        loai: b.loai,
        deBai: b.de_bai,
        dapAn: b.dap_an,
        dapAnDung: b.dap_an_dung,
        doKho: b.do_kho,
        chuDe: b.chu_de
      }));

      const mappedQuizzes: DeKiemTra[] = (quizzesRes.data || []).map((q: any) => ({
        id: q.id,
        tenDe: q.ten_de,
        moTa: q.mo_ta,
        lop: String(q.lop),
        thoiGian: q.thoi_gian,
        taoBoi: q.tao_boi,
        ngayTao: q.created_at,
        cauHoiIds: q.cau_hoi_ids || []
      }));
      
      const mappedWorksheets: PhieuBaiTap[] = (worksheetRes.data || []).map((w: any) => ({
        id: w.id,
        tenPhieu: w.ten_phieu,
        lop: String(w.lop), // Ensure string
        monHoc: w.mon_hoc,
        noiDung: w.noi_dung,
        ngayTao: w.created_at
      }));

      let currentHocSinh = { ...INITIAL_DATA.hocSinh };
      if (currentUser && currentUser.vaiTro === 'hocSinh') {
        const found = mappedAllStudents.find((s: any) => s.username?.toLowerCase() === currentUser.username?.toLowerCase());
        if (found) currentHocSinh = found;
      }

      setData(prev => ({
        ...prev,
        baiHoc: mappedLessons,
        allHocSinh: mappedAllStudents,
        allHocSinhFiltered: mappedAllStudents,
        allLopHoc: mappedAllClasses,
        hocSinh: currentHocSinh,
        nganHangCauHoi: mappedBank,
        tatCaDeKiemTra: mappedQuizzes,
        danhSachPhieuBaiTap: mappedWorksheets,
        diemDanh: (attendanceRes.data || []).map((a: any) => ({ 
          ngay: a.ngay, 
          hocSinh: a.hoc_sinh, 
          coMat: a.co_mat 
        }))
      }));
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    }
  };

  const handleLogin = (userData: NguoiDung) => {
    setUser(userData);
    localStorage.setItem('mathpro_user', JSON.stringify(userData));
    fetchData(userData);
    setActiveScreen(Screen.DASHBOARD);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mathpro_user');
    setData({ ...INITIAL_DATA, allHocSinh: [], allLopHoc: [] }); 
    setActiveScreen(Screen.DASHBOARD);
  };

  const handleCreateNewClass = async (className: string, grade: string, shouldRedirect: boolean = true) => {
    try {
      const { data: newClass, error } = await supabase
        .from('lop_hoc')
        .insert([{ ten_lop: className, khoi: String(grade) }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') alert(`Lớp ${className} đã tồn tại trong hệ thống rồi ạ!`);
        else alert("Lỗi khi tạo lớp học: " + error.message);
        return;
      }

      await fetchData(user); 
      
      if (shouldRedirect) {
        setPendingClass(className);
        setFilterClassForAdmin(className);
        setActiveScreen(Screen.ADMIN_STUDENTS);
      } else {
        alert(`Đã tạo thành công lớp ${className}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoToClassStudents = (className: string) => {
    setFilterClassForAdmin(className);
    setActiveScreen(Screen.ADMIN_STUDENTS);
  };

  let NAV_ITEMS = [
    { id: Screen.DASHBOARD, label: 'Trang chủ', icon: 'home' },
    { id: Screen.AI_QA, label: 'AI Chat', icon: 'chat_bubble' },
    { id: Screen.RESULTS, label: 'Tiến độ', icon: 'bar_chart' },
    { id: Screen.LEADERBOARD, label: 'Xếp hạng', icon: 'leaderboard' },
  ];

  if (user?.vaiTro === 'giaoVien') {
     NAV_ITEMS.splice(1, 0, { id: Screen.LESSONS, label: 'Luyện tập', icon: 'menu_book' });
  }

  const consolidationTab = { id: Screen.CONSOLIDATION, label: 'Tự luyện', icon: 'folder_special' };
  const insertIndex = user?.vaiTro === 'giaoVien' ? 2 : 1;
  NAV_ITEMS.splice(insertIndex, 0, consolidationTab);
  
  const essayTab = { id: Screen.ADMIN_ESSAY, label: 'Tự luận', icon: 'edit_note' };
  const essayInsertIndex = user?.vaiTro === 'giaoVien' ? 3 : 2;
  NAV_ITEMS.splice(essayInsertIndex, 0, essayTab);

  if (!user && !loading) return <Login onLogin={handleLogin} />;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa]">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-[#2563eb] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black tracking-widest uppercase text-[10px]">Đang khởi tạo Math.TQT...</p>
      </div>
    );
  }

  if (activeScreen === Screen.SMART_WORKSHEET) {
    return (
      <SmartWorksheet 
          initialData={selectedWorksheet}
          initialGrade={smartWorksheetGrade}
          targetType={smartWorksheetType as any}
          userRole={user?.vaiTro || 'hocSinh'}
          onBack={() => {
            if (user?.vaiTro === 'giaoVien') {
              if (previousAdminScreen) {
                setActiveScreen(previousAdminScreen);
              } else {
                if (smartWorksheetType === 'Tự luận') {
                    setActiveScreen(Screen.ADMIN_ESSAY);
                } else if (smartWorksheetType === 'Tự luyện') {
                    setActiveScreen(Screen.CONSOLIDATION);
                } else {
                    setActiveScreen(Screen.ADMIN_WORKSHEETS);
                }
              }
            } else {
              setActiveScreen(Screen.DASHBOARD);
            }
          }} 
          onRefresh={() => fetchData(user)}
        />
    );
  }

  const renderScreen = () => {
    const studentGrade = user?.vaiTro === 'hocSinh' && data.hocSinh.lop !== '--' 
        ? data.hocSinh.lop.match(/\d+/)?.[0] 
        : undefined;

    switch (activeScreen) {
      case Screen.DASHBOARD: 
        return (
          <Dashboard 
            data={data} 
            user={user} 
            onNavigateToLesson={id => { setSelectedLessonId(id); setActiveScreen(Screen.LESSON_DETAIL); }} 
            onNavigateToAI={() => setActiveScreen(Screen.AI_QA)} 
            onOpenWorksheet={(worksheet) => {
              setSelectedWorksheet(worksheet);
              setPreviousAdminScreen(null); 
              setActiveScreen(Screen.SMART_WORKSHEET);
            }}
          />
        );
      case Screen.LESSONS: 
        return (
          <div className="space-y-12">
             <AdminWorksheets 
              data={data} 
              onRefresh={() => fetchData(user)}
              worksheetType="Luyện tập"
              readOnly={user?.vaiTro === 'hocSinh'} 
              userGrade={studentGrade} 
              onCreateNew={(grade) => { 
                setSelectedWorksheet(null); 
                setSmartWorksheetGrade(grade || '6');
                setSmartWorksheetType('Luyện tập');
                setPreviousAdminScreen(Screen.LESSONS);
                setActiveScreen(Screen.SMART_WORKSHEET); 
              }}
              onViewWorksheet={(worksheet) => { 
                setSelectedWorksheet(worksheet); 
                setPreviousAdminScreen(Screen.LESSONS);
                setActiveScreen(Screen.SMART_WORKSHEET); 
              }}
            />
          </div>
        );
      case Screen.LESSON_DETAIL: 
        const lesson = data.baiHoc.find(l => l.id === selectedLessonId);
        return lesson ? <LessonDetail lesson={lesson} /> : <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs font-black">Chọn bài học từ danh sách</div>;
      case Screen.RESULTS: 
        return <Results data={data} hocSinh={data.hocSinh} />;
      case Screen.LEADERBOARD: 
        return <Leaderboard data={data} />;
      case Screen.AI_QA: 
        return <AIChat />;
      case Screen.ATTENDANCE: 
        return <Attendance data={data} setData={setData} />;
      case Screen.REMARKS: 
        return <Remarks data={data} setData={setData} />;
      
      case Screen.ADMIN_DASHBOARD:
        return <AdminDashboard onNavigate={(screen) => setActiveScreen(screen)} />;
      case Screen.ADMIN_LESSONS: 
        return <AdminLessons 
          lessons={data.baiHoc} 
          onRefresh={() => fetchData(user)} 
          onOpenSmartWorksheet={(grade) => { 
            setSelectedWorksheet(null); 
            setSmartWorksheetGrade(grade || '6');
            setSmartWorksheetType('Luyện tập');
            setPreviousAdminScreen(Screen.ADMIN_LESSONS);
            setActiveScreen(Screen.SMART_WORKSHEET); 
          }}
        />;
      case Screen.ADMIN_QUIZZES:
        return <QuizSystem data={data} userRole="giaoVien" onRefresh={() => fetchData(user)} />;
      case Screen.ADMIN_STUDENTS: 
        return (
          <AdminStudents 
            students={data.allHocSinh} 
            allLopHoc={data.allLopHoc}
            onRefresh={() => fetchData(user)} 
            initialClass={pendingClass} 
            onResetInitialClass={() => setPendingClass(null)}
            filterClass={filterClassForAdmin}
            onSetFilterClass={(cls) => setFilterClassForAdmin(cls)}
            onClearFilter={() => setFilterClassForAdmin(null)}
          />
        );
      case Screen.ADMIN_CLASSES:
        return <AdminClasses data={data} onGoToStudents={handleGoToClassStudents} onAddClass={handleCreateNewClass} onRefresh={() => fetchData(user)} />;
      
      case Screen.ADMIN_WORKSHEETS:
        return <AdminWorksheets 
          data={data} 
          onRefresh={() => fetchData(user)}
          worksheetType="Luyện tập"
          readOnly={false} 
          onCreateNew={(grade) => { 
            setSelectedWorksheet(null); 
            setSmartWorksheetGrade(grade || '6');
            setSmartWorksheetType('Luyện tập');
            setPreviousAdminScreen(Screen.ADMIN_WORKSHEETS);
            setActiveScreen(Screen.SMART_WORKSHEET); 
          }}
          onViewWorksheet={(worksheet) => { 
            setSelectedWorksheet(worksheet); 
            setPreviousAdminScreen(Screen.ADMIN_WORKSHEETS);
            setActiveScreen(Screen.SMART_WORKSHEET); 
          }}
        />;

      case Screen.ADMIN_CONSOLIDATION:
      case Screen.CONSOLIDATION:
        return <AdminWorksheets 
          data={data} 
          onRefresh={() => fetchData(user)}
          worksheetType="Tự luyện"
          readOnly={user?.vaiTro === 'hocSinh'} 
          userGrade={studentGrade} 
          onCreateNew={(grade) => { 
            setSelectedWorksheet(null); 
            setSmartWorksheetGrade(grade || '6');
            setSmartWorksheetType('Tự luyện');
            setPreviousAdminScreen(Screen.CONSOLIDATION);
            setActiveScreen(Screen.SMART_WORKSHEET); 
          }}
          onViewWorksheet={(worksheet) => { 
            setSelectedWorksheet(worksheet); 
            setPreviousAdminScreen(Screen.CONSOLIDATION); 
            setActiveScreen(Screen.SMART_WORKSHEET); 
          }}
        />;

      case Screen.ADMIN_ESSAY:
        return <AdminWorksheets 
          data={data} 
          onRefresh={() => fetchData(user)}
          worksheetType="Tự luận"
          readOnly={user?.vaiTro === 'hocSinh'} 
          userGrade={studentGrade} 
          onCreateNew={(grade) => { 
            setSelectedWorksheet(null); 
            setSmartWorksheetGrade(grade || '6');
            setSmartWorksheetType('Tự luận');
            setPreviousAdminScreen(Screen.ADMIN_ESSAY);
            setActiveScreen(Screen.SMART_WORKSHEET); 
          }}
          onViewWorksheet={(worksheet) => { 
            setSelectedWorksheet(worksheet); 
            setPreviousAdminScreen(Screen.ADMIN_ESSAY); 
            setActiveScreen(Screen.SMART_WORKSHEET); 
          }}
        />;

      default: 
        return <Dashboard data={data} user={user} onNavigateToLesson={() => {}} onNavigateToAI={() => {}} onOpenWorksheet={() => {}} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <header className="bg-[#2563eb] border-b border-white/10 sticky top-0 z-50 h-20 flex items-center justify-between px-4 md:px-8 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 group">
            <div onClick={() => setActiveScreen(Screen.DASHBOARD)} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 cursor-pointer overflow-hidden p-1">
                <img 
                  src={LOGO_URL} 
                  alt="Logo" 
                  className="w-full h-full object-contain" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <a href="https://tieuquangthach.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-lg font-black text-white leading-none tracking-tight hover:text-blue-200 transition-colors block">
                tieuquangthach.netlify.app
              </a>
              <p 
                onClick={() => setActiveScreen(Screen.DASHBOARD)} 
                className="text-[6px] sm:text-[8px] font-bold text-blue-100 uppercase tracking-[0.16em] mt-0.5 whitespace-nowrap cursor-pointer hover:opacity-100 opacity-80"
              >
                GIÚP EM LUYỆN TOÁN MỖI NGÀY
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block border-r border-white/20 pr-4">
            <div className="flex items-center justify-end gap-2 text-white">
              <span className={`w-2 h-2 rounded-full ${user?.vaiTro === 'giaoVien' ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></span>
              <p className="text-sm font-black">
                {user?.username === 'Thach' ? 'Thầy Tiêu Quang Thạch' : (user?.vaiTro === 'giaoVien' ? 'Giáo viên' : data.hocSinh.ten)}
              </p>
            </div>
            <p className="text-[9px] uppercase font-black text-white/50 tracking-widest">
              {user?.vaiTro === 'giaoVien' ? 'Quản trị viên' : `Học sinh lớp ${data.hocSinh.lop}`}
            </p>
          </div>
          <button onClick={handleLogout} className="text-white font-black text-[10px] uppercase tracking-widest px-5 py-2.5 border-2 border-white/20 hover:bg-white hover:text-[#2563eb] rounded-xl transition-all active:scale-95">Thoát</button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 sticky top-20 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto custom-scrollbar py-2">
            
            {NAV_ITEMS.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { 
                    setActiveScreen(item.id as Screen); 
                    if (item.id === Screen.ADMIN_STUDENTS) setFilterClassForAdmin(null); 
                  }}
                  className={`flex flex-col items-center justify-center py-3 px-4 min-w-[90px] rounded-xl transition-all duration-200 group ${isActive ? 'text-[#2563eb]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                >
                  <span className={`material-symbols-outlined text-[28px] mb-1 ${isActive ? 'fill-current' : ''}`}>{item.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">{item.label}</span>
                  {isActive && <div className="h-1 w-6 bg-[#2563eb] rounded-full mt-1"></div>}
                </button>
              );
            })}
            
            {user?.vaiTro === 'giaoVien' && (
              <>
                 <div className="w-px h-10 bg-gray-200 mx-2 flex-shrink-0"></div>
                 <button
                   onClick={() => setActiveScreen(Screen.ADMIN_DASHBOARD)}
                   className={`flex flex-col items-center justify-center py-3 px-4 min-w-[90px] rounded-xl transition-all duration-200 group ${activeScreen === Screen.ADMIN_DASHBOARD ? 'text-slate-900' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                 >
                   <span className={`material-symbols-outlined text-[28px] mb-1 ${activeScreen === Screen.ADMIN_DASHBOARD ? 'fill-current' : ''}`}>admin_panel_settings</span>
                   <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                     Quản trị
                   </span>
                   {activeScreen === Screen.ADMIN_DASHBOARD && <div className="h-1 w-6 bg-slate-900 rounded-full mt-1"></div>}
                 </button>
              </>
            )}
          </nav>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {renderScreen()}
        </div>
      </main>

      <footer className="bg-[#2563eb] border-t border-blue-500 py-1.5 sm:py-2 text-center text-white mt-auto">
        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap px-2">
          <a href="https://tieuquangthach.netlify.app/" className="text-[9px] sm:text-[11px] font-black tracking-tight hover:opacity-90 whitespace-nowrap">
            https://tieuquangthach.netlify.app
          </a>
          <span className="hidden sm:inline text-blue-300 text-[11px]">-</span>
          <p className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-blue-100 whitespace-nowrap">
            GIÚP EM LUYỆN TOÁN MỖI NGÀY
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
