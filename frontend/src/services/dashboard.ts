// src/services/dashboard.ts
import { get } from './api';

export interface DashboardStats {
  totalProducts: number;
  activeNeeds: number;
  ongoingNegotiations: number;
  successfulDeals: number;
  conversionRate: number;
  newThisMonth: number;
}

export interface IndustryItem {
  name: string;
  value: number;
}

export interface MonthlyDeal {
  month: string;
  deals: number;
  value: number;
}

export interface Activity {
  id: string;
  type: 'product' | 'need' | 'negotiation' | 'deal';
  title: string;
  user: string;
  time: string;
  status: string;
}

export interface Suggestion {
  title: string;
  match: number;
  reason: string;
}

export interface FunnelItem {
  label: string;
  value: number;
  percent: number;
}

export interface TopSupplier {
  name: string;
  score: number;
  deals: number;
}

export interface DashboardData {
  stats: DashboardStats;
  industryData: IndustryItem[];
  monthlyDeals: MonthlyDeal[];
  recentActivities: Activity[];
  smartSuggestions: Suggestion[];
  conversionFunnel: FunnelItem[];
  topSuppliers: TopSupplier[];
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  return get('/analytics/kpis/dashboard/');
};