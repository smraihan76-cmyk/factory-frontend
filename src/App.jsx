import React, { useState, useEffect } from 'react';
import {
  Bell, PlusCircle, MapPin, HardHat, Wallet,
  RefreshCw, CheckCircle2, CreditCard, UserPlus, X, Loader2,
  LifeBuoy, ChevronRight, Home, Package, User, Users, Eye, FileText,
  Phone, MessageCircle, Clock, Server, Coffee, LogIn, LogOut, Printer,
  Pencil, Trash2, Lock, ShieldCheck
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

function LoginScreen({ onLoggedIn }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showModeratorNote, setShowModeratorNote] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone.trim() || !password.trim()) {
      setError('ফোন নাম্বার এবং পাসওয়ার্ড দিতে হবে');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        localStorage.setItem('maya_token', data.token);
        localStorage.setItem('maya_user', JSON.stringify(data.user));
        onLoggedIn(data.user, data.token);
      } else {
        setError(data.message || 'লগইন করা যায়নি');
      }
    } catch (err) {
      setError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex justify-center">
      <div className="w-full max-w-sm bg-stone-100 min-h-screen flex flex-col items-center px-6 pt-16">
        <div className="w-20 h-20 rounded-full bg-red-950 flex items-center justify-center mb-6">
          <ShieldCheck size={34} className="text-amber-400" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-1">Maya Garments</h1>
        <p className="text-sm text-gray-500 mb-8">Admin Login</p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <Phone size={18} className="text-gray-400" />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="ফোন নাম্বার"
              className="flex-1 text-sm focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <Lock size={18} className="text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="পাসওয়ার্ড"
              className="flex-1 text-sm focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-950 text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 active:bg-red-900 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {submitting ? 'লগইন হচ্ছে...' : 'Login'}
          </button>
        </form>

        <div className="w-full mt-8 text-center">
          <p className="text-xs text-gray-400 mb-2">Don't have moderator access yet?</p>
          <button
            onClick={() => setShowModeratorNote(true)}
            className="text-sm font-semibold text-gray-400 underline decoration-dotted cursor-not-allowed"
          >
            Moderator Login
          </button>
          {showModeratorNote && (
            <p className="text-xs text-amber-600 mt-2">শীঘ্রই চালু হবে — আপাতত শুধু এডমিন লগইন করা যাবে</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ currentUser, onLogout, onUpdateUser }) {
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
    rate_amount: '',
    machine_user_id: ''
  });

  // উপস্থিতি সংক্রান্ত state
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [pickerMode, setPickerMode] = useState(null); // 'present' | 'break' | null
  const [pendingAction, setPendingAction] = useState(null); // { staffId, name, mode, time }

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
  const [syncInterval, setSyncInterval] = useState('30');
  const [balanceTrend, setBalanceTrend] = useState(null); // { percent_change, direction }
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [syncIntervalSaving, setSyncIntervalSaving] = useState(false);
  const [syncIntervalSaved, setSyncIntervalSaved] = useState(false);
  const [editingMachineId, setEditingMachineId] = useState(null);

  // প্রোফাইল/লগআউট এবং ইউজার ম্যানেজমেন্ট state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', photo_url: '', current_password: '', new_password: '' });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ name: '', phone: '', password: '', role: 'moderator', is_partner: false });
  const [editingUserId, setEditingUserId] = useState(null);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userError, setUserError] = useState('');

  // আজকের উপস্থিতি রিসেট (পাসওয়ার্ড কনফার্মেশন সহ) state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // সব স্টাফ পেমেন্ট রিসেট (টেস্ট ডেটা মুছার জন্য, পাসওয়ার্ড কনফার্মেশন সহ) state
  const [showPaymentResetConfirm, setShowPaymentResetConfirm] = useState(false);
  const [paymentResetPasswordInput, setPaymentResetPasswordInput] = useState('');
  const [paymentResetError, setPaymentResetError] = useState('');
  const [paymentResetSubmitting, setPaymentResetSubmitting] = useState(false);

  // সব পার্টনার হিসাব রিসেট (টেস্ট ডেটা মুছার জন্য, পাসওয়ার্ড কনফার্মেশন সহ) state
  const [showPartnerResetConfirm, setShowPartnerResetConfirm] = useState(false);
  const [partnerResetPasswordInput, setPartnerResetPasswordInput] = useState('');
  const [partnerResetError, setPartnerResetError] = useState('');
  const [partnerResetSubmitting, setPartnerResetSubmitting] = useState(false);

  // পার্টনার হিসাব state
  const [showPartnerList, setShowPartnerList] = useState(false);
  const [showPartnerLogPage, setShowPartnerLogPage] = useState(false);
  const [allPartnerTransactions, setAllPartnerTransactions] = useState([]);
  const [partnerLogLoading, setPartnerLogLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerTransactions, setPartnerTransactions] = useState([]);
  const [partnerSummary, setPartnerSummary] = useState(null);
  const [partnerDetailLoading, setPartnerDetailLoading] = useState(false);
  const [partnerTxnForm, setPartnerTxnForm] = useState(null); // { type: 'expense'|'cash_in', editingId: null|id, description, amount }
  const [partnerTxnSubmitting, setPartnerTxnSubmitting] = useState(false);
  const [partnerTxnError, setPartnerTxnError] = useState('');

  // নোটিফিকেশন state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // প্রোডাক্ট state
  const [showProductForm, setShowProductForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({ name: '', sewing_price: '' });
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productError, setProductError] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [applyPriceToExisting, setApplyPriceToExisting] = useState(false);

  // কারিগর হিসাব (প্রোডাকশন এন্ট্রি) state
  const [showKarigorHisab, setShowKarigorHisab] = useState(false);
  const [karigorStep, setKarigorStep] = useState('select-staff'); // select-staff | select-product | enter-qty
  const [karigorStaff, setKarigorStaff] = useState(null);
  const [karigorProduct, setKarigorProduct] = useState(null);
  const [karigorQty, setKarigorQty] = useState('');
  const [karigorSubmitting, setKarigorSubmitting] = useState(false);
  const [karigorError, setKarigorError] = useState('');
  const [productionSummary, setProductionSummary] = useState({}); // { staffId: {total_quantity, total_amount} }
  const [recentProduction, setRecentProduction] = useState({}); // { staffId: entry } — গত ৩ ঘণ্টায় যোগ হওয়া
  const [editingProductionEntryId, setEditingProductionEntryId] = useState(null);

  // স্টাফের বিস্তারিত তথ্য (attendance + production + payments একসাথে)
  const [staffDetail, setStaffDetail] = useState(null); // { id, name, attendance, production, payments }
  const [staffDetailLoading, setStaffDetailLoading] = useState(false);
  const [detailView, setDetailView] = useState(null); // 'attendance' | 'production' | 'payments' | null
  const [detailList, setDetailList] = useState([]);
  const [detailListLoading, setDetailListLoading] = useState(false);

  // ফান্ড/খরচ state
  const [showFundChoice, setShowFundChoice] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', expense_date: '' });
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [expenses, setExpenses] = useState([]);

  // মজুরী → খরচের বিস্তারিত (ফ্যাক্টরি খরচ + সব স্টাফ পেমেন্ট) — ক্যাশ মেমো স্টাইল
  const [showExpenseReport, setShowExpenseReport] = useState(false);
  const [expenseReportLoading, setExpenseReportLoading] = useState(false);
  const [allExpenses, setAllExpenses] = useState([]);
  const [allStaffPayments, setAllStaffPayments] = useState([]);
  const [allPartnerExpenses, setAllPartnerExpenses] = useState([]);

  const [showWeeklyPicker, setShowWeeklyPicker] = useState(false);
  const [weeklyStaff, setWeeklyStaff] = useState(null);
  const [weeklyAmount, setWeeklyAmount] = useState('');
  const [weeklySubmitting, setWeeklySubmitting] = useState(false);
  const [weeklyError, setWeeklyError] = useState('');
  const [recentPayments, setRecentPayments] = useState({}); // { staffId: payment } — গত ৩ ঘণ্টায় দেওয়া
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  // মোট ব্যালেন্স / বিস্তারিত / ক্যাশ মেমো state
  const [paymentsSummaryAll, setPaymentsSummaryAll] = useState({}); // { staffId: {total_paid} }
  const [salarySummaryAll, setSalarySummaryAll] = useState({}); // { staffId: {total_due} } — মাসিক বেতনের কারিগরদের জন্য
  const [showBalanceDetail, setShowBalanceDetail] = useState(false);
  const [cashMemoStaff, setCashMemoStaff] = useState(null);
  const [cashMemoData, setCashMemoData] = useState(null); // { production: [], payments: [] }
  const [cashMemoLoading, setCashMemoLoading] = useState(false);

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
    fetchProductionSummaryAll();
    fetchSyncInterval();
    fetchBalanceTrend();
    fetchUnreadCount();
  }, []);

  // মেশিনে কেউ ফিঙ্গার দিলে অ্যাপ যেন নিজে থেকেই আপডেট দেখায়, ম্যানুয়াল রিলোড ছাড়াই —
  // ব্যাকএন্ডে যে সিঙ্ক ইন্টারভাল সেট করা আছে সেটার সাথে মিলিয়েই এখানে অটো-রিফ্রেশ হবে
  // (পার্টনার নোটিফিকেশনও এই একই ইন্টারভালে চেক হবে, প্রায় রিয়েল-টাইমের মতো)
  useEffect(() => {
    const seconds = Math.max(10, parseInt(syncInterval) || 30);
    const intervalId = setInterval(() => {
      fetchAttendanceToday();
      fetchStaff();
      fetchUnreadCount();
    }, seconds * 1000);
    return () => clearInterval(intervalId);
  }, [syncInterval]);

  const fetchAttendanceToday = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/today`);
      const data = await res.json();
      if (data.status === 'ok') {
        setAttendanceToday(data.staff);
        setLastUpdatedAt(new Date());
      }
    } catch (err) {
      console.error('আজকের উপস্থিতি আনতে সমস্যা হয়েছে:', err);
    }
  };

  const fetchBalanceTrend = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/balance/trend`);
      const data = await res.json();
      if (data.status === 'ok') {
        setBalanceTrend({ percent_change: data.percent_change, direction: data.direction });
      }
    } catch (err) {
      console.error('ব্যালেন্স ট্রেন্ড আনতে সমস্যা হয়েছে:', err);
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

  const fetchSyncInterval = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/sync-interval`);
      const data = await res.json();
      if (data.status === 'ok') setSyncInterval(String(data.sync_interval_seconds));
    } catch (err) {
      console.error('সিঙ্ক ইন্টারভাল আনতে সমস্যা হয়েছে:', err);
    }
  };

  const saveSyncInterval = async () => {
    setSyncIntervalSaving(true);
    setSyncIntervalSaved(false);
    try {
      const res = await fetch(`${API_BASE}/api/settings/sync-interval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds: parseInt(syncInterval) })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setSyncInterval(String(data.sync_interval_seconds));
        setSyncIntervalSaved(true);
        setTimeout(() => setSyncIntervalSaved(false), 2000);
      }
    } catch (err) {
      console.error('সিঙ্ক ইন্টারভাল সেভ করতে সমস্যা হয়েছে:', err);
    } finally {
      setSyncIntervalSaving(false);
    }
  };

  const openAttendanceModal = () => {
    setShowAttendanceModal(true);
    fetchAttendanceToday();
  };

  const openAbsentModal = () => {
    setShowAbsentModal(true);
    fetchAttendanceToday();
  };

  const confirmResetAttendance = async () => {
    setResetError('');
    if (resetPasswordInput !== 'Maya') {
      setResetError('পাসওয়ার্ড ভুল');
      return;
    }
    setResetSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/attendance/clear-today`, { method: 'DELETE' });
      fetchAttendanceToday();
      setShowResetConfirm(false);
      setResetPasswordInput('');
    } catch (err) {
      setResetError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setResetSubmitting(false);
    }
  };

  const confirmPaymentReset = async () => {
    setPaymentResetError('');
    if (paymentResetPasswordInput !== 'Maya') {
      setPaymentResetError('পাসওয়ার্ড ভুল');
      return;
    }
    setPaymentResetSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/staff-payments/clear-all`, { method: 'DELETE' });
      setShowPaymentResetConfirm(false);
      setPaymentResetPasswordInput('');
      // খরচের বিস্তারিত রিপোর্ট এবং পাওনার হিসাব খোলা থাকলে সাথে সাথে আপডেট দেখানো
      setAllStaffPayments([]);
      fetchPaymentsSummaryAll();
    } catch (err) {
      setPaymentResetError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setPaymentResetSubmitting(false);
    }
  };

  const confirmPartnerReset = async () => {
    setPartnerResetError('');
    if (partnerResetPasswordInput !== 'Maya') {
      setPartnerResetError('পাসওয়ার্ড ভুল');
      return;
    }
    setPartnerResetSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/partners/clear-all`, { method: 'DELETE', headers: authHeaders() });
      setShowPartnerResetConfirm(false);
      setPartnerResetPasswordInput('');
      // সব জায়গায় সাথে সাথে খালি দেখানো — পার্টনার ডিটেইল, খরচের বিস্তারিত, নোটিফিকেশন
      setPartnerTransactions([]);
      setPartnerSummary(null);
      setAllPartnerExpenses([]);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setPartnerResetError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setPartnerResetSubmitting(false);
    }
  };

  // স্টাফের নামে ক্লিক করলে এই ফাংশন attendance + production + payment তিনটাই একসাথে টেনে আনে
  const openStaffDetail = async (staffId, name) => {
    setDetailView(null);
    setDetailList([]);
    const staffRecord = staffList.find((x) => x.id === staffId) || { name };
    setStaffDetail({ ...staffRecord, id: staffId, name: staffRecord.name || name, attendance: null, production: null, payments: null, salary: null });
    setStaffDetailLoading(true);
    try {
      const isMonthly = staffRecord.rate_type === 'monthly';
      const [attRes, prodRes, payRes, salRes] = await Promise.all([
        fetch(`${API_BASE}/api/attendance/summary/${staffId}?days=30`),
        fetch(`${API_BASE}/api/production/staff/${staffId}/summary`),
        fetch(`${API_BASE}/api/staff-payments/staff/${staffId}/summary`),
        isMonthly ? fetch(`${API_BASE}/api/salary/staff/${staffId}/summary?days=30`) : Promise.resolve(null)
      ]);
      const attData = await attRes.json();
      const prodData = await prodRes.json();
      const payData = await payRes.json();
      const salData = salRes ? await salRes.json() : null;
      setStaffDetail({
        ...staffRecord,
        id: staffId,
        name: staffRecord.name || name,
        attendance: attData.status === 'ok' ? attData.summary : null,
        production: prodData.status === 'ok' ? prodData.summary : null,
        payments: payData.status === 'ok' ? payData.summary : null,
        salary: salData && salData.status === 'ok' ? salData.salary : null
      });
    } catch (err) {
      console.error('বিস্তারিত তথ্য আনতে সমস্যা হয়েছে:', err);
    } finally {
      setStaffDetailLoading(false);
    }
  };

  // যেকোনো বক্সে ক্লিক করলে সেই ক্যাটাগরির বিস্তারিত লিস্ট টেনে আনে
  const openDetailView = async (view) => {
    setDetailView(view);
    setDetailListLoading(true);
    setDetailList([]);
    try {
      let url = '';
      if (view === 'attendance') url = `${API_BASE}/api/attendance/daily/${staffDetail.id}?days=30`;
      if (view === 'production') url = `${API_BASE}/api/production/staff/${staffDetail.id}`;
      if (view === 'payments') url = `${API_BASE}/api/staff-payments/staff/${staffDetail.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'ok') {
        setDetailList(data.days || data.entries || data.payments || []);
      }
    } catch (err) {
      console.error('বিস্তারিত লিস্ট আনতে সমস্যা হয়েছে:', err);
    } finally {
      setDetailListLoading(false);
    }
  };

  const fetchProductionSummaryAll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/production/summary-all`);
      const data = await res.json();
      if (data.status === 'ok') {
        const map = {};
        for (const row of data.summary) map[row.staff_id] = row;
        setProductionSummary(map);
      }
    } catch (err) {
      console.error('প্রোডাকশন সামারি আনতে সমস্যা হয়েছে:', err);
    }
  };

  const fetchPaymentsSummaryAll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/staff-payments/summary-all`);
      const data = await res.json();
      if (data.status === 'ok') {
        const map = {};
        for (const row of data.summary) map[row.staff_id] = row;
        setPaymentsSummaryAll(map);
        return map;
      }
    } catch (err) {
      console.error('পেমেন্ট সামারি আনতে সমস্যা হয়েছে:', err);
    }
    return {};
  };

  const fetchSalarySummaryAll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/salary/summary-all`);
      const data = await res.json();
      if (data.status === 'ok') {
        const map = {};
        for (const row of data.summary) map[row.staff_id] = row;
        setSalarySummaryAll(map);
        return map;
      }
    } catch (err) {
      console.error('বেতন সামারি আনতে সমস্যা হয়েছে:', err);
    }
    return {};
  };

  // একজন কারিগর এখন কত টাকা পাবে সেটা বের করে
  // মাসিক বেতনের কারিগর: শুক্রবার বেতনসহ ছুটি + উপস্থিত দিনের বেতন − লেট কাটা − অনুপস্থিত কাটা − দেওয়া টাকা
  // প্রোডাকশনের কারিগর: মোট আয় − দেওয়া টাকা
  const computeStaffDue = (s, paymentsMap, salaryMap) => {
    const paidMap = paymentsMap || paymentsSummaryAll;
    const salMap = salaryMap || salarySummaryAll;
    if (s.rate_type === 'monthly') {
      if (salMap[s.id]) return parseFloat(salMap[s.id].total_due);
      // সালারি সামারি এখনো লোড না হলে সাধারণ হিসাব (fallback)
      const paid = parseFloat(paidMap[s.id]?.total_paid || 0);
      return parseFloat(s.rate_amount || 0) - paid;
    }
    const earned = parseFloat(productionSummary[s.id]?.total_amount || 0);
    const paid = parseFloat(paidMap[s.id]?.total_paid || 0);
    return earned - paid;
  };

  const handleShowBalance = async () => {
    if (balanceHidden) {
      await fetchPaymentsSummaryAll();
      await fetchProductionSummaryAll();
      await fetchSalarySummaryAll();
    }
    setBalanceHidden(!balanceHidden);
  };

  const handleShowBalanceDetail = async () => {
    await fetchPaymentsSummaryAll();
    await fetchProductionSummaryAll();
    await fetchSalarySummaryAll();
    setShowBalanceDetail(true);
  };

  // কারিগরের ক্যাশ মেমো (রশিদ) — প্রোডাকশন/বেতনের বিস্তারিত + পেমেন্ট হিস্ট্রি একসাথে
  const openCashMemo = async (staff) => {
    setCashMemoStaff(staff);
    setCashMemoLoading(true);
    setCashMemoData(null);
    try {
      const isMonthly = staff.rate_type === 'monthly';
      const [prodRes, payRes, salRes] = await Promise.all([
        fetch(`${API_BASE}/api/production/staff/${staff.id}`),
        fetch(`${API_BASE}/api/staff-payments/staff/${staff.id}`),
        isMonthly ? fetch(`${API_BASE}/api/salary/staff/${staff.id}/summary?days=30`) : Promise.resolve(null)
      ]);
      const prodData = await prodRes.json();
      const payData = await payRes.json();
      const salData = salRes ? await salRes.json() : null;
      setCashMemoData({
        production: prodData.status === 'ok' ? prodData.entries : [],
        payments: payData.status === 'ok' ? payData.payments : [],
        salary: salData && salData.status === 'ok' ? salData.salary : null
      });
    } catch (err) {
      console.error('ক্যাশ মেমো আনতে সমস্যা হয়েছে:', err);
    } finally {
      setCashMemoLoading(false);
    }
  };

  const submitProductionEntry = async () => {
    setKarigorError('');
    if (!karigorQty || parseFloat(karigorQty) <= 0) {
      setKarigorError('কত পিস তৈরি হয়েছে লিখুন');
      return;
    }
    setKarigorSubmitting(true);
    try {
      const url = editingProductionEntryId
        ? `${API_BASE}/api/production/${editingProductionEntryId}`
        : `${API_BASE}/api/production`;
      const method = editingProductionEntryId ? 'PUT' : 'POST';
      const body = editingProductionEntryId
        ? { quantity: karigorQty, product_id: karigorProduct.id }
        : { staff_id: karigorStaff.id, product_id: karigorProduct.id, quantity: karigorQty };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setShowKarigorHisab(false);
        setKarigorStep('select-staff');
        setKarigorStaff(null);
        setKarigorProduct(null);
        setKarigorQty('');
        setEditingProductionEntryId(null);
        fetchProductionSummaryAll();
        fetchRecentProduction();
      } else {
        setKarigorError(data.message || 'কিছু একটা ভুল হয়েছে');
      }
    } catch (err) {
      setKarigorError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setKarigorSubmitting(false);
    }
  };

  const fetchRecentProduction = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/production/recent-all?hours=3`);
      const data = await res.json();
      if (data.status === 'ok') {
        const map = {};
        for (const entry of data.recent) map[entry.staff_id] = entry;
        setRecentProduction(map);
      }
    } catch (err) {
      console.error('সাম্প্রতিক প্রোডাকশন এন্ট্রি আনতে সমস্যা হয়েছে:', err);
    }
  };

  const openEditProductionEntry = (entry, staff) => {
    setKarigorStaff(staff);
    setKarigorProduct({ id: entry.product_id, name: entry.product_name, sewing_price: entry.sewing_price });
    setKarigorQty(String(entry.quantity));
    setEditingProductionEntryId(entry.id);
    setShowKarigorHisab(true);
    setKarigorStep('enter-qty');
  };


  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseError('');
    if (!expenseForm.description.trim() || !expenseForm.amount) {
      setExpenseError('বিবরণ এবং টাকার পরিমাণ দিতে হবে');
      return;
    }
    setExpenseSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setExpenseForm({ description: '', amount: '', expense_date: '' });
        fetchExpenses();
      } else {
        setExpenseError(data.message || 'কিছু একটা ভুল হয়েছে');
      }
    } catch (err) {
      setExpenseError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/expenses`);
      const data = await res.json();
      if (data.status === 'ok') setExpenses(data.expenses);
    } catch (err) {
      console.error('খরচ লিস্ট আনতে সমস্যা হয়েছে:', err);
    }
  };

  const openExpenseReport = async () => {
    setShowExpenseReport(true);
    setExpenseReportLoading(true);
    try {
      const [expRes, payRes, partnerExpRes] = await Promise.all([
        fetch(`${API_BASE}/api/expenses`),
        fetch(`${API_BASE}/api/staff-payments`),
        fetch(`${API_BASE}/api/partners/expenses-all`)
      ]);
      const expData = await expRes.json();
      const payData = await payRes.json();
      const partnerExpData = await partnerExpRes.json();
      setAllExpenses(expData.status === 'ok' ? expData.expenses : []);
      setAllStaffPayments(payData.status === 'ok' ? payData.payments : []);
      setAllPartnerExpenses(partnerExpData.status === 'ok' ? partnerExpData.expenses : []);
    } catch (err) {
      console.error('খরচের বিস্তারিত আনতে সমস্যা হয়েছে:', err);
    } finally {
      setExpenseReportLoading(false);
    }
  };

  const submitWeeklyPayment = async () => {
    setWeeklyError('');
    if (!weeklyAmount || parseFloat(weeklyAmount) <= 0) {
      setWeeklyError('কত টাকা দেওয়া হয়েছে লিখুন');
      return;
    }
    setWeeklySubmitting(true);
    try {
      const url = editingPaymentId ? `${API_BASE}/api/staff-payments/${editingPaymentId}` : `${API_BASE}/api/staff-payments`;
      const method = editingPaymentId ? 'PUT' : 'POST';
      const body = editingPaymentId ? { amount: weeklyAmount } : { staff_id: weeklyStaff.id, amount: weeklyAmount };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setShowWeeklyPicker(false);
        setWeeklyStaff(null);
        setWeeklyAmount('');
        setEditingPaymentId(null);
        fetchRecentPayments();
      } else {
        setWeeklyError(data.message || 'কিছু একটা ভুল হয়েছে');
      }
    } catch (err) {
      setWeeklyError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setWeeklySubmitting(false);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/staff-payments/recent-all?hours=3`);
      const data = await res.json();
      if (data.status === 'ok') {
        const map = {};
        for (const p of data.recent) map[p.staff_id] = p;
        setRecentPayments(map);
      }
    } catch (err) {
      console.error('সাম্প্রতিক পেমেন্ট আনতে সমস্যা হয়েছে:', err);
    }
  };

  const openEditPayment = (payment, staff) => {
    setWeeklyStaff(staff);
    setWeeklyAmount(String(payment.amount));
    setEditingPaymentId(payment.id);
    setShowWeeklyPicker(true);
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
      const url = editingMachineId ? `${API_BASE}/api/machines/${editingMachineId}` : `${API_BASE}/api/machines`;
      const method = editingMachineId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...machineForm, port: parseInt(machineForm.port) || 4370 })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setMachineForm({ name: '', ip_address: '', port: '4370' });
        setEditingMachineId(null);
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

  const startEditMachine = (m) => {
    setEditingMachineId(m.id);
    setMachineForm({ name: m.name, ip_address: m.ip_address, port: String(m.port) });
    setMachineError('');
  };

  const cancelEditMachine = () => {
    setEditingMachineId(null);
    setMachineForm({ name: '', ip_address: '', port: '4370' });
  };

  const deleteMachine = async (id) => {
    try {
      await fetch(`${API_BASE}/api/machines/${id}`, { method: 'DELETE' });
      fetchMachines();
    } catch (err) {
      console.error('মেশিন ডিলিট করতে সমস্যা হয়েছে:', err);
    }
  };

  const deleteStaff = async (id, name) => {
    const sure = window.confirm(`${name}-কে ডিলিট করবেন? এটা আর ফেরত আনা যাবে না।`);
    if (!sure) return;
    try {
      await fetch(`${API_BASE}/api/staff/${id}`, { method: 'DELETE' });
      fetchStaff();
    } catch (err) {
      console.error('স্টাফ ডিলিট করতে সমস্যা হয়েছে:', err);
    }
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('maya_token') || ''}`
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/users`, { headers: authHeaders() });
      const data = await res.json();
      if (data.status === 'ok') setUsers(data.users);
    } catch (err) {
      console.error('ইউজার লিস্ট আনতে সমস্যা হয়েছে:', err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserError('');
    if (editingUserId) {
      // এডিট মোডে নাম/ফোন লাগবে না, শুধু ধরন আর পার্টনার স্ট্যাটাস আপডেট হয়
      setUserSubmitting(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/users/${editingUserId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ role: userForm.role, is_partner: userForm.is_partner })
        });
        const data = await res.json();
        if (data.status === 'ok') {
          setEditingUserId(null);
          setUserForm({ name: '', phone: '', password: '', role: 'moderator', is_partner: false });
          fetchUsers();
        } else {
          setUserError(data.message || 'কিছু একটা ভুল হয়েছে');
        }
      } catch (err) {
        setUserError('সার্ভারের সাথে কানেক্ট করা যায়নি');
      } finally {
        setUserSubmitting(false);
      }
      return;
    }
    if (!userForm.name.trim() || !userForm.phone.trim() || !userForm.password.trim()) {
      setUserError('নাম, ফোন এবং পাসওয়ার্ড দিতে হবে');
      return;
    }
    setUserSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setUserForm({ name: '', phone: '', password: '', role: 'moderator', is_partner: false });
        fetchUsers();
      } else {
        setUserError(data.message || 'কিছু একটা ভুল হয়েছে');
      }
    } catch (err) {
      setUserError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setUserSubmitting(false);
    }
  };

  const startEditUser = (u) => {
    setEditingUserId(u.id);
    setUserForm({ name: u.name, phone: u.phone, password: '', role: u.role, is_partner: !!u.is_partner });
    setUserError('');
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setUserForm({ name: '', phone: '', password: '', role: 'moderator', is_partner: false });
    setUserError('');
  };


  const deleteUser = async (id) => {
    try {
      await fetch(`${API_BASE}/api/auth/users/${id}`, { method: 'DELETE', headers: authHeaders() });
      fetchUsers();
    } catch (err) {
      console.error('ইউজার ডিলিট করতে সমস্যা হয়েছে:', err);
    }
  };

  // ==================== নিজের প্রোফাইল (নাম/ছবি/পাসওয়ার্ড) ====================

  const openEditProfile = () => {
    setProfileForm({ name: currentUser?.name || '', photo_url: currentUser?.photo_url || '', current_password: '', new_password: '' });
    setProfileError('');
    setProfileSuccess('');
    setShowProfileMenu(false);
    setShowEditProfile(true);
  };

  // ছবি ছোট করে (max 200x200) base64 বানিয়ে দেয়, যাতে ডাটাবেজে সহজে সেভ করা যায়
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = Math.round(height * (maxSize / width)); width = maxSize; }
        } else {
          if (height > maxSize) { width = Math.round(width * (maxSize / height)); height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setProfileForm((prev) => ({ ...prev, photo_url: compressed }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const submitProfileUpdate = async () => {
    setProfileError('');
    setProfileSuccess('');
    if (profileForm.new_password && !profileForm.current_password) {
      setProfileError('পাসওয়ার্ড বদলাতে হলে বর্তমান পাসওয়ার্ড দিতে হবে');
      return;
    }
    setProfileSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          name: profileForm.name,
          photo_url: profileForm.photo_url,
          current_password: profileForm.current_password || undefined,
          new_password: profileForm.new_password || undefined
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        onUpdateUser({ name: data.user.name, photo_url: data.user.photo_url });
        setProfileForm((prev) => ({ ...prev, current_password: '', new_password: '' }));
        setProfileSuccess('প্রোফাইল আপডেট হয়েছে ✅');
      } else {
        setProfileError(data.message || 'কিছু একটা ভুল হয়েছে');
      }
    } catch (err) {
      setProfileError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setProfileSubmitting(false);
    }
  };

  // ==================== পার্টনার হিসাব ====================

  const fetchPartners = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/partners`);
      const data = await res.json();
      if (data.status === 'ok') setPartners(data.partners);
    } catch (err) {
      console.error('পার্টনার লিস্ট আনতে সমস্যা হয়েছে:', err);
    }
  };

  const openPartnerLogPage = async () => {
    setShowPartnerLogPage(true);
    fetchPartners();
    setPartnerLogLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/partners/all-transactions`);
      const data = await res.json();
      setAllPartnerTransactions(data.status === 'ok' ? data.transactions : []);
    } catch (err) {
      console.error('পার্টনার লগ আনতে সমস্যা হয়েছে:', err);
    } finally {
      setPartnerLogLoading(false);
    }
  };

  const fetchAllPartnerTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/partners/all-transactions`);
      const data = await res.json();
      setAllPartnerTransactions(data.status === 'ok' ? data.transactions : []);
    } catch (err) {
      console.error('পার্টনার লগ আনতে সমস্যা হয়েছে:', err);
    }
  };

  const openPartnerDetail = async (partner) => {
    setSelectedPartner(partner);
    setPartnerDetailLoading(true);
    try {
      const [txnRes, sumRes] = await Promise.all([
        fetch(`${API_BASE}/api/partners/${partner.id}/transactions`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/partners/${partner.id}/summary`)
      ]);
      const txnData = await txnRes.json();
      const sumData = await sumRes.json();
      setPartnerTransactions(txnData.status === 'ok' ? txnData.transactions : []);
      setPartnerSummary(sumData.status === 'ok' ? sumData.summary : null);
    } catch (err) {
      console.error('পার্টনারের হিসাব আনতে সমস্যা হয়েছে:', err);
    } finally {
      setPartnerDetailLoading(false);
    }
  };

  const openAddPartnerTxn = (type) => {
    setPartnerTxnForm({ type, editingId: null, description: '', amount: '' });
    setPartnerTxnError('');
  };

  const openEditPartnerTxn = (txn) => {
    setPartnerTxnForm({ type: txn.type, editingId: txn.id, description: txn.description, amount: String(txn.amount) });
    setPartnerTxnError('');
  };

  const submitPartnerTxn = async () => {
    setPartnerTxnError('');
    if (!partnerTxnForm.description.trim() || !partnerTxnForm.amount || parseFloat(partnerTxnForm.amount) <= 0) {
      setPartnerTxnError('বিবরণ এবং টাকার পরিমাণ দিতে হবে');
      return;
    }
    setPartnerTxnSubmitting(true);
    try {
      const url = partnerTxnForm.editingId
        ? `${API_BASE}/api/partners/transactions/${partnerTxnForm.editingId}`
        : `${API_BASE}/api/partners/transactions`;
      const method = partnerTxnForm.editingId ? 'PUT' : 'POST';
      const body = partnerTxnForm.editingId
        ? { description: partnerTxnForm.description, amount: partnerTxnForm.amount }
        : { type: partnerTxnForm.type, description: partnerTxnForm.description, amount: partnerTxnForm.amount };
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (data.status === 'ok') {
        setPartnerTxnForm(null);
        if (selectedPartner) openPartnerDetail(selectedPartner);
        fetchAllPartnerTransactions();
      } else {
        setPartnerTxnError(data.message || 'কিছু একটা ভুল হয়েছে');
      }
    } catch (err) {
      setPartnerTxnError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setPartnerTxnSubmitting(false);
    }
  };

  // ==================== নোটিফিকেশন ====================

  const fetchUnreadCount = async () => {
    if (!currentUser?.is_partner) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`, { headers: authHeaders() });
      const data = await res.json();
      if (data.status === 'ok') setUnreadCount(data.count);
    } catch (err) {
      console.error('নোটিফিকেশন কাউন্ট আনতে সমস্যা হয়েছে:', err);
    }
  };

  const openNotifications = async () => {
    if (!currentUser?.is_partner) return;
    setShowNotifications(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { headers: authHeaders() });
      const data = await res.json();
      if (data.status === 'ok') setNotifications(data.notifications);
      await fetch(`${API_BASE}/api/notifications/mark-read`, { method: 'POST', headers: authHeaders() });
      setUnreadCount(0);
    } catch (err) {
      console.error('নোটিফিকেশন আনতে সমস্যা হয়েছে:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
      if (data.status === 'ok') setProducts(data.products);
    } catch (err) {
      console.error('প্রোডাক্ট লিস্ট আনতে সমস্যা হয়েছে:', err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setProductError('');
    if (!productForm.name.trim()) {
      setProductError('প্রোডাক্টের নাম দিতে হবে');
      return;
    }
    setProductSubmitting(true);
    try {
      const url = editingProductId ? `${API_BASE}/api/products/${editingProductId}` : `${API_BASE}/api/products`;
      const method = editingProductId ? 'PUT' : 'POST';
      const body = { name: productForm.name, sewing_price: parseFloat(productForm.sewing_price) || 0 };
      if (editingProductId) body.apply_to_existing = applyPriceToExisting;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setProductForm({ name: '', sewing_price: '' });
        setEditingProductId(null);
        setApplyPriceToExisting(false);
        fetchProducts();
      } else {
        setProductError(data.message || 'কিছু একটা ভুল হয়েছে');
      }
    } catch (err) {
      setProductError('সার্ভারের সাথে কানেক্ট করা যায়নি');
    } finally {
      setProductSubmitting(false);
    }
  };

  const startEditProduct = (p) => {
    setEditingProductId(p.id);
    setProductForm({ name: p.name, sewing_price: String(p.sewing_price) });
    setApplyPriceToExisting(false);
    setProductError('');
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setProductForm({ name: '', sewing_price: '' });
    setApplyPriceToExisting(false);
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 'ok') {
        fetchProducts();
      } else {
        alert(data.message || 'ডিলিট করা যায়নি');
      }
    } catch (err) {
      alert('সার্ভারের সাথে কানেক্ট করা যায়নি');
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
        setForm({ name: '', phone: '', designation: '', joining_date: '', rate_type: 'piece', rate_amount: '', machine_user_id: '' });
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
    { icon: <MapPin size={22} className="text-orange-700" />, bg: 'bg-orange-50', dot: 'bg-orange-600', value: `${absentCount}`, label: 'মোট অনুপস্থিত', onClick: openAbsentModal },
  ];

  const quickActions = [
    { icon: <RefreshCw size={24} className="text-rose-700" />, bg: 'bg-rose-100', label: 'পার্টনার হিসাব', onClick: openPartnerLogPage },
    { icon: <CreditCard size={24} className="text-orange-700" />, bg: 'bg-orange-100', label: 'ফান্ড/খরচ', onClick: () => setShowFundChoice(true) },
    { icon: <Users size={24} className="text-red-800" />, bg: 'bg-red-100', label: 'কারিগর হিসাব', onClick: () => { setShowKarigorHisab(true); setKarigorStep('select-staff'); setEditingProductionEntryId(null); setKarigorProduct(null); setKarigorQty(''); fetchProducts(); fetchRecentProduction(); } },
    { icon: <Server size={24} className="text-stone-700" />, bg: 'bg-stone-200', label: 'মেশিন যোগ করুন', onClick: () => { setShowMachineForm(true); fetchMachines(); fetchSyncInterval(); } },
    { icon: <PlusCircle size={24} className="text-amber-700" />, bg: 'bg-amber-100', label: 'নতুন প্রোডাক্ট যোগ করুন', onClick: () => { setShowProductForm(true); fetchProducts(); } },
    { icon: <CheckCircle2 size={24} className="text-yellow-700" />, bg: 'bg-yellow-100', label: 'খরচের বিস্তারিত', onClick: openExpenseReport },
    { icon: <HardHat size={24} className="text-emerald-700" />, bg: 'bg-emerald-100', label: 'স্টাফ যোগ করুন', onClick: () => setShowAddForm(true) },
    { icon: <Clock size={24} className="text-teal-700" />, bg: 'bg-teal-100', label: 'ডিউটি টাইম যুক্ত করুন', onClick: () => { setShowDutyForm(true); fetchDutySchedule(); } },
  ];

  const navItems = [
    { icon: <Home size={24} />, label: 'হোম', active: true },
    { icon: <Package size={24} />, label: 'প্রোডাকশন', active: false },
    { icon: <Bell size={24} />, label: 'অ্যালার্ট', active: false },
    { icon: <User size={24} />, label: 'প্রোফাইল', active: false },
  ];

  // পার্টনার হিসাব — ফুল পেজ পোস্ট লগ (মডাল না, পুরো পেজ)
  if (showPartnerLogPage) {
    return (
      <div className="min-h-screen bg-stone-100 flex justify-center">
        <div className="w-full max-w-sm bg-stone-100 min-h-screen relative pb-24 flex flex-col">
          {/* হেডার */}
          <div className="bg-gradient-to-br from-red-950 to-black text-white px-4 pt-6 pb-4 sticky top-0 z-10">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => setShowPartnerLogPage(false)} className="text-white">
                <ChevronRight size={22} className="rotate-180" />
              </button>
              <h1 className="text-lg font-bold">পার্টনার হিসাব</h1>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {partners.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openPartnerDetail(p)}
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white/30" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-red-950 flex items-center justify-center font-bold border-2 border-white/30">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-white/80 max-w-[64px] truncate">{p.name}</span>
                </button>
              ))}
              {partners.length === 0 && (
                <p className="text-xs text-white/60 py-3">এখনো কোনো পার্টনার যোগ করা হয়নি</p>
              )}
            </div>
          </div>

          {/* পোস্ট লগ / ফিড */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {partnerLogLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={28} className="animate-spin text-red-900" />
              </div>
            ) : allPartnerTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">এখনো কোনো পোস্ট নেই</p>
            ) : (
              <div className="flex flex-col gap-3">
                {allPartnerTransactions.map((t) => {
                  const isOwn = t.added_by_user_id === currentUser?.id;
                  return (
                    <div key={t.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      {!isOwn && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1">
                          {t.added_by_photo ? (
                            <img src={t.added_by_photo} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-[9px] font-bold">
                              {t.added_by_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs text-gray-500 font-medium">{t.added_by_name}</span>
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          isOwn ? 'bg-red-950 text-white rounded-tr-sm' : 'bg-white text-gray-900 shadow-sm rounded-tl-sm'
                        }`}
                      >
                        <p className="text-sm">{t.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm font-bold ${isOwn ? 'text-amber-300' : t.type === 'cash_in' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {t.type === 'cash_in' ? '+' : '−'}৳{t.amount}
                          </span>
                          <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                            {new Date(t.event_time).toLocaleString('bn-BD', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* নিচে কম্পোজ বার — শুধু পার্টনারদের জন্য */}
          {currentUser?.is_partner && (
            <div className="fixed bottom-0 w-full max-w-sm bg-white border-t border-gray-200 p-3 flex gap-3">
              <button
                onClick={() => openAddPartnerTxn('expense')}
                className="flex-1 bg-red-950 text-white rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 active:bg-red-900"
              >
                <CreditCard size={16} /> খরচ যোগ করুন
              </button>
              <button
                onClick={() => openAddPartnerTxn('cash_in')}
                className="flex-1 bg-emerald-600 text-white rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 active:bg-emerald-700"
              >
                <Wallet size={16} /> ক্যাশ যোগ করুন
              </button>
            </div>
          )}

          {/* পার্টনার হিসাব — বিস্তারিত (নামে ক্লিক করলে) */}
          {selectedPartner && (
            <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
              <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {selectedPartner.photo_url ? (
                      <img src={selectedPartner.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-900 text-white flex items-center justify-center font-bold text-sm">
                        {selectedPartner.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h2 className="text-lg font-bold text-gray-900">{selectedPartner.name}</h2>
                  </div>
                  <button onClick={() => setSelectedPartner(null)} className="text-gray-400">
                    <X size={22} />
                  </button>
                </div>

                {currentUser?.id === selectedPartner.id && (
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => openAddPartnerTxn('expense')}
                      className="flex-1 bg-red-950 text-white rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 active:bg-red-900"
                    >
                      <CreditCard size={16} /> খরচ যোগ করুন
                    </button>
                    <button
                      onClick={() => openAddPartnerTxn('cash_in')}
                      className="flex-1 bg-emerald-600 text-white rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 active:bg-emerald-700"
                    >
                      <Wallet size={16} /> ক্যাশ যোগ করুন
                    </button>
                  </div>
                )}

                {partnerDetailLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={28} className="animate-spin text-red-900" />
                  </div>
                ) : (
                  <>
                    {partnerSummary && (
                      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-4 mb-4">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-600">মোট ক্যাশ</span>
                          <span className="font-semibold text-emerald-700">৳ {partnerSummary.total_cash_in.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-600">মোট খরচ</span>
                          <span className="font-semibold text-red-700">৳ {partnerSummary.total_expense.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base pt-2 border-t border-gray-200 mt-1">
                          <span className="font-bold text-gray-900">বর্তমান ব্যালেন্স</span>
                          <span className="font-extrabold text-red-950">৳ {partnerSummary.balance.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {partnerTransactions.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">এখনো কোনো এন্ট্রি নেই</p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {partnerTransactions.map((t) => (
                          <div
                            key={t.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900">{t.description}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(t.event_time).toLocaleString('bn-BD')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-sm font-bold ${t.type === 'cash_in' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {t.type === 'cash_in' ? '+' : '−'}৳{t.amount}
                              </span>
                              {t.added_by_user_id === currentUser?.id && (
                                <button
                                  onClick={() => openEditPartnerTxn(t)}
                                  className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"
                                >
                                  <Pencil size={13} className="text-amber-700" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* নতুন/এডিট এন্ট্রি ফর্ম */}
          {partnerTxnForm && (
            <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
              <div className="w-full max-w-sm bg-white rounded-t-3xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">
                    {partnerTxnForm.editingId
                      ? 'এন্ট্রি এডিট করুন'
                      : partnerTxnForm.type === 'expense'
                      ? 'খরচ যোগ করুন'
                      : 'ক্যাশ যোগ করুন'}
                  </h2>
                  <button onClick={() => setPartnerTxnForm(null)} className="text-gray-400">
                    <X size={22} />
                  </button>
                </div>

                <label className="text-xs font-semibold text-gray-500">
                  {partnerTxnForm.type === 'expense' ? 'কি কাজে খরচ হয়েছে?' : 'এই ক্যাশ কোথা থেকে এসেছে?'}
                </label>
                <input
                  type="text"
                  value={partnerTxnForm.description}
                  onChange={(e) => setPartnerTxnForm({ ...partnerTxnForm, description: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                  placeholder={partnerTxnForm.type === 'expense' ? 'যেমন: কাপড় কেনা' : 'যেমন: ব্যাংক থেকে তোলা'}
                  autoFocus
                />

                <label className="text-xs font-semibold text-gray-500 mt-4 block">কত টাকা?</label>
                <input
                  type="number"
                  value={partnerTxnForm.amount}
                  onChange={(e) => setPartnerTxnForm({ ...partnerTxnForm, amount: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                  placeholder="যেমন: ৫০০০"
                />

                {partnerTxnError && <p className="text-sm text-red-600 mt-3">{partnerTxnError}</p>}

                <button
                  onClick={submitPartnerTxn}
                  disabled={partnerTxnSubmitting}
                  className="w-full mt-5 bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
                >
                  {partnerTxnSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {partnerTxnSubmitting ? 'সেভ হচ্ছে...' : partnerTxnForm.editingId ? 'আপডেট করুন' : 'সেভ করুন'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex justify-center">
      <div className={`w-full max-w-sm bg-stone-100 min-h-screen relative pb-20 ${(cashMemoStaff || showExpenseReport) ? 'print:hidden' : ''}`}>

        {/* Header */}
        <div className="bg-gradient-to-br from-red-950 to-black rounded-b-3xl px-6 pt-8 pb-14 text-white">
          <p className="text-sm text-white/70 flex items-center gap-1.5">আসসালামু আলাইকুম <span>✨</span></p>
          <h1 className="text-2xl font-bold mt-1 tracking-wide">Maya Garments</h1>
          <p className="text-sm text-white/70 mt-1">ফ্যাক্টরি ড্যাশবোর্ডে স্বাগতম</p>
          <div className="absolute top-8 right-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <button
              onClick={() => setShowProfileMenu(true)}
              className="w-11 h-11 rounded-full bg-amber-500 text-red-950 flex items-center justify-center font-bold overflow-hidden"
            >
              {currentUser?.photo_url ? (
                <img src={currentUser.photo_url} alt="" className="w-full h-full object-cover" />
              ) : currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'M'}
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mx-4 -mt-10 bg-white rounded-2xl shadow-md border-2 border-gray-200 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Wallet size={22} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 tracking-wide">মোট ব্যালেন্স (কারিগরদের পাওনা)</p>
                <p className="text-gray-800 font-medium">
                  {balanceHidden
                    ? 'দেখতে "ব্যালেন্স দেখুন" চাপুন'
                    : `৳ ${staffList.reduce((sum, s) => sum + computeStaffDue(s, paymentsSummaryAll, salarySummaryAll), 0).toFixed(2)}`}
                </p>
              </div>
            </div>
            {balanceTrend && (
              <div className={`shrink-0 rounded-xl px-2.5 py-1.5 text-center border ${balanceTrend.direction === 'up' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-xs font-bold flex items-center gap-0.5 ${balanceTrend.direction === 'up' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {balanceTrend.direction === 'up' ? '↑' : '↓'} {Math.abs(balanceTrend.percent_change)}%
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">এই মাসে</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleShowBalance}
              className="flex-1 border border-red-950 text-red-950 rounded-full py-2.5 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-50"
            >
              <Eye size={16} /> ব্যালেন্স দেখুন
            </button>
            <button
              onClick={handleShowBalanceDetail}
              className="flex-1 bg-red-950 text-white rounded-full py-2.5 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900"
            >
              <FileText size={16} /> বিস্তারিত দেখুন
            </button>
          </div>
        </div>

        {/* সারসংক্ষেপ */}
        <div className="px-4 mt-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">সারসংক্ষেপ</h2>
          {lastUpdatedAt && (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              সর্বশেষ আপডেট: {lastUpdatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </p>
          )}
        </div>

        {/* Stat cards */}
        <div className="flex gap-3 px-4 mt-3">
          {stats.map((s, i) => (
            <div key={i} onClick={s.onClick} className="flex-1 bg-white rounded-2xl p-3.5 shadow-md border-2 border-gray-200 active:opacity-80 cursor-pointer">
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
                <div className={`w-14 h-14 rounded-2xl ${a.bg} border-2 border-gray-200 flex items-center justify-center shadow-md`}>
                  {a.icon}
                </div>
                <span className="text-xs text-gray-700 text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* স্টাফ/কারিগর লিস্ট — প্রিভিউ */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">স্টাফ/কারিগর লিস্ট</h2>
            <button onClick={() => setShowEmployeeModal(true)} className="text-xs font-semibold text-red-900 flex items-center gap-1">
              সব দেখুন →
            </button>
          </div>
          <button
            onClick={() => setShowEmployeeModal(true)}
            className="w-full bg-white rounded-2xl shadow-md border-2 border-gray-200 p-4 flex items-center gap-3 active:opacity-80 text-left"
          >
            <div className="flex -space-x-3 shrink-0">
              {staffList.slice(0, 3).map((s, i) => (
                <div
                  key={s.id}
                  className={`w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white ${
                    ['bg-red-900', 'bg-amber-600', 'bg-emerald-700'][i % 3]
                  }`}
                >
                  {s.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">মোট স্টাফ {staffList.length} জন</p>
              <p className="text-xs text-gray-500">আজ {presentCount} জন উপস্থিত</p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${staffList.length ? Math.round((presentCount / staffList.length) * 100) : 0}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-emerald-700">
                {staffList.length ? Math.round((presentCount / staffList.length) * 100) : 0}%
              </p>
            </div>
          </button>
        </div>

        {/* Help banner */}
        <div className="mx-4 mt-6 bg-white rounded-2xl shadow-md border-2 border-gray-200 p-4 flex items-center gap-3 active:bg-gray-50">
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
            <button
              key={i}
              onClick={n.label === 'অ্যালার্ট' ? openNotifications : undefined}
              className={`relative flex flex-col items-center gap-1 px-4 ${n.active ? 'text-red-950' : 'text-gray-400'}`}
            >
              {n.icon}
              {n.label === 'অ্যালার্ট' && unreadCount > 0 && (
                <span className="absolute -top-0.5 right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
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
                        <button
                          onClick={() => openStaffDetail(s.id, s.name)}
                          className="font-semibold text-gray-900 text-sm text-left active:text-red-900"
                        >
                          {s.name}
                        </button>
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
                        ) : productionSummary[s.id]?.total_amount > 0 ? (
                          <p className="text-sm font-semibold text-red-900">৳ {productionSummary[s.id].total_amount}</p>
                        ) : (
                          <p className="text-sm font-semibold text-gray-400">—</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {s.rate_type === 'monthly' ? 'মাসিক' : 'প্রোডাকশন'}
                        </p>
                        <button
                          onClick={() => deleteStaff(s.id, s.name)}
                          className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center mt-2 ml-auto"
                        >
                          <Trash2 size={13} className="text-red-700" />
                        </button>
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
                  <label className="text-xs font-semibold text-gray-500">মেশিন ইউজার আইডি (ফিঙ্গারপ্রিন্ট)</label>
                  <input
                    type="text"
                    value={form.machine_user_id}
                    onChange={(e) => setForm({ ...form, machine_user_id: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: 3"
                  />
                  <p className="text-xs text-gray-400 mt-1 leading-snug">
                    প্রথমে মেশিনে গিয়ে এই কারিগরের আঙুলের ছাপ রেকর্ড করুন (User Management থেকে), তারপর মেশিন যে নাম্বারটা দেয় সেটা এখানে বসান। না দিলে ফিঙ্গারপ্রিন্ট দিয়ে উপস্থিতি গণনা হবে না, শুধু ম্যানুয়ালি করতে হবে।
                  </p>
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

              {(() => {
                const activeToday = attendanceToday.filter((s) => s.status === 'present' || s.status === 'on_break');
                const formatTime = (t) => t ? new Date(t).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : null;
                return activeToday.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">এই মুহূর্তে কেউ উপস্থিত নেই</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeToday.map((s) => {
                      const st = STATUS_LABELS[s.status] || STATUS_LABELS.not_marked;
                      return (
                        <button
                          key={s.staff_id}
                          onClick={() => openStaffDetail(s.staff_id, s.name)}
                          className={`text-left bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3 border-l-4 ${st.border} active:opacity-80`}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{s.designation || 'পদবি নেই'}</p>
                            <div className="text-xs text-gray-500 mt-1.5 space-y-0.5">
                              {s.check_in && <p>উপস্থিতি: {formatTime(s.check_in)}</p>}
                              {s.break_start && (
                                <p>লাঞ্চ: {formatTime(s.break_start)}{s.break_end ? ` - ${formatTime(s.break_end)}` : ' (চলছে)'}</p>
                              )}
                              {s.check_out && <p>ডিউটি শেষ: {formatTime(s.check_out)}</p>}
                              {s.late_minutes > 0 && (
                                <p className="text-orange-600 font-medium">লেট: {s.late_minutes} মিনিট</p>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.color} shrink-0`}>
                            {st.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Absent Modal (আজকের অনুপস্থিত) */}
        {showAbsentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">আজকের অনুপস্থিত</h2>
                <button onClick={() => setShowAbsentModal(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              {(() => {
                const absentToday = attendanceToday.filter((s) => s.status === 'not_marked');
                return absentToday.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">আজ সবাই উপস্থিত হয়েছে 🎉</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {absentToday.map((s) => (
                      <button
                        key={s.staff_id}
                        onClick={() => openStaffDetail(s.staff_id, s.name)}
                        className="text-left bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3 border-l-4 border-red-500 active:opacity-80"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{s.designation || 'পদবি নেই'}</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 shrink-0">
                          অনুপস্থিত
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}
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

        {/* Staff Detail Modal — attendance + production + payments একসাথে */}
        {staffDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">{staffDetail.name} — বিস্তারিত</h2>
                <button onClick={() => setStaffDetail(null)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              {staffDetailLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={28} className="animate-spin text-red-900" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* ডিউটি/উপস্থিতি */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">গত ৩০ দিনের উপস্থিতি</h3>
                    {staffDetail.attendance ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => openDetailView('attendance')} className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-emerald-500 active:opacity-80">
                          <p className="text-2xl font-bold text-gray-900">{staffDetail.attendance.present_days}</p>
                          <p className="text-xs text-gray-500 mt-0.5">উপস্থিত দিন</p>
                        </button>
                        <button onClick={() => openDetailView('attendance')} className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-red-500 active:opacity-80">
                          <p className="text-2xl font-bold text-gray-900">{staffDetail.attendance.absent_days}</p>
                          <p className="text-xs text-gray-500 mt-0.5">অনুপস্থিত দিন</p>
                        </button>
                        <button onClick={() => openDetailView('attendance')} className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-red-900 active:opacity-80">
                          <p className="text-2xl font-bold text-gray-900">{staffDetail.attendance.present_hours}</p>
                          <p className="text-xs text-gray-500 mt-0.5">উপস্থিত ঘণ্টা</p>
                        </button>
                        <button onClick={() => openDetailView('attendance')} className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-amber-500 active:opacity-80">
                          <p className="text-2xl font-bold text-gray-900">{staffDetail.attendance.break_hours}</p>
                          <p className="text-xs text-gray-500 mt-0.5">ব্রেক ঘণ্টা</p>
                        </button>
                        <button onClick={() => openDetailView('attendance')} className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-orange-500 active:opacity-80 col-span-2">
                          <p className="text-2xl font-bold text-gray-900">{staffDetail.attendance.late_hours}</p>
                          <p className="text-xs text-gray-500 mt-0.5">মোট লেট (ঘণ্টা)</p>
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">ডেটা পাওয়া যায়নি</p>
                    )}
                  </div>

                  {/* প্রোডাকশন / বেতন */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">
                      {staffDetail.rate_type === 'monthly' ? 'বেতন হিসাব' : 'প্রোডাকশন হিসাব'}
                    </h3>
                    {staffDetail.rate_type === 'monthly' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-amber-500">
                          <p className="text-2xl font-bold text-gray-900">৳ {staffDetail.rate_amount || 0}</p>
                          <p className="text-xs text-gray-500 mt-0.5">আপনার বেতন</p>
                        </div>
                        <button onClick={() => openCashMemo(staffDetail)} className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-red-900 active:opacity-80">
                          <p className="text-2xl font-bold text-gray-900">৳ {staffDetail.salary?.total_salary_earned ?? 0}</p>
                          <p className="text-xs text-gray-500 mt-0.5">আজকে পর্যন্ত মোট বেতন</p>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => openDetailView('production')} className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-amber-500 active:opacity-80">
                          <p className="text-2xl font-bold text-gray-900">{staffDetail.production?.total_quantity || 0}</p>
                          <p className="text-xs text-gray-500 mt-0.5">মোট পিস</p>
                        </button>
                        <button onClick={() => openDetailView('production')} className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-red-900 active:opacity-80">
                          <p className="text-2xl font-bold text-gray-900">৳ {staffDetail.production?.total_amount || 0}</p>
                          <p className="text-xs text-gray-500 mt-0.5">মোট আয়</p>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* পেমেন্ট + পাওনা */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">সাপ্তাহিক পেমেন্ট হিসাব</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => openDetailView('payments')} className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-emerald-500 active:opacity-80">
                        <p className="text-2xl font-bold text-gray-900">৳ {staffDetail.payments?.total_paid || 0}</p>
                        <p className="text-xs text-gray-500 mt-0.5">মোট দেওয়া হয়েছে</p>
                      </button>
                      <button onClick={() => openDetailView('payments')} className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-gray-300 active:opacity-80">
                        <p className="text-2xl font-bold text-gray-900">{staffDetail.payments?.payment_count || 0}</p>
                        <p className="text-xs text-gray-500 mt-0.5">মোট বার</p>
                      </button>
                      <button
                        onClick={() => openCashMemo(staffDetail)}
                        className="text-left bg-white rounded-2xl shadow-md p-4 border-l-4 border-red-950 active:opacity-80 col-span-2"
                      >
                        <p className="text-2xl font-bold text-gray-900">
                          ৳ {(
                            staffDetail.rate_type === 'monthly'
                              ? parseFloat(staffDetail.salary?.total_due ?? (parseFloat(staffDetail.rate_amount || 0) - parseFloat(staffDetail.payments?.total_paid || 0)))
                              : (parseFloat(staffDetail.production?.total_amount || 0) - parseFloat(staffDetail.payments?.total_paid || 0))
                          ).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">মোট পাওনা — ক্যাশ মেমো দেখতে ক্লিক করুন</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* বিস্তারিত ড্রিল-ডাউন লিস্ট (attendance/production/payments) */}
        {staffDetail && detailView && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {detailView === 'attendance' && 'উপস্থিতির বিস্তারিত'}
                  {detailView === 'production' && 'প্রোডাকশনের বিস্তারিত'}
                  {detailView === 'payments' && 'পেমেন্টের বিস্তারিত'}
                </h2>
                <button onClick={() => setDetailView(null)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              {detailListLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={28} className="animate-spin text-red-900" />
                </div>
              ) : detailList.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">কোনো তথ্য পাওয়া যায়নি</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {detailView === 'attendance' && detailList.map((d, i) => (
                    <div key={i} className={`bg-white rounded-2xl shadow-md p-4 border-l-4 ${d.status === 'present' ? 'border-emerald-500' : 'border-red-500'}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 text-sm">{d.date}</p>
                        {d.status === 'absent' ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">অনুপস্থিত</span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">উপস্থিত</span>
                        )}
                      </div>
                      {d.status === 'present' && (
                        <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                          <p>ঢুকেছে: {d.check_in ? new Date(d.check_in).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                          <p>বের হয়েছে: {d.check_out ? new Date(d.check_out).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                          {d.break_start && (
                            <p>ব্রেক: {new Date(d.break_start).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })} - {d.break_end ? new Date(d.break_end).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                          )}
                          {d.late_minutes > 0 && <p className="text-orange-600 font-medium">লেট: {d.late_minutes} মিনিট</p>}
                        </div>
                      )}
                    </div>
                  ))}

                  {detailView === 'production' && detailList.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between border-l-4 border-amber-500">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.product_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.entry_date?.slice(0, 10)} · {p.quantity} পিস</p>
                      </div>
                      <p className="text-sm font-semibold text-red-900">৳ {p.amount}</p>
                    </div>
                  ))}

                  {detailView === 'payments' && detailList.map((pay) => (
                    <div key={pay.id} className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between border-l-4 border-emerald-500">
                      <p className="text-xs text-gray-500">{pay.payment_date?.slice(0, 10)}</p>
                      <p className="text-sm font-semibold text-red-900">৳ {pay.amount}</p>
                    </div>
                  ))}
                </div>
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
                <h2 className="text-lg font-bold text-gray-900">
                  {editingMachineId ? 'মেশিন এডিট করুন' : 'ফিঙ্গারপ্রিন্ট মেশিন যোগ করুন'}
                </h2>
                <button onClick={() => { setShowMachineForm(false); cancelEditMachine(); }} className="text-gray-400">
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
                  {machineSubmitting ? 'সেভ হচ্ছে...' : editingMachineId ? 'আপডেট করুন' : 'সেভ করুন'}
                </button>
                {editingMachineId && (
                  <button
                    type="button"
                    onClick={cancelEditMachine}
                    className="w-full text-center text-sm text-gray-500 py-1"
                  >
                    বাতিল করুন
                  </button>
                )}
              </form>

              {machines.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">যোগ করা মেশিনসমূহ</h3>
                  <div className="flex flex-col gap-3">
                    {machines.map((m) => (
                      <div key={m.id} className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-red-900 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{m.ip_address}:{m.port}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => startEditMachine(m)}
                            className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center"
                          >
                            <Pencil size={15} className="text-amber-700" />
                          </button>
                          <button
                            onClick={() => deleteMachine(m.id)}
                            className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center"
                          >
                            <Trash2 size={15} className="text-red-700" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 bg-amber-50 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-1">সিঙ্ক ইন্টারভাল</h3>
                <p className="text-xs text-gray-500 mb-3">কত সেকেন্ড পরপর মেশিন থেকে ডেটা টানা হবে (সর্বনিম্ন ১০ সেকেন্ড)</p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="10"
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900 bg-white"
                    placeholder="যেমন: 30"
                  />
                  <button
                    onClick={saveSyncInterval}
                    disabled={syncIntervalSaving}
                    className="bg-red-950 text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 active:bg-red-900 disabled:opacity-60"
                  >
                    {syncIntervalSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {syncIntervalSaved ? 'সেভ হয়েছে' : 'সেভ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Form */}
        {showProductForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingProductId ? 'প্রোডাক্ট এডিট করুন' : 'নতুন প্রোডাক্ট যোগ করুন'}
                </h2>
                <button onClick={() => { setShowProductForm(false); cancelEditProduct(); }} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">প্রোডাক্টের নাম *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: শার্ট, প্যান্ট"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">সেলাই মূল্য (৳ প্রতি পিস)</label>
                  <input
                    type="number"
                    value={productForm.sewing_price}
                    onChange={(e) => setProductForm({ ...productForm, sewing_price: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: ৩৫"
                  />
                </div>

                {editingProductId && (
                  <label className="flex items-start gap-2.5 bg-amber-50 rounded-xl p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyPriceToExisting}
                      onChange={(e) => setApplyPriceToExisting(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span className="text-xs text-gray-700">
                      কারিগরের আগের হিসাবেও এই দাম যোগ করতে চান? (টিক দিলে আগের সব এন্ট্রি নতুন দামে রিক্যালকুলেট হবে)
                    </span>
                  </label>
                )}

                {productError && <p className="text-sm text-red-600">{productError}</p>}

                <button
                  type="submit"
                  disabled={productSubmitting}
                  className="w-full bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
                >
                  {productSubmitting ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
                  {productSubmitting ? 'সেভ হচ্ছে...' : editingProductId ? 'আপডেট করুন' : 'সেভ করুন'}
                </button>
                {editingProductId && (
                  <button type="button" onClick={cancelEditProduct} className="w-full text-center text-sm text-gray-500 py-1">
                    বাতিল করুন
                  </button>
                )}
              </form>

              {products.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">প্রোডাক্ট লিস্ট</h3>
                  <div className="flex flex-col gap-3">
                    {products.map((p) => (
                      <div key={p.id} className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between border-l-4 border-amber-500">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                          <p className="text-sm font-semibold text-red-900 mt-0.5">৳ {p.sewing_price}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => startEditProduct(p)}
                            className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center"
                          >
                            <Pencil size={15} className="text-amber-700" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center"
                          >
                            <Trash2 size={15} className="text-red-700" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* কারিগর হিসাব — Step 1: স্টাফ সিলেক্ট (শুধু প্রোডাকশন-টাইপ কারিগর) */}
        {showKarigorHisab && karigorStep === 'select-staff' && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">কোন কারিগর?</h2>
                <button onClick={() => setShowKarigorHisab(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>
              {staffList.filter((s) => s.rate_type !== 'monthly').length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">এখনো কোনো প্রোডাকশন-টাইপ কারিগর যোগ করা হয়নি</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {staffList.filter((s) => s.rate_type !== 'monthly').map((s) => {
                    const recent = recentProduction[s.id];
                    return (
                      <div
                        key={s.id}
                        className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-amber-500"
                      >
                        <button
                          onClick={() => { setKarigorStaff(s); setKarigorStep('select-product'); }}
                          className="w-full text-left flex items-center justify-between gap-3 active:opacity-80"
                        >
                          <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.designation || 'পদবি নেই'}</p>
                        </button>
                        {recent && (
                          <button
                            onClick={() => openEditProductionEntry(recent, s)}
                            className="mt-2 w-full text-left text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5"
                          >
                            ইতিমধ্যে একবার হিসাব যোগ করা হয়েছে — এডিট করতে ট্যাপ করুন
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* কারিগর হিসাব — Step 2: প্রোডাক্ট সিলেক্ট */}
        {showKarigorHisab && karigorStep === 'select-product' && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">{karigorStaff?.name} — কোন প্রোডাক্ট?</h2>
                <button onClick={() => { setShowKarigorHisab(false); setKarigorStep('select-staff'); }} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>
              {products.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">এখনো কোনো প্রোডাক্ট যোগ করা হয়নি</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setKarigorProduct(p); setKarigorStep('enter-qty'); }}
                      className="text-left bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3 border-l-4 border-amber-500 active:opacity-80"
                    >
                      <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                      <p className="text-sm font-semibold text-red-900">৳ {p.sewing_price} / পিস</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* কারিগর হিসাব — Step 3: পিস সংখ্যা লিখুন, অটো ক্যালকুলেশন */}
        {showKarigorHisab && karigorStep === 'enter-qty' && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingProductionEntryId && <span className="text-emerald-700 text-xs block mb-0.5">এডিট করছেন</span>}
                  {karigorStaff?.name} — {karigorProduct?.name}
                </h2>
                <button onClick={() => { setShowKarigorHisab(false); setEditingProductionEntryId(null); }} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <label className="text-xs font-semibold text-gray-500">কত পিস তৈরি হয়েছে?</label>
              <input
                type="number"
                value={karigorQty}
                onChange={(e) => setKarigorQty(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                placeholder="যেমন: ৫০"
                autoFocus
              />

              <div className="mt-4 bg-amber-50 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">মোট হবে</span>
                <span className="text-lg font-bold text-red-900">
                  ৳ {karigorQty && !isNaN(karigorQty) ? (parseFloat(karigorQty) * parseFloat(karigorProduct?.sewing_price || 0)).toFixed(2) : '0.00'}
                </span>
              </div>

              {karigorError && <p className="text-sm text-red-600 mt-3">{karigorError}</p>}

              <button
                onClick={submitProductionEntry}
                disabled={karigorSubmitting}
                className="w-full mt-5 bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
              >
                {karigorSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {karigorSubmitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </button>
            </div>
          </div>
        )}

        {/* ফান্ড/খরচ — অপশন চয়েস */}
        {showFundChoice && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">ফান্ড/খরচ</h2>
                <button onClick={() => setShowFundChoice(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setShowFundChoice(false); setShowExpenseForm(true); fetchExpenses(); }}
                  className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-3 border-l-4 border-red-900 active:opacity-80 text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                    <CreditCard size={20} className="text-red-800" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">ফ্যাক্টরি খরচ</p>
                    <p className="text-xs text-gray-500">কারেন্ট বিল, ভাড়া ইত্যাদি</p>
                  </div>
                </button>
                <button
                  onClick={() => { setShowFundChoice(false); setShowWeeklyPicker(true); setEditingPaymentId(null); setWeeklyStaff(null); setWeeklyAmount(''); fetchRecentPayments(); }}
                  className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-3 border-l-4 border-amber-500 active:opacity-80 text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Wallet size={20} className="text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">স্টাফ/কারিগরের সাপ্তাহিক</p>
                    <p className="text-xs text-gray-500">এডভান্স/সাপ্তাহিক পেমেন্ট দিন</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ফ্যাক্টরি খরচ ফর্ম */}
        {showExpenseForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">ফ্যাক্টরি খরচ যোগ করুন</h2>
                <button onClick={() => setShowExpenseForm(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">বিবরণ *</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: কারেন্ট বিল"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                    placeholder="যেমন: ৫০০০"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">তারিখ</label>
                  <input
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                  />
                </div>

                {expenseError && <p className="text-sm text-red-600">{expenseError}</p>}

                <button
                  type="submit"
                  disabled={expenseSubmitting}
                  className="w-full bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
                >
                  {expenseSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                  {expenseSubmitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                </button>
              </form>

              {expenses.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">সাম্প্রতিক খরচ</h3>
                  <div className="flex flex-col gap-3">
                    {expenses.map((ex) => (
                      <div key={ex.id} className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between border-l-4 border-red-900">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{ex.description}</p>
                          <p className="text-xs text-gray-400">{ex.expense_date?.slice(0, 10)}</p>
                        </div>
                        <p className="text-sm font-semibold text-red-900">৳ {ex.amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* স্টাফ/কারিগরের সাপ্তাহিক — স্টাফ পিকার */}
        {showWeeklyPicker && !weeklyStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">কাকে দিবেন?</h2>
                <button onClick={() => setShowWeeklyPicker(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {staffList.map((s) => {
                  const recent = recentPayments[s.id];
                  return (
                    <div key={s.id} className="bg-white rounded-2xl shadow-md p-4 border-l-4 border-amber-500">
                      <button
                        onClick={() => setWeeklyStaff(s)}
                        className="w-full text-left flex items-center justify-between gap-3 active:opacity-80"
                      >
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.designation || 'পদবি নেই'}</p>
                      </button>
                      {recent && (
                        <button
                          onClick={() => openEditPayment(recent, s)}
                          className="mt-2 w-full text-left text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5"
                        >
                          ইতিমধ্যে একবার হিসাব যোগ করা হয়েছে — এডিট করতে ট্যাপ করুন
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* স্টাফ/কারিগরের সাপ্তাহিক — টাকার পরিমাণ */}
        {showWeeklyPicker && weeklyStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingPaymentId && <span className="text-emerald-700 text-xs block mb-0.5">এডিট করছেন</span>}
                  {weeklyStaff.name} — সাপ্তাহিক পেমেন্ট
                </h2>
                <button onClick={() => { setShowWeeklyPicker(false); setWeeklyStaff(null); setEditingPaymentId(null); }} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <label className="text-xs font-semibold text-gray-500">কত টাকা দেওয়া হয়েছে?</label>
              <input
                type="number"
                value={weeklyAmount}
                onChange={(e) => setWeeklyAmount(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                placeholder="যেমন: ২০০০"
                autoFocus
              />

              {weeklyError && <p className="text-sm text-red-600 mt-3">{weeklyError}</p>}

              <button
                onClick={submitWeeklyPayment}
                disabled={weeklySubmitting}
                className="w-full mt-5 bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
              >
                {weeklySubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {weeklySubmitting ? 'সেভ হচ্ছে...' : editingPaymentId ? 'আপডেট করুন' : 'সেভ করুন'}
              </button>
            </div>
          </div>
        )}

        {/* মোট ব্যালেন্স — বিস্তারিত (কে কত পাবে) */}
        {showBalanceDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 print:hidden">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">কে কত পাবে</h2>
                <button onClick={() => setShowBalanceDetail(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              {staffList.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">এখনো কোনো স্টাফ যোগ করা হয়নি</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {staffList.map((s) => {
                    const due = computeStaffDue(s, paymentsSummaryAll, salarySummaryAll);
                    return (
                      <button
                        key={s.id}
                        onClick={() => openCashMemo(s)}
                        className={`text-left bg-white rounded-2xl shadow-md p-4 flex items-center justify-between gap-3 border-l-4 ${
                          s.rate_type === 'monthly' ? 'border-red-900' : 'border-amber-500'
                        } active:opacity-80`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{s.designation || 'পদবি নেই'}</p>
                        </div>
                        <p className={`text-sm font-semibold ${due > 0 ? 'text-red-900' : 'text-emerald-700'}`}>
                          ৳ {due.toFixed(2)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ক্যাশ মেমো / রিসিট — প্রিন্ট করা যাবে */}
        {cashMemoStaff && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 print:bg-white print:static print:block">
            <div className="w-full max-w-sm bg-white rounded-t-3xl print:rounded-none p-6 max-h-[85vh] print:max-h-none overflow-y-auto print:overflow-visible">
              <div className="flex items-center justify-between mb-4 print:hidden">
                <h2 className="text-lg font-bold text-gray-900">ক্যাশ মেমো</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center"
                  >
                    <Printer size={16} className="text-red-800" />
                  </button>
                  <button onClick={() => { setCashMemoStaff(null); setCashMemoData(null); }} className="text-gray-400">
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* মেমো হেডার */}
              <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                <h1 className="text-xl font-extrabold text-red-950 tracking-wide">Maya Garments</h1>
                <p className="text-xs text-gray-500 mt-0.5">কারিগর হিসাব — ক্যাশ মেমো</p>
                <p className="text-xs text-gray-400 mt-1">তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
              </div>

              <div className="mb-4">
                <p className="font-semibold text-gray-900">{cashMemoStaff.name}</p>
                <p className="text-xs text-gray-500">{cashMemoStaff.designation || 'পদবি নেই'} {cashMemoStaff.phone ? `· ${cashMemoStaff.phone}` : ''}</p>
              </div>

              {cashMemoLoading ? (
                <div className="flex justify-center py-10 print:hidden">
                  <Loader2 size={28} className="animate-spin text-red-900" />
                </div>
              ) : cashMemoData ? (
                <>
                  {cashMemoStaff.rate_type === 'monthly' && cashMemoData.salary && (
                    <div className="mb-4">
                      <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">মাসিক বেতন</span>
                        <span className="text-lg font-bold text-red-950">৳ {cashMemoStaff.rate_amount}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">দিন-ভিত্তিক হিসাব (দৈনিক রেট ৳{cashMemoData.salary.daily_rate})</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500">
                            <td className="py-1.5">তারিখ</td>
                            <td className="py-1.5">অবস্থা</td>
                            <td className="py-1.5 text-right">লেট (মিনিট)</td>
                            <td className="py-1.5 text-right">টাকা</td>
                          </tr>
                        </thead>
                        <tbody>
                          {cashMemoData.salary.breakdown.map((d, i) => (
                            <tr key={i} className="border-b border-gray-100">
                              <td className="py-1.5">{d.date}</td>
                              <td className="py-1.5">
                                {d.status === 'present' && 'উপস্থিত'}
                                {d.status === 'absent' && 'অনুপস্থিত'}
                                {d.status === 'holiday' && 'শুক্রবার (ছুটি)'}
                              </td>
                              <td className="py-1.5 text-right">{d.late_minutes || '—'}</td>
                              <td className="py-1.5 text-right">৳{d.day_earned}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {cashMemoStaff.rate_type !== 'monthly' && cashMemoData.production.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">প্রোডাকশন এন্ট্রি</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500">
                            <td className="py-1.5">তারিখ</td>
                            <td className="py-1.5">প্রোডাক্ট</td>
                            <td className="py-1.5 text-right">পিস</td>
                            <td className="py-1.5 text-right">টাকা</td>
                          </tr>
                        </thead>
                        <tbody>
                          {cashMemoData.production.map((p) => (
                            <tr key={p.id} className="border-b border-gray-100">
                              <td className="py-1.5">{p.entry_date?.slice(0, 10)}</td>
                              <td className="py-1.5">{p.product_name}</td>
                              <td className="py-1.5 text-right">{p.quantity}</td>
                              <td className="py-1.5 text-right">৳{p.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {cashMemoData.payments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">টাকা নেওয়ার হিস্ট্রি</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500">
                            <td className="py-1.5">তারিখ</td>
                            <td className="py-1.5 text-right">টাকা</td>
                          </tr>
                        </thead>
                        <tbody>
                          {cashMemoData.payments.map((pay) => (
                            <tr key={pay.id} className="border-b border-gray-100">
                              <td className="py-1.5">{pay.payment_date?.slice(0, 10)}</td>
                              <td className="py-1.5 text-right">৳{pay.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* টোটাল */}
                  <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">মোট আয়</span>
                      <span className="font-semibold text-gray-900">
                        ৳ {(cashMemoStaff.rate_type === 'monthly'
                          ? (cashMemoData.salary ? cashMemoData.salary.total_salary_earned : parseFloat(cashMemoStaff.rate_amount || 0))
                          : cashMemoData.production.reduce((s, p) => s + parseFloat(p.amount), 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">মোট নিয়েছে</span>
                      <span className="font-semibold text-gray-900">
                        ৳ {cashMemoData.payments.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t border-gray-200 mt-2">
                      <span className="font-bold text-gray-900">এখন পাবে</span>
                      <span className="font-extrabold text-red-950">
                        ৳ {(cashMemoStaff.rate_type === 'monthly' && cashMemoData.salary
                          ? cashMemoData.salary.total_due
                          : computeStaffDue(cashMemoStaff, paymentsSummaryAll, salarySummaryAll)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <p className="text-center text-xs text-gray-400 mt-6 print:mt-10">— ধন্যবাদ —</p>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">ডেটা পাওয়া যায়নি</p>
              )}
            </div>
          </div>
        )}

        {/* খরচের বিস্তারিত (মজুরী) — ফ্যাক্টরি খরচ + সব স্টাফ পেমেন্ট, ক্যাশ মেমো স্টাইল, প্রিন্ট করা যাবে */}
        {showExpenseReport && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 print:bg-white print:static print:block">
            <div className="w-full max-w-sm bg-white rounded-t-3xl print:rounded-none p-6 max-h-[85vh] print:max-h-none overflow-y-auto print:overflow-visible">
              <div className="flex items-center justify-between mb-4 print:hidden">
                <h2 className="text-lg font-bold text-gray-900">খরচের বিস্তারিত</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center"
                  >
                    <Printer size={16} className="text-red-800" />
                  </button>
                  <button onClick={() => setShowExpenseReport(false)} className="text-gray-400">
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* মেমো হেডার */}
              <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                <h1 className="text-xl font-extrabold text-red-950 tracking-wide">Maya Garments</h1>
                <p className="text-xs text-gray-500 mt-0.5">সম্পূর্ণ খরচের রিপোর্ট</p>
                <p className="text-xs text-gray-400 mt-1">তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
              </div>

              {expenseReportLoading ? (
                <div className="flex justify-center py-10 print:hidden">
                  <Loader2 size={28} className="animate-spin text-red-900" />
                </div>
              ) : (
                <>
                  {allExpenses.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">ফ্যাক্টরি খরচ</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500">
                            <td className="py-1.5">তারিখ</td>
                            <td className="py-1.5">বিবরণ</td>
                            <td className="py-1.5 text-right">টাকা</td>
                          </tr>
                        </thead>
                        <tbody>
                          {allExpenses.map((ex) => (
                            <tr key={ex.id} className="border-b border-gray-100">
                              <td className="py-1.5">{ex.expense_date?.slice(0, 10)}</td>
                              <td className="py-1.5">{ex.description}</td>
                              <td className="py-1.5 text-right">৳{ex.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {allStaffPayments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">কারিগর/স্টাফদের দেওয়া টাকা</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500">
                            <td className="py-1.5">তারিখ</td>
                            <td className="py-1.5">নাম</td>
                            <td className="py-1.5 text-right">টাকা</td>
                          </tr>
                        </thead>
                        <tbody>
                          {allStaffPayments.map((pay) => (
                            <tr key={pay.id} className="border-b border-gray-100">
                              <td className="py-1.5">{pay.payment_date?.slice(0, 10)}</td>
                              <td className="py-1.5">{pay.staff_name}</td>
                              <td className="py-1.5 text-right">৳{pay.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {allPartnerExpenses.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">পার্টনার/এডমিনদের খরচ</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500">
                            <td className="py-1.5">তারিখ</td>
                            <td className="py-1.5">কে</td>
                            <td className="py-1.5">কেন</td>
                            <td className="py-1.5 text-right">টাকা</td>
                          </tr>
                        </thead>
                        <tbody>
                          {allPartnerExpenses.map((pe) => (
                            <tr key={pe.id} className="border-b border-gray-100">
                              <td className="py-1.5">{pe.event_time?.slice(0, 10)}</td>
                              <td className="py-1.5">{pe.added_by_name}</td>
                              <td className="py-1.5">{pe.description}</td>
                              <td className="py-1.5 text-right">৳{pe.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {allExpenses.length === 0 && allStaffPayments.length === 0 && allPartnerExpenses.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">এখনো কোনো খরচ যোগ করা হয়নি</p>
                  )}

                  {/* টোটাল */}
                  <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">মোট ফ্যাক্টরি খরচ</span>
                      <span className="font-semibold text-gray-900">
                        ৳ {allExpenses.reduce((s, e) => s + parseFloat(e.amount), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">মোট স্টাফ পেমেন্ট</span>
                      <span className="font-semibold text-gray-900">
                        ৳ {allStaffPayments.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">মোট পার্টনার/এডমিন খরচ</span>
                      <span className="font-semibold text-gray-900">
                        ৳ {allPartnerExpenses.reduce((s, p) => s + parseFloat(p.amount), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t border-gray-200 mt-2">
                      <span className="font-bold text-gray-900">সর্বমোট খরচ</span>
                      <span className="font-extrabold text-red-950">
                        ৳ {(
                          allExpenses.reduce((s, e) => s + parseFloat(e.amount), 0) +
                          allStaffPayments.reduce((s, p) => s + parseFloat(p.amount), 0) +
                          allPartnerExpenses.reduce((s, p) => s + parseFloat(p.amount), 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <p className="text-center text-xs text-gray-400 mt-6 print:mt-10">— ধন্যবাদ —</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* প্রোফাইল / লগআউট মেনু */}
        {showProfileMenu && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">প্রোফাইল</h2>
                <button onClick={() => setShowProfileMenu(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <button
                onClick={openEditProfile}
                className="w-full bg-white rounded-2xl shadow-md p-4 border-l-4 border-red-900 mb-4 flex items-center gap-3 active:opacity-80 text-left"
              >
                {currentUser?.photo_url ? (
                  <img src={currentUser.photo_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-red-950 flex items-center justify-center font-bold text-lg shrink-0">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{currentUser?.phone}</p>
                  <p className="text-xs text-amber-700 font-semibold mt-1 uppercase">{currentUser?.role}</p>
                </div>
                <ChevronRight size={18} className="text-gray-400 shrink-0" />
              </button>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => { setShowProfileMenu(false); setShowUserManagement(true); fetchUsers(); }}
                  className="w-full bg-white rounded-2xl shadow-md p-4 flex items-center gap-3 border-l-4 border-amber-500 mb-3 active:opacity-80 text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">ইউজার ম্যানেজমেন্ট</p>
                    <p className="text-xs text-gray-500">নতুন এডমিন/মডারেটর যোগ করুন</p>
                  </div>
                </button>
              )}

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => { setShowProfileMenu(false); setShowResetConfirm(true); setResetPasswordInput(''); setResetError(''); }}
                  className="w-full bg-white rounded-2xl shadow-md p-4 flex items-center gap-3 border-l-4 border-red-900 mb-3 active:opacity-80 text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                    <Trash2 size={20} className="text-red-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">আজকের উপস্থিতি রিসেট করুন</p>
                    <p className="text-xs text-gray-500">পাসওয়ার্ড লাগবে — সংবেদনশীল, বেতনের সাথে সংযুক্ত</p>
                  </div>
                </button>
              )}

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => { setShowProfileMenu(false); setShowPaymentResetConfirm(true); setPaymentResetPasswordInput(''); setPaymentResetError(''); }}
                  className="w-full bg-white rounded-2xl shadow-md p-4 flex items-center gap-3 border-l-4 border-red-900 mb-3 active:opacity-80 text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                    <Trash2 size={20} className="text-red-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">সব স্টাফ পেমেন্ট রিসেট করুন</p>
                    <p className="text-xs text-gray-500">টেস্ট ডেটা মুছতে — পাসওয়ার্ড লাগবে, সংবেদনশীল</p>
                  </div>
                </button>
              )}

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => { setShowProfileMenu(false); setShowPartnerResetConfirm(true); setPartnerResetPasswordInput(''); setPartnerResetError(''); }}
                  className="w-full bg-white rounded-2xl shadow-md p-4 flex items-center gap-3 border-l-4 border-red-900 mb-3 active:opacity-80 text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                    <Trash2 size={20} className="text-red-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">সব পার্টনার হিসাব রিসেট করুন</p>
                    <p className="text-xs text-gray-500">সব পার্টনারের সব এন্ট্রি + নোটিফিকেশন মুছে যাবে — পাসওয়ার্ড লাগবে</p>
                  </div>
                </button>
              )}

              <button
                onClick={onLogout}
                className="w-full bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900"
              >
                <LogOut size={18} /> লগআউট
              </button>
            </div>
          </div>
        )}

        {/* প্রোফাইল এডিট — নাম, ছবি, পাসওয়ার্ড */}
        {showEditProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">প্রোফাইল এডিট করুন</h2>
                <button onClick={() => setShowEditProfile(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <div className="flex flex-col items-center mb-5">
                <label className="relative cursor-pointer">
                  {profileForm.photo_url ? (
                    <img src={profileForm.photo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-amber-500 text-red-950 flex items-center justify-center font-bold text-2xl">
                      {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-red-950 flex items-center justify-center border-2 border-white">
                    <Pencil size={12} className="text-white" />
                  </div>
                  <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
                </label>
                <p className="text-xs text-gray-400 mt-2">ছবি বদলাতে ট্যাপ করুন</p>
              </div>

              <label className="text-xs font-semibold text-gray-500">নাম</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full mt-1 mb-4 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
              />

              <label className="text-xs font-semibold text-gray-500">ফোন নাম্বার</label>
              <input
                type="text"
                value={currentUser?.phone || ''}
                disabled
                className="w-full mt-1 mb-4 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-100 text-gray-500"
              />

              <div className="border-t border-gray-200 pt-4 mt-2">
                <p className="text-sm font-bold text-gray-900 mb-3">পাসওয়ার্ড পরিবর্তন করুন (ঐচ্ছিক)</p>
                <label className="text-xs font-semibold text-gray-500">বর্তমান পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={profileForm.current_password}
                  onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })}
                  className="w-full mt-1 mb-4 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                  placeholder="পরিবর্তন করতে চাইলে লিখুন"
                />
                <label className="text-xs font-semibold text-gray-500">নতুন পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={profileForm.new_password}
                  onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                  placeholder="নতুন পাসওয়ার্ড লিখুন"
                />
              </div>

              {profileError && <p className="text-sm text-red-600 mt-4">{profileError}</p>}
              {profileSuccess && <p className="text-sm text-emerald-600 mt-4">{profileSuccess}</p>}

              <button
                onClick={submitProfileUpdate}
                disabled={profileSubmitting}
                className="w-full mt-5 bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
              >
                {profileSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {profileSubmitting ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </button>
            </div>
          </div>
        )}

        {/* আজকের উপস্থিতি রিসেট — পাসওয়ার্ড কনফার্মেশন */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">আজকের উপস্থিতি রিসেট করুন</h2>
                <button onClick={() => setShowResetConfirm(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                এটা করলে আজকের সব উপস্থিতির রেকর্ড মুছে যাবে, ফেরত আনা যাবে না। নিশ্চিত হলে পাসওয়ার্ড লিখুন।
              </p>

              <label className="text-xs font-semibold text-gray-500">পাসওয়ার্ড</label>
              <input
                type="password"
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                placeholder="পাসওয়ার্ড লিখুন"
                autoFocus
              />

              {resetError && <p className="text-sm text-red-600 mt-3">{resetError}</p>}

              <button
                onClick={confirmResetAttendance}
                disabled={resetSubmitting}
                className="w-full mt-5 bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
              >
                {resetSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {resetSubmitting ? 'রিসেট হচ্ছে...' : 'রিসেট নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        )}

        {/* সব স্টাফ পেমেন্ট রিসেট — পাসওয়ার্ড কনফার্মেশন */}
        {showPaymentResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">সব স্টাফ পেমেন্ট রিসেট করুন</h2>
                <button onClick={() => setShowPaymentResetConfirm(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                এটা করলে এখন পর্যন্ত সব স্টাফ/কারিগরকে দেওয়া পেমেন্টের রেকর্ড মুছে যাবে, ফেরত আনা যাবে না। নিশ্চিত হলে পাসওয়ার্ড লিখুন।
              </p>

              <label className="text-xs font-semibold text-gray-500">পাসওয়ার্ড</label>
              <input
                type="password"
                value={paymentResetPasswordInput}
                onChange={(e) => setPaymentResetPasswordInput(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                placeholder="পাসওয়ার্ড লিখুন"
                autoFocus
              />

              {paymentResetError && <p className="text-sm text-red-600 mt-3">{paymentResetError}</p>}

              <button
                onClick={confirmPaymentReset}
                disabled={paymentResetSubmitting}
                className="w-full mt-5 bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
              >
                {paymentResetSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {paymentResetSubmitting ? 'রিসেট হচ্ছে...' : 'রিসেট নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        )}

        {/* সব পার্টনার হিসাব রিসেট — পাসওয়ার্ড কনফার্মেশন */}
        {showPartnerResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">সব পার্টনার হিসাব রিসেট করুন</h2>
                <button onClick={() => setShowPartnerResetConfirm(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                এটা করলে সব পার্টনারের সব খরচ/ক্যাশ এন্ট্রি এবং নোটিফিকেশন — একদম সব জায়গা থেকে মুছে যাবে (পার্টনারের নিজের হিসাব, "খরচের বিস্তারিত" রিপোর্ট, সবকিছু), ফেরত আনা যাবে না। নিশ্চিত হলে পাসওয়ার্ড লিখুন।
              </p>

              <label className="text-xs font-semibold text-gray-500">পাসওয়ার্ড</label>
              <input
                type="password"
                value={partnerResetPasswordInput}
                onChange={(e) => setPartnerResetPasswordInput(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                placeholder="পাসওয়ার্ড লিখুন"
                autoFocus
              />

              {partnerResetError && <p className="text-sm text-red-600 mt-3">{partnerResetError}</p>}

              <button
                onClick={confirmPartnerReset}
                disabled={partnerResetSubmitting}
                className="w-full mt-5 bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
              >
                {partnerResetSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {partnerResetSubmitting ? 'রিসেট হচ্ছে...' : 'রিসেট নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        )}

        {/* ইউজার ম্যানেজমেন্ট (শুধু এডমিনের জন্য) */}
        {showUserManagement && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingUserId ? 'ইউজার এডিট করুন' : 'নতুন এডমিন/মডারেটর যোগ করুন'}
                </h2>
                <button onClick={() => { setShowUserManagement(false); cancelEditUser(); }} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">নাম {!editingUserId && '*'}</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    disabled={!!editingUserId}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="যেমন: করিম"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">ফোন নাম্বার {!editingUserId && '*'}</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    disabled={!!editingUserId}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="যেমন: ০১৭xxxxxxxx"
                  />
                </div>
                {!editingUserId && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500">পাসওয়ার্ড *</label>
                    <input
                      type="text"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-900"
                      placeholder="পাসওয়ার্ড লিখুন"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500">ধরন</label>
                  <div className="flex gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setUserForm({ ...userForm, role: 'moderator' })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${userForm.role === 'moderator' ? 'bg-red-950 text-white border-red-950' : 'border-gray-200 text-gray-600'}`}
                    >
                      মডারেটর
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserForm({ ...userForm, role: 'admin' })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${userForm.role === 'admin' ? 'bg-red-950 text-white border-red-950' : 'border-gray-200 text-gray-600'}`}
                    >
                      এডমিন
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 bg-rose-50 rounded-xl p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userForm.is_partner}
                    onChange={(e) => setUserForm({ ...userForm, is_partner: e.target.checked })}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-gray-700">
                    ✅ পার্টনার যোগ করুন — টিক দিলে এই ইউজার "পার্টনার হিসাব"-এও যুক্ত হয়ে যাবে
                  </span>
                </label>

                {userError && <p className="text-sm text-red-600">{userError}</p>}

                <button
                  type="submit"
                  disabled={userSubmitting}
                  className="w-full bg-red-950 text-white rounded-full py-3 flex items-center justify-center gap-2 font-semibold text-sm active:bg-red-900 disabled:opacity-60"
                >
                  {userSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  {userSubmitting ? 'সেভ হচ্ছে...' : editingUserId ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
                {editingUserId && (
                  <button type="button" onClick={cancelEditUser} className="w-full text-center text-sm text-gray-500 py-1">
                    বাতিল করুন
                  </button>
                )}
              </form>

              {users.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">সব ইউজার</h3>
                  <div className="flex flex-col gap-3">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className={`bg-white rounded-2xl shadow-md p-4 flex items-center gap-3 border-l-4 ${u.role === 'admin' ? 'border-red-900' : 'border-amber-500'}`}
                      >
                        {u.photo_url ? (
                          <img src={u.photo_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {u.phone} · {u.role}{u.is_partner ? ' · পার্টনার' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => startEditUser(u)}
                            className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center"
                          >
                            <Pencil size={15} className="text-amber-700" />
                          </button>
                          {u.phone !== '01775515571' && (
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center"
                            >
                              <Trash2 size={15} className="text-red-700" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* নোটিফিকেশন */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
            <div className="w-full max-w-sm bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">নোটিফিকেশন</h2>
                <button onClick={() => setShowNotifications(false)} className="text-gray-400">
                  <X size={22} />
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">এখনো কোনো নোটিফিকেশন নেই</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3.5">
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('bn-BD')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('maya_token');
    const userStr = localStorage.getItem('maya_user');
    if (token && userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (err) {
        localStorage.removeItem('maya_token');
        localStorage.removeItem('maya_user');
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLoggedIn = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('maya_token');
    localStorage.removeItem('maya_user');
    setCurrentUser(null);
  };

  const handleUpdateUser = (updatedFields) => {
    setCurrentUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('maya_user', JSON.stringify(merged));
      return merged;
    });
  };

  if (!authChecked) return null;

  if (!currentUser) {
    return <LoginScreen onLoggedIn={handleLoggedIn} />;
  }

  return <Dashboard currentUser={currentUser} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
}
