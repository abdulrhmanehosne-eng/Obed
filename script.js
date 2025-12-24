// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOtGGiiG0B1L9C7UU7Ej2Lv72Lr5N7kVU",
    authDomain: "emperorofthevoid-afc85.firebaseapp.com",
    projectId: "emperorofthevoid-afc85",
    storageBucket: "emperorofthevoid-afc85.firebasestorage.app",
    messagingSenderId: "335893869858",
    appId: "1:335893869858:web:9c59a651828f20240ea17b",
    measurementId: "G-CFG1EF944F"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const analytics = firebase.analytics();

// Global Variables
let currentLanguage = "ar";
let currentTheme = "dark";
let activeTab = "about";
let gameState = null;
let ratings = [];
let isTyping = false;
let aiConversationHistory = [];
let userId = null;
let isAdmin = false;
let soundEnabled = true;
let visitorId = null;
let currentPlayer = null;

// DOM Elements
const elements = {
    clickSound: document.getElementById('clickSound'),
    gameSound: document.getElementById('gameSound'),
    successSound: document.getElementById('successSound'),
    errorSound: document.getElementById('errorSound')
};

// Toast Notification System
class Toast {
    static show(message, type = "info", duration = 4000) {
        // Remove existing toasts
        document.querySelectorAll(".toast").forEach(toast => {
            toast.style.animation = "slideInRight 0.3s ease reverse";
            setTimeout(() => toast.remove(), 300);
        });

        // Create new toast
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        
        const icon = type === "success" ? "fa-check-circle" :
                    type === "error" ? "fa-exclamation-circle" :
                    type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle";
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.style.animation = "slideInRight 0.3s ease reverse";
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        // Click to remove
        toast.addEventListener("click", () => {
            toast.style.animation = "slideInRight 0.3s ease reverse";
            setTimeout(() => toast.remove(), 300);
        });
    }
}

// Play Sound Function
function playSound(soundType) {
    if (!soundEnabled) return;
    
    const sound = elements[soundType];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Sound play failed:", e));
    }
}

// Initialize Settings
function loadSettings() {
    currentLanguage = localStorage.getItem("voidEmperorLanguage") || "ar";
    currentTheme = localStorage.getItem("voidEmperorTheme") || "dark";
    activeTab = localStorage.getItem("voidEmperorActiveTab") || "about";
    soundEnabled = localStorage.getItem("voidEmperorSound") !== "false";
    visitorId = localStorage.getItem("visitorId") || generateVisitorId();
    currentPlayer = JSON.parse(localStorage.getItem("currentPlayer"));
    
    applyLanguage();
    applyTheme();
    updateSoundToggle();
    trackVisitor();
}

function saveSettings() {
    localStorage.setItem("voidEmperorLanguage", currentLanguage);
    localStorage.setItem("voidEmperorTheme", currentTheme);
    localStorage.setItem("voidEmperorActiveTab", activeTab);
    localStorage.setItem("voidEmperorSound", soundEnabled);
    localStorage.setItem("visitorId", visitorId);
    if (currentPlayer) {
        localStorage.setItem("currentPlayer", JSON.stringify(currentPlayer));
    }
}

function generateVisitorId() {
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Language System
function initLanguageToggle() {
    const toggle = document.getElementById("languageToggle");
    if (toggle) {
        toggle.addEventListener("click", toggleLanguage);
    }
}

function toggleLanguage() {
    currentLanguage = currentLanguage === "ar" ? "en" : "ar";
    applyLanguage();
    saveSettings();
    playSound("clickSound");
    
    const message = currentLanguage === "ar" ? 
        "تم تغيير اللغة إلى العربية" : "Language changed to English";
    Toast.show(message, "info");
}

function applyLanguage() {
    // Set direction and lang attribute
    document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = currentLanguage;
    
    // Toggle language elements
    document.querySelectorAll("[lang]").forEach(element => {
        if (element.getAttribute("lang") === currentLanguage) {
            element.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
        }
    });
    
    // Update language toggle button text
    const toggle = document.getElementById("languageToggle");
    if (toggle) {
        const arText = toggle.querySelector('[lang="ar"]');
        const enText = toggle.querySelector('[lang="en"]');
        if (currentLanguage === "ar") {
            arText.textContent = "English";
            enText.textContent = "English";
        } else {
            arText.textContent = "العربية";
            enText.textContent = "العربية";
        }
    }
    
    // Load data with current language
    loadData();
    updatePlaceholders();
    updateGameLanguage();
    updateAIChatLanguage();
    updateCommentsLanguage();
    updateAdminLanguage();
}

function updatePlaceholders() {
    // Update all textarea placeholders
    const textareas = [
        { id: "ratingComment", placeholder: { ar: "اكتب تعليقك هنا...", en: "Write your comment here..." } },
        { id: "messageInput", placeholder: { ar: "اكتب سؤالك هنا...", en: "Type your question here..." } },
        { id: "aboutCommentInput", placeholder: { ar: "اكتب تعليقك هنا...", en: "Write your comment here..." } },
        { id: "adminPassword", placeholder: { ar: "كلمة المرور", en: "Password" } },
        { id: "playerNameInput", placeholder: { ar: "اسم اللاعب", en: "Player Name" } }
    ];
    
    textareas.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
            element.placeholder = item.placeholder[currentLanguage];
            if (item.id.includes("InputEn")) {
                element.classList.toggle("hidden", currentLanguage !== "en");
            } else if (!item.id.includes("En")) {
                element.classList.toggle("hidden", currentLanguage !== "ar");
            }
        }
        
        // Also update English version
        const enElement = document.getElementById(item.id + "En");
        if (enElement) {
            enElement.placeholder = item.placeholder.en;
            enElement.classList.toggle("hidden", currentLanguage !== "en");
        }
    });
}

// Theme System
function initDarkModeToggle() {
    const toggle = document.getElementById("darkModeToggle");
    if (toggle) {
        toggle.addEventListener("click", toggleTheme);
    }
}

function toggleTheme() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme();
    saveSettings();
    playSound("clickSound");
    
    const message = currentLanguage === "ar" ?
        currentTheme === "dark" ? "تم تفعيل الوضع الداكن" : "تم تفعيل الوضع الفاتح" :
        currentTheme === "dark" ? "Dark mode activated" : "Light mode activated";
    Toast.show(message, "info");
}

function applyTheme() {
    document.documentElement.setAttribute("data-theme", currentTheme);
    
    const toggle = document.getElementById("darkModeToggle");
    if (toggle) {
        const moon = toggle.querySelector(".fa-moon");
        const sun = toggle.querySelector(".fa-sun");
        if (currentTheme === "dark") {
            moon.classList.remove("hidden");
            sun.classList.add("hidden");
        } else {
            moon.classList.add("hidden");
            sun.classList.remove("hidden");
        }
    }
}

// Sound System
function initSoundToggle() {
    const toggle = document.getElementById("soundToggle");
    if (toggle) {
        toggle.addEventListener("click", toggleSound);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundToggle();
    saveSettings();
    playSound("clickSound");
    
    const message = currentLanguage === "ar" ?
        soundEnabled ? "تم تفعيل الصوت" : "تم إيقاف الصوت" :
        soundEnabled ? "Sound enabled" : "Sound muted";
    Toast.show(message, "info");
}

function updateSoundToggle() {
    const toggle = document.getElementById("soundToggle");
    if (toggle) {
        const volumeUp = toggle.querySelector(".fa-volume-up");
        const volumeMute = toggle.querySelector(".fa-volume-mute");
        if (soundEnabled) {
            volumeUp.classList.remove("hidden");
            volumeMute.classList.add("hidden");
        } else {
            volumeUp.classList.add("hidden");
            volumeMute.classList.remove("hidden");
        }
    }
}

// Tab System
function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            switchTab(btn.getAttribute("data-tab"));
        });
    });
    switchTab(activeTab);
}

function switchTab(tabId) {
    // Remove active class from all tabs
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
    
    // Add active class to selected tab
    const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const tabContent = document.getElementById(tabId);
    
    if (tabBtn && tabContent) {
        tabBtn.classList.add("active");
        tabContent.classList.add("active");
        activeTab = tabId;
        saveSettings();
        playSound("clickSound");
        
        // Load specific content for tab
        if (tabId === "ai") {
            loadConversationHistory();
        } else if (tabId === "games") {
            hideGameContainer();
        } else if (tabId === "ranking") {
            loadRankings();
        } else if (tabId === "blog") {
            loadBlogPosts();
        }
        
        // Load comments for tab
        loadCommentsForTab(tabId);
    }
}

// Background Animation
function initBackgroundAnimation() {
    const icons = document.querySelectorAll('.floating-icon');
    icons.forEach((icon, index) => {
        // Random starting position
        const startX = Math.random() * 80 + 10; // 10% to 90%
        const startY = Math.random() * 80 + 10;
        
        // Random animation duration
        const duration = 20 + Math.random() * 20; // 20-40 seconds
        
        // Apply initial position
        icon.style.left = `${startX}%`;
        icon.style.top = `${startY}%`;
        
        // Create floating animation
        icon.animate([
            { transform: 'translate(0, 0) rotate(0deg)' },
            { transform: `translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) rotate(${Math.random() * 360}deg)` },
            { transform: `translate(${Math.random() * 40 - 20}px, ${Math.random() * 40 - 20}px) rotate(${Math.random() * 360}deg)` },
            { transform: 'translate(0, 0) rotate(360deg)' }
        ], {
            duration: duration * 1000,
            iterations: Infinity,
            easing: 'ease-in-out'
        });
    });
}

