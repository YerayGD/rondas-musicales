-- Crear tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de rondas
CREATE TABLE rondas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'voting',
    created_by INTEGER REFERENCES users(id),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de participantes en rondas
CREATE TABLE ronda_participants (
    ronda_id INTEGER REFERENCES rondas(id),
    user_id INTEGER REFERENCES users(id),
    has_voted BOOLEAN DEFAULT false,
    PRIMARY KEY (ronda_id, user_id)
);

-- Crear tabla de canciones
CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    ronda_id INTEGER REFERENCES rondas(id),
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(200) NOT NULL,
    duration VARCHAR(10),
    proposed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de votos
CREATE TABLE votes (
    song_id INTEGER REFERENCES songs(id),
    user_id INTEGER REFERENCES users(id),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (song_id, user_id)
);
