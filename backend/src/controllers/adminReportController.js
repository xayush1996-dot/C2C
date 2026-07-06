import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Enquiry from '../models/Enquiry.js';
import { generatePdfReport } from '../services/pdfReportService.js';
import { AppError } from '../middleware/errorHandler.js';

const buildDateRangeQuery = (startDateStr, endDateStr, next) => {
  const query = {};
  if (startDateStr || endDateStr) {
    query.createdAt = {};
    if (startDateStr) {
      const sDate = new Date(startDateStr);
      if (isNaN(sDate.getTime())) {
        return next(new AppError('Invalid startDate format', 400));
      }
      query.createdAt.$gte = sDate;
    }
    if (endDateStr) {
      const eDate = new Date(endDateStr);
      if (isNaN(eDate.getTime())) {
        return next(new AppError('Invalid endDate format', 400));
      }
      query.createdAt.$lte = eDate;
    }
  }
  return query;
};

const getDateRangeLabel = (startDateStr, endDateStr) => {
  const s = startDateStr ? new Date(startDateStr).toLocaleDateString() : 'Beginning';
  const e = endDateStr ? new Date(endDateStr).toLocaleDateString() : 'Present';
  return `${s} to ${e}`;
};

export const getEnquiriesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query = buildDateRangeQuery(startDate, endDate, next);
    if (res.headersSent) return;

    if (status && typeof status === 'string') {
      const statusVal = status.trim().toUpperCase();
      if (!['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(statusVal)) {
        return next(new AppError('Invalid status query filter value', 400));
      }
      query.status = statusVal;
    }

    const enquiries = await Enquiry.find(query).sort({ createdAt: -1 }).limit(5000);

    const columns = [
      { header: 'Date', x: 50, width: 80, valueGetter: (r) => new Date(r.createdAt).toLocaleDateString() },
      { header: 'Name', x: 135, width: 90, valueGetter: (r) => r.name },
      { header: 'Email', x: 230, width: 120, valueGetter: (r) => r.email },
      { header: 'Subject', x: 355, width: 110, valueGetter: (r) => r.subject || 'N/A' },
      { header: 'Status', x: 470, width: 75, valueGetter: (r) => r.status }
    ];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_enquiries_${Date.now()}.pdf`);

    generatePdfReport(res, {
      title: 'Enquiry Operational Report',
      dateRange: getDateRangeLabel(startDate, endDate),
      data: enquiries,
      columns
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query = buildDateRangeQuery(startDate, endDate, next);
    if (res.headersSent) return;

    if (status && typeof status === 'string') {
      const statusVal = status.trim().toUpperCase();
      if (!['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'].includes(statusVal)) {
        return next(new AppError('Invalid status query filter value', 400));
      }
      query.status = statusVal;
    }

    const payments = await Payment.find(query).sort({ createdAt: -1 }).limit(5000);

    // Calculate sum of successful payment amounts within this query selection
    const successPaymentsTotal = payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);

    const summaryText = `Total Successful Revenue (Within Filter): INR ${(successPaymentsTotal / 100).toFixed(2)}`;

    const columns = [
      { header: 'Date', x: 50, width: 80, valueGetter: (r) => new Date(r.createdAt).toLocaleDateString() },
      { header: 'Razorpay Order ID', x: 135, width: 110, valueGetter: (r) => r.razorpayOrderId },
      { header: 'Payment ID', x: 250, width: 110, valueGetter: (r) => r.razorpayPaymentId || 'N/A' },
      { header: 'Amount (INR)', x: 365, width: 80, valueGetter: (r) => (r.amount / 100).toFixed(2) },
      { header: 'Status', x: 450, width: 95, valueGetter: (r) => r.status }
    ];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_payments_${Date.now()}.pdf`);

    generatePdfReport(res, {
      title: 'Payment Operational Report',
      dateRange: getDateRangeLabel(startDate, endDate),
      data: payments,
      columns,
      summaryText
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query = buildDateRangeQuery(startDate, endDate, next);
    if (res.headersSent) return;

    if (status && typeof status === 'string') {
      const statusVal = status.trim().toUpperCase();
      if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'NEEDS_REVIEW', 'COMPLETED'].includes(statusVal)) {
        return next(new AppError('Invalid status query filter value', 400));
      }
      query.status = statusVal;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'email')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(5000);

    const columns = [
      { header: 'Created', x: 50, width: 75, valueGetter: (r) => new Date(r.createdAt).toLocaleDateString() },
      { header: 'Customer Email', x: 130, width: 120, valueGetter: (r) => r.user?.email || 'N/A' },
      { header: 'Service', x: 255, width: 110, valueGetter: (r) => r.service?.name || 'N/A' },
      { header: 'Scheduled Time', x: 370, width: 100, valueGetter: (r) => r.scheduledTime ? new Date(r.scheduledTime).toLocaleDateString() : 'Pending' },
      { header: 'Status', x: 475, width: 70, valueGetter: (r) => r.status }
    ];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_bookings_${Date.now()}.pdf`);

    generatePdfReport(res, {
      title: 'Booking Operational Report',
      dateRange: getDateRangeLabel(startDate, endDate),
      data: bookings,
      columns
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomersReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const query = buildDateRangeQuery(startDate, endDate, next);
    if (res.headersSent) return;

    query.role = 'CUSTOMER';

    const customers = await User.find(query).select('name email createdAt').sort({ createdAt: -1 }).limit(5000);

    const columns = [
      { header: 'Registered', x: 50, width: 80, valueGetter: (r) => new Date(r.createdAt).toLocaleDateString() },
      { header: 'Name', x: 135, width: 110, valueGetter: (r) => r.name },
      { header: 'Email', x: 250, width: 140, valueGetter: (r) => r.email },
      { header: 'SSO (Google)', x: 395, width: 70, valueGetter: (r) => r.googleId ? 'Yes' : 'No' },
      { header: 'Status', x: 470, width: 75, valueGetter: (r) => r.lockoutUntil && new Date(r.lockoutUntil) > new Date() ? 'Locked' : 'Active' }
    ];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_customers_${Date.now()}.pdf`);

    generatePdfReport(res, {
      title: 'Customer Directory Report',
      dateRange: getDateRangeLabel(startDate, endDate),
      data: customers,
      columns
    });
  } catch (error) {
    next(error);
  }
};