// Firebase Data Management
async function trackVisitor() {
    try {
        // Check if already visited today
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('lastVisit');
        
        if (lastVisit !== today) {
            // Increment visitor count
            await db.collection('statistics').doc('visitors').update({
                count: firebase.firestore.FieldValue.increment(1),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Record visit
            await db.collection('visits').add({
                visitorId: visitorId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent,
                language: currentLanguage
            });
            
            localStorage.setItem('lastVisit', today);
        }
        
        // Update visitor count display
        updateStatistics();
    } catch (error) {
        console.error("Error tracking visitor:", error);
    }
}

async function updateStatistics() {
    try {
        const statsDoc = await db.collection('statistics').doc('visitors').get();
        if (statsDoc.exists) {
            const stats = statsDoc.data();
            document.getElementById('visitorCount').textContent = stats.count || 0;
            
            // إصلاح السطر 388
            const totalVisitorsElement = document.getElementById('totalVisitors');
            if (totalVisitorsElement) {
                totalVisitorsElement.textContent = stats.count || 0;
            }
        }
        
        // Update players count
        const playersSnapshot = await db.collection('players').get();
        document.getElementById('playersCount').textContent = playersSnapshot.size;
        
        const totalPlayersElement = document.getElementById('totalPlayers');
        if (totalPlayersElement) {
            totalPlayersElement.textContent = playersSnapshot.size;
        }
        
        // Update comments count
        const commentsSnapshot = await db.collection('comments').get();
        document.getElementById('commentsCount').textContent = commentsSnapshot.size;
        
        const totalCommentsElement = document.getElementById('totalComments');
        if (totalCommentsElement) {
            totalCommentsElement.textContent = commentsSnapshot.size;
        }
        
        // Update achievements count
        const achievementsSnapshot = await db.collection('achievements').get();
        document.getElementById('achievementsCount').textContent = achievementsSnapshot.size;
        
        const totalAchievementsElement = document.getElementById('totalAchievements');
        if (totalAchievementsElement) {
            totalAchievementsElement.textContent = achievementsSnapshot.size;
        }
    } catch (error) {
        console.error("Error updating statistics:", error);
    }
}

// Data Models
const DATA = {
    achievements: [],
    portfolio: [],
    blogPosts: [],
    contact: [
        {
            platform: { ar: "البريد الإلكتروني", en: "Email" },
            info: "abdulrhmanehosne@gmail.com",
            icon: "fas fa-envelope",
            link: "mailto:abdulrhmanehosne@gmail.com"
        },
        {
            platform: { ar: "تويتر", en: "Twitter" },
            info: "@Abd_AL_Rhmane_",
            icon: "fab fa-twitter",
            link: "https://twitter.com/Abd_Al_Rhmane_"
        },
        {
            platform: { ar: "تليجرام", en: "Telegram" },
            info: "@AbdAlRhmaneHosne",
            icon: "fab fa-telegram",
            link: "https://t.me/@AbdAlRhmaneHosne"
        }
    ],
    quizQuestions: [
        {
            question: { ar: "في أي عام تأسست مملكة الفراغ؟", en: "In which year was Void Kingdom established?" },
            answers: [
                { ar: "2024", en: "2024" },
                { ar: "2025", en: "2025" },
                { ar: "2026", en: "2026" },
                { ar: "2023", en: "2023" }
            ],
            correct: 1,
            explanation: { ar: "تأسست مملكة الفراغ في ديسمبر 2025", en: "Void Kingdom was established in December 2025" }
        },
        {
            question: { ar: "ما هو اللون الرسمي لإمبراطورية الفراغ؟", en: "What is the official color of Void Empire?" },
            answers: [
                { ar: "الأزرق الداكن", en: "Dark Blue" },
                { ar: "الأرجواني", en: "Purple" },
                { ar: "الأحمر القاني", en: "Crimson Red" },
                { ar: "الأخضر الزمردي", en: "Emerald Green" }
            ],
            correct: 1,
            explanation: { ar: "اللون الأرجواني هو اللون الرسمي للإمبراطورية", en: "Purple is the official color of the Empire" }
        },
        {
            question: { ar: "ما هو اسم إمبراطور الفراغ الحقيقي؟", en: "What is Void Emperor's real name?" },
            answers: [
                { ar: "أحمد محمد", en: "Ahmed Mohamed" },
                { ar: "عبدالرحمن حسني", en: "Abdul Rahman Hosni" },
                { ar: "محمد علي", en: "Mohamed Ali" },
                { ar: "خالد سعيد", en: "Khaled Saeed" }
            ],
            correct: 1,
            explanation: { ar: "اسم الإمبراطور الحقيقي هو عبدالرحمن حسني عبدالمنعم", en: "The Emperor's real name is Abdul Rahman Hosni Abdul Moneim" }
        }
    ],
    memoryIcons: ["fas fa-crown", "fas fa-star", "fas fa-moon", "fas fa-sun", "fas fa-gem", "fas fa-ring", "fas fa-shield", "fas fa-dragon"]
};

// Load Data from Firebase
async function loadData() {
    await loadAchievements();
    await loadPortfolio();
    await loadBlogPosts();
    loadContact();
    updateStatistics();
}

async function loadAchievements() {
    try {
        const snapshot = await db.collection('achievements')
            .orderBy('date', 'desc')
            .get();
        
        DATA.achievements = [];
        snapshot.forEach(doc => {
            DATA.achievements.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderAchievements();
    } catch (error) {
        console.error("Error loading achievements:", error);
    }
}

async function loadPortfolio() {
    try {
        const snapshot = await db.collection('portfolio')
            .orderBy('date', 'desc')
            .get();
        
        DATA.portfolio = [];
        snapshot.forEach(doc => {
            DATA.portfolio.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderPortfolio();
    } catch (error) {
        console.error("Error loading portfolio:", error);
    }
}

async function loadBlogPosts() {
    try {
        const snapshot = await db.collection('blogPosts')
            .orderBy('date', 'desc')
            .get();
        
        DATA.blogPosts = [];
        snapshot.forEach(doc => {
            DATA.blogPosts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderBlogPosts();
    } catch (error) {
        console.error("Error loading blog posts:", error);
    }
}

function renderAchievements() {
    const grid = document.getElementById("achievementsGrid");
    if (!grid) return;
    
    grid.innerHTML = DATA.achievements.map(achievement => `
        <div class="achievement-card" data-id="${achievement.id}">
            <div class="achievement-header">
                <div>
                    <h3 class="achievement-title">${achievement.title[currentLanguage] || achievement.title}</h3>
                    <div class="achievement-category">${achievement.category?.[currentLanguage] || achievement.category || "General"}</div>
                </div>
                <span class="achievement-date">${formatDate(achievement.date)}</span>
            </div>
            <p class="achievement-description">${achievement.description[currentLanguage] || achievement.description}</p>
            ${isAdmin ? `
                <div class="admin-actions">
                    <button class="btn-small btn-edit" onclick="editAchievement('${achievement.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-delete" onclick="deleteAchievement('${achievement.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderPortfolio() {
    const grid = document.getElementById("portfolioGrid");
    if (!grid) return;
    
    grid.innerHTML = DATA.portfolio.map(item => `
        <div class="portfolio-item" data-id="${item.id}">
            <img src="${item.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}" 
                 alt="${item.title[currentLanguage] || item.title}" 
                 class="portfolio-image" 
                 loading="lazy">
            <div class="portfolio-info">
                <h3 class="portfolio-title">${item.title[currentLanguage] || item.title}</h3>
                <p class="portfolio-description">${item.description[currentLanguage] || item.description}</p>
                <div class="portfolio-tags">
                    ${(item.tags || []).map(tag => 
                        `<span class="tag">${tag[currentLanguage] || tag}</span>`
                    ).join('')}
                </div>
                ${isAdmin ? `
                    <div class="admin-actions">
                        <button class="btn-small btn-edit" onclick="editPortfolioItem('${item.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-small btn-delete" onclick="deletePortfolioItem('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function renderBlogPosts() {
    const grid = document.getElementById("blogGrid");
    if (!grid) return;
    
    grid.innerHTML = DATA.blogPosts.map(post => `
        <div class="blog-post" data-id="${post.id}">
            <div class="blog-header">
                <h3 class="blog-title">${post.title[currentLanguage] || post.title}</h3>
                <span class="blog-date">${formatDate(post.date)}</span>
            </div>
            <div class="blog-content">
                <p>${(post.content[currentLanguage] || post.content).substring(0, 200)}...</p>
            </div>
            <div class="blog-footer">
                <div class="blog-stats">
                    <span class="blog-likes">
                        <i class="fas fa-heart"></i>
                        <span class="like-count">${post.likes || 0}</span>
                    </span>
                    <span class="blog-comments">
                        <i class="fas fa-comment"></i>
                        <span class="comment-count">${post.commentCount || 0}</span>
                    </span>
                </div>
                <button class="btn-small btn-read" onclick="readBlogPost('${post.id}')">
                    <i class="fas fa-book-open"></i>
                    <span lang="ar">قراءة</span>
                    <span class="hidden" lang="en">Read</span>
                </button>
                ${isAdmin ? `
                    <button class="btn-small btn-edit" onclick="editBlogPost('${post.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-delete" onclick="deleteBlogPost('${post.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function loadContact() {
    const grid = document.getElementById("contactGrid");
    if (!grid) return;
    
    grid.innerHTML = DATA.contact.map(contact => `
        <a href="${contact.link}" class="contact-card" target="_blank" rel="noopener noreferrer">
            <div class="contact-icon">
                <i class="${contact.icon}"></i>
            </div>
            <div class="contact-details">
                <div class="contact-platform">${contact.platform[currentLanguage] || contact.platform}</div>
                <div class="contact-info">${contact.info}</div>
            </div>
        </a>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
    return currentLanguage === "ar" 
        ? date.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
        : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Comments System
async function loadCommentsForTab(tabId) {
    try {
        const snapshot = await db.collection('comments')
            .where('tabId', '==', tabId)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        const comments = [];
        snapshot.forEach(doc => {
            comments.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderComments(tabId, comments);
    } catch (error) {
        console.error("Error loading comments:", error);
    }
}

function renderComments(tabId, comments) {
    const container = document.getElementById(`${tabId}Comments`);
    if (!container) return;
    
    if (comments.length === 0) {
        container.innerHTML = `
            <div class="no-comments">
                <i class="fas fa-comment-slash"></i>
                <p>${currentLanguage === "ar" ? "لا توجد تعليقات بعد" : "No comments yet"}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${comment.author || (currentLanguage === "ar" ? "زائر" : "Visitor")}</span>
                <span class="comment-date">${formatDate(comment.timestamp)}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-footer">
                <button class="btn-like" onclick="likeComment('${comment.id}')">
                    <i class="fas fa-heart"></i>
                    <span class="like-count">${comment.likes || 0}</span>
                </button>
                ${isAdmin ? `
                    <button class="btn-small btn-delete" onclick="deleteComment('${comment.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function submitComment(tabId, textareaId) {
    const textarea = document.getElementById(textareaId);
    const content = textarea.value.trim();
    
    if (!content) {
        Toast.show(currentLanguage === "ar" ? "يرجى كتابة تعليق" : "Please write a comment", "error");
        return;
    }
    
    if (content.length > 200) {
        Toast.show(currentLanguage === "ar" ? "التعليق طويل جداً (200 حرف كحد أقصى)" : "Comment too long (max 200 characters)", "error");
        return;
    }
    
    try {
        await db.collection('comments').add({
            tabId: tabId,
            content: content,
            author: currentPlayer?.name || (currentLanguage === "ar" ? "زائر" : "Visitor"),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            likes: 0,
            language: currentLanguage
        });
        
        textarea.value = "";
        updateCharCount(textareaId.replace('Input', 'CharCount'), 0);
        playSound("successSound");
        
        Toast.show(currentLanguage === "ar" ? "تم إرسال التعليق بنجاح" : "Comment submitted successfully", "success");
        loadCommentsForTab(tabId);
        updateStatistics();
    } catch (error) {
        console.error("Error submitting comment:", error);
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في إرسال التعليق" : "Error submitting comment", "error");
    }
}

function updateCharCount(counterId, length) {
    const counter = document.getElementById(counterId);
    if (counter) {
        counter.textContent = `${length}/200`;
    }
}

// Rating System
async function loadRatingsFromFirebase() {
    try {
        const snapshot = await db.collection('ratings')
            .orderBy('timestamp', 'desc')
            .get();
        
        ratings = [];
        snapshot.forEach(doc => {
            ratings.push({
                id: doc.id,
                ...doc.data(),
                date: doc.data().timestamp?.toDate() || new Date()
            });
        });
        
        updateRatingDisplay();
    } catch (error) {
        console.error("Error loading ratings:", error);
    }
}

async function submitRatingToFirebase(ratingData) {
    try {
        await db.collection('ratings').add({
            ...ratingData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userId: visitorId
        });
        return true;
    } catch (error) {
        console.error("Error submitting rating:", error);
        return false;
    }
}

function initRatingSystem() {
    // Star hover effect
    const stars = document.querySelectorAll(".rating-stars-input i");
    const selectedRating = document.getElementById("selectedRating");
    let currentRating = 0;
    
    stars.forEach(star => {
        star.addEventListener("mouseover", (e) => {
            highlightStars(parseInt(e.target.getAttribute("data-rating")));
        });
        
        star.addEventListener("click", (e) => {
            currentRating = parseInt(e.target.getAttribute("data-rating"));
            selectedRating.textContent = currentRating;
            highlightStars(currentRating);
        });
    });
    
    document.querySelector(".rating-stars-input").addEventListener("mouseleave", () => {
        highlightStars(currentRating);
    });
    
    // Submit button
    document.getElementById("submitRating").addEventListener("click", submitRating);
    
    // Character count for comment
    const commentField = document.getElementById("ratingComment");
    if (commentField) {
        commentField.addEventListener("input", function() {
            updateCharCount("ratingCharCount", this.value.length);
        });
    }
}

function highlightStars(rating) {
    document.querySelectorAll(".rating-stars-input i").forEach(star => {
        const starRating = parseInt(star.getAttribute("data-rating"));
        if (starRating <= rating) {
            star.classList.remove("far");
            star.classList.add("fas", "active");
        } else {
            star.classList.remove("fas", "active");
            star.classList.add("far");
        }
    });
}

async function submitRating() {
    const rating = parseInt(document.getElementById("selectedRating").textContent);
    const commentField = currentLanguage === "ar" ? 
        document.getElementById("ratingComment") : document.getElementById("ratingCommentEn");
    const comment = commentField.value.trim();
    
    if (rating === 0) {
        Toast.show(currentLanguage === "ar" ? "يرجى اختيار تقييم من 1 إلى 5 نجوم" : "Please select a rating from 1 to 5 stars", "error");
        return;
    }
    
    const ratingData = {
        rating: rating,
        comment: comment || (currentLanguage === "ar" ? "لا يوجد تعليق" : "No comment"),
        user: currentPlayer?.name || (currentLanguage === "ar" ? "زائر" : "Visitor"),
        language: currentLanguage
    };
    
    const success = await submitRatingToFirebase(ratingData);
    if (success) {
        commentField.value = "";
        document.getElementById("selectedRating").textContent = "0";
        highlightStars(0);
        await loadRatingsFromFirebase();
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "شكراً لتقييمك!" : "Thank you for your rating!", "success");
    } else {
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في إرسال التقييم" : "Error submitting rating", "error");
    }
}

function updateRatingDisplay() {
    const languageRatings = ratings.filter(r => r.language === currentLanguage);
    
    if (languageRatings.length > 0) {
        const average = (languageRatings.reduce((sum, r) => sum + r.rating, 0) / languageRatings.length).toFixed(1);
        document.getElementById("averageRating").textContent = average;
        
        const starsContainer = document.getElementById("starsContainer");
        const filledStars = Math.floor(average);
        const hasHalfStar = average % 1 >= 0.5;
        
        let starsHTML = "";
        for (let i = 0; i < filledStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = filledStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }
        
        starsContainer.innerHTML = starsHTML;
    } else {
        document.getElementById("averageRating").textContent = "0.0";
        document.getElementById("starsContainer").innerHTML = `
            <i class="far fa-star"></i>
            <i class="far fa-star"></i>
            <i class="far fa-star"></i>
            <i class="far fa-star"></i>
            <i class="far fa-star"></i>
        `;
    }
    
    const totalRatings = document.getElementById("totalRatings");
    if (totalRatings) {
        totalRatings.textContent = currentLanguage === "ar" 
            ? `(${languageRatings.length} تقييم${languageRatings.length > 1 ? "ات" : ""})`
            : `(${languageRatings.length} rating${languageRatings.length > 1 ? "s" : ""})`;
    }
    
    displayRecentRatings(languageRatings);
}

function displayRecentRatings(ratings) {
    const list = document.getElementById("ratingsList");
    if (!list) return;
    
    if (!ratings || ratings.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                <i class="fas fa-star" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>${currentLanguage === "ar" ? "لا توجد تقييمات بعد" : "No ratings yet"}</p>
            </div>
        `;
        return;
    }
    
    const recentRatings = ratings.slice(0, 5);
    list.innerHTML = recentRatings.map(rating => `
        <div class="rating-item">
            <div class="rating-header">
                <span class="rating-user">${rating.user || (currentLanguage === "ar" ? "زائر" : "Visitor")}</span>
                <span class="rating-date">${formatDate(rating.date)}</span>
            </div>
            <div style="color: var(--gold); margin-bottom: 10px;">
                ${"★".repeat(rating.rating)}${"☆".repeat(5 - rating.rating)}
            </div>
            <p class="rating-comment">${rating.comment}</p>
        </div>
    `).join("");
}

// AI Chat System
const AI_RESPONSES = {
    ar: {
        greeting: "مرحباً! أنا مساعد إمبراطور الفراغ الذكي. يمكنني الإجابة على أسئلتك حول المملكة، التقنية، البرمجة، المستقبل، وأي موضوع آخر. كيف يمكنني مساعدتك اليوم؟",
        personal: "أنا إمبراطور الفراغ، حاكم مملكة الفراغ الافتراضية. اسمي الحقيقي عبدالرحمن حسني عبدالمنعم، عمري 21 سنة. مؤسس هذه المملكة الرقمية المتميزة التي تدمج بين التقنية المتقدمة والإبداع البشري. بدأت رحلتي في ديسمبر 2025 بهدف إنشاء عالم رقمي متميز.",
        skills: "أمتلك مهارات متقدمة في: تطوير الويب الكامل (94%)، تطبيقات الهاتف (85%)، تصميم واجهات المستخدم (88%)، إدارة المشاريع التقنية (96%). أتقن لغات برمجة متعددة وأستخدم أحدث التقنيات.",
        projects: "أعمل على مشاريع متعددة: موقع المملكة الرسمي، نظام ذكاء اصطناعي متقدم، تطبيق جوال متكامل، منصة ألعاب تعليمية. كل مشروع يمثل تحدياً جديداً وفرصة للابتكار.",
        future: "خططي المستقبلية تشمل: توسعة المملكة رقمياً، تطوير أنظمة ذكاء اصطناعي أكثر تطوراً، إنشاء مجتمع افتراضي متكامل، إطلاق منصات تعليمية وتقنية جديدة، والمساهمة في تطور المجتمع التقني العالمي.",
        advice: {
            programming: "ابدأ بالأساسيات، تعلم جيداً قبل الانتقال للمواضيع المتقدمة، مارس يومياً، ابني مشاريع صغيرة ثم كبري حجمها، تعلم من الأخطاء، اقرأ الكود الجيد، وشارك في مجتمعات البرمجة.",
            success: "كن فضولياً، تعلم باستمرار، كن منضبطاً، طور مهارات التواصل، تعلم العمل الجماعي، حافظ على التوازن بين العمل والحياة، وكن مبدعاً في حل المشكلات.",
            general: "التقنية وسيلة لتحسين الحياة وليست غاية في حد ذاتها. النجاح الحقيقي يأتي من الإبداع والابتكار المستمر، مع الحفاظ على القيم الإنسانية الأساسية."
        },
        unknown: "هذا سؤال مثير للاهتمام! يمكنني مساعدتك في مواضيع أخرى مثل البرمجة، الذكاء الاصطناعي، نصائح تقنية، أو معلومات عن إمبراطور الفراغ ومشاريعه.",
        help: "يمكنني المساعدة في: 1) معلومات عن إمبراطور الفراغ 2) نصائح برمجية وتقنية 3) شرح مفاهيم الذكاء الاصطناعي 4) مشاريعي وإنجازاتي 5) نصائح للنجاح والقيادة 6) مناقشة أي موضوع تقني"
    },
    en: {
        greeting: "Hello! I am the Void Emperor AI Assistant. I can answer your questions about the Kingdom, technology, programming, future, and any other topic. How can I help you today?",
        personal: "I am the Void Emperor, ruler of the virtual Void Kingdom. My real name is Abdul Rahman Hosni Abdul Moneim, I am 21 years old. Founder of this distinguished digital kingdom that integrates advanced technology with human creativity. I started my journey in December 2025 with the goal of creating a distinguished digital world.",
        skills: "I have advanced skills in: Full Stack web development (94%), Mobile applications (85%), UI/UX Design (88%), Technical Project Management (96%). I master multiple programming languages and use the latest technologies.",
        projects: "I work on multiple projects: Official Kingdom website, advanced AI system, integrated mobile app, educational gaming platform. Each project represents a new challenge and opportunity for innovation.",
        future: "My future plans include: Digital expansion of the Kingdom, development of more advanced AI systems, creation of an integrated virtual community, launch of new educational and technological platforms, and contribution to the development of the global technical community.",
        advice: {
            programming: "Start with basics, learn well before moving to advanced topics, practice daily, build small projects then scale up, learn from mistakes, read good code, and participate in programming communities.",
            success: "Be curious, learn continuously, be disciplined, develop communication skills, learn teamwork, maintain work-life balance, and be creative in problem-solving.",
            general: "Technology is a means to improve life, not an end in itself. True success comes from continuous creativity and innovation, while maintaining basic human values."
        },
        unknown: "This is an interesting question! I can help you with other topics like programming, artificial intelligence, technical advice, or information about Void Emperor and his projects.",
        help: "I can help with: 1) Information about Void Emperor 2) Programming and technical tips 3) Explanation of AI concepts 4) My projects and achievements 5) Success and leadership tips 6) Discussion of any technical topic"
    }
};

async function initAIChat() {
    const sendBtn = document.getElementById("sendMessageBtn");
    const messageInput = document.getElementById("messageInput");
    const messageInputEn = document.getElementById("messageInputEn");
    const clearBtn = document.getElementById("clearChatBtn");
    
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    if (messageInput) {
        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    if (messageInputEn) {
        messageInputEn.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    if (clearBtn) clearBtn.addEventListener("click", clearChatHistory);
    
    // Quick action buttons
    document.querySelectorAll(".quick-action-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            sendQuickMessage(e.currentTarget.getAttribute("data-text"));
        });
    });
    
    // Load conversation history
    await loadConversationHistory();
    
    // Show greeting if no history
    if (aiConversationHistory.length === 0) {
        addMessageToChat(AI_RESPONSES[currentLanguage].greeting, false);
    }
}

async function sendMessage() {
    if (isTyping) return;
    
    const messageInput = currentLanguage === "ar" ? 
        document.getElementById("messageInput") : document.getElementById("messageInputEn");
    const sendBtn = document.getElementById("sendMessageBtn");
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    isTyping = true;
    messageInput.disabled = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${currentLanguage === "ar" ? "جاري الإرسال..." : "Sending..."}`;
    
    try {
        // Add user message
        addMessageToChat(message, true);
        
        // Save to Firebase
        await saveMessageToFirebase("user", message);
        messageInput.value = "";
        
        // Show typing indicator
        const typingIndicator = document.getElementById("typingIndicator");
        if (typingIndicator) typingIndicator.classList.remove("hidden");
        
        // Get AI response
        const aiResponse = await getAIResponse(message);
        
        // Hide typing indicator
        if (typingIndicator) typingIndicator.classList.add("hidden");
        
        // Add AI response
        if (aiResponse) {
            await typeMessage(aiResponse);
            await saveMessageToFirebase("assistant", aiResponse);
        }
        
        playSound("clickSound");
    } catch (error) {
        console.error("Error in sendMessage:", error);
        addMessageToChat(
            currentLanguage === "ar" ? "عذراً، حدث خطأ في الإرسال. حاول مرة أخرى." : "Sorry, an error occurred. Please try again.",
            false
        );
        playSound("errorSound");
    } finally {
        isTyping = false;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = `
            <i class="fas fa-paper-plane"></i>
            <span lang="ar">إرسال</span>
            <span class="hidden" lang="en">Send</span>
        `;
        messageInput.focus();
    }
}

async function getAIResponse(message) {
    // Simulate thinking
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    const lang = currentLanguage;
    const msg = message.toLowerCase().trim();
    
    // Check for specific questions
    if (msg.includes("أخبرني عن إمبراطور الفراغ") || msg.includes("who are you") || msg.includes("من أنت") || msg.includes("from")) {
        return AI_RESPONSES[lang].personal;
    } else if (msg.includes("مهارات") || msg.includes("skills")) {
        return AI_RESPONSES[lang].skills;
    } else if (msg.includes("مشاريع") || msg.includes("projects")) {
        return AI_RESPONSES[lang].projects;
    } else if (msg.includes("مستقبل") || msg.includes("future")) {
        return AI_RESPONSES[lang].future;
    } else if (msg.includes("مساعدة") || msg.includes("help")) {
        return AI_RESPONSES[lang].help;
    } else if (msg.includes("برمجة") || msg.includes("programming") || msg.includes("كود") || msg.includes("code")) {
        return AI_RESPONSES[lang].advice.programming;
    } else if (msg.includes("نجاح") || msg.includes("success") || msg.includes("نصيحة") || msg.includes("advice")) {
        return AI_RESPONSES[lang].advice.success;
    } else if (msg.includes("مرحبا") || msg.includes("hello") || msg.includes("اهلا") || msg.includes("hi")) {
        return AI_RESPONSES[lang].greeting;
    } else {
        return AI_RESPONSES[lang].unknown;
    }
}

async function typeMessage(message) {
    const container = document.getElementById("messagesContainer");
    const messageDiv = document.createElement("div");
    messageDiv.className = "message ai-message";
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    const senderDiv = document.createElement("div");
    senderDiv.className = "message-sender";
    senderDiv.innerHTML = `<i class="fas fa-robot"></i> <span>${currentLanguage === "ar" ? "مساعد الذكاء الاصطناعي" : "AI Assistant"}</span>`;
    
    const textDiv = document.createElement("div");
    textDiv.className = "message-text";
    
    const timeDiv = document.createElement("div");
    timeDiv.className = "message-time";
    timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    contentDiv.appendChild(senderDiv);
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeDiv);
    messageDiv.appendChild(contentDiv);
    container.appendChild(messageDiv);
    
    // Type effect
    let index = 0;
    function typeCharacter() {
        if (index < message.length) {
            textDiv.textContent += message.charAt(index);
            index++;
            setTimeout(typeCharacter, 20);
            container.scrollTop = container.scrollHeight;
        }
    }
    
    await new Promise(resolve => {
        typeCharacter();
        setTimeout(resolve, 20 * message.length + 100);
    });
}

function addMessageToChat(message, isUser) {
    const container = document.getElementById("messagesContainer");
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sender = isUser ? 
        (currentLanguage === "ar" ? "أنت" : "You") : 
        (currentLanguage === "ar" ? "مساعد الذكاء الاصطناعي" : "AI Assistant");
    
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isUser ? "user-message" : "ai-message"}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-sender">
                ${isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'}
                <span>${sender}</span>
            </div>
            <div class="message-text">${message}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function sendQuickMessage(text) {
    const messageInput = currentLanguage === "ar" ? 
        document.getElementById("messageInput") : document.getElementById("messageInputEn");
    messageInput.value = text;
    sendMessage();
}

async function saveMessageToFirebase(role, content) {
    try {
        await db.collection('aiConversations').add({
            userId: visitorId,
            role: role,
            content: content,
            language: currentLanguage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add to local history
        aiConversationHistory.push({ role, content, language: currentLanguage });
        return true;
    } catch (error) {
        console.error("Error saving message:", error);
        return false;
    }
}

async function loadConversationHistory() {
    try {
        const snapshot = await db.collection('aiConversations')
            .where('userId', '==', visitorId)
            .orderBy('timestamp', 'asc')
            .get();
        
        aiConversationHistory = [];
        snapshot.forEach(doc => {
            aiConversationHistory.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderConversationHistory();
    } catch (error) {
        console.error("Error loading conversation history:", error);
    }
}

function renderConversationHistory() {
    const container = document.getElementById("messagesContainer");
    if (!container) return;
    
    container.innerHTML = "";
    
    // Filter by current language
    const filteredHistory = aiConversationHistory.filter(msg => msg.language === currentLanguage);
    
    if (filteredHistory.length === 0) {
        addMessageToChat(AI_RESPONSES[currentLanguage].greeting, false);
        return;
    }
    
    filteredHistory.forEach(msg => {
        addMessageToChat(msg.content, msg.role === "user");
    });
}

async function clearChatHistory() {
    if (!confirm(currentLanguage === "ar" ? 
        "هل أنت متأكد من حذف سجل المحادثة؟ هذا الإجراء لا يمكن التراجع عنه." :
        "Are you sure you want to clear chat history? This action cannot be undone.")) {
        return;
    }
    
    try {
        // Delete from Firebase
        const snapshot = await db.collection('aiConversations')
            .where('userId', '==', visitorId)
            .get();
        
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        // Clear local history
        aiConversationHistory = [];
        document.getElementById("messagesContainer").innerHTML = "";
        
        // Add greeting
        addMessageToChat(AI_RESPONSES[currentLanguage].greeting, false);
        
        playSound("successSound");
        Toast.show(
            currentLanguage === "ar" ? "تم مسح سجل المحادثة بنجاح" : "Chat history cleared successfully",
            "success"
        );
    } catch (error) {
        console.error("Error clearing chat history:", error);
        playSound("errorSound");
        Toast.show(
            currentLanguage === "ar" ? "حدث خطأ في مسح المحادثة" : "Error clearing chat",
            "error"
        );
    }
}

function updateAIChatLanguage() {
    renderConversationHistory();
}

// Games System
function initGames() {
    // Game buttons
    document.querySelectorAll(".game-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const gameType = e.currentTarget.getAttribute("data-game");
            startGame(gameType);
        });
    });
    
    // Game instructions
    document.querySelectorAll(".game-card").forEach(card => {
        card.addEventListener("mouseenter", (e) => {
            const gameType = card.querySelector(".game-btn").getAttribute("data-game");
            showGameInstructions(gameType);
        });
    });
}

function showGameInstructions(gameType) {
    const instructions = {
        quiz: {
            ar: "اختبار معلومات عن إمبراطور الفراغ. اختر الإجابة الصحيحة لكل سؤال. كل إجابة صحيحة = 100 نقطة.",
            en: "Quiz about Void Emperor. Choose the correct answer for each question. Each correct answer = 100 points."
        },
        memory: {
            ar: "لعبة الذاكرة. اقلب البطاقات لتطابق الأيقونات المتشابهة. حاول إكمال اللعبة بأقل عدد من الحركات.",
            en: "Memory game. Flip cards to match similar icons. Try to complete the game with minimum moves."
        },
        typing: {
            ar: "اختبار سرعة الكتابة. اكتب الكلمات المعروضة بأقصى سرعة ودقة ممكنة.",
            en: "Typing speed test. Type the displayed words as fast and accurately as possible."
        },
        reaction: {
            ar: "اختبار سرعة رد الفعل. انقر على الهدف عند ظهوره. كلما كان رد فعلك أسرع، كانت نتيجتك أفضل.",
            en: "Reaction speed test. Click the target when it appears. The faster your reaction, the better your score."
        },
        snake: {
            ar: "لعبة الثعبان الكلاسيكية. استخدم مفاتيح الأسهم لتوجيه الثعبان لأكل الطعام. تجنب الاصطدام بالجدران أو الذيل.",
            en: "Classic snake game. Use arrow keys to guide the snake to eat food. Avoid hitting walls or tail."
        },
        spacewar: {
            ar: "حرب الفضاء. استخدم مفاتيح الأسهم للتحرك ومفتاح المسافة لإطلاق النار. دمر السفن الفضائية المعادية.",
            en: "Space war. Use arrow keys to move and spacebar to shoot. Destroy enemy spaceships."
        }
    };
    
    const text = document.getElementById("instructionsText");
    const textEn = document.getElementById("instructionsTextEn");
    
    if (text && textEn && instructions[gameType]) {
        text.textContent = instructions[gameType].ar;
        textEn.textContent = instructions[gameType].en;
    }
}

function startGame(gameType) {
    const gamesGrid = document.querySelector(".games-grid");
    const gameContainer = document.getElementById("gameContainer");
    const instructions = document.getElementById("gameInstructions");
    
    gamesGrid.classList.add("hidden");
    if (instructions) instructions.classList.add("hidden");
    gameContainer.classList.remove("hidden");
    
    gameState = { type: gameType };
    playSound("gameSound");
    
    switch (gameType) {
        case "quiz":
            startQuizGame();
            break;
        case "memory":
            startMemoryGame();
            break;
        case "typing":
            startTypingGame();
            break;
        case "reaction":
            startReactionGame();
            break;
        case "snake":
            startSnakeGame();
            break;
        case "spacewar":
            startSpaceWarGame();
            break;
    }
}

function startQuizGame() {
    gameState = {
        type: "quiz",
        currentQuestion: 0,
        score: 0,
        totalQuestions: DATA.quizQuestions.length,
        answers: [],
        startTime: Date.now()
    };
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <div class="game-header">
                <div class="game-stats">
                    <span id="quizScore">${currentLanguage === "ar" ? "النقاط:" : "Score:"} 0</span>
                    <span id="quizProgress">${currentLanguage === "ar" ? "السؤال:" : "Question:"} 1/${gameState.totalQuestions}</span>
                    <span id="quizTime">${currentLanguage === "ar" ? "الوقت:" : "Time:"} 0s</span>
                </div>
                <button class="back-btn" id="exitGameBtn">
                    <i class="fas fa-times"></i>
                    ${currentLanguage === "ar" ? "خروج" : "Exit"}
                </button>
            </div>
            
            <div class="quiz-container">
                <div class="question-container" id="questionContainer"></div>
                <div class="answers-grid" id="answersGrid"></div>
            </div>
        </div>
    `;
    
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
    showQuizQuestion();
    startQuizTimer();
}

function showQuizQuestion() {
    const question = DATA.quizQuestions[gameState.currentQuestion];
    const container = document.getElementById("questionContainer");
    const answersGrid = document.getElementById("answersGrid");
    
    if (!container || !answersGrid) return;
    
    container.innerHTML = `
        <h3 class="question-text">${question.question[currentLanguage]}</h3>
    `;
    
    answersGrid.innerHTML = question.answers.map((answer, index) => `
        <button class="answer-btn" data-answer="${index}">
            ${answer[currentLanguage]}
        </button>
    `).join("");
    
    document.querySelectorAll(".answer-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const selectedAnswer = parseInt(e.currentTarget.getAttribute("data-answer"));
            checkQuizAnswer(selectedAnswer, question.correct, question.explanation);
        });
    });
    
    updateQuizProgress();
}

function checkQuizAnswer(selected, correct, explanation) {
    const buttons = document.querySelectorAll(".answer-btn");
    buttons.forEach(btn => btn.disabled = true);
    
    gameState.answers.push({
        question: gameState.currentQuestion,
        selected: selected,
        correct: correct,
        isCorrect: selected === correct
    });
    
    // Highlight answers
    buttons.forEach((btn, index) => {
        if (index === correct) {
            btn.classList.add("correct");
            playSound("successSound");
        } else if (index === selected) {
            btn.classList.add("wrong");
            playSound("errorSound");
        }
    });
    
    // Update score if correct
    if (selected === correct) {
        gameState.score += 100;
    }
    
    // Show explanation
    const container = document.getElementById("questionContainer");
    const explanationDiv = document.createElement("div");
    explanationDiv.className = "explanation";
    explanationDiv.textContent = explanation[currentLanguage];
    container.appendChild(explanationDiv);
    
    // Move to next question or end game
    setTimeout(() => {
        gameState.currentQuestion++;
        if (gameState.currentQuestion < gameState.totalQuestions) {
            showQuizQuestion();
        } else {
            endQuizGame();
        }
    }, 2500);
}

function startQuizTimer() {
    if (gameState.timer) clearInterval(gameState.timer);
    
    gameState.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const timeElement = document.getElementById("quizTime");
        if (timeElement) {
            timeElement.textContent = `${currentLanguage === "ar" ? "الوقت:" : "Time:"} ${elapsed}s`;
        }
    }, 1000);
}

function updateQuizProgress() {
    const progress = document.getElementById("quizProgress");
    const score = document.getElementById("quizScore");
    
    if (progress) {
        progress.textContent = `${currentLanguage === "ar" ? "السؤال:" : "Question:"} ${gameState.currentQuestion + 1}/${gameState.totalQuestions}`;
    }
    if (score) {
        score.textContent = `${currentLanguage === "ar" ? "النقاط:" : "Score:"} ${gameState.score}`;
    }
}

async function endQuizGame() {
    if (gameState.timer) clearInterval(gameState.timer);
    
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const correctAnswers = gameState.answers.filter(a => a.isCorrect).length;
    const accuracy = Math.round((correctAnswers / gameState.totalQuestions) * 100);
    
    let rating = "";
    let message = "";
    
    if (accuracy >= 80) {
        rating = "★★★★★";
        message = currentLanguage === "ar" ? "ممتاز! أنت خبير في مملكة الفراغ." : "Excellent! You are an expert in Void Kingdom.";
    } else if (accuracy >= 60) {
        rating = "★★★★☆";
        message = currentLanguage === "ar" ? "جيد جداً! لديك معرفة جيدة." : "Very good! You have good knowledge.";
    } else if (accuracy >= 40) {
        rating = "★★★☆☆";
        message = currentLanguage === "ar" ? "ليس سيئاً! يمكنك تحسين معلوماتك." : "Not bad! You can improve your knowledge.";
    } else {
        rating = "★★☆☆☆";
        message = currentLanguage === "ar" ? "حاول مرة أخرى لتحسين نتيجتك." : "Try again to improve your score.";
    }
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <div class="quiz-result">
                <h3 style="color: var(--accent-light); margin-bottom: 30px; text-align: center;">
                    ${currentLanguage === "ar" ? "انتهى الاختبار!" : "Quiz Completed!"}
                </h3>
                
                <div style="text-align: center; margin-bottom: 30px;">
                    <div class="result-score">${gameState.score}</div>
                    <div style="color: var(--gold); font-size: 1.5rem; margin-bottom: 15px;">${rating}</div>
                    <p style="color: var(--text-secondary); margin-bottom: 10px;">
                        ${currentLanguage === "ar" ? "الدقة:" : "Accuracy:"} ${accuracy}%
                    </p>
                    <p style="color: var(--text-secondary); margin-bottom: 10px;">
                        ${currentLanguage === "ar" ? "الوقت:" : "Time:"} ${elapsed} ثانية
                    </p>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
                </div>
                
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <button class="btn" id="playAgainBtn" style="flex: 1; min-width: 150px;">
                        <i class="fas fa-redo"></i>
                        ${currentLanguage === "ar" ? "لعبة أخرى" : "Play Again"}
                    </button>
                    <button class="btn" id="saveScoreBtn" style="flex: 1; min-width: 150px;">
                        <i class="fas fa-save"></i>
                        ${currentLanguage === "ar" ? "حفظ النتيجة" : "Save Score"}
                    </button>
                    <button class="btn" id="exitGameBtn" style="flex: 1; min-width: 150px;">
                        <i class="fas fa-home"></i>
                        ${currentLanguage === "ar" ? "الرئيسية" : "Home"}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById("playAgainBtn").addEventListener("click", () => startGame("quiz"));
    document.getElementById("saveScoreBtn").addEventListener("click", () => saveGameScore("quiz", gameState.score));
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
}

// Memory Game
function startMemoryGame() {
    gameState = {
        type: "memory",
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        totalPairs: 8,
        startTime: Date.now()
    };
    
    // Create cards
    let cards = [];
    const icons = DATA.memoryIcons.slice(0, gameState.totalPairs);
    icons.forEach(icon => {
        cards.push({ icon, id: Math.random(), matched: false });
        cards.push({ icon, id: Math.random(), matched: false });
    });
    
    // Shuffle cards
    cards = cards.sort(() => Math.random() - 0.5);
    gameState.cards = cards;
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <div class="game-header">
                <div class="game-stats">
                    <span id="memoryMoves">${currentLanguage === "ar" ? "الحركات:" : "Moves:"} 0</span>
                    <span id="memoryPairs">${currentLanguage === "ar" ? "الأزواج:" : "Pairs:"} 0/${gameState.totalPairs}</span>
                    <span id="memoryTime">${currentLanguage === "ar" ? "الوقت:" : "Time:"} 0s</span>
                </div>
                <button class="back-btn" id="exitGameBtn">
                    <i class="fas fa-times"></i>
                    ${currentLanguage === "ar" ? "خروج" : "Exit"}
                </button>
            </div>
            
            <div class="memory-container">
                <div class="memory-grid" id="memoryGrid"></div>
            </div>
        </div>
    `;
    
    // Create cards grid
    const grid = document.getElementById("memoryGrid");
    grid.innerHTML = cards.map((card, index) => `
        <div class="memory-card" data-index="${index}">
            <div class="card-front">
                <i class="${card.icon}"></i>
            </div>
            <div class="card-back">
                <i class="fas fa-question"></i>
            </div>
        </div>
    `).join("");
    
    document.querySelectorAll(".memory-card").forEach(card => {
        card.addEventListener("click", handleCardClick);
    });
    
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
    startMemoryTimer();
}

function handleCardClick(e) {
    const card = e.currentTarget;
    const index = parseInt(card.getAttribute("data-index"));
    
    // Ignore if card is already flipped, matched, or two cards are already flipped
    if (card.classList.contains("flipped") || 
        card.classList.contains("matched") || 
        gameState.flippedCards.length >= 2) {
        return;
    }
    
    // Flip the card
    card.classList.add("flipped");
    gameState.flippedCards.push({ index, card });
    playSound("clickSound");
    
    // If two cards are flipped
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        updateMemoryStats();
        
        const card1 = gameState.flippedCards[0];
        const card2 = gameState.flippedCards[1];
        
        // Check if they match
        if (gameState.cards[card1.index].icon === gameState.cards[card2.index].icon) {
            // Match found
            setTimeout(() => {
                card1.card.classList.add("matched");
                card2.card.classList.add("matched");
                gameState.matchedPairs++;
                gameState.flippedCards = [];
                updateMemoryStats();
                playSound("successSound");
                
                // Check if game is complete
                if (gameState.matchedPairs === gameState.totalPairs) {
                    setTimeout(() => endMemoryGame(), 500);
                }
            }, 500);
        } else {
            // No match
            setTimeout(() => {
                card1.card.classList.remove("flipped");
                card2.card.classList.remove("flipped");
                gameState.flippedCards = [];
                playSound("errorSound");
            }, 1000);
        }
    }
}

function updateMemoryStats() {
    const moves = document.getElementById("memoryMoves");
    const pairs = document.getElementById("memoryPairs");
    
    if (moves) moves.textContent = `${currentLanguage === "ar" ? "الحركات:" : "Moves:"} ${gameState.moves}`;
    if (pairs) pairs.textContent = `${currentLanguage === "ar" ? "الأزواج:" : "Pairs:"} ${gameState.matchedPairs}/${gameState.totalPairs}`;
}

function startMemoryTimer() {
    if (gameState.timer) clearInterval(gameState.timer);
    
    gameState.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const timeElement = document.getElementById("memoryTime");
        if (timeElement) {
            timeElement.textContent = `${currentLanguage === "ar" ? "الوقت:" : "Time:"} ${elapsed}s`;
        }
    }, 1000);
}

async function endMemoryGame() {
    if (gameState.timer) clearInterval(gameState.timer);
    
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const efficiency = Math.round((gameState.totalPairs / gameState.moves) * 100) || 0;
    const score = gameState.matchedPairs * 100 - gameState.moves * 5;
    
    let rating = "";
    let message = "";
    
    if (gameState.moves <= 20) {
        rating = "★★★★★";
        message = currentLanguage === "ar" ? "ذاكرة استثنائية!" : "Exceptional memory!";
    } else if (gameState.moves <= 30) {
        rating = "★★★★☆";
        message = currentLanguage === "ar" ? "ذاكرة قوية!" : "Strong memory!";
    } else if (gameState.moves <= 40) {
        rating = "★★★☆☆";
        message = currentLanguage === "ar" ? "يمكنك التحسن بالممارسة." : "You can improve with practice.";
    } else {
        rating = "★★☆☆☆";
        message = currentLanguage === "ar" ? "استمر في التدريب." : "Keep practicing.";
    }
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <h3 style="color: var(--accent-light); margin-bottom: 30px; text-align: center;">
                ${currentLanguage === "ar" ? "تهانينا!" : "Congratulations!"}
            </h3>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <div class="result-score">${score}</div>
                <div style="color: var(--gold); font-size: 1.5rem; margin-bottom: 15px;">${rating}</div>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "أكملت اللعبة بـ" : "You completed with"} ${gameState.moves} ${currentLanguage === "ar" ? "حركة" : "moves"}
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "الوقت:" : "Time:"} ${elapsed} ثانية
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "الكفاءة:" : "Efficiency:"} ${efficiency}%
                </p>
                <p style="color: var(--text-secondary); font-weight: bold; margin-bottom: 10px;">${message}</p>
            </div>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="btn" id="playAgainBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-redo"></i>
                    ${currentLanguage === "ar" ? "لعبة أخرى" : "Play Again"}
                </button>
                <button class="btn" id="saveScoreBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-save"></i>
                    ${currentLanguage === "ar" ? "حفظ النتيجة" : "Save Score"}
                </button>
                <button class="btn" id="exitGameBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-home"></i>
                    ${currentLanguage === "ar" ? "الرئيسية" : "Home"}
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("playAgainBtn").addEventListener("click", () => startGame("memory"));
    document.getElementById("saveScoreBtn").addEventListener("click", () => saveGameScore("memory", score));
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
}

// Typing Game
function startTypingGame() {
    const words = currentLanguage === "ar" ? [
        "إمبراطور", "فراغ", "مملكة", "تقنية", "برمجة", "ذكاء", "اصطناعي", "مستقبل",
        "إبداع", "ابتكار", "تطوير", "ويب", "تطبيقات", "هاتف", "تصميم", "واجهة"
    ] : [
        "emperor", "void", "kingdom", "technology", "programming", "artificial", "intelligence", "future",
        "creativity", "innovation", "development", "web", "applications", "mobile", "design", "interface"
    ];
    
    gameState = {
        type: "typing",
        words: [...words].sort(() => Math.random() - 0.5).slice(0, 10),
        currentWord: 0,
        correctChars: 0,
        totalChars: 0,
        startTime: Date.now(),
        mistakes: 0
    };
    
    gameState.totalChars = gameState.words.join("").length;
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <div class="game-header">
                <div class="game-stats">
                    <span id="typingProgress">${currentLanguage === "ar" ? "الكلمة:" : "Word:"} 1/${gameState.words.length}</span>
                    <span id="typingAccuracy">${currentLanguage === "ar" ? "الدقة:" : "Accuracy:"} 100%</span>
                    <span id="typingSpeed">${currentLanguage === "ar" ? "السرعة:" : "Speed:"} 0</span>
                </div>
                <button class="back-btn" id="exitGameBtn">
                    <i class="fas fa-times"></i>
                    ${currentLanguage === "ar" ? "خروج" : "Exit"}
                </button>
            </div>
            
            <div class="typing-container" style="text-align: center;">
                <div class="word-display" id="wordDisplay" style="font-size: 2.5rem; margin: 40px 0; color: var(--accent-light); letter-spacing: 2px;">
                    ${gameState.words[0]}
                </div>
                <input type="text" id="typingInput" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                       style="font-size: 1.5rem; padding: 15px; width: 80%; text-align: center; background: rgba(255,255,255,0.1); border: 2px solid var(--border); border-radius: 10px; color: var(--text);">
                <div class="typing-instructions" style="margin-top: 20px; color: var(--text-secondary);">
                    ${currentLanguage === "ar" ? "اكتب الكلمة المعروضة ثم اضغط Enter" : "Type the word shown then press Enter"}
                </div>
            </div>
        </div>
    `;
    
    const input = document.getElementById("typingInput");
    input.focus();
    
    input.addEventListener("input", updateTypingDisplay);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            checkTypingWord();
        }
    });
    
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
    startTypingTimer();
}

function updateTypingDisplay() {
    const input = document.getElementById("typingInput");
    const wordDisplay = document.getElementById("wordDisplay");
    const currentWord = gameState.words[gameState.currentWord];
    const typed = input.value;
    
    let displayHTML = "";
    for (let i = 0; i < currentWord.length; i++) {
        if (i < typed.length) {
            if (typed[i] === currentWord[i]) {
                displayHTML += `<span style="color: var(--success);">${currentWord[i]}</span>`;
            } else {
                displayHTML += `<span style="color: var(--error);">${currentWord[i]}</span>`;
            }
        } else {
            displayHTML += currentWord[i];
        }
    }
    
    wordDisplay.innerHTML = displayHTML;
}

function checkTypingWord() {
    const input = document.getElementById("typingInput");
    const typed = input.value;
    const currentWord = gameState.words[gameState.currentWord];
    
    // Count correct characters
    for (let i = 0; i < Math.min(typed.length, currentWord.length); i++) {
        if (typed[i] === currentWord[i]) {
            gameState.correctChars++;
        } else {
            gameState.mistakes++;
        }
    }
    
    // Move to next word
    gameState.currentWord++;
    input.value = "";
    
    if (gameState.currentWord < gameState.words.length) {
        document.getElementById("wordDisplay").textContent = gameState.words[gameState.currentWord];
        updateTypingProgress();
    } else {
        endTypingGame();
    }
    
    input.focus();
}

function updateTypingProgress() {
    const progress = document.getElementById("typingProgress");
    const accuracy = document.getElementById("typingAccuracy");
    
    if (progress) {
        progress.textContent = `${currentLanguage === "ar" ? "الكلمة:" : "Word:"} ${gameState.currentWord + 1}/${gameState.words.length}`;
    }
    if (accuracy) {
        const acc = Math.round((gameState.correctChars / (gameState.correctChars + gameState.mistakes)) * 100) || 100;
        accuracy.textContent = `${currentLanguage === "ar" ? "الدقة:" : "Accuracy:"} ${acc}%`;
    }
}

function startTypingTimer() {
    if (gameState.timer) clearInterval(gameState.timer);
    
    gameState.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const speedElement = document.getElementById("typingSpeed");
        if (speedElement && elapsed > 0) {
            const wpm = Math.round((gameState.correctChars / 5) / (elapsed / 60));
            speedElement.textContent = `${currentLanguage === "ar" ? "السرعة:" : "Speed:"} ${wpm} ${currentLanguage === "ar" ? "كلمة/د" : "WPM"}`;
        }
    }, 1000);
}

async function endTypingGame() {
    if (gameState.timer) clearInterval(gameState.timer);
    
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const accuracy = Math.round((gameState.correctChars / gameState.totalChars) * 100);
    const wpm = Math.round((gameState.correctChars / 5) / (elapsed / 60)) || 0;
    const score = Math.round(wpm * accuracy / 10);
    
    let rating = "";
    let message = "";
    
    if (wpm >= 60) {
        rating = "★★★★★";
        message = currentLanguage === "ar" ? "سرعة كتابة مذهلة!" : "Amazing typing speed!";
    } else if (wpm >= 40) {
        rating = "★★★★☆";
        message = currentLanguage === "ar" ? "سرعة كتابة ممتازة!" : "Excellent typing speed!";
    } else if (wpm >= 20) {
        rating = "★★★☆☆";
        message = currentLanguage === "ar" ? "سرعة كتابة جيدة!" : "Good typing speed!";
    } else {
        rating = "★★☆☆☆";
        message = currentLanguage === "ar" ? "يمكنك التحسن بالممارسة." : "You can improve with practice.";
    }
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <h3 style="color: var(--accent-light); margin-bottom: 30px; text-align: center;">
                ${currentLanguage === "ar" ? "انتهى الاختبار!" : "Test Completed!"}
            </h3>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <div class="result-score">${score}</div>
                <div style="color: var(--gold); font-size: 1.5rem; margin-bottom: 15px;">${rating}</div>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "السرعة:" : "Speed:"} ${wpm} ${currentLanguage === "ar" ? "كلمة/دقيقة" : "WPM"}
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "الدقة:" : "Accuracy:"} ${accuracy}%
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "الوقت:" : "Time:"} ${elapsed} ثانية
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
            </div>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="btn" id="playAgainBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-redo"></i>
                    ${currentLanguage === "ar" ? "لعبة أخرى" : "Play Again"}
                </button>
                <button class="btn" id="saveScoreBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-save"></i>
                    ${currentLanguage === "ar" ? "حفظ النتيجة" : "Save Score"}
                </button>
                <button class="btn" id="exitGameBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-home"></i>
                    ${currentLanguage === "ar" ? "الرئيسية" : "Home"}
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("playAgainBtn").addEventListener("click", () => startGame("typing"));
    document.getElementById("saveScoreBtn").addEventListener("click", () => saveGameScore("typing", score));
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
}

