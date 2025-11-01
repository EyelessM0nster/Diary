// Глобальные переменные для состояния приложения
let users = JSON.parse(localStorage.getItem('diaryUsers')) || {};
let currentUser = null;
let entries = [];
let currentFilter = 'all';
let currentView = 'all';
let currentTag = null;
let userTags = JSON.parse(localStorage.getItem('diaryTags')) || ['Личное', 'Работа', 'Идеи', 'Воспоминания'];
let settings = JSON.parse(localStorage.getItem('diarySettings')) || {
    theme: 'nature',
    fontSize: 'medium',
    autoSave: true,
    notifications: {
        enabled: false,
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        sound: true,
        repeat: false
    },
    tutorialCompleted: false
};
let currentImages = []; // Массив для хранения изображений текущей записи
let selectedTags = []; // Массив для хранения выбранных тегов
let currentImageIndex = 0; // Текущий индекс изображения в модальном окне
let currentEntryImages = []; // Изображения текущей просматриваемой записи
let searchQuery = ''; // Текущий поисковый запрос
let selectedEmotion = null; // Выбранная эмоция для текущей записи
let activeMenu = null; // Активное меню
let notificationInterval = null; // Интервал для проверки уведомлений
let newAchievements = []; // Массив новых достижений
let currentTutorialStep = 1; // Текущий шаг туториала
const TOTAL_TUTORIAL_STEPS = 5; // Общее количество шагов туториала

// Достижения пользователя
let userAchievements = JSON.parse(localStorage.getItem('diaryAchievements')) || {};
let userAchievementsViewed = JSON.parse(localStorage.getItem('diaryAchievementsViewed')) || {};

// Список доступных эмоций
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

// Ключи для localStorage
const STORAGE_KEYS = {
    USERS: 'diaryUsers',
    CURRENT_USER: 'currentUser',
    TAGS: 'diaryTags',
    SETTINGS: 'diarySettings',
    REMEMBER_ME: 'rememberMeData',
    ACHIEVEMENTS: 'diaryAchievements',
    ACHIEVEMENTS_VIEWED: 'diaryAchievementsViewed'
};

// Загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    applySettings();
    initImageUpload();
    initSearch();
    initPasswordToggles();
    loadRememberMeData();
    renderEmotionSelector();
    initNotifications();
    initEnterKeyHandlers();
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', function(e) {
        if (activeMenu && !e.target.closest('.entry-menu') && !e.target.closest('.menu-dropdown')) {
            activeMenu.classList.remove('show');
            activeMenu = null;
        }
    });
});

// Инициализация обработчиков клавиши Enter
function initEnterKeyHandlers() {
    // Обработчик Enter для формы входа
    document.getElementById('loginUsername').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('loginPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });

    // Обработчик Enter для формы регистрации
    document.getElementById('regUsername').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            register();
        }
    });
    
    document.getElementById('regPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            register();
        }
    });
    
    document.getElementById('regConfirmPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            register();
        }
    });

    // Обработчик Enter для добавления тега
    document.getElementById('newTagInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewTag();
        }
    });

    // Обработчик Enter для редактора записей
    document.getElementById('entryTitle').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            saveEntry();
        }
    });
    
    document.getElementById('entryContent').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            saveEntry();
        }
    });

    // Обработчик Enter для настроек
    document.getElementById('themeSelect').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveSettings();
        }
    });
}

// Функции для туториала
function showTutorial() {
    currentTutorialStep = 1;
    updateTutorialStep();
    document.getElementById('tutorialModal').style.display = 'flex';
    closeSettings(); // Закрываем настройки, если открыты
}

function nextTutorialStep() {
    if (currentTutorialStep < TOTAL_TUTORIAL_STEPS) {
        currentTutorialStep++;
        updateTutorialStep();
    }
}

function prevTutorialStep() {
    if (currentTutorialStep > 1) {
        currentTutorialStep--;
        updateTutorialStep();
    }
}

function updateTutorialStep() {
    // Скрываем все шаги
    for (let i = 1; i <= TOTAL_TUTORIAL_STEPS; i++) {
        document.getElementById(`tutorialStep${i}`).classList.add('hidden');
    }
    
    // Показываем текущий шаг
    document.getElementById(`tutorialStep${currentTutorialStep}`).classList.remove('hidden');
    
    // Обновляем прогресс
    document.getElementById('tutorialProgress').textContent = `Шаг ${currentTutorialStep} из ${TOTAL_TUTORIAL_STEPS}`;
    
    // Обновляем кнопки навигации
    const prevBtn = document.getElementById('tutorialPrev');
    const nextBtn = document.getElementById('tutorialNext');
    const finishBtn = document.getElementById('tutorialFinish');
    
    if (currentTutorialStep === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'flex';
        finishBtn.classList.add('hidden');
    } else if (currentTutorialStep === TOTAL_TUTORIAL_STEPS) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'none';
        finishBtn.classList.remove('hidden');
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        finishBtn.classList.add('hidden');
    }
}

