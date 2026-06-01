"""
PyStart — Telegram Admin Bot
Автоматическая модерация ленты, бан пользователей, Helpdesk
"""

import asyncio
import logging
import re
from datetime import datetime, timedelta

import firebase_admin
from firebase_admin import credentials, firestore
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
)
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

# ──────────────────────────────────────────────
# НАСТРОЙКИ — замените на свои данные
# ──────────────────────────────────────────────
TELEGRAM_TOKEN = "8977227672:AAFQ9F-z_SPed8IT_DYHuhuYSDu8_Sdd8yc"         # токен от @BotFather
ADMIN_CHAT_ID   = 1209881518                    # ваш Telegram ID
SERVICE_ACCOUNT = "pystart-dd2db-firebase-adminsdk-fbsvc-d8bed00cd1.json"

# ──────────────────────────────────────────────
# СПИСОК ЗАПРЕЩЁННЫХ СЛОВ (добавляйте сюда)
# ──────────────────────────────────────────────
BANNED_WORDS = [
    # казахские
    "сасық", "ақымақ", "итсің", "нашар",
    # русские
    "блять", "бля", "хуй", "пизд", "ебать", "сука", "мразь",
    "чмо", "ублюдок", "мудак", "ёбаный", "залупа",
    # спам-паттерны
    r"t\.me/[^\s]+", r"https?://[^\s]+\.[a-z]{2,}/[^\s]*casino",
    r"заработай \d+", r"пассивный доход", r"крипто.?бот",
]

SPAM_PATTERNS = [
    r"(подпишись|подписывайся).{0,30}(канал|чат|бот)",
    r"(купи|закажи|дёшево|скидка).{0,40}(здесь|тут|ссылка)",
    r"\+7\s?\(?\d{3}\)?\s?\d{3}[\s-]?\d{2}[\s-]?\d{2}",  # телефоны
]

# Компилируем регулярки один раз
_banned_re   = [re.compile(p, re.IGNORECASE) for p in BANNED_WORDS]
_spam_re     = [re.compile(p, re.IGNORECASE) for p in SPAM_PATTERNS]

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(message)s",
    level=logging.INFO,
)
log = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# FIREBASE
# ──────────────────────────────────────────────
cred = credentials.Certificate(SERVICE_ACCOUNT)
firebase_admin.initialize_app(cred)
db = firestore.client()


# ════════════════════════════════════════════
# УТИЛИТЫ
# ════════════════════════════════════════════
def check_content(text: str) -> tuple[bool, str]:
    """
    Возвращает (нарушение: bool, причина: str).
    """
    if not text:
        return False, ""
    for pattern in _banned_re:
        if pattern.search(text):
            return True, f"запрещённое слово/ссылка: `{pattern.pattern[:40]}`"
    for pattern in _spam_re:
        if pattern.search(text):
            return True, f"спам-паттерн: `{pattern.pattern[:40]}`"
    return False, ""


async def auto_delete_post(post_id: str, reason: str, author_uid: str, app: Application):
    """Удаляет пост из Firestore и уведомляет администратора."""
    db.collection("feedPosts").document(post_id).delete()

    # Фиксируем нарушение у пользователя
    user_ref = db.collection("users").document(author_uid)
    user_ref.update({
        "violations": firestore.Increment(1),
        "lastViolation": firestore.SERVER_TIMESTAMP,
        "violationReasons": firestore.ArrayUnion([reason]),
    })

    user_snap = user_ref.get()
    violations = user_snap.to_dict().get("violations", 0) if user_snap.exists else 0

    # Автоматический бан при ≥ 3 нарушениях
    if violations >= 3:
        user_ref.update({
            "banned": True,
            "bannedUntil": datetime.utcnow() + timedelta(days=7),
            "canPost": False,
            "canComment": False,
        })
        ban_notice = (
            f"🔴 *Автобан!*\nПользователь `{author_uid}` получил **{violations} нарушения** "
            f"и автоматически заблокирован на 7 дней."
        )
    else:
        ban_notice = (
            f"⚠️ *Предупреждение {violations}/3*\nПользователь `{author_uid}` "
            f"получил предупреждение."
        )

    await app.bot.send_message(
        ADMIN_CHAT_ID,
        f"🗑 *Пост удалён автоматически*\n\n"
        f"📌 *Причина:* {reason}\n"
        f"👤 *Автор:* `{author_uid}`\n"
        f"🆔 *Пост ID:* `{post_id}`\n\n"
        f"{ban_notice}",
        parse_mode="Markdown",
    )


