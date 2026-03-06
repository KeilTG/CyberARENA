from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime
import uvicorn
import asyncpg
import os
from contextlib import asynccontextmanager

# PostgreSQL подключение
DB_CONFIG = {
    'user': 'postgres',
    'password': '123321',
    'database': 'cyberarena_db',
    'host': 'localhost',
    'port': 5432
}

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    fio: str
    group: str
    role: str

class GiveCoins(BaseModel):
    email: str
    amount: int

class PurchaseItem(BaseModel):
    email: str
    item_id: str
    item_type: str  # 'frame', 'banner', 'gif'

# Модели для новых таблиц
class Tournament(BaseModel):
    id: str = None
    name: str
    category: str
    format: str
    date: str
    time: str
    maxParticipants: int
    description: str = ""
    image: str = ""

class Booking(BaseModel):
    seat_id: int
    user_email: str
    user_name: str
    date: str
    time: str

async def get_db():
    try:
        conn = await asyncpg.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Ошибка подключения к БД: {e}")
        return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🟢 Запуск приложения...")
    conn = None
    try:
        conn = await get_db()
        if conn:
            # Таблица users (существующая)
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    fio VARCHAR(255) NOT NULL,
                    group_name VARCHAR(100) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    arcoins INTEGER DEFAULT 100,
                    is_admin BOOLEAN DEFAULT FALSE,
                    registered_at TIMESTAMP NOT NULL
                )
            ''')
            print("✅ Таблица users проверена/создана")
            
            # === НОВАЯ ТАБЛИЦА: computers (компьютеры) ===
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS computers (
                    id SERIAL PRIMARY KEY,
                    seat_number INTEGER UNIQUE NOT NULL,
                    is_booked BOOLEAN DEFAULT FALSE,
                    booked_by_email VARCHAR(255) REFERENCES users(email) ON DELETE SET NULL,
                    booked_by_name VARCHAR(255),
                    booking_date DATE,
                    booking_time VARCHAR(50),
                    booked_at TIMESTAMP,
                    specs VARCHAR(255) DEFAULT 'Стандартная конфигурация'
                )
            ''')
            print("✅ Таблица computers создана/проверена")
            
            # Заполняем компьютеры (36 мест), если таблица пустая
            computers_count = await conn.fetchval("SELECT COUNT(*) FROM computers")
            if computers_count == 0:
                for i in range(1, 37):
                    await conn.execute('''
                        INSERT INTO computers (seat_number, is_booked, specs)
                        VALUES ($1, $2, $3)
                    ''', i, False, f'ПК-{i:02d}: RTX 3060, i5-12400F, 16GB RAM')
                print("✅ Добавлено 36 компьютеров")
            
            # === НОВАЯ ТАБЛИЦА: tournaments (турниры) ===
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS tournaments (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    format VARCHAR(10) NOT NULL,
                    date VARCHAR(20) NOT NULL,
                    time VARCHAR(20) NOT NULL,
                    max_participants INTEGER DEFAULT 16,
                    description TEXT,
                    image_url TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            ''')
            print("✅ Таблица tournaments создана/проверена")
            
            # Добавляем тестовые турниры, если таблица пустая
            tournaments_count = await conn.fetchval("SELECT COUNT(*) FROM tournaments")
            if tournaments_count == 0:
                test_tournaments = [
                    ('1', 'Турнир по CS2', 'CS2', '5v5', '2026-03-15', '18:00', 16, 'Командный турнир 5v5', ''),
                    ('2', 'Лига Valorant', 'Valorant', '5v5', '2026-03-20', '17:00', 32, 'Турнир по Valorant', ''),
                    ('3', 'Кубок Fortnite', 'Fortnite', '1v1', '2026-03-25', '19:00', 24, 'Одиночный турнир', '')
                ]
                for t in test_tournaments:
                    await conn.execute('''
                        INSERT INTO tournaments (id, name, category, format, date, time, max_participants, description, image_url)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        ON CONFLICT (id) DO NOTHING
                    ''', t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8])
                print("✅ Добавлены тестовые турниры")
            
            # Проверяем и добавляем колонку is_admin
            try:
                await conn.execute('''
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
                ''')
            except Exception as e:
                print(f"⚠️ Ошибка при добавлении колонки is_admin: {e}")
            
            # Проверяем, есть ли уже админ
            admin_exists = await conn.fetchval("SELECT COUNT(*) FROM users WHERE is_admin = TRUE")
            if admin_exists == 0:
                await conn.execute('''
                    INSERT INTO users (email, password, fio, group_name, role, arcoins, is_admin, registered_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (email) DO NOTHING
                ''', 'admin@cyberarena.ru', 'admin123', 'Администратор', 'admin', 'admin', 1000, True, datetime.now())
                print("✅ Создан тестовый администратор: admin@cyberarena.ru / admin123")
            
            # Создаем тестового пользователя
            user_exists = await conn.fetchval("SELECT COUNT(*) FROM users WHERE email = 'user@test.ru'")
            if user_exists == 0:
                await conn.execute('''
                    INSERT INTO users (email, password, fio, group_name, role, arcoins, is_admin, registered_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ''', 'user@test.ru', '123456', 'Тестовый Пользователь', '1И-1-25', 'player', 150, False, datetime.now())
                print("✅ Создан тестовый пользователь: user@test.ru / 123456")
                
    except Exception as e:
        print(f"❌ Ошибка при инициализации БД: {e}")
    finally:
        if conn:
            await conn.close()
    
    yield
    print("🔴 Остановка приложения...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== ПОЛУЧАЕМ ПУТИ К ПАПКАМ =====
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

print(f"📁 Текущая папка (forma-kiber/): {current_dir}")
print(f"📁 Родительская папка (CyberARENA/): {parent_dir}")

# ===== 1. СНАЧАЛА ВСЕ API ЭНДПОИНТЫ =====
@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "API работает"}

@app.get("/api/test-db")
async def test_db():
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "connected": False}
            )
        
        version = await conn.fetchval("SELECT version()")
        users_count = await conn.fetchval("SELECT COUNT(*) FROM users")
        computers_count = await conn.fetchval("SELECT COUNT(*) FROM computers")
        tournaments_count = await conn.fetchval("SELECT COUNT(*) FROM tournaments")
        await conn.close()
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "ok",
                "connected": True,
                "users_count": users_count,
                "computers_count": computers_count,
                "tournaments_count": tournaments_count
            }
        )
    except Exception as e:
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "connected": False, "error": str(e)}
        )

# ===== API ДЛЯ ЛИДЕРБОРДА =====
@app.get("/api/leaderboard")
async def get_leaderboard():
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"detail": "Ошибка подключения к базе данных"}
            )
        
        users = await conn.fetch('''
            SELECT fio, group_name, arcoins 
            FROM users 
            ORDER BY arcoins DESC
        ''')
        
        await conn.close()
        
        leaderboard = []
        for i, user in enumerate(users, 1):
            leaderboard.append({
                'place': i,
                'student': user['fio'],
                'group': user['group_name'],
                'arcoins': user['arcoins']
            })
        
        return JSONResponse(content=leaderboard)
        
    except Exception as e:
        print(f"❌ Ошибка получения лидерборда: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

# ===== НОВЫЙ API ДЛЯ КОМПЬЮТЕРОВ =====
@app.get("/api/computers")
async def get_computers():
    """Получить статус всех компьютеров"""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"detail": "Ошибка подключения к базе данных"}
            )
        
        computers = await conn.fetch('''
            SELECT * FROM computers ORDER BY seat_number
        ''')
        
        await conn.close()
        
        result = []
        for c in computers:
            result.append({
                'id': c['id'],
                'seat_number': c['seat_number'],
                'is_booked': c['is_booked'],
                'booked_by_email': c['booked_by_email'],
                'booked_by_name': c['booked_by_name'],
                'booking_date': c['booking_date'],
                'booking_time': c['booking_time'],
                'specs': c['specs']
            })
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Ошибка получения компьютеров: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

@app.post("/api/computers/{seat_id}/book")
async def book_computer(seat_id: int, booking: Booking):
    """Забронировать компьютер"""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"detail": "Ошибка подключения к базе данных"}
            )
        
        # Проверяем, свободен ли компьютер
        computer = await conn.fetchrow(
            "SELECT * FROM computers WHERE seat_number = $1",
            seat_id
        )
        
        if not computer:
            await conn.close()
            return JSONResponse(
                status_code=404,
                content={"detail": "Компьютер не найден"}
            )
        
        if computer['is_booked']:
            await conn.close()
            return JSONResponse(
                status_code=400,
                content={"detail": "Компьютер уже занят"}
            )
        
        # Бронируем
        await conn.execute('''
            UPDATE computers 
            SET is_booked = TRUE,
                booked_by_email = $1,
                booked_by_name = $2,
                booking_date = $3,
                booking_time = $4,
                booked_at = $5
            WHERE seat_number = $6
        ''', booking.user_email, booking.user_name, booking.date, booking.time, 
            datetime.now(), seat_id)
        
        await conn.close()
        
        return JSONResponse(content={
            "status": "ok",
            "message": f"Компьютер {seat_id} забронирован"
        })
        
    except Exception as e:
        print(f"❌ Ошибка бронирования: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

@app.delete("/api/computers/{seat_id}/unbook")
async def unbook_computer(seat_id: int, email: str):
    """Отменить бронирование"""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"detail": "Ошибка подключения к базе данных"}
            )
        
        computer = await conn.fetchrow(
            "SELECT * FROM computers WHERE seat_number = $1",
            seat_id
        )
        
        if not computer:
            await conn.close()
            return JSONResponse(
                status_code=404,
                content={"detail": "Компьютер не найден"}
            )
        
        if not computer['is_booked']:
            await conn.close()
            return JSONResponse(
                status_code=400,
                content={"detail": "Компьютер не забронирован"}
            )
        
        if computer['booked_by_email'] != email:
            await conn.close()
            return JSONResponse(
                status_code=403,
                content={"detail": "Вы не можете отменить чужую бронь"}
            )
        
        await conn.execute('''
            UPDATE computers 
            SET is_booked = FALSE,
                booked_by_email = NULL,
                booked_by_name = NULL,
                booking_date = NULL,
                booking_time = NULL,
                booked_at = NULL
            WHERE seat_number = $1
        ''', seat_id)
        
        await conn.close()
        
        return JSONResponse(content={
            "status": "ok",
            "message": f"Бронь компьютера {seat_id} отменена"
        })
        
    except Exception as e:
        print(f"❌ Ошибка отмены брони: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

# ===== НОВЫЙ API ДЛЯ ТУРНИРОВ =====
@app.get("/api/tournaments")
async def get_tournaments():
    """Получить все турниры"""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"detail": "Ошибка подключения к базе данных"}
            )
        
        tournaments = await conn.fetch('''
            SELECT * FROM tournaments ORDER BY date, time
        ''')
        
        await conn.close()
        
        result = []
        for t in tournaments:
            result.append({
                'id': t['id'],
                'name': t['name'],
                'category': t['category'],
                'format': t['format'],
                'date': t['date'],
                'time': t['time'],
                'maxParticipants': t['max_participants'],
                'description': t['description'] or '',
                'image': t['image_url'] or ''
            })
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Ошибка получения турниров: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

@app.post("/api/tournaments")
async def create_tournament(tournament: Tournament):
    """Создать новый турнир"""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"error": "Ошибка подключения к БД"}
            )
        
        from datetime import datetime
        new_id = str(int(datetime.now().timestamp()))
        
        await conn.execute('''
            INSERT INTO tournaments (id, name, category, format, date, time, 
                                     max_participants, description, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ''', new_id, tournament.name, tournament.category, tournament.format,
            tournament.date, tournament.time, tournament.maxParticipants,
            tournament.description, tournament.image)
        
        await conn.close()
        
        return JSONResponse(content={
            "status": "ok",
            "id": new_id,
            "message": "Турнир создан"
        })
    except Exception as e:
        print(f"❌ Ошибка создания турнира: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.put("/api/tournaments/{tournament_id}")
async def update_tournament(tournament_id: str, tournament: Tournament):
    """Обновить турнир"""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"error": "Ошибка подключения к БД"}
            )
        
        await conn.execute('''
            UPDATE tournaments 
            SET name = $1, category = $2, format = $3, date = $4, 
                time = $5, max_participants = $6, description = $7, image_url = $8
            WHERE id = $9
        ''', tournament.name, tournament.category, tournament.format,
            tournament.date, tournament.time, tournament.maxParticipants,
            tournament.description, tournament.image, tournament_id)
        
        await conn.close()
        
        return JSONResponse(content={
            "status": "ok", 
            "message": "Турнир обновлён"
        })
    except Exception as e:
        print(f"❌ Ошибка обновления турнира: {e}")
        if conn:
            await conn.close()
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.delete("/api/tournaments/{tournament_id}")
async def delete_tournament(tournament_id: str):
    """Удалить турнир"""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"error": "Ошибка подключения к БД"}
            )
        
        await conn.execute('DELETE FROM tournaments WHERE id = $1', tournament_id)
        
        await conn.close()
        
        return JSONResponse(content={
            "status": "ok", 
            "message": "Турнир удалён"
        })
    except Exception as e:
        print(f"❌ Ошибка удаления турнира: {e}")
        if conn:
            await conn.close()
        return JSONResponse(status_code=500, content={"error": str(e)})

# ===== АДМИНСКИЕ API =====
@app.get("/api/admin/users")
async def get_all_users():
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"detail": "Ошибка подключения к базе данных"}
            )
        
        users = await conn.fetch('''
            SELECT id, email, fio, group_name, role, arcoins, is_admin, registered_at
            FROM users 
            ORDER BY registered_at DESC
        ''')
        
        await conn.close()
        
        result = []
        for user in users:
            result.append({
                'id': user['id'],
                'email': user['email'],
                'fio': user['fio'],
                'group': user['group_name'],
                'role': user['role'],
                'arcoins': user['arcoins'],
                'is_admin': user['is_admin'],
                'registered_at': user['registered_at'].isoformat() if user['registered_at'] else None
            })
        
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"❌ Ошибка получения пользователей: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

@app.post("/api/admin/give-coins")
async def give_coins(data: GiveCoins):
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"detail": "Ошибка подключения к базе данных"}
            )
        
        user = await conn.fetchrow(
            "SELECT id, arcoins FROM users WHERE email = $1", 
            data.email
        )
        
        if not user:
            await conn.close()
            return JSONResponse(
                status_code=404,
                content={"detail": "Пользователь не найден"}
            )
        
        await conn.execute('''
            UPDATE users 
            SET arcoins = arcoins + $1 
            WHERE email = $2
        ''', data.amount, data.email)
        
        new_balance = await conn.fetchval(
            "SELECT arcoins FROM users WHERE email = $1", 
            data.email
        )
        
        await conn.close()
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Коины успешно выданы",
                "email": data.email,
                "new_balance": new_balance
            }
        )
        
    except Exception as e:
        print(f"❌ Ошибка выдачи коинов: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

# ===== API ДЛЯ ПОКУПОК =====
@app.post("/api/purchase")
async def purchase_item(data: PurchaseItem):
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"success": False, "detail": "Ошибка подключения к базе данных"}
            )
        
        user = await conn.fetchrow(
            "SELECT id, arcoins FROM users WHERE email = $1", 
            data.email
        )
        
        if not user:
            await conn.close()
            return JSONResponse(
                status_code=404,
                content={"success": False, "detail": "Пользователь не найден"}
            )
        
        price = 0
        item_name = ""
        
        if data.item_type == 'frame':
            frames = [
                {'id': 'frame-none', 'price': 0, 'name': 'Без рамки'},
                {'id': 'frame-gold', 'price': 15, 'name': 'Золотая рамка'},
                {'id': 'frame-neon', 'price': 25, 'name': 'Неоновая рамка'},
                {'id': 'frame-silver', 'price': 20, 'name': 'Серебряная рамка'},
                {'id': 'frame-rainbow', 'price': 35, 'name': 'Радужная рамка'}
            ]
            for f in frames:
                if f['id'] == data.item_id:
                    price = f['price']
                    item_name = f['name']
                    break
        
        elif data.item_type == 'banner':
            banners = [
                {'id': 'banner-none', 'price': 0, 'name': 'Без баннера'},
                {'id': 'banner-blue', 'price': 20, 'name': 'Синий градиент'},
                {'id': 'banner-purple', 'price': 25, 'name': 'Фиолетовый градиент'},
                {'id': 'banner-fire', 'price': 30, 'name': 'Огненный градиент'},
                {'id': 'banner-cyber', 'price': 40, 'name': 'Кибер-сетка'}
            ]
            for b in banners:
                if b['id'] == data.item_id:
                    price = b['price']
                    item_name = b['name']
                    break
        
        elif data.item_type == 'gif':
            gifs = [
                {'id': 'gif-banner-1', 'price': 35, 'name': 'Кибер-неон'},
                {'id': 'gif-banner-2', 'price': 45, 'name': 'Огонь'},
                {'id': 'gif-banner-3', 'price': 55, 'name': 'Звёзды'},
                {'id': 'gif-banner-4', 'price': 65, 'name': 'Волны'},
                {'id': 'gif-banner-5', 'price': 80, 'name': 'Геометрия'},
                {'id': 'gif-banner-6', 'price': 100, 'name': 'Космос'}
            ]
            for g in gifs:
                if g['id'] == data.item_id:
                    price = g['price']
                    item_name = g['name']
                    break
        
        if price == 0 and data.item_id not in ['frame-none', 'banner-none']:
            await conn.close()
            return JSONResponse(
                status_code=400,
                content={"success": False, "detail": "Предмет не найден"}
            )
        
        if user['arcoins'] < price:
            await conn.close()
            return JSONResponse(
                status_code=400,
                content={"success": False, "detail": "Недостаточно коинов"}
            )
        
        await conn.execute('''
            UPDATE users 
            SET arcoins = arcoins - $1 
            WHERE email = $2
        ''', price, data.email)
        
        new_balance = await conn.fetchval(
            "SELECT arcoins FROM users WHERE email = $1", 
            data.email
        )
        
        await conn.close()
        
        print(f"✅ Покупка успешна: {data.email} купил {item_name} за {price} ARcoins")
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Предмет успешно куплен",
                "new_balance": new_balance,
                "item": {
                    "id": data.item_id,
                    "name": item_name,
                    "type": data.item_type
                }
            }
        )
        
    except Exception as e:
        print(f"❌ Ошибка покупки: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"success": False, "detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

@app.post("/api/register")
async def register(user: UserRegister):
    print(f"📝 Получен запрос на регистрацию: {user.email}")
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"detail": "Ошибка подключения к базе данных"}
            )
        
        existing = await conn.fetchrow(
            "SELECT email FROM users WHERE email = $1", 
            user.email
        )
        
        if existing:
            await conn.close()
            return JSONResponse(
                status_code=400,
                content={"detail": "Email уже существует"}
            )
        
        registered_at = datetime.now()
        result = await conn.fetchrow('''
            INSERT INTO users (email, password, fio, group_name, role, arcoins, is_admin, registered_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        ''', user.email, user.password, user.fio, user.group, user.role, 100, False, registered_at)
        
        user_id = result['id']
        await conn.close()
        
        print(f"✅ Пользователь зарегистрирован с ID: {user_id}")
        
        return JSONResponse(
            status_code=200,
            content={
                'message': 'Пользователь успешно зарегистрирован',
                'user': {
                    'id': user_id,
                    'email': user.email,
                    'fio': user.fio,
                    'group': user.group,
                    'role': user.role,
                    'arcoins': 100,
                    'is_admin': False
                }
            }
        )
    
    except Exception as e:
        print(f"❌ Ошибка регистрации: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

@app.post("/api/login")
async def login(user: UserLogin):
    print(f"🔑 Получен запрос на вход: {user.email}")
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"detail": "Ошибка подключения к базе данных"}
            )
        
        db_user = await conn.fetchrow('''
            SELECT id, email, password, fio, group_name, role, COALESCE(arcoins, 100) as arcoins, is_admin
            FROM users 
            WHERE email = $1 AND password = $2
        ''', user.email, user.password)
        
        await conn.close()
        
        if db_user:
            print(f"✅ Успешный вход: {user.email} (admin: {db_user['is_admin']})")
            return JSONResponse(
                status_code=200,
                content={
                    'message': 'Успешный вход',
                    'user': {
                        'id': db_user['id'],
                        'email': db_user['email'],
                        'fio': db_user['fio'],
                        'group': db_user['group_name'],
                        'role': db_user['role'],
                        'arcoins': db_user['arcoins'],
                        'is_admin': db_user['is_admin']
                    }
                }
            )
        else:
            print(f"❌ Неудачная попытка входа: {user.email}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Неверная почта или пароль"}
            )
    
    except Exception as e:
        print(f"❌ Ошибка входа: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

# ===== 2. ПОТОМ СТАТИЧЕСКИЕ ФАЙЛЫ =====
try:
    app.mount("/", StaticFiles(directory=parent_dir, html=True), name="root")
    print(f"✅ Статические файлы из {parent_dir} доступны по /")
except Exception as e:
    print(f"❌ Ошибка монтирования статических файлов: {e}")

if __name__ == "__main__":
    print("="*60)
    print("🚀 СЕРВЕР ЗАПУЩЕН")
    print("📍 Адрес: http://localhost:8000")
    print("📁 Текущая папка (forma-kiber/):", current_dir)
    print("📁 Родительская папка (CyberARENA/):", parent_dir)
    print("="*60)
    print("📄 Доступные страницы:")
    print("   • http://localhost:8000/kiber-arena.html")
    print("   • http://localhost:8000/kiber-arena-admin.html")
    print("   • http://localhost:8000/forma-kiber/forma-signup.html")
    print("   • http://localhost:8000/forma-kiber/forma-signin.html")
    print("="*60)
    print("🔧 API эндпоинты:")
    print("   • /api/health")
    print("   • /api/test-db")
    print("   • /api/leaderboard")
    print("   • /api/computers (GET)")
    print("   • /api/computers/{id}/book (POST)")
    print("   • /api/computers/{id}/unbook (DELETE)")
    print("   • /api/tournaments (GET, POST)")
    print("   • /api/tournaments/{id} (PUT, DELETE)")
    print("   • /api/admin/users")
    print("   • /api/admin/give-coins (POST)")
    print("   • /api/purchase (POST)")
    print("="*60)
    print("👤 Тестовые аккаунты:")
    print("   • admin@cyberarena.ru / admin123 (админ)")
    print("   • user@test.ru / 123456 (обычный пользователь)")
    print("="*60)
    uvicorn.run(app, host="127.0.0.1", port=8000)
