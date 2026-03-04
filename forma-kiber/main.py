from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from pydantic import BaseModel
from datetime import datetime
import uvicorn
import asyncpg
import os
from contextlib import asynccontextmanager

# PostgreSQL подключение к твоей базе
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

async def get_db():
    conn = await asyncpg.connect(**DB_CONFIG)
    return conn

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🟢 Запуск приложения...")
    conn = await get_db()
    try:
        # Проверяем существование таблицы users
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        """)
        
        if not table_exists:
            # Создаем таблицу если её нет
            await conn.execute('''
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    fio VARCHAR(255) NOT NULL,
                    group_name VARCHAR(100) NOT NULL,
                    role VARCHAR(50) NOT NULL,
                    arcoins INTEGER DEFAULT 100,
                    registered_at TIMESTAMP NOT NULL
                )
            ''')
            print("✅ Таблица users создана")
        else:
            # Проверяем и добавляем колонку arcoins если её нет
            await conn.execute('''
                DO $$
                BEGIN
                    BEGIN
                        ALTER TABLE users ADD COLUMN arcoins INTEGER DEFAULT 100;
                    EXCEPTION
                        WHEN duplicate_column THEN 
                            RAISE NOTICE 'Column arcoins already exists';
                    END;
                END $$;
            ''')
            print("✅ Проверка таблицы users выполнена")
            
    except Exception as e:
        print(f"❌ Ошибка при инициализации БД: {e}")
    finally:
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

# Функция для поиска файла в разных местах
def find_file(filename):
    # Текущая папка (где main.py)
    if os.path.exists(filename):
        return filename
    # В папке forma-kiber
    if os.path.exists(f"forma-kiber/{filename}"):
        return f"forma-kiber/{filename}"
    # В родительской папке
    if os.path.exists(f"../{filename}"):
        return f"../{filename}"
    # В корневой папке
    if os.path.exists(f"../../{filename}"):
        return f"../../{filename}"
    return None

# ===== HTML СТРАНИЦЫ =====
@app.get("/forma-signup.html", response_class=HTMLResponse)
async def get_signup():
    # Пробуем найти файл
    file_path = find_file("forma-signup.html")
    if file_path:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return HTMLResponse(content="Файл forma-signup.html не найден", status_code=404)

@app.get("/forma-signin.html", response_class=HTMLResponse)
async def get_signin():
    file_path = find_file("forma-signin.html")
    if file_path:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return HTMLResponse(content="Файл forma-signin.html не найден", status_code=404)

@app.get("/kiber-arena.html", response_class=HTMLResponse)
async def get_arena():
    file_path = find_file("kiber-arena.html")
    if file_path:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return HTMLResponse(content="Файл kiber-arena.html не найден", status_code=404)

# ===== JS ФАЙЛЫ =====
@app.get("/kiber-arena.js", response_class=HTMLResponse)
async def get_arena_js():
    file_path = find_file("kiber-arena.js")
    if file_path:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return HTMLResponse(content="Файл kiber-arena.js не найден", status_code=404)

@app.get("/kiber-arena-data.js", response_class=HTMLResponse)
async def get_arena_data():
    file_path = find_file("kiber-arena-data.js")
    if file_path:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return HTMLResponse(content="Файл kiber-arena-data.js не найден", status_code=404)

# ===== CSS ФАЙЛЫ =====
@app.get("/kiber-arena.css")
async def get_arena_css():
    file_path = find_file("kiber-arena.css")
    if file_path:
        return FileResponse(file_path, media_type="text/css")
    return HTMLResponse(content="Файл kiber-arena.css не найден", status_code=404)

@app.get("/forma-signup.css")
async def get_signup_css():
    file_path = find_file("forma-signup.css")
    if file_path:
        return FileResponse(file_path, media_type="text/css")
    return HTMLResponse(content="Файл forma-signup.css не найден", status_code=404)

@app.get("/forma-signin.css")
async def get_signin_css():
    file_path = find_file("forma-signin.css")
    if file_path:
        return FileResponse(file_path, media_type="text/css")
    return HTMLResponse(content="Файл forma-signin.css не найден", status_code=404)

# ===== ИЗОБРАЖЕНИЯ =====
@app.get("/logo.png")
async def get_logo():
    file_path = find_file("logo.png")
    if file_path:
        return FileResponse(file_path, media_type="image/png")
    return HTMLResponse(content="Файл logo.png не найден", status_code=404)

@app.get("/forma-kiber/logo.png")
async def get_logo_forma():
    file_path = find_file("forma-kiber/logo.png")
    if file_path:
        return FileResponse(file_path, media_type="image/png")
    return HTMLResponse(content="Файл logo.png не найден", status_code=404)

# ===== API ЛИДЕРБОРДА =====
@app.get("/api/leaderboard")
async def get_leaderboard():
    conn = await get_db()
    try:
        # Получаем всех пользователей из твоей БД
        users = await conn.fetch('''
            SELECT fio, group_name, COALESCE(arcoins, 100) as arcoins 
            FROM users 
            ORDER BY arcoins DESC
        ''')
        
        print(f"📊 Загружено {len(users)} пользователей для лидерборда")
        
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
        return JSONResponse(content=[], status_code=500)
    finally:
        await conn.close()

# ===== API =====
@app.post("/api/register")
async def register(user: UserRegister):
    conn = await get_db()
    try:
        # Проверяем, есть ли уже такой email
        existing = await conn.fetchrow(
            "SELECT email FROM users WHERE email = $1", 
            user.email
        )
        
        if existing:
            await conn.close()
            raise HTTPException(status_code=400, detail="Email уже существует")
        
        # Сохраняем в PostgreSQL с начальными 100 коинами
        registered_at = datetime.now()
        result = await conn.fetchrow('''
            INSERT INTO users (email, password, fio, group_name, role, arcoins, registered_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        ''', user.email, user.password, user.fio, user.group, user.role, 100, registered_at)
        
        user_id = result['id']
        await conn.close()
        
        print(f"✅ Новый пользователь зарегистрирован: {user.email}")
        
        return {
            'message': 'Пользователь успешно зарегистрирован',
            'user': {
                'id': user_id,
                'email': user.email,
                'fio': user.fio,
                'group': user.group,
                'role': user.role,
                'arcoins': 100
            }
        }
    
    except HTTPException:
        await conn.close()
        raise
    except Exception as e:
        await conn.close()
        print(f"❌ Ошибка регистрации: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
async def login(user: UserLogin):
    conn = await get_db()
    try:
        db_user = await conn.fetchrow('''
            SELECT id, email, password, fio, group_name, role, COALESCE(arcoins, 100) as arcoins
            FROM users 
            WHERE email = $1 AND password = $2
        ''', user.email, user.password)
        
        await conn.close()
        
        if db_user:
            print(f"✅ Успешный вход: {user.email}")
            return {
                'message': 'Успешный вход',
                'user': {
                    'id': db_user['id'],
                    'email': db_user['email'],
                    'fio': db_user['fio'],
                    'group': db_user['group_name'],
                    'role': db_user['role'],
                    'arcoins': db_user['arcoins']
                }
            }
        else:
            print(f"❌ Неудачная попытка входа: {user.email}")
            raise HTTPException(status_code=401, detail="Неверная почта или пароль")
    
    except HTTPException:
        await conn.close()
        raise
    except Exception as e:
        await conn.close()
        print(f"❌ Ошибка входа: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/test-db")
async def test_db():
    """Тестовый эндпоинт для проверки подключения к БД"""
    conn = await get_db()
    try:
        # Проверяем подключение
        version = await conn.fetchval("SELECT version()")
        
        # Проверяем наличие таблицы users
        table_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        """)
        
        # Считаем количество пользователей
        if table_exists:
            count = await conn.fetchval("SELECT COUNT(*) FROM users")
        else:
            count = 0
            
        return {
            "status": "ok",
            "database": "cyberarena_db",
            "connected": True,
            "table_exists": table_exists,
            "users_count": count
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "cyberarena_db",
            "connected": False,
            "error": str(e)
        }
    finally:
        await conn.close()

if __name__ == "__main__":
    print("="*60)
    print("🚀 ЛОКАЛЬНЫЙ СЕРВЕР ЗАПУСКАЕТСЯ")
    print("📦 База данных: cyberarena_db")
    print("📍 Адрес: http://localhost:8000")
    print("📁 Текущая папка:", os.getcwd())
    print("="*60)
    uvicorn.run(app, host="127.0.0.1", port=8000)