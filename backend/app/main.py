from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.addresses import router as addresses_router
from app.api.routes.admin import router as admin_router
from app.api.routes.cart import router as cart_router
from app.api.routes.cook import router as cook_router
from app.api.routes.foods import router as foods_router
from app.api.routes.marketplace import router as marketplace_router
from app.api.routes.orders import router as orders_router
from app.api.routes.profiles import router as profiles_router
from app.api.routes.reports import router as reports_router
from app.core.config import settings
from app.database.mongodb import close_database, connect_database, get_database


@asynccontextmanager
async def lifespan(_app: FastAPI):
    connect_database()
    yield
    close_database()


app = FastAPI(title="TasteLoop API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.client_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(addresses_router)
app.include_router(profiles_router)
app.include_router(foods_router)
app.include_router(marketplace_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(cook_router)
app.include_router(reports_router)
app.include_router(admin_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    get_database().command("ping")
    return {"status": "ok", "database": "connected"}