function finishTutorial() {
    document.getElementById('tutorialModal').style.display = 'none';
    settings.tutorialCompleted = true;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Инициализация уведомлений
function initNotifications() {
    // Останавливаем предыдущий интервал, если он был
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    
    // Запускаем проверку уведомлений каждую минуту
    notificationInterval = setInterval(checkNotificationTime, 60000);
    
    // Проверяем сразу при загрузке
    checkNotificationTime();
}

// Проверка времени для уведомлений
function checkNotificationTime() {
    if (!settings.notifications.enabled || !currentUser) return;
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    
    // Проверяем дату и время
    const notificationDateTime = settings.notifications.date + 'T' + settings.notifications.time;
    const notificationDate = new Date(notificationDateTime);
    
    // Если включено повторение, проверяем только время
    if (settings.notifications.repeat) {
        if (currentTime === settings.notifications.time) {
            showNotification();
        }
    } else {
        // Проверяем и дату и время
        if (currentDate === settings.notifications.date && currentTime === settings.notifications.time) {
            showNotification();
        }
    }
}

// Показать уведомление
function showNotification() {
    const toast = document.getElementById('notificationToast');
    const title = document.getElementById('notificationTitle');
    const message = document.getElementById('notificationMessage');
    
    title.textContent = 'Напоминание';
    message.textContent = 'Пора сделать запись в дневнике! Вспомните о вашем дне и сохраните воспоминания.';
    
    toast.classList.add('show');
    
    // Воспроизвести звук, если включен
    if (settings.notifications.sound) {
        playNotificationSound();
    }
    
    // Автоматически скрыть через 10 секунд
    setTimeout(() => {
        closeNotification();
    }, 10000);
}

// Закрыть уведомление
function closeNotification() {
    document.getElementById('notificationToast').classList.remove('show');
}

// Воспроизвести звук уведомления
function playNotificationSound() {
    // Создаем простой звук с помощью Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log('Web Audio API не поддерживается');
    }
}

// Переключение уведомлений
function toggleNotifications(enabled) {
    const notificationSettings = document.getElementById('notificationSettings');
    
    if (enabled) {
        notificationSettings.classList.remove('hidden');
    } else {
        notificationSettings.classList.add('hidden');
    }
}

// Функции для работы с меню
function toggleMenu(entryId, element) {
    const dropdown = element.nextElementSibling;
    
    // Закрываем предыдущее активное меню
    if (activeMenu && activeMenu !== dropdown) {
        activeMenu.classList.remove('show');
    }
    
    // Переключаем текущее меню
    dropdown.classList.toggle('show');
    activeMenu = dropdown.classList.contains('show') ? dropdown : null;
    
    // Устанавливаем обработчики для пунктов меню
    const editBtn = dropdown.querySelector('.menu-item:first-child');
    const deleteBtn = dropdown.querySelector('.menu-item.delete');
    
    editBtn.onclick = () => editEntry(entryId);
    deleteBtn.onclick = () => deleteEntry(entryId);
}

// Рендер селектора эмоций
function renderEmotionSelector() {
    const container = document.getElementById('emotionSelector');
    container.innerHTML = '';
    
    // Добавляем опцию "Без эмоции"
    const noEmotionOption = document.createElement('div');
    noEmotionOption.className = `emotion-option no-emotion ${!selectedEmotion ? 'selected' : ''}`;
    noEmotionOption.innerHTML = '❔';
    noEmotionOption.title = 'Без эмоции';
    noEmotionOption.onclick = () => selectEmotion(null);
    container.appendChild(noEmotionOption);
    
    // Добавляем все эмоции
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

// Выбор эмоции
function selectEmotion(emotion) {
    selectedEmotion = emotion;
    renderEmotionSelector();
}

// Загрузка данных "Запомнить меня"
function loadRememberMeData() {
    const rememberMeData = JSON.parse(localStorage.getItem(STORAGE_KEYS.REMEMBER_ME)) || {};
    if (rememberMeData.username) {
        document.getElementById('loginUsername').value = rememberMeData.username;
        document.getElementById('rememberMe').checked = true;
    }
}

// Сохранение данных "Запомнить меня"
function saveRememberMeData(username) {
    const rememberMeData = {
        username: username,
        timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, JSON.stringify(rememberMeData));
}

// Очистка данных "Запомнить меня"
function clearRememberMeData() {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
}

function checkAuth() {
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedUser && users[savedUser]) {
        currentUser = savedUser;
        showDiaryApp();
    } else {
        showAuthScreen();
    }
}

