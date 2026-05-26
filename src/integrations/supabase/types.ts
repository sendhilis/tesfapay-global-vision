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
      accounting_periods: {
        Row: {
          created_at: string | null
          fiscal_year: number
          id: string
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
          notes: string | null
          period_end: string
          period_name: string
          period_start: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fiscal_year: number
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          period_end: string
          period_name: string
          period_start: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fiscal_year?: number
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          period_end?: string
          period_name?: string
          period_start?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      agent_float_requests: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          providing_agent_id: string
          requested_at: string | null
          requesting_agent_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          providing_agent_id: string
          requested_at?: string | null
          requesting_agent_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          providing_agent_id?: string
          requested_at?: string | null
          requesting_agent_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_float_requests_providing_agent_id_fkey"
            columns: ["providing_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_float_requests_requesting_agent_id_fkey"
            columns: ["requesting_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_transactions: {
        Row: {
          agent_id: string
          amount: number
          created_at: string | null
          customer_msisdn: string | null
          customer_name: string | null
          customer_profile_id: string | null
          fee: number | null
          id: string
          notes: string | null
          reference: string | null
          status: string
          transaction_type: string
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string | null
          customer_msisdn?: string | null
          customer_name?: string | null
          customer_profile_id?: string | null
          fee?: number | null
          id?: string
          notes?: string | null
          reference?: string | null
          status?: string
          transaction_type: string
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string | null
          customer_msisdn?: string | null
          customer_name?: string | null
          customer_profile_id?: string | null
          fee?: number | null
          id?: string
          notes?: string | null
          reference?: string | null
          status?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agent_category: Database["public"]["Enums"]["agent_category"]
          agent_code: string
          business_name: string
          commission_rate: number
          created_at: string | null
          daily_cash_in_limit: number
          daily_cash_out_limit: number
          float_balance: number
          id: string
          location: string
          max_float: number
          onboarded_at: string | null
          parent_agent_id: string | null
          phone: string
          profile_id: string
          status: Database["public"]["Enums"]["agent_status"]
          updated_at: string | null
        }
        Insert: {
          agent_category?: Database["public"]["Enums"]["agent_category"]
          agent_code?: string
          business_name?: string
          commission_rate?: number
          created_at?: string | null
          daily_cash_in_limit?: number
          daily_cash_out_limit?: number
          float_balance?: number
          id?: string
          location?: string
          max_float?: number
          onboarded_at?: string | null
          parent_agent_id?: string | null
          phone?: string
          profile_id: string
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string | null
        }
        Update: {
          agent_category?: Database["public"]["Enums"]["agent_category"]
          agent_code?: string
          business_name?: string
          commission_rate?: number
          created_at?: string | null
          daily_cash_in_limit?: number
          daily_cash_out_limit?: number
          float_balance?: number
          id?: string
          location?: string
          max_float?: number
          onboarded_at?: string | null
          parent_agent_id?: string | null
          phone?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_parent_agent_id_fkey"
            columns: ["parent_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      aml_alerts: {
        Row: {
          agent_id: string | null
          alert_type: string
          amount: number | null
          assigned_to: string | null
          auto_generated: boolean | null
          created_at: string | null
          description: string | null
          escalated_at: string | null
          id: string
          metadata: Json | null
          profile_id: string | null
          resolved_at: string | null
          review_decision: string | null
          review_rationale: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screening_result: Json | null
          severity: string
          status: string
          threshold_breached: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          alert_type: string
          amount?: number | null
          assigned_to?: string | null
          auto_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          escalated_at?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          resolved_at?: string | null
          review_decision?: string | null
          review_rationale?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screening_result?: Json | null
          severity?: string
          status?: string
          threshold_breached?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          alert_type?: string
          amount?: number | null
          assigned_to?: string | null
          auto_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          escalated_at?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          resolved_at?: string | null
          review_decision?: string | null
          review_rationale?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screening_result?: Json | null
          severity?: string
          status?: string
          threshold_breached?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      aml_ctr_reports: {
        Row: {
          created_at: string | null
          customer_info: Json | null
          fic_reference: string | null
          id: string
          notes: string | null
          profile_id: string | null
          report_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          total_amount: number
          transaction_count: number
          transaction_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_info?: Json | null
          fic_reference?: string | null
          id?: string
          notes?: string | null
          profile_id?: string | null
          report_date: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          total_amount: number
          transaction_count?: number
          transaction_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_info?: Json | null
          fic_reference?: string | null
          id?: string
          notes?: string | null
          profile_id?: string | null
          report_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          transaction_count?: number
          transaction_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      aml_screening_log: {
        Row: {
          created_at: string | null
          id: string
          latency_ms: number | null
          match_found: boolean | null
          match_score: number | null
          profile_id: string | null
          provider: string | null
          request_payload: Json | null
          response_payload: Json | null
          screening_lists: string[] | null
          screening_type: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          match_found?: boolean | null
          match_score?: number | null
          profile_id?: string | null
          provider?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          screening_lists?: string[] | null
          screening_type: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          match_found?: boolean | null
          match_score?: number | null
          profile_id?: string | null
          provider?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          screening_lists?: string[] | null
          screening_type?: string
          transaction_id?: string | null
        }
        Relationships: []
      }
      aml_str_filings: {
        Row: {
          alert_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_info: Json | null
          fic_acknowledged_at: string | null
          fic_reference: string | null
          filed_by: string | null
          filing_date: string | null
          filing_status: string
          id: string
          narrative: string | null
          profile_id: string | null
          submission_deadline: string | null
          submitted_at: string | null
          suspicious_indicators: Json | null
          transaction_summary: Json | null
          updated_at: string | null
        }
        Insert: {
          alert_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_info?: Json | null
          fic_acknowledged_at?: string | null
          fic_reference?: string | null
          filed_by?: string | null
          filing_date?: string | null
          filing_status?: string
          id?: string
          narrative?: string | null
          profile_id?: string | null
          submission_deadline?: string | null
          submitted_at?: string | null
          suspicious_indicators?: Json | null
          transaction_summary?: Json | null
          updated_at?: string | null
        }
        Update: {
          alert_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_info?: Json | null
          fic_acknowledged_at?: string | null
          fic_reference?: string | null
          filed_by?: string | null
          filing_date?: string | null
          filing_status?: string
          id?: string
          narrative?: string | null
          profile_id?: string | null
          submission_deadline?: string | null
          submitted_at?: string | null
          suspicious_indicators?: Json | null
          transaction_summary?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aml_str_filings_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "aml_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          payload: Json
          profile_id: string
          remarks: string | null
          request_type: string
          status: string
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          payload?: Json
          profile_id: string
          remarks?: string | null
          request_type: string
          status?: string
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          payload?: Json
          profile_id?: string
          remarks?: string | null
          request_type?: string
          status?: string
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      bdp_dim_customers: {
        Row: {
          account_open_date: string | null
          age_band: string | null
          cbs_customer_id: string | null
          created_at: string | null
          customer_segment: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          kyc_tier: string | null
          last_synced_at: string | null
          profile_id: string | null
          region: string
          source_system: string | null
          sub_city: string | null
        }
        Insert: {
          account_open_date?: string | null
          age_band?: string | null
          cbs_customer_id?: string | null
          created_at?: string | null
          customer_segment?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          kyc_tier?: string | null
          last_synced_at?: string | null
          profile_id?: string | null
          region?: string
          source_system?: string | null
          sub_city?: string | null
        }
        Update: {
          account_open_date?: string | null
          age_band?: string | null
          cbs_customer_id?: string | null
          created_at?: string | null
          customer_segment?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          kyc_tier?: string | null
          last_synced_at?: string | null
          profile_id?: string | null
          region?: string
          source_system?: string | null
          sub_city?: string | null
        }
        Relationships: []
      }
      bdp_dim_products: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          interest_rate: number | null
          is_active: boolean | null
          product_category: string
          product_code: string
          product_name: string
          product_type: string
          source_system: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          product_category: string
          product_code: string
          product_name: string
          product_type: string
          source_system?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          interest_rate?: number | null
          is_active?: boolean | null
          product_category?: string
          product_code?: string
          product_name?: string
          product_type?: string
          source_system?: string | null
        }
        Relationships: []
      }
      bdp_dim_time: {
        Row: {
          date_key: string
          day_of_month: number
          day_of_week: number
          day_of_year: number
          fiscal_year: number
          holiday_name: string | null
          is_holiday: boolean
          is_weekend: boolean
          month: number
          month_name: string
          quarter: number
          week_of_year: number
          year: number
        }
        Insert: {
          date_key: string
          day_of_month: number
          day_of_week: number
          day_of_year: number
          fiscal_year: number
          holiday_name?: string | null
          is_holiday?: boolean
          is_weekend?: boolean
          month: number
          month_name: string
          quarter: number
          week_of_year: number
          year: number
        }
        Update: {
          date_key?: string
          day_of_month?: number
          day_of_week?: number
          day_of_year?: number
          fiscal_year?: number
          holiday_name?: string | null
          is_holiday?: boolean
          is_weekend?: boolean
          month?: number
          month_name?: string
          quarter?: number
          week_of_year?: number
          year?: number
        }
        Relationships: []
      }
      bdp_fact_agents: {
        Row: {
          agent_code: string | null
          agent_id: string | null
          agent_name: string | null
          aml_flags: number | null
          batch_id: string | null
          cash_in_count: number | null
          cash_in_volume: number | null
          cash_out_count: number | null
          cash_out_volume: number | null
          commission_earned: number | null
          created_at: string | null
          float_balance: number | null
          id: string
          is_active: boolean | null
          region: string | null
          report_date: string
          source_system: string | null
          transfer_count: number | null
          transfer_volume: number | null
        }
        Insert: {
          agent_code?: string | null
          agent_id?: string | null
          agent_name?: string | null
          aml_flags?: number | null
          batch_id?: string | null
          cash_in_count?: number | null
          cash_in_volume?: number | null
          cash_out_count?: number | null
          cash_out_volume?: number | null
          commission_earned?: number | null
          created_at?: string | null
          float_balance?: number | null
          id?: string
          is_active?: boolean | null
          region?: string | null
          report_date: string
          source_system?: string | null
          transfer_count?: number | null
          transfer_volume?: number | null
        }
        Update: {
          agent_code?: string | null
          agent_id?: string | null
          agent_name?: string | null
          aml_flags?: number | null
          batch_id?: string | null
          cash_in_count?: number | null
          cash_in_volume?: number | null
          cash_out_count?: number | null
          cash_out_volume?: number | null
          commission_earned?: number | null
          created_at?: string | null
          float_balance?: number | null
          id?: string
          is_active?: boolean | null
          region?: string | null
          report_date?: string
          source_system?: string | null
          transfer_count?: number | null
          transfer_volume?: number | null
        }
        Relationships: []
      }
      bdp_fact_loans: {
        Row: {
          batch_id: string | null
          cbs_loan_id: string | null
          collateral_value: number | null
          created_at: string | null
          customer_id: string | null
          days_past_due: number | null
          disbursed_amount: number | null
          disbursement_date: string | null
          id: string
          interest_rate: number | null
          loan_account_number: string | null
          maturity_date: string | null
          npl_classification: string | null
          outstanding_interest: number | null
          outstanding_principal: number | null
          product_id: string | null
          provision_amount: number | null
          provision_rate: number | null
          risk_weight: number | null
          snapshot_date: string
          source_system: string | null
          tenor_months: number | null
          total_outstanding: number | null
        }
        Insert: {
          batch_id?: string | null
          cbs_loan_id?: string | null
          collateral_value?: number | null
          created_at?: string | null
          customer_id?: string | null
          days_past_due?: number | null
          disbursed_amount?: number | null
          disbursement_date?: string | null
          id?: string
          interest_rate?: number | null
          loan_account_number?: string | null
          maturity_date?: string | null
          npl_classification?: string | null
          outstanding_interest?: number | null
          outstanding_principal?: number | null
          product_id?: string | null
          provision_amount?: number | null
          provision_rate?: number | null
          risk_weight?: number | null
          snapshot_date: string
          source_system?: string | null
          tenor_months?: number | null
          total_outstanding?: number | null
        }
        Update: {
          batch_id?: string | null
          cbs_loan_id?: string | null
          collateral_value?: number | null
          created_at?: string | null
          customer_id?: string | null
          days_past_due?: number | null
          disbursed_amount?: number | null
          disbursement_date?: string | null
          id?: string
          interest_rate?: number | null
          loan_account_number?: string | null
          maturity_date?: string | null
          npl_classification?: string | null
          outstanding_interest?: number | null
          outstanding_principal?: number | null
          product_id?: string | null
          provision_amount?: number | null
          provision_rate?: number | null
          risk_weight?: number | null
          snapshot_date?: string
          source_system?: string | null
          tenor_months?: number | null
          total_outstanding?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bdp_fact_loans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "bdp_dim_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bdp_fact_loans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bdp_dim_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bdp_fact_transactions: {
        Row: {
          amount: number
          batch_id: string | null
          cbs_reference: string | null
          channel: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          direction: string
          fee: number | null
          id: string
          product_id: string | null
          source_system: string | null
          source_transaction_id: string | null
          status: string | null
          transaction_date: string
          transaction_time: string | null
          transaction_type: string
        }
        Insert: {
          amount?: number
          batch_id?: string | null
          cbs_reference?: string | null
          channel?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          direction: string
          fee?: number | null
          id?: string
          product_id?: string | null
          source_system?: string | null
          source_transaction_id?: string | null
          status?: string | null
          transaction_date: string
          transaction_time?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          batch_id?: string | null
          cbs_reference?: string | null
          channel?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          direction?: string
          fee?: number | null
          id?: string
          product_id?: string | null
          source_system?: string | null
          source_transaction_id?: string | null
          status?: string | null
          transaction_date?: string
          transaction_time?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bdp_fact_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "bdp_dim_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bdp_fact_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "bdp_dim_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bdp_ingestion_logs: {
        Row: {
          batch_id: string
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          entity_type: string
          errors: Json | null
          id: string
          records_failed: number | null
          records_processed: number | null
          records_received: number | null
          source_system: string
          started_at: string | null
          status: string | null
          triggered_by: string | null
        }
        Insert: {
          batch_id?: string
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          entity_type: string
          errors?: Json | null
          id?: string
          records_failed?: number | null
          records_processed?: number | null
          records_received?: number | null
          source_system: string
          started_at?: string | null
          status?: string | null
          triggered_by?: string | null
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          entity_type?: string
          errors?: Json | null
          id?: string
          records_failed?: number | null
          records_processed?: number | null
          records_received?: number | null
          source_system?: string
          started_at?: string | null
          status?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      bdp_snapshots: {
        Row: {
          batch_id: string | null
          created_at: string | null
          id: string
          metric_category: string
          metrics: Json
          snapshot_date: string
          snapshot_type: string
          source_system: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          metric_category: string
          metrics?: Json
          snapshot_date: string
          snapshot_type?: string
          source_system?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          metric_category?: string
          metrics?: Json
          snapshot_date?: string
          snapshot_type?: string
          source_system?: string | null
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          account_number: string
          bank_name: string
          beneficiary_name: string
          created_at: string | null
          id: string
          is_active: boolean
          nickname: string | null
          phone: string | null
          profile_id: string
          transfer_type: string
          updated_at: string | null
        }
        Insert: {
          account_number: string
          bank_name?: string
          beneficiary_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          nickname?: string | null
          phone?: string | null
          profile_id: string
          transfer_type?: string
          updated_at?: string | null
        }
        Update: {
          account_number?: string
          bank_name?: string
          beneficiary_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          nickname?: string | null
          phone?: string | null
          profile_id?: string
          transfer_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_type: string
          balance: number
          cbs_code: string | null
          created_at: string | null
          description: string | null
          gl_code: string
          id: string
          is_pool_gl: boolean
          name: string
          parent_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          account_type: string
          balance?: number
          cbs_code?: string | null
          created_at?: string | null
          description?: string | null
          gl_code: string
          id?: string
          is_pool_gl?: boolean
          name: string
          parent_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_type?: string
          balance?: number
          cbs_code?: string | null
          created_at?: string | null
          description?: string | null
          gl_code?: string
          id?: string
          is_pool_gl?: boolean
          name?: string
          parent_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["id"]
          },
        ]
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
      corporate_entities: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          articles_of_association_url: string | null
          board_resolution_url: string | null
          business_type: string | null
          city: string | null
          company_name: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          maker_checker_threshold: number | null
          max_daily_limit: number | null
          max_transaction_limit: number | null
          region: string | null
          rm_assigned: string | null
          sector: string | null
          status: string
          tin_number: string
          trade_license: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          articles_of_association_url?: string | null
          board_resolution_url?: string | null
          business_type?: string | null
          city?: string | null
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          maker_checker_threshold?: number | null
          max_daily_limit?: number | null
          max_transaction_limit?: number | null
          region?: string | null
          rm_assigned?: string | null
          sector?: string | null
          status?: string
          tin_number: string
          trade_license?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          articles_of_association_url?: string | null
          board_resolution_url?: string | null
          business_type?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          maker_checker_threshold?: number | null
          max_daily_limit?: number | null
          max_transaction_limit?: number | null
          region?: string | null
          rm_assigned?: string | null
          sector?: string | null
          status?: string
          tin_number?: string
          trade_license?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      corporate_users: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          can_approve_own: boolean | null
          corporate_entity_id: string
          created_at: string | null
          department: string | null
          designation: string | null
          id: string
          is_active: boolean | null
          profile_id: string
          role: Database["public"]["Enums"]["corporate_role"]
          transaction_limit: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          can_approve_own?: boolean | null
          corporate_entity_id: string
          created_at?: string | null
          department?: string | null
          designation?: string | null
          id?: string
          is_active?: boolean | null
          profile_id: string
          role?: Database["public"]["Enums"]["corporate_role"]
          transaction_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          can_approve_own?: boolean | null
          corporate_entity_id?: string
          created_at?: string | null
          department?: string | null
          designation?: string | null
          id?: string
          is_active?: boolean | null
          profile_id?: string
          role?: Database["public"]["Enums"]["corporate_role"]
          transaction_limit?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_users_corporate_entity_id_fkey"
            columns: ["corporate_entity_id"]
            isOneToOne: false
            referencedRelation: "corporate_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_integration_definitions: {
        Row: {
          category_id: string | null
          color: string | null
          config: Json
          created_at: string | null
          created_by: string | null
          definition_type: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          definition_type: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          color?: string | null
          config?: Json
          created_at?: string | null
          created_by?: string | null
          definition_type?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fee_definitions: {
        Row: {
          calculation_method: string
          created_at: string | null
          description: string | null
          fee_gl_id: string | null
          fee_name: string
          flat_amount: number | null
          id: string
          is_active: boolean
          max_fee: number | null
          min_fee: number | null
          percentage_rate: number | null
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          calculation_method: string
          created_at?: string | null
          description?: string | null
          fee_gl_id?: string | null
          fee_name: string
          flat_amount?: number | null
          id?: string
          is_active?: boolean
          max_fee?: number | null
          min_fee?: number | null
          percentage_rate?: number | null
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          calculation_method?: string
          created_at?: string | null
          description?: string | null
          fee_gl_id?: string | null
          fee_name?: string
          flat_amount?: number | null
          id?: string
          is_active?: boolean
          max_fee?: number | null
          min_fee?: number | null
          percentage_rate?: number | null
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_definitions_fee_gl_id_fkey"
            columns: ["fee_gl_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_definitions_fee_gl_id_fkey"
            columns: ["fee_gl_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_deposits: {
        Row: {
          accrued_interest: number
          amount: number
          certificate_number: string
          created_at: string | null
          id: string
          interest_rate: number
          linked_account_id: string | null
          maturity_date: string
          maturity_instruction: string
          placement_date: string
          profile_id: string
          status: string
          tenure_months: number
          updated_at: string | null
        }
        Insert: {
          accrued_interest?: number
          amount: number
          certificate_number?: string
          created_at?: string | null
          id?: string
          interest_rate?: number
          linked_account_id?: string | null
          maturity_date: string
          maturity_instruction?: string
          placement_date?: string
          profile_id: string
          status?: string
          tenure_months: number
          updated_at?: string | null
        }
        Update: {
          accrued_interest?: number
          amount?: number
          certificate_number?: string
          created_at?: string | null
          id?: string
          interest_rate?: number
          linked_account_id?: string | null
          maturity_date?: string
          maturity_instruction?: string
          placement_date?: string
          profile_id?: string
          status?: string
          tenure_months?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_deposits_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_entries: {
        Row: {
          amount: number
          cbs_batch_id: string | null
          cbs_reference: string | null
          created_at: string | null
          credit_account_id: string
          debit_account_id: string
          entry_date: string
          id: string
          narrative: string | null
          posted_to_cbs: boolean
          profile_id: string | null
          source_transaction_id: string | null
          source_type: string | null
        }
        Insert: {
          amount: number
          cbs_batch_id?: string | null
          cbs_reference?: string | null
          created_at?: string | null
          credit_account_id: string
          debit_account_id: string
          entry_date?: string
          id?: string
          narrative?: string | null
          posted_to_cbs?: boolean
          profile_id?: string | null
          source_transaction_id?: string | null
          source_type?: string | null
        }
        Update: {
          amount?: number
          cbs_batch_id?: string | null
          cbs_reference?: string | null
          created_at?: string | null
          credit_account_id?: string
          debit_account_id?: string
          entry_date?: string
          id?: string
          narrative?: string | null
          posted_to_cbs?: boolean
          profile_id?: string | null
          source_transaction_id?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_entries_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_debit_account_id_fkey"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_entries_debit_account_id_fkey"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["id"]
          },
        ]
      }
      gl_mappings: {
        Row: {
          created_at: string | null
          credit_gl_id: string
          debit_gl_id: string
          description: string | null
          direction: string
          fee_gl_id: string | null
          id: string
          is_active: boolean
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_gl_id: string
          debit_gl_id: string
          description?: string | null
          direction: string
          fee_gl_id?: string | null
          id?: string
          is_active?: boolean
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_gl_id?: string
          debit_gl_id?: string
          description?: string | null
          direction?: string
          fee_gl_id?: string | null
          id?: string
          is_active?: boolean
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_mappings_credit_gl_id_fkey"
            columns: ["credit_gl_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_mappings_credit_gl_id_fkey"
            columns: ["credit_gl_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_mappings_debit_gl_id_fkey"
            columns: ["debit_gl_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_mappings_debit_gl_id_fkey"
            columns: ["debit_gl_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_mappings_fee_gl_id_fkey"
            columns: ["fee_gl_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gl_mappings_fee_gl_id_fkey"
            columns: ["fee_gl_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          field_changed: string | null
          id: string
          integration_id: string
          ip_address: string | null
          new_value: string | null
          old_value: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          field_changed?: string | null
          id?: string
          integration_id: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          field_changed?: string | null
          id?: string
          integration_id?: string
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_audit_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_circuit_breaker: {
        Row: {
          cooldown_seconds: number
          created_at: string | null
          failure_count: number
          failure_threshold: number
          id: string
          integration_id: string
          last_failure_at: string | null
          last_state_change_at: string | null
          last_success_at: string | null
          opened_at: string | null
          state: string
          success_count_since_half_open: number
          success_threshold: number
          updated_at: string | null
        }
        Insert: {
          cooldown_seconds?: number
          created_at?: string | null
          failure_count?: number
          failure_threshold?: number
          id?: string
          integration_id: string
          last_failure_at?: string | null
          last_state_change_at?: string | null
          last_success_at?: string | null
          opened_at?: string | null
          state?: string
          success_count_since_half_open?: number
          success_threshold?: number
          updated_at?: string | null
        }
        Update: {
          cooldown_seconds?: number
          created_at?: string | null
          failure_count?: number
          failure_threshold?: number
          id?: string
          integration_id?: string
          last_failure_at?: string | null
          last_state_change_at?: string | null
          last_success_at?: string | null
          opened_at?: string | null
          state?: string
          success_count_since_half_open?: number
          success_threshold?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_circuit_breaker_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: true
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          api_key: string | null
          api_secret: string | null
          auth_token: string | null
          base_url: string | null
          created_at: string | null
          custom_headers: Json | null
          environment: string
          extra_params: Json | null
          id: string
          integration_id: string
          is_active: boolean
          oauth_client_id: string | null
          oauth_client_secret: string | null
          oauth_token_url: string | null
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          auth_token?: string | null
          base_url?: string | null
          created_at?: string | null
          custom_headers?: Json | null
          environment?: string
          extra_params?: Json | null
          id?: string
          integration_id: string
          is_active?: boolean
          oauth_client_id?: string | null
          oauth_client_secret?: string | null
          oauth_token_url?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          auth_token?: string | null
          base_url?: string | null
          created_at?: string | null
          custom_headers?: Json | null
          environment?: string
          extra_params?: Json | null
          id?: string
          integration_id?: string
          is_active?: boolean
          oauth_client_id?: string | null
          oauth_client_secret?: string | null
          oauth_token_url?: string | null
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_configs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          integration_id: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          integration_id: string
          request_count?: number
          window_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          integration_id?: string
          request_count?: number
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_rate_limits_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_retry_queue: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string | null
          dead_lettered_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          integration_id: string
          last_attempted_at: string | null
          max_retries: number
          method: string
          next_retry_at: string
          request_body: Json | null
          request_headers: Json | null
          response_body: Json | null
          response_status: number | null
          source_reference: string | null
          source_type: string | null
          status: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string | null
          dead_lettered_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          integration_id: string
          last_attempted_at?: string | null
          max_retries?: number
          method?: string
          next_retry_at?: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_status?: number | null
          source_reference?: string | null
          source_type?: string | null
          status?: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string | null
          dead_lettered_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          integration_id?: string
          last_attempted_at?: string | null
          max_retries?: number
          method?: string
          next_retry_at?: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_status?: number | null
          source_reference?: string | null
          source_type?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_retry_queue_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_test_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          environment: string
          error_message: string | null
          id: string
          integration_id: string
          is_success: boolean | null
          latency_ms: number | null
          method: string
          request_body: Json | null
          request_headers: Json | null
          response_body: Json | null
          response_headers: Json | null
          response_status: number | null
          tested_by: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          environment?: string
          error_message?: string | null
          id?: string
          integration_id: string
          is_success?: boolean | null
          latency_ms?: number | null
          method?: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_headers?: Json | null
          response_status?: number | null
          tested_by?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          environment?: string
          error_message?: string | null
          id?: string
          integration_id?: string
          is_success?: boolean | null
          latency_ms?: number | null
          method?: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_headers?: Json | null
          response_status?: number | null
          tested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_test_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          auth_type: string
          category: string
          created_at: string | null
          default_headers: Json | null
          description: string | null
          documentation_url: string | null
          environment: string
          health_status: string
          id: string
          ip_whitelist: string[] | null
          is_enabled: boolean
          last_health_check: string | null
          logo_url: string | null
          name: string
          production_base_url: string | null
          rate_limit_per_minute: number | null
          sandbox_base_url: string | null
          slug: string
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          auth_type?: string
          category?: string
          created_at?: string | null
          default_headers?: Json | null
          description?: string | null
          documentation_url?: string | null
          environment?: string
          health_status?: string
          id?: string
          ip_whitelist?: string[] | null
          is_enabled?: boolean
          last_health_check?: string | null
          logo_url?: string | null
          name: string
          production_base_url?: string | null
          rate_limit_per_minute?: number | null
          sandbox_base_url?: string | null
          slug: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          auth_type?: string
          category?: string
          created_at?: string | null
          default_headers?: Json | null
          description?: string | null
          documentation_url?: string | null
          environment?: string
          health_status?: string
          id?: string
          ip_whitelist?: string[] | null
          is_enabled?: boolean
          last_health_check?: string | null
          logo_url?: string | null
          name?: string
          production_base_url?: string | null
          rate_limit_per_minute?: number | null
          sandbox_base_url?: string | null
          slug?: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          amount: number
          created_at: string | null
          credit_account_id: string
          debit_account_id: string
          entry_date: string
          id: string
          is_reversal: boolean | null
          journal_number: string
          journal_type: string
          narrative: string
          posted_by: string | null
          reference: string | null
          reversed_entry_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          credit_account_id: string
          debit_account_id: string
          entry_date?: string
          id?: string
          is_reversal?: boolean | null
          journal_number?: string
          journal_type?: string
          narrative: string
          posted_by?: string | null
          reference?: string | null
          reversed_entry_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          credit_account_id?: string
          debit_account_id?: string
          entry_date?: string
          id?: string
          is_reversal?: boolean | null
          journal_number?: string
          journal_type?: string
          narrative?: string
          posted_by?: string | null
          reference?: string | null
          reversed_entry_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_debit_account_id_fkey"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_debit_account_id_fkey"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversed_entry_id_fkey"
            columns: ["reversed_entry_id"]
            isOneToOne: false
            referencedRelation: "gl_entries"
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
          expiry_date: string | null
          front_image_url: string | null
          id: string
          issue_date: string | null
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
          expiry_date?: string | null
          front_image_url?: string | null
          id?: string
          issue_date?: string | null
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
          expiry_date?: string | null
          front_image_url?: string | null
          id?: string
          issue_date?: string | null
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
      pool_gl_batches: {
        Row: {
          batch_number: string
          cbs_reference: string | null
          cbs_response: Json | null
          created_at: string | null
          created_by: string | null
          entry_count: number
          gl_account_id: string
          id: string
          net_amount: number
          posted_at: string | null
          status: string
          total_credit: number
          total_debit: number
          updated_at: string | null
        }
        Insert: {
          batch_number?: string
          cbs_reference?: string | null
          cbs_response?: Json | null
          created_at?: string | null
          created_by?: string | null
          entry_count?: number
          gl_account_id: string
          id?: string
          net_amount?: number
          posted_at?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          cbs_reference?: string | null
          cbs_response?: Json | null
          created_at?: string | null
          created_by?: string | null
          entry_count?: number
          gl_account_id?: string
          id?: string
          net_amount?: number
          posted_at?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_gl_batches_gl_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_gl_batches_gl_account_id_fkey"
            columns: ["gl_account_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
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
          employer_name: string | null
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
          is_foreign_national: boolean | null
          kebele: string | null
          kyc_tier: Database["public"]["Enums"]["kyc_status"] | null
          marital_status: string | null
          msisdn: string | null
          msisdn_verified: boolean | null
          nationality: string | null
          occupation: string | null
          place_of_birth_region: string | null
          preferred_language: string | null
          profile_completeness: number | null
          region: string | null
          risk_score: number | null
          sector: string | null
          source_of_funds: string | null
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
          employer_name?: string | null
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
          is_foreign_national?: boolean | null
          kebele?: string | null
          kyc_tier?: Database["public"]["Enums"]["kyc_status"] | null
          marital_status?: string | null
          msisdn?: string | null
          msisdn_verified?: boolean | null
          nationality?: string | null
          occupation?: string | null
          place_of_birth_region?: string | null
          preferred_language?: string | null
          profile_completeness?: number | null
          region?: string | null
          risk_score?: number | null
          sector?: string | null
          source_of_funds?: string | null
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
          employer_name?: string | null
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
          is_foreign_national?: boolean | null
          kebele?: string | null
          kyc_tier?: Database["public"]["Enums"]["kyc_status"] | null
          marital_status?: string | null
          msisdn?: string | null
          msisdn_verified?: boolean | null
          nationality?: string | null
          occupation?: string | null
          place_of_birth_region?: string | null
          preferred_language?: string | null
          profile_completeness?: number | null
          region?: string | null
          risk_score?: number | null
          sector?: string | null
          source_of_funds?: string | null
          updated_at?: string | null
          woreda?: string | null
        }
        Relationships: []
      }
      salary_batch_items: {
        Row: {
          account_number: string
          amount: number
          bank_name: string
          batch_id: string
          created_at: string | null
          employee_name: string
          error_message: string | null
          id: string
          profile_id: string
          reference: string | null
          status: string
        }
        Insert: {
          account_number: string
          amount: number
          bank_name?: string
          batch_id: string
          created_at?: string | null
          employee_name: string
          error_message?: string | null
          id?: string
          profile_id: string
          reference?: string | null
          status?: string
        }
        Update: {
          account_number?: string
          amount?: number
          bank_name?: string
          batch_id?: string
          created_at?: string | null
          employee_name?: string
          error_message?: string | null
          id?: string
          profile_id?: string
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "salary_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_batches: {
        Row: {
          batch_name: string
          created_at: string | null
          debit_account_id: string | null
          failed_records: number
          id: string
          processed_at: string | null
          profile_id: string
          remarks: string | null
          source_file_name: string | null
          status: string
          successful_records: number
          total_amount: number
          total_records: number
          updated_at: string | null
        }
        Insert: {
          batch_name: string
          created_at?: string | null
          debit_account_id?: string | null
          failed_records?: number
          id?: string
          processed_at?: string | null
          profile_id: string
          remarks?: string | null
          source_file_name?: string | null
          status?: string
          successful_records?: number
          total_amount?: number
          total_records?: number
          updated_at?: string | null
        }
        Update: {
          batch_name?: string
          created_at?: string | null
          debit_account_id?: string | null
          failed_records?: number
          id?: string
          processed_at?: string | null
          profile_id?: string
          remarks?: string | null
          source_file_name?: string | null
          status?: string
          successful_records?: number
          total_amount?: number
          total_records?: number
          updated_at?: string | null
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
      savings_collections: {
        Row: {
          agent_id: string | null
          amount: number
          collection_date: string
          created_at: string | null
          group_id: string
          id: string
          member_id: string
          reference: string | null
          status: string
        }
        Insert: {
          agent_id?: string | null
          amount: number
          collection_date?: string
          created_at?: string | null
          group_id: string
          id?: string
          member_id: string
          reference?: string | null
          status?: string
        }
        Update: {
          agent_id?: string | null
          amount?: number
          collection_date?: string
          created_at?: string | null
          group_id?: string
          id?: string
          member_id?: string
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_collections_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_collections_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "savings_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_collections_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "savings_group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_group_members: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          group_id: string
          id: string
          is_active: boolean | null
          member_name: string
          phone: string
          profile_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          group_id: string
          id?: string
          is_active?: boolean | null
          member_name: string
          phone: string
          profile_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          group_id?: string
          id?: string
          is_active?: boolean | null
          member_name?: string
          phone?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_group_members_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "savings_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_groups: {
        Row: {
          agent_id: string | null
          created_at: string | null
          frequency: string
          group_name: string
          id: string
          status: string
          target_amount: number | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          frequency?: string
          group_name: string
          id?: string
          status?: string
          target_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          frequency?: string
          group_name?: string
          id?: string
          status?: string
          target_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_groups_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_payments: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          from_account_id: string | null
          id: string
          is_active: boolean
          last_run_date: string | null
          next_run_date: string
          payment_type: string
          profile_id: string
          requires_approval: boolean
          schedule_type: string
          status: string
          to_account_number: string | null
          to_bank: string | null
          to_name: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          from_account_id?: string | null
          id?: string
          is_active?: boolean
          last_run_date?: string | null
          next_run_date: string
          payment_type?: string
          profile_id: string
          requires_approval?: boolean
          schedule_type?: string
          status?: string
          to_account_number?: string | null
          to_bank?: string | null
          to_name?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          from_account_id?: string | null
          id?: string
          is_active?: boolean
          last_run_date?: string | null
          next_run_date?: string
          payment_type?: string
          profile_id?: string
          requires_approval?: boolean
          schedule_type?: string
          status?: string
          to_account_number?: string | null
          to_bank?: string | null
          to_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      secure_messages: {
        Row: {
          attachment_url: string | null
          body: string
          category: string
          created_at: string | null
          id: string
          is_read: boolean
          parent_id: string | null
          profile_id: string
          sender_type: string
          subject: string
        }
        Insert: {
          attachment_url?: string | null
          body: string
          category?: string
          created_at?: string | null
          id?: string
          is_read?: boolean
          parent_id?: string | null
          profile_id: string
          sender_type?: string
          subject: string
        }
        Update: {
          attachment_url?: string | null
          body?: string
          category?: string
          created_at?: string | null
          id?: string
          is_read?: boolean
          parent_id?: string | null
          profile_id?: string
          sender_type?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "secure_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "secure_messages"
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_savings_goals: {
        Row: {
          category: string | null
          created_at: string | null
          current_amount: number
          goal_name: string
          id: string
          profile_id: string
          status: string
          target_amount: number
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_amount?: number
          goal_name: string
          id?: string
          profile_id: string
          status?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_amount?: number
          goal_name?: string
          id?: string
          profile_id?: string
          status?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_trial_balance: {
        Row: {
          account_type: string | null
          credit_balance: number | null
          debit_balance: number | null
          gl_code: string | null
          id: string | null
          name: string | null
          net_balance: number | null
          parent_id: string | null
          status: string | null
        }
        Insert: {
          account_type?: string | null
          credit_balance?: never
          debit_balance?: never
          gl_code?: string | null
          id?: string | null
          name?: string | null
          net_balance?: number | null
          parent_id?: string | null
          status?: string | null
        }
        Update: {
          account_type?: string | null
          credit_balance?: never
          debit_balance?: never
          gl_code?: string | null
          id?: string | null
          name?: string | null
          net_balance?: number | null
          parent_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_trial_balance"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_kyc_document: {
        Args: { p_admin_id: string; p_doc_id: string }
        Returns: Json
      }
      bdp_compute_snapshots: { Args: { p_date: string }; Returns: undefined }
      bdp_populate_loan_facts: { Args: { p_date: string }; Returns: undefined }
      bdp_populate_transaction_facts: {
        Args: { p_date: string }
        Returns: undefined
      }
      bdp_sync_customer_dimension: { Args: never; Returns: undefined }
      bdp_sync_product_dimension: { Args: never; Returns: undefined }
      check_daily_allowance: {
        Args: { p_amount: number; p_profile_id: string }
        Returns: Json
      }
      check_integration_rate_limit: {
        Args: { p_integration_id: string }
        Returns: Json
      }
      get_tier_limits: {
        Args: { p_tier: string }
        Returns: {
          balance_ceiling: number
          cashout_per_txn: number
          daily_limit: number
          monthly_limit: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
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
      record_integration_failure: {
        Args: { p_error?: string; p_integration_id: string }
        Returns: Json
      }
      record_integration_success: {
        Args: { p_integration_id: string }
        Returns: Json
      }
      reject_kyc_document: {
        Args: { p_admin_id: string; p_doc_id: string; p_reason: string }
        Returns: Json
      }
      set_account_limits_for_tier: {
        Args: { p_profile_id: string; p_tier: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "dormant" | "closed" | "frozen"
      account_type: "savings" | "wallet" | "current"
      agent_category: "super_agent" | "agent" | "sub_agent"
      agent_status: "pending" | "active" | "suspended" | "terminated"
      app_role: "admin" | "staff" | "compliance" | "support" | "analyst"
      consent_type:
        | "digital_statements"
        | "marketing"
        | "data_sharing"
        | "analytics"
        | "biometric_data"
        | "credit_bureau"
      corporate_role:
        | "corporate_admin"
        | "maker"
        | "checker"
        | "approver"
        | "finance_viewer"
        | "payroll_officer"
      kyc_status:
        | "pending"
        | "pending_review"
        | "simplified"
        | "full"
        | "rejected"
        | "expired"
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
      agent_category: ["super_agent", "agent", "sub_agent"],
      agent_status: ["pending", "active", "suspended", "terminated"],
      app_role: ["admin", "staff", "compliance", "support", "analyst"],
      consent_type: [
        "digital_statements",
        "marketing",
        "data_sharing",
        "analytics",
        "biometric_data",
        "credit_bureau",
      ],
      corporate_role: [
        "corporate_admin",
        "maker",
        "checker",
        "approver",
        "finance_viewer",
        "payroll_officer",
      ],
      kyc_status: [
        "pending",
        "pending_review",
        "simplified",
        "full",
        "rejected",
        "expired",
      ],
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
