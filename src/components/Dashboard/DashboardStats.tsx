import { TrendingUp, TrendingDown, Users, Car, Calendar, DollarSign } from 'lucide-react';

export interface StatItem {
  title: string;
  value: string;
  subtitle: string;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

interface DashboardStatsProps {
  stats: StatItem[];
  loading?: boolean;
}

export default function DashboardStats({ stats, loading = false }: DashboardStatsProps) {
  const getColorClasses = (color: StatItem['color']) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'green':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'amber':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'total clients':
        return Users;
      case 'fleet status':
        return Car;
      case 'active bookings':
        return Calendar;
      case 'monthly revenue':
        return DollarSign;
      default:
        return TrendingUp;
    }
  };

  const getTrend = (trend: string) => {
    if (!trend) return null;
    const isNegative = trend.trim().startsWith('-');
    const Icon = isNegative ? TrendingDown : TrendingUp;
    const color = isNegative ? 'text-red-600' : 'text-green-600';
    return (
      <div className={`flex items-center text-sm ${color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {trend}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, index) => {
        const Icon = getStatIcon(stat.title);
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${getColorClasses(stat.color)}`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              {loading ? (
                <div className="h-4 w-14 bg-gray-100 rounded" />
              ) : (
                getTrend(stat.trend)
              )}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 break-words">
                {loading ? <span className="inline-block h-7 w-24 bg-gray-100 rounded" /> : stat.value}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">{stat.title}</p>
              <p className="text-xs text-gray-500 break-words">
                {loading ? <span className="inline-block h-4 w-36 bg-gray-100 rounded" /> : stat.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}