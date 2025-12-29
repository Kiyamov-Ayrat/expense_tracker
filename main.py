from fastapi import FastAPI
import uvicorn
from starlette.responses import FileResponse

from database.database import create_db_and_tables
from contextlib import asynccontextmanager
from routers import expense, amount, filter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

@asynccontextmanager
async def lifespan(app:FastAPI):
    create_db_and_tables()
    print("Server start! Open: http://localhost:8000/")
    yield
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def red_root():
    return FileResponse("frontend/index.html")

app.mount("/static", StaticFiles(directory="frontend"), name="static")
app.include_router(expense.router)
app.include_router(amount.router)
app.include_router(filter.router)

if __name__ == "__main__":
    uvicorn.run(app, host='0.0.0.0', port=8000)