function showAuthScreen() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('diaryApp').classList.add('hidden');
    showLogin();
}

function showDiaryApp() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('diaryApp').classList.remove('hidden');
    document.getElementById('currentUsername').textContent = currentUser;
    loadUserEntries();
    renderTags();
    updateStats();
    updateAchievementsProgress();
    checkNewAchievements();
    
    // Показываем туториал для новых пользователей
    if (!settings.tutorialCompleted) {
        setTimeout(() => {
            showTutorial();
        }, 1000);
    }
    
    // Загружаем настройки уведомлений
    const notificationToggle = document.getElementById('notificationToggle');
    const notificationDate = document.getElementById('notificationDate');
    const notificationTime = document.getElementById('notificationTime');
    const notificationSound = document.getElementById('notificationSound');
    const notificationRepeat = document.getElementById('notificationRepeat');
    
    if (notificationToggle && settings.notifications) {
        notificationToggle.checked = settings.notifications.enabled;
        toggleNotifications(settings.notifications.enabled);
        
        if (settings.notifications.date) {
            notificationDate.value = settings.notifications.date;
        } else {
            // Устанавливаем сегодняшнюю дату по умолчанию
            const today = new Date().toISOString().split('T')[0];
            notificationDate.value = today;
            settings.notifications.date = today;
        }
        
        if (settings.notifications.time) {
            notificationTime.value = settings.notifications.time;
        }
        
        if (settings.notifications.sound !== undefined) {
            notificationSound.checked = settings.notifications.sound;
        }
        
        if (settings.notifications.repeat !== undefined) {
            notificationRepeat.checked = settings.notifications.repeat;
        }
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

// Функция для инициализации переключателей видимости пароля
function initPasswordToggles() {
    // Для формы входа
    const loginPasswordToggle = document.getElementById('loginPasswordToggle');
    const loginPasswordInput = document.getElementById('loginPassword');
    
    loginPasswordToggle.addEventListener('click', function() {
        togglePasswordVisibility(loginPasswordInput, loginPasswordToggle);
    });
    
    // Для формы регистрации - пароль
    const regPasswordToggle = document.getElementById('regPasswordToggle');
    const regPasswordInput = document.getElementById('regPassword');
    
    regPasswordToggle.addEventListener('click', function() {
        togglePasswordVisibility(regPasswordInput, regPasswordToggle);
    });
    
    // Для формы регистрации - подтверждение пароля
    const regConfirmPasswordToggle = document.getElementById('regConfirmPasswordToggle');
    const regConfirmPasswordInput = document.getElementById('regConfirmPassword');
    
    regConfirmPasswordToggle.addEventListener('click', function() {
        togglePasswordVisibility(regConfirmPasswordInput, regConfirmPasswordToggle);
    });
}

// Функция переключения видимости пароля
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
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
        
        // Сохранение данных для "Запомнить меня"
        if (rememberMe) {
            saveRememberMeData(username);
        } else {
            clearRememberMeData();
        }
        
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

    // Создание нового пользователя с пустыми достижениями
    users[username] = {
        password: password,
        entries: [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };

    // Сбрасываем достижения для нового пользователя
    resetAchievementsForNewUser(username);

    // Сбрасываем теги для нового пользователя (используем стандартные теги)
    userTags = ['Личное', 'Работа', 'Идеи', 'Воспоминания'];
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(userTags));

    // Устанавливаем тему по умолчанию для нового пользователя
    settings.theme = 'nature';
    settings.tutorialCompleted = false; // Сбрасываем туториал для нового пользователя
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

    // Сохранение в localStorage
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    currentUser = username;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
    
    // Сохранение данных для "Запомнить меня"
    if (rememberMe) {
        saveRememberMeData(username);
    }
    
    showDiaryApp();

    alert('Аккаунт успешно создан!');
}

