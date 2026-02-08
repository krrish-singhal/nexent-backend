#!/bin/bash

# Get the current local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "🔍 Detected Local IP: $LOCAL_IP"
echo ""

# Update mobile .env file
MOBILE_ENV_FILE="./mobile/nexent/.env"
if [ -f "$MOBILE_ENV_FILE" ]; then
    # Check if EXPO_PUBLIC_API_URL exists
    if grep -q "EXPO_PUBLIC_API_URL" "$MOBILE_ENV_FILE"; then
        # Update existing entry
        sed -i "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://$LOCAL_IP:3000/api|g" "$MOBILE_ENV_FILE"
        echo "✅ Updated mobile .env with IP: $LOCAL_IP"
    else
        # Add new entry
        echo "EXPO_PUBLIC_API_URL=http://$LOCAL_IP:3000/api" >> "$MOBILE_ENV_FILE"
        echo "✅ Added EXPO_PUBLIC_API_URL to mobile .env"
    fi
else
    echo "❌ Mobile .env file not found at $MOBILE_ENV_FILE"
fi

echo ""
echo "📱 Mobile app will use: http://$LOCAL_IP:3000/api"
echo "💻 Admin dashboard will use: http://localhost:3000"
echo ""
echo "✨ Configuration updated! Restart your services to apply changes."
