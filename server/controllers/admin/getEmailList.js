const { getDb } = require('../../database');

// List of admin emails with access to email list download
const ADMIN_EMAILS = require('../../lib/adminEmails');

/**
 * Get a list of all user email addresses for admin use
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getEmailList = async (req, res) => {
  // Check if user is authenticated
  if (!req.session || !req.session.user || !req.session.user.userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const db = getDb();
    
    // Verify if the requesting user is an admin
    const user = await db.collection('users').findOne({ userId: req.session.user.userId });
    if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return res.status(403).json({ success: false, error: 'Forbidden - Admin access required' });
    }

    // Get all user emails and names
    const users = await db.collection('users')
      .find({}, { projection: { email: 1, name: 1, _id: 0 } })
      .toArray();

    // If request wants CSV instead of JSON, return as CSV file download
    if (req.query.format === 'text') {
      // Add CSV header
      let csvContent = 'email,firstname,lastname\n';
      
      // Process each user and add them to the CSV
      users.forEach(user => {
        const email = user.email || '';
        let firstName = '';
        let lastName = '';
        
        // Split the name into first and last name
        if (user.name) {
          const nameParts = user.name.split(' ');
          firstName = nameParts[0] || '';
          // Everything after the first name is considered last name
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        // Escape commas in data fields
        const escapedEmail = email.includes(',') ? `"${email}"` : email;
        const escapedFirstName = firstName.includes(',') ? `"${firstName}"` : firstName;
        const escapedLastName = lastName.includes(',') ? `"${lastName}"` : lastName;
        
        // Add the line to CSV content
        csvContent += `${escapedEmail},${escapedFirstName},${escapedLastName}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="user_emails.csv"');
      return res.send(csvContent);
    }

    // Default JSON response
    return res.status(200).json({
      success: true,
      users: users.map(user => {
        const nameParts = (user.name || '').split(' ');
        return {
          email: user.email,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || ''
        };
      }),
      count: users.length
    });

  } catch (error) {
    console.error('Error retrieving email list:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve email list' });
  }
};

module.exports = getEmailList; 