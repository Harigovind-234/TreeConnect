import io
import base64
import time
from PIL import Image
from app.database import db

def compress_b64(b64_str, max_dim=1024, quality=75):
    if not b64_str or not isinstance(b64_str, str):
        return b64_str
    raw = b64_str.split(',')[-1]
    try:
        data = base64.b64decode(raw)
        img = Image.open(io.BytesIO(data))
        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=quality, optimize=True)
        return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
    except Exception as e:
        print(f'Error compressing image: {e}')
        return b64_str

def migrate():
    print('1. Migrating harvest_requests...')
    t0 = time.time()
    for req in db.harvest_requests.find({'site_inspection.inspection_photos': {'$exists': True, '$ne': []}}):
        si = req.get('site_inspection') or {}
        old_photos = si.get('inspection_photos') or []
        print(f'Found harvest request with {len(old_photos)} photos. Compressing...')
        new_photos = [compress_b64(p) for p in old_photos]
        db.harvest_requests.update_one({'_id': req['_id']}, {'$set': {'site_inspection.inspection_photos': new_photos}})
        old_lens = [len(p) for p in old_photos]
        new_lens = [len(p) for p in new_photos]
        print(f'Updated harvest request {req["_id"]}: {old_lens} -> {new_lens}')

    print('2. Migrating tree_inventories...')
    for inv in db.tree_inventories.find():
        update_ops = {}
        photos = inv.get('photos') or []
        if photos:
            new_photos = [compress_b64(p, max_dim=800, quality=75) for p in photos]
            update_ops['photos'] = new_photos
            update_ops['attachedPhotos'] = []
        sl = inv.get('speciesList') or []
        new_sl = []
        for item in sl:
            c_item = dict(item)
            if 'image' in c_item and c_item['image']:
                c_item['image'] = compress_b64(c_item['image'], max_dim=800, quality=75)
            c_item['photos'] = []
            c_item['attachedPhotos'] = []
            new_sl.append(c_item)
        update_ops['speciesList'] = new_sl
        db.tree_inventories.update_one({'_id': inv['_id']}, {'$set': update_ops})
        print(f'Updated tree inventory {inv["_id"]}')

    print(f'Migration completed successfully in {round(time.time() - t0, 2)}s!')

if __name__ == '__main__':
    migrate()
