import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Plane, Briefcase, Package, Shirt, Footprints, Sparkles, Laptop, FileText, Watch,
  Plus, X, Search, GripVertical, Info, ChevronDown, ChevronLeft, Scale, AlertTriangle,
  Trash2, PackageCheck, Save, FolderOpen, Check, Clock, ArrowRightLeft, Settings2, Home, Cloud, Thermometer, Zap
} from "lucide-react";
import { Landing } from "./Marketing";

/* ---------------------------------------------------------
   DATA
--------------------------------------------------------- */

const CATEGORIES = {
  clothing:    { label: "Clothing",    icon: Shirt,      tip: "Roll soft items instead of folding — it saves roughly a third more space and fights wrinkles." },
  footwear:    { label: "Footwear",    icon: Footprints, tip: "Stuff socks inside shoes and pack shoes sole-to-sole along the edge of the bag." },
  toiletries:  { label: "Toiletries",  icon: Sparkles,   tip: "Decant liquids into travel bottles under 100ml and bag them separately for security lines." },
  electronics: { label: "Electronics", icon: Laptop,     tip: "Coil cables and store them in a pouch — they're heavy, so pack them low and central." },
  documents:   { label: "Documents",   icon: FileText,   tip: "Keep documents in one flat pouch in your personal item, never in checked luggage." },
  accessories: { label: "Accessories", icon: Watch,      tip: "Fill shoes and gaps with small accessories — dead space is wasted capacity." },
};

const PRESETS = [
  { name: "T-shirt", category: "clothing", weight: 150 },
  { name: "Jeans", category: "clothing", weight: 600 },
  { name: "Sweater", category: "clothing", weight: 400 },
  { name: "Dress", category: "clothing", weight: 250 },
  { name: "Shorts", category: "clothing", weight: 200 },
  { name: "Rain jacket", category: "clothing", weight: 700 },
  { name: "Sneakers", category: "footwear", weight: 900 },
  { name: "Sandals", category: "footwear", weight: 300 },
  { name: "Dress shoes", category: "footwear", weight: 800 },
  { name: "Toothbrush + paste", category: "toiletries", weight: 120 },
  { name: "Shampoo bottle", category: "toiletries", weight: 300 },
  { name: "Razor", category: "toiletries", weight: 50 },
  { name: "Deodorant", category: "toiletries", weight: 100 },
  { name: "Phone charger", category: "electronics", weight: 100 },
  { name: "Laptop", category: "electronics", weight: 1800 },
  { name: "Camera", category: "electronics", weight: 500 },
  { name: "Headphones", category: "electronics", weight: 250 },
  { name: "Power bank", category: "electronics", weight: 300 },
  { name: "Passport", category: "documents", weight: 50 },
  { name: "Travel wallet", category: "documents", weight: 100 },
  { name: "Sunglasses", category: "accessories", weight: 100 },
  { name: "Sun hat", category: "accessories", weight: 150 },
  { name: "Belt", category: "accessories", weight: 200 },
];

// Sourced from airline baggage policy pages / travel-baggage guides current as of mid-2026.
// Carry-on and personal-item weights are soft "must lift unaided" guidelines (most NA majors
// don't publish a hard carry-on weight limit); checked-bag weight is the real, enforced limit.
const AIRLINE_PRESETS = {
  us_major: {
    label: "American / Delta / United / Alaska / JetBlue",
    bags: [
      { type: "personal", name: "Personal Item", limit: 5000, note: "≈18×14×8 in · fits under the seat" },
      { type: "carryon",  name: "Carry-on",      limit: 10000, note: "22×14×9 in incl. wheels & handles · no fixed weight limit, must lift unaided" },
      { type: "checked",  name: "Checked Bag",   limit: 22680, note: "62 linear in · 50 lb / 23 kg hard limit" },
    ],
  },
  southwest: {
    label: "Southwest",
    bags: [
      { type: "personal", name: "Personal Item", limit: 5000, note: "≈18×14×8 in · fits under the seat" },
      { type: "carryon",  name: "Carry-on",      limit: 10000, note: "24×16×10 in incl. wheels & handles · roomiest US carry-on" },
      { type: "checked",  name: "Checked Bag",   limit: 22680, note: "62 linear in · 50 lb / 23 kg hard limit" },
    ],
  },
  air_canada: {
    label: "Air Canada",
    bags: [
      { type: "personal", name: "Personal Item", limit: 5000, note: "≈43×33×16 cm · fits under the seat" },
      { type: "carryon",  name: "Carry-on",      limit: 10000, note: "55×40×23 cm (21.5×15.5×9 in) · keep under 10 kg to avoid gate issues" },
      { type: "checked",  name: "Checked Bag",   limit: 22680, note: "158 cm linear · 50 lb / 23 kg hard limit" },
    ],
  },
  westjet: {
    label: "WestJet",
    bags: [
      { type: "personal", name: "Personal Item", limit: 5000, note: "41×33×14 cm · fits under the seat" },
      { type: "carryon",  name: "Carry-on",      limit: 10000, note: "53×38×23 cm (21×15×9 in) · no fixed weight limit" },
      { type: "checked",  name: "Checked Bag",   limit: 22680, note: "158 cm linear · 50 lb / 23 kg hard limit" },
    ],
  },
  custom: {
    label: "Custom / other airline",
    bags: [
      { type: "personal", name: "Personal Item", limit: 5000, note: "Set your own limit" },
      { type: "carryon",  name: "Carry-on",      limit: 10000, note: "Set your own limit" },
      { type: "checked",  name: "Checked Bag",   limit: 22680, note: "Set your own limit" },
    ],
  },
};

