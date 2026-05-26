import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type CorporateRoleType = 'corporate_admin' | 'maker' | 'checker' | 'approver' | 'finance_viewer' | 'payroll_officer';

interface CorporateRoleInfo {
  role: CorporateRoleType | null;
  corporateEntityId: string | null;
  companyName: string | null;
  transactionLimit: number;
  isCorporateUser: boolean;
  isActive: boolean;
  loading: boolean;
  canInitiate: boolean;     // maker, corporate_admin
  canApprove: boolean;      // checker, approver, corporate_admin
  canViewOnly: boolean;     // finance_viewer
  canPayroll: boolean;      // payroll_officer, corporate_admin
  canManageUsers: boolean;  // corporate_admin
  makerCheckerThreshold: number;
}

export const useCorporateRole = (): CorporateRoleInfo => {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<CorporateRoleInfo, 'canInitiate' | 'canApprove' | 'canViewOnly' | 'canPayroll' | 'canManageUsers'>>({
    role: null,
    corporateEntityId: null,
    companyName: null,
    transactionLimit: 50000,
    isCorporateUser: false,
    isActive: false,
    loading: true,
    makerCheckerThreshold: 10000,
  });

  useEffect(() => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false, isCorporateUser: false }));
      return;
    }

    const fetch = async () => {
      const { data: corpUser } = await supabase
        .from('corporate_users')
        .select('*')
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!corpUser) {
        setState(prev => ({ ...prev, loading: false, isCorporateUser: false }));
        return;
      }

      const { data: entity } = await supabase
        .from('corporate_entities')
        .select('company_name, maker_checker_threshold')
        .eq('id', corpUser.corporate_entity_id)
        .single();

      setState({
        role: corpUser.role as CorporateRoleType,
        corporateEntityId: corpUser.corporate_entity_id,
        companyName: entity?.company_name || null,
        transactionLimit: corpUser.transaction_limit || 50000,
        isCorporateUser: true,
        isActive: corpUser.is_active,
        loading: false,
        makerCheckerThreshold: (entity?.maker_checker_threshold as number) || 10000,
      });
    };

    fetch();
  }, [user]);

  const role = state.role;
  return {
    ...state,
    canInitiate: role === 'maker' || role === 'corporate_admin',
    canApprove: role === 'checker' || role === 'approver' || role === 'corporate_admin',
    canViewOnly: role === 'finance_viewer',
    canPayroll: role === 'payroll_officer' || role === 'corporate_admin' || role === 'maker',
    canManageUsers: role === 'corporate_admin',
  };
};
