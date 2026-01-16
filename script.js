// Инициализация глобальных переменных
let users = JSON.parse(localStorage.getItem('diaryUsers')) || {};
let currentUser = null;
let entries = [];
let currentFilter = 'all';
let currentView = 'all';
let currentTag = null;
let userTags = [];
let settings = {
    theme: 'nature',
    fontSize: 'medium',
    autoSave: true,
    tutorialCompleted: false
};
let currentImages = [];
let selectedTags = [];
let currentImageIndex = 0;
let currentEntryImages = [];
let searchQuery = '';
let selectedEmotion = null;
let activeMenu = null;
let newAchievements = [];
let currentTutorialStep = 1;
const TOTAL_TUTORIAL_STEPS = 5;

let userAchievements = JSON.parse(localStorage.getItem('diaryAchievements')) || {};
let userAchievementsViewed = JSON.parse(localStorage.getItem('diaryAchievementsViewed')) || {};

const EMOTIONS = [
    { emoji: '😊', name: 'Счастье', color: '#FFD700' },
    { emoji: '😂', name: 'Смех', color: '#FF6B6B' },
    { emoji: '🥰', name: 'Любовь', color: '#FF69B4' },
    { emoji: '😢', name: 'Грусть', color: '#87CEEB' },
    { emoji: '😠', name: 'Злость', color: '#FF4500' },
    { emoji: '😨', name: 'Страх', color: '#9370DB' },
    { emoji: '😲', name: 'Удивление', color: '#32CD32' },
    { emoji: '😴', name: 'Сонливость', color: '#A9A9A9' },
    { emoji: '🤔', name: 'Размышление', color: '#808080' },
    { emoji: '🤩', name: 'Восхищение', color: '#FFD700' },
    { emoji: '😌', name: 'Спокойствие', color: '#98FB98' },
    { emoji: '😎', name: 'Уверенность', color: '#1E90FF' },
    { emoji: '🥺', name: 'Нежность', color: '#FFB6C1' },
    { emoji: '😤', name: 'Разочарование', color: '#FF6347' },
    { emoji: '🤯', name: 'Шок', color: '#8A2BE2' }
];

const DEFAULT_TAGS = ['Личное', 'Работа', 'Идеи', 'Воспоминания'];

// Вспомогательные функции
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getFilterName(filter) {
    const filterNames = {
        'all': 'Все',
        'today': 'Сегодня',
        'yesterday': 'Вчера',
        'week': 'Неделя',
        'month': 'Месяц'
    };
    return filterNames[filter] || 'Все';
}

document.addEventListener('DOMContentLoaded', function() {
    initData();
    checkAuth();
    applySettings();
    initImageUpload();
    initSearch();
    initPasswordToggles();
    loadRememberMeData();
    renderEmotionSelector();
    initEnterKeyHandlers();
    
    document.addEventListener('click', function(e) {
        if (activeMenu && !e.target.closest('.entry-menu') && !e.target.closest('.menu-dropdown')) {
            activeMenu.classList.remove('show');
            activeMenu = null;
        }
    });
});

function initData() {
    // Инициализация данных если они не существуют
    if (!localStorage.getItem('diaryUsers')) {
        localStorage.setItem('diaryUsers', JSON.stringify({}));
    }
    if (!localStorage.getItem('diaryAchievements')) {
        localStorage.setItem('diaryAchievements', JSON.stringify({}));
    }
    if (!localStorage.getItem('diaryAchievementsViewed')) {
        localStorage.setItem('diaryAchievementsViewed', JSON.stringify({}));
    }
    if (!localStorage.getItem('diaryUserSettings')) {
        localStorage.setItem('diaryUserSettings', JSON.stringify({}));
    }
}

function initEnterKeyHandlers() {
    document.getElementById('loginUsername').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
    document.getElementById('regUsername').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') register();
    });
    document.getElementById('regPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') register();
    });
    document.getElementById('regConfirmPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') register();
    });
    document.getElementById('newTagInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewTag();
        }
    });
    document.getElementById('entryTitle').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) saveEntry();
    });
    document.getElementById('entryContent').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) saveEntry();
    });
}

function showTutorial() {
    currentTutorialStep = 1;
    updateTutorialStep();
    document.getElementById('tutorialModal').style.display = 'flex';
    closeSettings();
}

function nextTutorialStep() {
    if (currentTutorialStep < TOTAL_TUTORIAL_STEPS) {
        currentTutorialStep++;
        updateTutorialStep();
    } else {
        finishTutorial();
    }
}

function prevTutorialStep() {
    if (currentTutorialStep > 1) {
        currentTutorialStep--;
        updateTutorialStep();
    }
}

function updateTutorialStep() {
    for (let i = 1; i <= TOTAL_TUTORIAL_STEPS; i++) {
        document.getElementById(`tutorialStep${i}`).classList.add('hidden');
    }
    document.getElementById(`tutorialStep${currentTutorialStep}`).classList.remove('hidden');
    document.getElementById('tutorialProgress').textContent = `Шаг ${currentTutorialStep} из ${TOTAL_TUTORIAL_STEPS}`;
    
    const prevBtn = document.getElementById('tutorialPrev');
    const nextBtn = document.getElementById('tutorialNext');
    
    if (currentTutorialStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
    }
    
    if (currentTutorialStep === TOTAL_TUTORIAL_STEPS) {
        nextBtn.textContent = 'Завершить';
    } else {
        nextBtn.textContent = 'Далее';
    }
}

