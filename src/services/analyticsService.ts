import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AnalyticsService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('car-hire-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Dashboard analytics
  async getDashboardAnalytics() {
    try {
      const response = await this.api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  }

  // Financial analytics
  async getFinancialAnalytics(startDate?: string, endDate?: string) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await this.api.get(`/analytics/financial?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching financial analytics:', error);
      throw error;
    }
  }

  // Vehicle performance analytics
  async getVehicleAnalytics() {
    try {
      const response = await this.api.get('/analytics/vehicles');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle analytics:', error);
      throw error;
    }
  }

  // Client analytics
  async getClientAnalytics(limit: number = 20) {
    try {
      const response = await this.api.get(`/analytics/clients?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client analytics:', error);
      throw error;
    }
  }

  // Real-time metrics
  async getRealTimeMetrics() {
    try {
      const response = await this.api.get('/analytics/realtime');
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  }

  // Calculate KPI trends
  calculateTrends(current: number, previous: number) {
    if (previous === 0) return { value: current, percentage: 100, direction: 'up' };
    
    const change = current - previous;
    const percentage = ((change / previous) * 100).toFixed(1);
    
    return {
      value: change,
      percentage: parseFloat(percentage),
      direction: change >= 0 ? 'up' : 'down'
    };
  }

  // Format currency
  formatCurrency(amount: number, currency: string = 'KSH') {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency === 'KSH' ? 'KES' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('KES', currency);
  }

  // Calculate utilization rate
  calculateUtilization(activeBookings: number, totalBookings: number) {
    if (totalBookings === 0) return 0;
    return Math.min(100, Math.round((activeBookings / totalBookings) * 100));
  }

  // Generate forecast data (simple linear regression)
  generateForecast(data: any[], periods: number = 3) {
    if (data.length < 2) return [];

    const values = data.map(d => d.revenue || d.value || 0);
    const n = values.length;
    
    // Simple linear regression
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = values.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate forecast
    const forecast = [];
    for (let i = 0; i < periods; i++) {
      const x = n + i;
      const value = Math.max(0, slope * x + intercept);
      forecast.push({
        period: `Forecast ${i + 1}`,
        value: Math.round(value),
        isForecast: true
      });
    }
    
    return forecast;
  }

  // Calculate growth rate
  calculateGrowthRate(current: number, previous: number) {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  // Get performance rating
  getPerformanceRating(value: number, benchmarks: { excellent: number; good: number; average: number }) {
    if (value >= benchmarks.excellent) return { rating: 'excellent', color: 'text-green-600' };
    if (value >= benchmarks.good) return { rating: 'good', color: 'text-blue-600' };
    if (value >= benchmarks.average) return { rating: 'average', color: 'text-yellow-600' };
    return { rating: 'poor', color: 'text-red-600' };
  }

  // Export data to CSV
  exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Get date range presets
  getDateRangePresets() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastQuarter = new Date(today);
    lastQuarter.setMonth(lastQuarter.getMonth() - 3);
    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    return {
      today: { start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] },
      yesterday: { start: yesterday.toISOString().split('T')[0], end: yesterday.toISOString().split('T')[0] },
      lastWeek: { start: lastWeek.toISOString().split('T')[0], end: today.toISOString().split('T')[0] },
      lastMonth: { start: lastMonth.toISOString().split('T')[0], end: today.toISOString().split('T')[0] },
      lastQuarter: { start: lastQuarter.toISOString().split('T')[0], end: today.toISOString().split('T')[0] },
      lastYear: { start: lastYear.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
