import logging
import asyncio
from firebase_admin import credentials, firestore, firebase_admin
from aiogram import Bot, Dispatcher, types, F, html
from aiogram.filters import Command
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder

# --- КОНФИГУРАЦИЯ ---
API_TOKEN = '8603889172:AAGrovX2Bl4Ba8Q9jmOYqQ4WZP4tUIxet6U'
# Укажи путь к своему файлу ключей Firebase
cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
bot = Bot(token=API_TOKEN)
dp = Dispatcher()

# --- КЛАВИАТУРЫ ---

def get_main_menu():
    builder = ReplyKeyboardBuilder()
    builder.button(text="✅ Верификация")
    builder.button(text="🌐 Перейти на сайт")
    builder.button(text="❓ Помощь")
    builder.adjust(2)
    return builder.as_markup(resize_keyboard=True)

def get_site_inline():
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text="Открыть LearnPlay 🚀", 
        url="https://pystart-dd2db.firebaseapp.com") # Замени на свой домен
    )
    return builder.as_markup()

# --- ХЕНДЛЕРЫ ---

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    welcome_text = (
        f"👋 Привет, {html.bold(message.from_user.full_name)}!\n\n"
        f"Добро пожаловать в бот системы {html.code('LearnPlay')}.\n"
        "Здесь ты можешь подтвердить свой аккаунт и получить синюю галочку верификации. ✅\n\n"
        "Просто выбери нужное действие в меню ниже. 👇"
    )
    await message.answer(welcome_text, parse_mode="HTML", reply_markup=get_main_menu())

@dp.message(F.text == "✅ Верификация")
async def verify_instruction(message: types.Message):
    text = (
        "🔗 {0}\n\n"
        "1. Зайди в свой профиль на сайте.\n"
        "2. Нажми на иконку галочки (верификация).\n"
        "3. Скопируй свой {1}.\n"
        "4. **Отправь его мне ответным сообщением.**"
    ).format(html.bold("Как пройти верификацию:"), html.underline("UID"))
    await message.answer(text, parse_mode="HTML")

@dp.message(F.text == "🌐 Перейти на сайт")
async def go_to_site(message: types.Message):
    await message.answer("Нажми на кнопку ниже, чтобы перейти к обучению:", reply_markup=get_site_inline())

@dp.message(F.text == "❓ Помощь")
async def help_cmd(message: types.Message):
    await message.answer("Если возникли проблемы с UID, убедитесь, что вы скопировали его полностью (28 символов). По вопросам поддержки: @admin")

# Обработка UID (текст из 28 символов)
@dp.message(F.text.len() == 28)
async def process_uid(message: types.Message):
    user_uid = message.text.strip()
    
    # Визуальный эффект "Печатает..."
    await bot.send_chat_action(message.chat.id, "typing")
    status_msg = await message.answer("🔍 Проверяю UID в базе данных...")

    try:
        user_ref = db.collection("users").document(user_uid)
        
        # Обновляем поле verified
        user_ref.set({"verified": True}, merge=True)

        await asyncio.sleep(1) # Небольшая пауза для солидности
        await status_msg.edit_text(
            f"✅ {html.bold('Успех!')}\n\n"
            f"Аккаунт {html.code(user_uid)} верифицирован.\n"
            "Обновите страницу профиля на сайте, чтобы увидеть изменения.",
            parse_mode="HTML"
        )
    except Exception as e:
        logging.error(f"Firebase Error: {e}")
        await status_msg.edit_text("❌ Ошибка при связи с базой данных. Попробуйте позже.")

# Запуск
async def main():
    logging.basicConfig(level=logging.INFO)
    print("Бот запущен и готов к работе!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())