function finishTutorial() {
    document.getElementById('tutorialModal').style.display = 'none';
    settings.tutorialCompleted = true;
    saveCurrentUserSettings();
}

function toggleMenu(entryId, element) {
    const dropdown = element.nextElementSibling;
    
    if (activeMenu && activeMenu !== dropdown) {
        activeMenu.classList.remove('show');
    }
    
    dropdown.classList.toggle('show');
    activeMenu = dropdown.classList.contains('show') ? dropdown : null;
    
    const editBtn = dropdown.querySelector('.menu-item:first-child');
    const deleteBtn = dropdown.querySelector('.menu-item.delete');
    
    editBtn.onclick = () => editEntry(entryId);
    deleteBtn.onclick = () => deleteEntry(entryId);
}

function renderEmotionSelector() {
    const container = document.getElementById('emotionSelector');
    container.innerHTML = '';
    
    const noEmotionOption = document.createElement('div');
    noEmotionOption.className = `emotion-option no-emotion ${!selectedEmotion ? 'selected' : ''}`;
    noEmotionOption.innerHTML = '❔';
    noEmotionOption.title = 'Без эмоции';
    noEmotionOption.onclick = () => selectEmotion(null);
    container.appendChild(noEmotionOption);
    
    EMOTIONS.forEach(emotion => {
        const emotionOption = document.createElement('div');
        emotionOption.className = `emotion-option ${selectedEmotion === emotion.emoji ? 'selected' : ''}`;
        emotionOption.innerHTML = emotion.emoji;
        emotionOption.title = emotion.name;
        emotionOption.style.backgroundColor = emotion.color;
        emotionOption.onclick = () => selectEmotion(emotion.emoji);
        container.appendChild(emotionOption);
    });
}

function selectEmotion(emotion) {
    selectedEmotion = emotion;
    renderEmotionSelector();
}

function loadRememberMeData() {
    const rememberMeData = JSON.parse(localStorage.getItem('rememberMeData')) || {};
    if (rememberMeData.username) {
        document.getElementById('loginUsername').value = rememberMeData.username;
        document.getElementById('rememberMe').checked = true;
    }
}

function saveRememberMeData(username) {
    const rememberMeData = { username: username, timestamp: Date.now() };
    localStorage.setItem('rememberMeData', JSON.stringify(rememberMeData));
}

function clearRememberMeData() {
    localStorage.removeItem('rememberMeData');
}

function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser && users[savedUser]) {
        currentUser = savedUser;
        loadUserSettings();
        // Инициализировать массив новых достижений
        newAchievements = [];
        showDiaryApp();
    } else {
        showAuthScreen();
    }
}

function showAuthScreen() {
    changeTheme('nature');
    document.body.classList.remove('diary-mode');
    document.body.style.overflow = 'hidden';
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('diaryApp').classList.add('hidden');
    showLogin();
}

function showDiaryApp() {
    document.body.classList.add('diary-mode');
    document.body.style.overflow = 'auto';
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('diaryApp').classList.remove('hidden');
    document.getElementById('currentUsername').textContent = currentUser;
    loadUserEntries();
    loadUserTags();
    updateStats();
    updateAchievementsProgress();
    checkAchievements();
    checkNewAchievements();
    
    if (!settings.tutorialCompleted) {
        setTimeout(() => showTutorial(), 1000);
    }
}

function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function initPasswordToggles() {
    const loginPasswordToggle = document.getElementById('loginPasswordToggle');
    const loginPasswordInput = document.getElementById('loginPassword');
    loginPasswordToggle.addEventListener('click', function() {
        togglePasswordVisibility(loginPasswordInput, loginPasswordToggle);
    });
    
    const regPasswordToggle = document.getElementById('regPasswordToggle');
    const regPasswordInput = document.getElementById('regPassword');
    regPasswordToggle.addEventListener('click', function() {
        togglePasswordVisibility(regPasswordInput, regPasswordToggle);
    });
    
    const regConfirmPasswordToggle = document.getElementById('regConfirmPasswordToggle');
    const regConfirmPasswordInput = document.getElementById('regConfirmPassword');
    regConfirmPasswordToggle.addEventListener('click', function() {
        togglePasswordVisibility(regConfirmPasswordInput, regConfirmPasswordToggle);
    });
}

function togglePasswordVisibility(passwordInput, toggleButton) {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordInput.type = 'password';
        toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!username || !password) {
        alert('Заполните все поля!');
        return;
    }

    if (users[username] && users[username].password === password) {
        currentUser = username;
        localStorage.setItem('currentUser', username);
        
        if (rememberMe) {
            saveRememberMeData(username);
        } else {
            clearRememberMeData();
        }
        
        loadUserSettings();
        showDiaryApp();
    } else {
        alert('Неверное имя пользователя или пароль!');
    }
}

