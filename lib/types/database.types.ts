export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number;
          bank_name: string;
          created_at: string | null;
          currency: string;
          id: number;
          name: string;
          provider_info: Json | null;
          type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          balance?: number;
          bank_name: string;
          created_at?: string | null;
          currency: string;
          id?: number;
          name: string;
          provider_info?: Json | null;
          type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          balance?: number;
          bank_name?: string;
          created_at?: string | null;
          currency?: string;
          id?: number;
          name?: string;
          provider_info?: Json | null;
          type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'accounts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      app_settings: {
        Row: {
          auto_calculate_charges: boolean;
          bonds_enabled: boolean | null;
          brokerage_type: string;
          brokerage_value: number;
          default_mf_account_id: number | null;
          default_salary_account_id: number | null;
          default_stock_account_id: number | null;
          dp_charges: number;
          expenses_visible: boolean | null;
          family_visible: boolean | null;
          fno_visible: boolean | null;
          forex_enabled: boolean | null;
          goals_visible: boolean | null;
          gst_rate: number;
          id: number;
          income_visible: boolean | null;
          ledger_visible: boolean | null;
          mutual_funds_visible: boolean | null;
          sebi_charge_rate: number;
          stamp_duty_rate: number;
          stocks_visible: boolean | null;
          stt_rate: number;
          transaction_charge_rate: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          auto_calculate_charges?: boolean;
          bonds_enabled?: boolean | null;
          brokerage_type?: string;
          brokerage_value?: number;
          default_mf_account_id?: number | null;
          default_salary_account_id?: number | null;
          default_stock_account_id?: number | null;
          dp_charges?: number;
          expenses_visible?: boolean | null;
          family_visible?: boolean | null;
          fno_visible?: boolean | null;
          forex_enabled?: boolean | null;
          goals_visible?: boolean | null;
          gst_rate?: number;
          id?: number;
          income_visible?: boolean | null;
          ledger_visible?: boolean | null;
          mutual_funds_visible?: boolean | null;
          sebi_charge_rate?: number;
          stamp_duty_rate?: number;
          stocks_visible?: boolean | null;
          stt_rate?: number;
          transaction_charge_rate?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Update: {
          auto_calculate_charges?: boolean;
          bonds_enabled?: boolean | null;
          brokerage_type?: string;
          brokerage_value?: number;
          default_mf_account_id?: number | null;
          default_salary_account_id?: number | null;
          default_stock_account_id?: number | null;
          dp_charges?: number;
          expenses_visible?: boolean | null;
          family_visible?: boolean | null;
          fno_visible?: boolean | null;
          forex_enabled?: boolean | null;
          goals_visible?: boolean | null;
          gst_rate?: number;
          id?: number;
          income_visible?: boolean | null;
          ledger_visible?: boolean | null;
          mutual_funds_visible?: boolean | null;
          sebi_charge_rate?: number;
          stamp_duty_rate?: number;
          stocks_visible?: boolean | null;
          stt_rate?: number;
          transaction_charge_rate?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'app_settings_default_mf_account_id_fkey';
            columns: ['default_mf_account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_settings_default_salary_account_id_fkey';
            columns: ['default_salary_account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_settings_default_stock_account_id_fkey';
            columns: ['default_stock_account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'app_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      bond_transactions: {
        Row: {
          account_id: number | null;
          bond_id: number | null;
          created_at: string | null;
          id: number;
          notes: string | null;
          price: number | null;
          quantity: number | null;
          total_amount: number;
          transaction_date: string | null;
          transaction_type: string;
          user_id: string;
        };
        Insert: {
          account_id?: number | null;
          bond_id?: number | null;
          created_at?: string | null;
          id?: number;
          notes?: string | null;
          price?: number | null;
          quantity?: number | null;
          total_amount: number;
          transaction_date?: string | null;
          transaction_type: string;
          user_id: string;
        };
        Update: {
          account_id?: number | null;
          bond_id?: number | null;
          created_at?: string | null;
          id?: number;
          notes?: string | null;
          price?: number | null;
          quantity?: number | null;
          total_amount?: number;
          transaction_date?: string | null;
          transaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bond_transactions_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bond_transactions_bond_id_fkey';
            columns: ['bond_id'];
            isOneToOne: false;
            referencedRelation: 'bonds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bond_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      bonds: {
        Row: {
          avg_price: number | null;
          company_name: string | null;
          coupon_rate: number | null;
          created_at: string | null;
          current_price: number | null;
          current_value: number | null;
          face_value: number | null;
          id: number;
          interest_frequency: string | null;
          investment_amount: number | null;
          isin: string | null;
          maturity_date: string | null;
          name: string;
          next_interest_date: string | null;
          pnl: number | null;
          pnl_percentage: number | null;
          previous_price: number | null;
          quantity: number | null;
          status: string | null;
          updated_at: string | null;
          user_id: string;
          yield_to_maturity: number | null;
        };
        Insert: {
          avg_price?: number | null;
          company_name?: string | null;
          coupon_rate?: number | null;
          created_at?: string | null;
          current_price?: number | null;
          current_value?: number | null;
          face_value?: number | null;
          id?: number;
          interest_frequency?: string | null;
          investment_amount?: number | null;
          isin?: string | null;
          maturity_date?: string | null;
          name: string;
          next_interest_date?: string | null;
          pnl?: number | null;
          pnl_percentage?: number | null;
          previous_price?: number | null;
          quantity?: number | null;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
          yield_to_maturity?: number | null;
        };
        Update: {
          avg_price?: number | null;
          company_name?: string | null;
          coupon_rate?: number | null;
          created_at?: string | null;
          current_price?: number | null;
          current_value?: number | null;
          face_value?: number | null;
          id?: number;
          interest_frequency?: string | null;
          investment_amount?: number | null;
          isin?: string | null;
          maturity_date?: string | null;
          name?: string;
          next_interest_date?: string | null;
          pnl?: number | null;
          pnl_percentage?: number | null;
          previous_price?: number | null;
          quantity?: number | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
          yield_to_maturity?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bonds_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      dividends: {
        Row: {
          account_id: number | null;
          amount: number;
          created_at: string | null;
          date: string;
          id: number;
          mf_id: number | null;
          stock_id: number | null;
          user_id: string | null;
        };
        Insert: {
          account_id?: number | null;
          amount: number;
          created_at?: string | null;
          date: string;
          id?: number;
          mf_id?: number | null;
          stock_id?: number | null;
          user_id?: string | null;
        };
        Update: {
          account_id?: number | null;
          amount?: number;
          created_at?: string | null;
          date?: string;
          id?: number;
          mf_id?: number | null;
          stock_id?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'dividends_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dividends_mf_id_fkey';
            columns: ['mf_id'];
            isOneToOne: false;
            referencedRelation: 'mutual_funds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dividends_stock_id_fkey';
            columns: ['stock_id'];
            isOneToOne: false;
            referencedRelation: 'stocks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dividends_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      family_transfers: {
        Row: {
          account_id: number | null;
          amount: number;
          created_at: string | null;
          date: string;
          id: number;
          notes: string | null;
          purpose: string;
          recipient: string;
          relationship: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          account_id?: number | null;
          amount: number;
          created_at?: string | null;
          date: string;
          id?: number;
          notes?: string | null;
          purpose: string;
          recipient: string;
          relationship: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          account_id?: number | null;
          amount?: number;
          created_at?: string | null;
          date?: string;
          id?: number;
          notes?: string | null;
          purpose?: string;
          recipient?: string;
          relationship?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'family_transfers_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'family_transfers_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      fno_trades: {
        Row: {
          account_id: number | null;
          avg_price: number;
          created_at: string | null;
          entry_date: string;
          exit_date: string | null;
          exit_price: number | null;
          id: number;
          instrument: string;
          notes: string | null;
          pnl: number | null;
          product: string;
          quantity: number;
          status: string;
          trade_type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          account_id?: number | null;
          avg_price: number;
          created_at?: string | null;
          entry_date: string;
          exit_date?: string | null;
          exit_price?: number | null;
          id?: number;
          instrument: string;
          notes?: string | null;
          pnl?: number | null;
          product: string;
          quantity: number;
          status: string;
          trade_type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          account_id?: number | null;
          avg_price?: number;
          created_at?: string | null;
          entry_date?: string;
          exit_date?: string | null;
          exit_price?: number | null;
          id?: number;
          instrument?: string;
          notes?: string | null;
          pnl?: number | null;
          product?: string;
          quantity?: number;
          status?: string;
          trade_type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fno_trades_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fno_trades_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      forex_transactions: {
        Row: {
          account_id: number | null;
          amount: number;
          created_at: string | null;
          id: number;
          notes: string | null;
          transaction_date: string | null;
          transaction_type: string;
          user_id: string;
        };
        Insert: {
          account_id?: number | null;
          amount: number;
          created_at?: string | null;
          id?: number;
          notes?: string | null;
          transaction_date?: string | null;
          transaction_type: string;
          user_id: string;
        };
        Update: {
          account_id?: number | null;
          amount?: number;
          created_at?: string | null;
          id?: number;
          notes?: string | null;
          transaction_date?: string | null;
          transaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'forex_transactions_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'forex_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      goals: {
        Row: {
          account_id: number | null;
          category: string;
          created_at: string | null;
          current_amount: number;
          deadline: string;
          description: string | null;
          id: number;
          name: string;
          target_amount: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          account_id?: number | null;
          category: string;
          created_at?: string | null;
          current_amount?: number;
          deadline: string;
          description?: string | null;
          id?: number;
          name: string;
          target_amount: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          account_id?: number | null;
          category?: string;
          created_at?: string | null;
          current_amount?: number;
          deadline?: string;
          description?: string | null;
          id?: number;
          name?: string;
          target_amount?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'goals_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      mutual_fund_transactions: {
        Row: {
          account_id: number | null;
          created_at: string | null;
          id: number;
          mutual_fund_id: number | null;
          nav: number;
          notes: string | null;
          total_amount: number;
          transaction_date: string;
          transaction_type: string;
          units: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          account_id?: number | null;
          created_at?: string | null;
          id?: number;
          mutual_fund_id?: number | null;
          nav: number;
          notes?: string | null;
          total_amount: number;
          transaction_date: string;
          transaction_type: string;
          units: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          account_id?: number | null;
          created_at?: string | null;
          id?: number;
          mutual_fund_id?: number | null;
          nav?: number;
          notes?: string | null;
          total_amount?: number;
          transaction_date?: string;
          transaction_type?: string;
          units?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'mutual_fund_transactions_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mutual_fund_transactions_mutual_fund_id_fkey';
            columns: ['mutual_fund_id'];
            isOneToOne: false;
            referencedRelation: 'mutual_funds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mutual_fund_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      mutual_funds: {
        Row: {
          avg_nav: number;
          category: string | null;
          created_at: string | null;
          current_nav: number;
          current_value: number;
          folio_number: string | null;
          id: number;
          investment_amount: number;
          isin: string | null;
          name: string;
          pnl: number;
          pnl_percentage: number;
          previous_nav: number | null;
          scheme_code: string | null;
          tags: string[] | null;
          units: number;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          avg_nav?: number;
          category?: string | null;
          created_at?: string | null;
          current_nav?: number;
          current_value?: number;
          folio_number?: string | null;
          id?: number;
          investment_amount?: number;
          isin?: string | null;
          name: string;
          pnl?: number;
          pnl_percentage?: number;
          previous_nav?: number | null;
          scheme_code?: string | null;
          tags?: string[] | null;
          units?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          avg_nav?: number;
          category?: string | null;
          created_at?: string | null;
          current_nav?: number;
          current_value?: number;
          folio_number?: string | null;
          id?: number;
          investment_amount?: number;
          isin?: string | null;
          name?: string;
          pnl?: number;
          pnl_percentage?: number;
          previous_nav?: number | null;
          scheme_code?: string | null;
          tags?: string[] | null;
          units?: number;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'mutual_funds_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      portfolio_snapshots: {
        Row: {
          cash_value: number;
          created_at: string | null;
          date: string;
          fno_margin: number | null;
          id: number;
          mf_value: number;
          stock_value: number;
          total_net_worth: number;
          user_id: string | null;
        };
        Insert: {
          cash_value: number;
          created_at?: string | null;
          date?: string;
          fno_margin?: number | null;
          id?: number;
          mf_value: number;
          stock_value: number;
          total_net_worth: number;
          user_id?: string | null;
        };
        Update: {
          cash_value?: number;
          created_at?: string | null;
          date?: string;
          fno_margin?: number | null;
          id?: number;
          mf_value?: number;
          stock_value?: number;
          total_net_worth?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'portfolio_snapshots_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      recurring_schedules: {
        Row: {
          account_id: number | null;
          amount: number;
          category: string;
          created_at: string | null;
          end_date: string | null;
          frequency: string;
          id: number;
          is_active: boolean | null;
          name: string;
          next_date: string;
          start_date: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          account_id?: number | null;
          amount: number;
          category: string;
          created_at?: string | null;
          end_date?: string | null;
          frequency: string;
          id?: number;
          is_active?: boolean | null;
          name: string;
          next_date: string;
          start_date: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          account_id?: number | null;
          amount?: number;
          category?: string;
          created_at?: string | null;
          end_date?: string | null;
          frequency?: string;
          id?: number;
          is_active?: boolean | null;
          name?: string;
          next_date?: string;
          start_date?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_schedules_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_schedules_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      stock_transactions: {
        Row: {
          account_id: number | null;
          brokerage: number | null;
          created_at: string | null;
          id: number;
          notes: string | null;
          price: number;
          quantity: number;
          stock_id: number | null;
          taxes: number | null;
          total_amount: number;
          transaction_date: string;
          transaction_type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          account_id?: number | null;
          brokerage?: number | null;
          created_at?: string | null;
          id?: number;
          notes?: string | null;
          price: number;
          quantity: number;
          stock_id?: number | null;
          taxes?: number | null;
          total_amount: number;
          transaction_date: string;
          transaction_type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          account_id?: number | null;
          brokerage?: number | null;
          created_at?: string | null;
          id?: number;
          notes?: string | null;
          price?: number;
          quantity?: number;
          stock_id?: number | null;
          taxes?: number | null;
          total_amount?: number;
          transaction_date?: string;
          transaction_type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_transactions_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_transactions_stock_id_fkey';
            columns: ['stock_id'];
            isOneToOne: false;
            referencedRelation: 'stocks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      stocks: {
        Row: {
          avg_price: number;
          company_name: string;
          created_at: string | null;
          current_price: number;
          current_value: number;
          exchange: string;
          id: number;
          investment_amount: number;
          pnl: number;
          pnl_percentage: number;
          previous_price: number | null;
          quantity: number;
          sector: string | null;
          symbol: string;
          tags: string[] | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          avg_price?: number;
          company_name: string;
          created_at?: string | null;
          current_price?: number;
          current_value?: number;
          exchange?: string;
          id?: number;
          investment_amount?: number;
          pnl?: number;
          pnl_percentage?: number;
          previous_price?: number | null;
          quantity?: number;
          sector?: string | null;
          symbol: string;
          tags?: string[] | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          avg_price?: number;
          company_name?: string;
          created_at?: string | null;
          current_price?: number;
          current_value?: number;
          exchange?: string;
          id?: number;
          investment_amount?: number;
          pnl?: number;
          pnl_percentage?: number;
          previous_price?: number | null;
          quantity?: number;
          sector?: string | null;
          symbol?: string;
          tags?: string[] | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stocks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      transactions: {
        Row: {
          account_id: number | null;
          amount: number;
          category: string;
          created_at: string | null;
          date: string;
          description: string;
          id: number;
          metadata: Json | null;
          type: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          account_id?: number | null;
          amount: number;
          category: string;
          created_at?: string | null;
          date: string;
          description: string;
          id?: number;
          metadata?: Json | null;
          type: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          account_id?: number | null;
          amount?: number;
          category?: string;
          created_at?: string | null;
          date?: string;
          description?: string;
          id?: number;
          metadata?: Json | null;
          type?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
      watchlist: {
        Row: {
          company_name: string;
          created_at: string | null;
          current_price: number | null;
          id: number;
          notes: string | null;
          symbol: string;
          target_price: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          company_name: string;
          created_at?: string | null;
          current_price?: number | null;
          id?: number;
          notes?: string | null;
          symbol: string;
          target_price?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          company_name?: string;
          created_at?: string | null;
          current_price?: number | null;
          id?: number;
          notes?: string | null;
          symbol?: string;
          target_price?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'watchlist_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_net_worth_overview';
            referencedColumns: ['user_id'];
          },
        ];
      };
    };
    Views: {
      user_net_worth_overview: {
        Row: {
          net_worth: number | null;
          total_bonds: number | null;
          total_cash: number | null;
          total_mfs: number | null;
          total_stocks: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      capture_daily_snapshot: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