// Сброс достижений для нового пользователя
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
        consecutiveDays3: false,
        consecutiveDays7: false,
        consecutiveDays30: false,
        allEmotions: false,
        nightOwl: false,
        earlyBird: false,
        longEntry: false,
        firstSearch: false,
        themeChange: false,
        weekActivity: false
    };
    
    userAchievementsViewed[username] = {};
    
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(userAchievements));
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS_VIEWED, JSON.stringify(userAchievementsViewed));
}

function logout() {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    showAuthScreen();
}

// Функции навигации в сайдбаре
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
    
    // Помечаем все достижения как просмотренные
    markAllAchievementsAsViewed();
}

function closeAchievements() {
    document.getElementById('achievementsModal').style.display = 'none';
}

function showSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
    updateNavigation('settings');
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function filterByTag(tag) {
    // Если тег уже активен, снимаем фильтр
    if (currentTag === tag) {
        currentTag = null;
        document.getElementById('pageTitle').textContent = 'Мои записи';
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        renderEntries();
    } else {
        currentTag = tag;
        document.getElementById('pageTitle').textContent = `Тег: ${tag}`;
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
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
    if (activeView === 'all') {
        document.querySelector('.nav-item:nth-child(1)').classList.add('active');
    } else if (activeView === 'favorites') {
        document.querySelector('.nav-item:nth-child(2)').classList.add('active');
    } else if (activeView === 'achievements') {
        document.querySelector('.nav-item:nth-child(3)').classList.add('active');
    } else if (activeView === 'settings') {
        document.querySelector('.nav-item:nth-child(4)').classList.add('active');
    }
}

// Функции для работы с тегами
function renderTags() {
    const container = document.getElementById('tagsContainer');
    container.innerHTML = '';
    
    userTags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        if (currentTag === tag) {
            tagEl.classList.add('active');
        }
        tagEl.innerHTML = `
            ${tag}
            <button class="tag-remove" onclick="removeTag('${tag}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        tagEl.onclick = (e) => {
            if (!e.target.classList.contains('tag-remove')) {
                filterByTag(tag);
            }
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
        if (selectedTags.includes(tag)) {
            tagEl.classList.add('selected');
        }
        tagEl.textContent = tag;
        tagEl.onclick = () => {
            toggleTagSelection(tag);
        };
        container.appendChild(tagEl);
    });
}

function toggleTagSelection(tag) {
    const index = selectedTags.indexOf(tag);
    if (index === -1) {
        selectedTags.push(tag);
    } else {
        selectedTags.splice(index, 1);
    }
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
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(userTags));
    renderTags();
    renderTagSelector();
    input.value = '';
    
    // Проверка достижения "Первый тег"
    if (!getUserAchievement('firstTag')) {
        setUserAchievement('firstTag', true);
    }
    
    // Проверка достижения "5 тегов"
    if (!getUserAchievement('fiveTags') && userTags.length >= 5) {
        setUserAchievement('fiveTags', true);
    }
}

function removeTag(tag) {
    if (confirm(`Удалить тег "${tag}"?`)) {
        userTags = userTags.filter(t => t !== tag);
        localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(userTags));
        
        // Если удаляемый тег был активен, снимаем фильтр
        if (currentTag === tag) {
            currentTag = null;
            document.getElementById('pageTitle').textContent = 'Мои записи';
        }
        
        renderTags();
        renderTagSelector();
        renderEntries();
    }
}

// Функции для работы с изображениями
function initImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('imageInput');
    
    // Обработчик клика по области загрузки
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Обработчик выбора файлов
    fileInput.addEventListener('change', handleFileSelect);
    
    // Обработчики drag & drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });
}

function handleFileSelect(e) {
    handleFiles(e.target.files);
}

function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Проверяем, что файл является изображением или GIF
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
            
            // Проверка достижения "Первое изображение"
            if (!getUserAchievement('firstImage')) {
                setUserAchievement('firstImage', true);
            }
            
            // Проверка достижения "5 изображений"
            if (!getUserAchievement('fiveImages') && currentImages.length >= 5) {
                setUserAchievement('fiveImages', true);
            }
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
        preview.innerHTML = `
            <img src="${image.data}" alt="${image.name}">
            ${image.isGif ? '<div class="gif-badge">GIF</div>' : ''}
            <button class="image-remove" onclick="removeImage(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
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
        
        // Показываем/скрываем кнопки навигации
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

// Функции для работы с записями
function loadUserEntries() {
    if (currentUser && users[currentUser]) {
        entries = users[currentUser].entries || [];
        renderEntries();
    }
}

function saveUserEntries() {
    if (currentUser && users[currentUser]) {
        users[currentUser].entries = entries;
        // Обновляем время последней активности
        users[currentUser].lastActivity = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        updateStats();
        checkAchievements();
    }
}

function updateStats() {
    document.getElementById('entriesCount').textContent = entries.length;
    
    const now = new Date();
    const thisMonth = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === now.getMonth() && 
               entryDate.getFullYear() === now.getFullYear();
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

    // Фильтр по времени
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
            return entryDate.getMonth() === now.getMonth() && 
                   entryDate.getFullYear() === now.getFullYear();
        });
    }

    // Фильтр по виду
    if (currentView === 'favorites') {
        filteredEntries = filteredEntries.filter(entry => entry.favorite);
    }

    // Фильтр по тегу
    if (currentTag) {
        filteredEntries = filteredEntries.filter(entry => 
            entry.tags && entry.tags.includes(currentTag)
        );
    }

    // Фильтр по поисковому запросу
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEntries = filteredEntries.filter(entry => {
            const titleMatch = entry.title.toLowerCase().includes(query);
            const contentMatch = entry.content && entry.content.toLowerCase().includes(query);
            const tagsMatch = entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(query));
            const emotionMatch = entry.emotion && EMOTIONS.some(e => 
                e.emoji === entry.emotion && e.name.toLowerCase().includes(query)
            );
            return titleMatch || contentMatch || tagsMatch || emotionMatch;
        });
    }

    return filteredEntries;
}