function register() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
    const rememberMe = document.getElementById('rememberMeReg').checked;

    if (!username || !password) {
        alert('Заполните все поля!');
        return;
    }

    if (password !== confirmPassword) {
        alert('Пароли не совпадают!');
        return;
    }

    if (users[username]) {
        alert('Пользователь с таким именем уже существует!');
        return;
    }

    users[username] = {
        password: password,
        entries: [],
        tags: [...DEFAULT_TAGS],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };

    resetAchievementsForNewUser(username);
    
    const userSettings = {
        theme: 'nature',
        fontSize: 'medium',
        autoSave: true,
        tutorialCompleted: false
    };
    saveUserSettings(username, userSettings);
    
    settings = userSettings;
    applySettings();
    
    localStorage.setItem('diaryUsers', JSON.stringify(users));
    
    currentUser = username;
    localStorage.setItem('currentUser', username);
    
    if (rememberMe) saveRememberMeData(username);
    
    showDiaryApp();
    showNotification('Аккаунт успешно создан!', 'success');
}

function resetAchievementsForNewUser(username) {
    userAchievements[username] = {
        firstEntry: false,
        fiveEntries: false,
        tenEntries: false,
        twentyEntries: false,
        fiftyEntries: false,
        firstFavorite: false,
        fiveFavorites: false,
        firstImage: false,
        fiveImages: false,
        firstTag: false,
        fiveTags: false,
        themeChange: false,
        weekActivity: false,
        firstSearch: false,
        longEntry: false
    };
    
    userAchievementsViewed[username] = {};
    
    localStorage.setItem('diaryAchievements', JSON.stringify(userAchievements));
    localStorage.setItem('diaryAchievementsViewed', JSON.stringify(userAchievementsViewed));
}

function logout() {
    saveCurrentUserSettings();
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuthScreen();
}

function loadUserSettings() {
    const userSettings = JSON.parse(localStorage.getItem('diaryUserSettings')) || {};
    if (userSettings[currentUser]) {
        settings = userSettings[currentUser];
    } else {
        settings = {
            theme: 'nature',
            fontSize: 'medium',
            autoSave: true,
            tutorialCompleted: false
        };
        saveUserSettings(currentUser, settings);
    }
    applySettings();
}

function saveUserSettings(username, userSettings) {
    const allUserSettings = JSON.parse(localStorage.getItem('diaryUserSettings')) || {};
    allUserSettings[username] = userSettings;
    localStorage.setItem('diaryUserSettings', JSON.stringify(allUserSettings));
}

function saveCurrentUserSettings() {
    if (currentUser) {
        saveUserSettings(currentUser, settings);
    }
}

function showAllEntries() {
    currentView = 'all';
    currentTag = null;
    document.getElementById('pageTitle').textContent = 'Мои записи';
    updateNavigation('all');
    renderEntries();
}

function showFavorites() {
    currentView = 'favorites';
    currentTag = null;
    document.getElementById('pageTitle').textContent = 'Избранные записи';
    updateNavigation('favorites');
    renderEntries();
}

function showAchievements() {
    document.getElementById('achievementsModal').style.display = 'flex';
    renderAchievements();
    updateNavigation('achievements');
    markAllAchievementsAsViewed();
}

function closeAchievements() {
    document.getElementById('achievementsModal').style.display = 'none';
    showAllEntries();
}

function showSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    updateNavigation('settings');
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
    showAllEntries();
}

function filterByTag(tag, event) {
    if (!event) return;
    event.stopPropagation();
    
    if (currentTag === tag) {
        currentTag = null;
        document.getElementById('pageTitle').textContent = 'Мои записи';
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        renderEntries();
    } else {
        currentTag = tag;
        document.getElementById('pageTitle').textContent = `Тег: ${tag}`;
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        event.currentTarget.classList.add('active');
        renderEntries();
    }
}

function filterByTime(timeFilter) {
    currentFilter = timeFilter;
    document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');
    renderEntries();
}

function updateNavigation(activeView) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (activeView === 'all') document.querySelector('.nav-item:nth-child(1)').classList.add('active');
    else if (activeView === 'favorites') document.querySelector('.nav-item:nth-child(2)').classList.add('active');
    else if (activeView === 'achievements') document.querySelector('.nav-item:nth-child(3)').classList.add('active');
    else if (activeView === 'settings') document.querySelector('.nav-item:nth-child(4)').classList.add('active');
}

function loadUserTags() {
    if (currentUser && users[currentUser]) {
        if (!users[currentUser].tags) {
            users[currentUser].tags = [...DEFAULT_TAGS];
            localStorage.setItem('diaryUsers', JSON.stringify(users));
        }
        userTags = [...users[currentUser].tags];
    } else {
        userTags = [...DEFAULT_TAGS];
    }
    renderTags();
    renderTagSelector();
}

function saveUserTags() {
    if (currentUser && users[currentUser]) {
        users[currentUser].tags = [...userTags];
        localStorage.setItem('diaryUsers', JSON.stringify(users));
    }
}

function renderTags() {
    const container = document.getElementById('tagsContainer');
    container.innerHTML = '';
    
    userTags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        if (currentTag === tag) tagEl.classList.add('active');
        const safeTag = escapeHTML(tag);
        tagEl.innerHTML = `${safeTag}<button class="tag-remove" onclick="removeTag('${safeTag}')"><i class="fas fa-times"></i></button>`;
        tagEl.onclick = (e) => {
            if (!e.target.classList.contains('tag-remove')) filterByTag(tag, e);
        };
        container.appendChild(tagEl);
    });
}

function renderTagSelector() {
    const container = document.getElementById('tagsSelector');
    container.innerHTML = '';
    
    userTags.forEach(tag => {
        const tagEl = document.createElement('div');
        tagEl.className = 'tag-option';
        if (selectedTags.includes(tag)) tagEl.classList.add('selected');
        tagEl.textContent = tag;
        tagEl.onclick = () => toggleTagSelection(tag);
        container.appendChild(tagEl);
    });
}

