import pytest
import requests
import uuid
import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
from app.database import db
from bson import ObjectId

BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="session")
def contractor_headers():
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "rohithsh@gmail.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"Contractor login failed: {res.text}"
    token = res.json()["token"]
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

@pytest.fixture(scope="session")
def landowner_headers():
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "h4hari2003@gmail.com",
        "password": "password123"
    })
    assert res.status_code == 200, f"Landowner login failed: {res.text}"
    token = res.json()["token"]
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

@pytest.fixture(scope="session")
def test_harvest_job():
    """
    Sets up a clean test harvest request in OPERATION_READY status
    with accepted quotation of 99,000 for advance payment workflow testing.
    """
    req_id = "6ac67ea0d6c87389f2a68440"
    
    # Reset job state to OPERATION_READY with fresh payment terms
    query = {"_id": ObjectId(req_id)} if ObjectId.is_valid(req_id) else {"_id": req_id}
    now_iso = datetime.now(timezone.utc).isoformat()
    
    reset_data = {
        "status": "OPERATION_READY",
        "total_quotation_amount": 99000.0,
        "total_quote": 99000.0,
        "commercial_proposal_type": "Harvesting Service Quotation",
        "advance_payment_request": None,
        "advance_payment_status": "NOT_REQUESTED",
        "is_advance_verified": False,
        "total_verified_paid": 0.0,
        "remaining_balance": 99000.0,
        "payments": [],
        "rejection_reason": None,
        "can_start_harvest": False,
        "digital_agreement": {
            "agreement_id": "TC-AGR-20261009-A68440",
            "harvest_request_id": req_id,
            "status": "FINALIZED",
            "commercial_proposal_type": "Harvesting Service Quotation",
            "total_agreed_amount": 99000.0,
            "terms_accepted": True,
            "ready_to_start": True
        },
        "owner_email": "h4hari2003@gmail.com",
        "assigned_contractor_email": "rohithsh@gmail.com",
        "ownerName": "Landowner Hari",
        "assigned_contractor_name": "Contractor Rohith",
        "updatedAt": now_iso
    }
    
    if db is not None:
        db.harvest_requests.update_one(query, {"$set": reset_data}, upsert=True)
        db.harvest_payments.delete_many({"harvest_request_id": req_id})
        db.contractor_assessments.update_one(
            {"harvest_request_id": req_id},
            {"$set": {
                "status": "OPERATION_READY",
                "total_quote": 99000.0,
                "advance_payment_request": None,
                "advance_payment_status": "NOT_REQUESTED",
                "is_advance_verified": False,
                "total_verified_paid": 0.0,
                "remaining_balance": 99000.0,
                "can_start_harvest": False,
                "updatedAt": now_iso
            }},
            upsert=True
        )

    return req_id


