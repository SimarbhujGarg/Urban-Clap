/**
 * server.js
 * Urban Company Booking Management System
 * Using Node.js, Express, and MySQL (via XAMPP)
 */

const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const port = 3001; // Server runs on http://localhost:3001

// Middleware configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the public folder

// Create a MySQL connection pool (update credentials if needed)
const db = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',    // default XAMPP MySQL username
  password: '',    // default XAMPP MySQL password (empty string)
  database: 'urban_company' // Make sure this matches the database you created
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database!');
  connection.release();
});

// API Endpoints

// GET /api/slots - Fetch available slots
app.get('/api/slots', (req, res) => {
  const query = `
    SELECT slots.id, carpenters.name AS carpenter, slots.start_time, slots.end_time 
    FROM slots 
    JOIN carpenters ON slots.carpenter_id = carpenters.id 
    WHERE slots.is_available = TRUE
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching slots:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

// POST /api/book - Book a specific slot
app.post('/api/book', (req, res) => {
  const { slotId, userName } = req.body;
  if (!slotId || !userName) {
    return res.status(400).json({ message: 'Missing slotId or userName' });
  }
  // Check if slot is available
  const checkQuery = 'SELECT is_available FROM slots WHERE id = ?';
  db.query(checkQuery, [slotId], (err, results) => {
    if (err) {
      console.error('Error checking slot availability:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    if (!results[0].is_available) {
      return res.status(400).json({ message: 'Slot already booked' });
    }
    // Insert reservation and update slot availability
    const insertQuery = 'INSERT INTO reservations (slot_id, user_name, status) VALUES (?, ?, "booked")';
    db.query(insertQuery, [slotId, userName], (err, result) => {
      if (err) {
        console.error('Error booking slot:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      const reservationId = result.insertId;
      const updateSlotQuery = 'UPDATE slots SET is_available = FALSE WHERE id = ?';
      db.query(updateSlotQuery, [slotId], (err) => {
        if (err) {
          console.error('Error updating slot availability:', err);
          return res.status(500).json({ message: 'Database error updating slot' });
        }
        res.json({ message: 'Slot booked successfully', reservationId: reservationId });
      });
    });
  });
});

// GET /api/booking/:id - Retrieve booking details
app.get('/api/booking/:id', (req, res) => {
  const bookingId = req.params.id;
  const query = `
    SELECT reservations.id, reservations.user_name, reservations.status, 
           slots.start_time, slots.end_time, carpenters.name AS carpenter
    FROM reservations
    JOIN slots ON reservations.slot_id = slots.id
    JOIN carpenters ON slots.carpenter_id = carpenters.id
    WHERE reservations.id = ?
  `;
  db.query(query, [bookingId], (err, results) => {
    if (err) {
      console.error('Error fetching booking:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(results[0]);
  });
});

// PUT /api/booking/:id/confirm - Confirm a booking
app.put('/api/booking/:id/confirm', (req, res) => {
  const bookingId = req.params.id;
  const updateQuery = 'UPDATE reservations SET status = "confirmed" WHERE id = ?';
  db.query(updateQuery, [bookingId], (err) => {
    if (err) {
      console.error('Error confirming booking:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json({ message: 'Booking confirmed successfully' });
  });
});

// DELETE /api/booking/:id - Cancel a booking and update slot availability
app.delete('/api/booking/:id', (req, res) => {
  const bookingId = req.params.id;
  // First, get the slot ID related to the booking
  const selectQuery = 'SELECT slot_id FROM reservations WHERE id = ?';
  db.query(selectQuery, [bookingId], (err, results) => {
    if (err) {
      console.error('Error fetching reservation:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const slotId = results[0].slot_id;
    // Delete the reservation
    const deleteQuery = 'DELETE FROM reservations WHERE id = ?';
    db.query(deleteQuery, [bookingId], (err) => {
      if (err) {
        console.error('Error deleting reservation:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      // Set the slot back to available
      const updateSlotQuery = 'UPDATE slots SET is_available = TRUE WHERE id = ?';
      db.query(updateSlotQuery, [slotId], (err) => {
        if (err) {
          console.error('Error updating slot availability:', err);
          return res.status(500).json({ message: 'Database error updating slot' });
        }
        res.json({ message: 'Booking cancelled and slot updated' });
      });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
}); 