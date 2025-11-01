"""
Example: Complete Knowledge Base Document Structure
This shows how actual knowledge content gets stored in the organization-centric system
"""

# Example 1: Meeting Knowledge
series_a_meeting_knowledge = {
    # Basic Knowledge Information
    "title": "Series A Discussion - ABC Bank Investment Committee Meeting",
    "description": "Comprehensive summary of our Series A funding discussions with ABC Bank investment committee, covering investment terms, due diligence requirements, and timeline",
    
    # Knowledge Content (THE ACTUAL KNOWLEDGE)
    "content": """
MEETING SUMMARY: ABC Bank Series A Investment Discussion
Date: October 25, 2025
Duration: 2 hours
Location: ABC Bank Headquarters, Mumbai

ATTENDEES:
Internal Team:
- CEO: Rajesh Kumar
- CFO: Priya Sharma  
- CTO: Amit Patel

ABC Bank Team:
- John Doe, Investment Director
- Jane Smith, Senior Investment Analyst
- Michael Johnson, Risk Assessment Lead

KEY DISCUSSION POINTS:

1. INVESTMENT TERMS
   - ABC Bank interested in leading $8M Series A round
   - Seeking 20-25% equity stake
   - Valuation expectation: $32-40M pre-money
   - Board seat requirement: 1 independent director

2. DUE DILIGENCE REQUIREMENTS
   - Financial audit (last 3 years)
   - Technology stack review
   - Customer concentration analysis
   - Regulatory compliance verification
   - Team background checks

3. TIMELINE
   - Due diligence: 6-8 weeks
   - Investment committee approval: 2-3 weeks after DD completion
   - Funding closure: 10-12 weeks total timeline

4. KEY CONCERNS RAISED
   - Customer acquisition cost trending upward
   - Regulatory changes in fintech sector
   - Competition from established banks entering digital space
   - Unit economics need improvement

5. NEXT STEPS
   - Provide detailed financial model (Due: Nov 1)
   - Schedule technology demo (Due: Nov 5)
   - Submit due diligence data room access (Due: Nov 3)
   - Follow-up meeting with investment committee (Scheduled: Nov 10)

6. KEY INSIGHTS
   - ABC Bank sees fintech as strategic priority
   - Looking for 3-5 portfolio companies in this space
   - Strong preference for B2B fintech over consumer
   - Emphasis on regulatory compliance and risk management

7. ACTION ITEMS
   - CFO to prepare detailed financial projections
   - CTO to prepare technology architecture documentation
   - CEO to provide customer references
   - Legal team to prepare data room
    """,
    
    # Document Classification
    "document_type": "text",
    "category": "meeting_minutes",
    
    # Organization Context (REQUIRED)
    "organization_id": "abc_bank_123",
    "organization_name": "ABC Bank Limited", 
    "industry_sector": "Banking",
    
    # Entity Relationships
    "fundraising_id": "series_a_round_2025",
    "opportunity_id": "abc_bank_investment_opportunity",
    "meeting_id": "abc_bank_meeting_oct25_2025",
    
    # People Involved
    "contact_ids": ["john_doe_abc_bank", "jane_smith_abc_bank", "michael_johnson_abc_bank"],
    "user_ids": ["ceo_rajesh", "cfo_priya", "cto_amit"],
    
    # Cross-Entity Knowledge Links
    "related_fundraising_ids": ["series_a_round_2025"],
    "related_opportunity_ids": ["abc_bank_investment_opportunity"],
    "related_task_ids": ["financial_model_task", "tech_demo_task", "due_diligence_prep"],
    "related_document_ids": ["abc_bank_pitch_deck", "abc_bank_financial_model"],
    
    # Knowledge Discovery
    "keywords": ["series-a", "investment", "valuation", "due-diligence", "board-seat", "timeline", "financial-audit"],
    "tags": ["funding", "investment-committee", "term-discussion", "next-steps"],
    "business_impact": "Critical meeting for Series A funding - potential lead investor with $8M commitment",
    "confidentiality_level": "CONFIDENTIAL",
    
    # Metadata
    "created_by": "ceo_rajesh",
    "custom_metadata": {
        "meeting_type": "investment_discussion",
        "recording_available": True,
        "presentation_used": "series_a_pitch_deck_v3.pptx",
        "follow_up_required": True,
        "priority": "HIGH"
    }
}

