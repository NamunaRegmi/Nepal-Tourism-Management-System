import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, MapPin, Calendar, Utensils, Mountain, RefreshCw } from 'lucide-react';
import { chatService } from '@/services/api';
import './Chatbot.css';

const QUICK_PROMPTS = [
  { label: 'Best time to visit', icon: Calendar },
  { label: 'Top destinations', icon: MapPin },
  { label: 'Trekking routes', icon: Mountain },
  { label: 'Nepali food', icon: Utensils },
];

function formatMessage(text) {
  return text
    .split('\n')
    .map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `<span key="${i}">${bold}</span>`;
    })
    .join('<br/>');
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleOpenChatbot = () => { setIsOpen(true); setIsMinimized(false); };
    window.addEventListener('openChatbot', handleOpenChatbot);
    return () => window.removeEventListener('openChatbot', handleOpenChatbot);
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      text,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const sendToAI = async (userText) => {
    const userMsg = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    const newHistory = [...history, { role: 'user', content: userText }];

    try {
      const res = await chatService.sendMessage(userText, history);
      const reply = res.data.reply;
      addBotMessage(reply);
      setHistory([...newHistory, { role: 'assistant', content: reply }]);
    } catch {
      addBotMessage("Sorry, I couldn't connect to the AI. Please try again in a moment.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    const text = inputMessage.trim();
    if (!text || isTyping) return;
    sendToAI(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setHistory([]);
  };

  return (
    <>
      {/* Toggle button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-300 relative"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              AI
            </span>
          </button>
        )}
      </div>

      {/* Chat window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isMinimized ? 'w-80 h-14' : 'w-[380px] h-[600px]'} flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-blue-100`}>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Nepal Tourism AI</p>
                {!isMinimized && (
                  <p className="text-[10px] text-blue-200">Powered by Groq · Always online</p>
                )}
              </div>
              <span className="w-2 h-2 bg-emerald-400 rounded-full ml-1 animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && messages.length > 0 && (
                <button onClick={handleClear} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-colors" title="Clear chat">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => setIsMinimized(s => !s)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bot className="h-7 w-7 text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-semibold text-sm">Namaste! 🙏</p>
                    <p className="text-gray-500 text-xs mt-1 max-w-[220px] mx-auto">
                      Ask me anything about Nepal — destinations, trekking, food, visa, culture and more!
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      {QUICK_PROMPTS.map(({ label, icon: Icon }) => (
                        <button
                          key={label}
                          onClick={() => sendToAI(label)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left shadow-sm"
                        >
                          <Icon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && (
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                    )}
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.sender === 'bot' ? (
                        <div
                          className="whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                        />
                      ) : (
                        <p>{msg.text}</p>
                      )}
                      <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-gray-400'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-100 p-3 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about Nepal..."
                    rows={1}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none max-h-24 leading-relaxed"
                    style={{ minHeight: '42px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputMessage.trim() || isTyping}
                    className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
