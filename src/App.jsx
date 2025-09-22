import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const now = () => Date.now();
const fmtTime = (d) => new Date(d).toLocaleString();
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const randCode = () =>
  [0, 0, 0, 0]
    .map(() => Math.random().toString(36).toUpperCase().slice(2, 4))
    .join("-");

function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : initialValue;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
}

const Badge = ({ children }) => (
  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
    {children}
  </span>
);

const Pill = ({ tone = "gray", children }) => {
  const tones = {
    gray: "bg-gray-100 text-gray-800 border-gray-200",
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    violet: "bg-violet-100 text-violet-800 border-violet-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${tones[tone]}`}>{children}</span>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl shadow-sm border border-gray-200 bg-white ${className}`}>{children}</div>
);

const SectionTitle = ({ children, right }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold text-gray-800 tracking-wide uppercase">{children}</h3>
    {right}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", ...props }) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-black text-white hover:bg-gray-800",
    ghost: "bg-transparent text-gray-800 hover:bg-gray-100 border border-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    amber: "bg-amber-500 text-white hover:bg-amber-600",
  };
  return (
    <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-10 h-6 rounded-full border relative transition ${
      checked ? "bg-black border-black" : "bg-gray-200 border-gray-300"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition ${
        checked ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </button>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-medium border ${
      active ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
    }`}
  >
    {children}
  </button>
);

const Alert = ({ tone = "amber", title, desc, onClose }) => {
  const tones = {
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    red: "bg-red-50 border-red-200 text-red-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <div className="text-sm font-semibold">{title}</div>
        <div className="ml-auto">
          {onClose && (
            <button className="text-xs underline" onClick={onClose}>
              Dismiss
            </button>
          )}
        </div>
      </div>
      {desc && <div className="text-xs mt-1 opacity-80">{desc}</div>}
    </div>
  );
};

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = (title, desc) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, title, desc }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  const ui = (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((t) => (
        <div key={t.id} className="bg-black text-white rounded-xl px-4 py-3 shadow-lg">
          <div className="text-sm font-semibold">{t.title}</div>
          {t.desc && <div className="text-xs opacity-80">{t.desc}</div>}
        </div>
      ))}
    </div>
  );
  return { add, ui };
}

export default function App() {
  const { add, ui } = useToasts();

  const [user] = useState({ id: "u1", name: "Vishu", email: "vishu@example.com" });

  const [devices, setDevices] = useLocalStorage("bb_devices", [
    {
      id: "d1",
      name: "Hallway Box",
      variant: "cooling",
      online: true,
      status: { locked: true, door_open: false, battery_pct: 82, temp_c: 4 },
      last_seen_at: now(),
      alerts: [],
    },
  ]);
  const [activeDeviceId, setActiveDeviceId] = useLocalStorage("bb_active", "d1");
  const device = devices.find((d) => d.id === activeDeviceId) || devices[0];

  const [codes, setCodes] = useLocalStorage("bb_codes", []);
  const [logs, setLogs] = useLocalStorage("bb_logs", [
    { id: crypto.randomUUID(), type: "system", text: "Device claimed and online", ts: now() - 1000 * 60 * 30 },
  ]);
  const [members, setMembers] = useLocalStorage("bb_members", [
    { id: "m1", name: "Vishu (you)", role: "owner" },
    { id: "m2", name: "Alex", role: "member" },
  ]);

  const [activeTab, setActiveTab] = useLocalStorage("bb_tab", "deliveries");
  const [showQR, setShowQR] = useState(null);

  useEffect(() => {
    const t = setInterval(() => {
      const tNow = now();
      setCodes((xs) => xs.map((c) => (c.expires_at < tNow && !c.used_at ? { ...c, expired: true } : c)));
    }, 1000 * 30);
    return () => clearInterval(t);
  }, [setCodes]);

  useEffect(() => {
    const t = setInterval(() => {
      setDevices((arr) =>
        arr.map((d) => {
          if (!d.online) return d;
          const drain = d.status.temp_c !== null ? 0.2 : 0.05;
          const nextBattery = clamp(d.status.battery_pct - drain, 0, 100);
          let alerts = [...d.alerts];
          if (nextBattery <= 15 && !alerts.includes("low_battery")) alerts.push("low_battery");
          let nextTemp = d.status.temp_c;
          let nextLocked = d.status.locked;
          if (nextBattery <= 5) {
            nextTemp = null;
            if (!d.status.door_open) nextLocked = true;
          }
          return {
            ...d,
            status: { ...d.status, battery_pct: Number(nextBattery.toFixed(1)), temp_c: nextTemp, locked: nextLocked },
            last_seen_at: now(),
            alerts,
          };
        })
      );
    }, 20000);
    return () => clearInterval(t);
  }, [setDevices]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const notify = (title, body) => {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body });
      }
    } catch {}
  };

  const updateDevice = (patch) => {
    setDevices((arr) => arr.map((d) => (d.id === device.id ? { ...d, ...patch } : d)));
  };

  const updateDeviceStatus = (sPatch) => {
    setDevices((arr) =>
      arr.map((d) => (d.id === device.id ? { ...d, status: { ...d.status, ...sPatch }, last_seen_at: now() } : d))
    );
  };

  const addLog = (text, type = "info") => setLogs((l) => [{ id: crypto.randomUUID(), type, text, ts: now() }, ...l]);

  const toggleLock = () => {
    if (!device.online) return add("Cannot toggle lock while device is offline", "warn");
    if (!device.status.locked && device.status.door_open) return add("Close the door before locking", "warn");
    updateDeviceStatus({ locked: !device.status.locked });
    const msg = device.status.locked ? "Unlocked" : "Locked";
    addLog(`${msg} by ${user.name}`, "action");
    add(msg, device.name);
  };

  const toggleCooling = () => {
    if (device.variant !== "cooling") return;
    if (!device.online) return add("Device offline", "warn");
    if (device.status.battery_pct <= 5) return add("Battery too low for cooling", "warn");
    const next = device.status.temp_c === null ? 4 : null;
    updateDeviceStatus({ temp_c: next });
    addLog(`${next === null ? "Cooling off" : "Cooling on to 4°C"} by ${user.name}`, "cooling");
    notify("Cooling updated", next === null ? "Turned off" : "Target 4°C");
    add("Cooling updated", next === null ? "Off" : "4°C");
  };

  const createCode = (hours = 4, note = "") => {
    const code = randCode();
    const tNow = now();
    const obj = { id: crypto.randomUUID(), device_id: device.id, code, expires_at: tNow + hours * 3600 * 1000, note, created_by: user.name };
    setCodes((xs) => [obj, ...xs]);
    addLog(`Access code created (${code}) • Expires in ${hours}h`, "code");
    add("Delivery code ready", code);
    notify("Delivery code created", code);
    return obj;
  };

  const markDelivery = (codeId) => {
    const code = codes.find((c) => c.id === codeId);
    if (!code) return;
    setCodes((xs) => xs.map((c) => (c.id === codeId ? { ...c, used_at: now() } : c)));
    updateDeviceStatus({ locked: false });
    setTimeout(() => {
      updateDeviceStatus({ locked: true });
      addLog(`Delivery completed with code ${code.code} • Photo saved`, "delivery");
      add("Delivery logged", "Box locked");
      notify("Delivery complete", device.name);
    }, 1000);
  };

  const activeCodes = codes.filter((c) => c.device_id === device.id && !c.used_at && !c.expired);
  const completedCodes = codes.filter((c) => c.device_id === device.id && (c.used_at || c.expired));

  const shareCode = async (c) => {
    const text = `BoxBuddy access code ${c.code} for ${device.name}. Expires ${fmtTime(c.expires_at)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "BoxBuddy Code", text });
      } else {
        await navigator.clipboard.writeText(text);
        add("Copied", c.code);
      }
    } catch (e) {}
  };

  const [hours, setHours] = useState(4);
  const [note, setNote] = useState("DHL delivery");
  const [invite, setInvite] = useState("");
  const [showSim, setShowSim] = useState(false);

  const devicePills = (
    <div className="flex items-center gap-2 flex-wrap">
      <Pill tone={device.status.locked ? "green" : "amber"}>{device.status.locked ? "Locked" : "Unlocked"}</Pill>
      <Pill tone={device.status.door_open ? "red" : "green"}>Door {device.status.door_open ? "Open" : "Closed"}</Pill>
      <Pill tone={device.status.battery_pct < 20 ? "red" : "blue"}>{device.status.battery_pct}% Battery</Pill>
      {device.variant === "cooling" && <Pill tone="violet">{device.status.temp_c === null ? "Cooling Off" : `${device.status.temp_c}°C`}</Pill>}
      <Badge>Last seen {Math.round((now() - device.last_seen_at) / 60000)}m ago</Badge>
    </div>
  );

  const offlineBanner = !device.online ? (
    <Alert tone="red" title="Device offline" desc="Actions are disabled until it comes back online." />
  ) : null;
  const doorAjarBanner = device.online && device.status.door_open && (
    <Alert tone="amber" title="Door ajar" desc="Close the door to lock and secure the box." />
  );
  const lowBatteryBanner = device.status.battery_pct <= 15 && (
    <Alert tone="amber" title="Low battery" desc="Connect power soon. Cooling may be limited." />
  );

  const addDevice = (variant) => {
    const id = crypto.randomUUID();
    const name = variant === "shared" ? "Lobby Box" : variant === "cooling" ? "Kitchen Box" : "Porch Box";
    setDevices((arr) => [
      ...arr,
      { id, name, variant, online: true, status: { locked: true, door_open: false, battery_pct: 100, temp_c: variant === "cooling" ? 4 : null }, last_seen_at: now(), alerts: [] },
    ]);
    setActiveDeviceId(id);
    add("Device added", name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {ui}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black text-white grid place-items-center font-bold">B</div>
            <div>
              <div className="font-semibold">BoxBuddy</div>
              <div className="text-xs text-gray-500">Prototype • Local Mock</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={device.id}
              onChange={(e) => setActiveDeviceId(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.variant}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-600">Signed in as <span className="font-medium">{user.name}</span></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {offlineBanner}
        {doorAjarBanner}
        {lowBatteryBanner}

        <Card className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">
                {device.name} <span className="text-gray-400">—</span> <span className="capitalize">{device.variant}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">{devicePills}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={toggleLock} disabled={!device.online}>
                {device.status.locked ? "Unlock" : "Lock"}
              </Button>
              {device.variant === "cooling" && (
                <Button variant="ghost" onClick={toggleCooling} disabled={!device.online || device.status.battery_pct <= 5}>
                  {device.status.temp_c === null ? "Cooling On" : "Cooling Off"}
                </Button>
              )}
              <Button variant="ghost" onClick={() => setActiveTab("deliveries")}>Generate Code</Button>
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <TabButton active={activeTab === "deliveries"} onClick={() => setActiveTab("deliveries")}>Deliveries</TabButton>
          <TabButton active={activeTab === "members"} onClick={() => setActiveTab("members")}>Members</TabButton>
          <TabButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")}>Logs</TabButton>
          <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>Settings</TabButton>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowSim((s) => !s)}>{showSim ? "Hide" : "Show"} Simulator</Button>
          </div>
        </div>

        {activeTab === "deliveries" && (
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="p-4 lg:col-span-1">
              <SectionTitle>Create delivery code</SectionTitle>
              <label className="block text-sm text-gray-700 mb-1">Expiry</label>
              <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full mb-3 border border-gray-200 rounded-xl px-3 py-2">
                {[1, 2, 3, 4, 6, 12, 24].map((h) => (
                  <option key={h} value={h}>{h} hours</option>
                ))}
              </select>
              <label className="block text-sm text-gray-700 mb-1">Note</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full mb-3 border border-gray-200 rounded-xl px-3 py-2" placeholder="e.g., DHL groceries" />
              <Button
                onClick={() => {
                  const obj = createCode(hours, note);
                  setShowQR(obj);
                }}
                className="w-full"
              >
                Create Code
              </Button>
              <p className="text-xs text-gray-500 mt-2">Share the code or QR with the courier. It auto-expires.</p>
            </Card>

            <Card className="p-4 lg:col-span-2">
              <SectionTitle right={<Badge>{activeCodes.length} active</Badge>}>Active codes</SectionTitle>
              {activeCodes.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed rounded-xl p-6 text-center">No active codes. Create one on the left.</div>
              ) : (
                <div className="space-y-2">
                  {activeCodes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2 border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-sm bg-gray-900 text-white rounded-lg px-2 py-1">{c.code}</div>
                        <div className="text-xs text-gray-600">Expires {fmtTime(c.expires_at)}</div>
                        {c.note && <Badge>{c.note}</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => shareCode(c)}>Share</Button>
                        <Button variant="ghost" onClick={() => setShowQR(c)}>Show QR</Button>
                        <Button onClick={() => markDelivery(c.id)}>Simulate Delivery</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <SectionTitle right={<Badge>{completedCodes.length}</Badge>}>Completed / expired</SectionTitle>
              {completedCodes.length === 0 ? (
                <div className="text-sm text-gray-500 border border-dashed rounded-xl p-6 text-center">Nothing here yet.</div>
              ) : (
                <div className="space-y-2">
                  {completedCodes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-sm bg-gray-200 text-gray-800 rounded-lg px-2 py-1">{c.code}</div>
                        <div className="text-xs text-gray-600">{c.used_at ? `Used ${fmtTime(c.used_at)}` : `Expired ${fmtTime(c.expires_at)}`}</div>
                        {c.note && <Badge>{c.note}</Badge>}
                      </div>
                      <div className="text-xs text-gray-500">Archived</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === "members" && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <SectionTitle>Members</SectionTitle>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 grid place-items-center text-xs">{m.name.slice(0, 1)}</div>
                      <div>
                        <div className="text-sm font-medium">{m.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{m.role}</div>
                      </div>
                    </div>
                    {m.role !== "owner" && (
                      <Button variant="ghost" onClick={() => setMembers((xs) => xs.filter((x) => x.id !== m.id))}>Remove</Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <SectionTitle>Invite member</SectionTitle>
              <input value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="email@example.com" className="w-full mb-3 border border-gray-200 rounded-xl px-3 py-2" />
              <Button
                onClick={() => {
                  if (!invite.includes("@")) {
                    add("Invalid email");
                    return;
                  }
                  setMembers((xs) => [...xs, { id: crypto.randomUUID(), name: invite, role: "member" }]);
                  setInvite("");
                  add("Invite sent", "Member added in prototype");
                }}
                className="w-full"
              >
                Send Invite
              </Button>
              <p className="text-xs text-gray-500 mt-2">In production this sends an email with a join link.</p>
            </Card>
          </div>
        )}

        {activeTab === "logs" && (
          <Card className="p-4">
            <SectionTitle>Event log</SectionTitle>
            {logs.length === 0 ? (
              <div className="text-sm text-gray-500 border border-dashed rounded-xl p-6 text-center">No events yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {logs.map((e) => (
                  <div key={e.id} className="py-2 text-sm flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-44">{fmtTime(e.ts)}</span>
                    <span className="flex-1">{e.text}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === "settings" && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <SectionTitle>Devices</SectionTitle>
              <div className="space-y-2">
                {devices.map((d) => (
                  <div key={d.id} className={`flex items-center justify-between border rounded-xl p-3 ${d.id === device.id ? "border-black" : "border-gray-200"}`}>
                    <div>
                      <div className="text-sm font-medium">{d.name} <span className="text-gray-400">—</span> {d.variant}</div>
                      <div className="text-xs text-gray-500">Battery {d.status.battery_pct}% • {d.online ? "Online" : "Offline"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => setActiveDeviceId(d.id)}>Select</Button>
                      {devices.length > 1 && (
                        <Button variant="ghost" onClick={() => setDevices((arr) => arr.filter((x) => x.id !== d.id))}>Remove</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button variant="ghost" onClick={() => addDevice("standard")}>+ Standard</Button>
                <Button variant="ghost" onClick={() => addDevice("shared")}>+ Shared</Button>
                <Button variant="ghost" onClick={() => addDevice("cooling")}>+ Cooling</Button>
              </div>
            </Card>

            <Card className="p-4">
              <SectionTitle>Notifications</SectionTitle>
              <div className="text-sm text-gray-600">Browser notifications are {"Notification" in window ? Notification.permission : "unavailable"}.</div>
              <div className="text-xs text-gray-500 mt-1">Used for delivery and alert updates in the prototype.</div>
              <SectionTitle>Reset prototype</SectionTitle>
              <Button variant="danger" onClick={() => { localStorage.clear(); location.reload(); }}>Reset all data</Button>
            </Card>
          </div>
        )}

        {showSim && (
          <Card className="p-4">
            <SectionTitle>Simulator</SectionTitle>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Online</span>
                  <Toggle checked={device.online} onChange={(v) => updateDevice({ online: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Door open</span>
                  <Toggle checked={device.status.door_open} onChange={(v) => updateDeviceStatus({ door_open: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Battery</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => updateDeviceStatus({ battery_pct: clamp(device.status.battery_pct + 5, 0, 100) })}>+5%</Button>
                    <Button variant="ghost" onClick={() => updateDeviceStatus({ battery_pct: clamp(device.status.battery_pct - 5, 0, 100) })}>-5%</Button>
                  </div>
                </div>
              </div>
              {device.variant === "cooling" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Target temp</span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => updateDeviceStatus({ temp_c: device.status.temp_c === null ? 4 : clamp(device.status.temp_c - 1, 0, 10) })}>-</Button>
                      <div className="font-mono">{device.status.temp_c === null ? "Off" : `${device.status.temp_c}°C`}</div>
                      <Button variant="ghost" onClick={() => updateDeviceStatus({ temp_c: device.status.temp_c === null ? 4 : clamp(device.status.temp_c + 1, 0, 10) })}>+</Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Button variant="amber" onClick={() => addLog("Firmware update available (mock)", "system")}>Simulate firmware notice</Button>
                <Button variant="ghost" onClick={() => addLog("Geofenced courier near box (mock)", "system")}>Simulate courier nearby</Button>
              </div>
            </div>
          </Card>
        )}
      </main>

      {showQR && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-40" onClick={() => setShowQR(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">Share QR</div>
            <div className="text-sm text-gray-600 mb-4">Code: <span className="font-mono">{showQR.code}</span></div>
            <div className="grid place-items-center mb-4">
              <QRCodeCanvas value={showQR.code} size={220} includeMargin />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" onClick={() => navigator.clipboard.writeText(showQR.code).then(() => add("Copied", showQR.code))}>Copy Code</Button>
              <Button variant="ghost" onClick={() => shareCode(showQR)}>Share</Button>
              <Button onClick={() => setShowQR(null)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
