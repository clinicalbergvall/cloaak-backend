const express = require('express');
const router = express.Router();




router.get('/dashboard', (req, res) => {
  res.send('Team Leader Dashboard');
});


router.get('/payments', (req, res) => {
  res.json({ message: 'Payments list' });
});


router.post('/payments', (req, res) => {
  res.json({ message: 'Payment created' });
});


router.get('/teams', (req, res) => {
  res.json({ message: 'Teams list' });
});


router.post('/teams', (req, res) => {
  res.json({ message: 'Team created' });
});

module.exports = router;

















































































