function toggleTagSelection(tag) {
    const index = selectedTags.indexOf(tag);
    if (index === -1) selectedTags.push(tag);
    else selectedTags.splice(index, 1);
    renderTagSelector();
}

function addNewTag() {
    const input = document.getElementById('newTagInput');
    const tag = input.value.trim();
    
    if (!tag) {
        alert('Введите название тега!');
        return;
    }
    
    if (userTags.includes(tag)) {
        alert('Такой тег уже существует!');
        return;
    }
    
    userTags.push(tag);
    saveUserTags();
    renderTags();
    renderTagSelector();
    input.value = '';
    
    if (!getUserAchievement('firstTag')) setUserAchievement('firstTag', true);
    if (!getUserAchievement('fiveTags') && userTags.length >= 5) setUserAchievement('fiveTags', true);
}

function removeTag(tag) {
    if (confirm(`Удалить тег "${tag}"?`)) {
        userTags = userTags.filter(t => t !== tag);
        saveUserTags();
        
        if (currentTag === tag) {
            currentTag = null;
            document.getElementById('pageTitle').textContent = 'Мои записи';
        }
        
        renderTags();
        renderTagSelector();
        renderEntries();
    }
}

function initImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('imageInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    });
}

function handleFileSelect(e) {
    handleFiles(e.target.files);
}

function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.match('image.*') && !file.name.toLowerCase().endsWith('.gif')) {
            alert('Пожалуйста, выбирайте только изображения или GIF-файлы!');
            continue;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImages.push({
                name: file.name,
                data: e.target.result,
                isGif: file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')
            });
            updateImagePreviews();
        };
        reader.readAsDataURL(file);
    }
}

function updateImagePreviews() {
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    
    currentImages.forEach((image, index) => {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.innerHTML = `<img src="${image.data}" alt="${escapeHTML(image.name)}">
            ${image.isGif ? '<div class="gif-badge">GIF</div>' : ''}
            <button class="image-remove" onclick="removeImage(${index})"><i class="fas fa-times"></i></button>`;
        container.appendChild(preview);
    });
}

function removeImage(index) {
    currentImages.splice(index, 1);
    updateImagePreviews();
}

function clearImages() {
    currentImages = [];
    updateImagePreviews();
    document.getElementById('imageInput').value = '';
}

function openImageModalByEntryId(entryId) {
    const entry = entries.find(e => e.id === entryId);
    if (entry && entry.images && entry.images.length > 0) {
        openImageModal(entry.images);
    }
}

function openImageModal(images, index = 0) {
    currentEntryImages = images;
    currentImageIndex = index;
    updateImageModal();
    document.getElementById('imageModal').style.display = 'flex';
}

function updateImageModal() {
    if (currentEntryImages.length > 0) {
        document.getElementById('modalImage').src = currentEntryImages[currentImageIndex].data;
        document.getElementById('imageCounterModal').textContent = `${currentImageIndex + 1} / ${currentEntryImages.length}`;
        document.querySelector('.image-modal-prev').style.display = currentEntryImages.length > 1 ? 'flex' : 'none';
        document.querySelector('.image-modal-next').style.display = currentEntryImages.length > 1 ? 'flex' : 'none';
    }
}

function prevImage() {
    if (currentEntryImages.length > 1) {
        currentImageIndex = (currentImageIndex - 1 + currentEntryImages.length) % currentEntryImages.length;
        updateImageModal();
    }
}

function nextImage() {
    if (currentEntryImages.length > 1) {
        currentImageIndex = (currentImageIndex + 1) % currentEntryImages.length;
        updateImageModal();
    }
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
}

function loadUserEntries() {
    if (currentUser && users[currentUser]) {
        if (!users[currentUser].entries) {
            users[currentUser].entries = [];
            localStorage.setItem('diaryUsers', JSON.stringify(users));
        }
        entries = users[currentUser].entries || [];
        // Сортируем записи по дате (новые сначала)
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        renderEntries();
    }
}

function saveUserEntries() {
    if (currentUser && users[currentUser]) {
        // Сортируем перед сохранением
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        users[currentUser].entries = entries;
        localStorage.setItem('diaryUsers', JSON.stringify(users));
        updateStats();
        checkAchievements();
    }
}

function updateStats() {
    document.getElementById('entriesCount').textContent = entries.length;
    
    const now = new Date();
    const thisMonth = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    }).length;
    
    const thisWeek = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return entryDate >= weekStart;
    }).length;

    const favoritesCount = entries.filter(entry => entry.favorite).length;
    
    document.getElementById('monthEntries').textContent = thisMonth;
    document.getElementById('weekEntries').textContent = thisWeek;
    document.getElementById('favoritesCount').textContent = favoritesCount;
}

