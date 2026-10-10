import hmac
import hashlib
import uuid
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import razorpay
from razorpay.errors import SignatureVerificationError, BadRequestError

from app.config import (
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET,
    RAZORPAY_MODE,
)


class RazorpayConfigError(Exception):
    """Raised when Razorpay credentials or configuration are invalid."""
    pass


class RazorpayService:
    def __init__(self):
        self.key_id = RAZORPAY_KEY_ID or "rzp_test_Fur0pLo5d2MztK"
        self.key_secret = RAZORPAY_KEY_SECRET or ""
        self.webhook_secret = RAZORPAY_WEBHOOK_SECRET or ""
        self.mode = RAZORPAY_MODE or "test"
        self._client: Optional[razorpay.Client] = None

    def get_client(self) -> razorpay.Client:
        """Returns initialized Razorpay Client instance."""
        if not self.key_id:
            raise RazorpayConfigError("RAZORPAY_KEY_ID is not configured.")
        if not self.key_secret:
            raise RazorpayConfigError(
                "RAZORPAY_KEY_SECRET is not configured. Please set RAZORPAY_KEY_SECRET in backend/.env."
            )
        if self.key_secret == "your_test_key_secret":
            raise RazorpayConfigError(
                "RAZORPAY_KEY_SECRET is currently set to the placeholder 'your_test_key_secret'. Please generate and paste your actual Razorpay Test Key Secret from your Razorpay Dashboard (Account & Settings -> API Keys) into backend/.env."
            )
        if self._client is None:
            self._client = razorpay.Client(auth=(self.key_id, self.key_secret))
        return self._client

    def create_order(
        self,
        amount_paise: int,
        currency: str = "INR",
        receipt: Optional[str] = None,
        notes: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Creates an official Razorpay order in paise.
        Never trust client-supplied amounts; amount_paise must be computed by the backend.
        """
        if amount_paise < 100:
            raise ValueError("Minimum payment amount is ₹1.00 (100 paise).")

        client = self.get_client()
        order_data = {
            "amount": int(amount_paise),
            "currency": currency.upper(),
            "receipt": receipt or f"rcpt_{uuid.uuid4().hex[:12]}",
            "notes": notes or {},
            "payment_capture": 1,  # Auto-capture upon successful authorization
        }

        try:
            return client.order.create(data=order_data)
        except BadRequestError as e:
            err_msg = str(e)
            if "Authentication failed" in err_msg or "401" in err_msg:
                raise RazorpayConfigError(
                    "Razorpay Authentication Failed: The Key ID and Secret do not match a valid Razorpay account. Please check your credentials in backend/.env."
                )
            raise RazorpayConfigError(f"Razorpay API Error: {err_msg}")
        except Exception as e:
            raise RuntimeError(f"Failed to create Razorpay order: {str(e)}")

    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
    ) -> bool:
        """
        Verifies checkout callback signature using HMAC-SHA256:
        signature = hmac_sha256(order_id + "|" + payment_id, secret)
        """
        if not self.key_secret:
            raise RazorpayConfigError("RAZORPAY_KEY_SECRET is missing for signature verification.")

        msg = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_sig = hmac.new(
            self.key_secret.encode("utf-8"),
            msg.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected_sig, razorpay_signature)

    def verify_webhook_signature(
        self,
        raw_body: bytes,
        signature: str,
    ) -> bool:
        """
        Verifies Razorpay Webhook signature using HMAC-SHA256:
        signature = hmac_sha256(raw_body, webhook_secret)
        """
        if not self.webhook_secret:
            raise RazorpayConfigError("RAZORPAY_WEBHOOK_SECRET is not configured.")

        expected_sig = hmac.new(
            self.webhook_secret.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected_sig, signature)

    def fetch_payment(self, razorpay_payment_id: str) -> Dict[str, Any]:
        """Fetches payment details directly from Razorpay API."""
        client = self.get_client()
        try:
            return client.payment.fetch(razorpay_payment_id)
        except Exception as e:
            raise RuntimeError(f"Failed to fetch payment details from Razorpay: {str(e)}")


razorpay_service = RazorpayService()


def calculate_advance_paise(
    req_doc: Dict[str, Any],
    ass_doc: Optional[Dict[str, Any]] = None,
) -> Tuple[float, float, int]:
    """
    Computes (accepted_quotation_rupees, advance_percentage, amount_paise)
    directly from MongoDB documents.
    Always uses integer paise for Razorpay: ₹28,215 = 2,821,500 paise.
    """
    adv_req = req_doc.get("advance_payment_request") or {}
    if not adv_req and ass_doc:
        adv_req = ass_doc.get("advance_payment_request") or {}

    # 1. Accepted Quotation
    accepted_quotation = float(
        adv_req.get("accepted_quotation")
        or req_doc.get("total_quotation_amount")
        or req_doc.get("total_quote")
        or (ass_doc.get("total_quote") if ass_doc else 0.0)
        or 0.0
    )

    # 2. Advance amount and percentage
    if adv_req.get("advance_amount") is not None and float(adv_req.get("advance_amount")) > 0:
        adv_amount = round(float(adv_req["advance_amount"]), 2)
        if accepted_quotation > 0:
            adv_percentage = round((adv_amount / accepted_quotation) * 100.0, 2)
        else:
            adv_percentage = float(adv_req.get("advance_percentage", 27.0))
    elif adv_req.get("advance_percentage") is not None and float(adv_req.get("advance_percentage")) > 0:
        adv_percentage = float(adv_req["advance_percentage"])
        adv_amount = round(accepted_quotation * (adv_percentage / 100.0), 2)
    elif req_doc.get("advance_percentage") is not None and float(req_doc.get("advance_percentage")) > 0:
        adv_percentage = float(req_doc["advance_percentage"])
        adv_amount = round(accepted_quotation * (adv_percentage / 100.0), 2)
    else:
        # Default fallback advance percentage if none explicitly set
        adv_percentage = 27.0
        adv_amount = round(accepted_quotation * (adv_percentage / 100.0), 2)

    amount_paise = int(round(adv_amount * 100))
    return accepted_quotation, adv_percentage, amount_paise
