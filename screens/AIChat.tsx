
import React, { useState, useRef, useEffect } from 'react';
import { askGemini } from '../services/geminiService';

interface Message {
  role: 'user' | 'bot';
  text: string;
  image?: string; // Add optional image field
}

const AIChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Xin chào! Tôi là MathPro AI. \nBạn có thể gửi ảnh đề bài hoặc ảnh bài làm của bạn để tôi kiểm tra lỗi sai và hướng dẫn giải nhé!' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg = input.trim();
    const userImage = selectedImage;
    
    // Clear inputs immediately
    setInput('');
    setSelectedImage(null);

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text: userMsg, image: userImage || undefined }]);
    setIsLoading(true);

    try {
      // Determine prompt if user didn't type text but sent an image
      const promptText = userMsg || (userImage ? "Hãy phân tích hình ảnh này và chỉ ra lỗi sai hoặc hướng dẫn giải." : "");
      
      const response = await askGemini(promptText, userImage || undefined);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Rất tiếc, đã có lỗi xảy ra. Hãy thử lại sau nhé!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] animate-fadeIn">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
           <span className="material-symbols-outlined text-blue-600">smart_toy</span> 
           Trợ lý AI Toán học
        </h2>
        <p className="text-gray-500 text-sm">Gửi ảnh bài tập để tìm lỗi sai hoặc nhận hướng dẫn giải chi tiết.</p>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative">
        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar pb-32">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[85%] md:max-w-[75%] flex flex-col gap-2
                ${msg.role === 'user' ? 'items-end' : 'items-start'}
              `}>
                {/* Image Bubble */}
                {msg.image && (
                  <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                    <img src={msg.image} alt="User upload" className="max-w-[250px] max-h-[250px] rounded-xl object-contain" />
                  </div>
                )}
                
                {/* Text Bubble */}
                {msg.text && (
                  <div className={`
                    px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-100 text-slate-800 rounded-tl-none'}
                  `}>
                    {msg.text}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area (Sticky Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-4 border-t border-slate-100">
          <div className="max-w-4xl mx-auto">
             {/* Image Preview Area */}
            {selectedImage && (
                <div className="mb-3 flex items-center gap-3 animate-fadeIn bg-slate-50 p-2 rounded-xl border border-slate-200 w-fit">
                <div className="relative group">
                    <img src={selectedImage} className="h-16 w-16 object-cover rounded-lg border border-white shadow-sm" />
                    <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-red-500 transition-colors"
                    >
                    <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                </div>
                <div className="pr-2">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Đã chọn ảnh</p>
                    <p className="text-xs text-blue-600 font-bold">Sẵn sàng gửi</p>
                </div>
                </div>
            )}

            <div className="flex items-end gap-2">
                <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                />
                
                <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 mb-0.5 bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-2xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0 border border-transparent hover:border-blue-100"
                title="Tải ảnh bài tập lên"
                >
                <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                </button>

                <div className="flex-1 bg-slate-100 hover:bg-white focus-within:bg-white border border-slate-200 focus-within:border-blue-300 rounded-2xl transition-all flex items-center px-4 py-2">
                    <textarea 
                        rows={1}
                        placeholder={selectedImage ? "Viết câu hỏi cho bức ảnh này..." : "Nhập câu hỏi toán học..."}
                        className="w-full bg-transparent outline-none text-slate-700 font-medium resize-none py-2 max-h-32 custom-scrollbar placeholder:text-slate-400"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                </div>
                
                <button 
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={`
                    w-12 h-12 mb-0.5 rounded-2xl flex items-center justify-center text-white transition-all shadow-md flex-shrink-0
                    ${isLoading || (!input.trim() && !selectedImage) 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-200'}
                `}
                >
                <span className="material-symbols-outlined text-xl">send</span>
                </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