// Reaction Game
function startReactionGame() {
    gameState = {
        type: "reaction",
        score: 0,
        reactionTimes: [],
        startTime: Date.now(),
        targetVisible: false,
        round: 0,
        maxRounds: 10
    };
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <div class="game-header">
                <div class="game-stats">
                    <span id="reactionScore">${currentLanguage === "ar" ? "النقاط:" : "Score:"} 0</span>
                    <span id="reactionRound">${currentLanguage === "ar" ? "الجولة:" : "Round:"} 1/${gameState.maxRounds}</span>
                    <span id="reactionTime">${currentLanguage === "ar" ? "متوسط رد الفعل:" : "Avg Reaction:"} 0ms</span>
                </div>
                <button class="back-btn" id="exitGameBtn">
                    <i class="fas fa-times"></i>
                    ${currentLanguage === "ar" ? "خروج" : "Exit"}
                </button>
            </div>
            
            <div class="reaction-container" style="text-align: center; padding: 50px;">
                <div id="reactionTarget" style="width: 150px; height: 150px; background: var(--accent); border-radius: 50%; margin: 0 auto; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; opacity: 0; transition: opacity 0.3s;">
                    ${currentLanguage === "ar" ? "انقر!" : "Click!"}
                </div>
                <div id="reactionMessage" style="margin-top: 30px; color: var(--text-secondary); font-size: 1.2rem;">
                    ${currentLanguage === "ar" ? "انتظر ظهور الهدف ثم انقر عليه بأسرع ما يمكن" : "Wait for target to appear then click as fast as possible"}
                </div>
            </div>
        </div>
    `;
    
    const target = document.getElementById("reactionTarget");
    target.addEventListener("click", handleReactionClick);
    
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
    startReactionRound();
}

function startReactionRound() {
    if (gameState.round >= gameState.maxRounds) {
        endReactionGame();
        return;
    }
    
    gameState.round++;
    gameState.targetVisible = false;
    
    const target = document.getElementById("reactionTarget");
    const message = document.getElementById("reactionMessage");
    
    target.style.opacity = "0";
    message.textContent = currentLanguage === "ar" ? "استعد..." : "Get ready...";
    
    // Random delay before showing target (1-3 seconds)
    const delay = 1000 + Math.random() * 2000;
    
    setTimeout(() => {
        gameState.targetVisible = true;
        gameState.roundStartTime = Date.now();
        target.style.opacity = "1";
        message.textContent = currentLanguage === "ar" ? "انقر الآن!" : "Click now!";
    }, delay);
    
    updateReactionStats();
}

function handleReactionClick() {
    if (!gameState.targetVisible) {
        playSound("errorSound");
        return;
    }
    
    const reactionTime = Date.now() - gameState.roundStartTime;
    gameState.reactionTimes.push(reactionTime);
    
    // Calculate score (faster = more points)
    let points = 0;
    if (reactionTime < 200) points = 100;
    else if (reactionTime < 300) points = 80;
    else if (reactionTime < 400) points = 60;
    else if (reactionTime < 500) points = 40;
    else points = 20;
    
    gameState.score += points;
    playSound("successSound");
    
    // Update message
    const message = document.getElementById("reactionMessage");
    message.textContent = `${currentLanguage === "ar" ? "رد فعلك:" : "Your reaction:"} ${reactionTime}ms (+${points})`;
    
    // Hide target
    gameState.targetVisible = false;
    document.getElementById("reactionTarget").style.opacity = "0";
    
    // Next round after delay
    setTimeout(startReactionRound, 1000);
}

function updateReactionStats() {
    const score = document.getElementById("reactionScore");
    const round = document.getElementById("reactionRound");
    const avgTime = document.getElementById("reactionTime");
    
    if (score) score.textContent = `${currentLanguage === "ar" ? "النقاط:" : "Score:"} ${gameState.score}`;
    if (round) round.textContent = `${currentLanguage === "ar" ? "الجولة:" : "Round:"} ${gameState.round}/${gameState.maxRounds}`;
    
    if (avgTime && gameState.reactionTimes.length > 0) {
        const avg = Math.round(gameState.reactionTimes.reduce((a, b) => a + b) / gameState.reactionTimes.length);
        avgTime.textContent = `${currentLanguage === "ar" ? "متوسط رد الفعل:" : "Avg Reaction:"} ${avg}ms`;
    }
}

async function endReactionGame() {
    const avgReaction = gameState.reactionTimes.length > 0 
        ? Math.round(gameState.reactionTimes.reduce((a, b) => a + b) / gameState.reactionTimes.length)
        : 0;
    
    let rating = "";
    let message = "";
    
    if (avgReaction < 250) {
        rating = "★★★★★";
        message = currentLanguage === "ar" ? "رد فعل سريع جداً!" : "Very fast reaction!";
    } else if (avgReaction < 350) {
        rating = "★★★★☆";
        message = currentLanguage === "ar" ? "رد فعل سريع!" : "Fast reaction!";
    } else if (avgReaction < 450) {
        rating = "★★★☆☆";
        message = currentLanguage === "ar" ? "رد فعل متوسط!" : "Average reaction!";
    } else {
        rating = "★★☆☆☆";
        message = currentLanguage === "ar" ? "يمكنك تحسين رد فعلك." : "You can improve your reaction.";
    }
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <h3 style="color: var(--accent-light); margin-bottom: 30px; text-align: center;">
                ${currentLanguage === "ar" ? "انتهت اللعبة!" : "Game Over!"}
            </h3>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <div class="result-score">${gameState.score}</div>
                <div style="color: var(--gold); font-size: 1.5rem; margin-bottom: 15px;">${rating}</div>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "متوسط رد الفعل:" : "Average Reaction:"} ${avgReaction}ms
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "أفضل رد فعل:" : "Best Reaction:"} ${Math.min(...gameState.reactionTimes)}ms
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
            </div>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="btn" id="playAgainBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-redo"></i>
                    ${currentLanguage === "ar" ? "لعبة أخرى" : "Play Again"}
                </button>
                <button class="btn" id="saveScoreBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-save"></i>
                    ${currentLanguage === "ar" ? "حفظ النتيجة" : "Save Score"}
                </button>
                <button class="btn" id="exitGameBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-home"></i>
                    ${currentLanguage === "ar" ? "الرئيسية" : "Home"}
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("playAgainBtn").addEventListener("click", () => startGame("reaction"));
    document.getElementById("saveScoreBtn").addEventListener("click", () => saveGameScore("reaction", gameState.score));
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
}

// Snake Game
function startSnakeGame() {
    gameState = {
        type: "snake",
        score: 0,
        highScore: parseInt(localStorage.getItem("snakeHighScore")) || 0,
        snake: [{x: 10, y: 10}],
        food: {x: 5, y: 5},
        direction: "right",
        nextDirection: "right",
        gridSize: 20,
        gameSpeed: 150,
        gameOver: false,
        startTime: Date.now()
    };
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <div class="game-header">
                <div class="game-stats">
                    <span id="snakeScore">${currentLanguage === "ar" ? "النقاط:" : "Score:"} 0</span>
                    <span id="snakeHighScore">${currentLanguage === "ar" ? "أعلى نتيجة:" : "High Score:"} ${gameState.highScore}</span>
                    <span id="snakeLength">${currentLanguage === "ar" ? "الطول:" : "Length:"} 1</span>
                </div>
                <button class="back-btn" id="exitGameBtn">
                    <i class="fas fa-times"></i>
                    ${currentLanguage === "ar" ? "خروج" : "Exit"}
                </button>
            </div>
            
            <div class="snake-container" style="text-align: center;">
                <canvas id="snakeCanvas" width="400" height="400" style="border: 2px solid var(--border); background: rgba(0,0,0,0.2);"></canvas>
                <div class="snake-instructions" style="margin-top: 20px; color: var(--text-secondary);">
                    ${currentLanguage === "ar" ? "استخدم مفاتيح الأسهم للتحكم في الثعبان" : "Use arrow keys to control the snake"}
                </div>
                <div class="snake-controls" style="margin-top: 20px; display: flex; justify-content: center; gap: 20px;">
                    <button class="btn-small" id="pauseBtn">
                        <i class="fas fa-pause"></i>
                        ${currentLanguage === "ar" ? "إيقاف" : "Pause"}
                    </button>
                    <button class="btn-small" id="restartBtn">
                        <i class="fas fa-redo"></i>
                        ${currentLanguage === "ar" ? "إعادة" : "Restart"}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const canvas = document.getElementById("snakeCanvas");
    const ctx = canvas.getContext("2d");
    
    // Handle keyboard input
    document.addEventListener("keydown", handleSnakeKeyPress);
    
    // Button events
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
    document.getElementById("pauseBtn").addEventListener("click", toggleSnakePause);
    document.getElementById("restartBtn").addEventListener("click", () => startGame("snake"));
    
    // Start game loop
    gameState.gameLoop = setInterval(gameLoop, gameState.gameSpeed);
    gameLoop();
    
    function gameLoop() {
        if (gameState.paused) return;
        
        updateSnake();
        if (gameState.gameOver) {
            endSnakeGame();
            return;
        }
        drawGame(ctx);
    }
    
    function updateSnake() {
        // Update direction
        gameState.direction = gameState.nextDirection;
        
        // Calculate new head position
        const head = {...gameState.snake[0]};
        
        switch (gameState.direction) {
            case "up": head.y--; break;
            case "down": head.y++; break;
            case "left": head.x--; break;
            case "right": head.x++; break;
        }
        
        // Check wall collision
        if (head.x < 0 || head.x >= gameState.gridSize || 
            head.y < 0 || head.y >= gameState.gridSize) {
            gameState.gameOver = true;
            return;
        }
        
        // Check self collision
        for (let segment of gameState.snake) {
            if (segment.x === head.x && segment.y === head.y) {
                gameState.gameOver = true;
                return;
            }
        }
        
        // Add new head
        gameState.snake.unshift(head);
        
        // Check food collision
        if (head.x === gameState.food.x && head.y === gameState.food.y) {
            // Increase score
            gameState.score += 10;
            
            // Generate new food
            gameState.food = {
                x: Math.floor(Math.random() * gameState.gridSize),
                y: Math.floor(Math.random() * gameState.gridSize)
            };
            
            // Make sure food doesn't appear on snake
            while (gameState.snake.some(segment => segment.x === gameState.food.x && segment.y === gameState.food.y)) {
                gameState.food = {
                    x: Math.floor(Math.random() * gameState.gridSize),
                    y: Math.floor(Math.random() * gameState.gridSize)
                };
            }
            
            playSound("successSound");
        } else {
            // Remove tail if no food eaten
            gameState.snake.pop();
        }
        
        // Update stats
        updateSnakeStats();
    }
    
    function drawGame(ctx) {
        // Clear canvas
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        
        const cellSize = canvas.width / gameState.gridSize;
        
        for (let i = 0; i <= gameState.gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvas.width, i * cellSize);
            ctx.stroke();
        }
        
        // Draw snake
        gameState.snake.forEach((segment, index) => {
            if (index === 0) {
                // Head
                ctx.fillStyle = "#4CAF50";
            } else {
                // Body
                ctx.fillStyle = "#8BC34A";
            }
            
            ctx.fillRect(
                segment.x * cellSize + 1,
                segment.y * cellSize + 1,
                cellSize - 2,
                cellSize - 2
            );
        });
        
        // Draw food
        ctx.fillStyle = "#FF5722";
        ctx.beginPath();
        ctx.arc(
            gameState.food.x * cellSize + cellSize / 2,
            gameState.food.y * cellSize + cellSize / 2,
            cellSize / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    function handleSnakeKeyPress(e) {
        switch (e.key) {
            case "ArrowUp":
                if (gameState.direction !== "down") gameState.nextDirection = "up";
                break;
            case "ArrowDown":
                if (gameState.direction !== "up") gameState.nextDirection = "down";
                break;
            case "ArrowLeft":
                if (gameState.direction !== "right") gameState.nextDirection = "left";
                break;
            case "ArrowRight":
                if (gameState.direction !== "left") gameState.nextDirection = "right";
                break;
        }
    }
}

function toggleSnakePause() {
    gameState.paused = !gameState.paused;
    const btn = document.getElementById("pauseBtn");
    if (btn) {
        btn.innerHTML = gameState.paused ? 
            `<i class="fas fa-play"></i> ${currentLanguage === "ar" ? "متابعة" : "Resume"}` :
            `<i class="fas fa-pause"></i> ${currentLanguage === "ar" ? "إيقاف" : "Pause"}`;
    }
}

function updateSnakeStats() {
    const score = document.getElementById("snakeScore");
    const length = document.getElementById("snakeLength");
    
    if (score) score.textContent = `${currentLanguage === "ar" ? "النقاط:" : "Score:"} ${gameState.score}`;
    if (length) length.textContent = `${currentLanguage === "ar" ? "الطول:" : "Length:"} ${gameState.snake.length}`;
}

async function endSnakeGame() {
    clearInterval(gameState.gameLoop);
    
    // Update high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem("snakeHighScore", gameState.highScore);
    }
    
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    let rating = "";
    let message = "";
    
    if (gameState.score >= 200) {
        rating = "★★★★★";
        message = currentLanguage === "ar" ? "أداء مذهل! ثعبان عملاق!" : "Amazing performance! Giant snake!";
    } else if (gameState.score >= 100) {
        rating = "★★★★☆";
        message = currentLanguage === "ar" ? "أداء ممتاز! ثعبان طويل!" : "Excellent performance! Long snake!";
    } else if (gameState.score >= 50) {
        rating = "★★★☆☆";
        message = currentLanguage === "ar" ? "أداء جيد! ثعبان متوسط!" : "Good performance! Medium snake!";
    } else {
        rating = "★★☆☆☆";
        message = currentLanguage === "ar" ? "يمكنك التحسن بالممارسة." : "You can improve with practice.";
    }
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <h3 style="color: var(--accent-light); margin-bottom: 30px; text-align: center;">
                ${currentLanguage === "ar" ? "انتهت اللعبة!" : "Game Over!"}
            </h3>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <div class="result-score">${gameState.score}</div>
                <div style="color: var(--gold); font-size: 1.5rem; margin-bottom: 15px;">${rating}</div>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "أعلى نتيجة:" : "High Score:"} ${gameState.highScore}
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "الطول:" : "Length:"} ${gameState.snake.length}
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "الوقت:" : "Time:"} ${elapsed} ثانية
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
            </div>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="btn" id="playAgainBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-redo"></i>
                    ${currentLanguage === "ar" ? "لعبة أخرى" : "Play Again"}
                </button>
                <button class="btn" id="saveScoreBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-save"></i>
                    ${currentLanguage === "ar" ? "حفظ النتيجة" : "Save Score"}
                </button>
                <button class="btn" id="exitGameBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-home"></i>
                    ${currentLanguage === "ar" ? "الرئيسية" : "Home"}
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("playAgainBtn").addEventListener("click", () => startGame("snake"));
    document.getElementById("saveScoreBtn").addEventListener("click", () => saveGameScore("snake", gameState.score));
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
}

// Space War Game
function startSpaceWarGame() {
    gameState = {
        type: "spacewar",
        score: 0,
        highScore: parseInt(localStorage.getItem("spacewarHighScore")) || 0,
        player: { x: 200, y: 350, width: 40, height: 40 },
        bullets: [],
        enemies: [],
        enemySpeed: 2,
        bulletSpeed: 5,
        lastShot: 0,
        shotDelay: 300,
        gameOver: false,
        startTime: Date.now(),
        enemySpawnRate: 1000,
        lastEnemySpawn: 0
    };
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <div class="game-header">
                <div class="game-stats">
                    <span id="spacewarScore">${currentLanguage === "ar" ? "النقاط:" : "Score:"} 0</span>
                    <span id="spacewarHighScore">${currentLanguage === "ar" ? "أعلى نتيجة:" : "High Score:"} ${gameState.highScore}</span>
                    <span id="spacewarEnemies">${currentLanguage === "ar" ? "الأعداء:" : "Enemies:"} 0</span>
                </div>
                <button class="back-btn" id="exitGameBtn">
                    <i class="fas fa-times"></i>
                    ${currentLanguage === "ar" ? "خروج" : "Exit"}
                </button>
            </div>
            
            <div class="spacewar-container" style="text-align: center;">
                <canvas id="spacewarCanvas" width="400" height="400" style="border: 2px solid var(--border); background: #000;"></canvas>
                <div class="spacewar-instructions" style="margin-top: 20px; color: var(--text-secondary);">
                    ${currentLanguage === "ar" ? "استخدم مفاتيح الأسهم للتحرك ومفتاح المسافة لإطلاق النار" : "Use arrow keys to move and spacebar to shoot"}
                </div>
                <div class="spacewar-controls" style="margin-top: 20px; display: flex; justify-content: center; gap: 20px;">
                    <button class="btn-small" id="pauseBtn">
                        <i class="fas fa-pause"></i>
                        ${currentLanguage === "ar" ? "إيقاف" : "Pause"}
                    </button>
                    <button class="btn-small" id="restartBtn">
                        <i class="fas fa-redo"></i>
                        ${currentLanguage === "ar" ? "إعادة" : "Restart"}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const canvas = document.getElementById("spacewarCanvas");
    const ctx = canvas.getContext("2d");
    
    // Handle keyboard input
    const keys = {};
    document.addEventListener("keydown", (e) => {
        keys[e.key] = true;
        if (e.key === " ") {
            e.preventDefault();
            shootBullet();
        }
    });
    document.addEventListener("keyup", (e) => {
        keys[e.key] = false;
    });
    
    // Button events
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
    document.getElementById("pauseBtn").addEventListener("click", toggleSpacewarPause);
    document.getElementById("restartBtn").addEventListener("click", () => startGame("spacewar"));
    
    // Start game loop
    gameState.lastTime = Date.now();
    gameState.gameLoop = requestAnimationFrame(updateSpacewar);
    
    function updateSpacewar() {
        if (gameState.paused) {
            gameState.gameLoop = requestAnimationFrame(updateSpacewar);
            return;
        }
        
        const currentTime = Date.now();
        const deltaTime = currentTime - gameState.lastTime;
        gameState.lastTime = currentTime;
        
        // Spawn enemies
        if (currentTime - gameState.lastEnemySpawn > gameState.enemySpawnRate) {
            spawnEnemy();
            gameState.lastEnemySpawn = currentTime;
        }
        
        // Handle input
        if (keys["ArrowLeft"] && gameState.player.x > 0) {
            gameState.player.x -= 5;
        }
        if (keys["ArrowRight"] && gameState.player.x < canvas.width - gameState.player.width) {
            gameState.player.x += 5;
        }
        if (keys["ArrowUp"] && gameState.player.y > 0) {
            gameState.player.y -= 5;
        }
        if (keys["ArrowDown"] && gameState.player.y < canvas.height - gameState.player.height) {
            gameState.player.y += 5;
        }
        
        // Update bullets
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = gameState.bullets[i];
            bullet.y -= bullet.speed;
            
            // Remove bullets that are off screen
            if (bullet.y < 0) {
                gameState.bullets.splice(i, 1);
                continue;
            }
            
            // Check bullet-enemy collisions
            for (let j = gameState.enemies.length - 1; j >= 0; j--) {
                const enemy = gameState.enemies[j];
                if (checkCollision(bullet, enemy)) {
                    // Remove bullet and enemy
                    gameState.bullets.splice(i, 1);
                    gameState.enemies.splice(j, 1);
                    gameState.score += 10;
                    playSound("successSound");
                    break;
                }
            }
        }
        
        // Update enemies
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            enemy.y += enemy.speed;
            
            // Remove enemies that are off screen
            if (enemy.y > canvas.height) {
                gameState.enemies.splice(i, 1);
                continue;
            }
            
            // Check enemy-player collision
            if (checkCollision(gameState.player, enemy)) {
                gameState.gameOver = true;
                endSpaceWarGame();
                return;
            }
        }
        
        // Draw everything
        drawSpacewar(ctx);
        
        // Update stats
        updateSpacewarStats();
        
        if (!gameState.gameOver) {
            gameState.gameLoop = requestAnimationFrame(updateSpacewar);
        }
    }
    
    function drawSpacewar(ctx) {
        // Clear canvas
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw stars
        ctx.fillStyle = "#FFF";
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            ctx.fillRect(x, y, 1, 1);
        }
        
        // Draw player (spaceship)
        ctx.fillStyle = "#4CAF50";
        ctx.beginPath();
        ctx.moveTo(gameState.player.x + gameState.player.width / 2, gameState.player.y);
        ctx.lineTo(gameState.player.x, gameState.player.y + gameState.player.height);
        ctx.lineTo(gameState.player.x + gameState.player.width, gameState.player.y + gameState.player.height);
        ctx.closePath();
        ctx.fill();
        
        // Draw bullets
        ctx.fillStyle = "#FF5722";
        gameState.bullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // Draw enemies
        ctx.fillStyle = "#F44336";
        gameState.enemies.forEach(enemy => {
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    function spawnEnemy() {
        const enemy = {
            x: Math.random() * (400 - 30),
            y: -30,
            width: 30,
            height: 30,
            speed: gameState.enemySpeed + Math.random() * 1
        };
        gameState.enemies.push(enemy);
    }
    
    function shootBullet() {
        const currentTime = Date.now();
        if (currentTime - gameState.lastShot < gameState.shotDelay) return;
        
        const bullet = {
            x: gameState.player.x + gameState.player.width / 2 - 2.5,
            y: gameState.player.y,
            width: 5,
            height: 10,
            speed: gameState.bulletSpeed
        };
        
        gameState.bullets.push(bullet);
        gameState.lastShot = currentTime;
        playSound("clickSound");
    }
    
    function checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}

function toggleSpacewarPause() {
    gameState.paused = !gameState.paused;
    const btn = document.getElementById("pauseBtn");
    if (btn) {
        btn.innerHTML = gameState.paused ? 
            `<i class="fas fa-play"></i> ${currentLanguage === "ar" ? "متابعة" : "Resume"}` :
            `<i class="fas fa-pause"></i> ${currentLanguage === "ar" ? "إيقاف" : "Pause"}`;
    }
}

function updateSpacewarStats() {
    const score = document.getElementById("spacewarScore");
    const enemies = document.getElementById("spacewarEnemies");
    
    if (score) score.textContent = `${currentLanguage === "ar" ? "النقاط:" : "Score:"} ${gameState.score}`;
    if (enemies) enemies.textContent = `${currentLanguage === "ar" ? "الأعداء:" : "Enemies:"} ${gameState.enemies.length}`;
}

async function endSpaceWarGame() {
    cancelAnimationFrame(gameState.gameLoop);
    
    // Update high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem("spacewarHighScore", gameState.highScore);
    }
    
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    let rating = "";
    let message = "";
    
    if (gameState.score >= 500) {
        rating = "★★★★★";
        message = currentLanguage === "ar" ? "مقاتل فضاء محترف!" : "Professional space fighter!";
    } else if (gameState.score >= 300) {
        rating = "★★★★☆";
        message = currentLanguage === "ar" ? "مقاتل فضاء ممتاز!" : "Excellent space fighter!";
    } else if (gameState.score >= 100) {
        rating = "★★★☆☆";
        message = currentLanguage === "ar" ? "مقاتل فضاء جيد!" : "Good space fighter!";
    } else {
        rating = "★★☆☆☆";
        message = currentLanguage === "ar" ? "استمر في التدريب." : "Keep practicing.";
    }
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <h3 style="color: var(--accent-light); margin-bottom: 30px; text-align: center;">
                ${currentLanguage === "ar" ? "انتهت اللعبة!" : "Game Over!"}
            </h3>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <div class="result-score">${gameState.score}</div>
                <div style="color: var(--gold); font-size: 1.5rem; margin-bottom: 15px;">${rating}</div>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "أعلى نتيجة:" : "High Score:"} ${gameState.highScore}
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "الأعداء المتبقين:" : "Enemies Remaining:"} ${gameState.enemies.length}
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">
                    ${currentLanguage === "ar" ? "الوقت:" : "Time:"} ${elapsed} ثانية
                </p>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
            </div>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="btn" id="playAgainBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-redo"></i>
                    ${currentLanguage === "ar" ? "لعبة أخرى" : "Play Again"}
                </button>
                <button class="btn" id="saveScoreBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-save"></i>
                    ${currentLanguage === "ar" ? "حفظ النتيجة" : "Save Score"}
                </button>
                <button class="btn" id="exitGameBtn" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-home"></i>
                    ${currentLanguage === "ar" ? "الرئيسية" : "Home"}
                </button>
            </div>
        </div>
    `;
    
    document.getElementById("playAgainBtn").addEventListener("click", () => startGame("spacewar"));
    document.getElementById("saveScoreBtn").addEventListener("click", () => saveGameScore("spacewar", gameState.score));
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
}

