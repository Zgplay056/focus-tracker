from fastapi import FastAPI
from database import get_connection
from models import TaskCreate
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_tables():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            activity_tag TEXT,
            created_at TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS focus_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            started_at TEXT NOT NULL,
            ended_at TEXT,
            duration_seconds INTEGER,
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
    """)

    connection.commit()
    connection.close()


@app.on_event("startup")
def startup():
    create_tables()


@app.get("/")
def root():
    return {
        "message": "Focus Tracker API is running"
    }

@app.post("/tasks")
def create_task(task: TaskCreate):
    connection = get_connection()
    cursor = connection.cursor()

    created_at = datetime.now().isoformat()

    cursor.execute(
        """
        INSERT INTO tasks (type, title, activity_tag, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (
            task.type,
            task.title,
            task.activity_tag,
            created_at
        )
    )

    connection.commit()

    task_id = cursor.lastrowid

    connection.close()

    return {
        "id": task_id,
        "message": "Task created successfully"
    }

@app.get("/tasks")
def get_tasks():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT * FROM tasks
        ORDER BY created_at DESC
    """)

    tasks = cursor.fetchall()

    connection.close()

    return [dict(task) for task in tasks]

@app.post("/tasks/{task_id}/start")
def start_task(task_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    now = datetime.now()

    cursor.execute("""
        SELECT * FROM focus_sessions
        WHERE ended_at IS NULL
    """)

    active_session = cursor.fetchone()

    finished_task_id = None

    if active_session:
        started_at = datetime.fromisoformat(
            active_session["started_at"]
        )

        duration_seconds = int(
            (now - started_at).total_seconds()
        )

        cursor.execute("""
            UPDATE focus_sessions
            SET ended_at = ?, duration_seconds = ?
            WHERE id = ?
        """, (
            now.isoformat(),
            duration_seconds,
            active_session["id"]
        ))

        finished_task_id = active_session["task_id"]

    cursor.execute("""
        INSERT INTO focus_sessions (
            task_id,
            started_at
        )
        VALUES (?, ?)
    """, (
        task_id,
        now.isoformat()
    ))

    connection.commit()

    session_id = cursor.lastrowid

    connection.close()

    return {
        "id": session_id,
        "task_id": task_id,
        "finished_task_id": finished_task_id,
        "message": "Focus session started"
    }

@app.post("/tasks/{task_id}/finish")
def finish_task(task_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    # Procura uma sessão ativa para essa tarefa
    cursor.execute("""
        SELECT * FROM focus_sessions
        WHERE task_id = ? AND ended_at IS NULL
    """, (task_id,))

    active_session = cursor.fetchone()

    # Não existe sessão ativa para essa tarefa
    if not active_session:
        connection.close()

        return {
            "message": "No active session found for this task"
        }

    now = datetime.now()

    started_at = datetime.fromisoformat(
        active_session["started_at"]
    )

    duration_seconds = int(
        (now - started_at).total_seconds()
    )

    # Finaliza a sessão
    cursor.execute("""
        UPDATE focus_sessions
        SET ended_at = ?, duration_seconds = ?
        WHERE id = ?
    """, (
        now.isoformat(),
        duration_seconds,
        active_session["id"]
    ))

    connection.commit()
    connection.close()

    return {
        "id": active_session["id"],
        "task_id": task_id,
        "duration_seconds": duration_seconds,
        "message": "Focus session finished"
    }

@app.get("/sessions")
def get_sessions():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            focus_sessions.id,
            focus_sessions.task_id,
            focus_sessions.started_at,
            focus_sessions.ended_at,
            focus_sessions.duration_seconds,

            tasks.title AS task_title,
            tasks.type AS task_type,
            tasks.activity_tag

        FROM focus_sessions

        JOIN tasks
            ON focus_sessions.task_id = tasks.id

        ORDER BY focus_sessions.started_at DESC
    """)

    sessions = cursor.fetchall()

    connection.close()

    return [dict(session) for session in sessions]