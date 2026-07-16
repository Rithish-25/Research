import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "loans.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assessments (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            education TEXT NOT NULL,
            income REAL NOT NULL,
            exp INTEGER NOT NULL,
            home TEXT NOT NULL,
            loan REAL NOT NULL,
            intent TEXT NOT NULL,
            rate REAL NOT NULL,
            dti REAL NOT NULL,
            cred_len INTEGER NOT NULL,
            credit_score INTEGER NOT NULL,
            defaults TEXT NOT NULL,
            risk REAL NOT NULL,
            decision TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def insert_assessment(record):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO assessments (
            id, date, age, gender, education, income, exp, home, 
            loan, intent, rate, dti, cred_len, credit_score, defaults, risk, decision
        ) VALUES (
            :id, :date, :age, :gender, :education, :income, :exp, :home,
            :loan, :intent, :rate, :dti, :cred_len, :credit_score, :defaults, :risk, :decision
        )
    """, record)
    conn.commit()
    conn.close()

def fetch_assessments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments ORDER BY date DESC")
    rows = cursor.fetchall()
    conn.close()
    
    # Convert list of sqlite3.Row objects to dictionary representations
    return [dict(row) for row in rows]

def delete_all_assessments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM assessments")
    conn.commit()
    conn.close()
