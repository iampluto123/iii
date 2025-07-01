import { db } from "./firebase-init.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let currentUser = null;
let isLoggedIn = false;
let currentAuthMode = "login";
let btcPrice = 0;

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  fetchBitcoinPrice();
  setInterval(fetchBitcoinPrice, 60000); // Update every minute

  // Mobile menu toggle
  document
    .getElementById("mobile-menu-btn")
    .addEventListener("click", toggleMobileMenu);

  // Contact form
  document
    .getElementById("contact-form")
    .addEventListener("submit", handleContactForm);

  // Auth form
  document.getElementById("auth-form").addEventListener("submit", handleAuth);
  document
    .getElementById("auth-switch")
    .addEventListener("click", switchAuthMode);
});

document.addEventListener("DOMContentLoaded", function () {
  fetchBitcoinPrice();
  setInterval(fetchBitcoinPrice, 60000);
  document
    .getElementById("mobile-menu-btn")
    .addEventListener("click", toggleMobileMenu);
  document
    .getElementById("contact-form")
    .addEventListener("submit", handleContactForm);
  document.getElementById("auth-form").addEventListener("submit", handleAuth);
  document
    .getElementById("auth-switch")
    .addEventListener("click", switchAuthMode);

  if (isLoggedIn) {
    showDashboard();
  }
});

