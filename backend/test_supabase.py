#!/usr/bin/env python3
"""
Test Supabase connection and insert
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_SERVICE_ROLE_KEY: {'*' * 10 if SUPABASE_SERVICE_ROLE_KEY else 'NOT SET'}")
print()

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ ERROR: Supabase environment variables not set!")
    print("Make sure you have a .env file with:")
    print("  SUPABASE_URL=your_url")
    print("  SUPABASE_SERVICE_ROLE_KEY=your_key")
    exit(1)

print("✅ Environment variables loaded")
print()

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    print("✅ Supabase client created")
    print()
    
    # Try to insert a test record
    print("Testing INSERT into videos table...")
    test_data = {
        "user_id": "887eb738-f3a0-4546-ad55-9faaa8e85d43",  # Valid UUID
        "title": "Test Video",
        "url": "https://youtube.com/test",
        "summary": "This is a test summary",
        "notes": ["Note 1", "Note 2", "Note 3"],
        "thumbnail": None,
        "transcription": "Test transcription",
        "category": "test",
        "duration": 30.0,
    }
    
    result = supabase.table("videos").insert(test_data).execute()
    print(f"✅ INSERT successful!")
    print(f"Inserted record ID: {result.data[0]['user_id'] if result.data else 'Unknown'}")
    print(f"Full response: {result.data}")
    print()
    
    # Try to read back
    print("Testing SELECT from videos table...")
    result = supabase.table("videos").select("*").limit(5).execute()
    print(f"✅ SELECT successful!")
    print(f"Found {len(result.data)} records")
    for i, record in enumerate(result.data[:3], 1):
        print(f"  {i}. {record.get('title', 'No title')} - {record.get('user_id', 'No ID')}")
    print()
    
    print("🎉 All tests passed! Database is working correctly.")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
