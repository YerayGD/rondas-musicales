const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Configuración CORS
app.use(cors({
 origin: ['http://localhost:5173', 'https://rondas-musicales.onrender.com'],
 credentials: true
}));

// Middleware para headers CORS
app.use((req, res, next) => {
 res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
 res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
 res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
 res.header('Access-Control-Allow-Credentials', 'true');
 if (req.method === 'OPTIONS') {
   return res.sendStatus(200);
 }
 next();
});

app.use(express.json());

// Configuración base de datos
const pool = new Pool({
 connectionString: process.env.DATABASE_URL,
 ssl: {
   rejectUnauthorized: false
 }
});

// Ruta de prueba
app.get('/', (req, res) => {
 res.json({ message: 'API de Rondas Musicales' });
});

// Login
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

   // Temporalmente, para pruebas, aceptamos cualquier contraseña
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

// Crear ronda
app.post('/api/rondas', async (req, res) => {
 try {
   const { name, endDate, participants } = req.body;
   console.log('Creating ronda:', { name, endDate, participants });

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

   console.log('Ronda created successfully with id:', rondaId);
   res.status(201).json({ id: rondaId });
 } catch (error) {
   console.error('Error creating ronda:', error);
   res.status(500).json({ error: 'Error al crear la ronda' });
 }
});

// Obtener rondas
app.get('/api/rondas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*, 
        json_agg(json_build_object(
          'id', s.id,
          'title', s.title,
          'artist', s.artist,
          'duration', s.duration,
          'votes', (
            SELECT COUNT(*) FROM votes v WHERE v.song_id = s.id
          )
        )) as songs
      FROM rondas r
      LEFT JOIN songs s ON r.id = s.ronda_id
      WHERE r.id = $1
      GROUP BY r.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ronda no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting ronda:', error);
    res.status(500).json({ error: 'Error al obtener la ronda' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
 console.log(`Servidor ejecutándose en el puerto ${PORT}`);
 console.log('Database URL:', process.env.DATABASE_URL ? 'Configurada' : 'No configurada');
});
