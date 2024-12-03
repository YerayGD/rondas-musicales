const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Configuración CORS
app.use(cors({
 origin: '*',
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
 allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
 credentials: true
}));

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

   const user = result.rows[0];
   const token = jwt.sign(
     { id: user.id, username: user.username },
     process.env.JWT_SECRET || 'test-secret-key',
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
   return res.status(500).json({ error: 'Error en el servidor' });
 }
});

// Crear ronda
app.post('/api/rondas', async (req, res) => {
 try {
   const { name, endDate } = req.body;
   const result = await pool.query(
     'INSERT INTO rondas (name, end_date) VALUES ($1, $2) RETURNING id',
     [name, endDate]
   );
   
   res.status(201).json({ id: result.rows[0].id });
 } catch (error) {
   console.error('Error creating ronda:', error);
   res.status(500).json({ error: 'Error al crear la ronda' });
 }
});

// Obtener todas las rondas
app.get('/api/rondas', async (req, res) => {
 try {
   const result = await pool.query(`
     SELECT r.id, r.name, r.end_date, r.created_at, r.status,
       (SELECT COUNT(*) FROM songs s WHERE s.ronda_id = r.id) as songs_count,
       (SELECT COUNT(*) FROM songs s2 
        JOIN votes v ON s2.id = v.song_id 
        WHERE s2.ronda_id = r.id) as votes_count
     FROM rondas r
     ORDER BY r.created_at DESC
   `);

   res.json(result.rows);
 } catch (error) {
   console.error('Error getting rondas:', error);
   res.status(500).json({ error: 'Error al obtener las rondas' });
 }
});

// Obtener una ronda específica
app.get('/api/rondas/:id', async (req, res) => {
 try {
   const { id } = req.params;
   
   // Obtener información de la ronda
   const rondaResult = await pool.query(
     'SELECT * FROM rondas WHERE id = $1',
     [id]
   );

   if (rondaResult.rows.length === 0) {
     return res.status(404).json({ error: 'Ronda no encontrada' });
   }

   // Obtener las canciones de la ronda con su conteo de votos
   const songsResult = await pool.query(`
     SELECT s.*, 
       (SELECT COUNT(*) FROM votes v WHERE v.song_id = s.id) as votes
     FROM songs s
     WHERE s.ronda_id = $1
     ORDER BY s.created_at DESC`,
     [id]
   );

   // Combinar los resultados
   const ronda = {
     ...rondaResult.rows[0],
     songs: songsResult.rows
   };

   res.json(ronda);
 } catch (error) {
   console.error('Error getting ronda:', error);
   res.status(500).json({ error: 'Error al obtener la ronda' });
 }
});

// Proponer canción
app.post('/api/rondas/:rondaId/songs', async (req, res) => {
 try {
   const { rondaId } = req.params;
   const { title, artist, duration } = req.body;
   const userId = 1; // Usuario de prueba

   const result = await pool.query(
     'INSERT INTO songs (ronda_id, title, artist, duration, proposed_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
     [rondaId, title, artist, duration, userId]
   );

   res.status(201).json(result.rows[0]);
 } catch (error) {
   console.error('Error proposing song:', error);
   res.status(500).json({ error: 'Error al proponer la canción' });
 }
});

// Votar canción
app.post('/api/rondas/:rondaId/songs/:songId/vote', async (req, res) => {
 try {
   const { rondaId, songId } = req.params;
   const { score } = req.body;
   const userId = 1; // Usuario de prueba

   // Verificar si la ronda existe y está activa
   const rondaCheck = await pool.query(
     'SELECT status FROM rondas WHERE id = $1',
     [rondaId]
   );

   if (rondaCheck.rows.length === 0) {
     return res.status(404).json({ error: 'Ronda no encontrada' });
   }

   // Verificar voto existente
   const voteCheck = await pool.query(
     'SELECT * FROM votes WHERE song_id = $1 AND user_id = $2',
     [songId, userId]
   );

   if (voteCheck.rows.length > 0) {
     return res.status(400).json({ error: 'Ya has votado esta canción' });
   }

   // Registrar voto
   await pool.query(
     'INSERT INTO votes (song_id, user_id, score) VALUES ($1, $2, $3)',
     [songId, userId, score]
   );

   res.json({ message: 'Voto registrado con éxito' });
 } catch (error) {
   console.error('Error voting:', error);
   res.status(500).json({ error: 'Error al registrar el voto' });
 }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
 console.log(`Servidor ejecutándose en el puerto ${PORT}`);
 console.log('Database URL:', process.env.DATABASE_URL ? 'Configurada' : 'No configurada');
});
