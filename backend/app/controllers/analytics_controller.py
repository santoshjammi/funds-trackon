"""
Analytics Controller - Comprehensive dashboard and reporting endpoints for Niveshya
Provides key metrics, charts data, and insights from fundraising activities, 
opportunities, tasks, and contact management.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.utils.rbac import get_current_user, require_permissions
from app.models.user import User
import json
import os
from collections import defaultdict, Counter
import statistics

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Data file paths - relative to project root
DATA_DIR = "../data"
TRACKER_FILE = os.path.join(DATA_DIR, "tracker.json")
OPPORTUNITY_FILE = os.path.join(DATA_DIR, "opportunity.json")
TASKS_FILE = os.path.join(DATA_DIR, "tasks.json")
PEOPLE_FILE = os.path.join(DATA_DIR, "people.json")

def load_data_file(file_path: str) -> List[Dict]:
    """Load JSON data file safely"""
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Filter out empty/null records
                return [record for record in data if record and any(record.values())]
        return []
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return []

@router.get("/dashboard-summary")
# @require_permissions(["read_analytics", "read_tracker"])  # Temporarily disabled for testing
async def get_dashboard_summary(current_user: User = Depends(get_current_user)):
    """Get high-level KPIs and summary metrics for the main dashboard"""
    try:
        # Load all data
        tracker_data = load_data_file(TRACKER_FILE)
        opportunity_data = load_data_file(OPPORTUNITY_FILE)
        tasks_data = load_data_file(TASKS_FILE)
        people_data = load_data_file(PEOPLE_FILE)
        
        # Calculate KPIs
        summary = {
            "fundraising_targets": {
                "total_targets": len(tracker_data),
                "priority_breakdown": dict(Counter(
                    record.get("PRIORITY", "Unknown") 
                    for record in tracker_data 
                    if record.get("PRIORITY")
                )),
                "category_breakdown": dict(Counter(
                    record.get("CATEGORY", "Unknown") 
                    for record in tracker_data 
                    if record.get("CATEGORY")
                )),
                "active_targets": len([r for r in tracker_data if r.get("PRIORITY") not in ["Closed", "D"]]),
                "high_priority_targets": len([r for r in tracker_data if r.get("PRIORITY") == "A"])
            },
            "opportunities": {
                "total_opportunities": len(opportunity_data),
                "in_process": len([r for r in opportunity_data if "In Process" in str(r.get("Status", ""))]),
                "completed": len([r for r in opportunity_data if "Completed" in str(r.get("Status", ""))]),
                "priority_a_opportunities": len([r for r in opportunity_data if r.get("Priority") == "A"])
            },
            "tasks": {
                "total_tasks": len(tasks_data),
                "completed_tasks": len([r for r in tasks_data if r.get("Task Done") == "Yes"]),
                "pending_tasks": len([r for r in tasks_data if r.get("Task Done") != "Yes"]),
                "completion_rate": round(
                    (len([r for r in tasks_data if r.get("Task Done") == "Yes"]) / len(tasks_data) * 100) 
                    if tasks_data else 0, 1
                ),
                "meeting_tasks": len([r for r in tasks_data if "Meeting" in str(r.get("Type", ""))])
            },
            "contacts": {
                "total_contacts": len(people_data),
                "connected_contacts": len([r for r in people_data if r.get("Met / Connected")]),
                "organizations": len(set(
                    r.get("Organisation") for r in people_data 
                    if r.get("Organisation") and r.get("Organisation").strip()
                ))
            }
        }
        
        return {"success": True, "data": summary}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating dashboard summary: {str(e)}")

@router.get("/fundraising-analytics")
# @require_permissions  # Temporarily disabled(["read_analytics", "read_tracker"])
async def get_fundraising_analytics(current_user: User = Depends(get_current_user)):
    """Get detailed fundraising analytics and pipeline metrics"""
    try:
        tracker_data = load_data_file(TRACKER_FILE)
        
        # Priority distribution
        priority_stats = dict(Counter(
            record.get("PRIORITY", "Unknown") 
            for record in tracker_data 
            if record.get("PRIORITY")
        ))
        
        # Category analysis
        category_stats = dict(Counter(
            record.get("CATEGORY", "Unknown") 
            for record in tracker_data 
            if record.get("CATEGORY")
        ))
        
        # Status analysis from notes
        status_keywords = {
            "interested": ["keen", "interested", "consider", "hiring"],
            "not_interested": ["not hiring", "not currently", "no", "closed"],
            "in_process": ["process", "interview", "rounds", "initiated"],
            "contacted": ["spoke", "met", "called", "enquired"]
        }
        
        status_analysis = defaultdict(int)
        for record in tracker_data:
            notes = str(record.get("NOTES /STATUS", "")).lower()
            categorized = False
            for status, keywords in status_keywords.items():
                if any(keyword in notes for keyword in keywords):
                    status_analysis[status] += 1
                    categorized = True
                    break
            if not categorized and notes.strip():
                status_analysis["other"] += 1
        
        # Referral effectiveness
        referral_stats = dict(Counter(
            record.get("REFERRAL", "Direct") or "Direct"
            for record in tracker_data 
            if record.get("TARGET")
        ))
        
        # Contact completeness
        contact_completeness = {
            "with_contact_person": len([r for r in tracker_data if r.get("CONTACT PERSON")]),
            "with_phone": len([r for r in tracker_data if r.get("CONTACT NO")]),
            "with_email": len([r for r in tracker_data if r.get("E MAIL ID")]),
            "complete_contact_info": len([
                r for r in tracker_data 
                if r.get("CONTACT PERSON") and (r.get("CONTACT NO") or r.get("E MAIL ID"))
            ])
        }
        
        analytics = {
            "priority_distribution": priority_stats,
            "category_breakdown": category_stats,
            "status_analysis": dict(status_analysis),
            "referral_effectiveness": referral_stats,
            "contact_data_quality": contact_completeness,
            "pipeline_health": {
                "total_targets": len(tracker_data),
                "active_pipeline": len([r for r in tracker_data if r.get("PRIORITY") not in ["Closed", "D"]]),
                "high_priority_active": len([r for r in tracker_data if r.get("PRIORITY") == "A"]),
                "conversion_indicators": dict(status_analysis)
            }
        }
        
        return {"success": True, "data": analytics}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating fundraising analytics: {str(e)}")

@router.get("/opportunity-metrics")
# @require_permissions  # Temporarily disabled(["read_analytics", "read_opportunities"])
async def get_opportunity_metrics(current_user: User = Depends(get_current_user)):
    """Get opportunity pipeline and performance metrics"""
    try:
        opportunity_data = load_data_file(OPPORTUNITY_FILE)
        
        # Status distribution
        status_stats = dict(Counter(
            record.get("Status", "Unknown") 
            for record in opportunity_data 
            if record.get("Status")
        ))
        
        # Priority breakdown
        priority_stats = dict(Counter(
            record.get("Priority", "Unknown") 
            for record in opportunity_data 
            if record.get("Priority")
        ))
        
        # Category analysis
        category_stats = dict(Counter(
            record.get("Category", "Unknown") 
            for record in opportunity_data 
            if record.get("Category")
        ))
        
        # Opportunity pipeline stages
        pipeline_stages = {
            "new": len([r for r in opportunity_data if "1 -" in str(r.get("Status", ""))]),
            "contacted": len([r for r in opportunity_data if "2 -" in str(r.get("Status", ""))]),
            "in_process": len([r for r in opportunity_data if "3 -" in str(r.get("Status", ""))]),
            "advanced": len([r for r in opportunity_data if "4 -" in str(r.get("Status", ""))]),
            "completed": len([r for r in opportunity_data if "5 -" in str(r.get("Status", ""))])
        }
        
        # Referral effectiveness for opportunities
        referral_stats = dict(Counter(
            record.get("Referral Person", "Direct") or "Direct"
            for record in opportunity_data 
            if record.get("TARGET")
        ))
        
        metrics = {
            "status_distribution": status_stats,
            "priority_breakdown": priority_stats,
            "category_analysis": category_stats,
            "pipeline_stages": pipeline_stages,
            "referral_effectiveness": referral_stats,
            "opportunity_health": {
                "total_opportunities": len(opportunity_data),
                "active_opportunities": len([r for r in opportunity_data if "Completed" not in str(r.get("Status", ""))]),
                "high_priority": len([r for r in opportunity_data if r.get("Priority") == "A"]),
                "conversion_rate": round(
                    (pipeline_stages["completed"] / len(opportunity_data) * 100) if opportunity_data else 0, 1
                )
            }
        }
        
        return {"success": True, "data": metrics}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating opportunity metrics: {str(e)}")

@router.get("/task-analytics")
# @require_permissions  # Temporarily disabled(["read_analytics", "read_tasks"])
async def get_task_analytics(current_user: User = Depends(get_current_user)):
    """Get task completion and performance analytics"""
    try:
        tasks_data = load_data_file(TASKS_FILE)
        
        # Task type distribution
        type_stats = dict(Counter(
            record.get("Type", "Unknown") 
            for record in tasks_data 
            if record.get("Type")
        ))
        
        # Completion analysis
        completion_stats = {
            "completed": len([r for r in tasks_data if r.get("Task Done") == "Yes"]),
            "pending": len([r for r in tasks_data if r.get("Task Done") != "Yes"]),
            "total": len(tasks_data)
        }
        completion_stats["completion_rate"] = round(
            (completion_stats["completed"] / completion_stats["total"] * 100) if completion_stats["total"] else 0, 1
        )
        
        # Task delegation analysis
        delegated_stats = dict(Counter(
            record.get("Delegated Person", "Self") or "Self"
            for record in tasks_data 
            if record.get("Task Name / Person Name")
        ))
        
        # Opportunity linkage
        linked_opportunities = len([r for r in tasks_data if r.get("Opportunity")])
        
        # Date analysis (convert timestamps to readable dates)
        current_time = datetime.now().timestamp() * 1000
        overdue_tasks = []
        upcoming_tasks = []
        
        for task in tasks_data:
            target_date = task.get("Target Date")
            if target_date and isinstance(target_date, (int, float)):
                if target_date < current_time and task.get("Task Done") != "Yes":
                    overdue_tasks.append(task)
                elif target_date > current_time:
                    upcoming_tasks.append(task)
        
        analytics = {
            "task_types": type_stats,
            "completion_metrics": completion_stats,
            "delegation_analysis": delegated_stats,
            "opportunity_linkage": {
                "linked_tasks": linked_opportunities,
                "unlinked_tasks": len(tasks_data) - linked_opportunities,
                "linkage_rate": round((linked_opportunities / len(tasks_data) * 100) if tasks_data else 0, 1)
            },
            "timing_analysis": {
                "overdue_tasks": len(overdue_tasks),
                "upcoming_tasks": len(upcoming_tasks),
                "completed_tasks": completion_stats["completed"]
            }
        }
        
        return {"success": True, "data": analytics}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating task analytics: {str(e)}")

@router.get("/contact-analytics")
# @require_permissions  # Temporarily disabled(["read_analytics", "read_contacts"])
async def get_contact_analytics(current_user: User = Depends(get_current_user)):
    """Get contact network and relationship analytics"""
    try:
        people_data = load_data_file(PEOPLE_FILE)
        
        # Organization distribution
        org_stats = dict(Counter(
            record.get("Organisation", "Unknown") 
            for record in people_data 
            if record.get("Organisation") and record.get("Organisation").strip()
        ))
        
        # Top 10 organizations by contact count
        top_orgs = dict(sorted(org_stats.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # Connection status
        connection_stats = {
            "connected": len([r for r in people_data if r.get("Met / Connected")]),
            "not_connected": len([r for r in people_data if not r.get("Met / Connected")]),
            "linkedin_connected": len([r for r in people_data if r.get("Linkedin Connect")])
        }
        
        # Contact data completeness
        data_quality = {
            "with_phone": len([r for r in people_data if r.get("Phone")]),
            "with_email": len([r for r in people_data if r.get("Email")]),
            "with_designation": len([r for r in people_data if r.get("Designation")]),
            "with_organisation": len([r for r in people_data if r.get("Organisation")]),
            "complete_profiles": len([
                r for r in people_data 
                if r.get("Phone") or r.get("Email") and r.get("Designation") and r.get("Organisation")
            ])
        }
        
        # Network value analysis
        total_contacts = len(people_data)
        network_value = {
            "total_contacts": total_contacts,
            "unique_organizations": len(set(
                r.get("Organisation") for r in people_data 
                if r.get("Organisation") and r.get("Organisation").strip()
            )),
            "connection_rate": round(
                (connection_stats["connected"] / total_contacts * 100) if total_contacts else 0, 1
            ),
            "data_completeness": round(
                (data_quality["complete_profiles"] / total_contacts * 100) if total_contacts else 0, 1
            )
        }
        
        analytics = {
            "organization_distribution": top_orgs,
            "connection_metrics": connection_stats,
            "data_quality_metrics": data_quality,
            "network_value": network_value,
            "contact_insights": {
                "most_connected_orgs": top_orgs,
                "network_diversity": len(org_stats),
                "average_contacts_per_org": round(
                    statistics.mean(org_stats.values()) if org_stats else 0, 1
                )
            }
        }
        
        return {"success": True, "data": analytics}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating contact analytics: {str(e)}")

@router.get("/performance-trends")
# @require_permissions  # Temporarily disabled(["read_analytics"])
async def get_performance_trends(
    timeframe: str = Query("30d", description="Timeframe: 7d, 30d, 90d, 1y"),
    current_user: User = Depends(get_current_user)
):
    """Get performance trends and time-series analytics"""
    try:
        # For now, we'll provide aggregated trend data
        # In a real implementation, you'd analyze timestamps and create time series
        
        tracker_data = load_data_file(TRACKER_FILE)
        opportunity_data = load_data_file(OPPORTUNITY_FILE)
        tasks_data = load_data_file(TASKS_FILE)
        
        # Calculate overall performance indicators
        trends = {
            "fundraising_momentum": {
                "active_targets": len([r for r in tracker_data if r.get("PRIORITY") in ["A", "B"]]),
                "engagement_rate": len([r for r in tracker_data if r.get("NOTES /STATUS")]) / len(tracker_data) * 100 if tracker_data else 0,
                "referral_rate": len([r for r in tracker_data if r.get("REFERRAL")]) / len(tracker_data) * 100 if tracker_data else 0
            },
            "opportunity_velocity": {
                "pipeline_flow": {
                    "new": len([r for r in opportunity_data if "1 -" in str(r.get("Status", ""))]),
                    "in_progress": len([r for r in opportunity_data if "3 -" in str(r.get("Status", ""))]),
                    "completed": len([r for r in opportunity_data if "5 -" in str(r.get("Status", ""))])
                }
            },
            "task_efficiency": {
                "completion_trend": len([r for r in tasks_data if r.get("Task Done") == "Yes"]) / len(tasks_data) * 100 if tasks_data else 0,
                "meeting_effectiveness": len([r for r in tasks_data if "Meeting" in str(r.get("Type", "")) and r.get("Task Done") == "Yes"])
            }
        }
        
        return {"success": True, "data": trends, "timeframe": timeframe}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating performance trends: {str(e)}")

@router.get("/executive-report")
# @require_permissions  # Temporarily disabled(["read_analytics", "admin_access"])
async def get_executive_report(current_user: User = Depends(get_current_user)):
    """Get comprehensive executive-level report with key insights"""
    try:
        # Load all data
        tracker_data = load_data_file(TRACKER_FILE)
        opportunity_data = load_data_file(OPPORTUNITY_FILE)
        tasks_data = load_data_file(TASKS_FILE)
        people_data = load_data_file(PEOPLE_FILE)
        
        # Executive summary metrics
        executive_summary = {
            "fundraising_pipeline": {
                "total_targets": len(tracker_data),
                "high_priority": len([r for r in tracker_data if r.get("PRIORITY") == "A"]),
                "active_conversations": len([r for r in tracker_data if r.get("NOTES /STATUS") and "process" in str(r.get("NOTES /STATUS")).lower()]),
                "success_indicators": len([r for r in tracker_data if any(word in str(r.get("NOTES /STATUS", "")).lower() for word in ["keen", "interested", "hiring", "consider"])])
            },
            "business_development": {
                "total_opportunities": len(opportunity_data),
                "active_pipeline": len([r for r in opportunity_data if "In Process" in str(r.get("Status", ""))]),
                "conversion_rate": round(
                    len([r for r in opportunity_data if "Completed" in str(r.get("Status", ""))]) / len(opportunity_data) * 100 
                    if opportunity_data else 0, 1
                )
            },
            "operational_efficiency": {
                "task_completion_rate": round(
                    len([r for r in tasks_data if r.get("Task Done") == "Yes"]) / len(tasks_data) * 100 
                    if tasks_data else 0, 1
                ),
                "network_utilization": round(
                    len([r for r in people_data if r.get("Met / Connected")]) / len(people_data) * 100 
                    if people_data else 0, 1
                )
            }
        }
        
        # Key insights and recommendations
        insights = {
            "top_performing_categories": dict(sorted(
                Counter(r.get("CATEGORY", "") for r in tracker_data if r.get("CATEGORY")).items(),
                key=lambda x: x[1], reverse=True
            )[:5]),
            "most_effective_referrals": dict(sorted(
                Counter(r.get("REFERRAL", "") for r in tracker_data if r.get("REFERRAL")).items(),
                key=lambda x: x[1], reverse=True
            )[:5]),
            "priority_focus_areas": {
                "high_priority_targets": [
                    {"target": r.get("TARGET"), "category": r.get("CATEGORY"), "status": r.get("NOTES /STATUS")}
                    for r in tracker_data if r.get("PRIORITY") == "A"
                ][:10]
            }
        }
        
        report = {
            "executive_summary": executive_summary,
            "key_insights": insights,
            "report_generated": datetime.now().isoformat(),
            "data_freshness": {
                "tracker_records": len(tracker_data),
                "opportunity_records": len(opportunity_data),
                "task_records": len(tasks_data),
                "contact_records": len(people_data)
            }
        }
        
        return {"success": True, "data": report}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating executive report: {str(e)}")