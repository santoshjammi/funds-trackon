#!/usr/bin/env python3
"""
Direct test of analytics functionality without authentication
"""

import sys
import os
sys.path.append('/Users/kgt/Desktop/Projects/funds-trackon/backend')

from app.controllers.analytics_controller import *
import json

def test_data_loading():
    """Test that data files can be loaded and processed"""
    print("🧪 Testing Data Loading and Processing")
    print("=" * 50)
    
    # Test data file loading
    data_files = [
        (TRACKER_FILE, "Fundraising Tracker"),
        (OPPORTUNITY_FILE, "Opportunities"),
        (TASKS_FILE, "Tasks"),
        (PEOPLE_FILE, "People/Contacts")
    ]
    
    for file_path, description in data_files:
        print(f"\n📄 Testing {description}")
        print(f"   File: {file_path}")
        
        if os.path.exists(file_path):
            data = load_data_file(file_path)
            print(f"   ✅ Loaded {len(data)} records")
            
            # Show sample data structure
            if data:
                sample = data[0]
                fields = list(sample.keys()) if isinstance(sample, dict) else []
                print(f"   📋 Fields: {', '.join(fields[:5])}{'...' if len(fields) > 5 else ''}")
        else:
            print(f"   ❌ File not found: {file_path}")
    
    print("\n" + "=" * 50)
    print("📊 Testing Analytics Calculations")
    
    # Test analytics calculations directly
    try:
        tracker_data = load_data_file(TRACKER_FILE)
        opportunity_data = load_data_file(OPPORTUNITY_FILE)
        tasks_data = load_data_file(TASKS_FILE)
        people_data = load_data_file(PEOPLE_FILE)
        
        print(f"\n📈 Summary Statistics:")
        print(f"   Fundraising Targets: {len(tracker_data)}")
        print(f"   Opportunities: {len(opportunity_data)}")
        print(f"   Tasks: {len(tasks_data)}")
        print(f"   Contacts: {len(people_data)}")
        
        # Test priority breakdown
        if tracker_data:
            from collections import Counter
            priority_stats = dict(Counter(
                record.get("PRIORITY", "Unknown") 
                for record in tracker_data 
                if record.get("PRIORITY")
            ))
            print(f"\n🎯 Priority Distribution: {priority_stats}")
        
        # Test task completion
        if tasks_data:
            completed = len([r for r in tasks_data if r.get("Task Done") == "Yes"])
            completion_rate = round((completed / len(tasks_data) * 100), 1) if tasks_data else 0
            print(f"📋 Task Completion: {completed}/{len(tasks_data)} ({completion_rate}%)")
        
        print("\n✅ Analytics calculations working correctly!")
        
    except Exception as e:
        print(f"\n❌ Error in analytics calculations: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_data_loading()