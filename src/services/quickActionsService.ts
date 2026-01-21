import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class QuickActionsService {
  private api: any;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config: any) => {
      const token = localStorage.getItem('car-hire-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Get today's bookings
  async getTodayBookings() {
    try {
      const response = await this.api.get('/quick-actions/today-bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching today\'s bookings:', error);
      throw error;
    }
  }

  // Get available vehicles for date range
  async getAvailableVehicles(startDate: string, endDate: string) {
    try {
      const response = await this.api.get('/quick-actions/available-vehicles', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      throw error;
    }
  }

  // Quick add booking
  async addBooking(bookingData: {
    client_id: string;
    vehicle_id: string;
    start_date: string;
    end_date: string;
    daily_rate: number;
  }) {
    try {
      const response = await this.api.post('/quick-actions/add-booking', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error adding booking:', error);
      throw error;
    }
  }

  // Mark vehicle as returned
  async markVehicleAsReturned(bookingId: string, returnData: {
    mileage?: number;
    notes?: string;
    damageReport?: string;
  }) {
    try {
      const response = await this.api.post(`/quick-actions/mark-returned/${bookingId}`, returnData);
      return response.data;
    } catch (error) {
      console.error('Error marking vehicle as returned:', error);
      throw error;
    }
  }

  // Generate invoice
  async generateInvoice(bookingId: string) {
    try {
      const response = await this.api.post(`/quick-actions/generate-invoice/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  // Send payment reminder
  async sendPaymentReminder(bookingId: string, message?: string) {
    try {
      const response = await this.api.post(`/quick-actions/send-payment-reminder/${bookingId}`, { message });
      return response.data;
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  // Get quick actions stats
  async getQuickActionsStats() {
    try {
      const response = await this.api.get('/quick-actions/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching quick actions stats:', error);
      throw error;
    }
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

  // Format date
  formatDate(date: string | Date) {
    return new Intl.DateTimeFormat('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  // Calculate days between dates
  calculateDays(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Validate booking dates
  validateBookingDates(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return { valid: false, error: 'Start date cannot be in the past' };
    }

    if (end <= start) {
      return { valid: false, error: 'End date must be after start date' };
    }

    const days = this.calculateDays(startDate, endDate);
    if (days > 30) {
      return { valid: false, error: 'Booking cannot exceed 30 days' };
    }

    return { valid: true };
  }

  // Download invoice as PDF
  downloadInvoice(invoiceData: any) {
    // Create a simple text-based invoice for now
    // In a real implementation, you'd use a PDF library like jsPDF
    const invoiceContent = `
INVOICE: ${invoiceData.invoiceNumber}
Date: ${this.formatDate(invoiceData.date)}
Due Date: ${this.formatDate(invoiceData.dueDate)}

CLIENT: ${invoiceData.client.name}
Email: ${invoiceData.client.email}
Phone: ${invoiceData.client.phone}

VEHICLE: ${invoiceData.vehicle.make} ${invoiceData.vehicle.model}
License Plate: ${invoiceData.vehicle.licensePlate}
Year: ${invoiceData.vehicle.year}

BOOKING DETAILS:
Period: ${this.formatDate(invoiceData.booking.startDate)} - ${this.formatDate(invoiceData.booking.endDate)}
Days: ${invoiceData.booking.days}
Daily Rate: ${this.formatCurrency(invoiceData.booking.dailyRate)}

AMOUNTS:
Subtotal: ${this.formatCurrency(invoiceData.amounts.subtotal)}
Tax (16%): ${this.formatCurrency(invoiceData.amounts.tax)}
Total: ${this.formatCurrency(invoiceData.amounts.total)}

Thank you for your business!
    `;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceData.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const quickActionsService = new QuickActionsService();
export default quickActionsService;
