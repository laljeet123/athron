from fastapi import FastAPI

app = FastAPI(title="Athron API")

@app.get("/")
def root():
    return {
        "message": "Athron backend is running!"
    }