# Example 2: Research Knowledge
market_research_knowledge = {
    "title": "ABC Bank Digital Transformation Strategy Analysis", 
    "description": "Research analysis of ABC Bank's digital transformation initiatives and how our platform aligns with their strategic goals",
    
    # Research Content (THE ACTUAL KNOWLEDGE)
    "content": """
ABC BANK DIGITAL TRANSFORMATION RESEARCH
Research Date: October 20, 2025
Analyst: Business Development Team

EXECUTIVE SUMMARY:
ABC Bank is undergoing aggressive digital transformation with $50M budget allocated for fintech partnerships in 2025-2026.

KEY FINDINGS:

1. DIGITAL STRATEGY PRIORITIES
   - Mobile-first banking platform
   - API-driven architecture
   - Real-time payment processing
   - Advanced analytics and AI
   - Regulatory compliance automation

2. CURRENT PAIN POINTS
   - Legacy core banking system limitations
   - Manual compliance processes
   - Limited real-time capabilities
   - Poor customer experience metrics
   - High operational costs

3. STRATEGIC INITIATIVES
   - Digital wallet launch (Q1 2026)
   - Open banking compliance (ongoing)
   - AI-powered risk assessment (pilot phase)
   - Blockchain for trade finance (research phase)

4. PARTNERSHIP APPROACH
   - Prefer strategic partnerships over acquisitions
   - Looking for proven technology solutions
   - Emphasis on regulatory compliance
   - Require local presence and support

5. DECISION-MAKING PROCESS
   - Investment committee approves >$1M investments
   - Technology committee evaluates solutions
   - Risk committee assesses compliance
   - Average decision timeline: 3-4 months

6. COMPETITIVE LANDSCAPE
   - Evaluating 3-4 fintech partners simultaneously
   - Focus on differentiated offerings
   - Price sensitive but value-driven
   - Long-term partnership orientation

7. OUR ALIGNMENT
   - Strong fit with their API-first approach
   - Compliance features match their needs
   - Real-time capabilities address pain points
   - Our team has banking domain expertise

RECOMMENDATIONS:
- Position as strategic technology partner
- Emphasize compliance and security features
- Provide detailed implementation roadmap
- Offer pilot program to reduce risk
    """,
    
    "document_type": "text",
    "category": "research",
    "organization_id": "abc_bank_123",
    "organization_name": "ABC Bank Limited",
    "industry_sector": "Banking",
    "keywords": ["digital-transformation", "strategy", "api", "compliance", "partnership"],
    "business_impact": "Strategic intelligence for positioning our solution effectively",
    "confidentiality_level": "INTERNAL"
}