// Game Management
async function saveGameScore(gameType, score) {
    if (!currentPlayer) {
        Toast.show(currentLanguage === "ar" ? "يرجى تسجيل لاعب أولاً" : "Please register a player first", "error");
        return;
    }
    
    try {
        await db.collection('gameScores').add({
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            gameType: gameType,
            score: score,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            language: currentLanguage
        });
        
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "تم حفظ النتيجة بنجاح" : "Score saved successfully", "success");
        loadRankings();
    } catch (error) {
        console.error("Error saving game score:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في حفظ النتيجة" : "Error saving score", "error");
    }
}

function exitGame() {
    const gameContainer = document.getElementById("gameContainer");
    const gamesGrid = document.querySelector(".games-grid");
    const instructions = document.getElementById("gameInstructions");
    
    if (gameContainer) gameContainer.classList.add("hidden");
    if (gamesGrid) gamesGrid.classList.remove("hidden");
    if (instructions) instructions.classList.remove("hidden");
    
    gameState = null;
    playSound("clickSound");
}

function updateGameLanguage() {
    if (gameState) {
        // Update game interface based on language
        // This would need to be implemented for each game type
    }
}

// Player Registration and Ranking
function initPlayerSystem() {
    // Load current player from localStorage
    const savedPlayer = localStorage.getItem("currentPlayer");
    if (savedPlayer) {
        currentPlayer = JSON.parse(savedPlayer);
    }
    
    // Register player button
    const registerBtn = document.getElementById("registerPlayerBtn");
    if (registerBtn) {
        registerBtn.addEventListener("click", registerPlayer);
    }
    
    // Player name input
    const nameInput = document.getElementById("playerNameInput");
    const nameInputEn = document.getElementById("playerNameInputEn");
    
    if (nameInput) {
        nameInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") registerPlayer();
        });
    }
    if (nameInputEn) {
        nameInputEn.addEventListener("keypress", (e) => {
            if (e.key === "Enter") registerPlayer();
        });
    }
    
    // Ranking filters
    document.querySelectorAll(".ranking-filter-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const gameType = e.currentTarget.getAttribute("data-game");
            loadRankings(gameType);
        });
    });
}