let uid = 1;
const nextId = () => `item-${uid++}`;
const STORAGE_KEY = "packright:trips";
const SAVED_BAGS_KEY = "packright:saved-bags";

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function gToUnit(g, unit) { return unit === "lb" ? g / 453.592 : g / 1000; }
function unitToG(v, unit) { return unit === "lb" ? v * 453.592 : v * 1000; }
function fmtWeight(grams, unit) {
  return unit === "lb" ? gToUnit(grams, unit).toFixed(1) + " lb" : gToUnit(grams, unit).toFixed(2) + " kg";
}
function bumpUidFromIds(ids) {
  let max = 0;
  ids.forEach((id) => {
    const m = String(id).match(/(\d+)(?!.*\d)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  if (max + 1 > uid) uid = max + 1;
}
function freshBagsFromPreset(key) {
  const preset = AIRLINE_PRESETS[key];
  return preset.bags.map((b) => ({
    id: `bag-${nextId()}`, name: b.name, limit: b.limit, parentId: null, type: b.type,
  }));
}

async function fetchWeather(lat, lon) {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`
    );
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Weather fetch failed:", e);
    return null;
  }
}

function getPackingRecommendations(weatherData) {
  if (!weatherData) return [];

  const dailyData = weatherData.daily;
  const tempMax = Math.max(...dailyData.temperature_2m_max);
  const tempMin = Math.min(...dailyData.temperature_2m_min);
  const hasRain = dailyData.precipitation_sum.some((p) => p > 0.1);

  const recommendations = [];

  if (tempMax > 25) {
    recommendations.push({ name: "Shorts", category: "clothing" });
    recommendations.push({ name: "T-shirt", category: "clothing" });
    recommendations.push({ name: "Sandals", category: "footwear" });
    recommendations.push({ name: "Sun hat", category: "accessories" });
    recommendations.push({ name: "Sunglasses", category: "accessories" });
  } else if (tempMax > 15) {
    recommendations.push({ name: "Jeans", category: "clothing" });
    recommendations.push({ name: "T-shirt", category: "clothing" });
    recommendations.push({ name: "Sweater", category: "clothing" });
    recommendations.push({ name: "Sneakers", category: "footwear" });
  } else {
    recommendations.push({ name: "Jeans", category: "clothing" });
    recommendations.push({ name: "Sweater", category: "clothing" });
    recommendations.push({ name: "Dress shoes", category: "footwear" });
  }

  if (hasRain) {
    recommendations.push({ name: "Rain jacket", category: "clothing" });
  }

  return recommendations;
}

async function geocodeDestination(destination) {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return { lat: result.latitude, lon: result.longitude };
    }
    return null;
  } catch (e) {
    console.error("Geocoding failed:", e);
    return null;
  }
}

/* ---------------------------------------------------------
   GAUGE DIAL
--------------------------------------------------------- */

function WeightDial({ weight, limit, unit, sm }) {
  const pct = limit > 0 ? (weight / limit) * 100 : 0;
  const clamped = Math.min(pct, 100);
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);
  const over = pct > 100;

  return (
    <div className={`dial-wrap ${sm ? "dial-sm" : ""}`}>
      <svg viewBox="0 0 100 100" className="dial-svg">
        <circle cx="50" cy="50" r={r} className="dial-track" />
        <circle
          cx="50" cy="50" r={r}
          className={`dial-fill ${over ? "dial-fill-over" : ""}`}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <div className="dial-center">
        <span className="dial-pct">{Math.round(pct)}%</span>
        <span className="dial-sub">{fmtWeight(weight, unit)}</span>
      </div>
      {over && <div className="dial-warn" title="Over limit"><AlertTriangle size={sm ? 10 : 12} /></div>}
    </div>
  );
}

/* ---------------------------------------------------------
   ITEM TAG (draggable card)
--------------------------------------------------------- */

function ItemTag({ item, unit, destinations, onDragStart, onMove, onQty, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = CATEGORIES[item.category].icon;

  return (
    <div className="tag" draggable onDragStart={(e) => onDragStart(e, item.id)}>
      <div className="tag-grip"><GripVertical size={14} /></div>
      <div className="tag-icon"><Icon size={15} /></div>
      <div className="tag-body">
        <span className="tag-name">{item.name}</span>
        <span className="tag-meta">{fmtWeight(item.weight * item.qty, unit)}{item.qty > 1 ? ` · ×${item.qty}` : ""}</span>
      </div>
      <div className="tag-controls">
        <div className="tag-qty">
          <button className="qty-btn" onClick={() => onQty(item.id, -1)} aria-label="Decrease quantity">−</button>
          <span>{item.qty}</span>
          <button className="qty-btn" onClick={() => onQty(item.id, 1)} aria-label="Increase quantity">+</button>
        </div>
        <div className="tag-menu-wrap">
          <button className="tag-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Move item">
            <ArrowRightLeft size={13} /> <span className="tag-menu-btn-label">Move</span>
          </button>
          {menuOpen && (
            <div className="tag-menu" onMouseLeave={() => setMenuOpen(false)}>
              {item.location !== "unpacked" && (
                <button onClick={() => { onMove(item.id, "unpacked"); setMenuOpen(false); }}>Move to Unpacked</button>
              )}
              {destinations.filter((d) => d.id !== item.location).map((d) => (
                <button key={d.id} onClick={() => { onMove(item.id, d.id); setMenuOpen(false); }}>Move to {d.label}</button>
              ))}
              <button className="danger" onClick={() => { onDelete(item.id); setMenuOpen(false); }}>
                <Trash2 size={12} /> Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   BAG CARD (top-level bag, with nested pouches)
--------------------------------------------------------- */

function BagCard({
  bag, pouches, items, unit, weightOf, destinations, dragOverZone, setDragOverZone,
  handleDrop, handleDragStart, moveItem, qtyChange, deleteItem,
  renameBag, relimitBag, removeBag, addPouch,
}) {
  const bagItems = items.filter((i) => i.location === bag.id);

  return (
    <div className="bag-card">
      <div className="bag-card-top">
        <div className="bag-icon"><Briefcase size={20} /></div>
        <div className="bag-card-titles">
          <input className="bag-name-input" value={bag.name} onChange={(e) => renameBag(bag.id, e.target.value)} />
          <div className="bag-limit-row">
            <Scale size={11} /> Limit
            <input
              className="bag-limit-input" type="number"
              value={gToUnit(bag.limit, unit).toFixed(1)}
              onChange={(e) => relimitBag(bag.id, unitToG(Number(e.target.value) || 0, unit))}
            /> {unit}
          </div>
        </div>
        <button className="icon-btn" onClick={() => removeBag(bag.id)} title="Remove bag" aria-label="Remove bag"><X size={16} /></button>
      </div>
      <div className="bag-body">
        <WeightDial weight={weightOf(bag.id)} limit={bag.limit} unit={unit} />
        <div className="bag-items">
          <div
            className={`drop-zone ${dragOverZone === bag.id ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverZone(bag.id); }}
            onDragLeave={() => setDragOverZone(null)}
            onDrop={(e) => handleDrop(e, bag.id)}
          >
            {bagItems.length === 0 && pouches.length === 0 && <div className="empty-hint">Drag items here to pack this bag.</div>}
            {bagItems.map((item) => (
              <ItemTag key={item.id} item={item} unit={unit} destinations={destinations}
                onDragStart={handleDragStart} onMove={moveItem} onQty={qtyChange} onDelete={deleteItem} />
            ))}
          </div>

          {pouches.map((pouch) => {
            const pouchItems = items.filter((i) => i.location === pouch.id);
            return (
              <div key={pouch.id} className="pouch-card">
                <div className="pouch-top">
                  <Package size={14} className="pouch-icon" />
                  <input className="pouch-name-input" value={pouch.name} onChange={(e) => renameBag(pouch.id, e.target.value)} />
                  <span className="pouch-limit">
                    <input
                      className="pouch-limit-input" type="number"
                      value={gToUnit(pouch.limit, unit).toFixed(1)}
                      onChange={(e) => relimitBag(pouch.id, unitToG(Number(e.target.value) || 0, unit))}
                    /> {unit}
                  </span>
                  <WeightDial weight={weightOf(pouch.id)} limit={pouch.limit} unit={unit} sm />
                  <button className="icon-btn" onClick={() => removeBag(pouch.id)} title="Remove pouch" aria-label="Remove pouch"><X size={14} /></button>
                </div>
                <div
                  className={`drop-zone pouch-zone ${dragOverZone === pouch.id ? "drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverZone(pouch.id); }}
                  onDragLeave={() => setDragOverZone(null)}
                  onDrop={(e) => handleDrop(e, pouch.id)}
                >
                  {pouchItems.length === 0 && <div className="empty-hint small">Drag items into {pouch.name.toLowerCase()}.</div>}
                  {pouchItems.map((item) => (
                    <ItemTag key={item.id} item={item} unit={unit} destinations={destinations}
                      onDragStart={handleDragStart} onMove={moveItem} onQty={qtyChange} onDelete={deleteItem} />
                  ))}
                </div>
              </div>
            );
          })}

          <button className="add-pouch-btn" onClick={() => addPouch(bag.id)}>
            <Plus size={12} /> Add a pouch inside {bag.name.toLowerCase()} (dopp kit, cables…)
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */

export default function PackRight() {
  const [view, setView] = useState("landing"); // landing | index | config | organize | select-bags | guided

  const [tripName, setTripName] = useState("New trip");
  const [unit, setUnit] = useState("kg");
  const [airlineKey, setAirlineKey] = useState("us_major");
  const [bags, setBags] = useState(() => freshBagsFromPreset("us_major"));
  const [items, setItems] = useState([]);
  const [currentTripId, setCurrentTripId] = useState(null);

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [dragOverZone, setDragOverZone] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "clothing", weight: 200, qty: 1 });
  const dragItemId = useRef(null);

  const [savedTrips, setSavedTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsPanelOpen, setTripsPanelOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [tripsError, setTripsError] = useState(null);

  const [savedBags, setSavedBags] = useState([]);
  const [bagsLoading, setBagsLoading] = useState(true);
  const [bagNameInput, setBagNameInput] = useState("");
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [guidedStep, setGuidedStep] = useState("name"); // name | dates | destination | review
  const [guideStartDate, setGuideStartDate] = useState("");
  const [guideEndDate, setGuideEndDate] = useState("");
  const [guideDestination, setGuideDestination] = useState("");
  const [guideLat, setGuideLat] = useState(null);
  const [guideLon, setGuideLon] = useState(null);
  const [guideWeather, setGuideWeather] = useState(null);
  const [guideRecommendations, setGuideRecommendations] = useState([]);
  const [guideLoadingWeather, setGuideLoadingWeather] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      setSavedTrips(Array.isArray(list) ? list : []);
    } catch (e) {
      setSavedTrips([]);
    } finally {
      setTripsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_BAGS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      setSavedBags(Array.isArray(list) ? list : []);
    } catch (e) {
      setSavedBags([]);
    } finally {
      setBagsLoading(false);
    }
  }, []);

  /* ---- derived ---- */

  const topBags = bags.filter((b) => !b.parentId);
  const pouchesOf = (bagId) => bags.filter((b) => b.parentId === bagId);

  const ownWeight = (bagId) => items.filter((i) => i.location === bagId).reduce((s, i) => s + i.weight * i.qty, 0);
  const weightOf = (bagId) => ownWeight(bagId) + pouchesOf(bagId).reduce((s, p) => s + ownWeight(p.id), 0);

  const destinations = useMemo(() => {
    const list = [];
    topBags.forEach((tb) => {
      list.push({ id: tb.id, label: tb.name });
      pouchesOf(tb.id).forEach((p) => list.push({ id: p.id, label: `↳ ${p.name} (in ${tb.name})` }));
    });
    return list;
  }, [bags]);

  const unpacked = useMemo(
    () => items.filter((i) => i.location === "unpacked" &&
      (activeCat === "all" || i.category === activeCat) &&
      i.name.toLowerCase().includes(search.toLowerCase())),
    [items, activeCat, search]
  );

  const totalItems = items.length;
  const packedItems = items.filter((i) => i.location !== "unpacked").length;
  const presentCats = useMemo(() => {
    const set = new Set(items.filter((i) => i.location !== "unpacked").map((i) => i.category));
    return [...set];
  }, [items]);

  /* ---- item actions ---- */

  const moveItem = (id, location) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, location } : i)));
  const qtyChange = (id, delta) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)));
  const deleteItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const handleDragStart = (e, id) => { dragItemId.current = id; e.dataTransfer.effectAllowed = "move"; };
  const handleDrop = (e, zone) => {
    e.preventDefault();
    setDragOverZone(null);
    if (dragItemId.current) moveItem(dragItemId.current, zone);
    dragItemId.current = null;
  };

  const addCustomItem = () => {
    if (!newItem.name.trim()) return;
    setItems((prev) => [...prev, { id: nextId(), name: newItem.name.trim(), category: newItem.category, weight: Number(newItem.weight) || 0, qty: Number(newItem.qty) || 1, location: "unpacked" }]);
    setNewItem({ name: "", category: newItem.category, weight: 200, qty: 1 });
    setAddOpen(false);
  };
  const addPreset = (p) => setItems((prev) => [...prev, { id: nextId(), ...p, qty: 1, location: "unpacked" }]);
  const availablePresets = PRESETS.filter((p) => !items.some((i) => i.name === p.name && i.location === "unpacked"));

  /* ---- bag actions ---- */

  const renameBag = (id, name) => setBags((prev) => prev.map((b) => (b.id === id ? { ...b, name } : b)));
  const relimitBag = (id, limit) => setBags((prev) => prev.map((b) => (b.id === id ? { ...b, limit } : b)));
  const addTopBag = () => setBags((prev) => [...prev, { id: `bag-${nextId()}`, name: "Extra bag", limit: unitToG(23, "kg"), parentId: null, type: "checked" }]);
  const addPouch = (parentId) => setBags((prev) => [...prev, { id: `bag-${nextId()}`, name: "New pouch", limit: 1500, parentId, type: "pouch" }]);
  const removeBag = (id) => {
    const childIds = bags.filter((b) => b.parentId === id).map((b) => b.id);
    const allIds = [id, ...childIds];
    setItems((prev) => prev.map((i) => (allIds.includes(i.location) ? { ...i, location: "unpacked" } : i)));
    setBags((prev) => prev.filter((b) => !allIds.includes(b.id)));
  };
  const applyAirlinePreset = (key) => {
    setAirlineKey(key);
    setItems((prev) => prev.map((i) => ({ ...i, location: "unpacked" })));
    setBags(freshBagsFromPreset(key));
  };

  /* ---- trip / navigation actions ---- */

  const startNewTrip = () => {
    setTripName("New trip");
    setUnit("kg");
    setAirlineKey("us_major");
    setBags(freshBagsFromPreset("us_major"));
    setItems([]);
    setCurrentTripId(null);
    setTripsPanelOpen(false);
    setBagNameInput("");
    setSaveMessage("");
    setSaveAsOpen(false);
    setGuidedStep("name");
    setGuideStartDate("");
    setGuideEndDate("");
    setGuideDestination("");
    setGuideLat(null);
    setGuideLon(null);
    setGuideWeather(null);
    setGuideRecommendations([]);
    setView("guided");
  };

  const persistTrips = async (list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setSavedTrips(list);
      return true;
    } catch (e) {
      setTripsError("Couldn't save right now — your browser storage may be full or blocked.");
      return false;
    }
  };

  const saveTrip = async () => {
    setSaveStatus("saving");
    setTripsError(null);
    const record = { id: currentTripId || `trip-${Date.now()}`, tripName, unit, airlineKey, bags, items, savedAt: new Date().toISOString() };
    const existingIdx = savedTrips.findIndex((t) => t.id === record.id);
    const nextList = existingIdx >= 0 ? savedTrips.map((t, i) => (i === existingIdx ? record : t)) : [record, ...savedTrips];
    const ok = await persistTrips(nextList);
    if (ok) {
      setCurrentTripId(record.id);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else setSaveStatus("error");
  };

  const openTrip = (trip) => {
    bumpUidFromIds([...trip.items.map((i) => i.id), ...trip.bags.map((b) => b.id)]);
    setTripName(trip.tripName);
    setUnit(trip.unit || "kg");
    setAirlineKey(trip.airlineKey || "custom");
    setBags(trip.bags);
    setItems(trip.items);
    setCurrentTripId(trip.id);
    setTripsPanelOpen(false);
    setView("organize");
  };

  const deleteTrip = async (id) => {
    const nextList = savedTrips.filter((t) => t.id !== id);
    await persistTrips(nextList);
    if (currentTripId === id) setCurrentTripId(null);
  };

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
    catch { return ""; }
  };

  const persistSavedBags = async (list) => {
    try {
      localStorage.setItem(SAVED_BAGS_KEY, JSON.stringify(list));
      setSavedBags(list);
      return true;
    } catch (e) {
      return false;
    }
  };

  const saveBagConfiguration = async (name) => {
    if (!name.trim()) return false;
    const record = { id: `bagset-${Date.now()}`, name: name.trim(), bags, savedAt: new Date().toISOString() };
    const nextList = [record, ...savedBags];
    return await persistSavedBags(nextList);
  };

  const deleteSavedBags = async (id) => {
    const nextList = savedBags.filter((b) => b.id !== id);
    await persistSavedBags(nextList);
  };

  const loadSavedBagConfiguration = (bagSet) => {
    bumpUidFromIds(bagSet.bags.map((b) => b.id));
    setBags(bagSet.bags);
    setView("config");
  };

  /* ---------------------------------------------------------
     SHARED STYLES — monochrome (black / white / grey) system
  --------------------------------------------------------- */

  const GlobalStyle = () => (
    <style>{`
      :root {
        --ink: #141414;
        --ink-soft: #666666;
        --ink-faint: #9a9a9a;
        --line: #dcdcdc;
        --line-strong: #b0b0b0;
        --bg: #ffffff;
        --bg-soft: #f6f6f6;
        --bg-muted: #ebebeb;
        --black: #0d0d0d;
        --black-2: #242424;
        --white: #ffffff;
        --white-soft: #b8b8b8;
      }
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      .app { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--ink); min-height: 100vh; overflow-x: hidden; }
      .app :is(h1,h2,h3) { font-family: 'Oswald', 'Arial Narrow', sans-serif; letter-spacing: 0.03em; margin: 0; }
      .mono { font-family: 'IBM Plex Mono', monospace; }
      button, input, select, textarea { font-family: inherit; color: inherit; }
      button { cursor: pointer; }
      input, select { background: var(--white); color: var(--ink); border: 1.5px solid var(--line); }
      button:focus-visible, input:focus-visible, select:focus-visible, [tabindex]:focus-visible {
        outline: 2px solid var(--ink); outline-offset: 2px;
      }
      img, svg { display: block; }

      /* ---- small icon buttons (touch-friendly, min 32px target) ---- */
      .icon-btn {
        border: none; background: transparent; color: var(--ink-soft); cursor: pointer;
        min-width: 32px; min-height: 32px; display: flex; align-items: center; justify-content: center;
        border-radius: 6px; flex-shrink: 0;
      }
      .icon-btn:hover { color: var(--ink); background: var(--bg-muted); }

      /* ---- header ---- */
      .header {
        background: var(--black); color: var(--white); padding: 18px 24px; display: flex; align-items: center;
        justify-content: space-between; flex-wrap: wrap; gap: 14px; position: relative;
      }
      .header-left { display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1 1 auto; }
      .plane-badge {
        width: 42px; height: 42px; border-radius: 50%; background: var(--white); color: var(--black);
        display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: none; cursor: pointer;
      }
      .plane-badge:hover { background: var(--bg-muted); }
      .header h1 { font-size: 22px; text-transform: uppercase; }
      .trip-input {
        background: transparent !important; border: none !important; color: var(--white) !important;
        font-family: 'Oswald', sans-serif; font-size: 20px; text-transform: uppercase;
        border-bottom: 1px dashed rgba(255,255,255,0.4) !important; padding: 2px; width: 100%; max-width: 320px;
      }
      .trip-input:focus { border-bottom-color: var(--white) !important; outline: none; }
      .header-sub { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--white-soft); margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .header-sub button { background: none; border: none; color: var(--white-soft); text-decoration: underline; cursor: pointer; font-size: 11px; padding: 0; display: inline-flex; align-items: center; gap: 3px; }
      .header-sub button:hover { color: var(--white); }
      .header-right { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
      .header-stats { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
      .stat { text-align: right; }
      .stat-num { font-family: 'IBM Plex Mono', monospace; font-size: 18px; display: block; color: var(--white); }
      .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--white-soft); }
      .unit-toggle { display: flex; border: 1.5px solid var(--white-soft); border-radius: 6px; overflow: hidden; }
      .unit-toggle button { background: transparent !important; color: var(--white) !important; border: none !important; padding: 6px 10px; font-size: 11px; letter-spacing: 0.06em; cursor: pointer; font-family: 'IBM Plex Mono', monospace; min-height: 30px; }
      .unit-toggle button.active { background: var(--white) !important; color: var(--black) !important; font-weight: 700; }

      .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .hbtn {
        display: flex; align-items: center; gap: 6px; border: 1.5px solid var(--white-soft) !important; background: transparent !important;
        color: var(--white) !important; border-radius: 6px; padding: 8px 12px; font-size: 12.5px; cursor: pointer; font-weight: 500; min-height: 36px;
      }
      .hbtn:hover { background: var(--black-2) !important; border-color: var(--white) !important; }
      .hbtn.primary { background: var(--white) !important; color: var(--black) !important; border-color: var(--white) !important; }
      .hbtn.primary:hover { background: var(--bg-muted) !important; }
      .hbtn.saved { background: var(--white) !important; color: var(--black) !important; border-color: var(--white) !important; }

      /* ---- trips dropdown panel ---- */
      .trips-panel {
        position: absolute; right: 16px; left: 16px; top: 100%; margin-top: 8px; max-width: 340px; margin-left: auto;
        background: var(--white); border: 1.5px solid var(--line); border-radius: 10px;
        box-shadow: 0 14px 30px rgba(0,0,0,0.22); z-index: 50; overflow: hidden;
      }
      .trips-panel-head { padding: 12px 14px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; }
      .trips-panel-head b { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink); }
      .trips-panel-body { max-height: 320px; overflow-y: auto; }
      .trip-row { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--line); }
      .trip-row:hover { background: var(--bg-soft); }
      .trip-row-main { flex: 1; min-width: 0; cursor: pointer; }
      .trip-row-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ink); }
      .trip-row-meta { font-size: 11px; color: var(--ink-soft); display: flex; align-items: center; gap: 4px; margin-top: 2px; flex-wrap: wrap; }
      .trips-empty { padding: 20px 14px; font-size: 12.5px; color: var(--ink-soft); text-align: center; }
      .trips-new-btn { width: 100%; text-align: left; padding: 11px 14px; border: none; background: var(--bg-soft); font-size: 12.5px; cursor: pointer; color: var(--ink); font-weight: 500; }
      .trips-new-btn:hover { background: var(--bg-muted); }
      .trips-error { padding: 10px 14px; font-size: 12px; color: var(--ink); background: var(--bg-muted); border-left: 3px solid var(--black); }

      /* ---- layout ---- */
      .layout { display: grid; grid-template-columns: 320px 1fr; gap: 0; align-items: start; position: relative; }
      @media (max-width: 880px) {
        .layout { grid-template-columns: 1fr; }
        .side-panel { min-height: auto !important; border-right: none !important; border-bottom: 1px solid var(--line); }
      }
      .panel { padding: 20px; }
      .side-panel { border-right: 1px solid var(--line); min-height: calc(100vh - 88px); background: var(--bg-soft); }

      .search-row { display: flex; gap: 8px; margin-bottom: 12px; }
      .search-box { flex: 1; position: relative; min-width: 0; }
      .search-box input { width: 100%; padding: 9px 10px 9px 32px; border-radius: 6px; font-size: 13px; min-height: 38px; }
      .search-box input:focus { outline: none; border-color: var(--ink); }
      .search-box svg { position: absolute; left: 9px; top: 11px; color: var(--ink-soft); pointer-events: none; }
      .add-btn { background: var(--black); color: var(--white); border: none; border-radius: 6px; padding: 0 14px; display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; font-weight: 500; min-height: 38px; flex-shrink: 0; }
      .add-btn:hover { background: var(--black-2); }

      .cat-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
      .cat-tab { border: 1.5px solid var(--line); background: var(--white); border-radius: 20px; padding: 6px 11px; font-size: 12px; display: flex; align-items: center; gap: 5px; cursor: pointer; color: var(--ink-soft); font-weight: 500; min-height: 30px; }
      .cat-tab:hover { border-color: var(--ink-faint); color: var(--ink); }
      .cat-tab.active { background: var(--black); color: var(--white); border-color: var(--black); }

      .add-form { background: var(--white); border: 1.5px solid var(--line-strong); border-radius: 8px; padding: 12px; margin-bottom: 14px; }
      .add-form-row { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
      .add-form input, .add-form select { border-radius: 5px; padding: 7px 8px; font-size: 12.5px; min-height: 34px; }
      .add-form input:focus, .add-form select:focus { outline: none; border-color: var(--ink); }
      .add-form .name-field { flex: 1; min-width: 120px; }
      .add-form-actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
      .btn-primary { background: var(--black); color: var(--white); border: none; border-radius: 5px; padding: 8px 14px; font-size: 12.5px; cursor: pointer; font-weight: 500; min-height: 34px; }
      .btn-primary:hover { background: var(--black-2); }
      .btn-ghost { background: transparent; border: 1.5px solid var(--line); border-radius: 5px; padding: 8px 14px; font-size: 12.5px; cursor: pointer; color: var(--ink-soft); min-height: 34px; }
      .btn-ghost:hover { border-color: var(--ink-soft); color: var(--ink); }

      .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-soft); margin: 14px 0 8px; font-weight: 600; }

      .drop-zone { min-height: 90px; border-radius: 8px; padding: 8px; transition: background 0.15s, box-shadow 0.15s; }
      .drop-zone.pouch-zone { min-height: 46px; padding: 6px; }
      .drop-zone.drag-over { background: var(--bg-muted); box-shadow: inset 0 0 0 2px var(--ink-faint); }
      .empty-hint { font-size: 12.5px; color: var(--ink-soft); padding: 12px 8px; border: 1.5px dashed var(--line); border-radius: 8px; text-align: center; }
      .empty-hint.small { font-size: 11px; padding: 8px; }

      .tag {
        display: flex; flex-wrap: wrap; row-gap: 8px; align-items: center; gap: 8px; background: var(--white);
        border: 1.5px solid var(--line); border-left: 4px solid var(--ink); border-radius: 6px;
        padding: 9px 9px 9px 7px; margin-bottom: 8px; cursor: grab; position: relative; transition: box-shadow 0.12s, border-color 0.12s;
      }
      .tag:hover { border-color: var(--ink-faint); box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
      .tag:active { cursor: grabbing; }
      .tag-grip { color: var(--line-strong); flex-shrink: 0; }
      .tag-icon { color: var(--ink); flex-shrink: 0; }
      .tag-body { display: flex; flex-direction: column; flex: 1 1 120px; min-width: 110px; }
      .tag-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ink); }
      .tag-meta { font-size: 10.5px; color: var(--ink-soft); font-family: 'IBM Plex Mono', monospace; }
      .tag-controls { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
      .tag-qty { display: flex; align-items: center; gap: 5px; font-size: 12px; font-family: 'IBM Plex Mono', monospace; }
      .qty-btn { width: 26px; height: 26px; border: 1.5px solid var(--line); background: var(--bg-soft); border-radius: 4px; cursor: pointer; font-size: 14px; line-height: 1; color: var(--ink); display: flex; align-items: center; justify-content: center; }
      .qty-btn:hover { border-color: var(--ink); background: var(--bg-muted); }
      .tag-menu-wrap { position: relative; }
      .tag-menu-btn { border: 1.5px solid var(--line); background: var(--bg-soft); cursor: pointer; color: var(--ink-soft); padding: 6px 10px; border-radius: 5px; font-size: 11px; display: flex; align-items: center; gap: 4px; white-space: nowrap; min-height: 30px; }
      .tag-menu-btn:hover { border-color: var(--ink); color: var(--ink); }
      .tag-menu {
        position: absolute; right: 0; top: 34px; background: var(--white); border: 1.5px solid var(--line-strong); border-radius: 6px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.18); z-index: 20; min-width: 180px; max-width: 240px; overflow: hidden; max-height: 260px; overflow-y: auto;
      }
      .tag-menu button { display: flex; align-items: center; gap: 6px; width: 100%; text-align: left; border: none; background: var(--white); padding: 10px 11px; font-size: 12px; cursor: pointer; color: var(--ink); min-height: 38px; }
      .tag-menu button:hover { background: var(--bg-soft); }
      .tag-menu button.danger { color: var(--ink); font-weight: 600; border-top: 1px solid var(--line); }

      .preset-chip { display: inline-flex; align-items: center; gap: 5px; border: 1.5px dashed var(--line-strong); background: var(--white); border-radius: 20px; padding: 6px 10px; font-size: 11.5px; margin: 0 6px 6px 0; cursor: pointer; color: var(--ink-soft); font-weight: 500; min-height: 30px; }
      .preset-chip:hover { border-style: solid; border-color: var(--ink); color: var(--ink); background: var(--bg-muted); }

      .main-panel { padding: 20px 24px; min-width: 0; }
      .bags-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .bags-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 16px; }

      .bag-card { background: var(--white); border: 1.5px solid var(--line); border-radius: 10px; overflow: hidden; box-shadow: 0 2px 0 var(--line); min-width: 0; }
      .bag-card-top { display: flex; align-items: flex-start; gap: 10px; padding: 14px 14px 10px; border-bottom: 1px solid var(--line); }
      .bag-icon { color: var(--ink); flex-shrink: 0; margin-top: 2px; }
      .bag-card-titles { flex: 1; min-width: 0; }
      .bag-name-input { border: none; background: transparent; font-family: 'Oswald', sans-serif; font-size: 16px; text-transform: uppercase; letter-spacing: 0.02em; width: 100%; color: var(--ink); padding: 2px 0; border-bottom: 1px solid transparent; }
      .bag-name-input:focus { border-bottom: 1px dashed var(--ink); outline: none; }
      .bag-limit-row { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--ink-soft); margin-top: 4px; flex-wrap: wrap; }
      .bag-limit-input { width: 55px; border-radius: 4px; padding: 4px 5px; font-size: 11.5px; font-family: 'IBM Plex Mono', monospace; min-height: 26px; }
      .bag-limit-input:focus { outline: none; border-color: var(--ink); }
      .bag-body { display: flex; gap: 14px; padding: 14px; }
      @media (max-width: 520px) {
        .bag-body { flex-direction: column; align-items: center; }
        .bag-items { width: 100%; }
      }
      .bag-items { flex: 1; min-width: 0; }

      .pouch-card { background: var(--bg-soft); border: 1.5px dashed var(--line-strong); border-radius: 8px; padding: 8px; margin: 10px 0; }
      .pouch-top { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; flex-wrap: wrap; }
      .pouch-icon { color: var(--ink-soft); flex-shrink: 0; }
      .pouch-name-input { flex: 1 1 90px; min-width: 70px; border: none; background: transparent; font-size: 12.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--ink); }
      .pouch-name-input:focus { outline: none; }
      .pouch-limit { display: flex; align-items: center; gap: 3px; font-size: 10.5px; color: var(--ink-soft); }
      .pouch-limit-input { width: 40px; border-radius: 4px; padding: 3px; font-size: 10.5px; font-family: 'IBM Plex Mono', monospace; min-height: 22px; }
      .add-pouch-btn { display: flex; align-items: center; gap: 5px; width: 100%; justify-content: center; border: 1.5px dashed var(--line); background: transparent; border-radius: 6px; padding: 9px; font-size: 11px; color: var(--ink-soft); cursor: pointer; margin-top: 6px; min-height: 36px; text-align: center; }
      .add-pouch-btn:hover { border-color: var(--ink-faint); color: var(--ink); background: var(--bg-soft); }

      .add-bag-card { border: 2px dashed var(--line-strong); border-radius: 10px; display: flex; align-items: center; justify-content: center; min-height: 140px; cursor: pointer; color: var(--ink-soft); font-size: 13px; background: transparent; flex-direction: column; gap: 6px; font-weight: 500; }
      .add-bag-card:hover { border-color: var(--ink); color: var(--ink); background: var(--bg-soft); }

      .dial-wrap { position: relative; flex-shrink: 0; width: 84px; height: 84px; }
      .dial-wrap.dial-sm { width: 46px; height: 46px; }
      .dial-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
      .dial-track { fill: none; stroke: var(--bg-muted); stroke-width: 8; }
      .dial-fill { fill: none; stroke: var(--ink); stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 0.3s ease; }
      .dial-fill-over { stroke: var(--black); stroke-width: 10; }
      .dial-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .dial-pct { font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 15px; color: var(--ink); }
      .dial-sm .dial-pct { font-size: 11px; }
      .dial-sub { color: var(--ink-soft); font-family: 'IBM Plex Mono', monospace; font-size: 9px; }
      .dial-sm .dial-sub { font-size: 7.5px; }
      .dial-warn { position: absolute; top: -3px; right: -3px; background: var(--black); color: var(--white); border-radius: 50%; padding: 3px; display: flex; }

      .tips-dock { margin-top: 18px; }
      .tips-card { background: var(--black); color: var(--white); border-radius: 8px; padding: 12px 14px; display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; border-left: 4px solid var(--white-soft); }
      .tips-card svg { flex-shrink: 0; margin-top: 2px; color: var(--white-soft); }
      .tips-card b { text-transform: uppercase; font-size: 11px; letter-spacing: 0.06em; color: var(--white-soft); display: block; margin-bottom: 2px; }
      .tips-card p { margin: 0; font-size: 12.5px; line-height: 1.4; color: var(--white); }

      .progress-bar-outer { height: 6px; background: rgba(255,255,255,0.22); border-radius: 4px; overflow: hidden; width: clamp(90px, 30vw, 140px); }
      .progress-bar-outer.on-light { background: var(--bg-muted); }
      .progress-bar-inner { height: 100%; background: var(--white); transition: width 0.3s ease; }
      .progress-bar-inner.on-light { background: var(--black); }

      @media (max-width: 640px) {
        .header { flex-direction: column; align-items: stretch; padding: 16px; }
        .header-right { flex-direction: column; align-items: stretch; width: 100%; }
        .header-stats { justify-content: space-between; width: 100%; }
        .header-actions { width: 100%; }
        .header-actions .hbtn { flex: 1; justify-content: center; }
        .trips-panel { left: 16px; right: 16px; max-width: none; }
      }

      /* ---- index page ---- */
      .index-wrap { max-width: 920px; margin: 0 auto; padding: 40px 20px; }
      .index-hero { text-align: center; margin-bottom: 30px; }
      .index-hero .plane-badge { margin: 0 auto 14px; width: 54px; height: 54px; cursor: default; }
      .index-hero h1 { font-size: 28px; text-transform: uppercase; letter-spacing: 0.04em; }
      .index-hero p { color: var(--ink-soft); font-size: 14px; margin-top: 8px; }
      .index-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(230px, 100%), 1fr)); gap: 14px; }
      .trip-card { background: var(--white); border: 1.5px solid var(--line); border-radius: 10px; padding: 16px; cursor: pointer; box-shadow: 0 2px 0 var(--line); transition: transform 0.1s, box-shadow 0.1s, border-color 0.1s; min-width: 0; }
      .trip-card:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(0,0,0,0.12); border-color: var(--ink); }
      .trip-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
      .trip-card h3 { font-size: 15px; text-transform: uppercase; overflow-wrap: anywhere; }
      .trip-card-meta { font-size: 11.5px; color: var(--ink-soft); margin-top: 6px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
      .trip-card-progress { margin-top: 12px; }
      .new-trip-card { border: none; border-radius: 10px; padding: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; color: var(--white); min-height: 110px; background: var(--black); font-weight: 600; }
      .new-trip-card:hover { background: var(--black-2); }
      .index-loading, .index-empty { text-align: center; color: var(--ink-soft); font-size: 13px; padding: 20px; }

      /* ---- config wizard ---- */
      .wizard-wrap { max-width: 760px; margin: 0 auto; padding: 30px 20px 60px; }
      .wizard-back { display: flex; align-items: center; gap: 5px; background: none; border: none; color: var(--ink-soft); font-size: 12.5px; cursor: pointer; margin-bottom: 18px; padding: 6px 0; }
      .wizard-back:hover { color: var(--ink); }
      .wizard-title { font-size: 22px; text-transform: uppercase; margin-bottom: 4px; }
      .wizard-sub { color: var(--ink-soft); font-size: 13.5px; margin-bottom: 24px; line-height: 1.5; }
      .wizard-tripname { font-family: 'Oswald', sans-serif; font-size: 19px; text-transform: uppercase; border: none !important; border-bottom: 2px dashed var(--line-strong) !important; background: transparent !important; width: 100%; padding: 8px 2px; margin-bottom: 26px; color: var(--ink) !important; }
      .wizard-tripname:focus { border-bottom-color: var(--ink) !important; outline: none; }
      .wizard-section-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-soft); font-weight: 700; margin-bottom: 10px; }
      .airline-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr)); gap: 10px; margin-bottom: 28px; }
      .airline-card { border: 2px solid var(--line); background: var(--white); border-radius: 8px; padding: 12px; cursor: pointer; text-align: left; min-height: 64px; }
      .airline-card:hover { border-color: var(--ink-faint); }
      .airline-card.active { border-color: var(--black); background: var(--black); color: var(--white); }
      .airline-card-name { font-size: 12.5px; font-weight: 700; line-height: 1.3; }
      .airline-card-sub { font-size: 10.5px; color: var(--ink-soft); margin-top: 4px; }
      .airline-card.active .airline-card-sub { color: var(--white-soft); }

      .config-bag-row { background: var(--white); border: 1.5px solid var(--line); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
      .config-bag-row-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .config-bag-name { flex: 1 1 140px; min-width: 100px; border: none !important; background: transparent !important; font-family: 'Oswald', sans-serif; font-size: 15px; text-transform: uppercase; color: var(--ink) !important; border-bottom: 1px solid transparent !important; padding: 4px 0; }
      .config-bag-name:focus { border-bottom: 1px dashed var(--ink) !important; outline: none; }
      .config-bag-limit { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink-soft); }
      .config-bag-limit input { width: 60px; border-radius: 5px; padding: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; min-height: 32px; }
      .config-bag-note { font-size: 11px; color: var(--ink-soft); margin-top: 6px; padding-left: 2px; }
      .config-pouch-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; margin-left: 14px; padding: 8px 10px; background: var(--bg-soft); border: 1.5px dashed var(--line-strong); border-radius: 6px; flex-wrap: wrap; }
      .config-pouch-row .pname { flex: 1 1 90px; min-width: 70px; border: none !important; background: transparent !important; font-size: 12.5px; font-weight: 600; color: var(--ink) !important; }
      .config-pouch-row .pname:focus { outline: none; }
      .config-pouch-row input[type=number] { width: 50px; border-radius: 4px; padding: 4px; font-size: 11px; font-family: 'IBM Plex Mono', monospace; min-height: 28px; }
      .config-add-pouch { font-size: 11.5px; color: var(--ink-soft); background: none; border: none; cursor: pointer; margin-top: 8px; margin-left: 14px; text-decoration: underline; padding: 4px 0; }
      .config-add-pouch:hover { color: var(--ink); }
      .config-add-bag { width: 100%; border: 2px dashed var(--line-strong); border-radius: 8px; padding: 12px; background: transparent; color: var(--ink-soft); font-size: 12.5px; cursor: pointer; margin-top: 4px; font-weight: 500; min-height: 44px; }
      .config-add-bag:hover { border-color: var(--ink-faint); color: var(--ink); }
      .wizard-cta-row { margin-top: 30px; display: flex; justify-content: flex-end; }
      .wizard-cta { background: var(--black); color: var(--white); border: none; border-radius: 8px; padding: 14px 26px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; justify-content: center; transition: background 0.12s, transform 0.05s; }
      .wizard-cta:hover { background: var(--black-2); }
      .wizard-cta:active { transform: translateY(1px); }
      @media (min-width: 480px) { .wizard-cta { width: auto; } }

      /* ---- bag select cards ---- */
      .bags-select-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr)); gap: 12px; margin-bottom: 24px; }
      .bag-select-card { border: 1.5px solid var(--line); background: var(--white); border-radius: 8px; padding: 14px; box-shadow: 0 2px 0 var(--line); }
      .bag-select-card:hover { border-color: var(--ink-faint); box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
      .bag-select-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
      .bag-select-top h3 { font-size: 14px; margin: 0; font-weight: 600; text-transform: uppercase; flex: 1; min-width: 0; overflow-wrap: break-word; }
      .bag-select-meta { font-size: 11px; color: var(--ink-soft); display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    `}</style>
  );

  /* ---------------------------------------------------------
     SELECT BAGS VIEW
  --------------------------------------------------------- */

  if (view === "select-bags") {
    const handleSaveAsTemplate = async () => {
      if (!bagNameInput.trim()) return;
      const ok = await saveBagConfiguration(bagNameInput);
      if (ok) {
        setSaveMessage("✓ Bag configuration saved!");
        setBagNameInput("");
        setSaveAsOpen(false);
        setTimeout(() => setSaveMessage(""), 2000);
      }
    };

    return (
      <div className="app">
        <GlobalStyle />
        <div className="wizard-wrap">
          <button className="wizard-back" onClick={() => setView("index")}>
            <ChevronLeft size={15} /> Back to trips
          </button>
          <h1 className="wizard-title">Your Packing Blueprints</h1>
          <p className="wizard-sub">Start by selecting a saved bag configuration or create a new one from scratch. You can always adjust your bags before packing.</p>

          <div className="wizard-section-label">Saved Configurations</div>
          {bagsLoading && <div style={{ textAlign: "center", color: "var(--ink-soft)", padding: "20px", fontSize: 13 }}>Loading saved bags…</div>}
          {!bagsLoading && savedBags.length === 0 && <div style={{ textAlign: "center", color: "var(--ink-soft)", padding: "20px", fontSize: 13 }}>No saved bag configurations yet. Create one below!</div>}
          {!bagsLoading && savedBags.length > 0 && (
            <div className="bags-select-grid">
              {savedBags.map((bagSet) => (
                <div key={bagSet.id} className="bag-select-card">
                  <div className="bag-select-top">
                    <h3>{bagSet.name}</h3>
                    <button className="icon-btn" onClick={() => deleteSavedBags(bagSet.id)} title="Delete" aria-label="Delete"><X size={15} /></button>
                  </div>
                  <div className="bag-select-meta">
                    <Clock size={11} /> {fmtDate(bagSet.savedAt)}
                    <span style={{ marginLeft: "8px" }}>· {bagSet.bags.filter((b) => !b.parentId).length} bags</span>
                  </div>
                  <button className="btn-primary" style={{ width: "100%", marginTop: "12px" }} onClick={() => loadSavedBagConfiguration(bagSet)}>
                    Use this setup
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="wizard-section-label" style={{ marginTop: "28px" }}>Start Fresh</div>
          <div className="airline-grid">
            {Object.entries(AIRLINE_PRESETS).map(([key, p]) => (
              <button key={key} className={`airline-card ${airlineKey === key ? "active" : ""}`} onClick={() => { setAirlineKey(key); applyAirlinePreset(key); setView("config"); }}>
                <div className="airline-card-name">{p.label}</div>
                <div className="airline-card-sub">Checked bag: 50 lb / 23 kg</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------
     GUIDED PACKING EXPERIENCE
  --------------------------------------------------------- */

  if (view === "guided") {
    const handleGuidedNext = async () => {
      if (guidedStep === "name") {
        if (!tripName.trim()) return;
        setGuidedStep("dates");
      } else if (guidedStep === "dates") {
        if (!guideStartDate || !guideEndDate) return;
        setGuidedStep("destination");
      } else if (guidedStep === "destination") {
        if (!guideDestination.trim()) return;
        setGuidedStep("loading");
        setGuideLoadingWeather(true);
        const coords = await geocodeDestination(guideDestination);
        if (coords) {
          setGuideLat(coords.lat);
          setGuideLon(coords.lon);
          const weather = await fetchWeather(coords.lat, coords.lon);
          setGuideWeather(weather);
          if (weather) {
            const recs = getPackingRecommendations(weather);
            setGuideRecommendations(recs);
          }
        }
        setGuideLoadingWeather(false);
        setGuidedStep("review");
      } else if (guidedStep === "review") {
        setView("select-bags");
      }
    };

    const handleGuidedBack = () => {
      if (guidedStep === "dates") setGuidedStep("name");
      else if (guidedStep === "destination") setGuidedStep("dates");
      else if (guidedStep === "review") setGuidedStep("destination");
      else setView("index");
    };

    return (
      <div className="app">
        <GlobalStyle />
        <div className="wizard-wrap">
          <button className="wizard-back" onClick={handleGuidedBack}>
            <ChevronLeft size={15} /> {guidedStep === "name" ? "Back to trips" : "Back"}
          </button>

          {guidedStep === "name" && (
            <>
              <h1 className="wizard-title">Where are you going?</h1>
              <p className="wizard-sub">Let's plan your perfect trip. Start by naming your journey.</p>
              <input
                className="wizard-tripname"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g., Paris Spring Break, Beach Weekend"
                autoFocus
              />
              <div style={{ marginTop: "32px" }}>
                <button className="wizard-cta" onClick={handleGuidedNext} disabled={!tripName.trim()}>
                  Continue <ArrowRightLeft size={15} />
                </button>
              </div>
            </>
          )}

          {guidedStep === "dates" && (
            <>
              <h1 className="wizard-title">When are you traveling?</h1>
              <p className="wizard-sub">Knowing your travel dates helps us recommend the right clothes for the weather.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: "6px" }}>Start date</label>
                  <input type="date" value={guideStartDate} onChange={(e) => setGuideStartDate(e.target.value)} style={{ width: "100%", borderRadius: "6px", padding: "10px", fontSize: "14px", minHeight: "38px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: "6px" }}>End date</label>
                  <input type="date" value={guideEndDate} onChange={(e) => setGuideEndDate(e.target.value)} style={{ width: "100%", borderRadius: "6px", padding: "10px", fontSize: "14px", minHeight: "38px" }} />
                </div>
              </div>
              <div style={{ marginTop: "28px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={handleGuidedBack}>Back</button>
                <button className="wizard-cta" onClick={handleGuidedNext} disabled={!guideStartDate || !guideEndDate}>
                  Continue <ArrowRightLeft size={15} />
                </button>
              </div>
            </>
          )}

          {guidedStep === "destination" && (
            <>
              <h1 className="wizard-title">Where exactly?</h1>
              <p className="wizard-sub">Tell us your destination so we can check the weather forecast and recommend appropriate clothing.</p>
              <input
                type="text"
                placeholder="City, country (e.g., Barcelona, Spain)"
                value={guideDestination}
                onChange={(e) => setGuideDestination(e.target.value)}
                style={{ width: "100%", borderRadius: "6px", padding: "12px 14px", fontSize: "14px", border: "1.5px solid var(--line)", marginTop: "20px", minHeight: "40px" }}
                autoFocus
              />
              <div style={{ marginTop: "28px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={handleGuidedBack}>Back</button>
                <button className="wizard-cta" onClick={handleGuidedNext} disabled={!guideDestination.trim()}>
                  Check weather <Cloud size={15} />
                </button>
              </div>
            </>
          )}

          {guidedStep === "review" && (
            <>
              <h1 className="wizard-title">Your Trip at a Glance</h1>
              <p className="wizard-sub">Based on the weather forecast, here are items we recommend packing.</p>

              <div style={{ background: "var(--bg-soft)", borderRadius: "8px", padding: "20px", marginTop: "24px", marginBottom: "24px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: "4px" }}>Trip</div>
                  <div style={{ fontSize: "18px", fontWeight: "600" }}>{tripName}</div>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: "4px" }}>Destination</div>
                  <div style={{ fontSize: "16px", fontWeight: "500" }}>{guideDestination}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: "4px" }}>Duration</div>
                  <div style={{ fontSize: "14px" }}>{guideStartDate} to {guideEndDate}</div>
                </div>
              </div>

              {guideWeather && (
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", marginBottom: "12px" }}>
                    <div className="wizard-section-label" style={{ margin: 0 }}>Weather forecast</div>
                    <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "var(--ink-soft)", textDecoration: "underline", cursor: "pointer" }}>via Open-Meteo</a>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))", gap: "12px" }}>
                    {guideWeather.daily.time.slice(0, 7).map((date, i) => (
                      <div key={date} style={{ background: "var(--white)", border: "1.5px solid var(--line)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: "11px", color: "var(--ink-soft)", marginBottom: "6px" }}>{new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                        <Thermometer size={16} style={{ color: "var(--ink-soft)", margin: "6px auto" }} />
                        <div style={{ fontSize: "14px", fontWeight: "600" }}>{Math.round(guideWeather.daily.temperature_2m_max[i])}°</div>
                        <div style={{ fontSize: "11px", color: "var(--ink-soft)" }}>{Math.round(guideWeather.daily.temperature_2m_min[i])}°</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--ink-soft)", marginTop: "12px", marginBottom: 0 }}>Weather data provided by <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink-soft)", textDecoration: "underline", cursor: "pointer" }}>Open-Meteo</a>. Always verify with your destination's official weather service for accuracy.</p>
                </div>
              )}

              {guideRecommendations.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <div className="wizard-section-label">Recommended items</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {guideRecommendations.map((item) => (
                      <span key={item.name} style={{ background: "var(--black)", color: "var(--white)", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }}>
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: "28px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={handleGuidedBack}>Back</button>
                <button className="wizard-cta" onClick={handleGuidedNext}>
                  Let's Pack <ArrowRightLeft size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------
     LANDING PAGE
  --------------------------------------------------------- */

  if (view === "landing") {
    return <Landing setView={setView} />;
  }

  /* ---------------------------------------------------------
     INDEX VIEW
  --------------------------------------------------------- */

  if (view === "index") {
    return (
      <div className="app">
        <GlobalStyle />
        <div className="index-wrap">
          <div className="index-hero">
            <div className="plane-badge"><Plane size={24} /></div>
            <h1>PackRight</h1>
            <p>Your trips, your bags, packed right — every time.</p>
            <div style={{ marginTop: "24px" }}>
              <button className="btn-primary" onClick={() => setView("landing")} style={{ marginRight: "8px" }}>Learn More</button>
            </div>
          </div>

          <div className="index-grid">
            <div className="new-trip-card" onClick={startNewTrip}>
              <Plus size={24} />
              New Trip
            </div>

            {tripsLoading && <div className="index-loading" style={{ gridColumn: "1 / -1" }}>Loading your trips…</div>}

            {!tripsLoading && savedTrips.map((t) => {
              const packed = t.items.filter((i) => i.location !== "unpacked").length;
              return (
                <div className="trip-card" key={t.id} onClick={() => openTrip(t)}>
                  <div className="trip-card-top">
                    <h3>{t.tripName}</h3>
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); deleteTrip(t.id); }} title="Delete trip" aria-label="Delete trip">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="trip-card-meta"><Clock size={11} /> {fmtDate(t.savedAt)}</div>
                  <div className="trip-card-meta"><Briefcase size={11} /> {t.bags.filter((b) => !b.parentId).length} bags · {AIRLINE_PRESETS[t.airlineKey]?.label || "Custom"}</div>
                  <div className="trip-card-progress">
                    <div className="progress-bar-outer on-light" style={{ width: "100%" }}>
                      <div className="progress-bar-inner on-light" style={{ width: t.items.length ? `${(packed / t.items.length) * 100}%` : "0%" }} />
                    </div>
                    <div className="trip-card-meta" style={{ marginTop: 5 }}>{packed}/{t.items.length} packed</div>
                  </div>
                </div>
              );
            })}
          </div>

          {!tripsLoading && savedTrips.length === 0 && (
            <div className="index-empty">No trips yet — start your first one above.</div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------
     CONFIG VIEW (the wizard — set up bags before packing)
  --------------------------------------------------------- */

  if (view === "config") {
    const handleSaveAsTemplate = async () => {
      if (!bagNameInput.trim()) return;
      const ok = await saveBagConfiguration(bagNameInput);
      if (ok) {
        setSaveMessage("✓ Bag configuration saved!");
        setBagNameInput("");
        setSaveAsOpen(false);
        setTimeout(() => setSaveMessage(""), 2000);
      }
    };

    return (
      <div className="app">
        <GlobalStyle />
        <div className="wizard-wrap">
          <button className="wizard-back" onClick={() => setView(currentTripId ? "organize" : "select-bags")}>
            <ChevronLeft size={15} /> {currentTripId ? "Back to packing" : "Back"}
          </button>
          <h1 className="wizard-title">Set up your bags</h1>
          <p className="wizard-sub">Pick your airline to load current baggage limits, then adjust anything to fit your actual bags. You can add pouches — like a dopp kit or cables pouch — inside any bag.</p>

          {saveMessage && <div style={{ background: "var(--black)", color: "var(--white)", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px", textAlign: "center" }}>{saveMessage}</div>}
          {saveAsOpen && (
            <div style={{ background: "var(--bg-soft)", border: "1.5px solid var(--line)", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "var(--ink-soft)", marginBottom: "10px", marginTop: 0 }}>Save this configuration as a template for future trips</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="e.g., Weekend getaway, Beach trip"
                  value={bagNameInput}
                  onChange={(e) => setBagNameInput(e.target.value)}
                  style={{ flex: 1, borderRadius: "5px", padding: "8px 10px", fontSize: "12.5px" }}
                />
                <button className="btn-primary" onClick={handleSaveAsTemplate}>Save</button>
                <button className="btn-ghost" onClick={() => { setSaveAsOpen(false); setBagNameInput(""); }}>Cancel</button>
              </div>
            </div>
          )}
          {!saveAsOpen && <button className="btn-ghost" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }} onClick={() => setSaveAsOpen(true)}><Save size={13} /> Save this setup as template</button>}

          <input className="wizard-tripname" value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="Name this trip" />

          <div className="wizard-section-label">Airline</div>
          <div className="airline-grid">
            {Object.entries(AIRLINE_PRESETS).map(([key, p]) => (
              <button key={key} className={`airline-card ${airlineKey === key ? "active" : ""}`} onClick={() => applyAirlinePreset(key)}>
                <div className="airline-card-name">{p.label}</div>
                <div className="airline-card-sub">Checked bag: 50 lb / 23 kg</div>
              </button>
            ))}
          </div>

          <div className="wizard-section-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span>Bags for this trip</span>
            <span className="unit-toggle" style={{ borderColor: "var(--line-strong)" }}>
              <button className={unit === "kg" ? "active" : ""} onClick={() => setUnit("kg")} style={{ color: unit === "kg" ? "var(--white)" : "var(--ink-soft)", background: unit === "kg" ? "var(--black)" : "transparent" }}>KG</button>
              <button className={unit === "lb" ? "active" : ""} onClick={() => setUnit("lb")} style={{ color: unit === "lb" ? "var(--white)" : "var(--ink-soft)", background: unit === "lb" ? "var(--black)" : "transparent" }}>LB</button>
            </span>
          </div>

          {topBags.map((bag) => {
            const preset = AIRLINE_PRESETS[airlineKey];
            const note = preset?.bags.find((b) => b.type === bag.type)?.note;
            return (
              <div key={bag.id} className="config-bag-row">
                <div className="config-bag-row-top">
                  <input className="config-bag-name" value={bag.name} onChange={(e) => renameBag(bag.id, e.target.value)} />
                  <div className="config-bag-limit">
                    <Scale size={13} />
                    <input type="number" value={gToUnit(bag.limit, unit).toFixed(1)} onChange={(e) => relimitBag(bag.id, unitToG(Number(e.target.value) || 0, unit))} />
                    {unit}
                  </div>
                  <button className="icon-btn" onClick={() => removeBag(bag.id)} title="Remove bag" aria-label="Remove bag"><X size={16} /></button>
                </div>
                {note && <div className="config-bag-note">{note}</div>}

                {pouchesOf(bag.id).map((pouch) => (
                  <div key={pouch.id} className="config-pouch-row">
                    <Package size={13} className="pouch-icon" />
                    <input className="pname" value={pouch.name} onChange={(e) => renameBag(pouch.id, e.target.value)} />
                    <input type="number" value={gToUnit(pouch.limit, unit).toFixed(1)} onChange={(e) => relimitBag(pouch.id, unitToG(Number(e.target.value) || 0, unit))} />
                    <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{unit}</span>
                    <button className="icon-btn" onClick={() => removeBag(pouch.id)} title="Remove pouch" aria-label="Remove pouch"><X size={13} /></button>
                  </div>
                ))}
                <button className="config-add-pouch" onClick={() => addPouch(bag.id)}>+ Add a pouch inside this bag</button>
              </div>
            );
          })}

          <button className="config-add-bag" onClick={addTopBag}><Plus size={13} style={{ verticalAlign: -2 }} /> Add another bag (e.g. second checked bag)</button>

          <div className="wizard-cta-row">
            <button className="wizard-cta" onClick={() => setView("organize")}>
              Continue to packing <ArrowRightLeft size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------
     ORGANIZE VIEW (drag & drop packing)
  --------------------------------------------------------- */

  return (
    <div className="app">
      <GlobalStyle />

      <div className="header">
        <div className="header-left">
          <button className="plane-badge" onClick={() => setView("index")} title="All trips" aria-label="All trips"><Home size={19} /></button>
          <div style={{ minWidth: 0 }}>
            <input className="trip-input" value={tripName} onChange={(e) => setTripName(e.target.value)} />
            <div className="header-sub">
              Packing Manifest · <button onClick={() => setView("config")}><Settings2 size={11} /> Edit bags</button>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="header-stats">
            <div className="stat">
              <span className="stat-num mono">{packedItems}/{totalItems}</span>
              <span className="stat-label">Items packed</span>
              <div className="progress-bar-outer" style={{ marginTop: 4 }}>
                <div className="progress-bar-inner" style={{ width: totalItems ? `${(packedItems / totalItems) * 100}%` : "0%" }} />
              </div>
            </div>
            <div className="unit-toggle">
              <button className={unit === "kg" ? "active" : ""} onClick={() => setUnit("kg")}>KG</button>
              <button className={unit === "lb" ? "active" : ""} onClick={() => setUnit("lb")}>LB</button>
            </div>
          </div>
          <div className="header-actions">
            <button className="hbtn" onClick={() => setTripsPanelOpen((v) => !v)}>
              <FolderOpen size={14} /> My Trips{savedTrips.length > 0 ? ` (${savedTrips.length})` : ""}
            </button>
            <button className={`hbtn primary ${saveStatus === "saved" ? "saved" : ""}`} onClick={saveTrip} disabled={saveStatus === "saving"}>
              {saveStatus === "saved" ? <Check size={14} /> : <Save size={14} />}
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Save Trip"}
            </button>
          </div>
        </div>

        {tripsPanelOpen && (
          <div className="trips-panel">
            <div className="trips-panel-head">
              <b>Saved Trips</b>
              <button className="icon-btn" onClick={() => setTripsPanelOpen(false)} aria-label="Close"><X size={16} /></button>
            </div>
            {tripsError && <div className="trips-error">{tripsError}</div>}
            <div className="trips-panel-body">
              {tripsLoading && <div className="trips-empty">Loading your trips…</div>}
              {!tripsLoading && savedTrips.length === 0 && <div className="trips-empty">No saved trips yet. Build your list, then hit "Save Trip".</div>}
              {!tripsLoading && savedTrips.map((t) => (
                <div className="trip-row" key={t.id}>
                  <div className="trip-row-main" onClick={() => openTrip(t)}>
                    <div className="trip-row-name">{t.tripName}{t.id === currentTripId ? " (current)" : ""}</div>
                    <div className="trip-row-meta"><Clock size={11} /> {fmtDate(t.savedAt)} · {t.items.filter((i) => i.location !== "unpacked").length}/{t.items.length} packed</div>
                  </div>
                  <button className="icon-btn" onClick={() => deleteTrip(t.id)} title="Delete trip" aria-label="Delete trip"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <button className="trips-new-btn" onClick={startNewTrip}><Plus size={12} style={{ verticalAlign: -1 }} /> Start a new trip</button>
          </div>
        )}
      </div>

      <div className="layout">
        <div className="side-panel">
          <div className="panel">
            <div className="search-row">
              <div className="search-box">
                <Search size={14} />
                <input placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <button className="add-btn" onClick={() => setAddOpen((v) => !v)}><Plus size={14} /> Add</button>
            </div>

            {addOpen && (
              <div className="add-form">
                <div className="add-form-row">
                  <input className="name-field" placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem((s) => ({ ...s, name: e.target.value }))} />
                </div>
                <div className="add-form-row">
                  <select value={newItem.category} onChange={(e) => setNewItem((s) => ({ ...s, category: e.target.value }))}>
                    {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                  </select>
                  <input type="number" min="0" style={{ width: 80 }} value={newItem.weight} onChange={(e) => setNewItem((s) => ({ ...s, weight: e.target.value }))} />
                  <span style={{ fontSize: 12, alignSelf: "center", color: "var(--ink-soft)" }}>g</span>
                </div>
                <div className="add-form-actions">
                  <button className="btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={addCustomItem}>Add item</button>
                </div>
              </div>
            )}

            <div className="cat-tabs">
              <button className={`cat-tab ${activeCat === "all" ? "active" : ""}`} onClick={() => setActiveCat("all")}>All</button>
              {Object.entries(CATEGORIES).map(([k, c]) => {
                const Icon = c.icon;
                return <button key={k} className={`cat-tab ${activeCat === k ? "active" : ""}`} onClick={() => setActiveCat(k)}><Icon size={12} /> {c.label}</button>;
              })}
            </div>

            <div className="section-label">Unpacked ({unpacked.length})</div>
            <div
              className={`drop-zone ${dragOverZone === "unpacked" ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverZone("unpacked"); }}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={(e) => handleDrop(e, "unpacked")}
            >
              {unpacked.length === 0 && <div className="empty-hint">Nothing here — drag a packed item back, or add more below.</div>}
              {unpacked.map((item) => (
                <ItemTag key={item.id} item={item} unit={unit} destinations={destinations}
                  onDragStart={handleDragStart} onMove={moveItem} onQty={qtyChange} onDelete={deleteItem} />
              ))}
            </div>

            {availablePresets.length > 0 && (
              <>
                <div className="section-label">Quick add</div>
                <div>
                  {availablePresets.slice(0, 10).map((p) => (
                    <span key={p.name} className="preset-chip" onClick={() => addPreset(p)}><Plus size={11} /> {p.name}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="main-panel">
          <div className="bags-header"><h2 style={{ fontSize: 18, textTransform: "uppercase" }}>Your Bags</h2></div>

          <div className="bags-grid">
            {topBags.map((bag) => (
              <BagCard
                key={bag.id}
                bag={bag}
                pouches={pouchesOf(bag.id)}
                items={items}
                unit={unit}
                weightOf={weightOf}
                destinations={destinations}
                dragOverZone={dragOverZone}
                setDragOverZone={setDragOverZone}
                handleDrop={handleDrop}
                handleDragStart={handleDragStart}
                moveItem={moveItem}
                qtyChange={qtyChange}
                deleteItem={deleteItem}
                renameBag={renameBag}
                relimitBag={relimitBag}
                removeBag={removeBag}
                addPouch={addPouch}
              />
            ))}
            <div className="add-bag-card" onClick={() => setView("config")}>
              <Settings2 size={22} />
              Edit bags & limits
            </div>
          </div>

          <div className="tips-dock">
            <div className="section-label" style={{ display: "flex", alignItems: "center", gap: 6 }}><PackageCheck size={13} /> Packing tips for what's in your bags</div>
            {presentCats.length === 0 && (
              <div className="tips-card"><Info size={16} /><div><b>Get started</b><p>Pack a few items to see tailored packing methods appear here.</p></div></div>
            )}
            {presentCats.map((c) => (
              <div className="tips-card" key={c}><Info size={16} /><div><b>{CATEGORIES[c].label}</b><p>{CATEGORIES[c].tip}</p></div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
