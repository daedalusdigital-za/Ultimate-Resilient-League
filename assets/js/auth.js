// ===== URL Auth System (localStorage-based) =====

const URLAuth = {
    // Storage keys
    USERS_KEY: 'url_registered_users',
    SESSION_KEY: 'url_current_user',

    // Get all registered users
    getUsers() {
        const data = localStorage.getItem(this.USERS_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Save users array
    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },

    // Register a new user
    register(username, email, password) {
        const users = this.getUsers();

        // Check if email already exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: 'An account with this email already exists.' };
        }

        // Check if username already exists
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, message: 'This username is already taken.' };
        }

        // Validate
        if (username.length < 3) {
            return { success: false, message: 'Username must be at least 3 characters.' };
        }
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters.' };
        }
        if (!this.isValidEmail(email)) {
            return { success: false, message: 'Please enter a valid email address.' };
        }

        // Create user
        const user = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: btoa(password), // Basic encoding (not secure - demo only)
            avatar: username.charAt(0).toUpperCase(),
            joinedDate: new Date().toISOString(),
            urlBalance: 0 // Balance starts at 0; 10% discount on first purchase
        };

        users.push(user);
        this.saveUsers(users);

        // Auto-login after registration
        this.setSession(user);

        return { success: true, message: 'Account created successfully!', user };
    },

    // Login
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email.trim().toLowerCase());

        if (!user) {
            return { success: false, message: 'No account found with this email.' };
        }

        if (atob(user.password) !== password) {
            return { success: false, message: 'Incorrect password.' };
        }

        this.setSession(user);
        return { success: true, message: 'Login successful!', user };
    },

    // Logout
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    },

    // Set session
    setSession(user) {
        const sessionData = {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            urlBalance: user.urlBalance
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    },

    // Get current user
    getCurrentUser() {
        const data = localStorage.getItem(this.SESSION_KEY);
        return data ? JSON.parse(data) : null;
    },

    // Check if logged in
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    // Email validation
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
};

// ===== Update side menu UI based on auth state =====
document.addEventListener('DOMContentLoaded', function () {
    const user = URLAuth.getCurrentUser();

    // ===== Mobile offcanvas auth (bottom of sidebar) =====
    const mobileAuthContainers = document.querySelectorAll('.url-mobile-auth');

    mobileAuthContainers.forEach(container => {
        if (user) {
            container.innerHTML = `
                <div class="url-coin-container">
                    <img src="assets/img/coin.png" alt="URL Coin" class="url-coin-spin">
                </div>
                <div class="url-mobile-user-info">
                    <span class="url-mobile-user-avatar">${user.avatar}</span>
                    <div class="url-mobile-user-details">
                        <strong>${user.username}</strong>
                        <small>${user.email}</small>
                    </div>
                </div>
                <div class="url-mobile-balance">
                    <i class="fa-solid fa-coins"></i>
                    <span>${user.urlBalance} URL</span>
                </div>
                <button class="url-mobile-logout-btn" type="button">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            `;

            container.querySelector('.url-mobile-logout-btn').addEventListener('click', () => {
                URLAuth.logout();
                window.location.reload();
            });
        } else {
            container.innerHTML = `
                <div class="url-coin-container">
                    <img src="assets/img/coin.png" alt="URL Coin" class="url-coin-spin">
                </div>
                <a href="login.html" class="url-mobile-auth-link url-mobile-login-link">
                    <i class="fa-solid fa-right-to-bracket"></i> Login
                </a>
                <a href="register.html" class="url-mobile-auth-link url-mobile-register-link">
                    <i class="fa-solid fa-user-plus"></i> Sign Up
                </a>
            `;
        }
    });

    // ===== Restart coin spin animation each time side menu opens =====
    const sidebarToggle = document.querySelector('.sidebar__toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            document.querySelectorAll('.url-coin-spin').forEach(coin => {
                coin.style.animation = 'none';
                // Force reflow to restart the animation
                void coin.offsetWidth;
                coin.style.animation = '';
            });
        });
    }

    // ===== Shake & glow coin on click, then navigate to whitepaper =====
    document.querySelectorAll('.url-coin-spin').forEach(coin => {
        coin.addEventListener('click', function () {
            coin.classList.remove('coin-shake');
            void coin.offsetWidth;
            coin.classList.add('coin-shake');
            coin.addEventListener('animationend', function handler() {
                coin.classList.remove('coin-shake');
                coin.removeEventListener('animationend', handler);
                window.location.href = 'white-paper.html';
            });
        });
    });
});