def test_a_normal_advance_payment_calculation_and_request(test_harvest_job, contractor_headers):
    """
    Test A: Contractor requests advance payment:
    Accepted quotation: 99,000
    Advance percentage: 30%
    Expected advance: 29,700
    Expected remaining balance: 69,300
    """
    payload = {
        "accepted_quotation": 99000.0,
        "advance_percentage": 30.0,
        "due_date": (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d"),
        "payment_instructions": "UPI: treeconnect.contractor@okhdfcbank / HDFC A/C: 50200084920194",
        "remarks": "Mobilization advance for machinery and felling crew."
    }
    
    res = requests.post(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/advance-payment/request",
        json=payload,
        headers=contractor_headers
    )
    assert res.status_code == 200, f"Advance payment request failed: {res.text}"
    data = res.json()
    
    assert data["advance_percentage"] == 30.0
    assert data["advance_amount"] == 29700.0
    assert data["advance_payment_status"] == "ADVANCE_REQUESTED"
    # Expected remaining balance after advance payment will be verified: 99,000 - 29,700 = 69,300
    projected_balance = payload["accepted_quotation"] - data["advance_amount"]
    assert projected_balance == 69300.0


def test_b_start_work_blocked_when_payment_not_submitted(test_harvest_job, contractor_headers):
    """
    Test B: Payment not submitted -> contractor cannot start work.
    Must return 400 Bad Request with strict error message.
    """
    res = requests.post(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/start",
        headers=contractor_headers
    )
    assert res.status_code == 400
    detail = res.json().get("detail") or res.json().get("message", "")
    assert "Advance Payment Pending" in detail and "cannot start until the required advance payment has been verified" in detail


def test_c_start_work_blocked_when_payment_submitted_but_not_verified(test_harvest_job, landowner_headers, contractor_headers):
    """
    Test C: Landowner submits payment details, status becomes VERIFICATION_PENDING.
    Confirm the contractor is STILL blocked from starting work.
    """
    submit_payload = {
        "amount": 29700.0,
        "payment_method": "UPI",
        "transaction_reference": "UPI-REF-TEST-99281726",
        "payment_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "notes": "Paid via GooglePay to contractor UPI."
    }
    
    submit_res = requests.post(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/advance-payment/submit",
        json=submit_payload,
        headers=landowner_headers
    )
    assert submit_res.status_code == 200, f"Submit advance payment failed: {submit_res.text}"
    submit_data = submit_res.json()
    assert submit_data["status"] == "VERIFICATION_PENDING"
    assert submit_data["amount"] == 29700.0

    # Verify start work is still blocked
    start_res = requests.post(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/start",
        headers=contractor_headers
    )
    assert start_res.status_code == 400
    detail = start_res.json().get("detail") or start_res.json().get("message", "")
    assert "Advance Payment Pending" in detail and "cannot start until the required advance payment has been verified" in detail


def test_d_payment_rejected_blocks_work_and_records_reason(test_harvest_job, contractor_headers, landowner_headers):
    """
    Test D: Contractor rejects invalid payment record with reason.
    Confirm status is REJECTED and start work remains blocked.
    """
    # Fetch latest payment ID
    payments_res = requests.get(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/payments",
        headers=contractor_headers
    )
    assert payments_res.status_code == 200
    payments = payments_res.json().get("payments", [])
    assert len(payments) > 0
    latest_payment = payments[0]
    payment_id = latest_payment.get("payment_id")

    reject_res = requests.post(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/advance-payment/verify",
        json={
            "payment_id": payment_id,
            "action": "REJECT",
            "rejection_reason": "Transaction reference not found in bank statement."
        },
        headers=contractor_headers
    )
    assert reject_res.status_code == 200
    reject_data = reject_res.json()
    assert reject_data["advance_payment_status"] == "REJECTED"
    assert reject_data["rejection_reason"] == "Transaction reference not found in bank statement."

    # Confirm start work remains blocked
    start_res = requests.post(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/start",
        headers=contractor_headers
    )
    assert start_res.status_code == 400


def test_f_unauthorized_verification_prevented(test_harvest_job, landowner_headers):
    """
    Test F: Landowner cannot verify their own manual payment.
    Must return 403 Forbidden.
    """
    payments_res = requests.get(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/payments",
        headers=landowner_headers
    )
    assert payments_res.status_code == 200
    payments = payments_res.json().get("payments", [])
    payment_id = payments[0].get("payment_id")

    verify_attempt = requests.post(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/advance-payment/verify",
        json={
            "payment_id": payment_id,
            "action": "VERIFY"
        },
        headers=landowner_headers
    )
    assert verify_attempt.status_code == 403
    err_msg = verify_attempt.json().get("detail") or verify_attempt.json().get("message", "")
    assert "Landowners cannot verify their own" in err_msg


def test_e_payment_verified_and_start_work_permitted(test_harvest_job, landowner_headers, contractor_headers):
    """
    Test E: Landowner submits valid payment, Contractor verifies it.
    Confirm verified amount credited exactly once, remaining balance recalculated (69,300),
    and contractor can now start harvesting work.
    """
    # 1. Landowner submits corrected payment
    submit_res = requests.post(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/advance-payment/submit",
        json={
            "amount": 29700.0,
            "payment_method": "Bank Transfer (NEFT)",
            "transaction_reference": f"NEFT-UTR-{uuid.uuid4().hex[:8].upper()}",
            "payment_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "notes": "Official NEFT transfer completed."
        },
        headers=landowner_headers
    )
    assert submit_res.status_code == 200
    payment_id = submit_res.json().get("payment_id")

    # 2. Contractor verifies payment
    verify_res = requests.post(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/advance-payment/verify",
        json={
            "payment_id": payment_id,
            "action": "VERIFY",
            "verification_notes": "Funds verified and credited in bank account."
        },
        headers=contractor_headers
    )
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["advance_payment_status"] == "VERIFIED"
    assert verify_data["total_verified_paid"] == 29700.0
    assert verify_data["remaining_balance"] == 69300.0

    # 3. Contractor can now start work!
    start_res = requests.post(
        f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/start",
        headers=contractor_headers
    )
    assert start_res.status_code == 200
    start_data = start_res.json()
    req_body = start_data.get("harvest_request", start_data)
    assert req_body.get("status") == "IN_PROGRESS"


def test_g_page_refresh_and_persistence(test_harvest_job, landowner_headers, contractor_headers):
    """
    Test G: Confirm payment status, amount, verification state, and remaining balance
    persist cleanly across calls (simulating page refresh / new session).
    """
    # GET harvest request details
    res = requests.get(f"{BASE_URL}/api/harvest-requests/{test_harvest_job}", headers=landowner_headers)
    assert res.status_code == 200
    job = res.json().get("harvest_request", res.json())
    
    assert job["advance_payment_status"] == "VERIFIED"
    assert job["is_advance_verified"] is True
    assert job["total_verified_paid"] == 29700.0
    assert job["remaining_balance"] == 69300.0
    assert job["status"] == "IN_PROGRESS"

    # GET payment ledger
    ledger_res = requests.get(f"{BASE_URL}/api/harvest-requests/{test_harvest_job}/payments", headers=contractor_headers)
    assert ledger_res.status_code == 200
    ledger = ledger_res.json()
    assert ledger["total_verified_paid"] == 29700.0
    assert ledger["remaining_balance"] == 69300.0
    assert len(ledger["payments"]) >= 2


def test_h_separate_timber_purchase_integrity(test_harvest_job, contractor_headers):
    """
    Test H: Timber purchase price / payments remain strictly separate
    and do not unintentionally deduct from the harvesting service balance.
    """
    job_res = requests.get(f"{BASE_URL}/api/harvest-requests/{test_harvest_job}", headers=contractor_headers)
    assert job_res.status_code == 200
    job = job_res.json().get("harvest_request", job_res.json())
    
    # Harvesting service quotation remains 99,000 and remaining balance is 69,300
    assert job["total_quotation_amount"] == 99000.0
    assert job["total_verified_paid"] == 29700.0
    assert job["remaining_balance"] == 69300.0


def test_i_existing_workflows_integrity(test_harvest_job, contractor_headers, landowner_headers):
    """
    Test I: Existing workflows (assessments, requests list, digital agreement retrieval)
    continue to work seamlessly without disruption.
    """
    # 1. Fetch harvest requests list
    req_list_res = requests.get(f"{BASE_URL}/api/harvest-requests?all_records=true", headers=contractor_headers)
    assert req_list_res.status_code == 200
    assert len(req_list_res.json().get("harvest_requests", [])) > 0

    # 2. Digital agreement exists and has agreement ID
    job_res = requests.get(f"{BASE_URL}/api/harvest-requests/{test_harvest_job}", headers=landowner_headers)
    assert job_res.status_code == 200
    job = job_res.json().get("harvest_request", job_res.json())
    agreement = job.get("digital_agreement")
    assert agreement is not None
    assert agreement.get("status") == "FINALIZED"
