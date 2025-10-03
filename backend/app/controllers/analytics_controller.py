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
from app.models.contact import Contact
from app.models.fundraising import Fundraising, FundraisingStatus, InvestorType
from app.models.opportunity import Opportunity, OpportunityStatus, Priority
from app.models.task import Task
from app.models.tracker import Tracker
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
async def get_dashboard_summary():  # Removed current_user dependency for testing
    """Get high-level KPIs and summary metrics for the main dashboard"""
    try:
        # Load data from database instead of JSON files
        contacts = await Contact.find_all().to_list()
        fundraising_targets = await Tracker.find_all().to_list()
        opportunities = await Opportunity.find_all().to_list()
        tasks = await Task.find_all().to_list()
        
        # Calculate KPIs
        summary = {
            "fundraising_targets": {
                "total_targets": len(fundraising_targets),
                "priority_breakdown": dict(Counter(
                    record.data.get('priority', 'Unknown') 
                    for record in fundraising_targets 
                    if record.data.get('priority')
                )),
                "category_breakdown": dict(Counter(
                    record.category if hasattr(record, 'category') and record.category else "Unknown" 
                    for record in fundraising_targets 
                    if hasattr(record, 'category') and record.category
                )),
                "active_targets": len([r for r in fundraising_targets if r.data.get('priority') not in ["Closed", "D"]]),
                "high_priority_targets": len([r for r in fundraising_targets if r.data.get('priority') == "A"])
            },
            "opportunities": {
                "total_opportunities": len(opportunities),
                "in_process": len([opp for opp in opportunities if opp.status == OpportunityStatus.IN_PROGRESS]),
                "completed": len([opp for opp in opportunities if opp.status == OpportunityStatus.CLOSED_WON]),
                "priority_a_opportunities": len([opp for opp in opportunities if opp.priority == Priority.HIGH])
            },
            "tasks": {
                "total_tasks": len(tasks),
                "completed_tasks": len([r for r in tasks if hasattr(r, 'status') and r.status == "Completed"]),
                "pending_tasks": len([r for r in tasks if hasattr(r, 'status') and r.status != "Completed"]),
                "completion_rate": round(
                    (len([r for r in tasks if hasattr(r, 'status') and r.status == "Completed"]) / len(tasks) * 100) 
                    if tasks else 0, 1
                ),
                "meeting_tasks": len([r for r in tasks if hasattr(r, 'task_type') and r.task_type == "Meeting"])
            },
            "contacts": {
                "total_contacts": len(contacts),
                "connected_contacts": len([r for r in contacts if hasattr(r, 'status') and r.status == "Active"]),
                "organizations": len(set(
                    r.organisation for r in contacts 
                    if hasattr(r, 'organisation') and r.organisation and r.organisation.strip()
                ))
            }
        }
        
        return {"success": True, "data": summary}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating dashboard summary: {str(e)}")

