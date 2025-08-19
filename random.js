const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'YourPassword',  // replace with your MySQL root password
  database: 'schoolDB'
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected!');
});

// Add School API
app.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(query, [name, address, latitude, longitude], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ message: 'School added successfully', id: result.insertId });
  });
});

// List Schools API (sorted by distance)
app.get('/listSchools', (req, res) => {
  const userLat = parseFloat(req.query.latitude);
  const userLon = parseFloat(req.query.longitude);

  if (!userLat || !userLon) return res.status(400).json({ message: 'Coordinates required' });

  db.query('SELECT * FROM schools', (err, schools) => {
    if (err) return res.status(500).json({ message: err.message });

    const R = 6371; // Earth radius in km
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const sortedSchools = schools.map(school => ({
      ...school,
      distance: getDistance(userLat, userLon, school.latitude, school.longitude)
    })).sort((a,b) => a.distance - b.distance);

    res.json(sortedSchools);
  });
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
