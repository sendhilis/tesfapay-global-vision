import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import MobilePortalLayout from '@/components/MobilePortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home, CreditCard, Users, BarChart3, FileText,
  PiggyBank, Check, Loader2, Plus, UserCheck, ArrowLeft, Trash2
} from 'lucide-react';
import CustomerPicker from '@/components/agency/CustomerPicker';

const navItems = [
  { icon: <Home className="h-5 w-5" />, labelKey: 'common.home', path: '/agency' },
  { icon: <CreditCard className="h-5 w-5" />, labelKey: 'common.payments', path: '/agency/payments' },
  { icon: <Users className="h-5 w-5" />, labelKey: 'admin.customers', path: '/agency/customers' },
  { icon: <BarChart3 className="h-5 w-5" />, labelKey: 'agency.reports', path: '/agency/reports' },
  { icon: <FileText className="h-5 w-5" />, labelKey: 'common.profile', path: '/agency/profile' },
];

interface GroupMember {
  id: string;
  profile_id: string;
  account_id: string | null;
  member_name: string;
  phone: string;
  amount: number;
  is_active: boolean;
}

interface SavingsGroup {
  id: string;
  group_name: string;
  frequency: string;
  target_amount: number;
  status: string;
  members: GroupMember[];
  todayCollected: Set<string>; // member IDs collected today
}

type View = 'list' | 'create' | 'collect';

