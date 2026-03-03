from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from datetime import datetime
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BD_FILE = 'bd.json'

class UserRegister(BaseModel):
    email: str
    password: str
    fio: str
    group: str
    role: str

@app.post("/api/register")
async def register(user_data: UserRegister):
    print(f"📥 Получены данные: {user_data}")
    
    # Загружаем существующих пользователей или создаем новый список
    if os.path.exists(BD_FILE):
        with open(BD_FILE, 'r', encoding='utf-8') as f:
            try:
                users = json.load(f)
            except:
                users = []
    else:
        users = []
    
    # Создаем нового пользователя
    new_user = {
        'id': len(users) + 1,
        'email': user_data.email,
        'password': user_data.password,
        'fio': user_data.fio,
        'group': user_data.group,
        'role': user_data.role,
        'registered_at': datetime.now().isoformat()
    }
    
    users.append(new_user)
    
    # Сохраняем в файл
    with open(BD_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=4)
    
    print(f"✅ Сохранено в {BD_FILE}")
    print(f"📁 Содержимое файла: {json.dumps(users, ensure_ascii=False, indent=2)}")
    
    return {'message': 'Успешно', 'user_id': new_user['id']}

@app.get("/api/users")
async def get_users():
    if os.path.exists(BD_FILE):
        with open(BD_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

if __name__ == "__main__":
    print(f"🚀 Сервер запущен")
    print(f"📁 Рабочая папка: {os.getcwd()}")
    print(f"📁 Файл БД: {os.path.join(os.getcwd(), BD_FILE)}")
    uvicorn.run(app, host="0.0.0.0", port=8000)