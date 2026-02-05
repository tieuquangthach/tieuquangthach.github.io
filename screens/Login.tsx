
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { NguoiDung } from '../types';
import { LOGO_URL } from '../constants';

interface LoginProps {
  onLogin: (user: NguoiDung) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanUsername = username.trim().toLowerCase();

    try {
      const { data: dbUser, error: fetchError } = await supabase
        .from('nguoi_dung')
        .select('*')
        .eq('username', cleanUsername)
        .eq('password', password)
        .single();

      if (fetchError || !dbUser) {
        throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
      }

      const mappedUser: NguoiDung = {
        id: dbUser.id,
        username: dbUser.username,
        vaiTro: dbUser.vai_tro
      };

      onLogin(mappedUser);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanClass = className.trim();

    if (!cleanUsername || !password || !cleanName || !cleanClass) {
        setError("Vui lòng điền đầy đủ thông tin.");
        setLoading(false);
        return;
    }

    try {
        // 1. Kiểm tra username tồn tại
        const { data: existingUser } = await supabase
            .from('nguoi_dung')
            .select('id')
            .eq('username', cleanUsername)
            .maybeSingle();

        if (existingUser) {
            throw new Error("Tên đăng nhập này đã được sử dụng.");
        }

        // 2. Tạo tài khoản người dùng
        const { data: newUser, error: userError } = await supabase
            .from('nguoi_dung')
            .insert([{ username: cleanUsername, password: password, vai_tro: 'hocSinh' }])
            .select()
            .single();

        if (userError) throw userError;

        // 3. Tạo hồ sơ học sinh
        const { error: profileError } = await supabase
            .from('hoc_sinh')
            .insert([{
                ten: cleanName,
                lop: cleanClass,
                user_id: newUser.id,
                username: cleanUsername,
                nhan_xet: "Chào mừng em đến với Math.TQT"
            }]);

        if (profileError) {
            // Xóa user nếu tạo profile thất bại để tránh rác
            await supabase.from('nguoi_dung').delete().eq('id', newUser.id);
            throw new Error("Lỗi tạo hồ sơ học sinh: " + profileError.message);
        }

        alert("Đăng ký thành công! Em hãy đăng nhập ngay nhé.");
        setIsRegistering(false);
        setPassword('');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-8 md:p-12 animate-fadeIn border border-gray-100">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-lg font-bold text-slate-400 tracking-tight mb-4">Chào mừng em đến với</h2>
          
          {/* Logo Badge */}
          <div className="mb-8 relative group cursor-default">
            <div className="w-40 h-40 bg-white rounded-[2.5rem] flex items-center justify-center shadow-[0_10px_30px_rgba(37,99,235,0.2)] border-[5px] border-[#2563eb] relative z-10 transition-transform group-hover:scale-105 duration-500 overflow-hidden p-2">
                <img 
                  src={LOGO_URL} 
                  alt="Math.TQT Logo" 
                  className="w-full h-full object-contain drop-shadow-sm" 
                  onError={(e) => {
                    // Fallback cực giản nếu ảnh lỗi
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-blue-50');
                    e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-6xl text-blue-600">school</span>';
                  }}
                />
            </div>
            {/* Các ký hiệu toán học trang trí */}
            <div className="absolute top-0 right-0 w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center border-4 border-white text-white font-serif font-bold text-xl shadow-lg z-20 animate-bounce">π</div>
            <div className="absolute bottom-0 left-0 w-10 h-10 bg-teal-400 rounded-full flex items-center justify-center border-4 border-white text-white font-serif font-bold text-xl shadow-lg z-20 animate-bounce [animation-delay:0.5s]">√</div>
          </div>

          {/* Logo Brand Block */}
          <div className="flex flex-col items-center w-full">
            <a href="https://tieuquangthach.netlify.app/" className="text-2xl sm:text-3xl font-black text-[#2563eb] tracking-tight hover:opacity-80 transition-opacity text-center mb-3">
              tieuquangthach.netlify.app
            </a>
            
            <div className="bg-[#2563eb] w-full py-3 rounded-full shadow-lg shadow-blue-200/50 flex items-center justify-center">
              <p className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.1em] whitespace-nowrap">
                GIÚP EM LUYỆN TOÁN MỖI NGÀY
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          {isRegistering && (
            <>
                <div className="space-y-2 animate-fadeIn">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                    <input 
                    type="text" 
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-200 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    />
                </div>
                <div className="space-y-2 animate-fadeIn">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lớp</label>
                    <input 
                    type="text" 
                    required
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-200 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    placeholder="Ví dụ: 9A"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    />
                </div>
            </>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
            <input 
              type="text" 
              required
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-200 transition-all font-bold text-slate-700 placeholder:text-slate-300"
              placeholder="Ví dụ: nguyenvana"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
            <input 
              type="password" 
              required
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-200 transition-all font-bold text-slate-700 placeholder:text-slate-300"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-5 rounded-[1.5rem] text-white font-black text-lg shadow-2xl shadow-blue-100 transition-all active:scale-[0.97] mt-4 flex items-center justify-center gap-3 ${loading ? 'bg-slate-400 cursor-wait' : 'bg-[#2563eb] hover:bg-blue-700'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isRegistering ? 'Đăng ký tài khoản' : 'Đăng nhập ngay'}</span>
                <span className="material-symbols-outlined text-xl">{isRegistering ? 'person_add' : 'login'}</span>
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center space-y-4">
            <button 
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError(null);
                    setPassword('');
                }}
                className="text-sm font-bold text-slate-500 hover:text-[#2563eb] transition-colors"
            >
                {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
            
            <p className="text-xs font-bold text-slate-400 pt-4 border-t border-slate-50 tracking-wide">Thiết kế bởi: Tiêu Quang Thạch</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
