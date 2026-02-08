import os
import pandas as pd
from supabase import create_client, Client

# Usage: python scripts/upload_inventory.py parts_catalog.csv

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def upload_csv_to_supabase(csv_file_path):
    print(f"📊 Reading {csv_file_path}...")
    
    # Read CSV
    df = pd.read_csv(csv_file_path)
    
    # Clean data (ensure numbers are numbers)
    df['price'] = pd.to_numeric(df['price'], errors='coerce').fillna(0)
    df['stock'] = pd.to_numeric(df['stock'], errors='coerce').fillna(0).astype(int)
    
    # Convert to Dictionary records
    records = df.to_dict(orient='records')
    
    print(f"🚀 Uploading {len(records)} parts to Supabase...")
    
    # Bulk Upsert (Update if ID exists, Insert if not)
    try:
        data = supabase.table("parts_catalog").upsert(records).execute()
        print("✅ Inventory Sync Successful.")
    except Exception as e:
        print(f"❌ Upload Failed: {e}")

if __name__ == "__main__":
    upload_csv_to_supabase("parts_catalog.csv")
