# World-Class Onboarding Flow Design Prompt

## Context

You are designing an onboarding flow for a SaaS analytics/dashboard product. The goal is to guide new users from first login to seeing value in their data as quickly as possible, while teaching them the product through doing rather than reading.

This prompt is based on analysis of Zoho Analytics' onboarding flow, which uses a 14-step guided experience combining welcome modals, tooltip-based product tours, progressive data import, and immediate AI-powered value delivery.

---

## Core Design Principles

### 1. Progressive Disclosure
Never show all information upfront. Reveal details only when the user needs them to complete the current step. Each screen should have one primary focus.

### 2. Learn By Doing
The guided tour makes users interact with real UI elements rather than reading documentation. Tooltips point to actual buttons and fields, and users click them to progress.

### 3. Sample Data Fallback
At every step where users need their own data, offer sample data as an alternative. This prevents abandonment from users who want to explore before committing their real data.

### 4. Escape Hatches Everywhere
Every modal, tooltip, and guided step must have a way to skip, close, or exit. Power users should never feel trapped in a tutorial.

### 5. Show Don't Tell
Instead of explaining what the product does, show users their actual data (or sample data) in the real interface as quickly as possible.

### 6. Smart Defaults
Pre-fill everything possible: workspace names, table names, column types, date formats. Users should be able to click "Next" repeatedly and still get a working result.

### 7. Validate Success Visually
After any import or creation action, show concrete numbers: "755 rows imported successfully." This proves the system works and builds confidence.

---

## Flow Structure (4 Phases, 14 Steps)

### PHASE 1: Welcome & Orientation (Steps 1-4)

**Step 1: Welcome Modal**
- Product logo + "Welcome to [Product Name]!" headline
- One-sentence value proposition (what problem you solve)
- Visual 3-step roadmap showing the entire journey:
  1. Connect Your Data
  2. Configure Your Dashboard  
  3. Get Insights
- Primary CTA: "Get Started" or "First Steps"
- Help sidebar with video tutorials and demo request links
- This modal overlays the main product interface (visible but dimmed behind)

**Step 2: Data Source Selection**
- Full-screen view of available integrations
- Category filter sidebar (e.g., Files, Cloud Storage, CRM, Marketing, etc.)
- Default to "Most Popular" or "Recommended" category
- Card-based grid layout with integration logos and names
- Contextual help sidebar: "With just a few clicks, connect your data source..."
- Secondary CTA: "How does this work?" + "Maybe later" skip link

**Step 3: Guided Tour Begins**
- Small tooltip overlay appears pointing to page header
- Title: "Your first step!"
- Brief instruction: "Import data from a variety of sources"
- "Next" button to advance tour
- "X" close button to exit tour
- Background UI remains visible and interactive

**Step 4: Focus on Specific Action**
- Tooltip points to the simplest integration option (e.g., "Files" or "CSV Upload")
- That option is visually highlighted (border, background change)
- Instruction: "Let's start by importing from a file. Click here or press Next."
- Dual action paths: clicking the highlighted element OR clicking Next both work

---

### PHASE 2: Data Configuration (Steps 5-9)

**Step 5: Workspace/Project Creation**
- Modal or slide-out panel for configuration
- Step indicator: "Step 1 of 2: Import Data"
- Form fields:
  - Workspace/Project name (pre-filled with "[Name]-1" or "[Company]-Workspace")
  - Optional description field
  - File upload area with "Select File" button
- "Sample" link prominently displayed for users without data
- Supported formats listed below upload area
- Technical limits stated (file size, row limits)
- Tooltip explains workspace concept: "A workspace is where you organize all your reports and dashboards"
- Cancel and Continue buttons

**Step 6: File Type Selection (Guided)**
- Tooltip points to file type dropdown
- Explains: "Select the format of your data file"
- Reassurance: "Don't have a file? Click Next to continue with sample data"
- Progress bar shows ~40% complete
- Options: CSV, Excel, JSON, etc.

**Step 7: Data Location Selection (Guided)**
- Tooltip points to source options (Local upload, Cloud URL, FTP, etc.)
- Brief explanation of each option
- Skip message: "To use sample data, click Next"
- Progress bar shows ~50% complete

