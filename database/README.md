# Database Setup Guide

This directory contains SQL migration files for setting up the FlowVeda Investor Portal database in Supabase.

## Prerequisites

- A Supabase project created
- Access to the Supabase SQL Editor

## Setup Steps

### 1. Run Migrations

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the migrations in order:

   **First, run `001_initial_schema.sql`:**
   - Creates all database tables
   - Sets up indexes for performance
   - Creates triggers for `updated_at` timestamps

   **Then, run `002_rls_policies.sql`:**
   - Enables Row Level Security (RLS) on all tables
   - Creates security policies for role-based access control
   - Ensures users can only access data they're authorized to see

### 2. Verify Setup

After running the migrations, verify that:

- All tables are created (check in Table Editor)
- RLS is enabled on all tables (should see a shield icon)
- Policies are created (check in Authentication > Policies)

### 3. Create Initial Fund (Optional)

You may want to create an initial fund for testing:

```sql
INSERT INTO funds (name, legal_name, status)
VALUES ('Test Fund', 'Test Fund LLC', 'raising')
RETURNING id;
```

Save the returned `id` to use when creating manager users.

## Table Structure

### Core Tables

- **users** - User accounts (extends Supabase Auth)
- **funds** - Investment funds
- **investors** - Investor profiles
- **deals** - Real estate deals
- **investor_deals** - Many-to-many relationship between investors and deals

### Document & Communication Tables

- **documents** - All documents (PPMs, K-1s, reports, etc.)
- **capital_calls** - Capital call records
- **capital_call_items** - Per-investor capital call breakdowns
- **email_logs** - Email tracking

### System Tables

- **audit_logs** - Compliance and audit trail

## Row Level Security (RLS)

RLS policies ensure that:

- **Investors** can only see their own data
- **Managers** can see all data for their fund
- **Accountants** can see investor data for their fund
- **Attorneys** can see documents for their fund

All policies are scoped by `fund_id` to ensure proper data isolation between different funds.

## Notes

- Sensitive fields (SSN, bank info) are stored as `_encrypted` and should be encrypted before storage
- All timestamps use `TIMESTAMPTZ` for timezone-aware storage
- Foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- The `updated_at` column is automatically maintained by triggers

## Troubleshooting

If you encounter issues:

1. **Migration fails**: Check that you're running migrations in order
2. **RLS blocking access**: Verify policies are created and user roles are correct
3. **Foreign key errors**: Ensure referenced records exist before creating relationships

