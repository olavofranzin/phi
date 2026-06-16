import urllib.request
import json
import os

API_URL = "https://n8n-n8n-editor.1unqx7.easypanel.host/api/v1/workflows/zGgIqiLlo5iAn8ud"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZjY4MTk5Mi00NWU2LTRlYzktYWZlMi1kNzk3NjNlM2Q0NWIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMThmNTVkOGItMTFkZC00YWU5LWFiMjAtNzZlOGNlZjQ0Nzk3IiwiaWF0IjoxNzc0NjM0NzE4fQ.ZAkvLywACjVOPtJdzVhY532GltR7nLo-3Zj9h-1u3HE"
HEADERS = {
    "X-N8N-API-KEY": API_KEY,
    "Accept": "application/json"
}

try:
    print("Fetching workflow...")
    req = urllib.request.Request(API_URL, headers=HEADERS)
    with urllib.request.urlopen(req) as response:
        workflow_data = json.loads(response.read().decode('utf-8'))
    
    with open('daily_entry_audit.json', 'w', encoding='utf-8') as f:
        json.dump(workflow_data, f, indent=2, ensure_ascii=False)
        
    print(f"Workflow saved to daily_entry_audit.json")
    print(f"Workflow Name: {workflow_data.get('name')}")
    
except Exception as e:
    print(f"Error: {e}")