function getFilteredEntries() {
    let filteredEntries = [...entries];
    const now = new Date();
    
    if (currentFilter === 'today') {
        filteredEntries = filteredEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.toDateString() === now.toDateString();
        });
    } else if (currentFilter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        filteredEntries = filteredEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.toDateString() === yesterday.toDateString();
        });
    } else if (currentFilter === 'week') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        filteredEntries = filteredEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekStart;
        });
    } else if (currentFilter === 'month') {
        filteredEntries = filteredEntries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
        });
    }

    if (currentView === 'favorites') filteredEntries = filteredEntries.filter(entry => entry.favorite);
    if (currentTag) filteredEntries = filteredEntries.filter(entry => entry.tags && entry.tags.includes(currentTag));

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEntries = filteredEntries.filter(entry => {
            const titleMatch = entry.title.toLowerCase().includes(query);
            const contentMatch = entry.content && entry.content.toLowerCase().includes(query);
            const tagsMatch = entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(query));
            const emotionMatch = entry.emotion && EMOTIONS.some(e => e.emoji === entry.emotion && e.name.toLowerCase().includes(query));
            return titleMatch || contentMatch || tagsMatch || emotionMatch;
        });
    }

    return filteredEntries;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function highlightText(text, query) {
    if (!query || !text) return escapeHTML(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapeHTML(text).replace(regex, '<span class="highlight">$1</span>');
}

function renderEntries() {
    const container = document.getElementById('entriesContainer');
    container.innerHTML = '';

    // Убедимся, что записи отсортированы по дате
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    const filteredEntries = getFilteredEntries();

    if (filteredEntries.length === 0) {
        let message = 'Записей пока нет';
        if (currentView === 'favorites') message = 'Нет избранных записей';
        else if (currentTag) message = `Нет записей с тегом "${currentTag}"`;
        else if (currentFilter !== 'all') message = `Нет записей за выбранный период`;
        else if (searchQuery) message = `По запросу "${searchQuery}" ничего не найдено`;

        container.innerHTML = `<div class="empty-state"><h3>${message}</h3><p>Нажмите "+" чтобы добавить новую запись</p></div>`;
        return;
    }

    filteredEntries.forEach(entry => {
        const formattedDate = formatDate(entry.date);
        let imageHTML = '';
        
        if (entry.images && entry.images.length > 0) {
            const hasMultipleImages = entry.images.length > 1;
            const hasGif = entry.images.some(img => img.isGif);
            imageHTML = `<div class="entry-image-container">
                <img src="${entry.images[0].data}" alt="${escapeHTML(entry.images[0].name)}" class="entry-image" onclick="openImageModalByEntryId('${entry.id}')">
                ${hasGif ? '<div class="gif-badge">GIF</div>' : ''}
                ${hasMultipleImages ? `<div class="image-counter">+${entry.images.length - 1}</div>` : ''}</div>`;
        }
        
        const emotionHTML = entry.emotion ? 
            `<div class="entry-emotion" title="${EMOTIONS.find(e => e.emoji === entry.emotion)?.name || 'Эмоция'}">${entry.emotion}</div>` :
            `<div class="entry-emotion no-emotion" title="Без эмоции">❔</div>`;
        
        const highlightedTitle = highlightText(entry.title, searchQuery);
        const highlightedContent = entry.content ? highlightText(entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''), searchQuery) : '';
        const highlightedTags = entry.tags ? highlightText(entry.tags.join(', '), searchQuery) : '';
        
        const entryEl = document.createElement('div');
        entryEl.className = 'entry-card';
        entryEl.innerHTML = `<div class="entry-header"><div style="flex: 1;">
                <div class="entry-title">${highlightedTitle}</div>
                <div class="entry-date">${formattedDate}</div>
                ${highlightedTags ? `<div style="font-size: 0.75em; color: var(--primary-light); margin-top: 5px;">${highlightedTags}</div>` : ''}
            </div></div>
            ${highlightedContent ? `<div class="entry-content">${highlightedContent}</div>` : ''}
            ${imageHTML}
            <button class="entry-menu" onclick="toggleMenu('${entry.id}', this)"><i class="fas fa-ellipsis-v"></i></button>
            <div class="menu-dropdown">
                <button class="menu-item"><i class="fas fa-edit"></i>Редактировать</button>
                <button class="menu-item delete"><i class="fas fa-trash"></i>Удалить</button>
            </div>
            ${emotionHTML}
            <div class="entry-actions">
                <button class="action-btn favorite-btn ${entry.favorite ? 'active' : ''}" onclick="toggleFavorite('${entry.id}', this)">
                    <i class="fas fa-star"></i>${entry.favorite ? 'В избранном' : 'В избранное'}
                </button>
            </div>`;
        container.appendChild(entryEl);
    });
}

function toggleFavorite(entryId, buttonElement) {
    const entryIndex = entries.findIndex(e => e.id === entryId);
    if (entryIndex !== -1) {
        entries[entryIndex].favorite = !entries[entryIndex].favorite;
        saveUserEntries();
        
        // Немедленно обновляем кнопку, которую нажали
        if (buttonElement) {
            buttonElement.classList.toggle('active');
            buttonElement.innerHTML = entries[entryIndex].favorite 
                ? '<i class="fas fa-star"></i>В избранном' 
                : '<i class="fas fa-star"></i>В избранное';
        }
        
        // Сбрасываем все фильтры и поиск при перерисовке
        const tempFilter = currentFilter;
        const tempTag = currentTag;
        const tempQuery = searchQuery;
        
        // Временно показываем все записи
        currentFilter = 'all';
        currentTag = null;
        searchQuery = '';
        
        // Перерисовываем записи
        renderEntries();
        
        // Восстанавливаем фильтры
        currentFilter = tempFilter;
        currentTag = tempTag;
        searchQuery = tempQuery;
        
        // Обновляем кнопки фильтров
        document.querySelectorAll('.filter-item').forEach(item => {
            item.classList.toggle('active', item.textContent.includes(getFilterName(tempFilter)));
        });
        
        // Обновляем статистику
        updateStats();
        
        if (!getUserAchievement('firstFavorite') && entries[entryIndex].favorite) setUserAchievement('firstFavorite', true);
        if (!getUserAchievement('fiveFavorites')) {
            const favoritesCount = entries.filter(entry => entry.favorite).length;
            if (favoritesCount >= 5) setUserAchievement('fiveFavorites', true);
        }
        
        // Показываем уведомление
        const action = entries[entryIndex].favorite ? 'добавлена в' : 'удалена из';
        showNotification(`Запись ${action} избранное!`, 'success');
    }
}