@router.get("/fundraising-analytics")
# @require_permissions(["read_analytics", "read_fundraising"])  # Temporarily disabled for testing
async def get_fundraising_analytics():  # Removed current_user dependency for testing
    """Get detailed fundraising analytics and pipeline metrics"""
    try:
        # Load data from database instead of JSON files
        fundraising_records = await Fundraising.find_all().to_list()
        
        # Status distribution
        status_stats = dict(Counter(
            str(record.status_open_closed.value) if hasattr(record.status_open_closed, 'value') else str(record.status_open_closed)
            for record in fundraising_records 
            if record.status_open_closed
        ))
        
        # Investor type analysis
        investor_type_stats = dict(Counter(
            str(record.investor_type.value) if hasattr(record.investor_type, 'value') else str(record.investor_type or "Unknown")
            for record in fundraising_records 
            if record.investor_type
        ))
        
        # Organization analysis
        organization_stats = dict(Counter(
            record.organisation or "Unknown" 
            for record in fundraising_records 
            if record.organisation
        ))
        
        # Pipeline stages based on status
        pipeline_stages = {
            "new": len([r for r in fundraising_records if r.status_open_closed == FundraisingStatus.OPEN]),
            "contacted": len([r for r in fundraising_records if r.status_open_closed == FundraisingStatus.OPEN]),  # Map OPEN to contacted
            "in_process": len([r for r in fundraising_records if r.status_open_closed == FundraisingStatus.OPEN and r.feeler_teaser_letter_sent]),  # In process if teaser sent
            "advanced": len([r for r in fundraising_records if r.initial_appraisal_evaluation_process_started]),  # Advanced if appraisal started
            "completed": len([r for r in fundraising_records if r.commitment_letter_conclusion])  # Completed if commitment letter
        }
        
        # Referral effectiveness (using reference field)
        referral_stats = dict(Counter(
            record.reference or "Direct"
            for record in fundraising_records 
            if record.reference
        ))
        
        # Contact completeness
        contact_completeness = {
            "with_reference": len([r for r in fundraising_records if r.reference]),
            "with_investor_type": len([r for r in fundraising_records if r.investor_type]),
            "with_responsibility": len([r for r in fundraising_records if r.responsibility_tnifmc]),
            "with_request_amount": len([r for r in fundraising_records if r.tnifmc_request_inr_cr])
        }
        
        analytics = {
            "status_distribution": status_stats,
            "investor_type_breakdown": investor_type_stats,
            "organization_analysis": organization_stats,
            "pipeline_stages": pipeline_stages,
            "referral_effectiveness": referral_stats,
            "contact_data_quality": contact_completeness,
            "pipeline_health": {
                "total_campaigns": len(fundraising_records),
                "active_pipeline": len([r for r in fundraising_records if r.status_open_closed == FundraisingStatus.OPEN]),
                "completed_campaigns": len([r for r in fundraising_records if r.commitment_letter_conclusion]),
                "conversion_indicators": pipeline_stages
            }
        }
        
        return {"success": True, "data": analytics}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating fundraising analytics: {str(e)}")

@router.get("/opportunity-metrics")
# @require_permissions  # Temporarily disabled(["read_analytics", "read_opportunities"])
async def get_opportunity_metrics():  # Removed current_user dependency for testing
    """Get opportunity pipeline and performance metrics"""
    try:
        # Load data from database instead of JSON files
        opportunities = await Opportunity.find_all().to_list()
        
        # Status distribution
        status_stats = dict(Counter(
            str(opp.status.value) if hasattr(opp.status, 'value') else str(opp.status)
            for opp in opportunities 
            if opp.status
        ))
        
        # Priority breakdown
        priority_stats = dict(Counter(
            str(opp.priority.value) if hasattr(opp.priority, 'value') else str(opp.priority)
            for opp in opportunities 
            if opp.priority
        ))
        
        # Category analysis (using organisation field as category)
        category_stats = dict(Counter(
            opp.organisation or "Unknown" 
            for opp in opportunities 
            if opp.organisation
        ))
        
        # Opportunity pipeline stages - map enum values to pipeline stages
        pipeline_stages = {
            "new": len([opp for opp in opportunities if opp.status == OpportunityStatus.OPEN]),
            "contacted": len([opp for opp in opportunities if opp.status == OpportunityStatus.OPEN]),  # Map OPEN to contacted
            "in_process": len([opp for opp in opportunities if opp.status == OpportunityStatus.IN_PROGRESS]),
            "advanced": len([opp for opp in opportunities if opp.status == OpportunityStatus.IN_PROGRESS]),  # Map IN_PROGRESS to advanced
            "completed": len([opp for opp in opportunities if opp.status in [OpportunityStatus.CLOSED_WON, OpportunityStatus.CLOSED_LOST]])
        }
        
        # Referral effectiveness (not available in current model, using placeholder)
        referral_stats = {"Direct": len(opportunities)}  # Placeholder since referral data not in model
        
        metrics = {
            "status_distribution": status_stats,
            "priority_breakdown": priority_stats,
            "category_analysis": category_stats,
            "pipeline_stages": pipeline_stages,
            "referral_effectiveness": referral_stats,
            "opportunity_health": {
                "total_opportunities": len(opportunities),
                "active_opportunities": len([opp for opp in opportunities if opp.status not in [OpportunityStatus.CLOSED_WON, OpportunityStatus.CLOSED_LOST]]),
                "high_priority": len([opp for opp in opportunities if opp.priority == Priority.HIGH]),
                "conversion_rate": round(
                    (len([opp for opp in opportunities if opp.status == OpportunityStatus.CLOSED_WON]) / len(opportunities) * 100) if opportunities else 0, 1
                )
            }
        }
        
        return {"success": True, "data": metrics}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating opportunity metrics: {str(e)}")

