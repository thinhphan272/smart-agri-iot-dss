from fastapi import FastAPI

app = FastAPI(title="AgriGuard-IoT Backend API")

@app.get("/")
def read_root():
    return {"status": "online", "message": "AgriGuard-IoT AI Engine is ready!"}