async function registerPlayer() {
    const nameInput = currentLanguage === "ar" ? 
        document.getElementById("playerNameInput") : document.getElementById("playerNameInputEn");
    const name = nameInput.value.trim();
    
    if (!name) {
        Toast.show(currentLanguage === "ar" ? "يرجى إدخال اسم اللاعب" : "Please enter player name", "error");
        return;
    }
    
    if (name.length > 20) {
        Toast.show(currentLanguage === "ar" ? "اسم اللاعب طويل جداً (20 حرف كحد أقصى)" : "Player name too long (max 20 characters)", "error");
        return;
    }
    
    try {
        // Check if player already exists
        const snapshot = await db.collection('players')
            .where('name', '==', name)
            .limit(1)
            .get();
        
        let playerId;
        
        if (snapshot.empty) {
            // Create new player
            const playerRef = await db.collection('players').add({
                name: name,
                created: firebase.firestore.FieldValue.serverTimestamp(),
                language: currentLanguage
            });
            playerId = playerRef.id;
        } else {
            // Use existing player
            playerId = snapshot.docs[0].id;
        }
        
        currentPlayer = {
            id: playerId,
            name: name
        };
        
        saveSettings();
        nameInput.value = "";
        
        playSound("successSound");
        Toast.show(
            currentLanguage === "ar" ? `مرحباً ${name}! تم تسجيلك بنجاح` : `Welcome ${name}! Registration successful`,
            "success"
        );
        
        updateStatistics();
    } catch (error) {
        console.error("Error registering player:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في التسجيل" : "Error registering player", "error");
    }
}

