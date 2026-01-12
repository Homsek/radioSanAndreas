// 1. Инициализируем единственный глобальный аудио-плеер
const mainAudioPlayer = new Audio();
let currentMainAudioSrc = null; // Будет хранить путь к основной дорожке
let isPreRollPlaying = false; // Флаг, указывающий, играет ли сейчас "пре-ролл"

// 2. Префиксы для ключей sessionStorage
const SESSION_STORAGE_PROGRESS_PREFIX = 'audio_progress_';

// 3. Map для отслеживания, была ли песня уже запущена со случайного места в текущей сессии JS
//    (Этот Map сбрасывается при перезагрузке страницы, что соответствует требованию)
const songRandomStartFlags = new Map(); // Ключ: URL песни, Значение: true/false

// 4. Получаем все иконки радиостанций
const radioIcons = document.querySelectorAll('[data-radio]');

// 5. Добавляем ОДИН слушатель на событие 'ended' для нашего плеера.
mainAudioPlayer.addEventListener('ended', () => {
   if (isPreRollPlaying && currentMainAudioSrc) {
      // Закончился "пре-ролл". Начинаем основную дорожку.
      mainAudioPlayer.src = currentMainAudioSrc;

      mainAudioPlayer.onloadedmetadata = () => {
         let startPosition = 0;

         // Проверяем, была ли уже песня запущена со случайного места в этой сессии JS
         const hasRandomlyStartedThisSession = songRandomStartFlags.get(currentMainAudioSrc) === true;

         if (!hasRandomlyStartedThisSession) {
            // Если не была, генерируем случайное время и помечаем флаг
            const duration = mainAudioPlayer.duration;
            startPosition = Math.random() * duration;
            songRandomStartFlags.set(currentMainAudioSrc, true); // Помечаем, что для этой песни уже был случайный старт в этой сессии JS
            // Также сохраняем эту случайную позицию в sessionStorage как "начальную"
            sessionStorage.setItem(SESSION_STORAGE_PROGRESS_PREFIX + currentMainAudioSrc, startPosition.toString());
         } else {
            // Если уже была запущена со случайного места (или просто играла в этой сессии JS),
            // берем сохраненный прогресс из sessionStorage.
            const savedProgress = parseFloat(sessionStorage.getItem(SESSION_STORAGE_PROGRESS_PREFIX + currentMainAudioSrc) || '0');
            startPosition = savedProgress;
         }

         mainAudioPlayer.currentTime = startPosition;
         mainAudioPlayer.play();
         isPreRollPlaying = false;
         mainAudioPlayer.onloadedmetadata = null; // Удаляем временный слушатель
      };
      mainAudioPlayer.load();

   } else if (!isPreRollPlaying && currentMainAudioSrc) {
      // Закончилась основная дорожка.
      // По требованию: по окончании песни она должна начинаться сначала при следующем клике.
      // Для этого сбрасываем её прогресс в sessionStorage на 0.
      sessionStorage.setItem(SESSION_STORAGE_PROGRESS_PREFIX + currentMainAudioSrc, '0');

      // Останавливаем воспроизведение после окончания (не зацикливаем автоматически)
      mainAudioPlayer.pause();
      mainAudioPlayer.currentTime = 0;
   }
});

// 6. Добавляем слушатели кликов на каждую иконку радиостанции
radioIcons.forEach(icon => {
   icon.addEventListener('click', () => {
      const newMainAudioSrc = icon.getAttribute('data-audio');

      // Управление активным состоянием иконок
      radioIcons.forEach(i => i.classList.remove('_active'));
      icon.classList.add('_active');

      // 1. СОХРАНЯЕМ ПРОГРЕСС ПРЕДЫДУЩЕЙ ПЕСНИ (если она играла)
      if (currentMainAudioSrc && !isPreRollPlaying && !mainAudioPlayer.paused) {
         // Сохраняем currentTime только если играла основная дорожка и она не на паузе
         sessionStorage.setItem(SESSION_STORAGE_PROGRESS_PREFIX + currentMainAudioSrc, mainAudioPlayer.currentTime.toString());
      }

      // 2. Останавливаем любое текущее воспроизведение и сбрасываем позицию (для пре-ролла)
      mainAudioPlayer.pause();
      mainAudioPlayer.currentTime = 0;

      // 3. Обновляем путь к текущей основной дорожке
      currentMainAudioSrc = newMainAudioSrc;

      // 4. Запускаем "пре-ролл"
      mainAudioPlayer.src = "audio/radioWave.mp3";
      mainAudioPlayer.play();
      isPreRollPlaying = true;
   });
});

// Дополнительно: Сохранение прогресса при закрытии вкладки/браузера
window.addEventListener('beforeunload', () => {
   if (currentMainAudioSrc && !isPreRollPlaying && !mainAudioPlayer.paused) {
      // Сохраняем текущую позицию, если песня играет
      sessionStorage.setItem(SESSION_STORAGE_PROGRESS_PREFIX + currentMainAudioSrc, mainAudioPlayer.currentTime.toString());
   }
});