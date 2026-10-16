
"use strict";

// ==========================================
// SMART AI CROP HEALTH - FRONTEND ONLY
// ==========================================

const $ = (id) => document.getElementById(id);

const USER_KEY = "cropCareDemoUser";
const SCANS_KEY = "cropCareDemoScans";
const THEME_KEY = "cropCareTheme";
const LANGUAGE_KEY = "cropCareLanguage";

let currentUser = null;
let selectedImage = null;
let previewUrl = null;

// ---------- LOCAL STORAGE ----------

function readJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function getScans() {
    const data = readJSON(SCANS_KEY, []);
    return Array.isArray(data) ? data : [];
}

function saveScans(scans) {
    localStorage.setItem(SCANS_KEY, JSON.stringify(scans));
}

function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ---------- TIME-BASED GREETING ----------

function getTimeGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 21) return "Good evening";

    return "Good night";
}

// ---------- MESSAGES ----------

function showMessage(id, message, color) {
    const element = $(id);
    if (!element) return;

    element.textContent = message;
    element.style.color = color || "var(--danger)";
}

function clearMessages() {
    ["loginMessage", "registerMessage", "profileMessage"].forEach(id => {
        if ($(id)) $(id).textContent = "";
    });
}

// ---------- AUTHENTICATION DEMO ----------

function showAuthForm(formName) {
    $("loginForm").classList.toggle("hidden", formName !== "login");
    $("registerForm").classList.toggle("hidden", formName !== "register");

    $("showLogin").classList.toggle("active", formName === "login");
    $("showRegister").classList.toggle("active", formName === "register");

    clearMessages();
}

function showApplication() {
    $("authPage").classList.add("hidden");
    $("appPage").classList.remove("hidden");

    $("sidebar").classList.remove("open");

    updateProfileFields();
    updateDashboard();
    renderHistory();
    openTab("home");
}

function showAuthentication() {
    $("appPage").classList.add("hidden");
    $("authPage").classList.remove("hidden");
    $("sidebar").classList.remove("open");
}

function handleRegister(event) {
    event.preventDefault();

    const name = $("registerName").value.trim();
    const identity = $("registerIdentity").value.trim();
    const password = $("registerPassword").value;

    if (!name || !identity || !password) {
        showMessage("registerMessage", "Please fill in all fields.");
        return;
    }

    if (password.length < 6) {
        showMessage(
            "registerMessage",
            "Password must be at least 6 characters."
        );
        return;
    }

    const existingUser = readJSON(USER_KEY, null);

    if (
        existingUser &&
        existingUser.identity.toLowerCase() === identity.toLowerCase()
    ) {
        showMessage(
            "registerMessage",
            "This demo account already exists. Please log in."
        );
        return;
    }

    // Demonstration only: this is NOT secure authentication.
    const user = {
        name,
        identity,
        password,
        language: $("languageSelect").value || "en"
    };

    saveUser(user);
    currentUser = user;

    $("registerForm").reset();
    showApplication();
}

function handleLogin(event) {
    event.preventDefault();

    const identity = $("loginIdentity").value.trim();
    const password = $("loginPassword").value;
    const savedUser = readJSON(USER_KEY, null);

    if (!savedUser) {
        showMessage(
            "loginMessage",
            "No demo account found. Please register first."
        );
        return;
    }

    if (
        savedUser.identity.toLowerCase() !== identity.toLowerCase() ||
        savedUser.password !== password
    ) {
        showMessage(
            "loginMessage",
            "Incorrect email/phone or password."
        );
        return;
    }

    currentUser = savedUser;
    $("loginForm").reset();
    showApplication();
}

function logout() {
    currentUser = null;
    selectedImage = null;

    localStorage.removeItem(USER_KEY);

    $("loginForm").reset();
    removeSelectedImage();
    showAuthForm("login");
    showAuthentication();
}

// ---------- PROFILE ----------

