import React, { useMemo, useState, useEffect } from "react";
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

// ----- Default agent (used until API loads) -----
const DEFAULT_ME = {
  id: "",
  name: "",
  photo: "",
  team: "",
  phone: "",
  email: "",
  leads: 0,
  deals: 0,
  activities: 0,
  calls: 0,
  closures: 0,
  tasks: 0,
  missed: 0,
  conv: 0,
  commissionAED: 0,
  commissionPct: 0,
  revenueAED: 0,
  clients: 0,
};

// API client
import {
  getHome,
  getLeads,
  getTasks,
  getCalls,
  getPipeline,
  getEarnings,
  getGoals,
  getReports,
} from "../api";

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
function getRelativeTime(dateString) {
  const target = new Date(dateString);
  const now = new Date();

  const diffMs = target - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, "second");
  } else if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  } else {
    return rtf.format(diffDay, "day");
  }
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
function Home({ me, events }) {
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
            {events && events.length > 0 ? (
              events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between p-2 rounded-xl border"
                  style={{ borderColor: TOKENS.border }}
                >
                  <span>{e.title}</span>
                  <Badge>{getRelativeTime(e.due_date)}</Badge>
                </li>
              ))
            ) : (
              <li
                className="flex items-center justify-between p-2 rounded-xl border"
                style={{ borderColor: TOKENS.border }}
              >
                <span>No events today</span>
              </li>
            )}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function MyLeads({ me, leads }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      (leads || []).filter((l) =>
        Object.values(l || {})
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [q, leads]
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
          <Button variant="outline">
            <a
              href="https://crm.springfieldproperties.ae/crm/lead/details/0/"
              target="_blank"
            >
              Create Lead
            </a>
          </Button>
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
              {(filtered || []).map((l) => (
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
                    <Button variant="ghost">
                      <a
                        href={`https://crm.springfieldproperties.ae/crm/lead/details/${l.id}/`}
                        target="_blank"
                      >
                        View
                      </a>
                    </Button>
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

function Tasks({ items }) {
  items = items || [];
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

function Calls({ list }) {
  list = list || [];
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

function Earnings({ me, earnings }) {
  console.log(earnings);
  const series = [];

  Object.keys(earnings.stats.months).forEach((month) => {
    const formattedMonth = month[0].toUpperCase() + month.slice(1);
    series.push({
      month: formattedMonth,
      payout: earnings.stats.months[month].commission,
      rate: earnings.stats.months[month].conv,
    });
  });
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
            AED {earnings.stats.total.commission.toLocaleString()}
          </div>
          <div className="text-xs mt-1" style={{ color: TOKENS.muted }}>
            Conversion: {earnings.stats.total.conv}%
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

function Goals({ me, goals }) {
  console.log(goals);
  const [leadTarget, setLeadTarget] = useState(goals.stats.leads.total);
  const [dealTarget, setDealTarget] = useState(goals.stats.deals.total);
  const leadPct = goals.stats.leads.conv;
  const dealPct = goals.stats.deals.conv;
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
              {goals.stats.leads.closed} / {leadTarget} ({leadPct}%)
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
              {goals.stats.deals.closed} / {dealTarget} ({dealPct}%)
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
                      { name: "Calls", value: me.calls },
                      { name: "Activities", value: me.activities },
                      { name: "Tasks", value: me.tasks },
                      { name: "Closures", value: me.closures },
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
  const [me, setMe] = useState(DEFAULT_ME);
  const [events, setEvents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [calls, setCalls] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [
          homeRes,
          leadsRes,
          tasksRes,
          callsRes,
          pipelineRes,
          earningsRes,
          goalsRes,
          reportsRes,
        ] = await Promise.all([
          getHome().catch(() => null),
          getLeads().catch(() => []),
          getTasks().catch(() => []),
          getCalls().catch(() => []),
          getPipeline().catch(() => []),
          getEarnings().catch(() => []),
          getGoals().catch(() => []),
          getReports().catch(() => []),
        ]);
        if (!isMounted) return;
        if (homeRes) {
          setMe((prev) => ({ ...prev, ...normalizeAgent(homeRes) }));
          setEvents((prev) => {
            const updated = [...prev, ...homeRes.events];
            console.log("updated events:", updated);
            return updated;
          });
        }
        setLeads(normalizeLeads(leadsRes || []));
        setTasks(normalizeTasks(tasksRes || []));
        setCalls(normalizeCalls(callsRes || []));
        setPipeline(pipelineRes || []);
        setEarnings(earningsRes || []);
        setGoals(goalsRes || []);
        setReports(reportsRes || []);
      } catch (_) {
        // keep defaults silently
        console.error(_);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const Current = useMemo(() => {
    switch (tab) {
      case "home":
        return <Home me={me} events={events} />;
      case "leads":
        return <MyLeads me={me} leads={leads} />;
      case "pipeline":
        return <Pipeline me={me} pipeline={pipeline} />;
      case "tasks":
        return <Tasks items={tasks} />;
      case "calls":
        return <Calls list={calls} />;
      case "earnings":
        return <Earnings me={me} earnings={earnings} />;
      case "goals":
        return <Goals me={me} goals={goals} />;
      case "reports":
        return (
          <Reports
            me={me}
            reports={reports}
            openReportCard={() => setOpenReport(true)}
          />
        );
      case "settings":
        return <SettingsPage />;
      default:
        return <Home me={me} events={events} />;
    }
  }, [
    tab,
    // openReport,
    me,
    leads,
    tasks,
    calls,
    pipeline,
    earnings,
    goals,
    reports,
    events,
  ]);

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
            <Button onClick={() => downloadMyCSV(me)}>
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
      <main className="mx-auto max-w-7xl px-4 py-6">
        {loading ? (
          <div className="w-full flex items-center justify-center py-24">
            <div
              className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-transparent animate-spin"
              style={{ borderTopColor: TOKENS.brand }}
            />
          </div>
        ) : (
          Current
        )}
      </main>
      <footer
        className="py-8 text-center text-xs"
        style={{ color: TOKENS.muted }}
      >
        © {new Date().getFullYear()} Springfield Properties • Agent Dashboard
      </footer>
      {openReport && (
        <AgentReportCard me={me} onClose={() => setOpenReport(false)} />
      )}
    </div>
  );
}

// ----- Normalizers: adapt API responses to the UI shape without changing UI -----
function normalizeAgent(payload) {
  if (!payload) return {};
  const agent = payload.agent || payload;
  const totals = (payload.stats && payload.stats.total) || {};
  return {
    id: agent.id || agent.agentId || DEFAULT_ME.id,
    name: agent.name || agent.fullName || DEFAULT_ME.name,
    photo: agent.photo || agent.avatarUrl || DEFAULT_ME.photo,
    team: agent.team || agent.department || DEFAULT_ME.team,
    phone: agent.phone || agent.mobile || DEFAULT_ME.phone,
    email: agent.email || DEFAULT_ME.email,
    leads: Number(totals.leads ?? agent.leads ?? DEFAULT_ME.leads),
    deals: Number(totals.deals ?? agent.deals ?? DEFAULT_ME.deals),
    activities: Number(
      totals.activities ?? agent.activities ?? DEFAULT_ME.activities
    ),
    calls: Number(totals.calls ?? agent.calls ?? DEFAULT_ME.calls),
    closures: Number(totals.closures ?? agent.closures ?? DEFAULT_ME.closures),
    tasks: Number(totals.tasks ?? agent.tasks ?? DEFAULT_ME.tasks),
    missed: Number(agent.missed ?? DEFAULT_ME.missed),
    conv: Number(
      totals.conv ?? agent.conversion ?? agent.conv ?? DEFAULT_ME.conv
    ),
    commissionAED: Number(
      totals.commission ??
        agent.commissionAED ??
        agent.commission ??
        DEFAULT_ME.commissionAED
    ),
    commissionPct: Number(
      agent.commissionPct ?? agent.commissionRate ?? DEFAULT_ME.commissionPct
    ),
    revenueAED: Number(
      agent.revenueAED ?? agent.revenue ?? DEFAULT_ME.revenueAED
    ),
    clients: Number(agent.clients ?? DEFAULT_ME.clients),
  };
}

function normalizeLeads(data) {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.leads)
    ? data.leads
    : [];
  return arr.map((l, i) => {
    const created = l.created_at || l.createdAt;
    const when = created ? new Date(created).toLocaleString() : "-";
    return {
      id: l.id || l.leadId || `L-${900 + i}`,
      source: l.source || l.channel || "-",
      status: l.status || "New",
      age: l.age || l.createdAgo || when,
      area: l.area || l.location || "-",
      budget: l.budget ? String(l.budget) : l.budgetRange || "-",
    };
  });
}

function normalizeTasks(data) {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.tasks)
    ? data.tasks
    : [];
  return arr.map((t, i) => ({
    id: t.id || t.taskId || `T-${400 + i}`,
    title: t.title || t.name || "",
    due: t.due || t.dueLabel || t.dueDate || t.created_at || "",
    type: t.type || t.category || t.source || "",
  }));
}

function normalizeCalls(data) {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.calls)
    ? data.calls
    : [];
  return arr.map((c, i) => ({
    id: c.id || c.callId || `C-${980 + i}`,
    who: c.who || c.contact || c.customer || c.title || "",
    when: c.when || c.time || c.createdAgo || c.created_at || "",
    notes:
      c.notes || c.summary || (c.duration ? `Duration ${c.duration}s` : ""),
  }));
}
