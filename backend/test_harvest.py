import pytest
from fastapi.testclient import TestClient
from app.main import app
import app.routers.harvest as harvest_router

client = TestClient(app)

class MockDB:
    def __init__(self):
        self.contractor_assessments = self.MockAssessments()
        self.harvest_requests = self.MockRequests()
    class MockAssessments:
        def find_one(self, query): return None
    class MockRequests:
        def find_one(self, query): return {"_id": "req_id"}

class MockDBLegacy:
    def __init__(self):
        self.contractor_assessments = self.MockAssessments()
        self.harvest_requests = self.MockRequests()
    class MockAssessments:
        def find_one(self, query): return {"_id": "test", "total_quote": 5000}
    class MockRequests:
        def find_one(self, query): return {"_id": "req_id"}

def test_new_harvesting_service_quotation_succeeds(monkeypatch):
    monkeypatch.setattr(harvest_router, "db", MockDB())
    
    payload = {
        "commercial_proposal_type": "Harvesting Service Quotation",
        "estimated_harvestable_volume": 1.5,
        "assigned_workers_count": 5,
        "proposed_start_date": "2030-01-01",
        "felling_cost": 100,
        "total_quote": 100
    }
    
    res = client.post("/api/harvest-requests/66a4f22c1b82f0a1c1a99999/assessment", json=payload)
    assert res.status_code != 400 or "Harvesting Service Quotation is the only" not in res.text

def test_new_timber_purchase_offer_rejected(monkeypatch):
    monkeypatch.setattr(harvest_router, "db", MockDB())
    
    payload = {
        "commercial_proposal_type": "Timber Purchase Offer",
        "estimated_harvestable_volume": 1.5,
        "contractor_purchase_offer": 5000,
        "payment_terms": "Advance",
        "offer_valid_until": "2030-01-01"
    }
    
    res = client.post("/api/harvest-requests/66a4f22c1b82f0a1c1a99999/assessment", json=payload)
    assert res.status_code == 400
    assert "Harvesting Service Quotation is the only" in res.text

def test_new_purchase_and_harvesting_rejected(monkeypatch):
    monkeypatch.setattr(harvest_router, "db", MockDB())
    
    payload = {
        "commercial_proposal_type": "Purchase + Harvesting",
        "estimated_harvestable_volume": 1.5,
        "timber_purchase_price": 5000,
        "payment_terms": "Advance",
        "offer_valid_until": "2030-01-01"
    }
    
    res = client.post("/api/harvest-requests/66a4f22c1b82f0a1c1a99999/assessment", json=payload)
    assert res.status_code == 400
    assert "Harvesting Service Quotation is the only" in res.text

def test_existing_legacy_quotation_updates_succeed(monkeypatch):
    monkeypatch.setattr(harvest_router, "db", MockDBLegacy())
    
    payload = {
        "commercial_proposal_type": "Timber Purchase Offer",
        "estimated_harvestable_volume": 1.5,
        "contractor_purchase_offer": 5000,
        "payment_terms": "Advance",
        "offer_valid_until": "2030-01-01"
    }
    
    res = client.post("/api/harvest-requests/66a4f22c1b82f0a1c1a99999/assessment", json=payload)
    assert res.status_code != 400 or "Harvesting Service Quotation is the only" not in res.text

class MockDBUpdate:
    def __init__(self):
        self.harvest_requests = self.MockRequests()
    class MockRequests:
        def find_one(self, query): return {"_id": "req_id"}
        def update_one(self, query, update): pass

def test_complete_inspection_transportation_required_missing_fields(monkeypatch):
    monkeypatch.setattr(harvest_router, "db", MockDBUpdate())
    payload = {
        "verified_tree_count": 10,
        "is_transportation_required": True,
        "road_access_verification": "",
        "distance_to_haul_road": ""
    }
    res = client.post("/api/harvest-requests/66a4f22c1b82f0a1c1a99999/complete-inspection", json=payload)
    assert res.status_code == 400
    assert "road_access_verification is required" in res.text

def test_complete_inspection_transportation_required_success(monkeypatch):
    monkeypatch.setattr(harvest_router, "db", MockDBUpdate())
    payload = {
        "verified_tree_count": 10,
        "is_transportation_required": True,
        "road_access_verification": "Accessible",
        "distance_to_haul_road": "25m"
    }
    res = client.post("/api/harvest-requests/66a4f22c1b82f0a1c1a99999/complete-inspection", json=payload)
    assert res.status_code == 200

def test_complete_inspection_transportation_not_required(monkeypatch):
    monkeypatch.setattr(harvest_router, "db", MockDBUpdate())
    payload = {
        "verified_tree_count": 10,
        "is_transportation_required": False,
        "road_access_verification": "",
        "distance_to_haul_road": ""
    }
    res = client.post("/api/harvest-requests/66a4f22c1b82f0a1c1a99999/complete-inspection", json=payload)
    assert res.status_code == 200

def test_complete_inspection_timber_sale_implicitly_requires_transport(monkeypatch):
    monkeypatch.setattr(harvest_router, "db", MockDBUpdate())
    payload = {
        "verified_tree_count": 10,
        "landowner_preferred_arrangement": "INTERESTED_IN_TIMBER_SALE",
        "road_access_verification": "",
        "distance_to_haul_road": ""
    }
    res = client.post("/api/harvest-requests/66a4f22c1b82f0a1c1a99999/complete-inspection", json=payload)
    assert res.status_code == 400
    assert "road_access_verification is required" in res.text

def test_complete_inspection_harvesting_service_implicitly_skips_transport(monkeypatch):
    monkeypatch.setattr(harvest_router, "db", MockDBUpdate())
    payload = {
        "verified_tree_count": 10,
        "landowner_preferred_arrangement": "HARVESTING_SERVICE",
        "road_access_verification": "",
        "distance_to_haul_road": ""
    }
    res = client.post("/api/harvest-requests/66a4f22c1b82f0a1c1a99999/complete-inspection", json=payload)
    assert res.status_code == 200
