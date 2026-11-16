import React from 'react';
import { Star, MapPin, Search } from 'lucide-react';

const CUISINES = ['All', 'Italian', 'Indian', 'American', 'Japanese'];

export default function RestaurantList({
  restaurants,
  selectedCuisine,
  onSelectCuisine,
  searchTerm,
  onSearchChange,
  onSelectRestaurant,
  loading,
}) {
  return (
    <section>
      <div className="hero-banner">
        <div className="container">
          <h1 className="hero-title">Hungry? Order from top restaurants.</h1>
          <p className="hero-sub">
            Fresh, hot meals crafted by the best local kitchens delivered right to your doorstep.
          </p>
          <div className="search-box">
            <Search size={20} color="#888" />
            <input
              type="text"
              placeholder="Search restaurants, cuisines, or favorite dishes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container">
        {/* Cuisine Filter Chips */}
        <div className="cuisine-filters">
          {CUISINES.map((cuisine) => (
            <button
              key={cuisine}
              className={`filter-chip ${
                (selectedCuisine === '' && cuisine === 'All') || selectedCuisine === cuisine
                  ? 'active'
                  : ''
              }`}
              onClick={() => onSelectCuisine(cuisine === 'All' ? '' : cuisine)}
            >
              {cuisine}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="empty-state">
            <p>Loading delicious restaurants...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="empty-state">
            <p>No restaurants found matching your criteria.</p>
          </div>
        ) : (
          <div className="restaurant-grid">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="restaurant-card">
                <div className="card-img-wrapper">
                  <img
                    src={
                      restaurant.image_url ||
                      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'
                    }
                    alt={restaurant.name}
                  />
                  <div className="rating-badge">
                    <Star size={14} fill="#f1c40f" color="#f1c40f" />
                    <span>{Number(restaurant.rating).toFixed(1)}</span>
                  </div>
                </div>

                <div className="card-body">
                  <span className="cuisine-tag">{restaurant.cuisine}</span>
                  <h3 className="restaurant-name">{restaurant.name}</h3>
                  <p className="restaurant-desc">{restaurant.description}</p>

                  <div className="card-footer">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--dark-light)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <MapPin size={14} />
                      <span className="address-text">{restaurant.address}</span>
                    </div>

                    <button
                      className="view-menu-btn"
                      onClick={() => onSelectRestaurant(restaurant)}
                    >
                      View Menu
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

