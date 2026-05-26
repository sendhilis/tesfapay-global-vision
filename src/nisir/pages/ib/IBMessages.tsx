import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@nisir/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { MessageSquare, Plus, Send, HelpCircle, Phone, AlertTriangle, Clock, CheckCircle, User, Building2 } from 'lucide-react';

const categories = [
  { value: 'transaction_query', label: 'Transaction Query' },
  { value: 'loan_query', label: 'Loan Query' },
  { value: 'account_query', label: 'Account Query' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'dispute', label: 'Transaction Dispute' },
  { value: 'general', label: 'General Inquiry' },
];

const faqItems = [
  {
    category: 'Transfers',
    items: [
      { q: 'What are the transfer limits?', a: 'Daily transfer limit is 50,000 ETB for individual accounts and configurable for corporate accounts. RTGS transfers require minimum 100,000 ETB.' },
      { q: 'How long do interbank transfers take?', a: 'RTGS transfers settle same-day (before 3 PM EAT cutoff). ACH/TEFTNet transfers settle next business day.' },
      { q: 'Can I cancel a scheduled transfer?', a: 'Yes, navigate to Scheduled Payments and click the cancel button before the execution date.' },
    ]
  },
  {
    category: 'Loans',
    items: [
      { q: 'How do I make a loan repayment?', a: 'Go to Loan Repayments, select your loan, and click Pay on the due installment. Payment is debited from your chosen account.' },
      { q: 'Can I prepay my loan?', a: 'Yes, partial or full prepayment is available. An early repayment fee of 2% may apply per your loan terms.' },
      { q: 'How do I apply for a top-up loan?', a: 'Existing borrowers with good repayment history can apply via the Loans section. Your eligibility is pre-checked automatically.' },
    ]
  },
  {
    category: 'Account & Security',
    items: [
      { q: 'How do I change my password?', a: 'Go to Settings → Security tab → Change Password. Passwords must be minimum 12 characters with complexity requirements.' },
      { q: 'What happens after failed login attempts?', a: '3 consecutive failures trigger a 30-minute lockout. After 5 failures, admin unlock is required.' },
      { q: 'How do I add a beneficiary?', a: 'Go to Beneficiaries → Add Beneficiary. New beneficiaries have a 24-hour cooling period before first transfer (security feature).' },
    ]
  },
  {
    category: 'Bills & Payments',
    items: [
      { q: 'Which billers are available?', a: 'We support EEU (electricity), AAWSA (water), Ethio Telecom, ERCA tax payments, trade license renewals, and many more.' },
      { q: 'Can I set up recurring bill payments?', a: 'Yes, use Scheduled Payments to set up weekly or monthly auto-payments for any biller.' },
    ]
  },
];

const IBMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showCallback, setShowCallback] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // New message form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [body, setBody] = useState('');

  // Reply
  const [replyBody, setReplyBody] = useState('');

  // Callback
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackTime, setCallbackTime] = useState('');

  const fetchMessages = async () => {
    if (!user) return;
    const { data } = await supabase.from('secure_messages').select('*').eq('profile_id', user.id)
      .is('parent_id', null).order('created_at', { ascending: false });
    if (data) setMessages(data);
  };

  const [threadReplies, setThreadReplies] = useState<any[]>([]);

  const fetchReplies = async (parentId: string) => {
    const { data } = await supabase.from('secure_messages').select('*').eq('parent_id', parentId).order('created_at', { ascending: true });
    if (data) setThreadReplies(data);
  };

  useEffect(() => { fetchMessages(); }, [user]);

  useEffect(() => {
    if (selectedThread) fetchReplies(selectedThread);
  }, [selectedThread]);

  // Realtime for messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`messages-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'secure_messages', filter: `profile_id=eq.${user.id}` }, () => {
        fetchMessages();
        if (selectedThread) fetchReplies(selectedThread);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedThread]);

  const handleSendMessage = async () => {
    if (!user || !subject || !body) { toast.error('Fill subject and message'); return; }
    setLoading(true);
    await supabase.from('secure_messages').insert({
      profile_id: user.id,
      subject,
      category,
      body,
      sender_type: 'customer',
    });
    toast.success('Message sent to your Relationship Manager');
    setShowNewMessage(false);
    setSubject(''); setBody(''); setCategory('general');
    fetchMessages();
    setLoading(false);
  };

  const handleReply = async () => {
    if (!user || !replyBody || !selectedThread) return;
    await supabase.from('secure_messages').insert({
      profile_id: user.id,
      subject: 'RE: ' + (messages.find(m => m.id === selectedThread)?.subject || ''),
      category: messages.find(m => m.id === selectedThread)?.category || 'general',
      body: replyBody,
      sender_type: 'customer',
      parent_id: selectedThread,
    });
    setReplyBody('');
    fetchReplies(selectedThread);
    toast.success('Reply sent');
  };

  const handleCallback = async () => {
    if (!user || !callbackPhone) { toast.error('Enter phone number'); return; }
    await supabase.from('secure_messages').insert({
      profile_id: user.id,
      subject: 'Callback Request',
      category: 'general',
      body: `Please call me at ${callbackPhone}${callbackTime ? ` — preferred time: ${callbackTime}` : ''}`,
      sender_type: 'customer',
    });
    toast.success('Callback request submitted');
    setShowCallback(false);
    setCallbackPhone(''); setCallbackTime('');
    fetchMessages();
  };

  const selectedMsg = messages.find(m => m.id === selectedThread);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Messages & Support
          </h1>
          <p className="text-sm text-muted-foreground">Secure messaging with your Relationship Manager</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCallback(true)}>
            <Phone className="h-4 w-4 mr-1" /> Request Callback
          </Button>
          <Button size="sm" onClick={() => setShowNewMessage(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Message
          </Button>
        </div>
      </div>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages"><MessageSquare className="h-3 w-3 mr-1" /> Messages ({messages.length})</TabsTrigger>
          <TabsTrigger value="faq"><HelpCircle className="h-3 w-3 mr-1" /> FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          {selectedThread && selectedMsg ? (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedThread(null); setThreadReplies([]); }}>← Back to messages</Button>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{selectedMsg.subject}</CardTitle>
                    <Badge variant="outline" className="text-[10px] capitalize">{selectedMsg.category.replace('_', ' ')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Original message */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">You • {new Date(selectedMsg.created_at).toLocaleString()}</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selectedMsg.body}</p>
                    </div>
                  </div>

                  {/* Replies */}
                  {threadReplies.map(r => (
                    <div key={r.id} className={`flex gap-3 ${r.sender_type === 'rm' ? '' : 'flex-row-reverse'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${r.sender_type === 'rm' ? 'bg-amber-100' : 'bg-primary/10'}`}>
                        {r.sender_type === 'rm' ? <Building2 className="h-4 w-4 text-amber-600" /> : <User className="h-4 w-4 text-primary" />}
                      </div>
                      <div className={`flex-1 rounded-lg p-3 ${r.sender_type === 'rm' ? 'bg-amber-50' : 'bg-muted/50'}`}>
                        <p className="text-xs text-muted-foreground mb-1">
                          {r.sender_type === 'rm' ? 'Relationship Manager' : 'You'} • {new Date(r.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{r.body}</p>
                      </div>
                    </div>
                  ))}

                  {/* Reply box */}
                  <div className="flex gap-2 pt-3 border-t border-border">
                    <Input value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="Type your reply..." className="flex-1" />
                    <Button size="sm" onClick={handleReply} disabled={!replyBody}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Expected response time: Within 4 business hours</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {messages.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Send a secure message to your Relationship Manager</p>
                    <Button size="sm" className="mt-3" onClick={() => setShowNewMessage(true)}>Start Conversation</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {messages.map(m => (
                    <Card key={m.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedThread(m.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${m.is_read ? 'bg-muted' : 'bg-primary'}`} />
                            <div>
                              <p className="text-sm font-medium text-foreground">{m.subject}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{m.body}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge variant="outline" className="text-[10px] capitalize">{m.category.replace('_', ' ')}</Badge>
                            <p className="text-[10px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <div className="relative mb-4">
            <Input placeholder="Search FAQ..." className="pl-9" />
            <HelpCircle className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          {faqItems.map(section => (
            <Card key={section.category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{section.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  {section.items.map((item, i) => (
                    <AccordionItem key={i} value={`${section.category}-${i}`}>
                      <AccordionTrigger className="text-sm text-foreground">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* New Message Dialog */}
      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Secure Message</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Subject *</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description" /></div>
            <div><Label className="text-xs">Message *</Label><Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Describe your inquiry..." rows={4} /></div>
            <p className="text-[10px] text-muted-foreground">Your RM will respond within 4 business hours (Mon–Sat, 8AM–6PM EAT)</p>
            <Button onClick={handleSendMessage} disabled={loading} className="w-full">{loading ? 'Sending...' : 'Send Message'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Callback Dialog */}
      <Dialog open={showCallback} onOpenChange={setShowCallback}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Phone className="h-4 w-4" /> Request Callback</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Phone Number *</Label><Input value={callbackPhone} onChange={e => setCallbackPhone(e.target.value)} placeholder="+251..." /></div>
            <div><Label className="text-xs">Preferred Time</Label><Input type="time" value={callbackTime} onChange={e => setCallbackTime(e.target.value)} /></div>
            <p className="text-[10px] text-muted-foreground">Business hours: Mon–Sat, 8:00 AM – 6:00 PM EAT</p>
            <Button onClick={handleCallback} className="w-full">Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IBMessages;