// Форматирование даты в формат дд/мм/гг
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Функция для выделения текста в результатах поиска
function highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function renderEntries() {
    const container = document.getElementById('entriesContainer');
    container.innerHTML = '';

    const filteredEntries = getFilteredEntries();

    if (filteredEntries.length === 0) {
        let message = 'Записей пока нет';
        if (currentView === 'favorites') {
            message = 'Нет избранных записей';
        } else if (currentTag) {
            message = `Нет записей с тегом "${currentTag}"`;
        } else if (currentFilter !== 'all') {
            message = `Нет записей за выбранный период`;
        } else if (searchQuery) {
            message = `По запросу "${searchQuery}" ничего не найдено`;
        }

        container.innerHTML = `
            <div class="empty-state">
                <h3>${message}</h3>
                <p>Нажмите "+" чтобы добавить новую запись</p>
            </div>
        `;
        return;
    }

    filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(entry => {
        const formattedDate = formatDate(entry.date);
        
        const entryEl = document.createElement('div');
        entryEl.className = 'entry-card';
        
        let imageHTML = '';
        if (entry.images && entry.images.length > 0) {
            const hasMultipleImages = entry.images.length > 1;
            const hasGif = entry.images.some(img => img.isGif);
            
            imageHTML = `
                <div class="entry-image-container">
                    <img src="${entry.images[0].data}" alt="${entry.images[0].name}" class="entry-image" onclick="openImageModal(${JSON.stringify(entry.images).replace(/"/g, '&quot;')})">
                    ${hasGif ? '<div class="gif-badge">GIF</div>' : ''}
                    ${hasMultipleImages ? `<div class="image-counter">+${entry.images.length - 1}</div>` : ''}
                </div>
            `;
        }
        
        // Эмоция записи
        const emotionHTML = entry.emotion ? 
            `<div class="entry-emotion" title="${EMOTIONS.find(e => e.emoji === entry.emotion)?.name || 'Эмоция'}">${entry.emotion}</div>` :
            `<div class="entry-emotion no-emotion" title="Без эмоции">❔</div>`;
        
        // Подсветка текста при поиске
        const highlightedTitle = searchQuery ? highlightText(entry.title, searchQuery) : entry.title;
        const highlightedContent = searchQuery && entry.content ? highlightText(entry.content, searchQuery) : entry.content;
        const highlightedTags = searchQuery && entry.tags ? entry.tags.map(tag => highlightText(tag, searchQuery)).join(', ') : (entry.tags ? entry.tags.join(', ') : '');
        
        entryEl.innerHTML = `
            <div class="entry-header">
                <div style="flex: 1;">
                    <div class="entry-title">${highlightedTitle}</div>
                    <div class="entry-date">${formattedDate}</div>
                    ${highlightedTags ? `<div style="font-size: 12px; color: var(--primary-light); margin-top: 5px;">${highlightedTags}</div>` : ''}
                </div>
            </div>
            ${highlightedContent ? `<div class="entry-content">${highlightedContent}</div>` : ''}
            ${imageHTML}
            
            <!-- Меню троеточие -->
            <button class="entry-menu" onclick="toggleMenu(${entry.id}, this)">
                <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="menu-dropdown">
                <button class="menu-item">
                    <i class="fas fa-edit"></i>
                    Редактировать
                </button>
                <button class="menu-item delete">
                    <i class="fas fa-trash"></i>
                    Удалить
                </button>
            </div>
            
            ${emotionHTML}
            <div class="entry-actions">
                <button class="action-btn favorite-btn ${entry.favorite ? 'active' : ''}" onclick="toggleFavorite(${entry.id})">
                    <i class="fas fa-star"></i>
                    ${entry.favorite ? 'В избранном' : 'В избранное'}
                </button>
            </div>
        `;
        container.appendChild(entryEl);
    });
}

