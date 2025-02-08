const API_KEY = "AIzaSyCOnsVkFST0kOXymxwqeoSCUA6utA3SD4I";
const API_URL = "https://www.googleapis.com/books/v1/volumes?q=";

// Fetch Books on Search
function fetchBooks() {
  // Get the search query from the input field and trim whitespace
  const query = document.getElementById("search-book").value.trim();
  if (!query) {
    alert("Please enter a book title.");
    return;
  }
  
  // Show loading indicator while fetching results
  const container = document.getElementById("book-container");
  container.innerHTML = "<p>Loading...</p>";

  // Fetch data from the Google Books API using the query and API key
  fetch(`${API_URL}${encodeURIComponent(query)}&key=${API_KEY}`)
    .then(response => response.json())
    .then(data => displayBooks(data.items))
    .catch(error => {
      console.error("Error fetching books:", error);
      container.innerHTML = "<p>Error fetching books. Please try again.</p>";
    });
} // fetchBooks: Retrieves the search query, calls the API, and displays the fetched book data.

// Display Books in Grid
function displayBooks(books) {
  const container = document.getElementById("book-container");
  container.innerHTML = "";

  // If no books are returned, show a message
  if (!books || books.length === 0) {
    container.innerHTML = "<p>No books found.</p>";
    return;
  }

  // For each book in the results, create a book card with its details
  books.forEach(book => {
    const { title, authors, imageLinks, averageRating, ratingsCount, previewLink } = book.volumeInfo;
    const thumbnail = imageLinks?.thumbnail || "https://via.placeholder.com/128x200?text=No+Image";
    const authorList = authors ? authors.join(", ") : "Unknown";
    const ratingText = averageRating 
      ? `⭐ ${averageRating} (${ratingsCount || 0} reviews)` 
      : "No Ratings Available";

    // Create the card container element
    const div = document.createElement("div");
    div.classList.add("book-card");

    // Create and append the title element
    const titleEl = document.createElement("h3");
    titleEl.textContent = title;
    div.appendChild(titleEl);

    // Create and append the author element
    const authorEl = document.createElement("p");
    authorEl.innerHTML = `<strong>Author:</strong> ${authorList}`;
    div.appendChild(authorEl);

    // Create and append the image element
    const imgEl = document.createElement("img");
    imgEl.src = thumbnail;
    imgEl.alt = "Book Cover";
    div.appendChild(imgEl);

    // Create and append the rating element
    const ratingEl = document.createElement("p");
    ratingEl.classList.add("rating");
    ratingEl.textContent = ratingText;
    div.appendChild(ratingEl);

    // If available, create and append the Preview button
    if (previewLink) {
      const previewBtn = document.createElement("button");
      previewBtn.textContent = "Preview";
      previewBtn.classList.add("preview-button");
      previewBtn.addEventListener("click", function() {
        window.open(previewLink, '_blank');
      });
      div.appendChild(previewBtn);
    }

    // Create and append the Wishlist button
    const wishBtn = document.createElement("button");
    wishBtn.textContent = "Add to Wishlist";
    wishBtn.classList.add("wishlist-button");
    wishBtn.addEventListener("click", function() {
      addToWishlist(book);
    });
    div.appendChild(wishBtn);

    // Add a 3D tilt effect when the mouse moves over the card
    div.addEventListener('mousemove', handleCardMouseMove);
    div.addEventListener('mouseleave', handleCardMouseLeave);

    // Append the complete book card to the container
    container.appendChild(div);
  });
} // displayBooks: Renders each book as a card in the grid layout with details, preview, and wishlist options.

// 3D Tilt effect handler: Adjusts card tilt based on mouse position
function handleCardMouseMove(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateX = -((y - centerY) / centerY) * 10;
  const rotateY = ((x - centerX) / centerX) * 10;
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
} // handleCardMouseMove: Applies a 3D tilt effect to the card as the mouse moves over it.

// Reset the 3D tilt effect when the mouse leaves the card
function handleCardMouseLeave(e) {
  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
} // handleCardMouseLeave: Resets the 3D tilt effect when the mouse leaves the card.

// Add a book to the wishlist (using localStorage)
function addToWishlist(book) {
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  if (wishlist.find(item => item.id === book.id)) {
    alert("This book is already in your wishlist.");
    return;
  }
  wishlist.push(book);
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  alert("Book added to your wishlist!");
  displayWishlist();
} // addToWishlist: Adds a selected book to the localStorage wishlist and updates the wishlist display.

// Remove a book from the wishlist by its id
function removeFromWishlist(bookId) {
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  wishlist = wishlist.filter(item => item.id !== bookId);
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  alert("Book removed from your wishlist!");
  displayWishlist();
} // removeFromWishlist: Removes a book from the wishlist using its unique id and refreshes the display.

// Clear the entire wishlist
function clearWishlist() {
  if (confirm("Are you sure you want to clear the entire wishlist?")) {
    localStorage.setItem("wishlist", JSON.stringify([]));
    displayWishlist();
  }
} // clearWishlist: Clears all items from the wishlist after user confirmation and updates the display.

// Display the wishlist at the end of the page
function displayWishlist() {
  const wishlistContainer = document.getElementById("wishlist-books");
  wishlistContainer.innerHTML = "";
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  if (wishlist.length === 0) {
    wishlistContainer.innerHTML = "<p>Your wishlist is empty.</p>";
    return;
  }
  wishlist.forEach(book => {
    const { title, authors, imageLinks } = book.volumeInfo;
    const thumbnail = imageLinks?.thumbnail || "https://via.placeholder.com/128x200?text=No+Image";
    const authorList = authors ? authors.join(", ") : "Unknown";
    const div = document.createElement("div");
    div.classList.add("wishlist-card");
    div.innerHTML = `
      <h3>${title}</h3>
      <p><strong>Author:</strong> ${authorList}</p>
      <img src="${thumbnail}" alt="Book Cover">
      <button class="remove-btn" onclick="removeFromWishlist('${book.id}')">Remove</button>
    `;
    wishlistContainer.appendChild(div);
  });
} // displayWishlist: Renders the current wishlist from localStorage onto the page with remove buttons.

// Enable search when the Enter key is pressed in the search input
document.getElementById("search-book").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    fetchBooks();
  }
}); // Event listener: Triggers the fetchBooks() function when the Enter key is pressed in the search field.

// Toggle Dark/Light Mode and update the toggle button text/icon
document.getElementById("toggle-mode").addEventListener("click", function () {
  document.body.classList.toggle("light-mode");
  const toggleBtn = document.getElementById("toggle-mode");
  if (document.body.classList.contains("light-mode")) {
    toggleBtn.textContent = "☀️ Light Mode";
  } else {
    toggleBtn.textContent = "🌙 Dark Mode";
  }
}); // Toggle mode: Switches between light and dark themes and updates the button's text accordingly.

// Clear wishlist button event listener
document.getElementById("clear-wishlist").addEventListener("click", clearWishlist); // Event listener: Calls clearWishlist() when the clear button is clicked.

// Initialize the wishlist display on page load
document.addEventListener("DOMContentLoaded", function() {
  console.log("Book Library Loaded");
  displayWishlist();
}); // DOMContentLoaded: When the page finishes loading, logs a message and displays any wishlist items.
