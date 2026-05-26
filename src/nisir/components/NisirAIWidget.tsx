import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useAuth } from '@nisir/hooks/useAuth';
import { useDailyBriefing } from '@nisir/hooks/useDailyBriefing';
import { getRouteForIntent } from '@nisir/components/copilot/intentRoutes';
import CopilotBriefing from '@nisir/components/copilot/CopilotBriefing';
import CopilotNavigationCard from '@nisir/components/copilot/CopilotNavigationCard';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, X, Send, Sparkles,
  Wallet, CreditCard, TrendingUp, Shield, PiggyBank,
  BarChart3, QrCode, Users, Calculator,
  Wand2, FileSearch, AlertTriangle, BookOpen,
  CalendarCheck, GraduationCap
} from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  labelAm: string;
  prompt: string;
  promptAm: string;
  isWizard?: boolean;
}

const RETAIL_QUICK_ACTIONS: QuickAction[] = [
  { icon: <Wallet className="h-3.5 w-3.5" />, label: 'Balance', labelAm: 'ቀሪ ሂሳብ', prompt: 'What is my current balance summary?', promptAm: 'የቀሪ ሂሳብ ማጠቃለያዬ ምንድን ነው?' },
  { icon: <Calculator className="h-3.5 w-3.5" />, label: 'Loan Cost', labelAm: 'የብድር ወጪ', prompt: '[CALC_INTEREST] I want to understand the true cost of a loan. Amount: 10000 ETB, Rate: 18%, Tenor: 12 months. Show me the full breakdown.', promptAm: '[CALC_INTEREST] የብድር ትክክለኛ ወጪ ማወቅ እፈልጋለሁ። መጠን: 10000 ብር, ተመን: 18%, ጊዜ: 12 ወር' },
  { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Scam Check', labelAm: 'ማጭበርበር ፍተሻ', prompt: '[SCAM_CHECK] I received a call saying I won a lottery and need to send ETB 500 to claim my prize. Is this legit?', promptAm: '[SCAM_CHECK] ሎተሪ አሸነፍክ ተብሎ ተደውሎልኝ 500 ብር ልክ ተብያለሁ። ይህ ትክክል ነው?' },
  { icon: <CalendarCheck className="h-3.5 w-3.5" />, label: 'Money Review', labelAm: 'የገንዘብ ግምገማ', prompt: '[MONTHLY_REVIEW] Generate my monthly financial health report card. Show me how I did last month with spending, savings, and loan payments.', promptAm: '[MONTHLY_REVIEW] ወርሃዊ የገንዘብ ጤና ሪፖርት ካርድ አዘጋጅልኝ።' },
  { icon: <Wand2 className="h-3.5 w-3.5" />, label: 'Apply Loan', labelAm: 'ብድር ማመልከት', prompt: '[WIZARD] I want to apply for a loan. Guide me step by step.', promptAm: '[WIZARD] ብድር ማመልከት እፈልጋለሁ። ደረጃ በደረጃ ምራኝ።', isWizard: true },
  { icon: <GraduationCap className="h-3.5 w-3.5" />, label: 'Explain Term', labelAm: 'ቃል አብራራ', prompt: '[EXPLAIN_CONCEPT] tier:2 term:interest rate — What does interest rate really mean for my loan?', promptAm: '[EXPLAIN_CONCEPT] tier:2 term:interest rate — የወለድ ተመን ለብድሬ ምን ማለት ነው?' },
  { icon: <PiggyBank className="h-3.5 w-3.5" />, label: 'Savings Tips', labelAm: 'የቁጠባ ምክር', prompt: 'Give me personalized savings tips based on common Ethiopian financial goals', promptAm: 'በተለመዱ የኢትዮጵያ የገንዘብ ግቦች ላይ የተመሰረቱ ግላዊ የቁጠባ ምክሮችን ስጠኝ' },
  { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Financial Coach', labelAm: 'የገንዘብ አማካሪ', prompt: 'Act as my financial coach. Help me create a monthly budget plan.', promptAm: 'የገንዘብ አማካሪዬ ሁን። ወርሃዊ በጀት ዕቅድ ለመፍጠር እርዳኝ።' },
];

const MERCHANT_QUICK_ACTIONS: QuickAction[] = [
  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: 'Sales Summary', labelAm: 'የሽያጭ ማጠቃለያ', prompt: 'Give me a summary of my sales performance and tips to improve', promptAm: 'የሽያጭ አፈጻጸሜን ማጠቃለያ እና ለማሻሻል ምክሮችን ስጠኝ' },
  { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Scam Alert', labelAm: 'ማጭበርበር ማንቂያ', prompt: '[SCAM_CHECK] A customer says they sent payment but I don\'t see it. They\'re pressuring me to release goods. What should I do?', promptAm: '[SCAM_CHECK] ደንበኛ ክፍያ ልኬያለሁ ይላል ግን አላየሁም። ዕቃ ልለቅ እየገፋኝ ነው።' },
  { icon: <GraduationCap className="h-3.5 w-3.5" />, label: 'Explain Term', labelAm: 'ቃል አብራራ', prompt: '[EXPLAIN_CONCEPT] tier:2 term:settlement — What does settlement mean for my merchant account?', promptAm: '[EXPLAIN_CONCEPT] tier:2 term:settlement — ሰትልመንት ለነጋዴ ሂሳቤ ምን ማለት ነው?' },
  { icon: <Wand2 className="h-3.5 w-3.5" />, label: 'Add Vendor', labelAm: 'አቅራቢ ማከል', prompt: '[WIZARD] I want to add a new vendor. Guide me through the process.', promptAm: '[WIZARD] አዲስ አቅራቢ ማከል እፈልጋለሁ። ሂደቱን ምራኝ።', isWizard: true },
  { icon: <QrCode className="h-3.5 w-3.5" />, label: 'QR Payments', labelAm: 'QR ክፍያ', prompt: 'How do QR payments work and how do I maximize adoption?', promptAm: 'QR ክፍያዎች እንዴት ይሰራሉ እና እንዴት ማሳደግ እችላለሁ?' },
  { icon: <Calculator className="h-3.5 w-3.5" />, label: 'Fee Calculator', labelAm: 'ክፍያ ማስሊያ', prompt: 'Explain the settlement fees and help me calculate my net revenue', promptAm: 'የማጠቃለያ ክፍያዎችን ያብራሩ እና የተጣራ ገቢዬን ለማስላት እርዳኝ' },
  { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Growth Coach', labelAm: 'የእድገት አማካሪ', prompt: 'Act as my business growth coach. What strategies should I focus on?', promptAm: 'የንግድ እድገት አማካሪዬ ሁን። በየትኞቹ ስልቶች ላይ ማተኮር አለብኝ?' },
];

const AGENCY_QUICK_ACTIONS: QuickAction[] = [
  { icon: <Wallet className="h-3.5 w-3.5" />, label: 'Float Status', labelAm: 'ፍሎት ሁኔታ', prompt: 'What is my current float balance and daily limits?', promptAm: 'የአሁኑ ፍሎት ቀሪ ሂሳቤ እና ዕለታዊ ገደቦቼ ምንድን ናቸው?' },
  { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Scam Check', labelAm: 'ማጭበርበር ፍተሻ', prompt: '[SCAM_CHECK] A customer is asking me to do a large cash-out but their ID looks suspicious. What should I check?', promptAm: '[SCAM_CHECK] ደንበኛ ትልቅ ገንዘብ ማውጣት ይፈልጋል ግን መታወቂያቸው አጠራጣሪ ነው። ምን ማረጋገጥ አለብኝ?' },
  { icon: <GraduationCap className="h-3.5 w-3.5" />, label: 'Explain Term', labelAm: 'ቃል አብራራ', prompt: '[EXPLAIN_CONCEPT] tier:2 term:float — What is float and how does it work for agents?', promptAm: '[EXPLAIN_CONCEPT] tier:2 term:float — ፍሎት ምንድን ነው እና ለወኪሎች እንዴት ይሰራል?' },
  { icon: <Wand2 className="h-3.5 w-3.5" />, label: 'Cash In Guide', labelAm: 'ገንዘብ ማስገባት', prompt: '[WIZARD] Guide me through processing a customer cash-in transaction step by step.', promptAm: '[WIZARD] የደንበኛ ገንዘብ ማስገባት ግብይት ደረጃ በደረጃ ምራኝ።', isWizard: true },
  { icon: <Calculator className="h-3.5 w-3.5" />, label: 'Commission', labelAm: 'ኮሚሽን', prompt: 'How are my commissions calculated? Show me the fee structure for cash-in and cash-out.', promptAm: 'ኮሚሽኖቼ እንዴት ይሰላሉ? ለገንዘብ ማስገባት እና ማውጣት የክፍያ መዋቅሩን አሳየኝ።' },
  { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Performance', labelAm: 'አፈጻጸም', prompt: 'Give me tips to improve my agent performance and earn more commissions.', promptAm: 'የወኪል አፈጻጸሜን ለማሻሻል እና ተጨማሪ ኮሚሽን ለማግኘት ምክሮችን ስጠኝ።' },
];

interface NisirAIWidgetProps {
  portal: 'retail' | 'merchant' | 'agency';
  transactionContext?: { type: string; amount: number; direction: string; description: string; reference: string; date: string; fee?: number } | null;
  onClearTransactionContext?: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nisir-ai-chat`;

const NisirAIWidget: React.FC<NisirAIWidgetProps> = ({ portal, transactionContext, onClearTransactionContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { briefingContext, loading: briefingLoading } = useDailyBriefing();
  const navigate = useNavigate();

  const quickActions = portal === 'merchant' ? MERCHANT_QUICK_ACTIONS : portal === 'agency' ? AGENCY_QUICK_ACTIONS : RETAIL_QUICK_ACTIONS;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // Auto-open and send transaction context when provided
  useEffect(() => {
    if (transactionContext) {
      setIsOpen(true);
      const prompt = `[EXPLAIN_TXN] Transaction details:\n- Type: ${transactionContext.type}\n- Amount: ETB ${transactionContext.amount}\n- Direction: ${transactionContext.direction}\n- Description: ${transactionContext.description}\n- Reference: ${transactionContext.reference}\n- Date: ${transactionContext.date}${transactionContext.fee ? `\n- Fee: ETB ${transactionContext.fee}` : ''}`;
      sendMessage(prompt);
      onClearTransactionContext?.();
    }
  }, [transactionContext]);

  const parseIntentFromResponse = (text: string): { intent: string | null; cleanText: string } => {
    const intentMatch = text.match(/^\[INTENT:(\w+)\]\s*/);
    if (intentMatch) {
      return { intent: intentMatch[1], cleanText: text.replace(intentMatch[0], '') };
    }
    return { intent: null, cleanText: text };
  };

  const streamChat = useCallback(async (allMessages: Msg[]) => {
    setIsLoading(true);
    setDetectedIntent(null);
    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, portal, language }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: 'Request failed' }));
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errData.error || 'Something went wrong.'}` }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let intentParsed = false;

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;

        // Parse intent from the accumulated text
        if (!intentParsed) {
          const { intent, cleanText } = parseIntentFromResponse(assistantSoFar);
          if (intent) {
            setDetectedIntent(intent);
            assistantSoFar = cleanText;
            intentParsed = true;
          } else if (assistantSoFar.length > 30 && !assistantSoFar.startsWith('[INTENT:')) {
            intentParsed = true;
          }
        }

        const displayText = intentParsed ? assistantSoFar : assistantSoFar.replace(/^\[INTENT:\w+\]\s*/, '');

        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: displayText } : m);
          }
          return [...prev, { role: 'assistant', content: displayText }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error('NisirAI stream error:', e);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Connection error. Please try again.' }]);
    }
    setIsLoading(false);
  }, [portal, language]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    await streamChat(newMessages);
  }, [messages, isLoading, streamChat]);

  const handleQuickAction = (action: QuickAction) => {
    const prompt = language === 'am' ? action.promptAm : action.prompt;
    sendMessage(prompt);
  };

  const handleBriefing = () => {
    if (!briefingContext) return;
    const prompt = `[BRIEFING_CONTEXT]\n${briefingContext}\n\nGenerate my morning briefing.`;
    sendMessage(prompt);
  };

  const greeting = portal === 'merchant'
    ? (language === 'am' ? 'ሰላም! የኒሲር AI ንግድ አማካሪዎ ነኝ 🏪' : "Hi! I'm your NisirAI Business Coach 🏪")
    : portal === 'agency'
    ? (language === 'am' ? 'ሰላም! የኒሲር AI ወኪል አማካሪዎ ነኝ 🤝' : "Hi! I'm your NisirAI Agent Assistant 🤝")
    : (language === 'am' ? 'ሰላም! የኒሲር AI የገንዘብ አማካሪዎ ነኝ 💰' : "Hi! I'm your NisirAI Financial Coach 💰");

  const subtitle = portal === 'merchant'
    ? (language === 'am' ? 'ንግድዎን ለማሳደግ እዚህ ነኝ' : 'Here to help grow your business')
    : portal === 'agency'
    ? (language === 'am' ? 'የወኪል ስራዎን ለማቃለል እዚህ ነኝ' : 'Here to support your agent operations')
    : (language === 'am' ? 'የገንዘብ ጉዟችሁ ላይ እዚህ ነኝ' : 'Here to guide your financial journey');

  const intentRoute = detectedIntent ? getRouteForIntent(detectedIntent, portal) : null;

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-24 right-4 z-[100] cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
          >
            <button
              onClick={() => setIsOpen(true)}
              className="relative h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.4)] flex items-center justify-center"
            >
              <Sparkles className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent flex items-center justify-center">
                <span className="text-[8px] font-bold text-accent-foreground">AI</span>
              </span>
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '3s' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-2 left-2 z-[100] max-w-md mx-auto"
            style={{ maxHeight: 'calc(100dvh - 140px)' }}
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: 'min(560px, calc(100dvh - 160px))' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">NisirAI</h3>
                    <p className="text-[10px] opacity-80">
                      {portal === 'merchant' ? (language === 'am' ? 'የንግድ አማካሪ' : 'Business Coach') : portal === 'agency' ? (language === 'am' ? 'የወኪል ረዳት' : 'Agent Assistant') : (language === 'am' ? 'የገንዘብ አማካሪ' : 'Financial Coach')}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3"
                    >
                      <Sparkles className="h-7 w-7 text-primary" />
                    </motion.div>
                    <p className="text-sm font-semibold text-foreground">{greeting}</p>
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>

                    {/* Morning Briefing Button */}
                    {user && (
                      <div className="mt-3 px-2">
                        <CopilotBriefing
                          onRequestBriefing={handleBriefing}
                          isLoading={briefingLoading || isLoading}
                          language={language}
                        />
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="mt-3 flex flex-wrap gap-2 justify-center">
                      {quickActions.map((action, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleQuickAction(action)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                            action.isWizard
                              ? 'bg-accent/20 text-accent-foreground border border-accent/30 hover:bg-accent/30'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {action.icon}
                          {language === 'am' ? action.labelAm : action.label}
                          {action.isWizard && <Wand2 className="h-3 w-3 ml-0.5" />}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mb-1">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        // Hide internal markers from user messages
                        msg.content.replace(/^\[(BRIEFING_CONTEXT|EXPLAIN_TXN|WIZARD|SCAM_CHECK|MONTHLY_REVIEW|CALC_INTEREST|EXPLAIN_CONCEPT)\][\s\S]*?\n\n/, '').replace(/^\[(BRIEFING_CONTEXT|EXPLAIN_TXN|WIZARD|SCAM_CHECK|MONTHLY_REVIEW|CALC_INTEREST|EXPLAIN_CONCEPT)\]\s*/, '') || msg.content
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Navigation Card for detected intent */}
                {intentRoute && !isLoading && (
                  <CopilotNavigationCard
                    route={intentRoute.route}
                    description={intentRoute.description}
                    language={language}
                    onClose={() => setIsOpen(false)}
                  />
                )}

                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Quick Actions Strip (when conversation started) */}
              {messages.length > 0 && (
                <div className="px-3 py-1.5 border-t border-border overflow-x-auto">
                  <div className="flex gap-1.5 min-w-max">
                    {quickActions.slice(0, 3).map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action)}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                      >
                        {action.icon}
                        {language === 'am' ? action.labelAm : action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="px-3 py-2.5 border-t border-border bg-card">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={language === 'am' ? 'ጥያቄዎን ያስገቡ...' : 'Ask NisirAI anything...'}
                    disabled={isLoading}
                    className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NisirAIWidget;
