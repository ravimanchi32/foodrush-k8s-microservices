-- Database Initialization for Food Ordering Microservices
CREATE DATABASE IF NOT EXISTS food_delivery;
USE food_delivery;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin', 'restaurant_owner') DEFAULT 'customer',
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    cuisine VARCHAR(100) NOT NULL,
    image_url VARCHAR(500),
    rating DECIMAL(2, 1) DEFAULT 4.5,
    address VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    delivery_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('CARD', 'UPI', 'CASH_ON_DELIVERY') DEFAULT 'CARD',
    status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'SUCCESS',
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- SEED DATA
-- Default password for seeded users is: password123
-- =========================================================================

-- Seed Users (Bcrypt hash of 'password123')
INSERT INTO users (id, name, email, password_hash, role, phone, address) VALUES
(1, 'Admin User', 'admin@foodrush.com', '$2b$12$K1r.ZomI84V5/6zQn73iBuGqHn3UfqPqVzHlJ87cZtB/W5q4M7e2K', 'admin', '+1-555-0100', '100 Admin Blvd, Suite 400'),
(2, 'Jane Doe', 'jane@example.com', '$2b$12$K1r.ZomI84V5/6zQn73iBuGqHn3UfqPqVzHlJ87cZtB/W5q4M7e2K', 'customer', '+1-555-0101', '742 Evergreen Terrace, Springfield'),
(3, 'John Smith', 'john@example.com', '$2b$12$K1r.ZomI84V5/6zQn73iBuGqHn3UfqPqVzHlJ87cZtB/W5q4M7e2K', 'customer', '+1-555-0102', '123 Elm Street, Cityville')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Restaurants
INSERT INTO restaurants (id, name, description, cuisine, image_url, rating, address, is_active) VALUES
(1, 'Bella Trattoria', 'Authentic wood-fired pizzas, homemade pastas, and artisanal gelato.', 'Italian', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80', 4.8, '14 Via Roma, Downtown', TRUE),
(2, 'Spice Symphony', 'Royal Indian curries, tandoori grills, and aromatic biryanis.', 'Indian', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80', 4.7, '88 Curry Lane, Old Town', TRUE),
(3, 'Burger Craft & Co.', 'Gourmet smashed beef burgers, crispy wings, and thick shakes.', 'American', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', 4.6, '404 Smash Ave, Midtown', TRUE),
(4, 'Tokyo Blossom Sushi', 'Fresh sashimi, signature maki rolls, and hot ramen bowls.', 'Japanese', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80', 4.9, '12 Sakura Way, Waterfront', TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Seed Menu Items
INSERT INTO menu_items (id, restaurant_id, name, description, price, category, image_url, is_available) VALUES
-- Bella Trattoria (id: 1)
(1, 1, 'Margherita Burrata Pizza', 'San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, extra virgin olive oil.', 14.99, 'Pizzas', 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80', TRUE),
(2, 1, 'Truffle Tagliolini', 'Handcrafted egg pasta tossed in black truffle cream and aged Parmigiano Reggiano.', 18.50, 'Pasta', 'https://images.unsplash.com/photo-1621996346565-e3d5d6281729?w=500&auto=format&fit=crop&q=80', TRUE),
(3, 1, 'Classic Tiramisu', 'Espresso-soaked ladyfingers layered with whipped mascarpone cream and cocoa powder.', 7.50, 'Desserts', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=80', TRUE),

-- Spice Symphony (id: 2)
(4, 2, 'Butter Chicken Royale', 'Tender tandoori chicken simmered in rich buttery tomato sauce infused with fenugreek.', 16.99, 'Curries', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=80', TRUE),
(5, 2, 'Hyderabadi Dum Biryani', 'Slow-cooked fragrant basmati rice layered with spiced marinated lamb, saffron, and mint.', 17.50, 'Biryani', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80', TRUE),
(6, 2, 'Garlic & Coriander Naan', 'Clay oven baked fluffy flatbread brushed with roasted garlic butter and cilantro.', 3.99, 'Breads', 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&auto=format&fit=crop&q=80', TRUE),

-- Burger Craft & Co. (id: 3)
(7, 3, 'The Double Smash Burger', 'Two 100% Angus patties, double melted cheddar, secret sauce, pickles on brioche bun.', 12.99, 'Burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80', TRUE),
(8, 3, 'Truffle Parmesan Fries', 'Crispy hand-cut russet fries tossed with white truffle oil, shaved parmesan, and herbs.', 6.49, 'Sides', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80', TRUE),
(9, 3, 'Salted Caramel Milkshake', 'Hand-spun vanilla bean ice cream with house salted caramel drizzle and whipped cream.', 5.99, 'Beverages', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80', TRUE),

-- Tokyo Blossom Sushi (id: 4)
(10, 4, 'Dragon Roll (8 pcs)', 'Crispy tempura prawn and cucumber wrapped with sliced avocado, unagi eel sauce, and tobiko.', 15.99, 'Sushi Rolls', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=80', TRUE),
(11, 4, 'Salmon & Tuna Sashimi', '12 pieces of chef-selected prime sashimi cuts served with fresh wasabi and pickled ginger.', 22.00, 'Sashimi', 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=500&auto=format&fit=crop&q=80', TRUE),
(12, 4, 'Tonkotsu Ramen', 'Rich 18-hour pork bone broth, chashu pork belly, ajitsuke tamago egg, and nori.', 14.50, 'Ramen', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80', TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Sample Order & Payment for Jane Doe
INSERT INTO orders (id, user_id, restaurant_id, total_amount, status, delivery_address) VALUES
(101, 2, 1, 33.49, 'PREPARING', '742 Evergreen Terrace, Springfield')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO order_items (id, order_id, menu_item_id, item_name, quantity, unit_price, subtotal) VALUES
(1, 101, 1, 'Margherita Burrata Pizza', 1, 14.99, 14.99),
(2, 101, 2, 'Truffle Tagliolini', 1, 18.50, 18.50)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO payments (id, order_id, amount, payment_method, status, transaction_id) VALUES
(1, 101, 33.49, 'CARD', 'SUCCESS', 'TXN-98472918')
ON DUPLICATE KEY UPDATE id=id;

