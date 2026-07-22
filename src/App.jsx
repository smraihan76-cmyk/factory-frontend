import React, { useState, useEffect } from 'react';
import {
  Bell, PlusCircle, MapPin, HardHat, Wallet,
  RefreshCw, CheckCircle2, CreditCard, UserPlus, X, Loader2,
  LifeBuoy, ChevronRight, Home, Package, User, Users, Eye, FileText,
  Phone, MessageCircle, Clock, Server, Coffee, LogIn, LogOut
} from 'lucide-react';

const API_BASE = 'https://factory-backend-production-7cde.up.railway.app';

// বাংলাদেশি নাম্বারকে হোয়াটসঅ্যাপ লিংকের জন্য প্রস্তুত করে (880 কোডসহ)
function toWhatsAppNumber(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return '88' + digits;
  return '880' + digits;
}

// বর্তমান সময় HH:MM ফরম্যাটে (time input-এর জন্য)
function nowTimeString() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const STATUS_LABELS = {
  present: { text: 'উপস্থিত', color: 'text-emerald-700', border: 'border-emerald-500', bg: 'bg-emerald-50' },
  on_break: { text: 'বিরতিতে', color: 'text-amber-700', border: 'border-amber-500', bg: 'bg-amber-50' },
  checked_out: { text: 'কাজ শেষ', color: 'text-gray-500', border: 'border-gray-300', bg: 'bg-gray-50' },
  not_marked: { text: 'মার্ক করা হয়নি', color: 'text-red-700', border: 'border-red-300', bg: 'bg-red-50' }
};

