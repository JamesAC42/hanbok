const logout = (req, res) => {
    
    req.session.destroy((err) => {
      if (err) {
          console.error('Error destroying session:', err);
          res.json({ success: false});
      } else {
          res.json({ success: true });
      }
    });
  
}
module.exports = logout;