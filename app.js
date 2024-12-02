const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();  // Esta línea es crucial y faltaba

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'API de Rondas Musicales' });
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt with:', email);

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log('No user found with email:', email);
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];
        const token = jwt.sign(
            { id: user.id, username: user.username },
            'test-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful for:', email);
        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Error en el servidor',
            details: error.message
        });
    }
});

app.post('/api/rondas', async (req, res) => {
  try {
    const { name, endDate, participants } = req.body;
    const result = await pool.query(
      'INSERT INTO rondas (name, end_date) VALUES ($1, $2) RETURNING id',
      [name, endDate]
    );
    
    const rondaId = result.rows[0].id;
    
    // Añadir participantes
    if (participants && participants.length > 0) {
      await Promise.all(participants.map(userId => 
        pool.query(
          'INSERT INTO ronda_participants (ronda_id, user_id) VALUES ($1, $2)',
          [rondaId, userId]
        )
      ));
    }

    res.status(201).json({ id: rondaId });
  } catch (error) {
    console.error('Error al crear ronda:', error);
    res.status(500).json({ error: 'Error al crear la ronda' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
