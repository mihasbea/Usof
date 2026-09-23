CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    login VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    email_confirm_token VARCHAR(255),
    profile_picture VARCHAR(255),
    rating INT NOT NULL DEFAULT 0,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email_confirm_token (email_confirm_token),
    INDEX idx_password_reset_token (password_reset_token),
    INDEX idx_password_reset_expires (password_reset_expires)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO users (login, password, full_name, email, email_confirmed, role) VALUES
('mmykhalchenko', '$2b$10$T8Z.X2hV7VzQ3f9.4p3U3e5H7rM9c4/Z.T.uL.G.g.Z.L.R.T.N.W', 'Mariia Mykhalchenko', 'mmykhalchenko@test.com', TRUE, 'admin'),
('vshaforostova', '$2b$10$T8Z.X2hV7VzQ3f9.4p3U3e5H7rM9c4/Z.T.uL.G.g.Z.L.R.T.N.W', 'Viktoriia Shaforostova', 'vshaforostova@test.com', TRUE, 'user'),
('dburlachenko', '$2b$10$T8Z.X2hV7VzQ3f9.4p3U3e5H7rM9c4/Z.T.uL.G.g.Z.L.R.T.N.W', 'Daniil Burlachenko', 'dburlachenko@test.com', TRUE, 'user'),
('rferchuk', '$2b$10$T8Z.X2hV7VzQ3f9.4p3U3e5H7rM9c4/Z.T.uL.G.g.Z.L.R.T.N.W', 'Roman Ferchuk', 'rferchuk@test.com', TRUE, 'user'),
('amilshina', '$2b$10$T8Z.X2hV7VzQ3f9.4p3U3e5H7rM9c4/Z.T.uL.G.g.Z.L.R.T.N.W', 'Albina Milshina', 'amilshina@test.com', TRUE, 'user'),
('vkasatonov', '$2b$10$T8Z.X2hV7VzQ3f9.4p3U3e5H7rM9c4/Z.T.uL.G.g.Z.L.R.T.N.W', 'Владислав Касатонов', 'vkasatonov@test.com', TRUE, 'user');

CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO categories (title, description) VALUES
('Backend Development', 'Questions about server-side logic, databases, APIs, application architecture (Node.js, PHP, Python, Java, Go, etc.)'),
('Frontend Development', 'Questions about client-side development, user interfaces, and web design (HTML, CSS, JavaScript, React, Angular, Vue.js, etc.)'),
('Mobile Development', 'Questions about mobile app development for iOS and Android platforms.'),
('DevOps', 'Questions about deployment, CI/CD pipelines, cloud services, and infrastructure management.'),
('Data Science', 'Questions about data analysis, machine learning, AI, and statistical modeling.'),
('Cybersecurity', 'Questions about security practices, vulnerabilities, encryption, and ethical hacking.'),
('Game Development', 'Questions about creating video games, game engines, graphics programming, and game design.'),
('Software Testing', 'Questions about testing methodologies, test automation, QA processes, and bug tracking.');

CREATE TABLE IF NOT EXISTS posts (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    author_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO posts (author_id, title, content, status) VALUES
(1, 'How to optimize SQL queries for better performance?', 'I have a large database and some of my SQL queries are running slow. What are some best practices for optimizing SQL queries to improve performance?', 'active'),
(2, 'What is the difference between REST and GraphQL?', 'I am trying to understand the differences between REST and GraphQL APIs. Can someone explain the pros and cons of each approach?', 'active'),
(3, 'How to implement JWT authentication in a Node.js application?', 'I am building a Node.js application and want to implement JWT authentication. Can someone provide a step-by-step guide or example code?', 'active'),
(4, 'What are the best practices for responsive web design?', 'I want to make my website responsive and mobile-friendly. What are some best practices for responsive web design?', 'active'),
(5, 'How to deploy a Django application on AWS?', 'I have developed a Django application and want to deploy it on AWS. What are the steps involved in deploying a Django app on AWS?', 'active');

CREATE TABLE IF NOT EXISTS post_attachments (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    post_id INT UNSIGNED NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type ENUM('image', 'video', 'document', 'other') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_categories(
    post_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (post_id, category_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category_id (category_id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO post_categories (post_id, category_id) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 2),
(5, 1);

CREATE TABLE IF NOT EXISTS comments (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    post_id INT UNSIGNED NOT NULL,
    author_id INT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO comments (post_id, author_id, content, status) VALUES
(1, 2, 'You can use EXPLAIN to analyze your queries and identify bottlenecks. Also, consider indexing frequently queried columns.', 'active'),
(1, 3, 'Make sure to avoid SELECT * and only retrieve the columns you need. This can significantly improve performance.', 'active'),
(2, 4, 'REST is more traditional and widely used, while GraphQL allows clients to request exactly what they need. It can reduce over-fetching of data.', 'active'),
(3, 5, 'You can use the jsonwebtoken library in Node.js to implement JWT authentication. Make sure to securely store your secret key.', 'active'),
(4, 1, 'Use media queries and flexible grid layouts to ensure your website looks good on all devices. Test on multiple screen sizes.', 'active');

CREATE TABLE IF NOT EXISTS likes (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    author_id INT UNSIGNED NOT NULL,
    type ENUM('like', 'dislike') NOT NULL,
    target_type ENUM('post', 'comment') NOT NULL,
    post_id INT UNSIGNED,
    comment_id INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    CHECK (
    (target_type = 'post' AND post_id IS NOT NULL AND comment_id IS NULL) OR
    (target_type = 'comment' AND comment_id IS NOT NULL AND post_id IS NULL)
    ),
    UNIQUE KEY uniq_author_post (author_id, post_id),
    UNIQUE KEY uniq_author_comment (author_id, comment_id)  
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO likes (author_id, type, target_type, post_id, comment_id) VALUES
(2, 'like', 'post', 1, NULL),
(3, 'like', 'post', 1, NULL),
(4, 'dislike', 'post', 2, NULL),
(5, 'like', 'comment', NULL, 1),
(1, 'dislike', 'comment', NULL, 2);

CREATE TABLE IF NOT EXISTS favorites (
    user_id INT UNSIGNED NOT NULL,
    post_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO favorites (user_id, post_id) VALUES
(2, 1),
(3, 1),
(4, 2),
(5, 3),
(1, 4);

CREATE TABLE IF NOT EXISTS post_subscriptions (
    user_id INT UNSIGNED NOT NULL,
    post_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO post_subscriptions (user_id, post_id) VALUES
(2, 1),
(3, 1),
(4, 2),
(5, 3),
(1, 4);

CREATE TABLE IF NOT EXISTS category_subscriptions (
    user_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO category_subscriptions (user_id, category_id) VALUES
(2, 1),
(3, 1),
(4, 2),
(5, 3),
(1, 4);