export default function App() {
  const [balanceHidden, setBalanceHidden] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    designation: '',
    joining_date: '',
    rate_type: 'piece',
    rate_amount: ''
  });

  // উপস্থিতি সংক্রান্ত state
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [pickerMode, setPickerMode] = useState(null); // 'present' | 'break' | null
  const [pendingAction, setPendingAction] = useState(null); // { staffId, name, mode, time }
  const [summaryStaff, setSummaryStaff] = useState(null); // { id, name }
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // ডিউটি টাইম state
  const [showDutyForm, setShowDutyForm] = useState(false);
  const [dutyForm, setDutyForm] = useState({ duty_start: '09:00', lunch_start: '13:00', lunch_end: '14:00', duty_end: '18:00' });
  const [dutySubmitting, setDutySubmitting] = useState(false);

  // মেশিন state
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [machines, setMachines] = useState([]);
  const [machineForm, setMachineForm] = useState({ name: '', ip_address: '', port: '4370' });
  const [machineSubmitting, setMachineSubmitting] = useState(false);
  const [machineError, setMachineError] = useState('');

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/staff`);
      const data = await res.json();
      if (data.status === 'ok') {
        setStaffList(data.staff);
      }
    } catch (err) {
      console.error('স্টাফ লিস্ট আনতে সমস্যা হয়েছে:', err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchAttendanceToday();
  }, []);

  const fetchAttendanceToday = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/today`);
      const data = await res.json();
      if (data.status === 'ok') setAttendanceToday(data.staff);
    } catch (err) {
      console.error('আজকের উপস্থিতি আনতে সমস্যা হয়েছে:', err);
    }
  };

  const fetchDutySchedule = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/duty-schedule`);
      const data = await res.json();
      if (data.status === 'ok' && data.schedule) {
        setDutyForm({
          duty_start: data.schedule.duty_start?.slice(0, 5) || '09:00',
          lunch_start: data.schedule.lunch_start?.slice(0, 5) || '13:00',
          lunch_end: data.schedule.lunch_end?.slice(0, 5) || '14:00',
          duty_end: data.schedule.duty_end?.slice(0, 5) || '18:00'
        });
      }
    } catch (err) {
      console.error('ডিউটি টাইম আনতে সমস্যা হয়েছে:', err);
    }
  };

  const fetchMachines = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/machines`);
      const data = await res.json();
      if (data.status === 'ok') setMachines(data.machines);
    } catch (err) {
      console.error('মেশিন লিস্ট আনতে সমস্যা হয়েছে:', err);
    }
  };

  const fetchSummary = async (staffId) => {
    setSummaryLoading(true);
    setSummaryData(null);
    try {
      const res = await fetch(`${API_BASE}/api/attendance/summary/${staffId}?days=30`);
      const data = await res.json();
      if (data.status === 'ok') setSummaryData(data.summary);
    } catch (err) {
      console.error('সামারি আনতে সমস্যা হয়েছে:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const openAttendanceModal = () => {
    setShowAttendanceModal(true);
    fetchAttendanceToday();
  };

  const openStaffSummary = (staffId, name) => {
    setSummaryStaff({ id: staffId, name });
    fetchSummary(staffId);
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;
    const { staffId, mode, time } = pendingAction;
    const today = new Date().toISOString().slice(0, 10);
    const eventTime = `${today}T${time}:00`;
    try {
      const endpoint = mode === 'break' ? '/api/attendance/break' : '/api/attendance/present';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId, event_time: eventTime, source: 'manual' })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setPendingAction(null);
        setPickerMode(null);
        fetchAttendanceToday();
      } else {
        alert(data.message || 'কিছু একটা ভুল হয়েছে');
      }
    } catch (err) {
      alert('সার্ভারের সাথে কানেক্ট করা যায়নি');
    }
  };

  const handleSaveDuty = async (e) => {
    e.preventDefault();
    setDutySubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/duty-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dutyForm)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setShowDutyForm(false);
      }
    } catch (err) {
      alert('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setDutySubmitting(false);
    }
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    setMachineError('');
    if (!machineForm.name.trim() || !machineForm.ip_address.trim()) {
      setMachineError('নাম এবং IP অ্যাড্রেস দিতে হবে');
      return;
    }
    setMachineSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/machines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...machineForm, port: parseInt(machineForm.port) || 4370 })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setMachineForm({ name: '', ip_address: '', port: '4370' });
        fetchMachines();
      } else {
        setMachineError(data.message || 'কিছু একটা ভুল হয়েছে');
      }
    } catch (err) {
      setMachineError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setMachineSubmitting(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setFormError('নাম দিতে হবে');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setShowAddForm(false);
        setForm({ name: '', phone: '', designation: '', joining_date: '', rate_type: 'piece', rate_amount: '' });
        fetchStaff();
      } else {
        setFormError(data.message || 'কিছু একটা ভুল হয়েছে');
      }
    } catch (err) {
      setFormError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = attendanceToday.filter((s) => s.status === 'present' || s.status === 'on_break' || s.status === 'checked_out').length;
  const absentCount = attendanceToday.filter((s) => s.status === 'not_marked').length;

  const stats = [
    { icon: <User size={22} className="text-amber-600" />, bg: 'bg-amber-50', dot: 'bg-amber-500', value: `${staffList.length}`, label: 'মোট এমপ্লয়ি', onClick: () => setShowEmployeeModal(true) },
    { icon: <CheckCircle2 size={22} className="text-emerald-700" />, bg: 'bg-emerald-50', dot: 'bg-emerald-600', value: `${presentCount}`, label: 'মোট উপস্থিত', onClick: openAttendanceModal },
    { icon: <MapPin size={22} className="text-orange-700" />, bg: 'bg-orange-50', dot: 'bg-orange-600', value: `${absentCount}`, label: 'মোট অনুপস্থিত', onClick: openAttendanceModal },
  ];

  const quickActions = [
    { icon: <PlusCircle size={24} className="text-red-800" />, bg: 'bg-red-100', label: 'নতুন প্রোডাক্ট যোগ করুন', onClick: () => {} },
    { icon: <HardHat size={24} className="text-amber-700" />, bg: 'bg-amber-100', label: 'নতুন কারিগর যোগ করুন', onClick: () => setShowAddForm(true) },
    { icon: <Users size={24} className="text-red-800" />, bg: 'bg-red-100', label: 'কারিগর হিসাব', onClick: () => {} },
    { icon: <Server size={24} className="text-red-800" />, bg: 'bg-red-100', label: 'মেশিন যোগ করুন', onClick: () => { setShowMachineForm(true); fetchMachines(); } },
    { icon: <RefreshCw size={24} className="text-orange-700" />, bg: 'bg-orange-100', label: 'পার্টনার হিসাব', onClick: () => {} },
    { icon: <CheckCircle2 size={24} className="text-orange-700" />, bg: 'bg-orange-100', label: 'মজুরী', onClick: () => {} },
    { icon: <CreditCard size={24} className="text-red-800" />, bg: 'bg-red-100', label: 'ফান্ড/খরচ', onClick: () => {} },
    { icon: <Clock size={24} className="text-emerald-700" />, bg: 'bg-emerald-100', label: 'ডিউটি টাইম যুক্ত করুন', onClick: () => { setShowDutyForm(true); fetchDutySchedule(); } },
  ];

  const navItems = [
    { icon: <Home size={24} />, label: 'হোম', active: true },
    { icon: <Package size={24} />, label: 'প্রোডাকশন', active: false },
    { icon: <Bell size={24} />, label: 'অ্যালার্ট', active: false },
    { icon: <User size={24} />, label: 'প্রোফাইল', active: false },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex justify-center">
      <div className="w-full max-w-sm bg-stone-100 min-h-screen relative pb-20">

        {/* Header */}
        <div className="bg-gradient-to-br from-red-950 to-black rounded-b-3xl px-6 pt-8 pb-14 text-white">
          <p className="text-sm text-white/70">শুভ বিকাল</p>
          <h1 className="text-2xl font-bold mt-1 tracking-wide">Maya Garments</h1>
          <p className="text-sm text-white/70 mt-1">ফ্যাক্টরি ড্যাশবোর্ডে স্বাগতম</p>
          <div className="absolute top-8 right-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div className="w-11 h-11 rounded-full bg-amber-500 text-red-950 flex items-center justify-center font-bold">
              M
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mx-4 -mt-10 bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Wallet size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide">আজকের হিসাব</p>
              <p className="text-gray-800 font-medium">
                {balanceHidden ? 'দেখতে "ব্যালেন্স দেখুন" চাপুন' : '৳ ৯৮,৫০০ মোট আয়'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setBalanceHidden(!balanceHidden)}
              className="flex-1 border border-red-950 text-red-950 rounded-full py-2.5 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-50"
            >
              <Eye size={16} /> ব্যালেন্স দেখুন
            </button>
            <button className="flex-1 bg-red-950 text-white rounded-full py-2.5 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900">
              <FileText size={16} /> বিস্তারিত দেখুন
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="flex gap-3 px-4 mt-4">
          {stats.map((s, i) => (
            <div key={i} onClick={s.onClick} className="flex-1 bg-white rounded-2xl p-3.5 shadow-sm active:opacity-80 cursor-pointer">
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                  {s.icon}
                </div>
                <span className={`w-2 h-2 rounded-full ${s.dot} mt-1`} />
              </div>
              <p className="text-lg font-bold text-gray-900 mt-2 leading-tight">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Quick actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((a, i) => (
              <button key={i} onClick={a.onClick} className="flex flex-col items-center gap-2 active:opacity-70">
                <div className={`w-14 h-14 rounded-2xl ${a.bg} flex items-center justify-center shadow-sm`}>
                  {a.icon}
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Staff list */}
        {staffList.length > 0 && (
          <div className="px-4 mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">স্টাফ/কারিগর লিস্ট</h2>
            <div className="flex flex-col gap-3">
              {staffList.map((s) => (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3 border-l-4 ${
                    s.rate_type === 'monthly' ? 'border-red-900' : 'border-amber-500'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.designation || 'পদবি নেই'}</p>
                    {s.phone && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-600">{s.phone}</span>
                        <a
                          href={`tel:${s.phone}`}
                          className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center active:bg-emerald-200"
                        >
                          <Phone size={13} className="text-emerald-700" />
                        </a>
                        <a
                          href={`https://wa.me/${toWhatsAppNumber(s.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center active:bg-green-200"
                        >
                          <MessageCircle size={13} className="text-green-700" />
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {s.rate_type === 'monthly' ? (
                      <p className="text-sm font-semibold text-red-900">৳ {s.rate_amount}</p>
                    ) : (
                      <p className="text-sm font-semibold text-gray-400">—</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {s.rate_type === 'monthly' ? 'মাসিক' : 'প্রোডাকশন'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help banner */}
        <div className="mx-4 mt-6 bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 active:bg-gray-50">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
            <LifeBuoy size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">সাহায্য দরকার?</p>
            <p className="text-xs text-gray-500">রিপোর্ট বা সাপোর্ট দেখুন</p>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 w-full max-w-sm bg-white border-t border-gray-200 flex justify-around py-2.5">
          {navItems.map((n, i) => (
            <button key={i} className={`flex flex-col items-center gap-1 px-4 ${n.active ? 'text-red-950' : 'text-gray-400'}`}>
              {n.icon}
              <span className="text-xs font-medium">{n.label}</span>
            </button>
          ))}
        </div>

        {/* Employee List Modal */}
        {showEmployeeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">মোট এমপ্লয়ি ({staffList.length})</h2>
                <button onClick={() => setShowEmployeeModal(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              {staffList.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">এখনো কোনো স্টাফ যোগ করা হয়নি</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {staffList.map((s) => (
                    <div
                      key={s.id}
                      className={`bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3 border-l-4 ${
                        s.rate_type === 'monthly' ? 'border-red-900' : 'border-amber-500'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.designation || 'পদবি নেই'}</p>
                        {s.phone && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-gray-600">{s.phone}</span>
                            <a
                              href={`tel:${s.phone}`}
                              className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center active:bg-emerald-200"
                            >
                              <Phone size={13} className="text-emerald-700" />
                            </a>
                            <a
                              href={`https://wa.me/${toWhatsAppNumber(s.phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center active:bg-green-200"
                            >
                              <MessageCircle size={13} className="text-green-700" />
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {s.rate_type === 'monthly' ? (
                          <p className="text-sm font-semibold text-red-900">৳ {s.rate_amount}</p>
                        ) : (
                          <p className="text-sm font-semibold text-gray-400">—</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {s.rate_type === 'monthly' ? 'মাসিক' : 'প্রোডাকশন'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Staff Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">নতুন স্টাফ/কারিগর যোগ করুন</h2>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">নাম *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: করিম মিয়া"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500">ফোন নাম্বার</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: ০১৭xxxxxxxx"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500">পদবি/কাজের ধরন</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: সেলাই, কাটিং, ফিনিশিং"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500">যোগদানের তারিখ</label>
                  <input
                    type="date"
                    value={form.joining_date}
                    onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500">রেটের ধরন</label>
                  <div className="flex gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, rate_type: 'piece' })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${form.rate_type === 'piece' ? 'bg-red-950 text-white border-red-950' : 'border-gray-200 text-gray-600'}`}
                    >
                      প্রোডাকশন
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, rate_type: 'monthly' })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${form.rate_type === 'monthly' ? 'bg-red-950 text-white border-red-950' : 'border-gray-200 text-gray-600'}`}
                    >
                      মাসিক বেতন
                    </button>
                  </div>
                </div>

                {form.rate_type === 'monthly' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500">মাসিক বেতন (৳)</label>
                    <input
                      type="number"
                      value={form.rate_amount}
                      onChange={(e) => setForm({ ...form, rate_amount: e.target.value })}
                      className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                      placeholder="যেমন: ৮০০০"
                    />
                  </div>
                )}

                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  {submitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Attendance Modal (আজকের উপস্থিতি) */}
        {showAttendanceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">আজকের উপস্থিতি</h2>
                <button onClick={() => setShowAttendanceModal(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <div className="flex gap-3 mb-5">
                <button
                  onClick={() => setPickerMode('present')}
                  className="flex-1 bg-emerald-600 text-white rounded-full py-2.5 flex items-center justify-center gap-2 font-semibold text-sm active:bg-emerald-700"
                >
                  <LogIn size={16} /> উপস্থিত যুক্ত করুন
                </button>
                <button
                  onClick={() => setPickerMode('break')}
                  className="flex-1 bg-amber-500 text-white rounded-full py-2.5 flex items-center justify-center gap-2 font-semibold text-sm active:bg-amber-600"
                >
                  <Coffee size={16} /> বিরতি
                </button>
              </div>

              {attendanceToday.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">এখনো কোনো স্টাফ যোগ করা হয়নি</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {attendanceToday.map((s) => {
                    const st = STATUS_LABELS[s.status] || STATUS_LABELS.not_marked;
                    return (
                      <button
                        key={s.staff_id}
                        onClick={() => openStaffSummary(s.staff_id, s.name)}
                        className={`text-left bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3 border-l-4 ${st.border} active:opacity-80`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{s.designation || 'পদবি নেই'}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.color} shrink-0`}>
                          {st.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Present/Break Picker — স্টাফ সিলেক্ট করার লিস্ট */}
        {pickerMode && !pendingAction && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {pickerMode === 'break' ? 'কাকে বিরতি দিবেন?' : 'কে উপস্থিত হয়েছে?'}
                </h2>
                <button onClick={() => setPickerMode(null)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {attendanceToday
                  .filter((s) => (pickerMode === 'break' ? (s.status === 'present') : true))
                  .map((s) => {
                    const st = STATUS_LABELS[s.status] || STATUS_LABELS.not_marked;
                    return (
                      <button
                        key={s.staff_id}
                        onClick={() =>
                          setPendingAction({ staffId: s.staff_id, name: s.name, mode: pickerMode, time: nowTimeString() })
                        }
                        className={`text-left bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3 border-l-4 ${st.border} active:opacity-80`}
                      >
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.color} shrink-0`}>
                          {st.text}
                        </span>
                      </button>
                    );
                  })}
                {pickerMode === 'break' && attendanceToday.filter((s) => s.status === 'present').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">এখন কেউ উপস্থিত অবস্থায় নেই</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* সময় কনফার্ম করার ছোট প্যানেল */}
        {pendingAction && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {pendingAction.name} — {pendingAction.mode === 'break' ? 'বিরতি শুরুর সময়' : 'উপস্থিতির সময়'}
                </h2>
                <button onClick={() => setPendingAction(null)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <label className="text-xs font-semibold text-gray-500">সময়</label>
              <input
                type="time"
                value={pendingAction.time}
                onChange={(e) => setPendingAction({ ...pendingAction, time: e.target.value })}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
              />

              <button
                onClick={confirmPendingAction}
                className="w-full mt-5 bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900"
              >
                <CheckCircle2 size={18} /> কনফার্ম করুন
              </button>
            </div>
          </div>
        )}

        {/* Staff 30-day Summary Modal */}
        {summaryStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">{summaryStaff.name} — গত ৩০ দিন</h2>
                <button onClick={() => { setSummaryStaff(null); setSummaryData(null); }} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              {summaryLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={28} className="animate-spin text-red-900" />
                </div>
              ) : summaryData ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-emerald-500">
                    <p className="text-2xl font-bold text-gray-900">{summaryData.present_days}</p>
                    <p className="text-xs text-gray-500 mt-0.5">উপস্থিত দিন</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-red-500">
                    <p className="text-2xl font-bold text-gray-900">{summaryData.absent_days}</p>
                    <p className="text-xs text-gray-500 mt-0.5">অনুপস্থিত দিন</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-red-900">
                    <p className="text-2xl font-bold text-gray-900">{summaryData.present_hours}</p>
                    <p className="text-xs text-gray-500 mt-0.5">উপস্থিত ঘণ্টা</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-amber-500">
                    <p className="text-2xl font-bold text-gray-900">{summaryData.break_hours}</p>
                    <p className="text-xs text-gray-500 mt-0.5">ব্রেক ঘণ্টা</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-orange-500 col-span-2">
                    <p className="text-2xl font-bold text-gray-900">{summaryData.late_hours}</p>
                    <p className="text-xs text-gray-500 mt-0.5">মোট লেট (ঘণ্টা)</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">ডেটা পাওয়া যায়নি</p>
              )}
            </div>
          </div>
        )}

        {/* Duty Schedule Form */}
        {showDutyForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">ডিউটি টাইম যুক্ত করুন</h2>
                <button onClick={() => setShowDutyForm(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSaveDuty} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">ডিউটি শুরুর সময়</label>
                  <input
                    type="time"
                    value={dutyForm.duty_start}
                    onChange={(e) => setDutyForm({ ...dutyForm, duty_start: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">লাঞ্চ ব্রেক শুরু</label>
                  <input
                    type="time"
                    value={dutyForm.lunch_start}
                    onChange={(e) => setDutyForm({ ...dutyForm, lunch_start: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">লাঞ্চ ব্রেক শেষ</label>
                  <input
                    type="time"
                    value={dutyForm.lunch_end}
                    onChange={(e) => setDutyForm({ ...dutyForm, lunch_end: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">ডিউটি শেষের সময়</label>
                  <input
                    type="time"
                    value={dutyForm.duty_end}
                    onChange={(e) => setDutyForm({ ...dutyForm, duty_end: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={dutySubmitting}
                  className="w-full bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
                >
                  {dutySubmitting ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                  {dutySubmitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Machine Form */}
        {showMachineForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">ফিঙ্গারপ্রিন্ট মেশিন যোগ করুন</h2>
                <button onClick={() => setShowMachineForm(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleAddMachine} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">মেশিনের নাম *</label>
                  <input
                    type="text"
                    value={machineForm.name}
                    onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: মেইন গেট মেশিন"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">IP অ্যাড্রেস *</label>
                  <input
                    type="text"
                    value={machineForm.ip_address}
                    onChange={(e) => setMachineForm({ ...machineForm, ip_address: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: 192.168.1.201"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">পোর্ট</label>
                  <input
                    type="text"
                    value={machineForm.port}
                    onChange={(e) => setMachineForm({ ...machineForm, port: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="ডিফল্ট: 4370"
                  />
                </div>

                {machineError && <p className="text-sm text-red-600">{machineError}</p>}

                <button
                  type="submit"
                  disabled={machineSubmitting}
                  className="w-full bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
                >
                  {machineSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Server size={18} />}
                  {machineSubmitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </form>

              {machines.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">যোগ করা মেশিনসমূহ</h3>
                  <div className="flex flex-col gap-3">
                    {machines.map((m) => (
                      <div key={m.id} className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-red-900">
                        <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{m.ip_address}:{m.port}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
