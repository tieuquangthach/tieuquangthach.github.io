
import React, { useState, useRef, useEffect } from 'react';
import { AppData, PhieuBaiTap } from '../types';
import { supabase } from '../services/supabaseClient';

interface AdminWorksheetsProps {
  data: AppData;
  onRefresh: () => void;
  onCreateNew: (grade?: string) => void;
  onViewWorksheet: (worksheet: PhieuBaiTap) => void;
  worksheetType?: 'Luyện tập' | 'Tự luyện' | 'Tự luận'; // Update prop type
  readOnly?: boolean; // Chế độ chỉ xem dành cho học sinh
  userGrade?: string; // Khối lớp cố định của người dùng (nếu là học sinh)
}

const AdminWorksheets: React.FC<AdminWorksheetsProps> = ({ 
  data, 
  onRefresh, 
  onCreateNew, 
  onViewWorksheet,
  worksheetType = 'Luyện tập', // Mặc định là Luyện tập nếu không truyền
  readOnly = false,
  userGrade
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // State cho Modal xác nhận xóa
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

  // Modal States
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Upload States
  const [uploadName, setUploadName] = useState('');
  const [uploadGrade, setUploadGrade] = useState('6');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect: Nếu có userGrade (Học sinh), tự động chọn lớp đó và không cho thoát ra
  useEffect(() => {
    if (userGrade) {
      setSelectedGrade(userGrade);
    }
  }, [userGrade]);

  // Xác định category hiện tại để lọc và lưu
  let currentCategory = 'Luyện tập';
  let themeHex = '#0f9d86';
  let hoverHex = '#0d8a75';
  let lightBg = '#f0fdfa';

  if (worksheetType === 'Tự luyện') {
      currentCategory = 'Tự luyện';
      themeHex = '#10b981';
      hoverHex = '#059669';
      lightBg = '#ecfdf5';
  } else if (worksheetType === 'Tự luận') {
      currentCategory = 'Tự luận';
      themeHex = '#e11d48'; // Rose-600
      hoverHex = '#be123c'; // Rose-700
      lightBg = '#fff1f2'; // Rose-50
  }

  // Lọc phiếu bài tập theo loại và tìm kiếm
  const filteredWorksheets = data.danhSachPhieuBaiTap.filter(w => {
    // Logic lọc loại phiếu:
    let isCorrectType = false;
    if (worksheetType === 'Tự luyện') {
        isCorrectType = (w.monHoc === 'Tự luyện' || w.monHoc === 'Củng cố');
    } else if (worksheetType === 'Tự luận') {
        isCorrectType = w.monHoc === 'Tự luận';
    } else {
        // Luyện tập (Mặc định)
        isCorrectType = (w.monHoc === 'Toán' || w.monHoc === 'Luyện tập');
    }

    // Logic lọc lớp: Nếu có selectedGrade (hoặc userGrade) thì phải khớp
    const matchesGrade = selectedGrade ? w.lop === selectedGrade : true;
    
    const matchesSearch = w.tenPhieu.toLowerCase().includes(searchTerm.toLowerCase());
    
    return isCorrectType && matchesGrade && matchesSearch;
  });

  // Đếm số lượng phiếu cho Folder View (chỉ đếm phiếu đúng loại)
  const gradeCounts = ['6', '7', '8', '9'].reduce((acc, grade) => {
    acc[grade] = data.danhSachPhieuBaiTap.filter(w => {
        let isCorrectType = false;
        if (worksheetType === 'Tự luyện') isCorrectType = (w.monHoc === 'Tự luyện' || w.monHoc === 'Củng cố');
        else if (worksheetType === 'Tự luận') isCorrectType = w.monHoc === 'Tự luận';
        else isCorrectType = (w.monHoc === 'Toán' || w.monHoc === 'Luyện tập');
        
        return w.lop === grade && isCorrectType;
    }).length;
    return acc;
  }, {} as Record<string, number>);

  // --- HANDLERS ---
  const handleCreateClick = () => {
    if (readOnly) return;
    if (selectedGrade) setUploadGrade(selectedGrade);
    setShowOptionModal(true);
  };

  const handleSelectAI = () => {
    setShowOptionModal(false);
    onCreateNew(selectedGrade || undefined);
  };

  const handleSelectUpload = () => {
    setShowOptionModal(false);
    setShowUploadModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Tự động điền tên phiếu bằng tên file (bỏ đuôi)
      if (!uploadName) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        setUploadName(nameWithoutExt);
      }
    }
  };

  const handleUploadSave = async () => {
    if (!uploadName || !selectedFile) {
      alert("Vui lòng nhập tên phiếu và chọn file!");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const base64Data = e.target?.result;
        
        const fileContent = {
          lessonName: uploadName,
          type: 'uploaded_file',
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          data: base64Data, 
          questions: [] 
        };

        const { error } = await supabase.from('phieu_bai_tap').insert([{
          ten_phieu: uploadName,
          lop: uploadGrade,
          mon_hoc: currentCategory, 
          noi_dung: fileContent
        }]);

        if (error) throw error;

        alert(`Tải lên phiếu ${worksheetType.toLowerCase()} thành công!`);
        setShowUploadModal(false);
        setUploadName('');
        setSelectedFile(null);
        onRefresh();
      };

      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      alert("Lỗi khi tải lên: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 1. Mở Modal xác nhận xóa
  const confirmDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (readOnly) return;
    setDeleteTarget({ id, name });
  };

  // 2. Thực hiện xóa sau khi xác nhận
  const executeDelete = async () => {
    if (!deleteTarget) return;

    const { id } = deleteTarget;
    setIsDeleting(id);
    setDeleteTarget(null); // Đóng modal ngay

    try {
      const { error } = await supabase.from('phieu_bai_tap').delete().eq('id', id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      alert("Lỗi khi xóa phiếu: " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  // Xử lý tải xuống file (Hỗ trợ cả File Upload và AI generated)
  const handleDownloadFile = (e: React.MouseEvent, worksheet: PhieuBaiTap) => {
    e.preventDefault();
    e.stopPropagation();

    const content = worksheet.noiDung;
    if (!content) {
        alert("Dữ liệu phiếu bị lỗi.");
        return;
    }

    // TRƯỜNG HỢP 1: File đã upload
    if (content.type === 'uploaded_file' && content.data) {
        const link = document.createElement("a");
        link.href = content.data;
        link.download = content.fileName || `${worksheet.tenPhieu}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }

    // TRƯỜNG HỢP 2: Phiếu tạo bằng AI -> Xuất ra HTML
    if (content.questions && content.questions.length > 0) {
        const questionsHtml = content.questions.map((q: any, index: number) => {
            let optionsHtml = '';
            if (q.type === 'multiple_choice' && q.options) {
                optionsHtml = `<div style="margin-left: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${q.options.map((opt: string, i: number) => `<div><strong>${String.fromCharCode(65 + i)}.</strong> ${opt}</div>`).join('')}
                </div>`;
            } else if (q.type === 'true_false') {
                 optionsHtml = `<div style="margin-left: 20px;">[ Đúng ] / [ Sai ]</div>`;
            }

            return `
                <div style="margin-bottom: 20px; page-break-inside: avoid;">
                    <p><strong>Câu ${index + 1} (${q.level}):</strong> ${q.question}</p>
                    ${optionsHtml}
                </div>
            `;
        }).join('');

        const answersHtml = content.questions.map((q: any, index: number) => {
            return `<p><strong>Câu ${index + 1}:</strong> ${q.correctAnswer} <br/> <i style="color: #666;">Giải thích: ${q.explanation}</i></p>`;
        }).join('');

        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${worksheet.tenPhieu}</title>
                <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
                <style>
                    body { font-family: 'Times New Roman', serif; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1 { text-align: center; color: #2563eb; }
                    .header-info { text-align: center; margin-bottom: 30px; font-style: italic; color: #555; }
                    .section-title { border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-top: 40px; margin-bottom: 20px; color: #2563eb; }
                </style>
            </head>
            <body>
                <h1>${content.lessonName || worksheet.tenPhieu}</h1>
                <div class="header-info">
                    Môn: ${worksheet.monHoc} - Lớp: ${worksheet.lop} <br/>
                    Ngày tạo: ${new Date(worksheet.ngayTao).toLocaleDateString('vi-VN')}
                </div>

                <h2 class="section-title">I. ĐỀ BÀI</h2>
                ${questionsHtml}

                <div style="page-break-before: always;"></div>
                <h2 class="section-title">II. ĐÁP ÁN & HƯỚNG DẪN</h2>
                ${answersHtml}
            </body>
            </html>
        `;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${worksheet.tenPhieu}.html`; // Xuất ra HTML để giữ định dạng MathJax
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert("Phiếu này không có nội dung để tải xuống.");
    }
  };

  const renderContent = () => {
    // VIEW 1: FOLDER VIEW (Chỉ hiện nếu chưa chọn lớp)
    if (!selectedGrade) {
      return (
        <div className="space-y-10 animate-fadeIn pb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">
                {readOnly ? `Thư viện ${worksheetType}` : `Quản lý ${worksheetType}`}
              </h2>
              <p className="text-slate-400 font-medium">
                {readOnly ? `Kho bài tập và tài liệu ${worksheetType.toLowerCase()}.` : `Kho lưu trữ phiếu ${worksheetType.toLowerCase()} & tài liệu.`}
              </p>
            </div>
            {!readOnly && (
              <button 
                onClick={handleCreateClick}
                className={`bg-[${themeHex}] text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg hover:bg-[${hoverHex}] transition-all active:scale-95`}
                style={{ backgroundColor: themeHex }}
              >
                <span className="material-symbols-outlined text-xl">add_circle</span> Tạo phiếu mới
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {['6', '7', '8', '9'].map((grade) => {
              const count = gradeCounts[grade];
              return (
                <div 
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`
                    group relative p-8 rounded-[2rem] cursor-pointer transition-all duration-300 border h-64 flex flex-col justify-between
                    bg-white border-slate-100 hover:shadow-xl hover:-translate-y-1
                  `}
                  style={{ borderColor: count > 0 ? undefined : 'transparent' }}
                >
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100%] transition-colors"
                    style={{ backgroundColor: `rgba(${worksheetType === 'Tự luận' ? '225, 29, 72' : (worksheetType === 'Tự luyện' ? '16, 185, 129' : '15, 157, 134')}, 0.05)` }}
                  ></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400" style={{ color: themeHex }}>Khối Lớp</p>
                    <h3 className="text-6xl font-black text-slate-800 mt-2 transition-colors" style={{ color: themeHex }}>{grade}</h3>
                  </div>
                  <div className="relative z-10">
                     <div 
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                        style={{ 
                            backgroundColor: count > 0 ? themeHex : '#f1f5f9',
                            color: count > 0 ? 'white' : '#94a3b8'
                        }}
                     >
                        <span className="material-symbols-outlined text-lg">description</span>
                        {count} phiếu
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center py-10">
             <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Chọn một thư mục khối lớp để xem chi tiết</p>
          </div>
        </div>
      );
    }

    // VIEW 2: LIST VIEW (Hiện khi đã chọn lớp hoặc là Học sinh)
    return (
      <div className="space-y-8 animate-fadeIn pb-20">
        <div className="flex items-center gap-4">
          {/* Ẩn nút Back nếu userGrade được set (Học sinh) */}
          {!userGrade && (
            <button 
                onClick={() => { setSelectedGrade(null); setSearchTerm(''); }}
                className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-sm"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = themeHex; e.currentTarget.style.borderColor = themeHex; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
                <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              {userGrade ? `Tài liệu ${worksheetType} Lớp ${selectedGrade}` : `Thư mục Lớp ${selectedGrade}`}
              <span className="text-white text-sm px-3 py-1 rounded-lg align-middle shadow-md" style={{ backgroundColor: themeHex }}>{filteredWorksheets.length} phiếu</span>
            </h2>
            {userGrade && <p className="text-slate-400 font-medium text-sm">Danh sách phiếu bài tập dành riêng cho khối lớp của bạn.</p>}
          </div>
          {!readOnly && (
            <div className="ml-auto flex gap-3">
               <button 
                  onClick={handleCreateClick}
                  className="text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
                  style={{ backgroundColor: themeHex }}
                >
                  <span className="material-symbols-outlined">add</span> Thêm vào lớp {selectedGrade}
                </button>
            </div>
          )}
        </div>

        <div className="relative group max-w-full">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" style={{ color: themeHex }}>search</span>
            <input 
              type="text" 
              placeholder={`Tìm kiếm phiếu ${worksheetType} trong lớp ${selectedGrade}...`}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] outline-none font-bold text-slate-700 shadow-sm transition-all focus:ring-4"
              style={{  }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus={!userGrade}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorksheets.map((worksheet) => {
            const isFile = worksheet.noiDung?.type === 'uploaded_file';
            let icon = 'description';
            if (isFile) {
               if (worksheet.noiDung.fileType?.includes('pdf')) icon = 'picture_as_pdf';
               else if (worksheet.noiDung.fileType?.includes('image')) icon = 'image';
               else if (worksheet.noiDung.fileType?.includes('word')) icon = 'article';
               else icon = 'folder_zip';
            }

            // Logic nhãn
            let label = 'LUYỆN TẬP';
            let labelColors = 'bg-blue-100 text-blue-700 border-blue-200';

            if (worksheet.monHoc === 'Tự luyện' || worksheet.monHoc === 'Củng cố') {
                label = 'TỰ LUYỆN';
                labelColors = 'bg-emerald-100 text-emerald-700 border-emerald-200';
            } else if (worksheet.monHoc === 'Tự luận') {
                label = 'TỰ LUẬN';
                labelColors = 'bg-rose-100 text-rose-700 border-rose-200';
            }

            return (
              <div key={worksheet.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-2">
                       <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: lightBg, color: themeHex }}>
                          <span className="material-symbols-outlined">{icon}</span>
                       </div>
                       {/* Label Badge */}
                       <div className={`px-2 py-1 rounded-lg border flex items-center ${labelColors}`}>
                          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                       </div>
                   </div>
                   
                   <p className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                    {new Date(worksheet.ngayTao).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                
                <h3 className="text-lg font-black text-slate-800 transition-colors mb-3 line-clamp-2 leading-tight flex-1" style={{ color: undefined }} onMouseEnter={(e) => e.currentTarget.style.color = themeHex} onMouseLeave={(e) => e.currentTarget.style.color = ''}>
                  {worksheet.tenPhieu}
                </h3>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-6">
                   <span className="flex items-center gap-1">
                     <span className="material-symbols-outlined text-sm">list_alt</span>
                     {isFile ? 'Tài liệu' : `${worksheet.noiDung?.questions?.length || 0} câu`}
                   </span>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50 relative z-50">
                  <button 
                    type="button"
                    onClick={() => onViewWorksheet(worksheet)} 
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:text-white cursor-pointer"
                    style={{ backgroundColor: lightBg, color: themeHex }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = themeHex; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = lightBg; e.currentTarget.style.color = themeHex; }}
                  >
                    {readOnly ? 'Làm bài' : 'Mở phiếu'}
                  </button>
                  
                  {!readOnly && (
                    <>
                        {/* Nút Tải xuống (Dành cho Giáo viên: File hoặc AI) */}
                        <button 
                            type="button"
                            onClick={(e) => handleDownloadFile(e, worksheet)}
                            className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-md"
                            title="Tải xuống tài liệu"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                        </button>
                        
                        {/* Nút Xóa */}
                        <button 
                          type="button"
                          onClick={(e) => confirmDelete(e, worksheet.id, worksheet.tenPhieu)} 
                          disabled={isDeleting === worksheet.id} 
                          className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-md relative"
                          title="Xóa phiếu này"
                        >
                          {isDeleting === worksheet.id ? (
                            <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                          ) : (
                            <span className="material-symbols-outlined text-lg">delete</span>
                          )}
                        </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {filteredWorksheets.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl text-slate-300">folder_open</span>
               </div>
               <p className="font-black text-slate-400 uppercase tracking-widest">Thư mục Lớp {selectedGrade} trống</p>
               {!readOnly && (
                 <button onClick={handleCreateClick} className="mt-4 font-bold hover:underline text-sm" style={{ color: themeHex }}>+ Tạo phiếu đầu tiên</button>
               )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      
      {/* --- MODAL XÁC NHẬN XÓA --- */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-red-900/30 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border-t-8 border-red-500 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>

             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10">
                <span className="material-symbols-outlined text-4xl">delete_forever</span>
             </div>
             
             <h3 className="text-xl font-black text-slate-800 mb-2 relative z-10">Xác nhận xóa phiếu?</h3>
             <p className="text-sm text-slate-500 font-medium mb-6 relative z-10 leading-relaxed">
               Thầy có chắc chắn muốn xóa vĩnh viễn phiếu <br/>
               <span className="font-black text-slate-800">"{deleteTarget.name}"</span> không?
             </p>
             
             <div className="flex gap-3 relative z-10">
                <button 
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all"
                >
                  Đồng ý xóa
                </button>
             </div>
          </div>
        </div>
      )}

      {/* ... (Modals Tạo/Upload giữ nguyên) ... */}
      {showOptionModal && !readOnly && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden">
            <button onClick={() => setShowOptionModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600">
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            
            <h3 className="text-3xl font-black text-slate-800 text-center mb-2">Tạo phiếu {worksheetType.toLowerCase()} mới</h3>
            <p className="text-center text-slate-400 font-medium mb-10">Thầy muốn tạo phiếu theo cách nào?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: AI */}
              <button 
                onClick={handleSelectAI}
                className="group relative bg-[#f0fdfa] p-8 rounded-[2.5rem] border-2 border-transparent hover:bg-white hover:shadow-xl transition-all text-center flex flex-col items-center gap-4"
                style={{ borderColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = themeHex}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform" style={{ color: themeHex }}>
                  <span className="material-symbols-outlined text-4xl">auto_awesome</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800" style={{ color: undefined }} onMouseEnter={(e) => e.currentTarget.style.color = themeHex} onMouseLeave={(e) => e.currentTarget.style.color = ''}>Tạo bằng AI</h4>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">AI tự động soạn câu hỏi theo SGK.</p>
                </div>
              </button>

              {/* Option 2: Upload */}
              <button 
                onClick={handleSelectUpload}
                className="group relative bg-slate-50 p-8 rounded-[2.5rem] border-2 border-transparent hover:border-blue-500 hover:bg-white hover:shadow-xl transition-all text-center flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 group-hover:text-blue-600">Tải file lên</h4>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">Hỗ trợ PDF, Word, Ảnh, HTML.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && !readOnly && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden border-t-8" style={{ borderColor: themeHex }}>
             <button onClick={() => setShowUploadModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600">
               <span className="material-symbols-outlined text-3xl">close</span>
             </button>

             <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
               <span className="material-symbols-outlined" style={{ color: themeHex }}>upload_file</span> Tải tài liệu lên
             </h3>

             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên phiếu / Tài liệu</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700"
                    placeholder={`Ví dụ: ${worksheetType} Toán 9...`}
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thuộc Khối Lớp</label>
                  <div className="grid grid-cols-4 gap-2">
                     {['6','7','8','9'].map(g => (
                       <button 
                         key={g} 
                         onClick={() => setUploadGrade(g)}
                         className={`py-2 rounded-xl font-black text-sm transition-all`}
                         style={{ 
                            backgroundColor: uploadGrade === g ? themeHex : '#f8fafc',
                            color: uploadGrade === g ? 'white' : '#94a3b8'
                         }}
                       >
                         Lớp {g}
                       </button>
                     ))}
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn file</label>
                   <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${selectedFile ? 'bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                      style={{ borderColor: selectedFile ? '#3b82f6' : undefined }}
                   >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.html,.htm"
                        onChange={handleFileChange}
                      />
                      {selectedFile ? (
                        <div>
                           <span className="material-symbols-outlined text-4xl text-blue-600 mb-2">description</span>
                           <p className="font-bold text-blue-800 truncate px-4">{selectedFile.name}</p>
                           <p className="text-xs text-blue-400 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ) : (
                        <div>
                           <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">cloud_upload</span>
                           <p className="font-bold text-slate-500 text-sm">Nhấn để chọn file</p>
                           <p className="text-[10px] text-slate-400 mt-1">PDF, Word, Ảnh, HTML (Max 5MB)</p>
                        </div>
                      )}
                   </div>
                </div>

                <button 
                  onClick={handleUploadSave}
                  disabled={isUploading}
                  className="w-full py-4 text-white rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-3"
                  style={{ backgroundColor: themeHex }}
                >
                  {isUploading ? 'Đang tải lên...' : 'Lưu vào thư viện'}
                  {!isUploading && <span className="material-symbols-outlined">save_alt</span>}
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminWorksheets;
