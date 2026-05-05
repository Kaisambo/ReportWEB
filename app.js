/* ============================================================
   Аналитический отчёт по звонкам — клиентская логика
   ============================================================ */

(function () {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const form = document.getElementById('report-form');
  const submitBtn = document.getElementById('submit-btn');
  const submitLabel = submitBtn.querySelector('.submit-btn__label');
  const spinner = submitBtn.querySelector('.submit-btn__spinner');
  const result = document.getElementById('result');
  const fileField = document.getElementById('file-field');
  const fileInput = document.getElementById('transcript');
  const tgButton = document.getElementById('tg-button');

  // ----- TG button: подставляем username из конфига -----
  if (cfg.TG_BOT_USERNAME && cfg.TG_BOT_USERNAME !== 'REPLACE_WITH_BOT_USERNAME') {
    tgButton.href = `https://t.me/${cfg.TG_BOT_USERNAME}?start=registration`;
  } else {
    tgButton.href = '#';
    tgButton.addEventListener('click', (e) => {
      e.preventDefault();
      showResult('info', 'Бот ещё не настроен',
        'В файле <code>config.js</code> подставьте <code>TG_BOT_USERNAME</code>.');
    });
  }

  // ----- Показ/скрытие поля файла в зависимости от source -----
  document.querySelectorAll('input[name="source"]').forEach((r) => {
    r.addEventListener('change', () => {
      const isUpload = document.querySelector('input[name="source"]:checked').value === 'Загрузить файл';
      fileField.hidden = !isUpload;
      fileInput.required = isUpload;
    });
  });

  // ----- Submit -----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideResult();

    if (!cfg.WEBHOOK_URL || cfg.WEBHOOK_URL.includes('REPLACE_WITH')) {
      showResult('error', 'Воркфлоу не подключён',
        'В файле <code>config.js</code> подставьте <code>WEBHOOK_URL</code> из ноды Webhook в n8n.');
      return;
    }

    const fd = new FormData(form);
    const source = fd.get('source');

    // Простая валидация
    if (source === 'Загрузить файл' && (!fileInput.files || fileInput.files.length === 0)) {
      showResult('error', 'Не выбран файл',
        'В режиме «Загрузить файл» нужно прикрепить .txt с транскриптами.');
      return;
    }

    // Нормализуем username
    const tg = (fd.get('telegramUsername') || '').trim().replace(/^@/, '').toLowerCase();
    fd.set('telegramUsername', tg);

    setLoading(true);
    showResult('info', 'Отправляем запрос…', 'Это займёт несколько секунд.');

    try {
      // FormData отправляется как multipart/form-data — n8n Webhook
      // в режиме binaryData=true прочитает и поля, и файл.
      const resp = await fetch(cfg.WEBHOOK_URL, {
        method: 'POST',
        body: fd,
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }

      // n8n обычно отвечает JSON, но может прислать просто текст.
      let body;
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        body = await resp.json();
      } else {
        body = await resp.text();
      }

      const tgHint = tg
        ? `Готовый отчёт придёт в Telegram на <code>@${tg}</code>.`
        : 'Telegram username не указан — отчёт можно будет посмотреть в логах n8n или указать @username и запустить ещё раз.';

      showResult('success', '✅ Запрос принят в работу',
        `Анализ ${source === 'Загрузить файл' ? 'загруженного файла' : 'архива'} запущен. ` +
        `Это займёт от 1 до 15 минут в зависимости от объёма.<br><br>${tgHint}`
      );
      form.reset();
      // После reset нужно скрыть file field обратно (radio сбрасывается на default = "Из архива")
      fileField.hidden = true;
      fileInput.required = false;

    } catch (err) {
      console.error(err);
      let hint = '';
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        hint = 'Возможные причины: webhook недоступен, выключен в n8n, или CORS не настроен. ' +
               'В n8n включите ноду Webhook и в её настройках добавьте Allowed Origins.';
      } else {
        hint = 'Проверьте URL в config.js и состояние воркфлоу в n8n.';
      }
      showResult('error', '❌ Не удалось отправить', `${err.message}<br><br>${hint}`);
    } finally {
      setLoading(false);
    }
  });

  // ----- helpers -----
  function setLoading(on) {
    submitBtn.disabled = on;
    spinner.hidden = !on;
    submitLabel.textContent = on ? 'Отправляем…' : 'Сформировать отчёт';
  }

  function showResult(kind, title, html) {
    result.hidden = false;
    result.className = `result result--${kind}`;
    result.innerHTML = `<strong>${title}</strong>${html}`;
    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideResult() {
    result.hidden = true;
    result.className = 'result';
  }
})();