function updateProfileFields() {
    if (!currentUser) return;

    const firstName = currentUser.name.trim().split(/\s+/)[0];

    $("welcomeName").textContent =
        `${getTimeGreeting()}, ${firstName} 👋`;

    $("profileNameInput").value = currentUser.name;
    $("profileIdentityInput").value = currentUser.identity;

    $("languageSelect").value =
        currentUser.language || "en";

    $("profileLanguage").value =
        currentUser.language || "en";
}

function saveProfile(event) {
    event.preventDefault();

    if (!currentUser) return;

    const name = $("profileNameInput").value.trim();
    const identity = $("profileIdentityInput").value.trim();

    if (!name || !identity) {
        showMessage(
            "profileMessage",
            "Please enter your name and email/phone."
        );
        return;
    }

    currentUser.name = name;
    currentUser.identity = identity;

    saveUser(currentUser);
    updateProfileFields();

    showMessage(
        "profileMessage",
        "Profile updated successfully!",
        "var(--green)"
    );
}

// ---------- PAGE NAVIGATION ----------

function openTab(name) {
    const tab = $(name + "Tab");
    if (!tab) return;

    document.querySelectorAll(".tab-content").forEach(section => {
        section.classList.add("hidden");
    });

    tab.classList.remove("hidden");

    document.querySelectorAll(".nav-link[data-tab]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.tab === name
        );
    });

    $("sidebar").classList.remove("open");

    if (name === "home") updateDashboard();
    if (name === "history") renderHistory();
}

function navigateTo(name) {
    if (!currentUser) {
        showAuthentication();
        return;
    }

    openTab(name);
}

// ---------- IMAGE PREVIEW ----------

function handleImageSelection(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("Please select a JPG, PNG, or WEBP image.");
        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be 5 MB or smaller.");
        event.target.value = "";
        return;
    }

    selectedImage = file;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);

    $("imagePreview").src = previewUrl;
    $("imagePreviewBox").classList.remove("hidden");
    $("analysisResult").classList.add("hidden");
}

function removeSelectedImage() {
    selectedImage = null;

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    $("imageInput").value = "";
    $("imagePreview").removeAttribute("src");
    $("imagePreviewBox").classList.add("hidden");
    $("analysisResult").classList.add("hidden");
}

// ---------- BRINJAL DEMO ANALYSIS ----------

const demoResults = [
    {
        disease: "Possible Leaf Spot",
        status: "Needs attention",
        advice:
            "Sample result only. Inspect both sides of the leaves. " +
            "Several diseases and other plant stresses can cause similar spots. " +
            "Ask an agricultural expert to confirm the cause."
    },
    {
        disease: "Possible Bacterial Wilt",
        status: "Needs inspection",
        advice:
            "Sample result only. Check for persistent or sudden wilting. " +
            "Do not assume bacterial wilt from a photograph alone. " +
            "Seek expert confirmation before choosing a treatment."
    },
    {
        disease: "Possible Phomopsis Blight",
        status: "Needs inspection",
        advice:
            "Sample result only. Inspect leaves, stems and fruits for lesions or rot. " +
            "Similar symptoms may have other causes. Seek a reliable diagnosis."
    },
    {
        disease: "No obvious issue in this demo",
        status: "Continue monitoring",
        advice:
            "This is not proof that the plant is healthy. Continue checking leaves, " +
            "stems and fruits for changes."
    }
];

function analyzeBrinjalDemo() {
    if (!selectedImage) {
        alert("Please upload a brinjal leaf image first.");
        return;
    }

    const button = $("analyzeButton");
    button.disabled = true;
    button.textContent = "Preparing demo result...";

    // Random sample result, NOT an AI prediction.
    window.setTimeout(() => {
        const result =
            demoResults[Math.floor(Math.random() * demoResults.length)];

        $("resultDisease").textContent = result.disease;
        $("resultStatus").textContent = result.status;
        $("resultAdvice").textContent = result.advice;

        $("analysisResult").classList.remove("hidden");

        const scans = getScans();

        scans.unshift({
            id: Date.now(),
            crop: "Brinjal",
            disease: result.disease,
            status: result.status,
            date: new Date().toLocaleString(),
            imageName: selectedImage.name
        });

        saveScans(scans.slice(0, 100));

        updateDashboard();
        renderHistory();

        button.disabled = false;
        button.textContent = "Show Demo Analysis";
    }, 500);
}

