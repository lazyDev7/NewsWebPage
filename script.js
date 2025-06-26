const API_KEY = "8f560964f63b4ed5a1a8cc04b0cea9af"; 
const url = `https://newsapi.org/v2/top-headlines?country=in&pageSize=50&apiKey=${API_KEY}`;

async function fetchTopHeadlines() {
  let url = `https://newsapi.org/v2/top-headlines?country=in&apiKey=${API_KEY}`;
  let res = await fetch(url);
  let data = await res.json();
   if (data.articles.length === 0) {
    url = `https://newsapi.org/v2/top-headlines?language=en&apiKey=${API_KEY}`;
  }

  fetchAndRender(url);
}


window.addEventListener("load", () => {
  fetchTopHeadlines();
});


async function fetchAndRender(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Fetching from:", url);
    console.log("Response:", data); // 

    if (data.status === "ok" && data.articles.length > 0) {
      bindData(data.articles);
    } else {
      document.getElementById("cards-container").innerHTML =
        "<p style='padding:1rem;'>No news articles found.</p>";
    }
  } catch (error) {
    console.error("Fetch error:", error);
    document.getElementById("cards-container").innerHTML =
      "<p style='padding:1rem; color:red;'>Error loading news.</p>";
  }
}

function bindData(articles) {
  const cardsContainer = document.getElementById("cards-container");
  const newsCardTemplate = document.getElementById("template-news-card");

  cardsContainer.innerHTML = "";

  articles.forEach((article) => {
    if (!article.urlToImage) return;
    const cardClone = newsCardTemplate.content.cloneNode(true);
    fillDataInCard(cardClone, article);
    cardsContainer.appendChild(cardClone);
  });

  // Call after cards are added
  observeCards();
}

// Observe cards when added to DOM (for animation)
function observeCards() {
  const cards = document.querySelectorAll(".card");

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate");
        observer.unobserve(entry.target); // Animate only once
      }
    });
  }, {
    threshold: 0.2,
  });

  cards.forEach((card) => {
    requestAnimationFrame(() => {
      observer.observe(card);
    });
  });
}

// Fill the data into each news card
function fillDataInCard(cardClone, article) {
  const newsImg = cardClone.querySelector("#news-img");
  const newsTitle = cardClone.querySelector("#news-title");
  const newsSource = cardClone.querySelector("#news-source");
  const newsDesc = cardClone.querySelector("#news-desc");

  newsImg.src = article.urlToImage;
  newsTitle.innerHTML = article.title;
  newsDesc.innerHTML = article.description;

  const date = new Date(article.publishedAt).toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
  });

  newsSource.innerHTML = `${article.source.name} · ${date}`;

  cardClone.firstElementChild.addEventListener("click", () => {
    window.open(article.url, "_blank");
  });
}

let curSelectedNav = null;

function onNavItemClick(element) {
  const query = element.getAttribute("data-query");

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&apiKey=${API_KEY}`;
  fetchAndRender(url);

  // Update active class
  curSelectedNav?.classList.remove("active");
  curSelectedNav = element;
  curSelectedNav.classList.add("active");
}


// Basic search functionality
const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");

searchButton.addEventListener("click", async () => {
  const query = searchText.value.trim();
  if (!query) return;

  const username = localStorage.getItem("username");

  // Send search history to backend if user is logged in
  if (username) {
    try {
      await fetch("http://localhost:3000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, query })
      });
    } catch (err) {
      console.error("Failed to save search history:", err);
    }
  }

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&apiKey=${API_KEY}`;
  fetchAndRender(url);
});


const toggleButton = document.getElementById("theme-toggle");

// On page load
window.addEventListener("load", () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    toggleButton.innerText = "☀️ Light Mode";
  }

  fetchTopHeadlines();
});

// Save toggle choice
toggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  toggleButton.innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

