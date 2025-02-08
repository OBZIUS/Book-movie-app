const TMDB_API_KEY = "5567774a8abfa421b702a552d6e7c671";
const TMDB_API_URL = "https://api.themoviedb.org/3/";
const MOVIE_STORAGE_KEY = "favorite_movies";

// When the page loads, initialize trending movies, favorites, and the selected theme.
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Movie Search App Loaded");
  loadTrendingMovies();
  loadFavorites();
  loadTheme();
});
/* 
This event listener waits until the entire page is loaded, then it calls:
 - loadTrendingMovies() to display the top trending movies.
 - loadFavorites() to load your saved watchlist.
 - loadTheme() to apply your saved dark/light mode preference.
*/

// ----------------------------------------
// Fetch movies based on the user's search query,
// then scroll smoothly to the Search Results section.
// ----------------------------------------
function fetchMovies() {
  const query = document.getElementById("movie-search").value.trim();
  if (!query) return alert("❌ Enter a movie title.");

  fetch(`${TMDB_API_URL}search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      displayMovies(data.results, "movie-container");
      document.getElementById("movie-container").scrollIntoView({ behavior: "smooth" });
    })
    .catch(error => console.error("Error fetching movies:", error));
}
/*
This function retrieves the text entered by the user in the search box.
If a movie title is provided, it sends a request to TMDb's search API.
Once results are returned, it displays them in the search results section and scrolls smoothly to that section.
*/

// ----------------------------------------
// Load trending movies (top 10 for the week)
// ----------------------------------------
function loadTrendingMovies() {
  fetch(`${TMDB_API_URL}trending/movie/week?api_key=${TMDB_API_KEY}`)
    .then(res => res.json())
    .then(data => displayMovies(data.results.slice(0, 10), "trending-container"))
    .catch(error => console.error("Error fetching trending movies:", error));
}
/*
This function fetches the weekly trending movies from TMDb.
It limits the results to the top 10 movies and displays them in the "trending-container" section.
*/

// ----------------------------------------
// Display an array of movies in the specified container.
// Each movie card shows the poster, title with release year,
// a "Let's Binge" button to view details, and a "Save" button for favorites.
// ----------------------------------------
function displayMovies(movies, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  movies.forEach(movie => {
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";
    const posterUrl = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : "assets/images/placeholder.jpg";
    const isFavorite = checkIfFavorite(movie.id);

    const div = document.createElement("div");
    div.classList.add("movie-card");
    div.innerHTML = `
      <img src="${posterUrl}" alt="${movie.title}">
      <h3>${movie.title} (${releaseYear})</h3>
      <button class="binge-btn" data-movie-id="${movie.id}">🍿 Let's Binge</button>
      <button class="favorite-btn ${isFavorite ? 'saved' : ''}" data-movie-id="${movie.id}">
        ${isFavorite ? '❤️ Saved' : '🤍 Save'}
      </button>
    `;
    container.appendChild(div);
  });

  // Attach event listeners for the "Let's Binge" buttons.
  document.querySelectorAll(".binge-btn").forEach(button => {
    button.addEventListener("click", function () {
      const movieId = this.getAttribute("data-movie-id");
      fetchMovieDetails(movieId);
    });
  });

  // Attach event listeners for the "Favorite" buttons.
  document.querySelectorAll(".favorite-btn").forEach(button => {
    button.addEventListener("click", function () {
      toggleFavorite(this.getAttribute("data-movie-id"), this);
    });
  });
}
/*
This function takes an array of movie objects and a container ID (like "movie-container", "trending-container", or "favorites-container").
It clears the container and creates a card for each movie, displaying its poster, title, and buttons for details ("Let's Binge") and saving to the watchlist.
Then, it attaches click event listeners to those buttons.
*/

// ----------------------------------------
// Check if a movie is in the favorites (watchlist)
// ----------------------------------------
function checkIfFavorite(movieId) {
  const favorites = JSON.parse(localStorage.getItem(MOVIE_STORAGE_KEY)) || [];
  return favorites.includes(movieId.toString());
}
/*
This function checks localStorage to see if the given movie ID exists in the favorites list.
It returns true if the movie is saved, false otherwise.
*/

// ----------------------------------------
// Toggle a movie's favorite status in local storage and update the UI
// ----------------------------------------
function toggleFavorite(movieId, button) {
  let favorites = JSON.parse(localStorage.getItem(MOVIE_STORAGE_KEY)) || [];
  movieId = movieId.toString();
  if (favorites.includes(movieId)) {
    favorites = favorites.filter(id => id !== movieId);
    button.innerHTML = "🤍 Save";
    button.classList.remove("saved");
  } else {
    favorites.push(movieId);
    button.innerHTML = "❤️ Saved";
    button.classList.add("saved");
  }
  localStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(favorites));
  loadFavorites();
}
/*
This function adds or removes a movie (by its ID) from the favorites list in localStorage.
It also updates the button's appearance and text accordingly, then reloads the favorites section.
*/

// ----------------------------------------
// Load favorite movies from local storage and display them
// ----------------------------------------
function loadFavorites() {
  const favorites = JSON.parse(localStorage.getItem(MOVIE_STORAGE_KEY)) || [];
  if (favorites.length === 0) {
    document.getElementById("favorites-container").innerHTML = "<p>No saved movies yet!</p>";
    return;
  }
  Promise.all(
    favorites.map(id => 
      fetch(`${TMDB_API_URL}movie/${id}?api_key=${TMDB_API_KEY}`).then(res => res.json())
    )
  )
    .then(movies => displayMovies(movies, "favorites-container"))
    .catch(error => console.error("Error loading favorites:", error));
}
/*
This function retrieves the list of favorite movie IDs from localStorage,
fetches each movie's details from the TMDb API, and displays them in the Favorites section.
*/

// ----------------------------------------
// Fetch movie details, including credits and videos, and display them in a modal.
// Also adds a "Watch Trailer" button if a YouTube trailer is available.
// ----------------------------------------
function fetchMovieDetails(movieId) {
  Promise.all([
    fetch(`${TMDB_API_URL}movie/${movieId}?api_key=${TMDB_API_KEY}`).then(res => res.json()),
    fetch(`${TMDB_API_URL}movie/${movieId}/credits?api_key=${TMDB_API_KEY}`).then(res => res.json()),
    fetch(`${TMDB_API_URL}movie/${movieId}/videos?api_key=${TMDB_API_KEY}`).then(res => res.json())
  ])
  .then(([movie, credits, videos]) => {
    if (!movie || !credits) {
      alert("❌ Movie details not found.");
      return;
    }
    const director = credits.crew.find(person => person.job === "Director")?.name || "Unknown";
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";
    const genres = movie.genres ? movie.genres.map(g => g.name).join(", ") : "N/A";
    const posterUrl = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "assets/images/placeholder.jpg";

    // Get YouTube trailer (if available)
    const trailer = videos.results.find(video => video.site === "YouTube" && video.type === "Trailer");
    const trailerEmbed = trailer
      ? `<button class="trailer-btn" onclick="playTrailer('${trailer.key}')">🎥 Watch Trailer</button>`
      : `<p>🎥 No trailer available.</p>`;

    document.getElementById("modal-details").innerHTML = `
      <img src="${posterUrl}" alt="${movie.title}">
      <h2>${movie.title} (${releaseYear})</h2>
      <p><strong>🎭 Genre:</strong> ${genres}</p>
      <p><strong>🎬 Director:</strong> ${director}</p>
      <p><strong>📖 Plot:</strong> ${movie.overview}</p>
      ${trailerEmbed}
      <div class="trailer-container"></div>
    `;

    // Display the modal pop-up
    document.getElementById("movie-modal").style.display = "flex";
  })
  .catch(error => console.error("Error fetching movie details:", error));
}
/*
This function retrieves detailed information about a movie (including credits and videos) from TMDb.
It then populates a modal with the movie's poster, title, release year, genre, director, plot, and (if available) a "Watch Trailer" button.
Finally, it displays the modal.
*/

// ----------------------------------------
// Play the YouTube trailer by embedding an iframe into the modal
// ----------------------------------------
function playTrailer(videoKey) {
  const trailerContainer = document.querySelector(".trailer-container");
  trailerContainer.innerHTML = `
    <iframe width="100%" height="200" src="https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0" frameborder="0" allowfullscreen></iframe>
  `;
}
/*
This function embeds a YouTube video into the modal. When the "Watch Trailer" button is clicked, 
it replaces the content of the trailer container with an iframe that plays the trailer.
*/

// ----------------------------------------
// Close the movie details modal
// ----------------------------------------
function closeModal() {
  document.getElementById("movie-modal").style.display = "none";
}
/*
This function simply hides the modal, effectively closing the movie details pop-up.
*/

// ----------------------------------------
// Close the modal if the user clicks outside the modal content
// ----------------------------------------
window.onclick = function(event) {
  const modal = document.getElementById("movie-modal");
  if (event.target === modal) {
    closeModal();
  }
};
/*
This code checks if the user clicks outside the modal content area.
If so, it calls the closeModal() function to hide the modal.
*/

// ----------------------------------------
// Enable search on Enter key press in the search box
// ----------------------------------------
document.getElementById("movie-search").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    fetchMovies();
  }
});
/*
This event listener triggers the fetchMovies() function when the Enter key is pressed in the search input.
*/

// ----------------------------------------
// Toggle Dark/Light Mode and save the preference to local storage
// ----------------------------------------
function toggleTheme() {
  document.body.classList.toggle("light-mode");
  localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
}
/*
This function toggles the page's theme between dark and light modes.
It also saves the user's preference in local storage.
*/

// ----------------------------------------
// Load the theme based on stored preference from local storage
// ----------------------------------------
function loadTheme() {
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
  }
}
/*
This function checks local storage for a saved theme preference.
If the preference is "light", it applies the light mode class to the body.
*/

// ----------------------------------------
// Scroll smoothly to the Favorites/Watchlist section
// ----------------------------------------
function scrollToWatchlist() {
  document.getElementById("favorites-container").scrollIntoView({ behavior: "smooth" });
}
/*
This function scrolls the page smoothly to the "favorites-container" section,
allowing the user to quickly view their saved movies.
*/
