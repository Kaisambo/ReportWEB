/* ============================================================
   Конфигурация. Подмените оба значения перед деплоем.
   ============================================================ */

window.APP_CONFIG = {
  // 1. URL вебхука n8n. Берётся из ноды Webhook в воркфлоу
  //    (правый клик на ноде → Copy production URL).
  //    Должен начинаться с https://, иначе fetch заблокируется.
  WEBHOOK_URL: 'https://n8n.orbitai.ru/webhook/REPLACE_WITH_YOUR_PATH',

  // 2. Username вашего Telegram-бота, БЕЗ @.
  //    Используется в ссылке «Подключить Telegram-бот».
  TG_BOT_USERNAME: 'REPLACE_WITH_BOT_USERNAME'
};
