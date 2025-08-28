import React, { useMemo, useState } from "react";
import {
  Download,
  LayoutGrid,
  ListTodo,
  PhoneCall,
  Target,
  Banknote,
  FileBarChart,
  Settings,
  Search,
  MapPin,
  BellRing,
  CalendarClock,
  Award,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Agent Dashboard – Multi‑Tab (Springfield Properties Palette)
 * Tech: React + Tailwind + Recharts + Lucide icons
 * Self‑contained UI (no external component libs). Designed for UAE real‑estate agents.
 */

// ----- Springfield Properties Palette (derived from springfieldproperties.ae and logos) -----
const TOKENS = {
  brand: "#003366", // Dark Blue from Springfield logo text
  brand600: "#002850", // Darker blue for hover states
  brand50: "#E6F0F8", // Very light blue for soft backgrounds
  redAccent: "#EC1D24", // Red from the Springfield logo pin
  text: "#333333", // Dark grey for general text
  muted: "#6B7280", // Standard muted grey for secondary text
  bg: "#F8FAFC", // Light off-white for the main background
  border: "#D1D5DB", // Light grey for borders
  white: "#FFFFFF",
};

// ----- Demo: current agent (replace with live data) -----
const ME = {
  id: "AG-1027",
  name: "Aisha Khan",
  photo: "https://randomuser.me/api/portraits/women/44.jpg",
  team: "Dubai Marina",
  phone: "+971 55 123 4567",
  email: "aisha.khan@vortexweb.ae",
  leads: 142,
  deals: 28,
  activities: 96,
  calls: 238,
  closures: 22,
  tasks: 61,
  missed: 7,
  conv: 19, // %
  commissionAED: 68500,
  commissionPct: 16,
  revenueAED: 268000,
  clients: 49,
};

// ----- Helpers -----
function csvEscape(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}
function downloadMyCSV(agent) {
  const headers = [
    "Agent ID",
    "Agent Name",
    "Team",
    "Leads",
    "Deals",
    "Activities",
    "Calls",
    "Closures",
    "Tasks",
    "Missed Leads",
    "Conversion %",
    "Commission Payout (AED)",
    "Commission %",
    "Revenue (AED)",
    "Clients",
  ];
  const row = [
    agent.id,
    agent.name,
    agent.team,
    agent.leads,
    agent.deals,
    agent.activities,
    agent.calls,
    agent.closures,
    agent.tasks,
    agent.missed,
    agent.conv,
    agent.commissionAED,
    agent.commissionPct,
    agent.revenueAED,
    agent.clients,
  ];
  const csv = [
    headers.map(csvEscape).join(","),
    row.map(csvEscape).join(","),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${agent.name.replace(/\s+/g, "_")}_self_report.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildMonthlySeries(agent) {
  const months = ["Apr", "May", "Jun", "Jul", "Aug"];
  const wL = [0.18, 0.2, 0.22, 0.2, 0.2];
  const wD = [0.16, 0.22, 0.24, 0.18, 0.2];
  const wC = [0.19, 0.2, 0.22, 0.19, 0.2];
  const leads = wL.map((w) => Math.round(agent.leads * w));
  const deals = wD.map((w) => Math.max(1, Math.round(agent.deals * w)));
  const calls = wC.map((w) => Math.round(agent.calls * w));
  return months.map((m, i) => ({
    month: m,
    leads: leads[i],
    deals: deals[i],
    calls: calls[i],
  }));
}
function buildLeadSources(agent) {
  const total = Math.max(1, agent.leads);
  const bayut = Math.round(total * 0.35);
  const dubizzle = Math.round(total * 0.28);
  const meta = Math.round(total * 0.18);
  const referral = Math.round(total * 0.12);
  const website = Math.max(0, total - (bayut + dubizzle + meta + referral));
  return [
    { name: "Bayut", value: bayut },
    { name: "Dubizzle", value: dubizzle },
    { name: "Meta Ads", value: meta },
    { name: "Referral", value: referral },
    { name: "Website", value: website },
  ];
}

// ----- Small UI primitives -----
const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl bg-white border shadow-sm ${className}`}
    style={{ borderColor: TOKENS.border }}
  >
    {children}
  </div>
);
const CardBody = ({ children, className = "" }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);
const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const base =
    "px-3 py-2 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2";
  let style = {};
  let classes = `${base} ${className}`;

  if (variant === "primary") {
    style = { backgroundColor: TOKENS.brand, color: TOKENS.white };
  } else if (variant === "ghost") {
    style = {
      color: TOKENS.brand,
      borderColor: TOKENS.border,
      backgroundColor: "transparent",
    };
    classes += " border";
  } else {
    // outline
    style = {
      backgroundColor: TOKENS.white,
      color: TOKENS.brand,
      borderColor: TOKENS.border,
    };
    classes += " border";
  }
  return (
    <button className={classes} style={style} {...props}>
      {children}
    </button>
  );
};
const Input = (props) => (
  <input
    {...props}
    className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-1"
    style={{ borderColor: TOKENS.border, focusBorderColor: TOKENS.brand }}
  />
);
const Badge = ({ children, color = TOKENS.brand }) => (
  <span
    className="px-2 py-1 text-xs rounded-full"
    style={{ backgroundColor: TOKENS.brand50, color: color }}
  >
    {children}
  </span>
);

// ----- Tabs -----
const TABS = [
  { key: "home", label: "Home", icon: <LayoutGrid size={16} /> },
  { key: "leads", label: "My Leads", icon: <Target size={16} /> },
  { key: "pipeline", label: "Pipeline", icon: <TrendingUp size={16} /> },
  { key: "tasks", label: "Tasks", icon: <ListTodo size={16} /> },
  { key: "calls", label: "Calls", icon: <PhoneCall size={16} /> },
  { key: "earnings", label: "Earnings", icon: <Banknote size={16} /> },
  { key: "goals", label: "Goals", icon: <Award size={16} /> },
  { key: "reports", label: "Reports", icon: <FileBarChart size={16} /> },
  { key: "settings", label: "Settings", icon: <Settings size={16} /> },
];

// ----- Pages -----
function Home({ me }) {
  const monthly = useMemo(() => buildMonthlySeries(me), [me]);
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <CardBody>
          <div className="flex items-center gap-4">
            <img
              src={me.photo}
              alt={me.name}
              className="w-16 h-16 rounded-full object-cover border-2"
              style={{ borderColor: TOKENS.brand }}
            />
            <div>
              <div
                className="text-xl font-semibold"
                style={{ color: TOKENS.text }}
              >
                {me.name}
              </div>
              <div className="text-xs" style={{ color: TOKENS.muted }}>
                {me.team} • {me.id}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Badge>{me.conv}%</Badge>
                <span className="text-xs" style={{ color: TOKENS.muted }}>
                  Conversion
                </span>
              </div>
            </div>
            <div className="flex-1" />
            <div className="hidden md:flex items-center gap-2">
              <Button onClick={() => downloadMyCSV(me)}>
                <Download size={14} className="inline mr-1" />
                Download my CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                Download my PDF
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "Leads", v: me.leads },
              { l: "Deals", v: me.deals },
              { l: "Calls", v: me.calls },
              { l: "Commission (AED)", v: me.commissionAED.toLocaleString() },
            ].map((k) => (
              <div
                key={k.l}
                className="p-3 rounded-xl border"
                style={{ borderColor: TOKENS.border }}
              >
                <div className="text-xs" style={{ color: TOKENS.muted }}>
                  {k.l}
                </div>
                <div className="text-xl font-semibold">{k.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4" style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.border} />
                <XAxis dataKey="month" stroke={TOKENS.muted} />
                <YAxis stroke={TOKENS.muted} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke={TOKENS.brand}
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="deals"
                  stroke={TOKENS.redAccent}
                  strokeWidth={3}
                />{" "}
                {/* Using redAccent for deals */}
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke={TOKENS.brand600}
                  strokeWidth={3}
                />{" "}
                {/* Using darker brand for calls */}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <div className="text-sm font-medium" style={{ color: TOKENS.text }}>
            Today
          </div>
          <ul className="mt-2 text-sm space-y-2">
            <li
              className="flex items-center justify-between p-2 rounded-xl border"
              style={{ borderColor: TOKENS.border }}
            >
              <span>Follow up with Bayut lead L-889</span>
              <Badge color={TOKENS.redAccent}>due 2h</Badge>
            </li>{" "}
            {/* Red accent for urgent badge */}
            <li
              className="flex items-center justify-between p-2 rounded-xl border"
              style={{ borderColor: TOKENS.border }}
            >
              <span>Viewing at Marina Gate</span>
              <Badge>5:30 PM</Badge>
            </li>
            <li
              className="flex items-center justify-between p-2 rounded-xl border"
              style={{ borderColor: TOKENS.border }}
            >
              <span>Call back: Mr. Ali</span>
              <Badge>6:00 PM</Badge>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function MyLeads({ me }) {
  const [q, setQ] = useState("");
  const leads = [
    {
      id: "L-901",
      source: "Bayut",
      status: "New",
      age: "3h",
      area: "Marina",
      budget: "AED 1.2M",
    },
    {
      id: "L-877",
      source: "Meta",
      status: "Contacted",
      age: "9h",
      area: "Downtown",
      budget: "AED 2.4M",
    },
    {
      id: "L-866",
      source: "Website",
      status: "New",
      age: "1d",
      area: "JVC",
      budget: "AED 900k",
    },
  ];
  const filtered = useMemo(
    () =>
      leads.filter((l) =>
        Object.values(l).join(" ").toLowerCase().includes(q.toLowerCase())
      ),
    [q]
  );
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 mb-3">
          <Search size={16} className="text-slate-400" />
          <Input
            placeholder="Search leads, area, budget…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button variant="outline">Create Lead</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: TOKENS.muted }}>
                <th className="py-2 pr-4">Lead</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Area</th>
                <th className="py-2 pr-4">Budget</th>
                <th className="py-2 pr-4">Age</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="border-t"
                  style={{ borderColor: TOKENS.border }}
                >
                  <td className="py-2 pr-4">{l.id}</td>
                  <td className="py-2 pr-4">{l.source}</td>
                  <td className="py-2 pr-4">
                    <Badge>{l.status}</Badge>
                  </td>
                  <td className="py-2 pr-4">{l.area}</td>
                  <td className="py-2 pr-4">{l.budget}</td>
                  <td className="py-2 pr-4">{l.age}</td>
                  <td className="py-2 pr-4">
                    <Button variant="ghost">Open</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function Pipeline({ me }) {
  const funnel = [
    { stage: "Leads", value: me.leads },
    { stage: "Qualified", value: Math.round(me.leads * 0.7) },
    { stage: "Viewings", value: Math.round(me.leads * 0.42) },
    { stage: "Offers", value: Math.round(me.leads * 0.16) },
    { stage: "Closures", value: me.closures },
  ];
  const sources = buildLeadSources(me);
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <CardBody>
          <div
            className="text-sm font-medium mb-2"
            style={{ color: TOKENS.text }}
          >
            My Funnel
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.border} />
                <XAxis dataKey="stage" stroke={TOKENS.muted} />
                <YAxis stroke={TOKENS.muted} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill={TOKENS.brand}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <div
            className="text-sm font-medium mb-2"
            style={{ color: TOKENS.text }}
          >
            Lead Sources
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={45}
                >
                  {sources.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i % 2 === 0 ? TOKENS.brand : TOKENS.redAccent}
                    />
                  ))}{" "}
                  {/* Alternating brand and redAccent */}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Tasks() {
  const items = [
    {
      id: "T-410",
      title: "Send MoU to Mr. Khan",
      due: "Today 5:30 PM",
      type: "Document",
    },
    {
      id: "T-406",
      title: "Schedule viewing – Marina Gate",
      due: "Tomorrow",
      type: "Viewing",
    },
    {
      id: "T-402",
      title: "Follow up – Meta lead L-877",
      due: "Overdue",
      type: "Call",
    },
  ];
  return (
    <Card>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {items.map((t) => (
            <div
              key={t.id}
              className="p-3 rounded-xl border flex items-center justify-between"
              style={{ borderColor: TOKENS.border }}
            >
              <div>
                <div
                  className="text-sm font-medium"
                  style={{ color: TOKENS.text }}
                >
                  {t.title}
                </div>
                <div className="text-xs" style={{ color: TOKENS.muted }}>
                  {t.id} • {t.type}
                </div>
              </div>
              <Badge
                color={t.due === "Overdue" ? TOKENS.redAccent : TOKENS.brand}
              >
                {t.due}
              </Badge>{" "}
              {/* Red accent for overdue tasks */}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function Calls() {
  const list = [
    {
      id: "C-991",
      who: "Mr. Ali",
      when: "Today 14:05",
      notes: "Asked for 2BR in Marina",
    },
    {
      id: "C-987",
      who: "Ms. Sara",
      when: "Today 11:20",
      notes: "Budget AED 1.5M, prefers JVC",
    },
    {
      id: "C-976",
      who: "Mr. Omar",
      when: "Yesterday",
      notes: "Viewing request weekend",
    },
  ];
  return (
    <Card>
      <CardBody>
        <ul className="text-sm space-y-2">
          {list.map((c) => (
            <li
              key={c.id}
              className="p-3 rounded-xl border"
              style={{ borderColor: TOKENS.border }}
            >
              <div className="font-medium" style={{ color: TOKENS.text }}>
                {c.who}{" "}
                <span className="text-xs" style={{ color: TOKENS.muted }}>
                  • {c.when}
                </span>
              </div>
              <div className="text-xs" style={{ color: TOKENS.muted }}>
                {c.notes}
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function Earnings({ me }) {
  const series = [
    { month: "May", payout: 14500 },
    { month: "Jun", payout: 15800 },
    { month: "Jul", payout: 16800 },
    { month: "Aug", payout: 21400 },
  ];
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <CardBody>
          <div
            className="text-sm font-medium mb-2"
            style={{ color: TOKENS.text }}
          >
            Commission Payouts
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke={TOKENS.border} />
                <XAxis dataKey="month" stroke={TOKENS.muted} />
                <YAxis stroke={TOKENS.muted} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="payout"
                  stroke={TOKENS.brand}
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <div className="text-sm font-medium" style={{ color: TOKENS.text }}>
            My Commission
          </div>
          <div className="text-2xl font-semibold">
            AED {me.commissionAED.toLocaleString()}
          </div>
          <div className="text-xs mt-1" style={{ color: TOKENS.muted }}>
            Rate: {me.commissionPct}%
          </div>
          <Button
            variant="outline"
            className="mt-3"
            onClick={() => downloadMyCSV(me)}
          >
            <Download size={14} className="inline mr-1" />
            Download CSV
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

function Goals({ me }) {
  const [leadTarget, setLeadTarget] = useState(180);
  const [dealTarget, setDealTarget] = useState(32);
  const leadPct = Math.min(100, Math.round((me.leads / leadTarget) * 100));
  const dealPct = Math.min(100, Math.round((me.deals / dealTarget) * 100));
  return (
    <Card>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-medium" style={{ color: TOKENS.text }}>
              Leads Target
            </div>
            <div className="mt-2 h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full"
                style={{ width: `${leadPct}%`, backgroundColor: TOKENS.brand }}
              />
            </div>
            <div className="text-xs mt-1" style={{ color: TOKENS.muted }}>
              {me.leads} / {leadTarget} ({leadPct}%)
            </div>
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: TOKENS.text }}>
              Deals Target
            </div>
            <div className="mt-2 h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${dealPct}%`,
                  backgroundColor: TOKENS.redAccent,
                }}
              />{" "}
              {/* Using redAccent for deal target */}
            </div>
            <div className="text-xs mt-1" style={{ color: TOKENS.muted }}>
              {me.deals} / {dealTarget} ({dealPct}%)
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Reports({ me, openReportCard }) {
  const monthly = useMemo(() => buildMonthlySeries(me), [me]);
  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            <img
              src={me.photo}
              alt={me.name}
              className="w-12 h-12 rounded-full object-cover border-2"
              style={{ borderColor: TOKENS.brand }}
            />
            <div>
              <div className="font-semibold" style={{ color: TOKENS.text }}>
                {me.name} — Self Report
              </div>
              <div className="text-xs" style={{ color: TOKENS.muted }}>
                {me.team} • {me.id}
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Button onClick={() => downloadMyCSV(me)}>
                <Download size={14} className="inline mr-1" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                PDF
              </Button>
              <Button variant="ghost" onClick={openReportCard}>
                Open Report Card
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Monthly Trends</div>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={monthly}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={TOKENS.border}
                    />
                    <XAxis dataKey="month" stroke={TOKENS.muted} />
                    <YAxis stroke={TOKENS.muted} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke={TOKENS.brand}
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="deals"
                      stroke={TOKENS.redAccent}
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      stroke={TOKENS.brand600}
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Activity Mix</div>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      { name: "Calls", value: ME.calls },
                      { name: "Activities", value: ME.activities },
                      { name: "Tasks", value: ME.tasks },
                      { name: "Closures", value: ME.closures },
                    ]}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={TOKENS.border}
                    />
                    <XAxis dataKey="name" stroke={TOKENS.muted} />
                    <YAxis stroke={TOKENS.muted} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill={TOKENS.brand}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function SettingsPage() {
  return (
    <Card>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs" style={{ color: TOKENS.muted }}>
              Theme
            </div>
            <div
              className="h-10 rounded-xl border"
              style={{
                backgroundColor: TOKENS.brand,
                borderColor: TOKENS.border,
              }}
            />
          </div>
          <div>
            <div className="text-xs" style={{ color: TOKENS.muted }}>
              Notifications
            </div>
            <ul className="list-disc pl-5 mt-2">
              <li>Missed leads alerts</li>
              <li>Viewing reminders</li>
              <li>Commission updates</li>
            </ul>
          </div>
          <div>
            <div className="text-xs" style={{ color: TOKENS.muted }}>
              Integrations
            </div>
            <ul className="list-disc pl-5 mt-2">
              <li>Bitrix24 CRM</li>
              <li>Zoom / Google Meet</li>
              <li>DocuSign / e‑sign</li>
            </ul>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function AgentReportCard({ me, onClose }) {
  const monthly = useMemo(() => buildMonthlySeries(me), [me]);
  const sources = useMemo(() => buildLeadSources(me), [me]);
  const activity = [
    { name: "Calls", value: me.calls },
    { name: "Activities", value: me.activities },
    { name: "Tasks", value: me.tasks },
    { name: "Closures", value: me.closures },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center print:static print:bg-transparent">
      <div className="bg-white w-[950px] max-h-[90vh] overflow-auto rounded-2xl shadow-2xl print:shadow-none print:rounded-none print:w-auto print:max-h-none">
        <div
          className="p-6 border-b flex items-center justify-between print:border-0"
          style={{ borderColor: TOKENS.border }}
        >
          <div className="flex items-center gap-4">
            <img
              src={me.photo}
              alt={me.name}
              className="w-16 h-16 rounded-full object-cover border-2"
              style={{ borderColor: TOKENS.brand }}
            />
            <div>
              <h2 className="text-2xl font-bold" style={{ color: TOKENS.text }}>
                {me.name} — Report Card
              </h2>
              <div className="text-xs" style={{ color: TOKENS.muted }}>
                {me.team} • {me.id}
              </div>
            </div>
          </div>
          <div className="print:hidden flex items-center gap-2">
            <Button onClick={() => downloadMyCSV(me)}>
              <Download size={14} className="inline mr-1" />
              CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              PDF
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "Leads", v: me.leads },
              { l: "Deals", v: me.deals },
              { l: "Calls", v: me.calls },
              { l: "Conversion", v: me.conv + "%" },
            ].map((k) => (
              <div
                key={k.l}
                className="p-4 rounded-xl border"
                style={{ borderColor: TOKENS.border }}
              >
                <div className="text-xs" style={{ color: TOKENS.muted }}>
                  {k.l}
                </div>
                <div className="text-xl font-semibold">{k.v}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardBody>
                <div className="text-sm font-medium mb-2">Monthly Trends</div>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={monthly}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={TOKENS.border}
                      />
                      <XAxis dataKey="month" stroke={TOKENS.muted} />
                      <YAxis stroke={TOKENS.muted} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="leads"
                        stroke={TOKENS.brand}
                        strokeWidth={3}
                      />
                      <Line
                        type="monotone"
                        dataKey="deals"
                        stroke={TOKENS.redAccent}
                        strokeWidth={3}
                      />
                      <Line
                        type="monotone"
                        dataKey="calls"
                        stroke={TOKENS.brand600}
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-sm font-medium mb-2">Lead Sources</div>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={sources}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        innerRadius={45}
                      >
                        {sources.map((_, i) => (
                          <Cell
                            key={i}
                            fill={i % 2 === 0 ? TOKENS.brand : TOKENS.redAccent}
                          />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Activity Mix */}
          <Card>
            <CardBody>
              <div className="text-sm font-medium mb-2">Activity Mix</div>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={activity}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={TOKENS.border}
                    />
                    <XAxis dataKey="name" stroke={TOKENS.muted} />
                    <YAxis stroke={TOKENS.muted} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill={TOKENS.brand}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Summary */}
          <Card>
            <CardBody>
              <div className="text-sm font-medium mb-2">Summary</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Tasks</span>
                    <span>{me.tasks}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Missed Leads</span>
                    <span>{me.missed}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Clients</span>
                    <span>{me.clients}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Commission Payout</span>
                    <span>AED {me.commissionAED.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Commission %</span>
                    <span>{me.commissionPct}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Revenue</span>
                    <span>AED {me.revenueAED.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div
          className="p-4 text-xs text-slate-500 border-t print:border-0"
          style={{ borderColor: TOKENS.border }}
        >
          Prepared {new Date().toLocaleDateString()} • VortexWeb
        </div>
      </div>
    </div>
  );
}

export default function AgentDashboard() {
  const [tab, setTab] = useState("home");
  const [openReport, setOpenReport] = useState(false);

  const Current = useMemo(() => {
    switch (tab) {
      case "home":
        return <Home me={ME} />;
      case "leads":
        return <MyLeads me={ME} />;
      case "pipeline":
        return <Pipeline me={ME} />;
      case "tasks":
        return <Tasks />;
      case "calls":
        return <Calls />;
      case "earnings":
        return <Earnings me={ME} />;
      case "goals":
        return <Goals me={ME} />;
      case "reports":
        return <Reports me={ME} openReportCard={() => setOpenReport(true)} />;
      case "settings":
        return <SettingsPage />;
      default:
        return <Home me={ME} />;
    }
  }, [tab, openReport]);

  return (
    <div
      className="min-h-screen font-inter"
      style={{ backgroundColor: TOKENS.bg }}
    >
      {" "}
      {/* Added font-inter */}
      {/* Header */}
      <header
        className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b"
        style={{ borderColor: TOKENS.border }}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
              style={{ backgroundColor: TOKENS.brand, color: TOKENS.white }}
            >
              RE
            </div>
            <div>
              <div className="text-sm" style={{ color: TOKENS.muted }}>
                Springfield Properties
              </div>
              <div
                className="text-base font-semibold"
                style={{ color: TOKENS.text }}
              >
                Agent Dashboard
              </div>
            </div>
          </div>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-2.5"
                style={{ color: TOKENS.muted }}
              />
              <Input
                className="pl-8 w-72"
                placeholder="Search my leads, tasks…"
              />
            </div>
            <Button onClick={() => downloadMyCSV(ME)}>
              <Download size={14} className="inline mr-1" />
              My CSV
            </Button>
          </div>
        </div>
      </header>
      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 rounded-xl text-sm border flex items-center gap-2 ${
                tab === t.key ? "font-semibold" : ""
              }`}
              style={{
                borderColor: TOKENS.border,
                backgroundColor: tab === t.key ? TOKENS.brand50 : TOKENS.white,
                color: tab === t.key ? TOKENS.brand : TOKENS.text,
              }}
            >
              <span
                className="shrink-0"
                style={{ color: tab === t.key ? TOKENS.brand : TOKENS.muted }}
              >
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">{Current}</main>
      <footer
        className="py-8 text-center text-xs"
        style={{ color: TOKENS.muted }}
      >
        © {new Date().getFullYear()} Springfield Properties • Agent Dashboard
      </footer>
      {openReport && (
        <AgentReportCard me={ME} onClose={() => setOpenReport(false)} />
      )}
    </div>
  );
}
