#!/bin/bash

# Test script for Typebot -> Convex CRM Integration
# Replace the URL with your deployment URL if needed

DEPLOYMENT_URL="https://clean-lion-623.convex.cloud"

echo "Testing Lead Creation Mutation..."

curl -X POST "$DEPLOYMENT_URL/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "leads:createPublicLead",
    "args": {
      "name": "Teste Integracao Typebot",
      "phone": "+5511999998888",
      "email": "teste@typebot.com",
      "source": "landing_page",
      "sourceDetail": "typebot_test_script",
      "interestedProduct": "trintae3",
      "profession": "dentista",
      "hasClinic": true,
      "yearsInAesthetics": 10,
      "lgpdConsent": true,
      "whatsappConsent": true,
      "utmSource": "test",
      "utmCampaign": "integration_verification"
    },
    "format": "json"
  }'

echo -e "\n\nTest Finished."
