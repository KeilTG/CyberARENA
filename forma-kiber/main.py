from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime
import uvicorn
import asyncpg
import os
import json
from contextlib import asynccontextmanager

# PostgreSQL подключение
DB_CONFIG = {
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', '123321'),
    'database': os.getenv('DB_NAME', 'cyberarena_db'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '5432'))
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
    item_type: str  # 'frame' | 'banner' | 'gif'
    item_id: str

class AchievementClaim(BaseModel):
    email: str
    achievement_id: str

class TeamSync(BaseModel):
    invite_token: str
    name: str
    owner_email: str
    members: list

class TeamInviteCreate(BaseModel):
    invite_token: str
    invited_email: str
    captain_email: str

class TeamInvitationAccept(BaseModel):
    invitation_id: int
    user_email: str

class TeamInvitationDecline(BaseModel):
    invitation_id: int
    user_email: str

class TeamLeave(BaseModel):
    invite_token: str
    user_email: str

# Награды за достижения (ARcoins) — только те, у которых rewardCoins > 0
ACHIEVEMENT_REWARDS = {
    'first_booking': 5,
    'five_bookings': 10,
    'ten_bookings': 20,
    'first_tournament': 5,
    'three_tournaments': 15,
    'collector': 10,
}

# Цены на рамки, баннеры и гифки (как в kiber-arena-data.js)
PURCHASE_PRICES = {
    'frame': {'frame-none': 0, 'frame-gold': 15, 'frame-neon': 25, 'frame-silver': 20, 'frame-rainbow': 35},
    'banner': {'banner-none': 0, 'banner-blue': 20, 'banner-purple': 25, 'banner-fire': 30, 'banner-cyber': 40, 'banner-gif': 700},
    'gif': {'gif-banner-1': 35, 'gif-banner-2': 45, 'gif-banner-3': 55, 'gif-banner-4': 65, 'gif-banner-5': 80, 'gif-banner-6': 100}
}

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
            # Создаем таблицу users если её нет
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
            
            # Проверяем и добавляем колонку is_admin если её нет
            try:
                await conn.execute('''
                    ALTER TABLE users 
                    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
                ''')
                print("✅ Колонка is_admin проверена/добавлена")
            except Exception as e:
                print(f"⚠️ Ошибка при добавлении колонки is_admin: {e}")
            
            # Проверяем, есть ли уже админ
            admin_exists = await conn.fetchval("SELECT COUNT(*) FROM users WHERE is_admin = TRUE")
            if admin_exists == 0:
                # Создаем тестового админа
                await conn.execute('''
                    INSERT INTO users (email, password, fio, group_name, role, arcoins, is_admin, registered_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (email) DO NOTHING
                ''', 'admin@cyberarena.ru', 'admin123', 'Администратор', 'admin', 'admin', 1000, True, datetime.now())
                print("✅ Создан тестовый администратор: admin@cyberarena.ru / admin123")
            
            # Создаем тестового пользователя для проверки
            user_exists = await conn.fetchval("SELECT COUNT(*) FROM users WHERE email = 'user@test.ru'")
            if user_exists == 0:
                await conn.execute('''
                    INSERT INTO users (email, password, fio, group_name, role, arcoins, is_admin, registered_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ''', 'user@test.ru', '123456', 'Тестовый Пользователь', '1И-1-25', 'player', 150, False, datetime.now())
                print("✅ Создан тестовый пользователь: user@test.ru / 123456")
            
            # Таблица полученных наград за достижения (чтобы не выдавать дважды)
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS user_achievement_rewards (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    achievement_id VARCHAR(100) NOT NULL,
                    claimed_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    CONSTRAINT uq_user_achievement UNIQUE (email, achievement_id)
                )
            ''')
            print("✅ Таблица user_achievement_rewards проверена/создана")

            # Таблица команд (для приглашений и синхронизации)
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS teams (
                    id SERIAL PRIMARY KEY,
                    invite_token VARCHAR(64) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    owner_email VARCHAR(255) NOT NULL,
                    members JSONB NOT NULL DEFAULT '[]'::jsonb,
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            ''')
            print("✅ Таблица teams проверена/создана")

            await conn.execute('''
                CREATE TABLE IF NOT EXISTS team_invitations (
                    id SERIAL PRIMARY KEY,
                    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
                    invited_email VARCHAR(255) NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(team_id, invited_email)
                )
            ''')
            print("✅ Таблица team_invitations проверена/создана")
                
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
    """Проверка работы API"""
    return {"status": "ok", "message": "API работает"}

