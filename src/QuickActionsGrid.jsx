import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, RotateCcw, Loader2 } from 'lucide-react';

// Quick actions — ফোনের Quick settings-এর মতো: চেপে ধরলে সাজানোর মোড, টেনে সাজানো, Done চাপলে সার্ভারে সেভ।
// রিমুভ করার অপশন ইচ্ছাকৃতভাবে নেই।

// নিজস্ব লম্বা-চাপ শনাক্তকরণ (ব্যাকআপ) — লাইব্রেরির টাচ-সেন্সর কোনো ফোনে কাজ না করলেও
// ৫০০ মি.সে. চেপে ধরলে সাজানোর মোড অবশ্যই চালু হয়। আঙুল ১৫px-এর বেশি সরলে (স্ক্রল) বাতিল।
function useLongPress(onLongPress, enabled) {
  const timer = useRef(null);
  const start = useRef(null);
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  if (!enabled) return {};
  return {
    onPointerDown: (e) => {
      start.current = { x: e.clientX, y: e.clientY };
      clear();
      timer.current = setTimeout(() => { timer.current = null; onLongPress(); }, 500);
    },
    onPointerMove: (e) => {
      if (!start.current) return;
      if (Math.abs(e.clientX - start.current.x) > 15 || Math.abs(e.clientY - start.current.y) > 15) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear
  };
}

function SortableAction({ action, editMode, onActivate, onLongPress }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: action.label });
  const longPress = useLongPress(onLongPress, !editMode);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 'auto',
    // সাধারণ অবস্থায় স্ক্রল চালু থাকে; সাজানোর মোডে টানলে পেজ স্ক্রল হয় না
    touchAction: editMode ? 'none' : 'manipulation'
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} {...longPress} className="qa-item">
      <button
        type="button"
        onClick={() => onActivate(action)}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full flex flex-col items-center gap-2 ${editMode ? '' : 'active:opacity-70'}`}
      >
        <div
          className={`w-14 h-14 rounded-2xl bg-[#e4e9e8] flex items-center justify-center ${
            editMode ? 'shadow-[6px_6px_14px_#c3c9c8,-6px_-6px_14px_#ffffff] qa-wiggle ring-1 ring-[#075B68]/40' : 'shadow-[6px_6px_14px_#c3c9c8,-6px_-6px_14px_#ffffff] active:shadow-[inset_4px_4px_8px_#c3c9c8,inset_-4px_-4px_8px_#ffffff]'
          } ${isDragging ? 'scale-110 ring-2 ring-[#075B68]' : ''}`}
        >
          {action.icon}
        </div>
        <span className="text-xs text-[#3a4a47] text-center leading-tight">{action.label}</span>
      </button>
    </div>
  );
}

// props:
//   actions   — [{ label, icon, onClick }] (ডিফল্ট ক্রমে); label অনন্য হতে হবে
//   apiBase   — backend-এর লিংক
//   getHeaders — (ঐচ্ছিক) () => ({ Authorization: 'Bearer ...' }) — fetch-এ টোকেন নিজে থেকে না গেলে
export default function QuickActionsGrid({ actions, apiBase, getHeaders }) {
  const defaultOrder = useMemo(() => actions.map((a) => a.label), [actions]);
  const [savedOrder, setSavedOrder] = useState(null); // সার্ভারে সেভ করা ক্রম (null = ডিফল্ট)
  const [draft, setDraft] = useState(null);           // সাজানোর মোডে চলমান ক্রম
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastDragEnd = useRef(0);
  const editRef = useRef(false);
  const headers = () => ({ 'Content-Type': 'application/json', ...(getHeaders ? getHeaders() : {}) });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/auth/me/quick-actions`, { headers: headers() });
        const data = await res.json();
        if (data.status === 'ok' && Array.isArray(data.order)) setSavedOrder(data.order);
      } catch (e) { /* না পেলে ডিফল্ট ক্রম */ }
    })();
  }, [apiBase]);

  // সেভ করা ক্রম + পরে নতুন যোগ হওয়া বাটন শেষে; মুছে যাওয়া বাটনের key বাদ
  const resolveOrder = (order) => {
    const known = new Set(defaultOrder);
    const base = (order || []).filter((k) => known.has(k));
    const rest = defaultOrder.filter((k) => !base.includes(k));
    return [...base, ...rest];
  };
  const currentOrder = editMode && draft ? draft : resolveOrder(savedOrder);
  const byLabel = useMemo(() => Object.fromEntries(actions.map((a) => [a.label, a])), [actions]);
  const ordered = currentOrder.map((k) => byLabel[k]).filter(Boolean);

  // সাধারণ অবস্থায় ~আধা সেকেন্ড চাপে টানা শুরু (তাই ট্যাপ ও স্ক্রল স্বাভাবিক); সাজানোর মোডে অল্প চাপেই।
  // tolerance ১৫px — আসল ফোনে আঙুল সামান্য কাঁপে, ৮px দিলে চাপ বাতিল হয়ে যেত
  const sensors = useSensors(
    useSensor(MouseSensor, editMode ? { activationConstraint: { distance: 4 } } : { activationConstraint: { delay: 450, tolerance: 15 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: editMode ? 120 : 450, tolerance: editMode ? 10 : 15 } })
  );

  useEffect(() => { editRef.current = editMode; }, [editMode]);
  const enterEdit = () => {
    if (editMode || editRef.current) return; // লাইব্রেরি ও ব্যাকআপ দুটোই ডাকলে দুবার যেন না হয়
    editRef.current = true;
    lastDragEnd.current = Date.now();        // চাপ ছাড়ার ক্লিকে যেন বাটনের কাজ চালু না হয়
    setDraft(resolveOrder(savedOrder));
    setEditMode(true);
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) { /* কিছু ব্রাউজারে নেই */ }
  };

  const onDragEnd = ({ active, over }) => {
    lastDragEnd.current = Date.now();
    if (!over || active.id === over.id) return;
    setDraft((prev) => {
      const list = prev || resolveOrder(savedOrder);
      return arrayMove(list, list.indexOf(active.id), list.indexOf(over.id));
    });
  };

  const onActivate = (action) => {
    // সাজানোর মোডে বা টানা শেষ হওয়ার সাথে সাথে ক্লিক হলে বাটনের কাজ চালু হবে না
    if (editMode || Date.now() - lastDragEnd.current < 600) return;
    action.onClick && action.onClick();
  };

  const persist = async (order) => {
    setSaving(true);
    try {
      await fetch(`${apiBase}/api/auth/me/quick-actions`, { method: 'PUT', headers: headers(), body: JSON.stringify({ order }) });
    } catch (e) {
      alert('সাজানো সেভ করা যায়নি, ইন্টারনেট দেখে আবার চেষ্টা করুন');
    } finally {
      setSaving(false);
    }
  };

  const done = async () => {
    const order = draft || resolveOrder(savedOrder);
    setSavedOrder(order);
    editRef.current = false;
    setEditMode(false);
    setDraft(null);
    await persist(order);
  };
  const resetDefault = () => setDraft([...defaultOrder]);

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3 min-h-[32px]">
        <h2 className="text-lg font-bold text-[#1a2e2c]">Quick actions</h2>
        {editMode ? (
          <div className="flex items-center gap-2">
            <button onClick={resetDefault} className="px-3 py-1.5 rounded-full border border-[#075B68]/30 text-[#075B68] text-[11px] flex items-center gap-1">
              <RotateCcw size={12} /> আগের মতো করুন
            </button>
            <button onClick={done} disabled={saving} className="px-4 py-1.5 rounded-full bg-[#075B68] text-white text-xs font-bold flex items-center gap-1">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Done
            </button>
          </div>
        ) : saving ? <Loader2 size={16} className="animate-spin" /> : null}
      </div>
      {editMode && <p className="text-[11px] text-[#3a4a47] opacity-70 mb-3">বাটন চেপে ধরে টেনে পছন্দমতো জায়গায় রাখুন, শেষে Done চাপুন</p>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={enterEdit}
        onDragEnd={onDragEnd}
        onDragCancel={() => { lastDragEnd.current = Date.now(); }}
      >
        <SortableContext items={currentOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 gap-3">
            {ordered.map((a) => (
              <SortableAction key={a.label} action={a} editMode={editMode} onActivate={onActivate} onLongPress={enterEdit} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
