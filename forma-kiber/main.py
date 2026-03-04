from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BD_FILE = 'bd.json'

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/api/login")
async def login(user: UserLogin):
    if not os.path.exists(BD_FILE):
        raise HTTPException(status_code=401, detail="Неверная почта или пароль")
    
    with open(BD_FILE, 'r', encoding='utf-8') as f:
        try:
            users = json.load(f)
        except:
            users = []
    
    for u in users:
        if u.get('email') == user.email and u.get('password') == user.password:
            return {
                'message': 'Успешный вход',
                'user': {
                    'id': u['id'],
                    'email': u['email'],
                    'fio': u['fio'],
                    'group': u['group'],
                    'role': u['role']
                }
            }
    
    raise HTTPException(status_code=401, detail="Неверная почта или пароль")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)