@app.get("/api/test-db")
async def test_db():
    """Тест подключения к базе данных"""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "connected": False, "error": "Не удалось подключиться к БД"}
            )
        
        version = await conn.fetchval("SELECT version()")
        table_exists = await conn.fetchval("""
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')
        """)
        count = await conn.fetchval("SELECT COUNT(*) FROM users") if table_exists else 0
        await conn.close()
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "ok",
                "database": "cyberarena_db",
                "connected": True,
                "table_exists": table_exists,
                "users_count": count
            }
        )
    except Exception as e:
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "connected": False, "error": str(e)}
        )

@app.get("/api/leaderboard")
async def get_leaderboard():
    """Получение данных для лидерборда"""
    print("📊 Запрос лидерборда")
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(
                status_code=500,
                content={"detail": "Ошибка подключения к базе данных"}
            )
        
        # Получаем всех пользователей, сортируем по arcoins
        users = await conn.fetch('''
            SELECT fio, group_name, arcoins 
            FROM users 
            ORDER BY arcoins DESC
        ''')
        
        await conn.close()
        
        # Формируем данные для лидерборда с местами
        leaderboard = []
        for i, user in enumerate(users, 1):
            leaderboard.append({
                'place': i,
                'student': user['fio'],
                'group': user['group_name'],
                'arcoins': user['arcoins']
            })
        
        print(f"✅ Отправлено {len(leaderboard)} записей")
        return JSONResponse(content=leaderboard)
        
    except Exception as e:
        print(f"❌ Ошибка получения лидерборда: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Внутренняя ошибка сервера: {str(e)}"}
        )

# ===== ПОИСК ПОЛЬЗОВАТЕЛЕЙ (для приглашений в команду) =====
@app.get("/api/users/search")
async def search_users(q: str = ""):
    """Поиск зарегистрированных пользователей по ФИО или email. Возвращает email и fio."""
    q = (q or "").strip()
    if len(q) < 2:
        return JSONResponse(content=[])
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(status_code=500, content={"detail": "Ошибка подключения к базе данных"})
        pattern = "%" + q + "%"
        users = await conn.fetch("""
            SELECT email, fio FROM users
            WHERE fio ILIKE $1 OR email ILIKE $1
            ORDER BY fio NULLS LAST, email
            LIMIT 20
        """, pattern)
        await conn.close()
        result = [{"email": u["email"], "fio": u["fio"] or ""} for u in users]
        return JSONResponse(content=result)
    except Exception as e:
        print(f"❌ Ошибка поиска пользователей: {e}")
        if conn:
            await conn.close()
        return JSONResponse(status_code=500, content={"detail": str(e)})