const AgencySavingsCollection = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [agentId, setAgentId] = useState('');
  const [view, setView] = useState<View>('list');
  const [groups, setGroups] = useState<SavingsGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<SavingsGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState<string | null>(null);

  // Create group form
  const [groupName, setGroupName] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [targetAmount, setTargetAmount] = useState('');
  const [creating, setCreating] = useState(false);

  // Add member form
  const [memberPhone, setMemberPhone] = useState('');
  const [memberAmount, setMemberAmount] = useState('100');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('agents').select('id').eq('profile_id', user.id).single()
        .then(({ data }) => { if (data) setAgentId(data.id); });
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    setLoading(true);
    const { data: agentData } = await supabase.from('agents').select('id').eq('profile_id', user!.id).single();
    if (!agentData) { setLoading(false); return; }

    const { data: groupRows } = await supabase
      .from('savings_groups')
      .select('*')
      .eq('agent_id', agentData.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!groupRows || groupRows.length === 0) { setGroups([]); setLoading(false); return; }

    const groupIds = groupRows.map(g => g.id);
    const { data: members } = await supabase
      .from('savings_group_members')
      .select('*')
      .in('group_id', groupIds)
      .eq('is_active', true);

    // Get today's collections
    const today = new Date().toISOString().split('T')[0];
    const { data: todayColls } = await supabase
      .from('savings_collections')
      .select('member_id')
      .in('group_id', groupIds)
      .eq('collection_date', today);

    const todaySet = new Set((todayColls || []).map(c => c.member_id));

    const enriched: SavingsGroup[] = groupRows.map(g => ({
      ...g,
      target_amount: g.target_amount || 0,
      members: (members || []).filter(m => m.group_id === g.id).map(m => ({
        id: m.id,
        profile_id: m.profile_id,
        account_id: m.account_id,
        member_name: m.member_name,
        phone: m.phone,
        amount: m.amount,
        is_active: m.is_active ?? true,
      })),
      todayCollected: new Set(
        (members || []).filter(m => m.group_id === g.id && todaySet.has(m.id)).map(m => m.id)
      ),
    }));

    setGroups(enriched);
    setLoading(false);
  };

  const createGroup = async () => {
    if (!groupName.trim()) { toast.error('Enter group name'); return; }
    if (!agentId) { toast.error('Agent not found'); return; }
    setCreating(true);

    const { data, error } = await supabase.from('savings_groups').insert({
      agent_id: agentId,
      group_name: groupName.trim(),
      frequency,
      target_amount: parseFloat(targetAmount) || 0,
    }).select().single();

    if (error) { toast.error('Failed to create group'); setCreating(false); return; }

    toast.success(`Group "${groupName}" created`);
    setGroupName(''); setTargetAmount('');
    setCreating(false);
    await fetchGroups();
    // Open the new group for adding members
    setActiveGroup({ ...data, target_amount: data.target_amount || 0, members: [], todayCollected: new Set() });
    setView('collect');
  };

  const addMemberToGroup = async (customer: { id: string; first_name: string; father_name: string; msisdn: string }) => {
    if (!activeGroup) return;
    setAddingMember(true);

    const { data: account } = await supabase.from('accounts').select('id').eq('profile_id', customer.id).eq('is_primary', true).single();

    const { data, error } = await supabase.from('savings_group_members').insert({
      group_id: activeGroup.id,
      profile_id: customer.id,
      account_id: account?.id || null,
      member_name: `${customer.first_name} ${customer.father_name}`,
      phone: customer.msisdn || '',
      amount: parseFloat(memberAmount) || 100,
    }).select().single();

    if (error) { toast.error('Failed to add member'); setAddingMember(false); return; }

    const newMember: GroupMember = {
      id: data.id, profile_id: data.profile_id, account_id: data.account_id,
      member_name: data.member_name, phone: data.phone, amount: data.amount, is_active: true,
    };

    setActiveGroup(prev => prev ? { ...prev, members: [...prev.members, newMember] } : prev);
    setMemberPhone(''); setMemberAmount('100');
    setAddingMember(false);
    toast.success(`${customer.first_name} added`);
  };

  const removeMember = async (memberId: string) => {
    await supabase.from('savings_group_members').update({ is_active: false }).eq('id', memberId);
    setActiveGroup(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId) } : prev);
    toast.success('Member removed');
  };

  const collectPayment = async (member: GroupMember) => {
    if (!activeGroup || activeGroup.todayCollected.has(member.id)) return;
    setCollecting(member.id);
    const ref = 'SCOL-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Credit customer account
    if (member.account_id) {
      const { data: acc } = await supabase.from('accounts').select('available_balance').eq('id', member.account_id).single();
      if (acc) {
        await supabase.from('accounts').update({
          balance: (acc.available_balance || 0) + member.amount,
          available_balance: (acc.available_balance || 0) + member.amount,
        }).eq('id', member.account_id);
      }
      await supabase.from('transactions').insert({
        account_id: member.account_id, profile_id: member.profile_id,
        transaction_type: 'deposit', amount: member.amount, fee: 0, direction: 'credit',
        status: 'completed', reference: ref, description: `Savings Collection - ${activeGroup.group_name}`, channel: 'agent',
      });
    }

    // Record collection
    await supabase.from('savings_collections').insert({
      group_id: activeGroup.id, member_id: member.id, agent_id: agentId || null,
      amount: member.amount, reference: ref,
    });

    // Agent transaction record
    if (agentId) {
      await supabase.from('agent_transactions').insert({
        agent_id: agentId, transaction_type: 'savings_collection', amount: member.amount, fee: 0,
        reference: ref, customer_msisdn: member.phone, customer_name: member.member_name,
        notes: `Group: ${activeGroup.group_name}`,
      });
    }

    setActiveGroup(prev => {
      if (!prev) return prev;
      const updated = new Set(prev.todayCollected);
      updated.add(member.id);
      return { ...prev, todayCollected: updated };
    });
    setCollecting(null);
    toast.success(`${member.member_name}: ${member.amount} ETB collected`);
  };

  const collectAll = async () => {
    if (!activeGroup) return;
    for (const member of activeGroup.members) {
      if (!activeGroup.todayCollected.has(member.id)) {
        await collectPayment(member);
      }
    }
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });
  const freqLabel = (f: string) => f === 'daily' ? 'Daily' : f === 'weekly' ? 'Weekly' : 'Monthly';

  // ─── LIST VIEW ───
  const renderList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
            <PiggyBank className="h-5 w-5 text-success" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Savings Groups</h2>
            <p className="text-xs text-muted-foreground">Manage recurring collections</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setView('create')}>
          <Plus className="h-3 w-3 mr-1" />New Group
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : groups.length === 0 ? (
        <Card><CardContent className="p-6 text-center">
          <PiggyBank className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No savings groups yet</p>
          <Button size="sm" className="mt-3" onClick={() => setView('create')}><Plus className="h-3 w-3 mr-1" />Create First Group</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {groups.map(g => {
            const collected = g.todayCollected.size;
            const total = g.members.length;
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => { setActiveGroup(g); setView('collect'); }}
                className="p-3 rounded-xl border bg-card cursor-pointer hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{g.group_name}</p>
                    <p className="text-[10px] text-muted-foreground">{freqLabel(g.frequency)} · {total} members</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-success">{collected}/{total}</p>
                    <p className="text-[10px] text-muted-foreground">today</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── CREATE VIEW ───
  const renderCreate = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setView('list')}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
        <h2 className="text-lg font-bold text-foreground">Create Savings Group</h2>
      </div>
      <Card><CardContent className="p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Group Name *</label>
          <Input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Merkato Women's Group" className="h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Frequency</label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Amount per Member (ETB)</label>
          <Input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="100" className="h-9 text-sm" />
        </div>
        <Button onClick={createGroup} disabled={creating} className="w-full">
          {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create Group'}
        </Button>
      </CardContent></Card>
    </div>
  );

  // ─── COLLECT VIEW ───
  const renderCollect = () => {
    if (!activeGroup) return null;
    const collected = activeGroup.todayCollected.size;
    const total = activeGroup.members.length;
    const totalAmt = activeGroup.members.filter(m => activeGroup.todayCollected.has(m.id)).reduce((s, m) => s + m.amount, 0);
    const remaining = total - collected;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => { setView('list'); fetchGroups(); }}><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
          <div>
            <h2 className="text-lg font-bold text-foreground">{activeGroup.group_name}</h2>
            <p className="text-[10px] text-muted-foreground">{freqLabel(activeGroup.frequency)} collection · {total} members</p>
          </div>
        </div>

        {total > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-card rounded-xl border text-center">
              <p className="text-[10px] text-muted-foreground">Members</p>
              <p className="text-lg font-bold">{total}</p>
            </div>
            <div className="p-2 bg-success/10 rounded-xl text-center">
              <p className="text-[10px] text-muted-foreground">Collected</p>
              <p className="text-lg font-bold text-success">{collected}</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-xl text-center">
              <p className="text-[10px] text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">{fmt(totalAmt)}</p>
            </div>
          </div>
        )}

        {/* Add Member */}
        <Card><CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold">Add Member</h3>
          <CustomerPicker phoneValue={memberPhone} onPhoneChange={setMemberPhone} label="Search Customer"
            onSelect={(c) => addMemberToGroup(c)} />
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount per Collection</label>
            <Input type="number" value={memberAmount} onChange={e => setMemberAmount(e.target.value)} placeholder="100" className="h-9 text-sm" />
          </div>
        </CardContent></Card>

        {/* Member List */}
        {activeGroup.members.length > 0 && (
          <>
            <div className="space-y-2">
              {activeGroup.members.map(member => {
                const done = activeGroup.todayCollected.has(member.id);
                return (
                  <motion.div key={member.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${done ? 'bg-success/5 border-success/20' : 'bg-card border-border'}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${done ? 'bg-success/10' : 'bg-muted'}`}>
                      {done ? <Check className="h-4 w-4 text-success" /> : <UserCheck className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{member.member_name}</p>
                      <p className="text-[10px] text-muted-foreground">{member.phone}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-sm font-bold">{fmt(member.amount)}</p>
                        {!done ? (
                          <button onClick={() => collectPayment(member)} disabled={collecting === member.id}
                            className="text-[10px] text-primary font-medium hover:underline">
                            {collecting === member.id ? 'Collecting...' : 'Collect'}
                          </button>
                        ) : (
                          <p className="text-[10px] text-success font-medium">Done ✓</p>
                        )}
                      </div>
                      {!done && (
                        <button onClick={() => removeMember(member.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {remaining > 0 && (
              <Button onClick={collectAll} className="w-full bg-success hover:bg-success/90 text-primary-foreground">
                Collect All Remaining ({remaining})
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <MobilePortalLayout portalName="Nisir Agent" portalColor="agency" navItems={navItems} showBack backPath="/agency/payments">
      <div className="px-4 pt-4 pb-6">
        {view === 'list' && renderList()}
        {view === 'create' && renderCreate()}
        {view === 'collect' && renderCollect()}
      </div>
    </MobilePortalLayout>
  );
};

export default AgencySavingsCollection;