function toggleFavorite(entryId) {
    const entryIndex = entries.findIndex(e => e.id === entryId);
    if (entryIndex !== -1) {
        entries[entryIndex].favorite = !entries[entryIndex].favorite;
        saveUserEntries();
        renderEntries();
        
        // Проверка достижения "Первое избранное"
        if (!getUserAchievement('firstFavorite') && entries[entryIndex].favorite) {
            setUserAchievement('firstFavorite', true);
        }
        
        // Проверка достижения "5 избранных"
        if (!getUserAchievement('fiveFavorites')) {
            const favoritesCount = entries.filter(entry => entry.favorite).length;
            if (favoritesCount >= 5) {
                setUserAchievement('fiveFavorites', true);
            }
        }
    }
}

function openEditor(entryId = null) {
    const modal = document.getElementById('editorModal');
    const titleInput = document.getElementById('entryTitle');
    const contentInput = document.getElementById('entryContent');
    const editorTitle = document.getElementById('editorTitle');
    
    // Очищаем изображения, теги и эмоцию при открытии редактора
    clearImages();
    selectedTags = [];
    selectedEmotion = null;
    
    if (entryId) {
        const entry = entries.find(e => e.id === entryId);
        if (entry) {
            titleInput.value = entry.title;
            contentInput.value = entry.content || '';
            
            // Загружаем теги записи
            if (entry.tags) {
                selectedTags = [...entry.tags];
            }
            
            // Загружаем эмоцию записи
            if (entry.emotion) {
                selectedEmotion = entry.emotion;
            }
            
            // Загружаем изображения записи
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
    
    // Обновляем селекторы
    renderTagSelector();
    renderEmotionSelector();
    
    modal.style.display = 'flex';
}

function closeEditor() {
    document.getElementById('editorModal').style.display = 'none';
    clearImages();
    selectedTags = [];
    selectedEmotion = null;
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

    if (editingId) {
        const entryIndex = entries.findIndex(e => e.id === parseInt(editingId));
        if (entryIndex !== -1) {
            entries[entryIndex].title = title;
            entries[entryIndex].content = content;
            entries[entryIndex].tags = [...selectedTags];
            entries[entryIndex].emotion = selectedEmotion;
            entries[entryIndex].images = [...currentImages];
            entries[entryIndex].date = new Date().toISOString();
        }
    } else {
        const newEntry = {
            id: Date.now(),
            title: title,
            content: content,
            tags: [...selectedTags],
            emotion: selectedEmotion,
            images: [...currentImages],
            favorite: false,
            date: new Date().toISOString()
        };
        entries.push(newEntry);
        
        // Проверка достижения "Первая запись"
        if (!getUserAchievement('firstEntry')) {
            setUserAchievement('firstEntry', true);
        }
        
        // Проверка достижений по количеству записей
        if (!getUserAchievement('fiveEntries') && entries.length >= 5) {
            setUserAchievement('fiveEntries', true);
        }
        
        if (!getUserAchievement('tenEntries') && entries.length >= 10) {
            setUserAchievement('tenEntries', true);
        }
    }

    saveUserEntries();
    renderEntries();
    closeEditor();
}

function editEntry(entryId) {
    openEditor(entryId);
}

function deleteEntry(entryId) {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        entries = entries.filter(entry => entry.id !== entryId);
        saveUserEntries();
        renderEntries();
    }
}

// Функции поиска
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    // Обработчик ввода текста
    searchInput.addEventListener('input', function() {
        searchQuery = this.value.trim();
        
        // Показываем/скрываем кнопку очистки
        if (searchQuery) {
            searchClear.style.display = 'block';
        } else {
            searchClear.style.display = 'none';
        }
        
        // Обновляем заголовок страницы при поиске
        if (searchQuery) {
            document.getElementById('pageTitle').textContent = `Результаты поиска: "${searchQuery}"`;
            
            // Проверка достижения "Первый поиск"
            if (!getUserAchievement('firstSearch') && searchQuery.length > 0) {
                setUserAchievement('firstSearch', true);
            }
        } else {
            document.getElementById('pageTitle').textContent = 'Мои записи';
        }
        
        renderEntries();
    });
    
    // Обработчик нажатия Enter
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

// Функции тем и настроек
function applySettings() {
    // Применяем сохраненную тему
    changeTheme(settings.theme);
    document.getElementById('themeSelect').value = settings.theme;
    document.getElementById('fontSizeSelect').value = settings.fontSize;
    document.getElementById('autoSaveSelect').value = settings.autoSave.toString();
    
    // Применяем размер шрифта
    changeFontSize(settings.fontSize);
}

function changeTheme(theme) {
    settings.theme = theme;
    
    // Удаляем все классы тем
    document.body.classList.remove(
        'theme-nature', 'theme-dark-nature', 
        'theme-earth', 'theme-dark-earth',
        'theme-mystic', 'theme-dark-mystic',
        'theme-ocean', 'theme-dark-ocean',
        'theme-lavender-sky', 'theme-dark-lavender'
    );
    
    // Добавляем выбранную тему
    document.body.classList.add(`theme-${theme}`);
    
    // Обновляем градиент на экране авторизации
    const authScreen = document.getElementById('authScreen');
    if (authScreen) {
        authScreen.style.background = `linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)`;
    }
    
    // Проверка достижения "Смена темы" - только если пользователь сам сменил тему
    // (не при автоматической установке темы при создании аккаунта)
    if (!getUserAchievement('themeChange') && theme !== 'nature') {
        setUserAchievement('themeChange', true);
    }
}

function changeFontSize(size) {
    settings.fontSize = size;
    const sizes = {
        'small': '14px',
        'medium': '16px',
        'large': '18px'
    };
    document.body.style.fontSize = sizes[size] || '16px';
}

function toggleAutoSave(value) {
    settings.autoSave = value === 'true';
}

function saveSettings() {
    // Сохраняем настройки уведомлений
    const notificationToggle = document.getElementById('notificationToggle');
    const notificationDate = document.getElementById('notificationDate');
    const notificationTime = document.getElementById('notificationTime');
    const notificationSound = document.getElementById('notificationSound');
    const notificationRepeat = document.getElementById('notificationRepeat');
    
    settings.notifications = {
        enabled: notificationToggle.checked,
        date: notificationDate.value,
        time: notificationTime.value,
        sound: notificationSound.checked,
        repeat: notificationRepeat.checked
    };
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    
    // Перезапускаем уведомления
    initNotifications();
    
    alert('Настройки сохранены!');
    closeSettings();
}

// Функции для работы с достижениями
function getUserAchievement(achievementId) {
    if (!userAchievements[currentUser]) {
        userAchievements[currentUser] = {};
    }
    return userAchievements[currentUser][achievementId] || false;
}

function setUserAchievement(achievementId, achieved) {
    if (!userAchievements[currentUser]) {
        userAchievements[currentUser] = {};
    }
    
    // Если достижение еще не получено и мы его получаем
    if (!userAchievements[currentUser][achievementId] && achieved) {
        userAchievements[currentUser][achievementId] = true;
        
        // Добавляем в список новых достижений
        if (!newAchievements.includes(achievementId)) {
            newAchievements.push(achievementId);
            checkNewAchievements();
        }
        
        saveAchievements();
        updateAchievementsProgress();
        
        // Показываем уведомление о новом достижении
        showAchievementNotification(achievementId);
    }
}

function checkAchievements() {
    // Проверка достижений по количеству записей
    if (!getUserAchievement('firstEntry') && entries.length >= 1) {
        setUserAchievement('firstEntry', true);
    }
    
    if (!getUserAchievement('fiveEntries') && entries.length >= 5) {
        setUserAchievement('fiveEntries', true);
    }
    
    if (!getUserAchievement('tenEntries') && entries.length >= 10) {
        setUserAchievement('tenEntries', true);
    }
    
    if (!getUserAchievement('twentyEntries') && entries.length >= 20) {
        setUserAchievement('twentyEntries', true);
    }
    
    if (!getUserAchievement('fiftyEntries') && entries.length >= 50) {
        setUserAchievement('fiftyEntries', true);
    }
    
    // Проверка достижений по изображениям
    const entriesWithImages = entries.filter(entry => entry.images && entry.images.length > 0);
    if (!getUserAchievement('firstImage') && entriesWithImages.length >= 1) {
        setUserAchievement('firstImage', true);
    }
    
    if (!getUserAchievement('fiveImages') && entriesWithImages.length >= 5) {
        setUserAchievement('fiveImages', true);
    }
    
    // Проверка достижения "Длинная запись"
    if (!getUserAchievement('longEntry')) {
        const longEntry = entries.find(entry => entry.content && entry.content.length > 500);
        if (longEntry) {
            setUserAchievement('longEntry', true);
        }
    }
    
    // Проверка достижения "Активность в течение недели"
    if (!getUserAchievement('weekActivity')) {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        
        const entriesThisWeek = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekAgo;
        });
        
        if (entriesThisWeek.length >= 7) {
            setUserAchievement('weekActivity', true);
        }
    }
}

