export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string
          account_type: Database["public"]["Enums"]["account_type"]
          available_balance: number | null
          balance: number | null
          blocked_balance: number | null
          created_at: string | null
          currency: string | null
          daily_limit: number | null
          id: string
          interest_rate: number | null
          is_primary: boolean | null
          monthly_limit: number | null
          product_name: string
          profile_id: string
          status: Database["public"]["Enums"]["account_status"] | null
          updated_at: string | null
        }
        Insert: {
          account_number?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          available_balance?: number | null
          balance?: number | null
          blocked_balance?: number | null
          created_at?: string | null
          currency?: string | null
          daily_limit?: number | null
          id?: string
          interest_rate?: number | null
          is_primary?: boolean | null
          monthly_limit?: number | null
          product_name?: string
          profile_id: string
          status?: Database["public"]["Enums"]["account_status"] | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          available_balance?: number | null
          balance?: number | null
          blocked_balance?: number | null
          created_at?: string | null
          currency?: string | null
          daily_limit?: number | null
          id?: string
          interest_rate?: number | null
          is_primary?: boolean | null
          monthly_limit?: number | null
          product_name?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["account_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_configs: {
        Row: {
          config: Json
          enabled_modules: Json
          id: string
          is_published: boolean
          updated_at: string
        }
        Insert: {
          config: Json
          enabled_modules?: Json
          id: string
          is_published?: boolean
          updated_at?: string
        }
        Update: {
          config?: Json
          enabled_modules?: Json
          id?: string
          is_published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      consents: {
        Row: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          granted: boolean | null
          granted_at: string | null
          id: string
          method: string | null
          profile_id: string
          revoked_at: string | null
        }
        Insert: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          granted?: boolean | null
          granted_at?: string | null
          id?: string
          method?: string | null
          profile_id: string
          revoked_at?: string | null
        }
        Update: {
          consent_type?: Database["public"]["Enums"]["consent_type"]
          granted?: boolean | null
          granted_at?: string | null
          id?: string
          method?: string | null
          profile_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          back_image_url: string | null
          created_at: string | null
          document_number: string | null
          document_type: string
          front_image_url: string | null
          id: string
          profile_id: string
          rejection_reason: string | null
          status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          back_image_url?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type: string
          front_image_url?: string | null
          id?: string
          profile_id: string
          rejection_reason?: string | null
          status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          back_image_url?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string
          front_image_url?: string | null
          id?: string
          profile_id?: string
          rejection_reason?: string | null
          status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_configurations: {
        Row: {
          allow_partial_payment: boolean
          created_at: string | null
          early_repayment_fee_pct: number
          grace_period_days: number
          id: string
          interest_calc_method: string
          late_penalty_basis: string
          late_penalty_rate: number
          min_repayment_amount: number
          product_type: Database["public"]["Enums"]["loan_product_type"]
          repayment_waterfall: string
          updated_at: string | null
        }
        Insert: {
          allow_partial_payment?: boolean
          created_at?: string | null
          early_repayment_fee_pct?: number
          grace_period_days?: number
          id?: string
          interest_calc_method?: string
          late_penalty_basis?: string
          late_penalty_rate?: number
          min_repayment_amount?: number
          product_type: Database["public"]["Enums"]["loan_product_type"]
          repayment_waterfall?: string
          updated_at?: string | null
        }
        Update: {
          allow_partial_payment?: boolean
          created_at?: string | null
          early_repayment_fee_pct?: number
          grace_period_days?: number
          id?: string
          interest_calc_method?: string
          late_penalty_basis?: string
          late_penalty_rate?: number
          min_repayment_amount?: number
          product_type?: Database["public"]["Enums"]["loan_product_type"]
          repayment_waterfall?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      loan_events: {
        Row: {
          amount: number | null
          cbs_posted_at: string | null
          cbs_reference: string | null
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          loan_id: string
          metadata: Json | null
          posted_to_cbs: boolean | null
          profile_id: string
        }
        Insert: {
          amount?: number | null
          cbs_posted_at?: string | null
          cbs_reference?: string | null
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          loan_id: string
          metadata?: Json | null
          posted_to_cbs?: boolean | null
          profile_id: string
        }
        Update: {
          amount?: number | null
          cbs_posted_at?: string | null
          cbs_reference?: string | null
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          loan_id?: string
          metadata?: Json | null
          posted_to_cbs?: boolean | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_events_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_interest_accruals: {
        Row: {
          accrual_date: string
          accrual_type: string
          accrued_amount: number
          created_at: string | null
          daily_rate: number
          id: string
          is_posted: boolean | null
          loan_id: string
          principal_balance: number
          profile_id: string
        }
        Insert: {
          accrual_date: string
          accrual_type?: string
          accrued_amount?: number
          created_at?: string | null
          daily_rate?: number
          id?: string
          is_posted?: boolean | null
          loan_id: string
          principal_balance?: number
          profile_id: string
        }
        Update: {
          accrual_date?: string
          accrual_type?: string
          accrued_amount?: number
          created_at?: string | null
          daily_rate?: number
          id?: string
          is_posted?: boolean | null
          loan_id?: string
          principal_balance?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_interest_accruals_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_penalties: {
        Row: {
          amount: number
          calculation_basis: string | null
          created_at: string | null
          days_overdue: number | null
          id: string
          is_waived: boolean | null
          loan_id: string
          penalty_type: string
          profile_id: string
          schedule_id: string | null
          waived_at: string | null
          waived_by: string | null
          waiver_reason: string | null
        }
        Insert: {
          amount?: number
          calculation_basis?: string | null
          created_at?: string | null
          days_overdue?: number | null
          id?: string
          is_waived?: boolean | null
          loan_id: string
          penalty_type: string
          profile_id: string
          schedule_id?: string | null
          waived_at?: string | null
          waived_by?: string | null
          waiver_reason?: string | null
        }
        Update: {
          amount?: number
          calculation_basis?: string | null
          created_at?: string | null
          days_overdue?: number | null
          id?: string
          is_waived?: boolean | null
          loan_id?: string
          penalty_type?: string
          profile_id?: string
          schedule_id?: string | null
          waived_at?: string | null
          waived_by?: string | null
          waiver_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_penalties_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_penalties_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "loan_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_repayments: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          due_date: string
          id: string
          installment_number: number
          interest: number
          loan_id: string
          paid_at: string | null
          principal: number
          profile_id: string
          status: Database["public"]["Enums"]["repayment_status"] | null
          total_due: number
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          due_date: string
          id?: string
          installment_number: number
          interest: number
          loan_id: string
          paid_at?: string | null
          principal: number
          profile_id: string
          status?: Database["public"]["Enums"]["repayment_status"] | null
          total_due: number
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          interest?: number
          loan_id?: string
          paid_at?: string | null
          principal?: number
          profile_id?: string
          status?: Database["public"]["Enums"]["repayment_status"] | null
          total_due?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_repayments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_schedules: {
        Row: {
          amount_paid: number | null
          closing_balance: number
          created_at: string | null
          due_date: string
          id: string
          installment_number: number
          interest: number
          loan_id: string
          opening_balance: number
          paid_at: string | null
          penalty_amount: number | null
          principal: number
          profile_id: string
          status: string
          total_due: number
        }
        Insert: {
          amount_paid?: number | null
          closing_balance?: number
          created_at?: string | null
          due_date: string
          id?: string
          installment_number: number
          interest?: number
          loan_id: string
          opening_balance?: number
          paid_at?: string | null
          penalty_amount?: number | null
          principal?: number
          profile_id: string
          status?: string
          total_due?: number
        }
        Update: {
          amount_paid?: number | null
          closing_balance?: number
          created_at?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          interest?: number
          loan_id?: string
          opening_balance?: number
          paid_at?: string | null
          penalty_amount?: number | null
          principal?: number
          profile_id?: string
          status?: string
          total_due?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_schedules_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_statements: {
        Row: {
          closing_balance: number
          created_at: string | null
          disbursements: number | null
          generated_at: string | null
          id: string
          interest_charged: number | null
          loan_id: string
          opening_balance: number
          penalties_charged: number | null
          profile_id: string
          repayments: number | null
          statement_period_end: string
          statement_period_start: string
          waivers_applied: number | null
        }
        Insert: {
          closing_balance?: number
          created_at?: string | null
          disbursements?: number | null
          generated_at?: string | null
          id?: string
          interest_charged?: number | null
          loan_id: string
          opening_balance?: number
          penalties_charged?: number | null
          profile_id: string
          repayments?: number | null
          statement_period_end: string
          statement_period_start: string
          waivers_applied?: number | null
        }
        Update: {
          closing_balance?: number
          created_at?: string | null
          disbursements?: number | null
          generated_at?: string | null
          id?: string
          interest_charged?: number | null
          loan_id?: string
          opening_balance?: number
          penalties_charged?: number | null
          profile_id?: string
          repayments?: number | null
          statement_period_end?: string
          statement_period_start?: string
          waivers_applied?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_statements_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_waivers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          loan_id: string
          original_amount: number
          profile_id: string
          reason: string | null
          requested_by: string | null
          status: string
          waived_amount: number
          waiver_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          loan_id: string
          original_amount?: number
          profile_id: string
          reason?: string | null
          requested_by?: string | null
          status?: string
          waived_amount?: number
          waiver_type: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          loan_id?: string
          original_amount?: number
          profile_id?: string
          reason?: string | null
          requested_by?: string | null
          status?: string
          waived_amount?: number
          waiver_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_waivers_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          collateral_description: string | null
          created_at: string | null
          disbursed_at: string | null
          disbursement_account_id: string | null
          guarantor_msisdn: string | null
          guarantor_name: string | null
          id: string
          interest_rate: number
          monthly_installment: number | null
          next_due_date: string | null
          outstanding_balance: number | null
          product_type: Database["public"]["Enums"]["loan_product_type"]
          profile_id: string
          purpose: string | null
          status: Database["public"]["Enums"]["loan_status"] | null
          tenor_months: number
          total_payable: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          collateral_description?: string | null
          created_at?: string | null
          disbursed_at?: string | null
          disbursement_account_id?: string | null
          guarantor_msisdn?: string | null
          guarantor_name?: string | null
          id?: string
          interest_rate?: number
          monthly_installment?: number | null
          next_due_date?: string | null
          outstanding_balance?: number | null
          product_type?: Database["public"]["Enums"]["loan_product_type"]
          profile_id: string
          purpose?: string | null
          status?: Database["public"]["Enums"]["loan_status"] | null
          tenor_months: number
          total_payable?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          collateral_description?: string | null
          created_at?: string | null
          disbursed_at?: string | null
          disbursement_account_id?: string | null
          guarantor_msisdn?: string | null
          guarantor_name?: string | null
          id?: string
          interest_rate?: number
          monthly_installment?: number | null
          next_due_date?: string | null
          outstanding_balance?: number | null
          product_type?: Database["public"]["Enums"]["loan_product_type"]
          profile_id?: string
          purpose?: string | null
          status?: Database["public"]["Enums"]["loan_status"] | null
          tenor_months?: number
          total_payable?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_disbursement_account_id_fkey"
            columns: ["disbursement_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_settlements: {
        Row: {
          bank_account: string
          created_at: string | null
          fee_amount: number
          fee_percent: number
          gross_amount: number
          id: string
          net_amount: number
          profile_id: string
          settlement_date: string
          status: string
          transaction_count: number
          tx_ids: string[] | null
        }
        Insert: {
          bank_account?: string
          created_at?: string | null
          fee_amount?: number
          fee_percent?: number
          gross_amount: number
          id?: string
          net_amount?: number
          profile_id: string
          settlement_date?: string
          status?: string
          transaction_count?: number
          tx_ids?: string[] | null
        }
        Update: {
          bank_account?: string
          created_at?: string | null
          fee_amount?: number
          fee_percent?: number
          gross_amount?: number
          id?: string
          net_amount?: number
          profile_id?: string
          settlement_date?: string
          status?: string
          transaction_count?: number
          tx_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_settlements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          direction: string
          id: string
          profile_id: string
          reference: string
          status: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string
          direction: string
          id?: string
          profile_id: string
          reference?: string
          status?: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          direction?: string
          id?: string
          profile_id?: string
          reference?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_vendors: {
        Row: {
          account_number: string
          bank: string
          business: string
          created_at: string | null
          id: string
          name: string
          phone: string
          profile_id: string
          total_paid: number
        }
        Insert: {
          account_number?: string
          bank?: string
          business?: string
          created_at?: string | null
          id?: string
          name: string
          phone?: string
          profile_id: string
          total_paid?: number
        }
        Update: {
          account_number?: string
          bank?: string
          business?: string
          created_at?: string | null
          id?: string
          name?: string
          phone?: string
          profile_id?: string
          total_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "merchant_vendors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_wallets: {
        Row: {
          bank_account_holder: string
          bank_account_number: string
          bank_name: string
          created_at: string | null
          id: string
          profile_id: string
          savings_balance: number
          updated_at: string | null
          wallet_balance: number
        }
        Insert: {
          bank_account_holder?: string
          bank_account_number?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          profile_id: string
          savings_balance?: number
          updated_at?: string | null
          wallet_balance?: number
        }
        Update: {
          bank_account_holder?: string
          bank_account_number?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          profile_id?: string
          savings_balance?: number
          updated_at?: string | null
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "merchant_wallets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          profile_id: string
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          profile_id: string
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          profile_id?: string
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          alternate_phone: string | null
          avatar_url: string | null
          business_type: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          father_name: string
          father_name_am: string | null
          first_name: string
          first_name_am: string | null
          gender: string | null
          gps_lat: number | null
          gps_lng: number | null
          grandfather_name: string | null
          grandfather_name_am: string | null
          house_number: string | null
          id: string
          income_band: string | null
          kebele: string | null
          kyc_tier: Database["public"]["Enums"]["kyc_status"] | null
          marital_status: string | null
          msisdn: string | null
          occupation: string | null
          preferred_language: string | null
          profile_completeness: number | null
          region: string | null
          risk_score: number | null
          sector: string | null
          updated_at: string | null
          woreda: string | null
        }
        Insert: {
          alternate_phone?: string | null
          avatar_url?: string | null
          business_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          father_name?: string
          father_name_am?: string | null
          first_name?: string
          first_name_am?: string | null
          gender?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          grandfather_name?: string | null
          grandfather_name_am?: string | null
          house_number?: string | null
          id: string
          income_band?: string | null
          kebele?: string | null
          kyc_tier?: Database["public"]["Enums"]["kyc_status"] | null
          marital_status?: string | null
          msisdn?: string | null
          occupation?: string | null
          preferred_language?: string | null
          profile_completeness?: number | null
          region?: string | null
          risk_score?: number | null
          sector?: string | null
          updated_at?: string | null
          woreda?: string | null
        }
        Update: {
          alternate_phone?: string | null
          avatar_url?: string | null
          business_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          father_name?: string
          father_name_am?: string | null
          first_name?: string
          first_name_am?: string | null
          gender?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          grandfather_name?: string | null
          grandfather_name_am?: string | null
          house_number?: string | null
          id?: string
          income_band?: string | null
          kebele?: string | null
          kyc_tier?: Database["public"]["Enums"]["kyc_status"] | null
          marital_status?: string | null
          msisdn?: string | null
          occupation?: string | null
          preferred_language?: string | null
          profile_completeness?: number | null
          region?: string | null
          risk_score?: number | null
          sector?: string | null
          updated_at?: string | null
          woreda?: string | null
        }
        Relationships: []
      }
      saved_billers: {
        Row: {
          account_number: string
          biller_category: string
          biller_name: string
          created_at: string | null
          id: string
          nickname: string | null
          profile_id: string
        }
        Insert: {
          account_number: string
          biller_category: string
          biller_name: string
          created_at?: string | null
          id?: string
          nickname?: string | null
          profile_id: string
        }
        Update: {
          account_number?: string
          biller_category?: string
          biller_name?: string
          created_at?: string | null
          id?: string
          nickname?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_billers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          profile_id: string
          resolution: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          ticket_number: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          profile_id: string
          resolution?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          ticket_number?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          profile_id?: string
          resolution?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          channel: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          direction: Database["public"]["Enums"]["transaction_direction"]
          fee: number | null
          id: string
          metadata: Json | null
          profile_id: string
          recipient_account: string | null
          recipient_msisdn: string | null
          recipient_name: string | null
          reference: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          account_id: string
          amount: number
          channel?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          direction: Database["public"]["Enums"]["transaction_direction"]
          fee?: number | null
          id?: string
          metadata?: Json | null
          profile_id: string
          recipient_account?: string | null
          recipient_msisdn?: string | null
          recipient_name?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          account_id?: string
          amount?: number
          channel?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          direction?: Database["public"]["Enums"]["transaction_direction"]
          fee?: number | null
          id?: string
          metadata?: Json | null
          profile_id?: string
          recipient_account?: string | null
          recipient_msisdn?: string | null
          recipient_name?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_airtime_purchase: {
        Args: {
          p_account_id: string
          p_amount: number
          p_operator?: string
          p_phone: string
        }
        Returns: Json
      }
      process_bill_payment: {
        Args: {
          p_account_id: string
          p_amount: number
          p_biller_account: string
          p_biller_name: string
          p_fee?: number
        }
        Returns: Json
      }
      process_transfer: {
        Args: {
          p_amount: number
          p_description?: string
          p_fee?: number
          p_from_account_id: string
          p_to_msisdn: string
        }
        Returns: Json
      }
    }
    Enums: {
      account_status: "active" | "dormant" | "closed" | "frozen"
      account_type: "savings" | "wallet" | "current"
      consent_type:
        | "digital_statements"
        | "marketing"
        | "data_sharing"
        | "analytics"
      kyc_status: "pending" | "simplified" | "full" | "rejected" | "expired"
      loan_product_type:
        | "micro"
        | "retail"
        | "msme"
        | "consumer"
        | "nano"
        | "agri"
      loan_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "disbursed"
        | "active"
        | "closed"
        | "defaulted"
        | "rejected"
      repayment_status: "pending" | "paid" | "overdue" | "partial"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      transaction_direction: "credit" | "debit"
      transaction_status: "pending" | "completed" | "failed" | "reversed"
      transaction_type:
        | "transfer"
        | "bill_payment"
        | "airtime"
        | "loan_repayment"
        | "deposit"
        | "withdrawal"
        | "fee"
        | "interest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "dormant", "closed", "frozen"],
      account_type: ["savings", "wallet", "current"],
      consent_type: [
        "digital_statements",
        "marketing",
        "data_sharing",
        "analytics",
      ],
      kyc_status: ["pending", "simplified", "full", "rejected", "expired"],
      loan_product_type: [
        "micro",
        "retail",
        "msme",
        "consumer",
        "nano",
        "agri",
      ],
      loan_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "disbursed",
        "active",
        "closed",
        "defaulted",
        "rejected",
      ],
      repayment_status: ["pending", "paid", "overdue", "partial"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      transaction_direction: ["credit", "debit"],
      transaction_status: ["pending", "completed", "failed", "reversed"],
      transaction_type: [
        "transfer",
        "bill_payment",
        "airtime",
        "loan_repayment",
        "deposit",
        "withdrawal",
        "fee",
        "interest",
      ],
    },
  },
} as const
