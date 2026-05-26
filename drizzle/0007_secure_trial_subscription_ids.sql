UPDATE "subscriptions"
SET
  "provider_customer_id" = 'trial:' || "clinic_id"::text,
  "provider_subscription_id" = 'trial:' || "clinic_id"::text,
  "updated_at" = now()
WHERE
  "status" = 'trialing'
  AND "provider_subscription_id" = '';
