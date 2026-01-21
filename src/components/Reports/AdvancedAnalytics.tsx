import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Zap, Clock, AlertTriangle, 
  Award, Activity, DollarSign, Users, Car, Calendar
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

interface KPIMetric {
  title: string;
  value: string | number;
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: any;
}

interface ForecastData {
  period: string;
  actual: number;
  forecast: number;
  confidence: number;
}

export default function AdvancedAnalytics() {
  const [kpiData, setKpiData] = useState<KPIMetric[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    loadAdvancedAnalytics();
  }, [selectedPeriod]);

  const loadAdvancedAnalytics = async () => {
    try {
      setLoading(true);
      
      // Simulate advanced analytics data
      const kpis: KPIMetric[] = [
        {
          title: 'Revenue Growth Rate',
          value: '+23.5%',
          target: 20,
          current: 23.5,
          unit: '%',
          trend: 'up',
          trendValue: 3.2,
          status: 'excellent',
          icon: TrendingUp
        },
        {
          title: 'Vehicle Utilization',
          value: '78.4%',
          target: 85,
          current: 78.4,
          unit: '%',
          trend: 'up',
          trendValue: 2.1,
          status: 'good',
          icon: Car
        },
        {
          title: 'Customer Satisfaction',
          value: '4.6/5',
          target: 4.5,
          current: 4.6,
          unit: 'stars',
          trend: 'stable',
          trendValue: 0.1,
          status: 'excellent',
          icon: Award
        },
        {
          title: 'Booking Conversion Rate',
          value: '12.3%',
          target: 15,
          current: 12.3,
          unit: '%',
          trend: 'down',
          trendValue: -1.2,
          status: 'warning',
          icon: Target
        },
        {
          title: 'Average Revenue per Booking',
          value: 'KSH 8,450',
          target: 9000,
          current: 8450,
          unit: 'KSH',
          trend: 'up',
          trendValue: 5.3,
          status: 'good',
          icon: DollarSign
        },
        {
          title: 'Fleet Efficiency',
          value: '91.2%',
          target: 90,
          current: 91.2,
          unit: '%',
          trend: 'up',
          trendValue: 1.8,
          status: 'excellent',
          icon: Zap
        }
      ];

      // Generate forecast data
      const forecast: ForecastData[] = [
        { period: 'Jan', actual: 45000, forecast: 46000, confidence: 0.85 },
        { period: 'Feb', actual: 52000, forecast: 51000, confidence: 0.82 },
        { period: 'Mar', actual: 48000, forecast: 49000, confidence: 0.78 },
        { period: 'Apr', actual: 61000, forecast: 62000, confidence: 0.75 },
        { period: 'May', actual: 58000, forecast: 59000, confidence: 0.72 },
        { period: 'Jun', actual: null, forecast: 65000, confidence: 0.68 },
        { period: 'Jul', actual: null, forecast: 67000, confidence: 0.65 },
        { period: 'Aug', actual: null, forecast: 69000, confidence: 0.62 }
      ];

      setKpiData(kpis);
      setForecastData(forecast);
    } catch (error) {
      console.error('Error loading advanced analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Key Performance Indicators</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            const progressPercentage = Math.min(100, (kpi.current / kpi.target) * 100);
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">{kpi.title}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(kpi.status)}`}>
                    {kpi.status.toUpperCase()}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                  <div className="flex items-center text-sm mt-1">
                    {kpi.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : kpi.trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    ) : (
                      <Activity className="w-4 h-4 text-gray-500 mr-1" />
                    )}
                    <span className={`${
                      kpi.trend === 'up' ? 'text-green-600' : 
                      kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {Math.abs(kpi.trendValue)}{kpi.unit} vs last period
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress to Target</span>
                    <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(kpi.current, kpi.target)}`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: {kpi.target}{kpi.unit}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Forecast */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Revenue Forecast</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Actual</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Forecast</span>
            </div>
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `KSH ${value?.toLocaleString()}`,
                  name === 'actual' ? 'Actual Revenue' : 'Forecast Revenue'
                ]}
              />
              <Legend />
              <Bar dataKey="actual" fill="#3B82F6" name="Actual" />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Forecast"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600 font-medium">Current Period</div>
                <div className="text-xl font-bold text-blue-900">
                  KSH {forecastData.find(d => d.actual)?.actual?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-600 font-medium">Next Period Forecast</div>
                <div className="text-xl font-bold text-green-900">
                  KSH {forecastData.find(d => !d.actual)?.forecast?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-600 font-medium">Confidence Level</div>
                <div className="text-xl font-bold text-purple-900">
                  {((forecastData.find(d => !d.actual)?.confidence || 0) * 100).toFixed(0)}%
                </div>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Predictive Insights & Recommendations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              Growth Opportunities
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-900">Weekend Demand Increase</div>
                  <div className="text-sm text-green-700">
                    Consider increasing weekend rates by 15% to maximize revenue
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900">Customer Retention</div>
                  <div className="text-sm text-blue-700">
                    Loyalty program could increase repeat bookings by 25%
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <Car className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium text-purple-900">Fleet Expansion</div>
                  <div className="text-sm text-purple-700">
                    Add 3 luxury vehicles to capture high-value market segment
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Risk Alerts
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium text-red-900">Seasonal Demand Drop</div>
                  <div className="text-sm text-red-700">
                    Expected 20% decrease in bookings next month - prepare marketing campaign
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-900">Maintenance Schedule</div>
                  <div className="text-sm text-yellow-700">
                    4 vehicles due for maintenance - may affect availability
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                <Target className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-medium text-orange-900">Conversion Rate Decline</div>
                  <div className="text-sm text-orange-700">
                    Booking conversion down 8% - review website user experience
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