@router.get("/task-analytics")
# @require_permissions  # Temporarily disabled(["read_analytics", "read_tasks"])
async def get_task_analytics():  # Removed current_user dependency for testing
    """Get task completion and performance analytics"""
    try:
        # Load data from database instead of JSON files
        tasks = await Task.find_all().to_list()
        
        # Task type distribution
        type_stats = dict(Counter(
            str(task.task_type.value) if hasattr(task.task_type, 'value') else str(task.task_type)
            for task in tasks 
            if task.task_type
        ))
        
        # Completion analysis
        completion_stats = {
            "completed": len([t for t in tasks if t.status == "Completed"]),
            "pending": len([t for t in tasks if t.status != "Completed"]),
            "total": len(tasks)
        }
        completion_stats["completion_rate"] = round(
            (completion_stats["completed"] / completion_stats["total"] * 100) if completion_stats["total"] else 0, 1
        )
        
        # Task delegation analysis (assigned_to field)
        delegated_stats = dict(Counter(
            task.assigned_to or "Unassigned"
            for task in tasks 
            if task.title
        ))
        
        # Opportunity linkage
        linked_opportunities = len([t for t in tasks if t.opportunity_id])
        
        # Date analysis
        current_time = datetime.now()
        overdue_tasks = []
        upcoming_tasks = []
        
        for task in tasks:
            if task.due_date:
                if task.due_date < current_time and task.status != "Completed":
                    overdue_tasks.append(task)
                elif task.due_date > current_time:
                    upcoming_tasks.append(task)
        
        analytics = {
            "task_types": type_stats,
            "completion_metrics": completion_stats,
            "delegation_analysis": delegated_stats,
            "opportunity_linkage": {
                "linked_tasks": linked_opportunities,
                "unlinked_tasks": len(tasks) - linked_opportunities,
                "linkage_rate": round((linked_opportunities / len(tasks) * 100) if tasks else 0, 1)
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
async def get_contact_analytics():  # Removed current_user dependency for testing
    """Get contact network and relationship analytics"""
    try:
        # Load data from database instead of JSON files
        contacts = await Contact.find_all().to_list()
        
        # Organization distribution
        org_stats = dict(Counter(
            contact.organisation or "Unknown" 
            for contact in contacts 
            if contact.organisation and contact.organisation.strip()
        ))
        
        # Top 10 organizations by contact count
        top_orgs = dict(sorted(org_stats.items(), key=lambda x: x[1], reverse=True)[:10])
        
        # Connection status (using status field)
        connection_stats = {
            "connected": len([c for c in contacts if c.status == "Active"]),
            "not_connected": len([c for c in contacts if c.status != "Active"]),
            "total_contacts": len(contacts)
        }
        
        # Contact data completeness
        data_quality = {
            "with_phone": len([c for c in contacts if c.phone]),
            "with_email": len([c for c in contacts if c.email]),
            "with_designation": len([c for c in contacts if c.designation]),
            "with_organisation": len([c for c in contacts if c.organisation]),
            "complete_profiles": len([
                c for c in contacts 
                if (c.phone or c.email) and c.designation and c.organisation
            ])
        }
        
        # Network value analysis
        total_contacts = len(contacts)
        network_value = {
            "total_contacts": total_contacts,
            "unique_organizations": len(set(
                c.organisation for c in contacts 
                if c.organisation and c.organisation.strip()
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