function openEditor(entryId = null) {
    const modal = document.getElementById('editorModal');
    const titleInput = document.getElementById('entryTitle');
    const contentInput = document.getElementById('entryContent');
    const editorTitle = document.getElementById('editorTitle');
    
    clearImages();
    selectedTags = [];
    selectedEmotion = null;
    
    if (entryId) {
        const entry = entries.find(e => e.id === entryId);
        if (entry) {
            titleInput.value = entry.title;
            contentInput.value = entry.content || '';
            if (entry.tags) selectedTags = [...entry.tags];
            if (entry.emotion) selectedEmotion = entry.emotion;
            if (entry.images) {
                currentImages = [...entry.images];
                updateImagePreviews();
            }
            editorTitle.innerHTML = '<i class="fas fa-edit"></i> Редактировать запись';
            modal.dataset.editingId = entryId;
        }
    } else {
        titleInput.value = '';
        contentInput.value = '';
        editorTitle.innerHTML = '<i class="fas fa-edit"></i> Новая запись';
        delete modal.dataset.editingId;
    }
    
    renderTagSelector();
    renderEmotionSelector();
    modal.style.display = 'flex';
}

function closeEditor() {
    const modal = document.getElementById('editorModal');
    modal.style.display = 'none';
    
    // Сбрасываем все поля формы
    document.getElementById('entryTitle').value = '';
    document.getElementById('entryContent').value = '';
    document.getElementById('editorTitle').innerHTML = '<i class="fas fa-edit"></i> Новая запись';
    
    // Удаляем идентификатор редактирования
    delete modal.dataset.editingId;
    
    // Сбрасываем состояние
    clearImages();
    selectedTags = [];
    selectedEmotion = null;
    
    // Перерисовываем селекторы
    renderTagSelector();
    renderEmotionSelector();
}

function saveEntry() {
    const title = document.getElementById('entryTitle').value.trim();
    const content = document.getElementById('entryContent').value.trim();
    const modal = document.getElementById('editorModal');
    const editingId = modal.dataset.editingId;

    if (!title) {
        alert('Заполните заголовок!');
        return;
    }

    // Проверяем, не редактируем ли мы существующую запись
    if (editingId) {
        const entryIndex = entries.findIndex(e => e.id === editingId);
        if (entryIndex !== -1) {
            // Обновляем существующую запись
            entries[entryIndex] = {
                ...entries[entryIndex],
                title: title,
                content: content,
                tags: [...selectedTags],
                emotion: selectedEmotion,
                images: [...currentImages],
                date: new Date().toISOString() // Обновляем дату редактирования
            };
        }
    } else {
        // Создаем новую запись с уникальным ID
        const newEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Более уникальный ID
            title: title,
            content: content,
            tags: [...selectedTags],
            emotion: selectedEmotion,
            images: [...currentImages],
            favorite: false,
            date: new Date().toISOString()
        };
        entries.unshift(newEntry);
    }

    // Сразу сохраняем и обновляем интерфейс
    saveUserEntries();
    renderEntries();
    updateStats();
    
    // Закрываем модальное окно
    closeEditor();
    
    // Показываем уведомление
    showNotification(editingId ? 'Запись обновлена!' : 'Запись создана!', 'success');
    
    // Проверяем достижения
    checkAchievements();
}

function editEntry(entryId) {
    // Закрываем активное меню, если оно открыто
    if (activeMenu) {
        activeMenu.classList.remove('show');
        activeMenu = null;
    }
    
    // Открываем редактор
    openEditor(entryId);
}

function deleteEntry(entryId) {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        entries = entries.filter(entry => entry.id !== entryId);
        saveUserEntries();
        
        // Принудительно обновляем отображение
        renderEntries();
        updateStats();
        
        showNotification('Запись удалена!', 'success');
    }
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    searchInput.addEventListener('input', function() {
        searchQuery = this.value.trim();
        searchClear.style.display = searchQuery ? 'block' : 'none';
        document.getElementById('pageTitle').textContent = searchQuery ? `Результаты поиска: "${searchQuery}"` : 'Мои записи';
        if (!getUserAchievement('firstSearch') && searchQuery.length > 0) setUserAchievement('firstSearch', true);
        renderEntries();
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchQuery = this.value.trim();
            renderEntries();
        }
    });
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    searchQuery = '';
    document.getElementById('searchClear').style.display = 'none';
    document.getElementById('pageTitle').textContent = 'Мои записи';
    renderEntries();
}

function applySettings() {
    changeTheme(settings.theme);
    document.getElementById('themeSelect').value = settings.theme;
    document.getElementById('fontSizeSelect').value = settings.fontSize;
    document.getElementById('autoSaveSelect').value = settings.autoSave.toString();
    changeFontSize(settings.fontSize);
}