# Example 3: File-based Knowledge (Audio Recording)
meeting_recording_knowledge = {
    "title": "ABC Bank Investment Committee Call Recording",
    "description": "Audio recording of investment committee discussion with automatic transcript",
    
    # File Information
    "document_type": "audio", 
    "filename": "abc_bank_investment_call_oct25_2025.mp3",
    "file_path": "/uploads/audio/abc_bank_investment_call_oct25_2025.mp3",
    "file_size": 156780000,  # ~150MB audio file
    "mime_type": "audio/mpeg",
    
    # Transcribed Content (AUTO-GENERATED KNOWLEDGE)
    "content": """
[AUTO-GENERATED TRANSCRIPT - Processed by AI Audio Analysis]

[00:00:00] CEO (Rajesh): Thank you everyone for joining today's call. We're here to discuss the Series A investment opportunity...

[00:02:15] John Doe (ABC Bank): We've reviewed your materials and are impressed with the traction you've shown in the B2B segment...

[00:05:30] Jane Smith (ABC Bank): I have some questions about your customer acquisition costs. Can you walk us through the trends over the last 12 months?

[00:08:45] CFO (Priya): Absolutely. Our CAC has been optimizing quarter over quarter. In Q1 it was $450, Q2 dropped to $380, and Q3 we're seeing $320...

[TRANSCRIPT CONTINUES FOR FULL 2-HOUR CONVERSATION]

[01:45:20] Michael Johnson (ABC Bank): From a risk perspective, we're comfortable with the compliance framework you've built...

[01:58:30] John Doe (ABC Bank): Next steps from our side - we'll need the due diligence data room setup within the next week...

[AI ANALYSIS SUMMARY]
Key Topics Discussed:
- Investment terms and valuation
- Due diligence requirements  
- Timeline and next steps
- Risk assessment and compliance
- Technology architecture review

Sentiment Analysis: Positive (85% confidence)
Action Items Identified: 7
Follow-up Required: Yes
    """,
    
    "organization_id": "abc_bank_123",
    "meeting_id": "abc_bank_call_oct25_2025",
    "keywords": ["audio-transcript", "investment-call", "due-diligence"],
    "confidentiality_level": "CONFIDENTIAL",
    "custom_metadata": {
        "transcript_generated": True,
        "ai_analyzed": True,
        "audio_quality": "high", 
        "participants_count": 6,
        "recording_duration_minutes": 120
    }
}

# Example 4: Document Knowledge (Uploaded File)
contract_knowledge = {
    "title": "ABC Bank Term Sheet - Series A Investment",
    "description": "Signed term sheet outlining investment terms and conditions for Series A funding round",
    
    # File-based Knowledge
    "document_type": "document",
    "filename": "abc_bank_term_sheet_signed.pdf",
    "file_path": "/uploads/documents/abc_bank_term_sheet_signed.pdf", 
    "file_size": 2048000,
    "mime_type": "application/pdf",
    "file_hash": "sha256:abc123...", # For integrity verification
    
    # Extracted/Summarized Content
    "content": """
[DOCUMENT SUMMARY - Key Terms Extracted]

TERM SHEET SUMMARY: ABC Bank Series A Investment
Document Date: October 30, 2025
Status: Signed

KEY TERMS:
- Investment Amount: $8,000,000
- Pre-money Valuation: $35,000,000  
- Post-money Valuation: $43,000,000
- Equity Percentage: 18.6%
- Security Type: Series A Preferred Stock

RIGHTS AND PREFERENCES:
- Liquidation Preference: 1x non-participating
- Dividend: 8% cumulative if declared
- Anti-dilution: Weighted average broad-based
- Board Composition: 5 members (2 founder, 1 investor, 2 independent)

CONDITIONS PRECEDENT:
- Satisfactory completion of due diligence
- Regulatory approvals
- Employee stock option pool (15%)
- Founder vesting schedules
- Investment committee final approval

TIMELINE:
- Due diligence completion: 45 days
- Definitive agreements: 60 days
- Funding close: 75 days

IMPORTANT CLAUSES:
- Tag-along rights for minority shareholders
- Drag-along rights for majority shareholders  
- Right of first refusal on future rounds
- Information rights and inspection
- Key person insurance requirements
    """,
    
    "organization_id": "abc_bank_123", 
    "fundraising_id": "series_a_round_2025",
    "keywords": ["term-sheet", "investment-terms", "valuation", "equity", "board-composition"],
    "confidentiality_level": "RESTRICTED", # Highest security level
    "business_impact": "Legal binding document for Series A funding terms",
    "custom_metadata": {
        "document_status": "signed", 
        "legal_review_completed": True,
        "binding": True,
        "expiry_date": "2025-12-31"
    }
}

print("Knowledge Base Examples Created Successfully!")
print("\nKnowledge Content Sources:")
print("1. Text Content: Manual notes, summaries, analysis")
print("2. Audio Content: Recordings with AI transcription") 
print("3. File Content: Documents with extracted key information")
print("4. Generated Content: AI analysis and insights")