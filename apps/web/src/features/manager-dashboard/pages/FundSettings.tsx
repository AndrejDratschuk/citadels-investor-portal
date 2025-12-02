import { useState } from 'react';
import {
  Building2,
  Palette,
  CreditCard,
  Users,
  Save,
  Upload,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'accountant' | 'attorney';
}

// Mock data
const mockFund = {
  name: 'FlowVeda Growth Fund I',
  legalName: 'FlowVeda Growth Fund I, LP',
  ein: '**-***1234',
  address: {
    street: '123 Investment Blvd',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
  },
  wireInstructions: 'Bank: First National Bank\nRouting: ****1234\nAccount: ****5678',
  branding: {
    primaryColor: '#4f46e5',
    secondaryColor: '#7c3aed',
  },
};

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Jane Manager', email: 'jane@flowveda.com', role: 'manager' },
  { id: '2', name: 'Bob Accountant', email: 'bob@flowveda.com', role: 'accountant' },
  { id: '3', name: 'Alice Attorney', email: 'alice@lawfirm.com', role: 'attorney' },
];

type TabType = 'profile' | 'branding' | 'banking' | 'team';

export function FundSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showWireDetails, setShowWireDetails] = useState(false);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Fund Profile', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'banking', label: 'Banking', icon: CreditCard },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fund Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your fund profile, branding, and team
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Fund Information</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fundName">Fund Name</Label>
                <Input id="fundName" defaultValue={mockFund.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name</Label>
                <Input id="legalName" defaultValue={mockFund.legalName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ein">EIN</Label>
                <Input id="ein" defaultValue={mockFund.ein} disabled />
                <p className="text-xs text-muted-foreground">
                  Contact support to update tax ID
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Address</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" defaultValue={mockFund.address.street} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" defaultValue={mockFund.address.city} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" defaultValue={mockFund.address.state} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" defaultValue={mockFund.address.zip} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Logo</h3>
            <div className="mt-4 flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Recommended: 200x200px, PNG or SVG
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Colors</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    defaultValue={mockFund.branding.primaryColor}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input
                    defaultValue={mockFund.branding.primaryColor}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    defaultValue={mockFund.branding.secondaryColor}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input
                    defaultValue={mockFund.branding.secondaryColor}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="mt-4 rounded-lg border p-6">
              <div
                className="h-24 rounded-lg"
                style={{
                  background: `linear-gradient(to right, ${mockFund.branding.primaryColor}, ${mockFund.branding.secondaryColor})`,
                }}
              />
              <div className="mt-4 flex items-center gap-4">
                <Button style={{ backgroundColor: mockFund.branding.primaryColor }}>
                  Primary Button
                </Button>
                <Button
                  variant="outline"
                  style={{ borderColor: mockFund.branding.primaryColor, color: mockFund.branding.primaryColor }}
                >
                  Secondary Button
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'banking' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Wire Instructions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWireDetails(!showWireDetails)}
              >
                {showWireDetails ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" /> Show
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4">
              {showWireDetails ? (
                <textarea
                  className="w-full rounded-lg border bg-background p-4 font-mono text-sm"
                  rows={4}
                  defaultValue={mockFund.wireInstructions}
                />
              ) : (
                <div className="rounded-lg bg-muted p-4 text-center text-muted-foreground">
                  Wire details are hidden for security. Click "Show" to view.
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              These instructions will be shown to investors during capital calls.
            </p>
          </div>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>

          <div className="rounded-xl border bg-card divide-y">
            {mockTeam.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                    {member.role}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-muted/50 p-6 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <h4 className="mt-2 font-medium">Role Permissions</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Manager: Full access • Accountant: View + K-1s • Attorney: Documents only
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