async function loadRankings(gameType = "all") {
    try {
        let query = db.collection('gameScores')
            .orderBy('score', 'desc')
            .limit(50);
        
        if (gameType !== "all") {
            query = query.where('gameType', '==', gameType);
        }
        
        const snapshot = await query.get();
        const scores = [];
        
        snapshot.forEach(doc => {
            scores.push({
                id: doc.id,
                ...doc.data(),
                date: doc.data().timestamp?.toDate() || new Date()
            });
        });
        
        renderRankings(scores, gameType);
    } catch (error) {
        console.error("Error loading rankings:", error);
    }
}

function renderRankings(scores, gameType) {
    const tbody = document.getElementById("rankingTableBody");
    if (!tbody) return;
    
    if (scores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-trophy" style="font-size: 2rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>${currentLanguage === "ar" ? "لا توجد نتائج بعد" : "No scores yet"}</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const gameNames = {
        quiz: { ar: "اختبار المعلومات", en: "Quiz" },
        memory: { ar: "لعبة الذاكرة", en: "Memory" },
        typing: { ar: "سرعة الكتابة", en: "Typing" },
        reaction: { ar: "سرعة رد الفعل", en: "Reaction" },
        snake: { ar: "لعبة الثعبان", en: "Snake" },
        spacewar: { ar: "حرب الفضاء", en: "Space War" }
    };
    
    tbody.innerHTML = scores.map((score, index) => {
        const gameName = gameNames[score.gameType]?.[currentLanguage] || score.gameType;
        const playerName = score.playerName || (currentLanguage === "ar" ? "لاعب" : "Player");
        const date = formatDate(score.date);
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${playerName}</td>
                <td>${gameName}</td>
                <td style="color: var(--gold); font-weight: bold;">${score.score}</td>
                <td>${date}</td>
            </tr>
        `;
    }).join("");
}

// Admin System
function initAdminSystem() {
    // Check if admin is already logged in
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken === "emperorofthevoid_admin_2025") {
        isAdmin = true;
        showAdminPanel();
    }
    
    // Login button
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
        loginBtn.addEventListener("click", adminLogin);
    }
    
    // Admin password input
    const passwordInput = document.getElementById("adminPassword");
    if (passwordInput) {
        passwordInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") adminLogin();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", adminLogout);
    }
    
    // Admin action buttons
    const addAchievementBtn = document.getElementById("addAchievementBtn");
    if (addAchievementBtn) {
        addAchievementBtn.addEventListener("click", addAchievement);
    }
    
    const addPortfolioBtn = document.getElementById("addPortfolioBtn");
    if (addPortfolioBtn) {
        addPortfolioBtn.addEventListener("click", addPortfolioItem);
    }
    
    const addBlogBtn = document.getElementById("addBlogBtn");
    if (addBlogBtn) {
        addBlogBtn.addEventListener("click", addBlogPost);
    }
    
    const clearStatsBtn = document.getElementById("clearStatsBtn");
    if (clearStatsBtn) {
        clearStatsBtn.addEventListener("click", clearStatistics);
    }
    
    const exportDataBtn = document.getElementById("exportDataBtn");
    if (exportDataBtn) {
        exportDataBtn.addEventListener("click", exportData);
    }
    
    // Create blog button (for regular users)
    const createBlogBtn = document.getElementById("createBlogBtn");
    if (createBlogBtn) {
        createBlogBtn.addEventListener("click", () => {
            if (isAdmin) {
                // Show blog creation form
                document.getElementById("newBlogTitle").focus();
            } else {
                Toast.show(
                    currentLanguage === "ar" ? "هذه الميزة متاحة للإمبراطور فقط" : "This feature is for Emperor only",
                    "error"
                );
            }
        });
    }
}

function adminLogin() {
    const passwordInput = document.getElementById("adminPassword");
    const password = passwordInput.value;
    
    // Check password (you should use a more secure method in production)
    if (password === "voidemperor2025") {
        isAdmin = true;
        localStorage.setItem("adminToken", "emperorofthevoid_admin_2025");
        showAdminPanel();
        passwordInput.value = "";
        playSound("successSound");
        Toast.show(
            currentLanguage === "ar" ? "مرحباً سيدي الإمبراطور!" : "Welcome my Lord Emperor!",
            "success"
        );
    } else {
        playSound("errorSound");
        Toast.show(
            currentLanguage === "ar" ? "كلمة المرور غير صحيحة" : "Incorrect password",
            "error"
        );
    }
}

function adminLogout() {
    isAdmin = false;
    localStorage.removeItem("adminToken");
    hideAdminPanel();
    playSound("clickSound");
    Toast.show(
        currentLanguage === "ar" ? "تم تسجيل الخروج" : "Logged out successfully",
        "info"
    );
}

function showAdminPanel() {
    const loginSection = document.getElementById("adminLogin");
    const adminPanel = document.getElementById("adminPanel");
    const adminTabBtn = document.getElementById("adminTabBtn");
    
    if (loginSection) loginSection.classList.add("hidden");
    if (adminPanel) adminPanel.classList.remove("hidden");
    if (adminTabBtn) adminTabBtn.classList.remove("hidden");
    
    // Load admin data
    loadAdminAchievements();
    loadAdminPortfolio();
    loadAdminBlogPosts();
}

function hideAdminPanel() {
    const loginSection = document.getElementById("adminLogin");
    const adminPanel = document.getElementById("adminPanel");
    const adminTabBtn = document.getElementById("adminTabBtn");
    
    if (loginSection) loginSection.classList.remove("hidden");
    if (adminPanel) adminPanel.classList.add("hidden");
    if (adminTabBtn) adminTabBtn.classList.add("hidden");
}

async function loadAdminAchievements() {
    try {
        const snapshot = await db.collection('achievements')
            .orderBy('date', 'desc')
            .get();
        
        const list = document.getElementById("achievementsList");
        if (!list) return;
        
        list.innerHTML = snapshot.docs.map(doc => {
            const achievement = doc.data();
            return `
                <div class="admin-list-item">
                    <div class="admin-item-content">
                        <h4>${achievement.title?.ar || achievement.title || "No title"}</h4>
                        <p>${achievement.description?.ar || achievement.description || "No description"}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn-small btn-edit" onclick="editAchievement('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-small btn-delete" onclick="deleteAchievement('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error("Error loading admin achievements:", error);
    }
}

async function addAchievement() {
    const titleAr = document.getElementById("newAchievementTitle").value.trim();
    const titleEn = document.getElementById("newAchievementTitleEn").value.trim();
    const descAr = document.getElementById("newAchievementDesc").value.trim();
    const descEn = document.getElementById("newAchievementDescEn").value.trim();
    
    if (!titleAr || !descAr) {
        Toast.show(currentLanguage === "ar" ? "يرجى ملء العنوان والوصف" : "Please fill title and description", "error");
        return;
    }
    
    try {
        await db.collection('achievements').add({
            title: { ar: titleAr, en: titleEn || titleAr },
            description: { ar: descAr, en: descEn || descAr },
            date: firebase.firestore.FieldValue.serverTimestamp(),
            category: { ar: "إنجاز", en: "Achievement" }
        });
        
        // Clear form
        document.getElementById("newAchievementTitle").value = "";
        document.getElementById("newAchievementTitleEn").value = "";
        document.getElementById("newAchievementDesc").value = "";
        document.getElementById("newAchievementDescEn").value = "";
        
        // Reload data
        await loadAchievements();
        await loadAdminAchievements();
        updateStatistics();
        
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "تم إضافة الإنجاز بنجاح" : "Achievement added successfully", "success");
    } catch (error) {
        console.error("Error adding achievement:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في إضافة الإنجاز" : "Error adding achievement", "error");
    }
}

async function editAchievement(id) {
    // Implementation for editing achievements
    Toast.show(currentLanguage === "ar" ? "سيتم تفعيل هذه الميزة قريباً" : "This feature will be available soon", "info");
}

async function deleteAchievement(id) {
    if (!confirm(currentLanguage === "ar" ? "هل أنت متأكد من حذف هذا الإنجاز؟" : "Are you sure you want to delete this achievement?")) {
        return;
    }
    
    try {
        await db.collection('achievements').doc(id).delete();
        
        // Reload data
        await loadAchievements();
        await loadAdminAchievements();
        updateStatistics();
        
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "تم حذف الإنجاز بنجاح" : "Achievement deleted successfully", "success");
    } catch (error) {
        console.error("Error deleting achievement:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في حذف الإنجاز" : "Error deleting achievement", "error");
    }
}

async function loadAdminPortfolio() {
    try {
        const snapshot = await db.collection('portfolio')
            .orderBy('date', 'desc')
            .get();
        
        const list = document.getElementById("portfolioList");
        if (!list) return;
        
        list.innerHTML = snapshot.docs.map(doc => {
            const item = doc.data();
            return `
                <div class="admin-list-item">
                    <div class="admin-item-content">
                        <h4>${item.title?.ar || item.title || "No title"}</h4>
                        <p>${item.description?.ar || item.description || "No description"}</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn-small btn-edit" onclick="editPortfolioItem('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-small btn-delete" onclick="deletePortfolioItem('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error("Error loading admin portfolio:", error);
    }
}

async function addPortfolioItem() {
    const titleAr = document.getElementById("newPortfolioTitle").value.trim();
    const titleEn = document.getElementById("newPortfolioTitleEn").value.trim();
    const descAr = document.getElementById("newPortfolioDesc").value.trim();
    const descEn = document.getElementById("newPortfolioDescEn").value.trim();
    
    if (!titleAr || !descAr) {
        Toast.show(currentLanguage === "ar" ? "يرجى ملء العنوان والوصف" : "Please fill title and description", "error");
        return;
    }
    
    try {
        await db.collection('portfolio').add({
            title: { ar: titleAr, en: titleEn || titleAr },
            description: { ar: descAr, en: descEn || descAr },
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            tags: [{ ar: "ويب", en: "Web" }, { ar: "تصميم", en: "Design" }],
            date: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Clear form
        document.getElementById("newPortfolioTitle").value = "";
        document.getElementById("newPortfolioTitleEn").value = "";
        document.getElementById("newPortfolioDesc").value = "";
        document.getElementById("newPortfolioDescEn").value = "";
        
        // Reload data
        await loadPortfolio();
        await loadAdminPortfolio();
        
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "تم إضافة العمل بنجاح" : "Project added successfully", "success");
    } catch (error) {
        console.error("Error adding portfolio item:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في إضافة العمل" : "Error adding project", "error");
    }
}

async function editPortfolioItem(id) {
    Toast.show(currentLanguage === "ar" ? "سيتم تفعيل هذه الميزة قريباً" : "This feature will be available soon", "info");
}

async function deletePortfolioItem(id) {
    if (!confirm(currentLanguage === "ar" ? "هل أنت متأكد من حذف هذا العمل؟" : "Are you sure you want to delete this project?")) {
        return;
    }
    
    try {
        await db.collection('portfolio').doc(id).delete();
        
        // Reload data
        await loadPortfolio();
        await loadAdminPortfolio();
        
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "تم حذف العمل بنجاح" : "Project deleted successfully", "success");
    } catch (error) {
        console.error("Error deleting portfolio item:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في حذف العمل" : "Error deleting project", "error");
    }
}

async function loadAdminBlogPosts() {
    try {
        const snapshot = await db.collection('blogPosts')
            .orderBy('date', 'desc')
            .get();
        
        const list = document.getElementById("blogList");
        if (!list) return;
        
        list.innerHTML = snapshot.docs.map(doc => {
            const post = doc.data();
            return `
                <div class="admin-list-item">
                    <div class="admin-item-content">
                        <h4>${post.title?.ar || post.title || "No title"}</h4>
                        <p>${(post.content?.ar || post.content || "No content").substring(0, 100)}...</p>
                    </div>
                    <div class="admin-item-actions">
                        <button class="btn-small btn-edit" onclick="editBlogPost('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-small btn-delete" onclick="deleteBlogPost('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error("Error loading admin blog posts:", error);
    }
}

async function addBlogPost() {
    const titleAr = document.getElementById("newBlogTitle").value.trim();
    const titleEn = document.getElementById("newBlogTitleEn").value.trim();
    const contentAr = document.getElementById("newBlogContent").value.trim();
    const contentEn = document.getElementById("newBlogContentEn").value.trim();
    
    if (!titleAr || !contentAr) {
        Toast.show(currentLanguage === "ar" ? "يرجى ملء العنوان والمحتوى" : "Please fill title and content", "error");
        return;
    }
    
    try {
        await db.collection('blogPosts').add({
            title: { ar: titleAr, en: titleEn || titleAr },
            content: { ar: contentAr, en: contentEn || contentAr },
            date: firebase.firestore.FieldValue.serverTimestamp(),
            likes: 0,
            commentCount: 0
        });
        
        // Clear form
        document.getElementById("newBlogTitle").value = "";
        document.getElementById("newBlogTitleEn").value = "";
        document.getElementById("newBlogContent").value = "";
        document.getElementById("newBlogContentEn").value = "";
        
        // Reload data
        await loadBlogPosts();
        await loadAdminBlogPosts();
        
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "تم نشر المقال بنجاح" : "Blog post published successfully", "success");
    } catch (error) {
        console.error("Error adding blog post:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في نشر المقال" : "Error publishing blog post", "error");
    }
}

async function editBlogPost(id) {
    Toast.show(currentLanguage === "ar" ? "سيتم تفعيل هذه الميزة قريباً" : "This feature will be available soon", "info");
}

async function deleteBlogPost(id) {
    if (!confirm(currentLanguage === "ar" ? "هل أنت متأكد من حذف هذا المقال؟" : "Are you sure you want to delete this post?")) {
        return;
    }
    
    try {
        await db.collection('blogPosts').doc(id).delete();
        
        // Reload data
        await loadBlogPosts();
        await loadAdminBlogPosts();
        
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "تم حذف المقال بنجاح" : "Blog post deleted successfully", "success");
    } catch (error) {
        console.error("Error deleting blog post:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في حذف المقال" : "Error deleting blog post", "error");
    }
}

function readBlogPost(id) {
    const post = DATA.blogPosts.find(p => p.id === id);
    if (!post) return;
    
    document.getElementById("gameContainer").innerHTML = `
        <div class="game-area">
            <div class="game-header">
                <button class="back-btn" id="exitGameBtn">
                    <i class="fas fa-arrow-right"></i>
                    ${currentLanguage === "ar" ? "رجوع" : "Back"}
                </button>
            </div>
            
            <div class="blog-post-full">
                <h2 style="color: var(--accent-light); margin-bottom: 20px;">
                    ${post.title[currentLanguage] || post.title}
                </h2>
                <div class="blog-date" style="color: var(--text-secondary); margin-bottom: 30px;">
                    ${formatDate(post.date)}
                </div>
                <div class="blog-content-full" style="line-height: 1.8; font-size: 1.1rem; color: var(--text);">
                    ${(post.content[currentLanguage] || post.content).replace(/\n/g, '<br>')}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById("exitGameBtn").addEventListener("click", exitGame);
    
    const gamesGrid = document.querySelector(".games-grid");
    const gameContainer = document.getElementById("gameContainer");
    
    if (gamesGrid) gamesGrid.classList.add("hidden");
    if (gameContainer) gameContainer.classList.remove("hidden");
}

async function clearStatistics() {
    if (!confirm(currentLanguage === "ar" ? 
        "هل أنت متأكد من مسح جميع الإحصائيات؟ هذا الإجراء لا يمكن التراجع عنه." :
        "Are you sure you want to clear all statistics? This action cannot be undone.")) {
        return;
    }
    
    try {
        // Reset visitor count
        await db.collection('statistics').doc('visitors').set({
            count: 0,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "تم مسح الإحصائيات بنجاح" : "Statistics cleared successfully", "success");
        updateStatistics();
    } catch (error) {
        console.error("Error clearing statistics:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في مسح الإحصائيات" : "Error clearing statistics", "error");
    }
}

async function exportData() {
    try {
        // Collect all data
        const data = {
            achievements: [],
            portfolio: [],
            blogPosts: [],
            ratings: [],
            gameScores: [],
            comments: [],
            players: [],
            visits: []
        };
        
        // Export achievements
        const achievementsSnapshot = await db.collection('achievements').get();
        data.achievements = achievementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Export portfolio
        const portfolioSnapshot = await db.collection('portfolio').get();
        data.portfolio = portfolioSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Create JSON file
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Download file
        const a = document.createElement('a');
        a.href = url;
        a.download = `void_emperor_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "تم تصدير البيانات بنجاح" : "Data exported successfully", "success");
    } catch (error) {
        console.error("Error exporting data:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في تصدير البيانات" : "Error exporting data", "error");
    }
}

