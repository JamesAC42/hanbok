Now you can test the entire payment flow! Here's what to test:

1. First, test the basic checkout flow:
```bash
# Keep the webhook listener running in a terminal
stripe listen --forward-to localhost:5666/webhook
```

2. Then test these scenarios:

```bash
# Test one-time purchase (basic upgrade)
stripe trigger checkout.session.completed --add checkout_session:metadata.priceId=price_basic_upgrade

# Test audio pack purchase
stripe trigger checkout.session.completed --add checkout_session:metadata.priceId=price_audio_pack

# Test subscription
stripe trigger checkout.session.completed --add checkout_session:metadata.priceId=price_monthly_sub

# Test subscription cancellation
stripe trigger customer.subscription.deleted

# Test failed payment
stripe trigger payment_intent.payment_failed
```

3. For each test, verify:
- The webhook receives the event (check terminal output)
- User document is updated correctly in MongoDB
- Transaction is logged in the transactions collection
- User limits/tier are updated appropriately

4. You can also test the full flow manually:
- Go to your pricing page
- Click purchase on any plan
- Complete the checkout with test card numbers:
  - Success: 4242 4242 4242 4242
  - Failure: 4000 0000 0000 0002
- Verify you're redirected to success page
- Check your profile to see updated limits/tier

Test card details:
```bash
Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

# Test basic upgrade ($4 plan)
stripe trigger checkout.session.completed `
  --add checkout_session:client_reference_id=8 `
  --add checkout_session:line_items:0:price:id=price_1QtCSlDv6kE7GataHOJpDPKT `
  --add checkout_session:amount_total=1 `
  --add checkout_session:currency=usd

# Test audio pack ($6 plan)
stripe trigger checkout.session.completed `
  --add checkout_session:client_reference_id=8 `
  --add checkout_session:line_items:0:price:id=price_1QtCTcDv6kE7GataN7ebeLCF `
  --add checkout_session:amount_total=1 `
  --add checkout_session:currency=usd

# Test monthly subscription ($10/month)
stripe trigger checkout.session.completed `
  --add checkout_session:client_reference_id=8 `
  --add checkout_session:line_items:0:price:id=price_1QtBf2Dv6kE7Gatasq6pq1Tc `
  --add checkout_session:amount_total=1 `
  --add checkout_session:currency=usd `
  --add checkout_session:subscription=sub_123 `
  --add checkout_session:customer=cus_123

# 1. Basic Upgrade ($4)
stripe trigger checkout.session.completed --add checkout_session:client_reference_id=123 --add checkout_session:metadata.priceId=price_1QtCSlDv6kE7GataHOJpDPKT

# 2. Audio Pack ($6)
stripe trigger checkout.session.completed --add checkout_session:client_reference_id=123 --add checkout_session:metadata.priceId=price_1QtCTcDv6kE7GataN7ebeLCF

# 3. Monthly Subscription ($10)
stripe trigger checkout.session.completed --add checkout_session:client_reference_id=123 --add checkout_session:metadata.priceId=price_1QtBf2Dv6kE7Gatasq6pq1Tc --add checkout_session:subscription=sub_test123 --add checkout_session:customer=cus_test123