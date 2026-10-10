import pytest
import hmac
import hashlib
import json
import uuid
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from bson import ObjectId

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.main import app
from app.database import db
from app.routers.auth import create_access_token
from app.services.razorpay_service import (
    calculate_advance_paise,
    razorpay_service,
    RazorpayConfigError
)

client = TestClient(app)

TEST_LANDOWNER_EMAIL = "landowner.test@treeconnect.org"
TEST_OTHER_USER_EMAIL = "unauthorized.user@treeconnect.org"
TEST_ADMIN_EMAIL = "admin.test@treeconnect.org"
TEST_CONTRACTOR_EMAIL = "contractor.test@treeconnect.org"

TEST_KEY_ID = "rzp_test_hoR2mGOY0RUwQU"
TEST_KEY_SECRET = "mock_secret_key_12345"
TEST_WEBHOOK_SECRET = "mock_webhook_secret_67890"


@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Configures test environment variables and secrets."""
    monkeypatch.setattr(razorpay_service, "key_id", TEST_KEY_ID)
    monkeypatch.setattr(razorpay_service, "key_secret", TEST_KEY_SECRET)
    monkeypatch.setattr(razorpay_service, "webhook_secret", TEST_WEBHOOK_SECRET)
    monkeypatch.setattr(razorpay_service, "mode", "test")


@pytest.fixture
def landowner_token():
    return create_access_token({"email": TEST_LANDOWNER_EMAIL, "role": "landowner", "id": "usr_landowner_01"})


@pytest.fixture
def unauthorized_token():
    return create_access_token({"email": TEST_OTHER_USER_EMAIL, "role": "landowner", "id": "usr_other_02"})


@pytest.fixture
def admin_token():
    return create_access_token({"email": TEST_ADMIN_EMAIL, "role": "admin", "id": "usr_admin_03"})


@pytest.fixture
def sample_harvest_request():
    """
    Creates a sample harvest request in MongoDB with:
    - Accepted contractor quotation: ₹1,04,500
    - Advance percentage: 27%
    - Advance payment: ₹28,215
    """
    req_id = str(ObjectId())
    now_iso = datetime.now(timezone.utc).isoformat()
    req_doc = {
        "_id": ObjectId(req_id),
        "id": req_id,
        "owner_email": TEST_LANDOWNER_EMAIL,
        "ownerName": "Test Landowner",
        "assigned_contractor_email": TEST_CONTRACTOR_EMAIL,
        "assigned_contractor_name": "Apex Harvesting Co",
        "status": "OPERATION_READY",
        "total_quotation_amount": 104500.0,
        "total_quote": 104500.0,
        "advance_percentage": 27.0,
        "advance_amount": 28215.0,
        "advance_payment_request": {
            "accepted_quotation": 104500.0,
            "advance_percentage": 27.0,
            "advance_amount": 28215.0,
            "due_date": "2026-10-25",
            "payment_instructions": "Pay via Razorpay or UPI: contractor@okhdfcbank",
            "status": "ADVANCE_REQUESTED"
        },
        "advance_payment_status": "ADVANCE_REQUESTED",
        "is_advance_verified": False,
        "total_verified_paid": 0.0,
        "remaining_balance": 104500.0,
        "payments": [],
        "can_start_harvest": False,
        "createdAt": now_iso,
        "updatedAt": now_iso
    }

    if db is not None:
        db.harvest_requests.insert_one(req_doc)
        db.harvest_payments.delete_many({"harvest_request_id": req_id})

    yield req_id

    if db is not None:
        db.harvest_requests.delete_one({"_id": ObjectId(req_id)})
        db.harvest_payments.delete_many({"harvest_request_id": req_id})


# =========================================================================
# TEST 1: Correct calculation of ₹28,215 as 2,821,500 paise
# =========================================================================
def test_advance_amount_calculation_in_paise():
    req_doc = {
        "total_quotation_amount": 104500.0,
        "advance_payment_request": {
            "accepted_quotation": 104500.0,
            "advance_percentage": 27.0,
            "advance_amount": 28215.0
        }
    }
    accepted_quote, adv_pct, paise = calculate_advance_paise(req_doc)

    assert accepted_quote == 104500.0
    assert adv_pct == 27.0
    assert paise == 2821500  # 28,215 * 100 paise


# =========================================================================
# TEST 2: Create Payment Order Endpoint & Razorpay SDK Mock
# =========================================================================
def test_create_payment_order_success(sample_harvest_request, landowner_token):
    mock_order = {
        "id": "order_test_mock_12345",
        "amount": 2821500,
        "currency": "INR",
        "status": "created"
    }

    with patch.object(razorpay_service, "create_order", return_value=mock_order):
        res = client.post(
            f"/api/harvest-requests/{sample_harvest_request}/advance-payment/order",
            headers={"Authorization": f"Bearer {landowner_token}"},
            json={"notes": {"test": "true"}}
        )

        assert res.status_code == 201
        data = res.json()
        assert data["key_id"] == TEST_KEY_ID
        assert data["order_id"] == "order_test_mock_12345"
        assert data["amount"] == 2821500
        assert data["currency"] == "INR"
        assert data["amount_in_rupees"] == 28215.0
        assert data["advance_percentage"] == 27.0
        assert "payment_id" in data

        # Check MongoDB record
        if db is not None:
            p = db.harvest_payments.find_one({"payment_id": data["payment_id"]})
            assert p is not None
            assert p["amount_paise"] == 2821500
            assert p["status"] == "ORDER_CREATED"
            assert p["provider"] == "razorpay"


# =========================================================================
# TEST 3: Unauthorized user attempting to pay
# =========================================================================
def test_create_order_unauthorized_user(sample_harvest_request, unauthorized_token):
    res = client.post(
        f"/api/harvest-requests/{sample_harvest_request}/advance-payment/order",
        headers={"Authorization": f"Bearer {unauthorized_token}"},
        json={}
    )
    assert res.status_code == 403
    assert "Unauthorized" in res.json()["message"]


# =========================================================================
# TEST 4: Duplicate Order Request Idempotency
# =========================================================================
def test_create_order_idempotency(sample_harvest_request, landowner_token):
    mock_order = {
        "id": "order_test_mock_idem_999",
        "amount": 2821500,
        "currency": "INR",
        "status": "created"
    }

    with patch.object(razorpay_service, "create_order", return_value=mock_order):
        # 1st call
        res1 = client.post(
            f"/api/harvest-requests/{sample_harvest_request}/advance-payment/order",
            headers={"Authorization": f"Bearer {landowner_token}"},
            json={}
        )
        assert res1.status_code == 201
        p_id1 = res1.json()["payment_id"]

        # 2nd call (idempotent; reuses existing active order)
        res2 = client.post(
            f"/api/harvest-requests/{sample_harvest_request}/advance-payment/order",
            headers={"Authorization": f"Bearer {landowner_token}"},
            json={}
        )
        assert res2.status_code == 200
        assert res2.json()["payment_id"] == p_id1
        assert res2.json()["order_id"] == "order_test_mock_idem_999"


# =========================================================================
# TEST 5: Gateway API Error Handling
# =========================================================================
def test_create_order_gateway_error(sample_harvest_request, landowner_token):
    with patch.object(razorpay_service, "create_order", side_effect=RazorpayConfigError("Invalid Key ID or Secret")):
        res = client.post(
            f"/api/harvest-requests/{sample_harvest_request}/advance-payment/order",
            headers={"Authorization": f"Bearer {landowner_token}"},
            json={}
        )
        assert res.status_code == 503
        assert "Payment Gateway Configuration Error" in res.json()["message"]


# =========================================================================
# TEST 6: Verify Checkout Callback with Valid Cryptographic Signature
# =========================================================================
def test_verify_callback_valid_signature(sample_harvest_request, landowner_token):
    # Setup order in DB
    order_id = "order_test_verify_001"
    pay_id = f"PAY-RZP-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    if db is not None:
        db.harvest_payments.insert_one({
            "payment_id": pay_id,
            "harvest_request_id": str(sample_harvest_request),
            "payer_email": TEST_LANDOWNER_EMAIL,
            "razorpay_order_id": order_id,
            "amount_paise": 2821500,
            "amount": 28215.0,
            "currency": "INR",
            "provider": "razorpay",
            "status": "ORDER_CREATED",
            "created_at": now_iso
        })

    rzp_payment_id = "pay_test_payment_9988"
    valid_sig = hmac.new(
        TEST_KEY_SECRET.encode("utf-8"),
        f"{order_id}|{rzp_payment_id}".encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    mock_payment_info = {
        "id": rzp_payment_id,
        "order_id": order_id,
        "amount": 2821500,
        "currency": "INR",
        "status": "captured",
        "method": "upi"
    }

    with patch.object(razorpay_service, "fetch_payment", return_value=mock_payment_info):
        res = client.post(
            f"/api/payments/{pay_id}/verify-callback",
            headers={"Authorization": f"Bearer {landowner_token}"},
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": rzp_payment_id,
                "razorpay_signature": valid_sig
            }
        )

        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "VERIFIED"
        assert data["payment_id"] == pay_id

        # Verify Harvest Request Updated
        if db is not None:
            updated_hr = db.harvest_requests.find_one({"_id": ObjectId(sample_harvest_request)})
            assert updated_hr["is_advance_verified"] is True
            assert updated_hr["advance_payment_status"] == "VERIFIED"
            assert updated_hr["can_start_harvest"] is True
            assert updated_hr["total_verified_paid"] == 28215.0


# =========================================================================
# TEST 7: Invalid Checkout Signature Rejection
# =========================================================================
def test_verify_callback_invalid_signature(sample_harvest_request, landowner_token):
    order_id = "order_test_invalid_sig"
    pay_id = f"PAY-RZP-{uuid.uuid4().hex[:6]}"
    if db is not None:
        db.harvest_payments.insert_one({
            "payment_id": pay_id,
            "harvest_request_id": str(sample_harvest_request),
            "payer_email": TEST_LANDOWNER_EMAIL,
            "razorpay_order_id": order_id,
            "amount_paise": 2821500,
            "currency": "INR",
            "status": "ORDER_CREATED"
        })

    res = client.post(
        f"/api/payments/{pay_id}/verify-callback",
        headers={"Authorization": f"Bearer {landowner_token}"},
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_fake_123",
            "razorpay_signature": "tampered_invalid_signature_hash"
        }
    )
    assert res.status_code == 400
    assert "signature" in res.json()["message"].lower()


# =========================================================================
# TEST 8: Incorrect Order ID Mismatch Rejection
# =========================================================================
def test_verify_callback_order_id_mismatch(sample_harvest_request, landowner_token):
    pay_id = f"PAY-RZP-{uuid.uuid4().hex[:6]}"
    if db is not None:
        db.harvest_payments.insert_one({
            "payment_id": pay_id,
            "harvest_request_id": str(sample_harvest_request),
            "payer_email": TEST_LANDOWNER_EMAIL,
            "razorpay_order_id": "order_actual_123",
            "amount_paise": 2821500,
            "currency": "INR",
            "status": "ORDER_CREATED"
        })

    res = client.post(
        f"/api/payments/{pay_id}/verify-callback",
        headers={"Authorization": f"Bearer {landowner_token}"},
        json={
            "razorpay_order_id": "order_different_999",
            "razorpay_payment_id": "pay_123",
            "razorpay_signature": "some_sig"
        }
    )
    assert res.status_code == 400
    assert "order id does not match" in res.json()["message"].lower()


# =========================================================================
# TEST 9: Webhook Verification & Captured Event
# =========================================================================
def test_webhook_payment_captured(sample_harvest_request):
    order_id = "order_wh_test_555"
    pay_id = f"PAY-RZP-{uuid.uuid4().hex[:6]}"
    if db is not None:
        db.harvest_payments.insert_one({
            "payment_id": pay_id,
            "harvest_request_id": str(sample_harvest_request),
            "razorpay_order_id": order_id,
            "amount_paise": 2821500,
            "amount": 28215.0,
            "currency": "INR",
            "status": "ORDER_CREATED"
        })

    webhook_payload = {
        "event": "payment.captured",
        "event_id": f"evt_{uuid.uuid4().hex[:8]}",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_wh_888",
                    "order_id": order_id,
                    "amount": 2821500,
                    "currency": "INR",
                    "status": "captured",
                    "method": "card"
                }
            }
        }
    }
    raw_bytes = json.dumps(webhook_payload).encode("utf-8")
    valid_wh_sig = hmac.new(
        TEST_WEBHOOK_SECRET.encode("utf-8"),
        raw_bytes,
        hashlib.sha256
    ).hexdigest()

    res = client.post(
        "/api/payments/webhooks/razorpay",
        headers={"X-Razorpay-Signature": valid_wh_sig},
        content=raw_bytes
    )
    assert res.status_code == 200
    assert res.json()["status"] == "processed"

    # Verify payment status in DB is VERIFIED
    if db is not None:
        p = db.harvest_payments.find_one({"payment_id": pay_id})
        assert p["status"] == "VERIFIED"


# =========================================================================
# TEST 10: Webhook Deduplication (Idempotency)
# =========================================================================
def test_webhook_deduplication():
    evt_id = f"evt_dedup_{uuid.uuid4().hex[:8]}"
    webhook_payload = {
        "event": "payment.captured",
        "event_id": evt_id,
        "payload": {"payment": {"entity": {"id": "pay_0", "order_id": "order_none"}}}
    }
    raw_bytes = json.dumps(webhook_payload).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()

    # 1st call
    res1 = client.post(
        "/api/payments/webhooks/razorpay",
        headers={"X-Razorpay-Signature": sig},
        content=raw_bytes
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "processed"

    # 2nd call (duplicate)
    res2 = client.post(
        "/api/payments/webhooks/razorpay",
        headers={"X-Razorpay-Signature": sig},
        content=raw_bytes
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "already_processed"


# =========================================================================
# TEST 11: Invalid Webhook Signature Rejection
# =========================================================================
def test_webhook_invalid_signature():
    payload = {"event": "payment.captured"}
    raw_bytes = json.dumps(payload).encode("utf-8")

    res = client.post(
        "/api/payments/webhooks/razorpay",
        headers={"X-Razorpay-Signature": "invalid_tampered_sig"},
        content=raw_bytes
    )
    assert res.status_code == 400
    assert "signature" in res.json()["message"].lower()


# =========================================================================
# TEST 12: Never Downgrade an Already Verified Payment on Delayed Failure
# =========================================================================
def test_webhook_never_downgrades_verified_payment(sample_harvest_request):
    order_id = "order_downgrade_guard"
    pay_id = f"PAY-RZP-{uuid.uuid4().hex[:6]}"
    if db is not None:
        db.harvest_payments.insert_one({
            "payment_id": pay_id,
            "harvest_request_id": str(sample_harvest_request),
            "razorpay_order_id": order_id,
            "status": "VERIFIED"  # already captured and verified
        })

    failure_webhook = {
        "event": "payment.failed",
        "event_id": f"evt_fail_{uuid.uuid4().hex[:8]}",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_late_fail",
                    "order_id": order_id,
                    "error_description": "Late failure event"
                }
            }
        }
    }
    raw_bytes = json.dumps(failure_webhook).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()

    res = client.post(
        "/api/payments/webhooks/razorpay",
        headers={"X-Razorpay-Signature": sig},
        content=raw_bytes
    )
    assert res.status_code == 200

    # Ensure status remained VERIFIED in DB
    if db is not None:
        p = db.harvest_payments.find_one({"payment_id": pay_id})
        assert p["status"] == "VERIFIED"


# =========================================================================
# TEST 13: Refund Handling in Webhook
# =========================================================================
def test_webhook_refund_processed(sample_harvest_request):
    pay_id = f"PAY-RZP-{uuid.uuid4().hex[:6]}"
    rzp_pay_id = "pay_to_refund_123"
    if db is not None:
        db.harvest_payments.insert_one({
            "payment_id": pay_id,
            "harvest_request_id": str(sample_harvest_request),
            "razorpay_payment_id": rzp_pay_id,
            "status": "VERIFIED"
        })

    refund_webhook = {
        "event": "refund.processed",
        "event_id": f"evt_ref_{uuid.uuid4().hex[:8]}",
        "payload": {
            "refund": {
                "entity": {
                    "id": "rfnd_9988",
                    "payment_id": rzp_pay_id,
                    "amount": 2821500
                }
            }
        }
    }
    raw_bytes = json.dumps(refund_webhook).encode("utf-8")
    sig = hmac.new(TEST_WEBHOOK_SECRET.encode("utf-8"), raw_bytes, hashlib.sha256).hexdigest()

    res = client.post(
        "/api/payments/webhooks/razorpay",
        headers={"X-Razorpay-Signature": sig},
        content=raw_bytes
    )
    assert res.status_code == 200

    if db is not None:
        p = db.harvest_payments.find_one({"payment_id": pay_id})
        assert p["status"] == "REFUNDED"
        assert p["refund_status"] == "REFUNDED"


# =========================================================================
# TEST 14: Prevention of Unauthorized Harvest-State Transitions
# (Payment alone must NOT transition status to IN_PROGRESS)
# =========================================================================
def test_payment_does_not_force_in_progress(sample_harvest_request, landowner_token):
    hr = db.harvest_requests.find_one({"_id": ObjectId(sample_harvest_request)}) if db is not None else None
    assert hr["status"] == "OPERATION_READY"

    # Simulate payment verified
    order_id = "order_status_check"
    pay_id = f"PAY-RZP-{uuid.uuid4().hex[:6]}"
    if db is not None:
        db.harvest_payments.insert_one({
            "payment_id": pay_id,
            "harvest_request_id": str(sample_harvest_request),
            "payer_email": TEST_LANDOWNER_EMAIL,
            "razorpay_order_id": order_id,
            "amount_paise": 2821500,
            "status": "ORDER_CREATED"
        })

    rzp_payment_id = "pay_status_check"
    valid_sig = hmac.new(
        TEST_KEY_SECRET.encode("utf-8"),
        f"{order_id}|{rzp_payment_id}".encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    with patch.object(razorpay_service, "fetch_payment", return_value={"id": rzp_payment_id, "order_id": order_id, "amount": 2821500, "status": "captured"}):
        res = client.post(
            f"/api/payments/{pay_id}/verify-callback",
            headers={"Authorization": f"Bearer {landowner_token}"},
            json={
                "razorpay_order_id": order_id,
                "razorpay_payment_id": rzp_payment_id,
                "razorpay_signature": valid_sig
            }
        )
        assert res.status_code == 200

    if db is not None:
        hr_after = db.harvest_requests.find_one({"_id": ObjectId(sample_harvest_request)})
        # Must still be OPERATION_READY (not IN_PROGRESS), with can_start_harvest=True
        assert hr_after["status"] == "OPERATION_READY"
        assert hr_after["can_start_harvest"] is True
        assert hr_after["status"] != "IN_PROGRESS"


# =========================================================================
# TEST 15: Retrieve Payment Status (GET /api/payments/{payment_id})
# =========================================================================
def test_get_payment_status(sample_harvest_request, landowner_token, unauthorized_token):
    pay_id = f"PAY-RZP-{uuid.uuid4().hex[:6]}"
    if db is not None:
        db.harvest_payments.insert_one({
            "payment_id": pay_id,
            "harvest_request_id": str(sample_harvest_request),
            "payer_email": TEST_LANDOWNER_EMAIL,
            "contractor_email": TEST_CONTRACTOR_EMAIL,
            "amount": 28215.0,
            "amount_paise": 2821500,
            "currency": "INR",
            "status": "VERIFIED"
        })

    # Authorized landowner can view
    res = client.get(
        f"/api/payments/{pay_id}",
        headers={"Authorization": f"Bearer {landowner_token}"}
    )
    assert res.status_code == 200
    assert res.json()["payment_id"] == pay_id
    assert res.json()["status"] == "VERIFIED"
    assert "secret" not in res.json()  # Secrets never exposed

    # Unauthorized user cannot view
    res_unauth = client.get(
        f"/api/payments/{pay_id}",
        headers={"Authorization": f"Bearer {unauthorized_token}"}
    )
    assert res_unauth.status_code == 403