function updateAdminLanguage() {
    // Update admin interface language
    if (isAdmin) {
        loadAdminAchievements();
        loadAdminPortfolio();
        loadAdminBlogPosts();
    }
}

// Initialize everything
document.addEventListener("DOMContentLoaded", async function() {
    // Initialize settings
    loadSettings();
    
    // Initialize systems
    initTabs();
    initLanguageToggle();
    initDarkModeToggle();
    initSoundToggle();
    initBackgroundAnimation();
    initGames();
    initRatingSystem();
    initAIChat();
    initPlayerSystem();
    initAdminSystem();
    
    // Initialize character count for comment fields
    initCharacterCounters();
    
    // Load initial data
    await loadData();
    await loadRatingsFromFirebase();
    await loadRankings();
    
    // Load comments for active tab
    loadCommentsForTab(activeTab);
    
    // Set up comment submission buttons
    setupCommentButtons();
    
    // Show welcome message
    setTimeout(() => {
        const message = currentLanguage === "ar" 
            ? "مرحباً بك في مملكة الفراغ!" 
            : "Welcome to Void Kingdom!";
        Toast.show(message, "info", 5000);
    }, 1000);
});

function initCharacterCounters() {
    // Setup character counters for all comment fields
    const commentFields = [
        'aboutCommentInput', 'aboutCommentInputEn',
        'achievementsCommentInput', 'achievementsCommentInputEn',
        'portfolioCommentInput', 'portfolioCommentInputEn',
        'gamesCommentInput', 'gamesCommentInputEn',
        'blogCommentInput', 'blogCommentInputEn',
        'contactCommentInput', 'contactCommentInputEn',
        'ratingComment', 'ratingCommentEn'
    ];
    
    commentFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                const counterId = fieldId.replace('Input', 'CharCount').replace('Comment', 'CharCount');
                updateCharCount(counterId, this.value.length);
            });
        }
    });
}