**Step 8: File Upload/Selection (Guided)**
- Tooltip points to upload button AND sample data link
- Explains both paths equally: "Upload your file OR click 'Sample' to use our demo data"
- Sample data positioned as first-class option, not fallback
- Progress bar shows ~70% complete

**Step 9: Continue Confirmation**
- After file is selected (real or sample), tooltip says "Click Continue"
- Minimal instruction needed—user has completed all fields
- Progress bar shows ~90% complete
- File name displayed to confirm selection

---

### PHASE 3: Data Mapping & Validation (Steps 10-13)

**Step 10: Data Preview + Column Mapping**
- Step indicator: "Step 2 of 2: Configure Data"
- Table name field (pre-filled, editable)
- **CRITICAL: Column Mapping Interface**
  - Show preview of first 5 rows of uploaded data
  - Each column header has:
    - Checkbox (include/exclude from import)
    - Original column name from file
    - Dropdown to map to your system's metric names
    - Data type indicator (Date, Number, Text, Currency)
  - Auto-detect and pre-map obvious matches (e.g., "Revenue" → "Revenue", "Date" → "Date")
  - Unknown columns default to "Skip" or "Custom Field"
- Tooltip explains: "Map your columns to our metrics. We'll remember this mapping for future uploads."
- "Show data quality" link for advanced users
- Error handling dropdown: "If import errors occur: [Set empty value / Skip row / Cancel import]"

**Step 11: Metric Selection Checklist**
- Based on mapped columns, show checklist of available metrics
- Title: "Which metrics do you want to track?"
- Checkboxes for each metric category:
  - [ ] Revenue & Sales
  - [ ] Costs & Expenses  
  - [ ] Customer Data
  - [ ] Marketing Performance
  - [ ] Custom Metrics
- Explanation: "We'll only show the metrics you track. You can change this anytime."
- This determines which dashboard widgets appear
- Pre-check metrics that have data mapped to them

**Step 12: Create/Import Confirmation**
- Tooltip points to "Create" or "Import" button
- Simple prompt: "Click to import your data"
- Progress bar nearly complete
- Final chance to go back and adjust

**Step 13: Import Success Summary**
- Clean modal showing results:
  - "Successfully imported [Table Name]"
  - Column Summary: X columns mapped, Y skipped
  - Row Summary: X total rows, Y imported successfully, Z errors (if any)
  - Mapping saved: "We'll use this mapping for future uploads from this source"
- Tooltip: "Almost there! Click Close to see your dashboard"
- Single "Close" button

---

### PHASE 4: Product Activation (Step 14)

**Step 14: Main Interface + Value Delivery**
- User lands in main product with their data visible
- Data table or dashboard view populated with imported data

**AI/Auto-Generation Prompt (Modal):**
- Title: "Automatically generate your dashboard"
- Illustration showing data → charts transformation
- Copy: "[Product] can analyze your data and instantly generate relevant charts and insights. You can also build your own dashboard from scratch."
- Question: "Do you want us to create a starter dashboard?"
- Checkbox: "Don't show this again"
- Buttons: "No, I'll build my own" (secondary) | "Yes, generate dashboard" (primary)

**Demo/Help CTA (Floating sidebar):**
- "Schedule a free personal demo"
- "Our experts will show you how to get the most from your data"
- "Schedule Demo" button
- Dismissible with X

**Success State:**
- User sees either:
  - Auto-generated dashboard with their metrics
  - Empty dashboard builder with clear "Add Widget" prompts
- Their data is real and interactive
- Clear paths forward: edit, add more data, share, explore

---

## Data Integration Strategy

### The One-Time Mapping Approach (Like Instantly.ai)

**Problem:** Users have data in Excel/Google Sheets with custom column names. Manual re-mapping every upload is painful and error-prone.

**Solution:** Map once, pull automatically.

**Implementation:**

1. **First Upload:**
   - User uploads CSV or connects Google Sheet
   - System shows column mapping interface (Step 10)
   - User maps their columns to your metric names:
     - "Monthly Rev" → Revenue
     - "Ad Spend" → Marketing Cost
     - "New Customers" → Customer Acquisition
   - System saves this mapping configuration

2. **Subsequent Updates:**
   - User uploads new file OR system auto-pulls from connected Sheet
   - System applies saved mapping automatically
   - Only shows confirmation: "Applied mapping: 7 columns matched"
   - Data flows in without manual work

