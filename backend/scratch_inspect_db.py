from app.database import db
import json

def inspect_db():
    print("=== HARVEST REQUESTS ===")
    reqs = list(db.harvest_requests.find())
    for r in reqs:
        r['_id'] = str(r['_id'])
        print(json.dumps(r, indent=2))
        
    print("\n=== PROPERTIES ===")
    props = list(db.properties.find())
    for p in props:
        p['_id'] = str(p['_id'])
        print(json.dumps(p, indent=2))

    print("\n=== TREE INVENTORIES ===")
    invs = list(db.tree_inventories.find())
    for i in invs:
        i['_id'] = str(i['_id'])
        print(json.dumps(i, indent=2))

if __name__ == "__main__":
    inspect_db()