function setupCommentButtons() {
    // Setup comment submission buttons
    const commentButtons = [
        { tab: 'about', btnId: 'submitAboutComment', inputId: 'aboutCommentInput' },
        { tab: 'achievements', btnId: 'submitAchievementsComment', inputId: 'achievementsCommentInput' },
        { tab: 'portfolio', btnId: 'submitPortfolioComment', inputId: 'portfolioCommentInput' },
        { tab: 'games', btnId: 'submitGamesComment', inputId: 'gamesCommentInput' },
        { tab: 'blog', btnId: 'submitBlogComment', inputId: 'blogCommentInput' },
        { tab: 'contact', btnId: 'submitContactComment', inputId: 'contactCommentInput' }
    ];
    
    commentButtons.forEach(config => {
        const btn = document.getElementById(config.btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                const inputId = currentLanguage === 'ar' ? config.inputId : config.inputId + 'En';
                submitComment(config.tab, inputId);
            });
        }
    });
}

function updateCommentsLanguage() {
    // Reload comments for current tab
    loadCommentsForTab(activeTab);
}

// Make functions available globally for onclick handlers
window.editAchievement = editAchievement;
window.deleteAchievement = deleteAchievement;
window.editPortfolioItem = editPortfolioItem;
window.deletePortfolioItem = deletePortfolioItem;
window.editBlogPost = editBlogPost;
window.deleteBlogPost = deleteBlogPost;
window.readBlogPost = readBlogPost;
window.likeComment = async function(commentId) {
    // Implementation for liking comments
    Toast.show(currentLanguage === "ar" ? "سيتم تفعيل هذه الميزة قريباً" : "This feature will be available soon", "info");
};
window.deleteComment = async function(commentId) {
    if (!isAdmin) return;
    
    if (!confirm(currentLanguage === "ar" ? "هل أنت متأكد من حذف هذا التعليق؟" : "Are you sure you want to delete this comment?")) {
        return;
    }
    
    try {
        await db.collection('comments').doc(commentId).delete();
        loadCommentsForTab(activeTab);
        updateStatistics();
        playSound("successSound");
        Toast.show(currentLanguage === "ar" ? "تم حذف التعليق بنجاح" : "Comment deleted successfully", "success");
    } catch (error) {
        console.error("Error deleting comment:", error);
        playSound("errorSound");
        Toast.show(currentLanguage === "ar" ? "حدث خطأ في حذف التعليق" : "Error deleting comment", "error");
    }
};