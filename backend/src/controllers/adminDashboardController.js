import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Enquiry from '../models/Enquiry.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    // 1. Enquiries stats
    const totalEnquiries = await Enquiry.countDocuments();
    const pendingEnquiries = await Enquiry.countDocuments({ status: 'PENDING' });
    const inProgressEnquiries = await Enquiry.countDocuments({ status: 'IN_PROGRESS' });
    const resolvedEnquiries = await Enquiry.countDocuments({ status: 'RESOLVED' });

    // 2. Bookings stats
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'PENDING' });
    const confirmedBookings = await Booking.countDocuments({ status: 'CONFIRMED' });
    const cancelledBookings = await Booking.countDocuments({ status: 'CANCELLED' });
    const needsReviewBookings = await Booking.countDocuments({ status: 'NEEDS_REVIEW' });

    // 3. Payments stats
    const totalPayments = await Payment.countDocuments();
    const successfulPayments = await Payment.countDocuments({ status: 'SUCCESS' });
    const pendingPayments = await Payment.countDocuments({ status: 'PENDING' });
    const failedPayments = await Payment.countDocuments({ status: 'FAILED' });
    const refundedPayments = await Payment.countDocuments({ status: 'REFUNDED' });

    // Calculate total revenue (sum of amounts where status is SUCCESS)
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    const totalRevenuePaise = revenueResult.length > 0 ? revenueResult[0].totalAmount : 0;
    const totalRevenue = totalRevenuePaise / 100; // convert to INR

    // 4. Customers stats
    const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });

    res.status(200).json({
      success: true,
      data: {
        enquiries: {
          total: totalEnquiries,
          pending: pendingEnquiries,
          inProgress: inProgressEnquiries,
          resolved: resolvedEnquiries
        },
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
          needsReview: needsReviewBookings
        },
        payments: {
          total: totalPayments,
          successful: successfulPayments,
          pending: pendingPayments,
          failed: failedPayments,
          refunded: refundedPayments,
          totalRevenue
        },
        customers: {
          total: totalCustomers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