// ---------- DASHBOARD STATISTICS ----------

function updateDashboard() {
    const scans = getScans();

    $("totalScans").textContent = scans.length;

    const healthy = scans.filter(scan =>
        scan.status === "Continue monitoring"
    ).length;

    $("healthyScans").textContent = healthy;
    $("attentionScans").textContent = scans.length - healthy;

    const recent = $("recentScans");
    recent.replaceChildren();

    if (scans.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No scans yet. Upload a brinjal leaf to begin.";
        recent.appendChild(empty);
        return;
    }

    scans.slice(0, 3).forEach(scan => {
        recent.appendChild(createScanCard(scan));
    });
}

// ---------- HISTORY ----------

function createScanCard(scan) {
    const item = document.createElement("article");
    item.className = "scan-item";

    const details = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = scan.crop || "Brinjal";

    const disease = document.createElement("p");
    disease.textContent = scan.disease || "Demo result";

    const date = document.createElement("small");
    date.textContent = scan.date || "";

    details.append(title, disease, date);

    const status = document.createElement("span");
    status.className = "scan-status";
    status.textContent = scan.status || "Demo";

    item.append(details, status);

    return item;
}

function renderHistory() {
    const scans = getScans();
    const list = $("historyList");

    list.replaceChildren();

    if (scans.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No scans yet. Your demo history will appear here.";
        list.appendChild(empty);
        return;
    }

    scans.forEach(scan => {
        list.appendChild(createScanCard(scan));
    });
}

function clearHistory() {
    const confirmed = window.confirm(
        "Delete all saved demo scan history from this browser?"
    );

    if (!confirmed) return;

    saveScans([]);
    updateDashboard();
    renderHistory();
    $("analysisResult").classList.add("hidden");
}

// ---------- CROP ASSISTANT DEMO ----------

function getAssistantReply(question) {
    const text = question.toLowerCase();

    if (
        text.includes("yellow") ||
        text.includes("yellowing")
    ) {
        return "Yellow brinjal leaves may be caused by nutrient issues, " +
            "watering problems, pests or disease. Check soil moisture and " +
            "inspect the underside of leaves. A soil test may help identify " +
            "nutrient problems.";
    }

    if (
        text.includes("spot") ||
        text.includes("disease") ||
        text.includes("fungus")
    ) {
        return "Common brinjal problems include leaf spots, wilt and fruit rot. " +
            "Note which parts are affected and how symptoms change over time. " +
            "Similar symptoms can have different causes, so seek expert " +
            "confirmation before treatment.";
    }

    if (
        text.includes("water") ||
        text.includes("irrigation")
    ) {
        return "Watering depends on soil, weather and plant growth stage. " +
            "Check soil moisture and avoid both waterlogging and prolonged dryness.";
    }

    if (
        text.includes("fertilizer") ||
        text.includes("nutrient")
    ) {
        return "Fertilizer requirements depend on the crop and soil. " +
            "A soil test can help you choose appropriate nutrients and avoid overuse.";
    }

    return "I can provide general brinjal-care information. Tell me the plant's " +
        "symptoms, when they began, and which parts are affected. " +
        "This is a preset-response demo, not a live AI assistant.";
}

function addChatMessage(message, sender) {
    const bubble = document.createElement("div");

    bubble.className =
        sender === "user" ? "user-message" : "bot-message";

    bubble.textContent = message;
    $("chatMessages").appendChild(bubble);

    $("chatMessages").scrollTop =
        $("chatMessages").scrollHeight;
}

function sendChatMessage(message) {
    const question = String(message || "").trim();
    if (!question) return;

    addChatMessage(question, "user");

    $("chatInput").value = "";

    window.setTimeout(() => {
        addChatMessage(getAssistantReply(question), "bot");
    }, 250);
}