3. **Structure Changes:**
   - If new columns appear: prompt to map them
   - If expected columns missing: warning with options
   - If major structure change: "Re-upload and re-map" option
   - Clear messaging: "Your column structure changed. Let's update your mapping."

**Google Sheets Integration:**
- One-click OAuth connection
- Select specific sheet/tab
- Map columns once
- Set sync frequency (hourly, daily, weekly, manual)
- System pulls data automatically
- Dashboard always shows latest data

**Mapping Storage:**
```
{
  "source": "google_sheets",
  "sheet_id": "abc123",
  "tab": "Sales Data",
  "mapping": {
    "A": { "source_name": "Date", "target": "date", "type": "date" },
    "B": { "source_name": "Monthly Rev", "target": "revenue", "type": "currency" },
    "C": { "source_name": "Ad Spend", "target": "marketing_cost", "type": "currency" },
    "D": { "source_name": "New Custs", "target": "new_customers", "type": "number" }
  },
  "created_at": "2024-01-15",
  "last_sync": "2024-01-20"
}
```

---

## Tooltip Design Specifications

### Anatomy of a Guided Tooltip

```
┌─────────────────────────────────────┐
│  [Title - Bold, 16px]               │
│                                     │
│  [Description - Regular, 14px,      │
│   2-3 lines max, gray text]         │
│                                     │
│  [━━━━━━━━━━━░░░░░░] Progress bar   │
│                                     │
│              [Next Button - Blue]   │
│                                     │
│                              [X]    │
└─────────────────────────────────────┘
         │
         ▼ (pointer to UI element)
```

### Tooltip Behavior:
- Appears adjacent to the element it references
- Has pointer/arrow indicating the target
- Dims or highlights the target element
- Cannot be dismissed by clicking outside (only X or Next)
- Next button always advances to next step
- Progress bar shows position in current phase
- Escape key closes entire tour

### Copy Guidelines:
- Title: 2-5 words, action-oriented ("Select a file type")
- Description: 1-2 sentences max, explain what and why
- Always include skip/sample data option where relevant
- Use "Click" not "Please click" – be direct

---

## Modal Design Specifications

### Welcome Modal
- Centered, 600-800px wide
- Product logo at top
- Large headline (24-32px)
- Single paragraph description (16px, gray)
- Visual roadmap with icons (horizontal, 3 steps)
- Primary button centered below roadmap
- Help section as right sidebar or below main content
- Subtle backdrop blur on main interface behind

### Success/Summary Modal  
- Centered, 400-500px wide
- Success icon or checkmark
- Clear headline stating what was accomplished
- Statistics in clean two-column layout (Label: Value)
- Single action button
- No distractions or secondary options

