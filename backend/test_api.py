import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_tests():
    print("[INFO] Starting FastAPI backend integration tests...")
    
    # 1. Test Health Check
    try:
        res = httpx.get("http://127.0.0.1:8000/")
        assert res.status_code == 200, "Health check failed"
        print("[SUCCESS] Health check passed:", res.json())
    except Exception as e:
        print(f"[ERROR] Failed to connect to server: {e}")
        sys.exit(1)

    # 2. Test Catalog Endpoints (Public)
    res = httpx.get(f"{BASE_URL}/categories")
    assert res.status_code == 200
    categories = res.json()
    assert len(categories) > 0, "No categories returned"
    print(f"[SUCCESS] Categories discovery passed ({len(categories)} categories found)")

    res = httpx.get(f"{BASE_URL}/products")
    assert res.status_code == 200
    products = res.json()
    assert len(products) > 0, "No products returned"
    print(f"[SUCCESS] Products discovery passed ({len(products)} products found)")

    # Test product detail by slug
    product_slug = products[0]["slug"]
    res = httpx.get(f"{BASE_URL}/products/{product_slug}")
    assert res.status_code == 200
    assert res.json()["slug"] == product_slug
    print(f"[SUCCESS] Product detail fetch passed for '{product_slug}'")

    # 3. Test Security Middleware (Unauthorized Request)
    res = httpx.get(f"{BASE_URL}/users/me")
    assert res.status_code == 401, "Protected route allowed unauthorized request"
    print("[SUCCESS] JWT Middleware correctly blocked unauthorized access (HTTP 401)")

    # 4. Authenticated Endpoints using Mock Token
    headers = {"Authorization": "Bearer dev-mock-token"}

    # Fetch User Profile
    res = httpx.get(f"{BASE_URL}/users/me", headers=headers)
    assert res.status_code == 200
    profile = res.json()
    assert "id" in profile
    print(f"[SUCCESS] Verified protected user profile retrieval: {profile['full_name']}")

    # Update Profile
    update_payload = {"full_name": "Antigravity Test User", "phone_number": "123-456-7890"}
    res = httpx.put(f"{BASE_URL}/users/me", headers=headers, json=update_payload)
    if res.status_code != 200:
        print(f"[FAIL] Profile update failed with status {res.status_code}: {res.text}")
    assert res.status_code == 200
    updated_profile = res.json()
    assert updated_profile["full_name"] == "Antigravity Test User"
    print("[SUCCESS] Verified profile update via JWT authenticated endpoint")

    # 5. Shopping Cart Operations
    # Clear cart first
    res = httpx.delete(f"{BASE_URL}/cart/clear", headers=headers)
    if res.status_code != 200:
        print(f"[FAIL] Cart clear failed with status {res.status_code}: {res.text}")
    assert res.status_code == 200
    cart = res.json()
    assert cart["total_items"] == 0
    print("[SUCCESS] Cart cleared successfully")

    # Add item to cart
    product_id = products[0]["id"]
    add_payload = {"product_id": product_id, "quantity": 2}
    res = httpx.post(f"{BASE_URL}/cart", headers=headers, json=add_payload)
    assert res.status_code == 200
    cart = res.json()
    assert cart["total_items"] == 2
    assert cart["items"][0]["product_id"] == product_id
    print(f"[SUCCESS] Added {add_payload['quantity']} of product ID {product_id} to cart")

    # 6. Checkout & Order Processing
    order_payload = {
        "shipping_address": {
            "fullName": "Jane Doe",
            "addressLine1": "123 NexMart Way",
            "city": "San Francisco",
            "postalCode": "94105",
            "country": "USA"
        },
        "billing_address": {
            "fullName": "Jane Doe",
            "addressLine1": "123 NexMart Way",
            "city": "San Francisco",
            "postalCode": "94105",
            "country": "USA"
        }
    }
    res = httpx.post(f"{BASE_URL}/orders", headers=headers, json=order_payload)
    assert res.status_code == 200
    order = res.json()
    assert order["status"] == "pending"
    assert order["payment_status"] == "unpaid"
    assert len(order["items"]) == 1
    print(f"[SUCCESS] Order successfully created with ID: {order['id']}")

    # Get Payment Intent
    res = httpx.post(f"{BASE_URL}/orders/{order['id']}/payment-intent", headers=headers)
    assert res.status_code == 200
    intent = res.json()
    assert "clientSecret" in intent
    print(f"[SUCCESS] Stripe Payment Intent retrieved successfully: {intent['clientSecret']}")

    # 7. Webhook Finalization (Stripe Success Hook Simulation)
    webhook_payload = {
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": intent["clientSecret"].split("_secret_")[0],
                "metadata": {
                    "order_id": order["id"]
                }
            }
        }
    }
    res = httpx.post(f"{BASE_URL}/orders/webhook", json=webhook_payload)
    assert res.status_code == 200
    print("[SUCCESS] Webhook payload accepted successfully")

    # Verify order is now paid & processing
    res = httpx.get(f"{BASE_URL}/orders/{order['id']}", headers=headers)
    assert res.status_code == 200
    final_order = res.json()
    assert final_order["status"] == "processing", f"Expected order status 'processing', got '{final_order['status']}'"
    assert final_order["payment_status"] == "paid", f"Expected payment status 'paid', got '{final_order['payment_status']}'"
    print("[SUCCESS] Verified order is now marked as 'paid' and 'processing' via Stripe Webhook")

    print("\n[COMPLETE] ALL TESTS PASSED SUCCESSFULLY! API is robust and fully functional.")

if __name__ == "__main__":
    run_tests()
