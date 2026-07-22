import React, { useState } from 'react';
import {
  Bell, PlusCircle, MapPin, HardHat, Wallet,
  RefreshCw, CheckCircle2, CreditCard, Grid3x3,
  LifeBuoy, ChevronRight, Home, Package, User, Users, Eye, FileText
} from 'lucide-react';

export default function App() {
  const [balanceHidden, setBalanceHidden] = useState(true);

  const stats = [
    { icon: <User size={22} className="text-amber-600" />, bg: 'bg-amber-50', dot: 'bg-amber-500', value: '২২', label: 'মোট এমপ্লয়ি' },
    { icon: <CheckCircle2 size={22} className="text-emerald-700" />, bg: 'bg-emerald-50', dot: 'bg-emerald-600', value: '১৮', label: 'মোট উপস্থিত' },
    { icon: <MapPin size={22} className="text-orange-700" />, bg: 'bg-orange-50', dot: 'bg-orange-600', value: '৪', label: 'মোট অনুপস্থিত' },
  ];

  const quickActions = [
    { icon: <PlusCircle size={24} className="text-red-950" />, bg: 'bg-red-50', label: 'নতুন প্রোডাক্ট যোগ করুন' },
    { icon: <HardHat size={24} className="text-amber-600" />, bg: 'bg-amber-50', label: 'নতুন কারিগর যোগ করুন' },
    { icon: <Users size={24} className="text-red-950" />, bg: 'bg-red-50', label: 'কারিগর হিসাব' },
    { icon: <Wallet size={24} className="text-red-950" />, bg: 'bg-red-50', label: 'সেলারি' },
    { icon: <RefreshCw size={24} className="text-orange-700" />, bg: 'bg-orange-50', label: 'পার্টনার হিসাব' },
    { icon: <CheckCircle2 size={24} className="text-orange-700" />, bg: 'bg-orange-50', label: 'মজুরী' },
    { icon: <CreditCard size={24} className="text-red-950" />, bg: 'bg-red-50', label: 'ফান্ড/খরচ' },
    { icon: <Grid3x3 size={24} className="text-gray-500" />, bg: 'bg-gray-100', label: 'আরও' },
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
              <button key={i} className="flex flex-col items-center gap-2 active:opacity-70">
                <div className={`w-14 h-14 rounded-2xl ${a.bg} flex items-center justify-center shadow-sm`}>
                  {a.icon}
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

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
      </div>
    </div>
  );
}
