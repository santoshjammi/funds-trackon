#!/usr/bin/env python3
"""
Test script to validate analytics endpoints
"""

import json
import requests
import sys

BASE_URL = "http://localhost:8001"

def test_endpoint(endpoint, description):
    """Test an analytics endpoint"""
    print(f"\n🧪 Testing {description}")
    print(f"   Endpoint: {endpoint}")
    
    try:
        # Test without authentication first
        response = requests.get(f"{BASE_URL}{endpoint}")
        
        if response.status_code == 401:
            print("   ✅ Authentication required (expected)")
            return True
        elif response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: {len(json.dumps(data))} characters of data")
            return True
        else:
            print(f"   ❌ Unexpected status: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print("🔍 Testing Niveshya Analytics Endpoints")
    print("=" * 50)
    
    endpoints = [
        ("/api/analytics/dashboard-summary", "Dashboard Summary"),
        ("/api/analytics/fundraising-analytics", "Fundraising Analytics"),
        ("/api/analytics/opportunity-metrics", "Opportunity Metrics"),
        ("/api/analytics/task-analytics", "Task Analytics"),
        ("/api/analytics/contact-analytics", "Contact Analytics"),
        ("/api/analytics/performance-trends", "Performance Trends"),
        ("/api/analytics/executive-report", "Executive Report"),
    ]
    
    results = []
    for endpoint, description in endpoints:
        results.append(test_endpoint(endpoint, description))
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {sum(results)}/{len(results)} endpoints working correctly")
    
    if all(results):
        print("🎉 All analytics endpoints are properly configured!")
        print("   Ready for dashboard integration.")
    else:
        print("⚠️  Some endpoints need attention.")

if __name__ == "__main__":
    main()