import { useState, useEffect } from 'react';
import { useLanguage } from '@nisir/contexts/LanguageContext';
import { useAuth } from '@nisir/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@nisir/components/MobilePortalLayout';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, Wallet, CreditCard, HandCoins, HelpCircle,
  Search, MessageSquare, Clock, CheckCircle, Loader2,
  CreditCard as CardIcon, Shield, Users, ChevronRight
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Ticket = Tables<'support_tickets'>;

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/retail' },
  { icon: <Wallet className="h-5 w-5" />, labelKey: 'common.accounts', path: '/retail/accounts' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/retail/payments' },
  { icon: <HandCoins className="h-5 w-5" />, labelKey: 'common.loans', path: '/retail/loans' },
  { icon: <HelpCircle className="h-5 w-5" />, labelKey: 'common.support', path: '/retail/support' },
];

const categories = [
  { key: 'accounts', icon: Wallet, label: 'Accounts' },
  { key: 'loans', icon: HandCoins, label: 'Loans' },
  { key: 'payments', icon: CardIcon, label: 'Payments' },
  { key: 'security', icon: Shield, label: 'Security' },
  { key: 'agents', icon: Users, label: 'Agents' },
  { key: 'other', icon: HelpCircle, label: 'Other' },
];

const faqItems = [
  { q: 'How do I reset my PIN?', a: 'Go to Settings > Security > Reset PIN. You will receive an OTP to verify.' },
  { q: 'What are the daily transfer limits?', a: 'Default daily limit is 50,000 ETB. Contact support to request an increase.' },
  { q: 'How to link a mobile wallet?', a: 'Go to Accounts > Link Mobile Wallet and follow the on-screen instructions.' },
  { q: 'How long does loan approval take?', a: 'Nano loans: instant. Micro loans: 1-2 business days. Larger loans: 3-5 business days.' },
];

const RetailSupport = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [view, setView] = useState<'hub' | 'create' | 'tickets'>('hub');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Create ticket state
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const fetchTickets = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('support_tickets').select('*').eq('profile_id', user.id).order('created_at', { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  };

  useEffect(() => { if (view === 'tickets') fetchTickets(); }, [view, user]);

  const handleSubmitTicket = async () => {
    if (!user || !category || !subject) return;
    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      profile_id: user.id,
      category,
      subject,
      description,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('support.ticketCreated') || 'Ticket submitted! We will contact you soon.');
    setView('tickets');
    setCategory('');
    setSubject('');
    setDescription('');
  };

  const statusIcon: Record<string, any> = {
    open: Clock,
    in_progress: MessageSquare,
    resolved: CheckCircle,
    closed: CheckCircle,
  };

  return (
    <MobilePortalLayout portalName="Nisir" portalColor="retail" navItems={navItems} showBack backPath="/retail">
      {view === 'hub' && (
        <div className="px-4 pt-4 pb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">{t('common.support')}</h2>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => setView('create')}
              className="flex flex-col items-center gap-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <MessageSquare className="h-6 w-6 text-primary" />
              <span className="text-xs font-semibold text-foreground">{t('support.newTicket') || 'New Ticket'}</span>
            </button>
            <button onClick={() => setView('tickets')}
              className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border">
              <Clock className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{t('support.myTickets') || 'My Tickets'}</span>
            </button>
          </div>

          {/* FAQ */}
          <h3 className="text-sm font-bold text-foreground mb-3">{t('support.faq') || 'Frequently Asked Questions'}</h3>
          <div className="space-y-2">
            {faqItems.map((faq, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-3 text-left">
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {expandedFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-3 pb-3">
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="px-4 pt-4 pb-6">
          <button onClick={() => setView('hub')} className="text-sm text-primary mb-4">&larr; {t('common.back')}</button>
          <h2 className="text-lg font-bold text-foreground mb-4">{t('support.newTicket') || 'New Support Ticket'}</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button key={cat.key} onClick={() => setCategory(cat.key)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-colors ${
                        category === cat.key ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm"
                placeholder="Brief description of issue" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Details (optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full py-3 px-3 rounded-xl border border-border bg-card text-foreground text-sm resize-none" rows={4}
                placeholder="Provide more details..." />
            </div>
            <button onClick={handleSubmitTicket} disabled={submitting || !category || !subject}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t('support.submit') || 'Submit Ticket'}
            </button>
          </div>
        </div>
      )}

      {view === 'tickets' && (
        <div className="px-4 pt-4 pb-6">
          <button onClick={() => setView('hub')} className="text-sm text-primary mb-4">&larr; {t('common.back')}</button>
          <h2 className="text-lg font-bold text-foreground mb-4">{t('support.myTickets') || 'My Tickets'}</h2>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : tickets.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No tickets yet</p>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const StatusIcon = statusIcon[ticket.status || 'open'] || Clock;
                return (
                  <div key={ticket.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-bold text-foreground">{ticket.subject}</p>
                      <StatusIcon className={`h-4 w-4 shrink-0 ${
                        ticket.status === 'resolved' ? 'text-success' : ticket.status === 'in_progress' ? 'text-info' : 'text-warning'
                      }`} />
                    </div>
                    <p className="text-[11px] text-muted-foreground capitalize">{ticket.category} · {ticket.status?.replace('_', ' ')}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{ticket.ticket_number}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </MobilePortalLayout>
  );
};

export default RetailSupport;