# ════════════════════════════════════════════
# FIRESTORE LISTENER — Лента (feedPosts)
# ════════════════════════════════════════════
def start_feed_listener(app: Application, loop: asyncio.AbstractEventLoop):
    """
    Слушает коллекцию feedPosts в реальном времени.
    При новом посте проверяет на нарушения.
    """
    def on_snapshot(col_snapshot, changes, read_time):
        for change in changes:
            if change.type.name != "ADDED":
                continue

            doc = change.document
            data = doc.to_dict()
            text     = data.get("text", "") or ""
            uid      = data.get("uid", "unknown")
            post_id  = doc.id

            # --- Проверка контента ---
            is_bad, reason = check_content(text)
            if is_bad:
                log.info(f"🚫 Нарушение в посте {post_id}: {reason}")
                asyncio.run_coroutine_threadsafe(
                    auto_delete_post(post_id, reason, uid, app),
                    loop,  # Передаём явно созданный loop главного потока
                )
            else:
                log.info(f"✅ Пост {post_id} прошёл проверку")

    col_ref = db.collection("feedPosts")
    col_ref.on_snapshot(on_snapshot)
    log.info("👁 Слушатель feedPosts запущен")


# ════════════════════════════════════════════
# КОМАНДЫ АДМИНИСТРАТОРА
# ════════════════════════════════════════════

