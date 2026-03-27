import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Mic, ChevronDown } from "lucide-react";

const suggestions = [
  "Check my balance",
  "Send money to Tigist",
  "Pay my electricity bill",
  "How do I upgrade my KYC?",
  "What is my loan limit?",
];

const botReplies: Record<string, string> = {
  "check my balance": "Your main wallet balance is **ETB 12,450.00**. Savings wallet: **ETB 5,200**. You also have **1,240 Global Points** 🌟",
  "send money": "Sure! To send money, tap the **Send Money** quick action on your home screen, or tell me: *who* and *how much* — e.g., 'Send ETB 500 to Tigist'",
  "pay": "I can help you pay bills! Which service? **Ethio Telecom, Electricity, Water, EthioSat TV, or others?** Say the name and I'll get you there.",
  "kyc": "To upgrade from **KYC Level 1 to Level 2**, go to **Profile → Upgrade KYC** and have your National ID front/back and a selfie ready. It takes about 5 minutes! ✅",
  "loan": "Based on your activity, you're eligible for up to **ETB 8,000** through Global Micro-Loan. Your AI credit score is **78/100 (Excellent)**. Go to **Home → Micro-Loan** to apply!",
  "default": "I'm Global AI, your financial assistant! I can help you **send money**, **pay bills**, **check your balance**, manage **savings goals**, or apply for a **micro-loan**. How can I help? 😊",
};

const getReply = (msg: string): string => {
  const lower = msg.toLowerCase();
  for (const [key, reply] of Object.entries(botReplies)) {
    if (key !== "default" && lower.includes(key)) return reply;
  }
  return botReplies.default;
};

interface Message {
  from: "user" | "bot";
  text: string;
  time: string;
}

const TesfaAI = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "Hi! I'm **Global AI** 🤖 Your intelligent financial assistant for GlobalPay. I speak Amharic and English. How can I help you today?", time: "Now" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(prev => [...prev, { from: "user", text: msg, time: "Now" }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { from: "bot", text: getReply(msg), time: "Now" }]);
    }, 900);
  };

  const renderText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="text-gold">{part}</strong> : part
    );
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Global AI Assistant"
        className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-gold shadow-gold flex items-center justify-center transition-transform active:scale-95 hover:scale-110 ${open ? "hidden" : ""}`}
      >
        <Sparkles className="w-6 h-6 text-tesfa-dark" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">1</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed left-1/2 -translate-x-1/2 w-full max-w-md z-50 animate-slide-up"
          style={{ bottom: "72px" }}
        >
          <div
            className="glass border border-border rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "70dvh" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/10 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-tesfa-dark" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Global AI</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground">Online · Amharic & English</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close Global AI"
                className="p-2 glass rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                    msg.from === "user"
                      ? "bg-gradient-gold text-tesfa-dark rounded-br-sm"
                      : "glass text-foreground rounded-bl-sm"
                  }`}>
                    {renderText(msg.text)}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            <div className="px-4 pb-2 flex-shrink-0">
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="flex-shrink-0 glass text-xs px-3 py-1.5 rounded-xl text-muted-foreground hover:text-gold hover:border-tesfa-gold/30 border border-border transition-colors min-h-[36px]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border flex-shrink-0">
              <input
                ref={inputRef}
                className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground min-h-[44px]"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button
                aria-label="Voice input"
                className="p-2.5 glass rounded-xl text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => send()}
                aria-label="Send message"
                className="p-2.5 bg-gradient-gold rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Send className="w-4 h-4 text-tesfa-dark" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TesfaAI;
