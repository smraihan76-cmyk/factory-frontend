import React, { useState, useEffect } from 'react';
import {
  Bell, PlusCircle, MapPin, HardHat, Wallet,
  RefreshCw, CheckCircle2, CreditCard, UserPlus, X, Loader2,
  LifeBuoy, ChevronRight, Home, Package, User, Users, Eye, FileText
} from 'lucide-react';

const API_BASE = 'https://factory-backend-production-7cde.up.railway.app';

export default function App() {
  const [balanceHidden, setBalanceHidden] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    designation: '',
    rate_type: 'piece',
    rate_amount: ''
  });

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
  }, []);

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
        setForm({ name: '', phone: '', designation: '', rate_type: 'piece', rate_amount: '' });
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

  const stats = [
    { icon: <User size={22} className="text-amber-600" />, bg: 'bg-amber-50', dot: 'bg-amber-500', value: `${staffList.length}`, label: 'মোট এমপ্লয়ি' },
    { icon: <CheckCircle2 size={22} className="text-emerald-700" />, bg: 'bg-emerald-50', dot: 'bg-emerald-600', value: '০', label: 'মোট উপস্থিত' },
    { icon: <MapPin size={22} className="text-orange-700" />, bg: 'bg-orange-50', dot: 'bg-orange-600', value: '০', label: 'মোট অনুপস্থিত' },
  ];

  const quickActions = [
    { icon: <PlusCircle size={24} className="text-red-800" />, bg: 'bg-red-100', label: 'নতুন প্রোডাক্ট যোগ করুন', onClick: () => {} },
    { icon: <HardHat size={24} className="text-amber-700" />, bg: 'bg-amber-100', label: 'নতুন কারিগর যোগ করুন', onClick: () => setShowAddForm(true) },
    { icon: <Users size={24} className="text-red-800" />, bg: 'bg-red-100', label: 'কারিগর হিসাব', onClick: () => {} },
    { icon: <Wallet size={24} className="text-red-800" />, bg: 'bg-red-100', label: 'সেলারি', onClick: () => {} },
    { icon: <RefreshCw size={24} className="text-orange-700" />, bg: 'bg-orange-100', label: 'পার্টনার হিসাব', onClick: () => {} },
    { icon: <CheckCircle2 size={24} className="text-orange-700" />, bg: 'bg-orange-100', label: 'মজুরী', onClick: () => {} },
    { icon: <CreditCard size={24} className="text-red-800" />, bg: 'bg-red-100', label: 'ফান্ড/খরচ', onClick: () => {} },
    { icon: <UserPlus size={24} className="text-emerald-700" />, bg: 'bg-emerald-100', label: 'স্টাফ যোগ করুন', onClick: () => setShowAddForm(true) },
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
            <div key={i} className="flex-1 bg-white rounded-2xl p-3.5 shadow-sm">
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
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
              {staffList.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.designation || 'পদবি নেই'} {s.phone ? `· ${s.phone}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-900">৳ {s.rate_amount}</p>
                    <p className="text-xs text-gray-400">
                      {s.rate_type === 'piece' ? 'প্রতি পিস' : 'মাসিক'}
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
                  <label className="text-xs font-semibold text-gray-500">রেটের ধরন</label>
                  <div className="flex gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, rate_type: 'piece' })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${form.rate_type === 'piece' ? 'bg-red-950 text-white border-red-950' : 'border-gray-200 text-gray-600'}`}
                    >
                      প্রতি পিস
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

                <div>
                  <label className="text-xs font-semibold text-gray-500">
                    {form.rate_type === 'piece' ? 'প্রতি পিস রেট (৳)' : 'মাসিক বেতন (৳)'}
                  </label>
                  <input
                    type="number"
                    value={form.rate_amount}
                    onChange={(e) => setForm({ ...form, rate_amount: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: ৩৫"
                  />
                </div>

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
      </div>
    </div>
  );
}
