import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = "https://api.tvmaze.com";

const fallbackImage =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=700&q=80";

function removeHtmlTags(text = "") {
  return text.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();
}

function formatDate(date) {
  if (!date) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric"
  }).format(new Date(date));
}

function Navbar({ goToMovies }) {
  return (
    <header className="navbar">
      <button
        className="brand"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span className="brand-icon">▶</span>
        Movie<span>Explorer</span>
      </button>

      <nav>
        <a href="#movies">Discover</a>

        <button className="nav-button" onClick={goToMovies}>
          Movies →
        </button>
      </nav>
    </header>
  );
}

function Hero({ goToMovies }) {
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="small-title">YOUR NEXT OBSESSION AWAITS</p>

        <h1>
          Stories that stay
          <br />
          <em>with you.</em>
        </h1>

        <p className="hero-text">
          Explore remarkable shows, unforgettable characters, and a world of
          stories waiting for you.
        </p>

        <button className="primary-button" onClick={goToMovies}>
          Explore Movies →
        </button>
      </div>
    </section>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <div className="search-box">
      <span>⌕</span>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search for a movie..."
      />

      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  );
}

function MovieCard({ show, openModal }) {
  const rating = show.rating?.average ?? "N/A";

  return (
    <article className="movie-card">
      <div className="poster-box">
        <img
          src={show.image?.medium || fallbackImage}
          alt={show.name}
          onError={(event) => {
            event.currentTarget.src = fallbackImage;
          }}
        />

        <span className="rating-badge">★ {rating}</span>
      </div>

      <div className="card-content">
        <h3>{show.name}</h3>

        <p>
          📅 {formatDate(show.premiered)} <b>•</b>{" "}
          {show.genres?.[0] || "TV Show"}
        </p>

        <button
          className="details-button"
          onClick={() => openModal(show)}
        >
          See Details
        </button>
      </div>
    </article>
  );
}

function DetailsModal({ show, closeModal }) {
  const closeButton = useRef(null);

  useEffect(() => {
    function closeWhenEscapePressed(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    document.addEventListener("keydown", closeWhenEscapePressed);
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    return () => {
      document.removeEventListener("keydown", closeWhenEscapePressed);
      document.body.style.overflow = "";
    };
  }, [closeModal]);

  const image = show.image?.original || show.image?.medium || fallbackImage;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <section className="modal">
        <button
          ref={closeButton}
          className="close-button"
          onClick={closeModal}
          aria-label="Close details"
        >
          ×
        </button>

        <img className="modal-image" src={image} alt={show.name} />

        <div className="modal-content">
          <p className="small-title">SHOW DETAILS</p>

          <h2>{show.name}</h2>

          <div className="modal-meta">
            <span>⭐ Rating: {show.rating?.average ?? "N/A"}</span>
            <span>📅 {formatDate(show.premiered)}</span>
            <span>{show.status || "Unknown"}</span>
          </div>

          <p className="summary">
            {removeHtmlTags(show.summary) ||
              "No description is available for this show."}
          </p>

          <div className="genres">
            {(show.genres?.length ? show.genres : ["TV Show"]).map((genre) => (
              <span key={genre}>{genre}</span>
            ))}
          </div>

          <button className="primary-button" onClick={closeModal}>
            Close Details
          </button>
        </div>
      </section>
    </div>
  );
}

function App() {
  const [shows, setShows] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedShow, setSelectedShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const moviesSection = useRef(null);

  function goToMovies() {
    moviesSection.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      async function getShows() {
        setLoading(true);
        setError(false);

        try {
          const cleanQuery = query.trim();

          const url = cleanQuery
            ? `${API_URL}/search/shows?q=${encodeURIComponent(cleanQuery)}`
            : `${API_URL}/shows`;

          const response = await fetch(url);

          if (!response.ok) {
            throw new Error("Could not load shows");
          }

          const data = await response.json();

          if (cleanQuery) {
            setShows(data.slice(0, 10).map((item) => item.show));
          } else {
            setShows(data.slice(0, 10));
          }
        } catch {
          setError(true);
        } finally {
          setLoading(false);
        }
      }

      getShows();
    }, query ? 400 : 0);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <Navbar goToMovies={goToMovies} />

      <main>
        <Hero goToMovies={goToMovies} />

        <section className="movies-section" id="movies" ref={moviesSection}>
          <div className="section-heading">
            <div>
              <p className="small-title">CURATED FOR YOU</p>
              <h2>
                Explore the <em>unmissable.</em>
              </h2>
            </div>

            <p>Find a story worth getting lost in.</p>
          </div>

          <SearchBar value={query} onChange={setQuery} />

          {loading && <p className="message">Loading movies...</p>}

          {!loading && error && (
            <p className="message">
              Could not load movies. Please check your internet connection.
            </p>
          )}

          {!loading && !error && shows.length === 0 && (
            <p className="message">No movies found. Try another title.</p>
          )}

          {!loading && !error && shows.length > 0 && (
            <div className="movie-grid">
              {shows.map((show) => (
                <MovieCard
                  key={show.id}
                  show={show}
                  openModal={setSelectedShow}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        <strong>▶ MovieExplorer</strong>
        <p>© 2026 MovieExplorer. All rights reserved.</p>
      </footer>

      {selectedShow && (
        <DetailsModal
          show={selectedShow}
          closeModal={() => setSelectedShow(null)}
        />
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);