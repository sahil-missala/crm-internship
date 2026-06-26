const db = require('../config/db');

exports.getStats = async (req, res, next) => {
  try {
    // 1. Total Enquiries
    const [totalRows] = await db.execute('SELECT COUNT(*) as count FROM enquiries');
    const totalEnquiries = totalRows[0].count;

    // 2. Pending Follow-ups (status 'New' or 'Contacted')
    const [pendingRows] = await db.execute("SELECT COUNT(*) as count FROM enquiries WHERE status IN ('New', 'Contacted')");
    const pendingFollowups = pendingRows[0].count;

    // 3. Confirmed Bookings (records in bookings table)
    const [confirmedRows] = await db.execute('SELECT COUNT(*) as count FROM bookings');
    const confirmedBookings = confirmedRows[0].count;

    // 4. This Month's Enquiries
    const [monthRows] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM enquiries 
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `);
    const thisMonth = monthRows[0].count;

    return res.json({
      success: true,
      stats: {
        total_enquiries: totalEnquiries,
        pending_followups: pendingFollowups,
        confirmed_bookings: confirmedBookings,
        this_month: thisMonth
      }
    });

  } catch (err) {
    next(err);
  }
};