function saveAchievements() {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(userAchievements));
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
    
    if (newAchievements.length > 0) {
        notificationDot.classList.add('show');
    } else {
        notificationDot.classList.remove('show');
    }
}

function markAllAchievementsAsViewed() {
    if (!userAchievementsViewed[currentUser]) {
        userAchievementsViewed[currentUser] = {};
    }
    
    // Помечаем все текущие достижения как просмотренные
    Object.keys(userAchievements[currentUser] || {}).forEach(achievementId => {
        userAchievementsViewed[currentUser][achievementId] = true;
    });
    
    // Очищаем список новых достижений
    newAchievements = [];
    
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS_VIEWED, JSON.stringify(userAchievementsViewed));
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
    
    // Автоматически скрыть через 5 секунд
    setTimeout(() => {
        closeNotification();
    }, 5000);
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
        achievementEl.innerHTML = `
            <i class="fas fa-star achievement-star ${isEarned ? 'earned' : ''}"></i>
            <span class="achievement-text">${achievement.text}</span>
            <span class="achievement-progress">${achievement.progress}</span>
        `;
        container.appendChild(achievementEl);
    });
}

// Обработчики событий
document.getElementById('editorModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeEditor();
    }
});

document.getElementById('settingsModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeSettings();
    }
});

