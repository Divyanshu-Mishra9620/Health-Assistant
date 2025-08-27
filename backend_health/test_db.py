import psycopg2

conn = psycopg2.connect(
    "postgresql://neondb_owner:npg_nhvbUc16WrXK@ep-crimson-king-a12oem19-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
)

print("✅ Connected successfully!")
conn.close()