// Bitcoin Price API
async function fetchBitcoinPrice() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
    );
    const data = await response.json();
    const price = data.bitcoin.usd;
    const change = data.bitcoin.usd_24h_change;
    btcPrice = price;

    document.getElementById("btc-price").textContent = price.toLocaleString();

    const changeElement = document.getElementById("price-change");
    const changeText = `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
    const changeColor = change > 0 ? "text-green-500" : "text-red-500";

    changeElement.textContent = `${changeText} (24h)`;
    changeElement.className = `text-lg ${changeColor}`;

    document.getElementById(
      "last-updated"
    ).textContent = `Last updated: ${new Date().toLocaleTimeString()}`;

    if (isLoggedIn) updatePortfolioValue();
  } catch (error) {
    console.error("Error fetching Bitcoin price:", error);
    document.getElementById("btc-price").textContent = "Price unavailable";
    document.getElementById("price-change").textContent = "Unable to load data";
  }
}

// Navigation functions
function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  mobileMenu.classList.toggle("hidden");
}

function closeMobileMenu() {
  document.getElementById("mobile-menu").classList.add("hidden");
}

function scrollToSection(sectionId) {
  document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });
}

// FAQ functions
function toggleFAQ(index) {
  const content = document.getElementById(`faq-content-${index}`);
  const icon = document.getElementById(`faq-icon-${index}`);
  content.classList.toggle("hidden");
  icon.classList.toggle("rotate-180");
}

// Auth functions
function showAuth(mode) {
  currentAuthMode = mode;
  const modal = document.getElementById("auth-modal");
  const title = document.getElementById("auth-title");
  const submitBtn = document.getElementById("auth-submit");
  const switchBtn = document.getElementById("auth-switch");
  const registerFields = document.getElementById("register-fields");

  if (mode === "login") {
    title.textContent = "Login";
    submitBtn.textContent = "Login";
    switchBtn.textContent = "Don't have an account? Sign up";
    registerFields.classList.add("hidden");
  } else {
    title.textContent = "Sign Up";
    submitBtn.textContent = "Create Account";
    switchBtn.textContent = "Already have an account? Login";
    registerFields.classList.remove("hidden");
  }

  modal.classList.remove("hidden");
}

function closeAuth() {
  document.getElementById("auth-modal").classList.add("hidden");
  document.getElementById("auth-form").reset();
}

function switchAuthMode() {
  const newMode = currentAuthMode === "login" ? "register" : "login";
  showAuth(newMode);
}

async function handleAuth(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const usersRef = collection(db, "users_new");

  if (currentAuthMode === "register") {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();

    try {
      // Check if user already exists
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return;
      }

      const newUser = {
        email,
        password,
        firstName,
        lastName,
        btcHoldings: 0.0,
        portfolioValue: 0.0,
      };

      await addDoc(usersRef, newUser);
      currentUser = newUser;
      isLoggedIn = true;

      updateAuthUI();
      closeAuth();
      updatePortfolioValue();
      showDashboard();
    } catch (error) {}
  } else {
    // Login mode
    try {
      const q = query(
        usersRef,
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return;
      }

      const userDoc = querySnapshot.docs[0].data();
      currentUser = userDoc;
      isLoggedIn = true;

      updateAuthUI();
      closeAuth();
      updatePortfolioValue();
      showDashboard();
    } catch (error) {
      console.error("Login error:", error);
    }
  }
}

function logout() {
  isLoggedIn = false;
  currentUser = null;

  // Reset UI
  updateAuthUI();
  showMainContent();

  // Show nav menu and main content
  document.getElementById("nav-menu").classList.remove("hidden");
  document.getElementById("auth-buttons").classList.remove("hidden");
  document.getElementById("user-menu").classList.add("hidden");
}

function updateAuthUI() {
  const authButtons = document.getElementById("auth-buttons");
  const userMenu = document.getElementById("user-menu");
  const userName = document.getElementById("user-name");

  if (isLoggedIn) {
    authButtons.classList.add("hidden");
    userMenu.classList.remove("hidden");
    if (currentUser) {
      userName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    }
  } else {
    authButtons.classList.remove("hidden");
    userMenu.classList.add("hidden");
  }
}

// Dashboard functions
function showDashboard() {
  if (!isLoggedIn) {
    showAuth("login");
    return;
  }

  document.getElementById("main-content").classList.add("hidden");

  const navMenu = document.getElementById("nav-menu");
  navMenu.classList.add("hidden");
  navMenu.classList.remove("md:flex");

  document.getElementById("auth-buttons").classList.add("hidden");
  document.getElementById("user-menu").classList.remove("hidden");
  document.getElementById("dashboard").classList.remove("hidden");

  // 🔒 Hide mobile menu button
  document.getElementById("mobile-menu-btn").classList.add("hidden");

  showDashboardSection("overview");
}

function showMainContent() {
  document.getElementById("main-content").classList.remove("hidden");

  const navMenu = document.getElementById("nav-menu");
  navMenu.classList.remove("hidden");
  navMenu.classList.add("md:flex");

  document.getElementById("auth-buttons").classList.remove("hidden");
  document.getElementById("user-menu").classList.add("hidden");
  document.getElementById("dashboard").classList.add("hidden");

  document.getElementById("mobile-menu-btn").classList.remove("hidden");
}

function showDashboardSection(section) {
  // Hide all sections
  document.getElementById("dashboard-overview").classList.add("hidden");
  document.getElementById("dashboard-deposit").classList.add("hidden");
  document.getElementById("dashboard-withdraw").classList.add("hidden");
  document.getElementById("dashboard-history").classList.add("hidden");

  // Show selected section
  document.getElementById(`dashboard-${section}`).classList.remove("hidden");

  // Update sidebar active state
  const sidebarButtons = document.querySelectorAll("#dashboard nav button");
  sidebarButtons.forEach((btn) => {
    btn.classList.remove("bg-yellow-500", "text-black", "font-medium");
    btn.classList.add("hover:bg-gray-700");
  });

  // Set active button
  event.target.classList.add("bg-yellow-500", "text-black", "font-medium");
  event.target.classList.remove("hover:bg-gray-700");
}

function toggleDashboardDropdown() {
  const dropdown = document.getElementById("dashboard-dropdown");
  const icon = document.getElementById("dashboard-toggle-icon");

  dropdown.classList.toggle("hidden");

  if (dropdown.classList.contains("hidden")) {
    icon.classList.remove("fa-times");
    icon.classList.add("fa-bars");
  } else {
    icon.classList.remove("fa-bars");
    icon.classList.add("fa-times");
  }
}

function updatePortfolioValue() {
  if (currentUser && btcPrice > 0) {
    const portfolioValue = currentUser.btcHoldings * btcPrice;
    document.getElementById("portfolio-value").textContent = 0.0;
  }
}

function copyAddress() {
  const addressInput = document.getElementById("btc-address");
  addressInput.select();
  addressInput.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(addressInput.value).then(() => {
    // Show feedback
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.add("bg-green-500");
    button.classList.remove("bg-yellow-500");

    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove("bg-green-500");
      button.classList.add("bg-yellow-500");
    }, 2000);
  });
}

// Contact form
function handleContactForm(e) {
  e.preventDefault();
  e.target.reset();
}

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Navbar scroll effect
window.addEventListener("scroll", function () {
  const navbar = document.getElementById("navbar");
  if (window.scrollY > 100) {
    navbar.classList.add("bg-gray-900");
    navbar.classList.remove("bg-gray-900/95");
  } else {
    navbar.classList.remove("bg-gray-900");
    navbar.classList.add("bg-gray-900/95");
  }
});
window.showAuth = showAuth;
window.switchAuthMode = switchAuthMode;
window.handleAuth = handleAuth;
window.logout = logout;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.scrollToSection = scrollToSection;
window.toggleFAQ = toggleFAQ;
window.copyAddress = copyAddress;
window.toggleDashboardDropdown = toggleDashboardDropdown;
window.showDashboardSection = showDashboardSection;