// ---------- LANGUAGE SELECTOR ----------

const translations = {
    en: {
        home: "Dashboard",
        scan: "Scan Brinjal",
        history: "Scan History",
        assistant: "Crop Assistant",
        diseases: "Disease Guide",
        profile: "My Profile",
        theme: "Toggle Theme",
        logout: "Log Out"
    },
    hi: {
        home: "डैशबोर्ड",
        scan: "बैंगन स्कैन",
        history: "स्कैन इतिहास",
        assistant: "फसल सहायक",
        diseases: "रोग जानकारी",
        profile: "मेरी प्रोफ़ाइल",
        theme: "थीम बदलें",
        logout: "लॉग आउट"
    },
    mr: {
        home: "डॅशबोर्ड",
        scan: "वांग्याचे स्कॅन",
        history: "स्कॅन इतिहास",
        assistant: "पीक सहाय्यक",
        diseases: "रोग माहिती",
        profile: "माझी प्रोफाइल",
        theme: "थीम बदला",
        logout: "लॉग आउट"
    }
};

function applyLanguage(language) {
    const dictionary = translations[language] || translations.en;

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;

        if (dictionary[key]) {
            element.textContent = dictionary[key];
        }
    });

    $("languageSelect").value = language;
    $("profileLanguage").value = language;

    localStorage.setItem(LANGUAGE_KEY, language);

    if (currentUser) {
        currentUser.language = language;
        saveUser(currentUser);
    }
}

// ---------- DARK MODE ----------

function setTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);

    $("themeToggle").textContent =
        isDark ? "☀️ Light Mode" : "🌙 Toggle Theme";

    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

// ---------- EVENT LISTENERS ----------

document.addEventListener("DOMContentLoaded", () => {
    $("showLogin").addEventListener("click", () => {
        showAuthForm("login");
    });

    $("showRegister").addEventListener("click", () => {
        showAuthForm("register");
    });

    $("loginForm").addEventListener("submit", handleLogin);
    $("registerForm").addEventListener("submit", handleRegister);
    $("profileForm").addEventListener("submit", saveProfile);

    $("logoutButton").addEventListener("click", logout);

    document.querySelectorAll("[data-tab]").forEach(button => {
        button.addEventListener("click", () => {
            navigateTo(button.dataset.tab);
        });
    });

    document.querySelectorAll("[data-go]").forEach(button => {
        button.addEventListener("click", () => {
            navigateTo(button.dataset.go);
        });
    });

    $("menuButton").addEventListener("click", () => {
        $("sidebar").classList.toggle("open");
    });

    $("imageInput").addEventListener("change", handleImageSelection);
    $("removeImage").addEventListener("click", removeSelectedImage);
    $("analyzeButton").addEventListener("click", analyzeBrinjalDemo);
    $("clearHistory").addEventListener("click", clearHistory);

    $("chatForm").addEventListener("submit", event => {
        event.preventDefault();
        sendChatMessage($("chatInput").value);
    });

    document.querySelectorAll(".suggestion").forEach(button => {
        button.addEventListener("click", () => {
            sendChatMessage(button.dataset.question);
        });
    });

    $("themeToggle").addEventListener("click", () => {
        setTheme(!document.body.classList.contains("dark-mode"));
    });

    $("languageSelect").addEventListener("change", event => {
        applyLanguage(event.target.value);
    });

    $("profileLanguage").addEventListener("change", event => {
        applyLanguage(event.target.value);
    });

    // Restore saved theme and language.
    setTheme(localStorage.getItem(THEME_KEY) === "dark");

    const language =
        localStorage.getItem(LANGUAGE_KEY) || "en";

    applyLanguage(language);

    // Restore the demo user from this browser.
    const savedUser = readJSON(USER_KEY, null);

    if (savedUser && savedUser.name && savedUser.identity) {
        currentUser = savedUser;
        showApplication();
    } else {
        showAuthentication();
        showAuthForm("login");
    }

    updateDashboard();
});
