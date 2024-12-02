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
