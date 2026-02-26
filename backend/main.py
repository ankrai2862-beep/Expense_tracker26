from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

app = FastAPI()

# Restrict CORS to the frontend origin to allow credentials
origins = ["http://localhost:4200", "http://127.0.0.1:4200", "http://localhost:4200", "https://spontaneous-squirrel-c5ecff.netlify.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origins=["*"],

)

app.include_router(router)

@app.get("/")
async def root():
    return {"message": "Expense Tracker API is running"}