async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        return
    text = (
        "🤖 *PyStart Admin Bot*\n\n"
        "*Команды:*\n"
        "/ban `<uid>` `[дни]` — заблокировать пользователя\n"
        "/unban `<uid>` — разблокировать\n"
        "/warn `<uid>` — выдать предупреждение\n"
        "/delete `<postId>` — удалить пост вручную\n"
        "/userinfo `<uid>` — информация о пользователе\n"
        "/stats — статистика платформы\n"
        "/pending — посты на ожидании\n"
        "/help — это меню\n\n"
        "📩 Пересланные сообщения из Helpdesk обрабатываются автоматически."
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_ban(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        return
    if not ctx.args:
        await update.message.reply_text("❌ Использование: `/ban <uid> [дни]`", parse_mode="Markdown")
        return

    uid  = ctx.args[0]
    days = int(ctx.args[1]) if len(ctx.args) > 1 else 7

    until = datetime.utcnow() + timedelta(days=days)
    db.collection("users").document(uid).update({
        "banned": True,
        "bannedUntil": until,
        "canPost": False,
        "canComment": False,
    })

    await update.message.reply_text(
        f"🔴 Пользователь `{uid}` заблокирован на *{days} дн.* до `{until.strftime('%d.%m.%Y %H:%M')} UTC`",
        parse_mode="Markdown",
    )


async def cmd_unban(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        return
    if not ctx.args:
        await update.message.reply_text("❌ Использование: `/unban <uid>`", parse_mode="Markdown")
        return

    uid = ctx.args[0]
    db.collection("users").document(uid).update({
        "banned": False,
        "bannedUntil": None,
        "canPost": True,
        "canComment": True,
    })
    await update.message.reply_text(f"✅ Пользователь `{uid}` разблокирован.", parse_mode="Markdown")


async def cmd_warn(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        return
    if not ctx.args:
        await update.message.reply_text("❌ Использование: `/warn <uid>`", parse_mode="Markdown")
        return

    uid = ctx.args[0]
    user_ref = db.collection("users").document(uid)
    user_ref.update({
        "violations": firestore.Increment(1),
        "lastViolation": firestore.SERVER_TIMESTAMP,
    })
    snap = user_ref.get()
    count = snap.to_dict().get("violations", 1) if snap.exists else 1

    await update.message.reply_text(
        f"⚠️ Пользователю `{uid}` выдано предупреждение. Всего: *{count}/3*",
        parse_mode="Markdown",
    )


async def cmd_delete(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        return
    if not ctx.args:
        await update.message.reply_text("❌ Использование: `/delete <postId>`", parse_mode="Markdown")
        return

    post_id = ctx.args[0]
    doc_ref = db.collection("feedPosts").document(post_id)
    doc = doc_ref.get()

    if not doc.exists:
        await update.message.reply_text("❌ Пост не найден.")
        return

    uid = doc.to_dict().get("uid", "?")
    doc_ref.delete()
    await update.message.reply_text(
        f"🗑 Пост `{post_id}` удалён.\n👤 Автор: `{uid}`",
        parse_mode="Markdown",
    )


async def cmd_userinfo(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        return
    if not ctx.args:
        await update.message.reply_text("❌ Использование: `/userinfo <uid>`", parse_mode="Markdown")
        return

    uid  = ctx.args[0]
    snap = db.collection("users").document(uid).get()

    if not snap.exists:
        await update.message.reply_text("❌ Пользователь не найден.")
        return

    d = snap.to_dict()
    banned_until = d.get("bannedUntil")
    until_str    = banned_until.strftime("%d.%m.%Y") if banned_until else "—"

    text = (
        f"👤 *Пользователь:* `{uid}`\n"
        f"📧 *Email:* {d.get('email', '—')}\n"
        f"🔴 *Заблокирован:* {'Да' if d.get('banned') else 'Нет'}\n"
        f"📅 *Бан до:* {until_str}\n"
        f"✍️ *Может писать:* {'Да' if d.get('canPost', True) else 'Нет'}\n"
        f"💬 *Может комментировать:* {'Да' if d.get('canComment', True) else 'Нет'}\n"
        f"⚠️ *Нарушений:* {d.get('violations', 0)}\n"
        f"🏆 *Streak:* {d.get('streak', 0)}\n"
    )

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🔴 Бан 7д",   callback_data=f"ban7:{uid}"),
            InlineKeyboardButton("✅ Разбан",    callback_data=f"unban:{uid}"),
        ],
        [
            InlineKeyboardButton("⚠️ Предупредить", callback_data=f"warn:{uid}"),
        ],
    ])
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=keyboard)


async def cmd_stats(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        return

    users_count   = len(db.collection("users").get())
    posts_count   = len(db.collection("feedPosts").get())
    courses_count = len(db.collection("courses").where("status", "==", "approved").get())
    pending_count = len(db.collection("feedPosts").where("status", "==", "pending").get())
    banned_count  = len(db.collection("users").where("banned", "==", True).get())

    text = (
        f"📊 *Статистика платформы*\n\n"
        f"👥 Пользователей: *{users_count}*\n"
        f"📝 Постов в ленте: *{posts_count}*\n"
        f"📚 Курсов (одобрено): *{courses_count}*\n"
        f"⏳ Постов на модерации: *{pending_count}*\n"
        f"🔴 Забаненных: *{banned_count}*\n"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_pending(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_CHAT_ID:
        return

    posts = db.collection("feedPosts").where("status", "==", "pending").limit(10).get()
    if not posts:
        await update.message.reply_text("✅ Нет постов на модерации.")
        return

    for doc in posts:
        d = doc.to_dict()
        text_preview = (d.get("text") or "")[:150]
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("✅ Одобрить", callback_data=f"approve_post:{doc.id}"),
            InlineKeyboardButton("❌ Удалить",  callback_data=f"delete_post:{doc.id}"),
        ]])
        await update.message.reply_text(
            f"📌 Пост `{doc.id}`\n👤 `{d.get('uid','?')}`\n\n{text_preview}",
            parse_mode="Markdown",
            reply_markup=keyboard,
        )


# ════════════════════════════════════════════
# CALLBACK КНОПКИ
# ════════════════════════════════════════════
async def handle_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    data = query.data
    parts = data.split(":", 1)
    action, target = parts[0], parts[1] if len(parts) > 1 else ""

    if action == "ban7":
        until = datetime.utcnow() + timedelta(days=7)
        db.collection("users").document(target).update({
            "banned": True, "bannedUntil": until,
            "canPost": False, "canComment": False,
        })
        await query.edit_message_text(f"🔴 Пользователь `{target}` заблокирован на 7 дней.", parse_mode="Markdown")

    elif action == "unban":
        db.collection("users").document(target).update({
            "banned": False, "bannedUntil": None,
            "canPost": True, "canComment": True,
        })
        await query.edit_message_text(f"✅ Пользователь `{target}` разблокирован.", parse_mode="Markdown")

    elif action == "warn":
        db.collection("users").document(target).update({
            "violations": firestore.Increment(1),
            "lastViolation": firestore.SERVER_TIMESTAMP,
        })
        await query.edit_message_text(f"⚠️ Предупреждение выдано пользователю `{target}`.", parse_mode="Markdown")

    elif action == "approve_post":
        db.collection("feedPosts").document(target).update({"status": "approved"})
        await query.edit_message_text(f"✅ Пост `{target}` одобрен.", parse_mode="Markdown")

    elif action == "delete_post":
        doc = db.collection("feedPosts").document(target).get()
        uid = doc.to_dict().get("uid", "?") if doc.exists else "?"
        db.collection("feedPosts").document(target).delete()
        await query.edit_message_text(f"🗑 Пост `{target}` удалён. Автор: `{uid}`", parse_mode="Markdown")

    elif action == "close_ticket":
        ticket_id = target
        db.collection("helpdesk").document(ticket_id).update({
            "status": "closed",
            "closedAt": firestore.SERVER_TIMESTAMP,
        })
        await query.edit_message_text(f"✅ Тикет `{ticket_id}` закрыт.", parse_mode="Markdown")


# ════════════════════════════════════════════
# HELPDESK — входящие обращения от пользователей
# ════════════════════════════════════════════
def start_helpdesk_listener(app: Application, loop: asyncio.AbstractEventLoop):
    """
    Слушает коллекцию 'helpdesk' — туда фронтенд пишет новые тикеты.
    """
    def on_snapshot(col_snapshot, changes, read_time):
        for change in changes:
            if change.type.name != "ADDED":
                continue

            doc  = change.document
            data = doc.to_dict()
            uid  = data.get("uid", "?")
            subject = data.get("subject", "Без темы")
            message = data.get("message", "")
            ticket_id = doc.id

            keyboard = InlineKeyboardMarkup([[
                InlineKeyboardButton("✅ Закрыть тикет", callback_data=f"close_ticket:{ticket_id}"),
            ]])

            asyncio.run_coroutine_threadsafe(
                app.bot.send_message(
                    ADMIN_CHAT_ID,
                    f"📩 *Новый Helpdesk тикет*\n\n"
                    f"🆔 `{ticket_id}`\n"
                    f"👤 *Пользователь:* `{uid}`\n"
                    f"📌 *Тема:* {subject}\n\n"
                    f"💬 *Сообщение:*\n{message[:500]}",
                    parse_mode="Markdown",
                    reply_markup=keyboard,
                ),
                loop,  # Передаём явно созданный loop главного потока
            )

    db.collection("helpdesk").where("status", "==", "open").on_snapshot(on_snapshot)
    log.info("📩 Слушатель Helpdesk запущен")


# ════════════════════════════════════════════
# ТОЧКА ВХОДА
# ════════════════════════════════════════════
async def post_init(app: Application):
    """Запускается после того, как event loop уже создан в рамках приложения."""
    loop = asyncio.get_running_loop()  # Получаем текущий рабочий loop главного потока
    start_feed_listener(app, loop)
    start_helpdesk_listener(app, loop)


def main():
    # Явно инициализируем Event Loop для совместимости с Python 3.12+
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    application = (
        Application.builder()
        .token(TELEGRAM_TOKEN)
        .post_init(post_init)
        .build()
    )

    # Команды
    application.add_handler(CommandHandler("start",    cmd_start))
    application.add_handler(CommandHandler("help",     cmd_start))
    application.add_handler(CommandHandler("ban",      cmd_ban))
    application.add_handler(CommandHandler("unban",    cmd_unban))
    application.add_handler(CommandHandler("warn",     cmd_warn))
    application.add_handler(CommandHandler("delete",   cmd_delete))
    application.add_handler(CommandHandler("userinfo", cmd_userinfo))
    application.add_handler(CommandHandler("stats",    cmd_stats))
    application.add_handler(CommandHandler("pending",  cmd_pending))

    # Кнопки
    application.add_handler(CallbackQueryHandler(handle_callback))

    log.info("🚀 Admin Bot запущен!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()