app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email); // Para debugging
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.log('User not found'); // Para debugging
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    console.log('User found:', user.email); // Para debugging

    // Por ahora, para pruebas, aceptaremos cualquier contraseña
    // En producción, deberías usar bcrypt.compare
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'tu_clave_secreta',
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error); // Para debugging
    res.status(500).json({ error: 'Error al iniciar sesión', details: error.message });
  }
});
