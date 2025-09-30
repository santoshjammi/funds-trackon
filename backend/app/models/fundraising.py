"""
Fundraising model for Lead Management System
Based on summary_FR.json structure using MongoDB with Beanie ODM
"""

from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class InvestorType(str, Enum):
    """Investor types enumeration"""
    PSU_BANKS = "PSU Banks / PFIs"
    PRIVATE_BANKS = "Private Banks"
    INSURANCE = "Insurance Companies"
    MUTUAL_FUNDS = "Mutual Funds"
    PENSION_FUNDS = "Pension Funds"
    SOVEREIGN_WEALTH = "Sovereign Wealth Funds"
    INTERNATIONAL = "International Investors"
    OTHERS = "Others"


class FundraisingStatus(str, Enum):
    """Fundraising status enumeration"""
    OPEN = "Open"
    CLOSED = "Closed"
    INVESTED = "Invested"
    REJECTED = "Rejected"


class Fundraising(Document):
    """Fundraising model representing investment tracking"""
    
    status_open_closed: FundraisingStatus = Field(..., alias="Status_Open__Closed")
    date_of_first_meeting_call: Optional[datetime] = Field(None, alias="Date_of_first_meeting__call")
    organisation: str = Field(..., description="Organization name")
    reference: str = Field(..., description="Reference source")
    tnifmc_request_inr_cr: Optional[float] = Field(None, alias="TNIFMC_Request_INR_Cr", description="Requested amount in INR Crores (legacy)")
    # New Niveshya field (dual-read/write period)
    niveshya_request_inr_cr: Optional[float] = Field(None, description="Requested amount in INR Crores")
    investor_type: Optional[InvestorType] = Field(None, alias="Investor_Type")
    responsibility_tnifmc: str = Field(..., alias="Responsibility_TNIFMC", description="Responsible team member at Niveshya (legacy field name)")
    # New Niveshya field (dual-read/write period)
    responsibility_niveshya: Optional[str] = Field(None, description="Responsible team member at Niveshya")
    
    # Process tracking booleans
    feeler_teaser_letter_sent: bool = Field(False, alias="FeelerTeaserLetter_Sent")
    meetings_detailed_discussions_im_sent: bool = Field(False, alias="Meetings__Detailed_DiscussionsIM_Sent")
    initial_appraisal_evaluation_process_started: bool = Field(False, alias="Initial_Appraisal__Evaluation_process_started")
    due_diligence_queries: bool = Field(False, alias="Due_Diligence__Queries")
    commitment_letter_conclusion: bool = Field(False, alias="Commitment_Letter__Conclusion")
    initial_final_drawdown: bool = Field(False, alias="Initial__Final_Drawdown")
    
    # Financial details
    commitment_amount_inr_cr: Optional[float] = Field(None, alias="Commitment_Amount_INR_Cr", description="Committed amount in INR Crores")
    current_status: Optional[str] = Field(None, alias="Current_Status")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    # Contact reference
    contact_id: Optional[str] = Field(None, description="Reference to contact document")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "fundraising"
        indexes = [
            "organisation",
            "status_open_closed",
            "investor_type",
            "responsibility_tnifmc",
            "responsibility_niveshya",
            "contact_id",
            [("organisation", 1), ("status_open_closed", 1)]
        ]
    
    class Config:
        validate_by_name = True
        json_schema_extra = {
            "example": {
                "Status_Open__Closed": "Open",
                "Date_of_first_meeting__call": "2024-03-10T00:00:00Z",
                "Organisation": "IOB",
                "Reference": "CFM",
                "TNIFMC_Request_INR_Cr": 5.0,
                "Investor_Type": "PSU Banks / PFIs",
                "Responsibility_TNIFMC": "K. Ganapathy Subramanian",
                "FeelerTeaserLetter_Sent": True,
                "Commitment_Amount_INR_Cr": 5.0,
                "Current_Status": "Need to send contribution Agreement - Received Rs 5 Cr LOI"
            }
        }
    
    def __repr__(self):
        return f"<Fundraising(id={self.id}, organisation='{self.organisation}', status='{self.status_open_closed}')>"