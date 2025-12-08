import pandas as pd
import sys

try:
    file_path = 'Docs/daftar-pelanggan.xlsx'
    df = pd.read_excel(file_path, nrows=5)
    print("Columns found:")
    for col in df.columns:
        print(f"- {col}")
    
    print("\nFirst 5 rows:")
    print(df.head().to_string())
except Exception as e:
    print(f"Error reading excel: {e}")
