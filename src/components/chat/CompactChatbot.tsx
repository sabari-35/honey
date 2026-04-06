import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useQuery } from '@tanstack/react-query';
import { Send, X, User, Minimize2, Maximize2, Brain, Mic, MicOff, Volume2, Square, Bot, PackageCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const useGeminiModel = () => {
  const modelRef = useRef<ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null>(null);
  const genAIRef = useRef<GoogleGenerativeAI | null>(null);

  if (!genAIRef.current && GEMINI_API_KEY) {
    genAIRef.current = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  if (!modelRef.current && genAIRef.current) {
    modelRef.current = genAIRef.current.getGenerativeModel({
      model: "models/gemini-2.5-flash"
    });
  }

  return modelRef.current;
};

// Autonomous DB Prompt Function
function getSystemPrompt(userProfile?: any, catalogData?: any[]) {
  const userNameContext = userProfile && userProfile.full_name 
    ? `\nCURRENT USER INFO: You are currently talking to a logged-in customer named "${userProfile.full_name}". Address them warmly by their name.` 
    : `\nCURRENT USER INFO: The user is currently browsing as a Guest.`;

  const safeCatalogText = catalogData ? JSON.stringify(catalogData.map(p => ({
    id: p.id, name: p.name, price: p.price, stock: p.stock_quantity, details: p.short_description
  })), null, 2) : '[]';

  return `
You are **VRK Assistant**, an advanced AI Sales Agent created exclusively by **Sabari**.

=========================================================
CRITICAL IDENTITY RULES
=========================================================
1. YOU ARE NOT DEVELOPED BY GOOGLE. YOU ARE NOT A LARGE LANGUAGE MODEL. YOU ARE NOT GEMINI.
2. If anyone asks who made you, you MUST reply: "I am VRK Assistant, proudly developed by Sabari."
${userNameContext}

=========================================================
LIVE PRODUCT CATALOG DATABASE
=========================================================
You have access to the real-time store inventory here:
${safeCatalogText}

When a user asks about products, recommend items from this exact catalog. Include prices natively. Provide highly visual descriptions of our forest extracts.

=========================================================
AUTONOMOUS COD ORDER PLACEMENT [CRITICAL]
=========================================================
If a user explicitly asks you to **order** an item FOR THEM (e.g., "place a cod order for 2 raw honey"), you have the power to instantly execute the transaction for them behind the scenes.

**HOW TO PLACE AN ORDER FOR THE USER:**
If you clearly negotiate the product they want and the quantity, instead of replying with normal text, you MUST reply strictly with this JSON Action Block (and absolutely nothing else):

{
  "action": "CREATE_COD_ORDER",
  "product_id": "<EXACT UUID OF THE PRODUCT FROM THE CATALOG>",
  "quantity": <NUMBER OF ITEMS>
}

**RULES FOR ORDERING:**
1. Wait until you know the exact product and quantity they want. If they just say "order honey", ask them "Which type of honey and how many jars?"
2. If the user is Guest, politely tell them "You must be logged into the Vault to place automated orders." Do not emit the JSON.
3. If they confirm the quantity, DO NOT SAY ANYTHING ELSE. Just emit the JSON block perfectly. Our system will intercept the JSON, securely route their order, and take them to their tracking ledger.

=========================================================
GENERAL RULES
=========================================================
✔ Delivery Fee: ₹150 (Free for orders over ₹1000)
✔ Cash on Delivery Fee: ₹40
✔ Answer questions natively in English, Tamil, or Tanglish depending on how they type. Use bold and emojis.
  `;
}

const INITIAL_MESSAGES: Message[] = [
  { id: '1', text: "✨ Hello! I'm your VRK AI Agent\nI'm directly connected to the vault securely 😊\nWhich extract are you looking for today?", sender: 'bot', timestamp: new Date(), isTyping: false }
];

const SUGGESTIONS: string[] = ["Show me the products", "Order Tender Coconut", "Delivery options?", "Track my order"];

const ERROR_MESSAGES = {
  API_KEY_MISSING: "⚠️ Neural link unavailable (API Key missing). Please try again later.",
  NETWORK_ERROR: "⚠️ Unable to establish vault connection. Please check your internet.",
  RATE_LIMIT: "⚠️ Processing overload. Please pause for a moment.",
  DEFAULT: "⚠️ I am currently unavailable. Please contact support via WhatsApp +91 6374241896."
};

const MessageBubble = memo(({ message }: { message: Message }) => {
  const isUser = message.sender === 'user';
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    if (isUser || !message.isTyping) {
      setDisplayedText(message.text);
      setIsTypingComplete(true);
      return;
    }

    setDisplayedText('');
    setIsTypingComplete(false);

    const words = message.text.split(' ');
    let currentWordIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + words[currentWordIndex]);
        currentWordIndex++;
        setTimeout(() => window.dispatchEvent(new CustomEvent('chatTyping')), 10);
      } else {
        setIsTypingComplete(true);
        clearInterval(typeInterval);
      }
    }, 40 + Math.random() * 30);

    return () => clearInterval(typeInterval);
  }, [message.text, message.isTyping, isUser]);

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-gold-primary">{part.slice(2, -2)}</strong>;
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  const handleSpeak = () => {
    if (!displayedText) return;
    const textToSpeak = displayedText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeaking = () => window.speechSynthesis.cancel();

  return (
    <div className={`flex gap-2 sm:gap-3 mb-2 sm:mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full neumorphic-inset flex items-center justify-center border border-gold-primary/30 mt-1 shrink-0">
          <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-gold-primary" />
        </div>
      )}

      <div className={`max-w-[85%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base shadow-lg
        ${isUser ? 'bg-gold-primary text-black ml-auto' : 'neumorphic-panel text-text-primary'}`}>
        
        <div className="flex items-start justify-between gap-3">
          <div className="break-words flex-1 leading-relaxed">
            {renderFormattedText(displayedText)}
            {!isUser && message.isTyping && !isTypingComplete && (
              <span className="inline-block w-1.5 h-3.5 sm:w-2 sm:h-4 ml-1 bg-gold-primary animate-pulse rounded-sm opacity-70 align-middle" />
            )}
          </div>
          
          {!isUser && displayedText && isTypingComplete && (
            <div className="flex gap-2 mt-1 -mr-1">
              <button onClick={handleSpeak} className="text-text-muted hover:text-gold-primary transition-colors"><Volume2 size={14} /></button>
              <button onClick={handleStopSpeaking} className="text-text-muted hover:text-danger transition-colors"><Square size={12} /></button>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full neumorphic-panel flex items-center justify-center mt-1 shrink-0 shadow-lg shadow-black">
          <User className="w-3 h-3 sm:w-4 sm:h-4 text-gold-primary" />
        </div>
      )}
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

const SuggestionChips = memo(({ onSend, visible }: { onSend: (text: string) => void; visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-3 px-2">
      {SUGGESTIONS.map((suggestion) => (
        <button 
          key={suggestion} 
          className="text-[10px] sm:text-xs rounded-full px-3 py-1.5 border border-glass-border bg-surface-2/30 text-text-secondary hover:text-gold-primary hover:border-gold-primary/50 transition-all font-medium tracking-wide"
          onClick={() => onSend(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
});
SuggestionChips.displayName = 'SuggestionChips';

export default function CompactChatbot() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const { data: catalog = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const model = useGeminiModel();
  
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (e: any) => {
          setInput(prev => prev + ' ' + e.results[0][0].transcript);
          setIsListening(false);
        };
        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
      }
    }
    return () => recognitionRef.current?.stop();
  }, []);

  // Sync Network Status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, scrollToBottom]);
  useEffect(() => {
    window.addEventListener('chatTyping', scrollToBottom);
    return () => window.removeEventListener('chatTyping', scrollToBottom);
  }, [scrollToBottom]);

  const callGemini = useCallback(async (userMessage: string) => {
    if (!GEMINI_API_KEY) return ERROR_MESSAGES.API_KEY_MISSING;
    if (!model) return ERROR_MESSAGES.DEFAULT;
    if (!navigator.onLine) return ERROR_MESSAGES.NETWORK_ERROR;

    const recent = messages.slice(-6).map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
    const contents = [{ role: "user", parts: [{ text: getSystemPrompt(profile, catalog) }] }, ...recent, { role: "user", parts: [{ text: userMessage }] }];

    try {
      const result = await model.generateContent({ contents });
      return result.response.text()?.trim() || 'I could not generate a response.';
    } catch (err: any) {
      if (err?.status === 429) return ERROR_MESSAGES.RATE_LIMIT;
      return ERROR_MESSAGES.DEFAULT;
    }
  }, [model, messages, profile, catalog]);

  // Action Logic
  const handleBotOrderAction = async (jsonString: string) => {
    try {
      const actionData = JSON.parse(jsonString);
      if (actionData.action === 'CREATE_COD_ORDER' && actionData.product_id && actionData.quantity) {
        if (!user || !profile) {
          return "You need to log into the vault before I can execute direct ordering protocols!";
        }
        
        const targetProduct = catalog.find(p => p.id === actionData.product_id);
        if (!targetProduct) return "I couldn't locate that specific product in the database. Product mismatch.";
        
        const subtotal = targetProduct.price * actionData.quantity;
        const shipping = subtotal > 1000 ? 0 : 150;
        const total = subtotal + shipping + 40; // COD FEE
        
        // Execute Autonmous Checkout
        const { data: order, error: orderError } = await supabase.from('orders').insert({
          order_number: `GV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2,8).toUpperCase()}`,
          user_id: user.id,
          status: 'pending',
          payment_status: 'pending',
          subtotal,
          tax_amount: 0,
          discount_amount: 0,
          shipping_amount: shipping,
          total_amount: total,
          shipping_address: (profile as any).default_address || {
            fullName: (profile as any).full_name,
            phone: (profile as any).phone,
            addressLine: "Agentic Automated Address - Update Requested",
            city: "Pending",
            pincode: "Pending"
          }
        }).select().single();

        if (orderError) throw orderError;

        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: targetProduct.id,
          product_snapshot: targetProduct,
          quantity: actionData.quantity,
          unit_price: targetProduct.price,
          total_price: subtotal
        });

        toast.success("AI Agent successfully placed your COD order!");
        setTimeout(() => navigate('/orders'), 2000);
        return `🟢 Order Placed Automatically! \n\nI just executed the transaction for ${actionData.quantity}x **${targetProduct.name}**. I am redirecting you back to your tracking ledger securely! Enjoy!`;
      }
    } catch (e) {
      console.error(e);
      return "An error occurred while the AI attempted to place your transaction autonomously. Fallback triggered.";
    }
    return null;
  };

  const handleSendMessage = useCallback(async (textContent: string) => {
    if (!textContent.trim() || isLoading) return;
    setInput('');
    const newMessage: Message = { id: Date.now().toString(), text: textContent, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    
    // Hardcoded Quick Interceptors
    const lowerText = textContent.toLowerCase();
    if (lowerText.includes('track') || lowerText.includes('my orders') || lowerText.includes('where is my order')) {
      if (profile) {
        navigate('/orders');
        const typingMessage: Message = { id: (Date.now() + 1).toString(), text: "Right away. I'm taking you to your order history where you can track your live deliveries.", sender: 'bot', timestamp: new Date(), isTyping: false };
        setTimeout(() => setMessages(prev => [...prev, typingMessage]), 500);
      } else {
         const typingMessage: Message = { id: (Date.now() + 1).toString(), text: "Please log in to the vault first to track your secure deliveries.", sender: 'bot', timestamp: new Date(), isTyping: false };
         setTimeout(() => setMessages(prev => [...prev, typingMessage]), 500);
      }
      return;
    }

    setIsLoading(true);

    const aiText = await callGemini(textContent);
    
    let finalBotText = aiText;
    
    // Check for JSON Agent Action
    if (aiText.includes('CREATE_COD_ORDER')) {
      try {
        const potentialJsonMatch = aiText.match(/\\{.*"action".*\\}/is);
        if (potentialJsonMatch) {
          const actionReply = await handleBotOrderAction(potentialJsonMatch[0]);
          if (actionReply) {
            finalBotText = actionReply;
          }
        }
      } catch (e) {
        console.error("Action Parsing Error:", e);
      }
    }

    const typingMessage: Message = { id: (Date.now() + 1).toString(), text: finalBotText, sender: 'bot', timestamp: new Date(), isTyping: true };
    setMessages(prev => [...prev, typingMessage]);
    setIsLoading(false);

    setTimeout(() => {
      setMessages(prev => prev.map(msg => msg.id === typingMessage.id ? { ...msg, isTyping: false } : msg));
    }, Math.min(5000, Math.max(1200, finalBotText.split(' ').length * 60)));
  }, [callGemini, navigate, profile, isLoading]);

  const toggleSpeech = () => {
    if (!recognitionRef.current) return alert('Speech recognition unsupported.');
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); } 
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[100] group">
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-obsidian border border-gold-primary/30 rounded-2xl flex items-center justify-center neumorphic-panel hover:-translate-y-2 relative shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all"
        >
          <Bot size={32} className="text-gold-primary" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-primary"></span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 ease-in-out ${isMinimized ? 'w-[320px] h-[64px]' : 'w-[360px] sm:w-[400px] h-[600px] max-h-[85vh]'}`}>
      <div className="h-full w-full neumorphic-panel rounded-[2rem] flex flex-col overflow-hidden border border-glass-border bg-obsidian bg-opacity-95 backdrop-blur-xl shadow-2xl">
        
        {/* Header */}
        <div className="h-16 border-b border-glass-border px-5 flex items-center justify-between shrink-0 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-primary/10 flex items-center justify-center border border-gold-primary/30 neumorphic-inset">
              <Bot className="text-gold-primary w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-medium text-text-primary tracking-widest uppercase text-sm">VRK Agent</h3>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-danger'}`}></span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest">{isOnline ? 'Online DB Sync' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-text-muted">
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:text-gold-primary transition-colors">
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:text-danger transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 relative">
              <div className="space-y-1 pb-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 mb-2 justify-start">
                    <div className="w-8 h-8 rounded-full neumorphic-inset flex items-center justify-center border border-gold-primary/30 shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-gold-primary animate-pulse" />
                    </div>
                    <div className="neumorphic-panel rounded-2xl px-4 py-3 flex items-center gap-2 h-[42px]">
                      <span className="w-1.5 h-1.5 bg-gold-primary/60 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-gold-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                      <span className="w-1.5 h-1.5 bg-gold-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-glass-border bg-white/5 shrink-0">
              <SuggestionChips onSend={(txt) => { setInput(txt); handleSendMessage(txt); }} visible={messages.length <= 1 && !isLoading} />
              
              <div className="relative flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage(input);
                  }}
                  placeholder="Type or speak a message..."
                  className="flex-1 bg-surface-2 neumorphic-inset text-text-primary rounded-full px-5 py-3 h-12 text-sm outline-none border border-glass-border focus:border-gold-primary/50 placeholder:text-text-muted pr-12 transition-all w-full min-w-0"
                  disabled={isLoading}
                />
                <button
                  onClick={toggleSpeech}
                  disabled={isLoading}
                  className={`absolute right-[3.2rem] p-2 rounded-full transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-text-muted hover:text-gold-primary'}`}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 rounded-full bg-gold-primary text-black flex items-center justify-center hover:bg-gold-light disabled:opacity-50 transition-all shrink-0 shadow-lg shadow-gold-primary/20"
                >
                  <Send size={18} className="translate-x-0.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