# ===== КОМАНДЫ И ПРИГЛАШЕНИЯ =====
@app.post("/api/teams/sync")
async def sync_team(data: TeamSync):
    """Создать или обновить команду в БД (вызывается при создании/изменении команды)."""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(status_code=500, content={"detail": "Ошибка подключения к БД"})
        members = data.members if isinstance(data.members, list) else []
        await conn.execute("""
            INSERT INTO teams (invite_token, name, owner_email, members, updated_at)
            VALUES ($1, $2, $3, $4::jsonb, NOW())
            ON CONFLICT (invite_token) DO UPDATE SET
                name = EXCLUDED.name,
                owner_email = EXCLUDED.owner_email,
                members = EXCLUDED.members,
                updated_at = NOW()
        """, data.invite_token, data.name, data.owner_email, json.dumps(members))
        await conn.close()
        return JSONResponse(content={"ok": True})
    except Exception as e:
        if conn:
            await conn.close()
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/teams")
async def get_my_teams(email: str = ""):
    """Получить команды, в которых пользователь состоит."""
    if not email:
        return JSONResponse(content=[])
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(status_code=500, content={"detail": "Ошибка подключения к БД"})
        rows = await conn.fetch("""
            SELECT id, invite_token, name, owner_email, members
            FROM teams
            WHERE members @> $1::jsonb
            ORDER BY updated_at DESC
        """, json.dumps([email]))
        await conn.close()
        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "invite_token": r["invite_token"],
                "name": r["name"],
                "owner_email": r["owner_email"],
                "members": r["members"] if isinstance(r["members"], list) else (r["members"] or [])
            })
        return JSONResponse(content=result)
    except Exception as e:
        if conn:
            await conn.close()
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.post("/api/teams/leave")
async def leave_team_api(data: TeamLeave):
    """Выйти из команды: удалить пользователя из members в БД."""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(status_code=500, content={"detail": "Ошибка подключения к БД"})
        team = await conn.fetchrow("SELECT id, owner_email, members FROM teams WHERE invite_token = $1", data.invite_token)
        if not team:
            await conn.close()
            return JSONResponse(status_code=404, content={"detail": "Команда не найдена"})
        members = list(team["members"]) if isinstance(team["members"], list) else list(team["members"] or [])
        if data.user_email not in members:
            await conn.close()
            return JSONResponse(content={"ok": True})
        members = [m for m in members if m != data.user_email]
        await conn.execute("UPDATE teams SET members = $1::jsonb, updated_at = NOW() WHERE id = $2", json.dumps(members), team["id"])
        await conn.close()
        return JSONResponse(content={"ok": True})
    except Exception as e:
        if conn:
            await conn.close()
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.post("/api/team-invitations")
async def create_team_invitation(data: TeamInviteCreate):
    """Отправить приглашение в команду."""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(status_code=500, content={"detail": "Ошибка подключения к БД"})
        team = await conn.fetchrow("SELECT id, owner_email, members FROM teams WHERE invite_token = $1", data.invite_token)
        if not team:
            await conn.close()
            return JSONResponse(status_code=404, content={"detail": "Команда не найдена. Сначала создайте команду и синхронизируйте её."})
        if team["owner_email"] != data.captain_email:
            await conn.close()
            return JSONResponse(status_code=403, content={"detail": "Только капитан может приглашать"})
        members = team["members"] if isinstance(team["members"], list) else (team["members"] or [])
        if data.invited_email in members:
            await conn.close()
            return JSONResponse(content={"ok": True, "message": "Уже в команде"})
        await conn.execute("""
            INSERT INTO team_invitations (team_id, invited_email, status)
            VALUES ($1, $2, 'pending')
            ON CONFLICT (team_id, invited_email) DO UPDATE SET status = 'pending', created_at = NOW()
        """, team["id"], data.invited_email)
        await conn.close()
        return JSONResponse(content={"ok": True, "message": "Приглашение отправлено"})
    except Exception as e:
        if conn:
            await conn.close()
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/team-invitations")
async def get_my_invitations(email: str = ""):
    """Получить входящие приглашения в команды (название команды + список участников)."""
    if not email:
        return JSONResponse(content=[])
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(status_code=500, content={"detail": "Ошибка подключения к БД"})
        rows = await conn.fetch("""
            SELECT ti.id, ti.team_id, ti.invited_email, ti.created_at,
                   t.name as team_name, t.owner_email, t.members, t.invite_token
            FROM team_invitations ti
            JOIN teams t ON t.id = ti.team_id
            WHERE ti.invited_email = $1 AND ti.status = 'pending'
            ORDER BY ti.created_at DESC
        """, email)
        result = []
        for r in rows:
            members = r["members"] if isinstance(r["members"], list) else (r["members"] or [])
            result.append({
                "id": r["id"],
                "team_id": r["team_id"],
                "team_name": r["team_name"],
                "owner_email": r["owner_email"],
                "members": members,
                "invite_token": r["invite_token"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None
            })
        await conn.close()
        return JSONResponse(content=result)
    except Exception as e:
        if conn:
            await conn.close()
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.post("/api/team-invitations/accept")
async def accept_team_invitation(data: TeamInvitationAccept):
    """Принять приглашение: добавить пользователя в команду в БД и вернуть команду."""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(status_code=500, content={"detail": "Ошибка подключения к БД"})
        inv = await conn.fetchrow(
            "SELECT id, team_id FROM team_invitations WHERE id = $1 AND invited_email = $2 AND status = 'pending'",
            data.invitation_id, data.user_email
        )
        if not inv:
            await conn.close()
            return JSONResponse(status_code=404, content={"detail": "Приглашение не найдено или уже обработано"})
        team = await conn.fetchrow("SELECT id, invite_token, name, owner_email, members FROM teams WHERE id = $1", inv["team_id"])
        if not team:
            await conn.close()
            return JSONResponse(status_code=404, content={"detail": "Команда не найдена"})
        members = list(team["members"]) if isinstance(team["members"], list) else list(team["members"] or [])
        if data.user_email in members:
            await conn.execute("UPDATE team_invitations SET status = 'accepted' WHERE id = $1", data.invitation_id)
            await conn.close()
            return JSONResponse(content={"ok": True, "team": {"invite_token": team["invite_token"], "name": team["name"], "owner_email": team["owner_email"], "members": members}})
        members.append(data.user_email)
        await conn.execute("UPDATE teams SET members = $1::jsonb, updated_at = NOW() WHERE id = $2", json.dumps(members), team["id"])
        await conn.execute("UPDATE team_invitations SET status = 'accepted' WHERE id = $1", data.invitation_id)
        await conn.close()
        return JSONResponse(content={
            "ok": True,
            "team": {
                "id": team["id"],
                "invite_token": team["invite_token"],
                "name": team["name"],
                "owner_email": team["owner_email"],
                "members": members
            }
        })
    except Exception as e:
        if conn:
            await conn.close()
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.post("/api/team-invitations/decline")
async def decline_team_invitation(data: TeamInvitationDecline):
    """Отклонить приглашение."""
    conn = None
    try:
        conn = await get_db()
        if not conn:
            return JSONResponse(status_code=500, content={"detail": "Ошибка подключения к БД"})
        await conn.execute(
            "UPDATE team_invitations SET status = 'declined' WHERE id = $1 AND invited_email = $2",
            data.invitation_id, data.user_email
        )
        await conn.close()
        return JSONResponse(content={"ok": True})
    except Exception as e:
        if conn:
            await conn.close()
        return JSONResponse(status_code=500, content={"detail": str(e)})

# ===== АДМИНСКИЕ API =====
@app.get("/api/admin/users")
async def get_all_users():
    """Получение всех пользователей для админки"""
    print("👥 Запрос списка пользователей (админ)")
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
        
        print(f"✅ Отправлено {len(result)} пользователей")
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
    """Выдать или забрать коины (amount > 0 — выдать, amount < 0 — списать). Баланс не уходит ниже 0."""
    print(f"💰 Коины: {data.email} {data.amount:+d}")
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
        
        current = user['arcoins'] or 0
        new_balance = max(0, current + data.amount)
        await conn.execute(
            "UPDATE users SET arcoins = $1 WHERE email = $2",
            new_balance, data.email
        )
        
        await conn.close()
        msg = "Коины успешно выданы" if data.amount > 0 else "Коины списаны" if data.amount < 0 else "Без изменений"
        return JSONResponse(
            status_code=200,
            content={
                "message": msg,
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
        
        # Проверяем, есть ли уже такой email
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

@app.post("/api/purchase")
async def purchase_item(data: PurchaseItem):
    """Покупка рамки/баннера/гифки за коины. Списывает arcoins и возвращает новый баланс."""
    print(f"🛒 Покупка: {data.email} | {data.item_type} | {data.item_id}")
    conn = None
    try:
        prices = PURCHASE_PRICES.get(data.item_type)
        if not prices:
            return JSONResponse(status_code=400, content={"detail": "Неизвестный тип товара"})
        price = prices.get(data.item_id)
        if price is None:
            return JSONResponse(status_code=400, content={"detail": "Неизвестный товар"})
        if price == 0:
            return JSONResponse(status_code=400, content={"detail": "Этот предмет бесплатный"})

        conn = await get_db()
        if not conn:
            return JSONResponse(status_code=500, content={"detail": "Ошибка подключения к БД"})

        user = await conn.fetchrow(
            "SELECT id, arcoins FROM users WHERE email = $1", data.email
        )
        if not user:
            await conn.close()
            return JSONResponse(status_code=404, content={"detail": "Пользователь не найден"})

        current_coins = user['arcoins'] or 0
        if current_coins < price:
            await conn.close()
            return JSONResponse(
                status_code=400,
                content={"detail": "Недостаточно коинов", "required": price, "current": current_coins}
            )

        new_balance = current_coins - price
        await conn.execute(
            "UPDATE users SET arcoins = $1 WHERE email = $2", new_balance, data.email
        )
        await conn.close()

        print(f"✅ Покупка успешна: {data.email}, новый баланс {new_balance}")
        return JSONResponse(
            status_code=200,
            content={"success": True, "new_balance": new_balance, "message": "Покупка совершена"}
        )
    except Exception as e:
        print(f"❌ Ошибка покупки: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )

@app.post("/api/achievement-claim")
async def achievement_claim(data: AchievementClaim):
    """Получить награду за достижение. Начисляет ARcoins и помечает награду как полученную."""
    print(f"🏆 Запрос награды: {data.email} | {data.achievement_id}")
    conn = None
    try:
        reward = ACHIEVEMENT_REWARDS.get(data.achievement_id)
        if reward is None or reward <= 0:
            return JSONResponse(status_code=400, content={"detail": "У этого достижения нет награды или неизвестный ID"})

        conn = await get_db()
        if not conn:
            return JSONResponse(status_code=500, content={"detail": "Ошибка подключения к БД"})

        # Уже получал?
        already = await conn.fetchrow(
            "SELECT id FROM user_achievement_rewards WHERE email = $1 AND achievement_id = $2",
            data.email, data.achievement_id
        )
        if already:
            await conn.close()
            return JSONResponse(status_code=400, content={"detail": "Награда уже получена"})

        user = await conn.fetchrow("SELECT id, arcoins FROM users WHERE email = $1", data.email)
        if not user:
            await conn.close()
            return JSONResponse(status_code=404, content={"detail": "Пользователь не найден"})

        new_balance = (user['arcoins'] or 0) + reward
        await conn.execute("UPDATE users SET arcoins = $1 WHERE email = $2", new_balance, data.email)
        await conn.execute(
            "INSERT INTO user_achievement_rewards (email, achievement_id, claimed_at) VALUES ($1, $2, NOW())",
            data.email, data.achievement_id
        )
        await conn.close()

        print(f"✅ Награда выдана: {data.email}, +{reward} ARcoins, баланс {new_balance}")
        return JSONResponse(
            status_code=200,
            content={"success": True, "new_balance": new_balance, "reward": reward, "message": f"+{reward} ARcoins"}
        )
    except Exception as e:
        print(f"❌ Ошибка выдачи награды: {e}")
        if conn:
            await conn.close()
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )

# ===== 2. ПОТОМ СТАТИЧЕСКИЕ ФАЙЛЫ =====
# Раздаем файлы из родительской папки (CyberARENA/) по корневому пути /
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
    print("   • http://localhost:8000/api/health")
    print("   • http://localhost:8000/api/test-db")
    print("   • http://localhost:8000/api/leaderboard")
    print("   • http://localhost:8000/api/users/search (GET, ?q=...)")
    print("   • http://localhost:8000/api/teams/sync (POST)")
    print("   • http://localhost:8000/api/teams (GET, ?email=...)")
    print("   • http://localhost:8000/api/team-invitations (GET/POST)")
    print("   • http://localhost:8000/api/admin/users")
    print("   • http://localhost:8000/api/admin/give-coins (POST)")
    print("="*60)
    print("👤 Тестовые аккаунты:")
    print("   • admin@cyberarena.ru / admin123 (админ)")
    print("   • user@test.ru / 123456 (обычный пользователь)")
    print("="*60)

    uvicorn.run(app, host="127.0.0.1", port=8000)
