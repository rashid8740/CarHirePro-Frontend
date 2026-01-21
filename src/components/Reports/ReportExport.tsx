import { useState } from 'react';
import { 
  Download, FileText, Calendar, X, 
  AlertCircle, FileSpreadsheet, Mail, Printer
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

interface ReportConfig {
  name: string;
  description: string;
  format: 'csv' | 'pdf' | 'excel';
  sections: string[];
  dateRange: boolean;
  filters: string[];
}

interface ExportOptions {
  reportType: string;
  format: 'csv' | 'pdf' | 'excel';
  dateRange: {
    start: string;
    end: string;
  };
  sections: string[];
  filters: Record<string, any>;
  email: string;
  includeCharts: boolean;
  includeSummary: boolean;
}

const reportConfigs: ReportConfig[] = [
  {
    name: 'Financial Summary',
    description: 'Complete financial overview with revenue, expenses, and profit analysis',
    format: 'pdf',
    sections: ['revenue', 'expenses', 'profit', 'trends', 'forecasts'],
    dateRange: true,
    filters: ['vehicle_type', 'client_category', 'payment_method']
  },
  {
    name: 'Vehicle Performance',
    description: 'Detailed vehicle utilization, maintenance, and performance metrics',
    format: 'excel',
    sections: ['utilization', 'revenue_per_vehicle', 'maintenance', 'availability'],
    dateRange: true,
    filters: ['vehicle_make', 'vehicle_model', 'status']
  },
  {
    name: 'Client Analytics',
    description: 'Customer behavior, satisfaction, and booking patterns analysis',
    format: 'csv',
    sections: ['demographics', 'booking_patterns', 'satisfaction', 'retention'],
    dateRange: true,
    filters: ['client_type', 'location', 'booking_frequency']
  },
  {
    name: 'Operational Report',
    description: 'Daily operations including bookings, fleet status, and staff performance',
    format: 'pdf',
    sections: ['daily_bookings', 'fleet_status', 'staff_performance', 'incidents'],
    dateRange: true,
    filters: ['branch', 'staff_member', 'shift']
  },
  {
    name: 'Custom Report',
    description: 'Build your own report with selected metrics and dimensions',
    format: 'excel',
    sections: ['bookings', 'revenue', 'vehicles', 'clients', 'staff'],
    dateRange: true,
    filters: ['all']
  }
];

export default function ReportExport() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    reportType: '',
    format: 'pdf',
    dateRange: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    sections: [],
    filters: {},
    email: '',
    includeCharts: true,
    includeSummary: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleReportSelect = (reportName: string) => {
    setSelectedReport(reportName);
    const config = reportConfigs.find(r => r.name === reportName);
    if (config) {
      setExportOptions(prev => ({
        ...prev,
        reportType: reportName,
        format: config.format,
        sections: config.sections,
        filters: {}
      }));
    }
  };

  const handleSectionToggle = (section: string) => {
    setExportOptions(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  const handleExport = async () => {
    if (!selectedReport) return;

    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to export history
      const newExport = {
        id: Date.now(),
        reportName: selectedReport,
        format: exportOptions.format,
        dateRange: exportOptions.dateRange,
        timestamp: new Date(),
        status: 'completed',
        downloadUrl: '#'
      };
      
      setExportHistory(prev => [newExport, ...prev]);
      
      // Trigger download
      const mockData = generateMockReportData(selectedReport);
      analyticsService.exportToCSV(mockData, `${selectedReport.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateMockReportData = (reportType: string) => {
    switch (reportType) {
      case 'Financial Summary':
        return [
          { month: 'Jan', revenue: 45000, expenses: 28000, profit: 17000 },
          { month: 'Feb', revenue: 52000, expenses: 31000, profit: 21000 },
          { month: 'Mar', revenue: 48000, expenses: 29000, profit: 19000 }
        ];
      case 'Vehicle Performance':
        return [
          { vehicle: 'Toyota Camry', utilization: '85%', revenue: 12500, bookings: 23 },
          { vehicle: 'Honda CR-V', utilization: '78%', revenue: 11200, bookings: 19 },
          { vehicle: 'Nissan Altima', utilization: '92%', revenue: 15800, bookings: 31 }
        ];
      default:
        return [{ message: 'Sample data for ' + reportType }];
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileSpreadsheet className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'excel': return <FileSpreadsheet className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const selectedConfig = reportConfigs.find(r => r.name === selectedReport);

  return (
    <div className="space-y-6">
      {/* Report Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Generate Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {reportConfigs.map((config) => (
            <div
              key={config.name}
              onClick={() => handleReportSelect(config.name)}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedReport === config.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{config.name}</h3>
                {getFormatIcon(config.format)}
              </div>
              <p className="text-sm text-gray-600 mb-3">{config.description}</p>
              <div className="flex items-center text-xs text-gray-500">
                <FileText className="w-3 h-3 mr-1" />
                {config.sections.length} sections
              </div>
            </div>
          ))}
        </div>

        {selectedReport && selectedConfig && (
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Export Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={exportOptions.dateRange.start}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <input
                    type="date"
                    value={exportOptions.dateRange.end}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="flex space-x-2">
                  {['pdf', 'excel', 'csv'].map((format) => (
                    <button
                      key={format}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: format as any }))}
                      className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
                        exportOptions.format === format
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {getFormatIcon(format)}
                      <span className="ml-2 capitalize">{format}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sections Selection */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Include Sections
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedConfig.sections.map((section) => (
                  <label
                    key={section}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={exportOptions.sections.includes(section)}
                      onChange={() => handleSectionToggle(section)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {section.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Options */}
            <div className="mt-6 space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCharts}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include charts and graphs</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSummary}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeSummary: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include executive summary</span>
              </label>
            </div>

            {/* Email Delivery */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Report (Optional)
              </label>
              <input
                type="email"
                value={exportOptions.email}
                onChange={(e) => setExportOptions(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Export Actions */}
            <div className="mt-6 flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Preview
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting || exportOptions.sections.length === 0}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </>
                  )}
                </button>
              </div>
              
              {exportOptions.sections.length === 0 && (
                <div className="flex items-center text-sm text-amber-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Please select at least one section
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Exports</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exportHistory.map((exportItem) => (
                  <tr key={exportItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{exportItem.reportName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        {getFormatIcon(exportItem.format)}
                        <span className="ml-2 capitalize">{exportItem.format}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {exportItem.dateRange.start} to {exportItem.dateRange.end}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(exportItem.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Report Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedReport} Preview
                </h4>
                <p className="text-gray-600 mb-4">
                  This preview shows how your report will be generated
                </p>
                <div className="text-left bg-white rounded border p-4">
                  <div className="space-y-2 text-sm">
                    <div><strong>Format:</strong> {exportOptions.format.toUpperCase()}</div>
                    <div><strong>Date Range:</strong> {exportOptions.dateRange.start} to {exportOptions.dateRange.end}</div>
                    <div><strong>Sections:</strong> {exportOptions.sections.join(', ')}</div>
                    <div><strong>Include Charts:</strong> {exportOptions.includeCharts ? 'Yes' : 'No'}</div>
                    <div><strong>Include Summary:</strong> {exportOptions.includeSummary ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleExport();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