document.getElementById('achievementsModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAchievements();
    }
});

document.getElementById('imageModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeImageModal();
    }
});

// Обработчик нажатия Enter в поле добавления тега
document.getElementById('newTagInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addNewTag();
    }
});

// Обработчик нажатия клавиш в модальном окне изображений
document.addEventListener('keydown', function(e) {
    if (document.getElementById('imageModal').style.display === 'flex') {
        if (e.key === 'ArrowLeft') {
            prevImage();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === 'Escape') {
            closeImageModal();
        }
    }
});

// Функция для экспорта данных (для резервного копирования)
function exportUserData() {
    if (currentUser && users[currentUser]) {
        const userData = {
            username: currentUser,
            entries: users[currentUser].entries,
            tags: userTags,
            settings: settings,
            achievements: userAchievements[currentUser] || {},
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `diary_backup_${currentUser}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Функция для импорта данных
function importUserData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.username && importedData.entries) {
                if (confirm(`Импортировать данные для пользователя ${importedData.username}?`)) {
                    users[importedData.username] = {
                        ...users[importedData.username],
                        entries: importedData.entries
                    };
                    
                    if (importedData.tags) {
                        userTags = [...new Set([...userTags, ...importedData.tags])];
                        localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(userTags));
                    }
                    
                    if (importedData.settings) {
                        settings = { ...settings, ...importedData.settings };
                        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
                        applySettings();
                    }
                    
                    if (importedData.achievements) {
                        if (!userAchievements[importedData.username]) {
                            userAchievements[importedData.username] = {};
                        }
                        userAchievements[importedData.username] = { ...userAchievements[importedData.username], ...importedData.achievements };
                        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(userAchievements));
                    }
                    
                    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
                    
                    if (currentUser === importedData.username) {
                        loadUserEntries();
                        renderTags();
                        updateStats();
                        updateAchievementsProgress();
                        checkNewAchievements();
                    }
                    
                    alert('Данные успешно импортированы!');
                }
            } else {
                alert('Неверный формат файла!');
            }
        } catch (error) {
            alert('Ошибка при импорте данных: ' + error.message);
        }
    };
    reader.readAsText(file);
}