function changeTheme(theme) {
    settings.theme = theme;
    document.body.classList.remove(
        'theme-nature', 'theme-dark-nature', 'theme-earth', 'theme-dark-earth',
        'theme-mystic', 'theme-dark-mystic', 'theme-ocean', 'theme-dark-ocean',
        'theme-lavender-sky', 'theme-dark-lavender'
    );
    document.body.classList.add(`theme-${theme}`);
    
    const authScreen = document.getElementById('authScreen');
    if (authScreen) authScreen.style.background = `linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)`;
    
    if (!getUserAchievement('themeChange') && theme !== 'nature') setUserAchievement('themeChange', true);
    
    // Сохраняем настройки
    if (currentUser) {
        saveCurrentUserSettings();
    }
}

function changeFontSize(size) {
    settings.fontSize = size;
    let fontSize;
    switch(size) {
        case 'small': fontSize = '14px'; break;
        case 'medium': fontSize = '16px'; break;
        case 'large': fontSize = '18px'; break;
        default: fontSize = '16px';
    }
    
    document.documentElement.style.setProperty('--base-font-size', fontSize);
}

function toggleAutoSave(value) {
    settings.autoSave = value === 'true';
}

function saveSettings() {
    saveCurrentUserSettings();
    showNotification('Настройки сохранены!', 'success');
    closeSettings();
}

function getUserAchievement(achievementId) {
    if (!userAchievements[currentUser]) {
        userAchievements[currentUser] = {};
    }
    return userAchievements[currentUser][achievementId] || false;
}

function setUserAchievement(achievementId, achieved) {
    if (!userAchievements[currentUser]) userAchievements[currentUser] = {};
    
    if (!userAchievements[currentUser][achievementId] && achieved) {
        userAchievements[currentUser][achievementId] = true;
        if (!newAchievements.includes(achievementId)) newAchievements.push(achievementId);
        checkNewAchievements();
        saveAchievements();
        updateAchievementsProgress();
        showAchievementNotification(achievementId);
    }
}

function checkAchievements() {
    if (!getUserAchievement('firstEntry') && entries.length >= 1) setUserAchievement('firstEntry', true);
    if (!getUserAchievement('fiveEntries') && entries.length >= 5) setUserAchievement('fiveEntries', true);
    if (!getUserAchievement('tenEntries') && entries.length >= 10) setUserAchievement('tenEntries', true);
    if (!getUserAchievement('twentyEntries') && entries.length >= 20) setUserAchievement('twentyEntries', true);
    if (!getUserAchievement('fiftyEntries') && entries.length >= 50) setUserAchievement('fiftyEntries', true);
    
    const entriesWithImages = entries.filter(entry => entry.images && entry.images.length > 0);
    if (!getUserAchievement('firstImage') && entriesWithImages.length >= 1) setUserAchievement('firstImage', true);
    if (!getUserAchievement('fiveImages') && entriesWithImages.length >= 5) setUserAchievement('fiveImages', true);
    
    if (!getUserAchievement('longEntry')) {
        const longEntry = entries.find(entry => entry.content && entry.content.length > 500);
        if (longEntry) setUserAchievement('longEntry', true);
    }
    
    if (!getUserAchievement('weekActivity')) {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        const entriesThisWeek = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekAgo;
        });
        if (entriesThisWeek.length >= 7) setUserAchievement('weekActivity', true);
    }
}

function saveAchievements() {
    localStorage.setItem('diaryAchievements', JSON.stringify(userAchievements));
}

function updateAchievementsProgress() {
    if (!userAchievements[currentUser]) return;
    const earnedCount = Object.values(userAchievements[currentUser]).filter(achieved => achieved).length;
    const progressPercentage = (earnedCount / 20) * 100;
    document.getElementById('earnedAchievements').textContent = earnedCount;
    document.getElementById('achievementProgressBar').style.width = `${progressPercentage}%`;
}

function checkNewAchievements() {
    const notificationDot = document.getElementById('achievementsNotification');
    notificationDot.classList[newAchievements.length > 0 ? 'add' : 'remove']('show');
}

function markAllAchievementsAsViewed() {
    if (!userAchievementsViewed[currentUser]) userAchievementsViewed[currentUser] = {};
    Object.keys(userAchievements[currentUser] || {}).forEach(achievementId => {
        userAchievementsViewed[currentUser][achievementId] = true;
    });
    newAchievements = [];
    localStorage.setItem('diaryAchievementsViewed', JSON.stringify(userAchievementsViewed));
    checkNewAchievements();
}

function showAchievementNotification(achievementId) {
    const achievementNames = {
        'firstEntry': 'Первая запись',
        'fiveEntries': '5 записей',
        'tenEntries': '10 записей',
        'twentyEntries': '20 записей',
        'fiftyEntries': '50 записей',
        'firstFavorite': 'Первое избранное',
        'fiveFavorites': '5 избранных',
        'firstImage': 'Первое изображение',
        'fiveImages': '5 изображений',
        'firstTag': 'Первый тег',
        'fiveTags': '5 тегов',
        'longEntry': 'Длинная запись',
        'firstSearch': 'Первый поиск',
        'themeChange': 'Смена темы',
        'weekActivity': 'Активная неделя'
    };
    
    const toast = document.getElementById('notificationToast');
    const title = document.getElementById('notificationTitle');
    const message = document.getElementById('notificationMessage');
    
    title.textContent = 'Новое достижение!';
    message.textContent = `Получено достижение: "${achievementNames[achievementId] || achievementId}"`;
    toast.classList.add('show');
    setTimeout(() => closeNotification(), 5000);
}

function showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const title = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');
    
    title.textContent = type === 'success' ? 'Успешно!' : 'Информация';
    messageEl.textContent = message;
    toast.className = 'notification-toast' + (type === 'success' ? ' success' : '');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function closeNotification() {
    document.getElementById('notificationToast').classList.remove('show');
}

function renderAchievements() {
    const container = document.getElementById('achievementsContainer');
    container.innerHTML = '';
    
    const achievements = [
        { id: 'firstEntry', text: 'Первая запись', progress: entries.length >= 1 ? '1/1' : '0/1' },
        { id: 'fiveEntries', text: '5 записей', progress: entries.length >= 5 ? '5/5' : `${entries.length}/5` },
        { id: 'tenEntries', text: '10 записей', progress: entries.length >= 10 ? '10/10' : `${entries.length}/10` },
        { id: 'twentyEntries', text: '20 записей', progress: entries.length >= 20 ? '20/20' : `${entries.length}/20` },
        { id: 'fiftyEntries', text: '50 записей', progress: entries.length >= 50 ? '50/50' : `${entries.length}/50` },
        { id: 'firstFavorite', text: 'Первое избранное', progress: entries.filter(e => e.favorite).length >= 1 ? '1/1' : '0/1' },
        { id: 'fiveFavorites', text: '5 избранных', progress: entries.filter(e => e.favorite).length >= 5 ? '5/5' : `${entries.filter(e => e.favorite).length}/5` },
        { id: 'firstImage', text: 'Первое изображение', progress: entries.filter(e => e.images && e.images.length > 0).length >= 1 ? '1/1' : '0/1' },
        { id: 'fiveImages', text: '5 изображений', progress: entries.filter(e => e.images && e.images.length > 0).length >= 5 ? '5/5' : `${entries.filter(e => e.images && e.images.length > 0).length}/5` },
        { id: 'firstTag', text: 'Первый тег', progress: userTags.length >= 1 ? '1/1' : '0/1' },
        { id: 'fiveTags', text: '5 тегов', progress: userTags.length >= 5 ? '5/5' : `${userTags.length}/5` },
        { id: 'longEntry', text: 'Длинная запись (500+ символов)', progress: entries.some(e => e.content && e.content.length > 500) ? '1/1' : '0/1' },
        { id: 'firstSearch', text: 'Первый поиск', progress: getUserAchievement('firstSearch') ? '1/1' : '0/1' },
        { id: 'themeChange', text: 'Смена темы', progress: getUserAchievement('themeChange') ? '1/1' : '0/1' },
        { id: 'weekActivity', text: 'Активная неделя (7 записей за 7 дней)', progress: getUserAchievement('weekActivity') ? '7/7' : '0/7' }
    ];
    
    achievements.forEach(achievement => {
        const isEarned = getUserAchievement(achievement.id);
        const achievementEl = document.createElement('div');
        achievementEl.className = 'achievement-item';
        achievementEl.innerHTML = `<i class="fas fa-star achievement-star ${isEarned ? 'earned' : ''}"></i>
            <span class="achievement-text">${achievement.text}</span>
            <span class="achievement-progress">${achievement.progress}</span>`;
        container.appendChild(achievementEl);
    });
}

// Закрытие модальных окон при клике вне контента
document.getElementById('editorModal').addEventListener('click', function(e) {
    if (e.target === this) closeEditor();
});

document.getElementById('settingsModal').addEventListener('click', function(e) {
    if (e.target === this) closeSettings();
});

document.getElementById('achievementsModal').addEventListener('click', function(e) {
    if (e.target === this) closeAchievements();
});

document.getElementById('imageModal').addEventListener('click', function(e) {
    if (e.target === this) closeImageModal();
});

document.getElementById('tutorialModal').addEventListener('click', function(e) {
    if (e.target === this) finishTutorial();
});

document.addEventListener('keydown', function(e) {
    if (document.getElementById('imageModal').style.display === 'flex') {
        if (e.key === 'ArrowLeft') prevImage();
        else if (e.key === 'ArrowRight') nextImage();
        else if (e.key === 'Escape') closeImageModal();
    }
});

// Автоматическое обновление интерфейса при возвращении фокуса
window.addEventListener('focus', function() {
    // Перезагружаем данные пользователя
    if (currentUser) {
        loadUserEntries();
        updateStats();
        checkAchievements();
    }
});

// Убедитесь, что модальные окна закрываются правильно
window.addEventListener('click', function(e) {
    const editorModal = document.getElementById('editorModal');
    const settingsModal = document.getElementById('settingsModal');
    const achievementsModal = document.getElementById('achievementsModal');
    const imageModal = document.getElementById('imageModal');
    
    if (editorModal.style.display === 'flex' && e.target === editorModal) {
        closeEditor();
    }
    if (settingsModal.style.display === 'flex' && e.target === settingsModal) {
        closeSettings();
    }
    if (achievementsModal.style.display === 'flex' && e.target === achievementsModal) {
        closeAchievements();
    }
    if (imageModal.style.display === 'flex' && e.target === imageModal) {
        closeImageModal();
    }
});