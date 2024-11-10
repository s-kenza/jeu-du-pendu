USE game_react;

CREATE TABLE IF NOT EXISTS words (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

INSERT IGNORE INTO words (name) VALUES
('ordinateur'), ('javascript'), ('pendu'), ('react'), ('sequelize'),
('docker'), ('algorithm'), ('frontend'), ('backend');