### Decision Modal (AI Generation, etc.)
- Centered, 500-600px wide
- Illustration or icon at top
- Clear value proposition (what they'll get)
- Question format: "Do you want to...?"
- "Don't show again" checkbox
- Two buttons: secondary (No/Skip) | primary (Yes/Continue)

---

## Error States & Edge Cases

### No Data Uploaded
- Always offer sample data path
- Message: "No file selected. Continue with sample data to explore [Product]."

### Invalid File Format
- Clear error: "This file format isn't supported. Please upload CSV, XLSX, or JSON."
- List supported formats
- Don't close the upload dialog

### Mapping Failures
- If columns can't be auto-detected: "We couldn't automatically map your columns. Please map them manually below."
- Highlight unmapped columns in yellow/orange
- Require at least one mapped column to continue

### Import Errors
- Show partial success: "Imported 743 of 755 rows. 12 rows had errors."
- Option to download error log
- Option to continue anyway or fix and retry

### Connection Issues (Google Sheets)
- "Unable to connect to Google Sheets. Please check your permissions and try again."
- "Reconnect" button
- Don't lose their previous mapping configuration

---

## Technical Implementation Notes

### Tour State Management
- Store tour progress in localStorage or user profile
- If user closes tour, don't auto-restart on next login
- Offer "Restart Tutorial" in help menu
- Track completion for analytics (where do users drop off?)

### Responsive Behavior
- Tooltips should reposition on mobile (above/below vs. side)
- Welcome modal should be scrollable on small screens
- Progress bars work at any width
- Touch-friendly buttons (min 44px tap targets)

### Accessibility
- All tooltips should be keyboard navigable
- Focus should be trapped within modals
- Escape key closes current overlay
- Screen reader announcements for progress
- Color is not the only indicator of state

### Analytics Events to Track
- `onboarding_started` - Welcome modal shown
- `onboarding_step_completed` - Each step finished
- `onboarding_skipped` - Tour closed early (include step number)
- `onboarding_completed` - Full flow finished
- `sample_data_used` - User chose sample vs. real data
- `mapping_saved` - Column mapping configuration saved
- `ai_generation_accepted` - User said yes to auto-dashboard
- `time_to_value` - Seconds from start to seeing populated dashboard

---

## Example Microcopy

### Welcome Modal
**Headline:** Welcome to [Product]!
**Description:** [Product] helps you understand your business data with beautiful dashboards and actionable insights. Let's get your first dashboard set up in under 5 minutes.

### Roadmap Steps
1. **Connect Data** - Upload a file or connect to Google Sheets
2. **Map Metrics** - Tell us which numbers matter to you
3. **See Insights** - Get an instant dashboard with your data

### Tooltip Examples
**Step 3:** "Your first step! / Import data from a file or connect a spreadsheet. We'll walk you through it."

**Step 8:** "Select your file / Upload your data file or click 'Sample Data' to explore with demo data first."

**Step 10:** "Map your columns / Match your column names to our metrics. We'll save this mapping for future uploads."

### Success Messages
**Import complete:** "Successfully imported 'Q4 Sales Data' - 1,247 rows ready to analyze"

**Mapping saved:** "Got it! We'll use this mapping automatically for future uploads."

### Error Messages
**Missing required column:** "We need at least a date column to create your dashboard. Please map one column as 'Date'."

**File too large:** "This file exceeds the 100MB limit. Try uploading a smaller file or connect directly to Google Sheets for larger datasets."

---

## Checklist for Implementation

### Phase 1: Welcome
- [ ] Welcome modal with logo, headline, description
- [ ] 3-step visual roadmap with icons
- [ ] "Get Started" primary CTA
- [ ] Help sidebar with video/demo links
- [ ] Modal dismissible (continues to product in empty state)

### Phase 2: Data Source
- [ ] Integration grid with category filters
- [ ] "Files/CSV" option prominently featured
- [ ] Contextual help sidebar
- [ ] "Maybe later" skip option
- [ ] Guided tooltip pointing to Files option

### Phase 3: Data Configuration  
- [ ] Step indicator (Step 1 of 2)
- [ ] Workspace name field (pre-filled)
- [ ] File upload with drag-and-drop
- [ ] Sample data link visible at all times
- [ ] File type and location options
- [ ] Tooltip guidance for each field
- [ ] Progress bar in tooltips

### Phase 4: Mapping & Import
- [ ] Step indicator (Step 2 of 2)
- [ ] Data preview (first 5 rows)
- [ ] Column mapping dropdowns
- [ ] Auto-detection of obvious mappings
- [ ] Include/exclude checkboxes per column
- [ ] Metric selection checklist
- [ ] Import success summary with stats
- [ ] "Mapping saved" confirmation

### Phase 5: Activation
- [ ] Main interface with data visible
- [ ] AI generation prompt modal
- [ ] Demo scheduling sidebar CTA
- [ ] Clear next steps if user declines AI

### Cross-Cutting
- [ ] All modals have close buttons
- [ ] All tooltips have skip options
- [ ] Sample data works end-to-end
- [ ] Progress saved if user leaves mid-flow
- [ ] Mobile-responsive at all steps
- [ ] Keyboard accessible throughout

---

## Final Notes

The most successful onboarding flows share one characteristic: they get users to real value as fast as possible. Every step should either (a) gather essential information or (b) teach through interaction. If a step does neither, remove it.

The Zoho Analytics flow works because:
1. Users see a roadmap upfront (reduces anxiety)
2. Every form field is explained in context (no guessing)
3. Sample data prevents "I'm not ready" abandonment
4. Success is validated with concrete numbers
5. AI assistance is offered immediately after data loads
6. Multiple support paths exist (videos, demos, help docs)

Your implementation should achieve the same outcomes while adapting to your specific product's data structure and value proposition.
