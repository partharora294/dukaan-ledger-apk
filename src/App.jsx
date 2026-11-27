import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee,
  CreditCard,
  Smartphone,
  Banknote,
  Users,
  BarChart3,
  PlusCircle,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Download,
  Upload,
  Lock,
  Unlock,
  Trash2,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Tag
} from 'lucide-react';

// Pure Local Storage Keys (Zero external network calls, 100% on-device)
const STORAGE_KEYS = {
  SALES: 'dukaan_clothing_sales_v1',
  CREDITORS: 'dukaan_clothing_creditors_v1',
  LEDGER: 'dukaan_clothing_ledger_v1',
  PIN: 'dukaan_clothing_pin_v1',
  LAST_BACKUP: 'dukaan_clothing_last_backup_v1'
};

const QUICK_GARMENT_TAGS = [
  'Suit Set',
  'Saree',
  'Kurti',
  'Lehenga',
  'Dupatta / Stole',
  'Alteration / Fall-Pico'
];

const formatINR = (num) => {
  const val = Number(num) || 0;
  return '₹' + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const formatDateTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
    ' • ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const isToday = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
};

export default function App() {
  // Core Persistent State — Starts 100% Empty (Zero Dummy Data)
  const [sales, setSales] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES)) || [];
    } catch {
      return [];
    }
  });

  const [creditors, setCreditors] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDITORS)) || [];
    } catch {
      return [];
    }
  });

  const [ledgerEntries, setLedgerEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEDGER)) || [];
    } catch {
      return [];
    }
  });

  const [savedPin, setSavedPin] = useState(() => localStorage.getItem(STORAGE_KEYS.PIN) || '');
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem(STORAGE_KEYS.LAST_BACKUP) || '');
  const [isUnlocked, setIsUnlocked] = useState(() => !localStorage.getItem(STORAGE_KEYS.PIN));
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('sale'); // 'sale' | 'credit' | 'ledgers' | 'dashboard'
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Quick Sale Form State
  const [saleAmount, setSaleAmount] = useState('');
  const [saleNote, setSaleNote] = useState('');

  // Credit (Udhaar) Form State
  const [creditName, setCreditName] = useState('');
  const [creditPhone, setCreditPhone] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [selectedCreditorId, setSelectedCreditorId] = useState(null);

  // Ledgers & Settlement State
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerSort, setLedgerSort] = useState('due_desc');
  const [activeCreditorId, setActiveCreditorId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Dashboard State
  const [chartRange, setChartRange] = useState(7);
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);

  // Security / PIN setup state
  const [newPinInput, setNewPinInput] = useState('');

  // Sync changes strictly to on-device storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CREDITORS, JSON.stringify(creditors));
  }, [creditors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  // Request persistent storage permission from Android WebView/Browser
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }, []);

  const triggerToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  // PIN Unlock Handler
  const handleUnlock = (e) => {
    e.preventDefault();
    if (pinInput === savedPin) {
      setIsUnlocked(true);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Incorrect 4-digit PIN');
      setPinInput('');
    }
  };

  // 1. Record Counter Sale (Cash / UPI / Card)
  const handleRecordSale = (mode) => {
    const amt = parseFloat(saleAmount);
    if (!amt || amt <= 0) {
      triggerToast('Enter a valid garment sale amount', 'error');
      return;
    }
    const newSale = {
      id: 'sale_' + Date.now(),
      amount: amt,
      payment_mode: mode,
      note: saleNote.trim() || 'Apparel Sale',
      created_at: new Date().toISOString()
    };
    setSales((prev) => [newSale, ...prev]);
    setSaleAmount('');
    setSaleNote('');
    triggerToast(`${formatINR(amt)} recorded via ${mode}`);
  };

  const handleDeleteSale = (id) => {
    if (window.confirm('Delete this counter sale entry?')) {
      setSales((prev) => prev.filter((s) => s.id !== id));
      triggerToast('Sale entry removed', 'info');
    }
  };

  // Smart Creditor Matching for Credit Tab
  const matchingCreditors = useMemo(() => {
    const qName = creditName.trim().toLowerCase();
    const qPhone = creditPhone.trim();
    if (!qName && !qPhone) return [];
    return creditors.filter(
      (c) =>
        (qName && c.name.toLowerCase().includes(qName)) ||
        (qPhone && c.phone.includes(qPhone))
    );
  }, [creditors, creditName, creditPhone]);

  const handleSelectExistingCreditor = (creditor) => {
    setSelectedCreditorId(creditor.id);
    setCreditName(creditor.name);
    setCreditPhone(creditor.phone);
  };

  // 2. Record Credit Sale (Udhaar) & Auto-Create/Update Customer Ledger
  const handleRecordCredit = (e) => {
    e.preventDefault();
    const name = creditName.trim();
    const phone = creditPhone.replace(/\D/g, '');
    const amt = parseFloat(creditAmount);

    if (!name) {
      triggerToast('Enter buyer name', 'error');
      return;
    }
    if (phone.length !== 10) {
      triggerToast('Enter valid 10-digit mobile number', 'error');
      return;
    }
    if (!amt || amt <= 0) {
      triggerToast('Enter valid credit amount', 'error');
      return;
    }

    const now = new Date().toISOString();
    let targetCreditor =
      creditors.find((c) => c.id === selectedCreditorId) ||
      creditors.find((c) => c.phone === phone);

    let creditorId;
    let newBalance;

    if (targetCreditor) {
      creditorId = targetCreditor.id;
      newBalance = targetCreditor.total_due + amt;
      setCreditors((prev) =>
        prev.map((c) =>
          c.id === creditorId
            ? { ...c, name, total_due: newBalance, updated_at: now }
            : c
        )
      );
    } else {
      creditorId = 'cred_' + Date.now();
      newBalance = amt;
      const newCreditor = {
        id: creditorId,
        name,
        phone,
        total_due: newBalance,
        created_at: now,
        updated_at: now
      };
      setCreditors((prev) => [newCreditor, ...prev]);
    }

    const entry = {
      id: 'led_' + Date.now(),
      creditor_id: creditorId,
      type: 'CREDIT_GIVEN',
      amount: amt,
      balance_after: newBalance,
      note: creditNote.trim() || 'Clothing Credit Purchase',
      created_at: now
    };

    setLedgerEntries((prev) => [entry, ...prev]);
    setCreditName('');
    setCreditPhone('');
    setCreditAmount('');
    setCreditNote('');
    setSelectedCreditorId(null);
    triggerToast(`Ledger updated for ${name} (+${formatINR(amt)})`);
  };

  // 3. Record Payment Received (Jama) inside Customer Ledger
  const handleRecordRepayment = (e) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    const creditor = creditors.find((c) => c.id === activeCreditorId);
    if (!creditor) return;
    if (!amt || amt <= 0) {
      triggerToast('Enter valid payment amount', 'error');
      return;
    }

    const now = new Date().toISOString();
    const updatedDue = Math.max(0, creditor.total_due - amt);

    setCreditors((prev) =>
      prev.map((c) =>
        c.id === creditor.id
          ? { ...c, total_due: updatedDue, updated_at: now }
          : c
      )
    );

    const entry = {
      id: 'led_' + Date.now(),
      creditor_id: creditor.id,
      type: 'PAYMENT_RECEIVED',
      amount: amt,
      balance_after: updatedDue,
      note: paymentNote.trim() || 'Payment Received (Jama)',
      created_at: now
    };

    setLedgerEntries((prev) => [entry, ...prev]);
    setPaymentAmount('');
    setPaymentNote('');
    setShowPaymentModal(false);
    triggerToast(`Received ${formatINR(amt)} from ${creditor.name}`);
  };

  // Local Device Backup Export (JSON & CSV)
  const handleExportJSON = () => {
    const payload = {
      app: 'DukaanLedger-Clothing-POS',
      exported_at: new Date().toISOString(),
      sales,
      creditors,
      ledgerEntries
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `DukaanLedger_Backup_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now);
    setLastBackup(now);
    triggerToast('Backup file saved to device Downloads');
  };

  const handleExportCSV = () => {
    const rows = [
      ['Customer Name', 'Phone Number', 'Total Pending Due (INR)', 'Last Updated']
    ];
    creditors.forEach((c) => {
      rows.push([
        `"${c.name.replace(/"/g, '""')}"`,
        c.phone,
        c.total_due,
        new Date(c.updated_at).toLocaleDateString('en-IN')
      ]);
    });
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Customer_Udhaar_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Customer Ledger CSV exported');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!Array.isArray(parsed.sales) || !Array.isArray(parsed.creditors)) {
          throw new Error('Invalid backup format');
        }
        if (
          window.confirm(
            `Restore ${parsed.sales.length} sales and ${parsed.creditors.length} customer ledgers? Current device records will be replaced.`
          )
        ) {
          setSales(parsed.sales);
          setCreditors(parsed.creditors);
          setLedgerEntries(parsed.ledgerEntries || []);
          triggerToast('Device database restored successfully');
          setShowBackupModal(false);
        }
      } catch {
        triggerToast('Invalid backup file selected', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // PIN Lock Management
  const handleSavePin = () => {
    if (!/^\d{4}$/.test(newPinInput)) {
      triggerToast('PIN must be exactly 4 digits', 'error');
      return;
    }
    localStorage.setItem(STORAGE_KEYS.PIN, newPinInput);
    setSavedPin(newPinInput);
    setNewPinInput('');
    triggerToast('4-digit App Lock PIN activated');
  };

  const handleRemovePin = () => {
    localStorage.removeItem(STORAGE_KEYS.PIN);
    setSavedPin('');
    triggerToast('App Lock PIN removed', 'info');
  };

  // Analytics & KPI Calculations
  const todayStats = useMemo(() => {
    const todaySales = sales.filter((s) => isToday(s.created_at));
    const cash = todaySales
      .filter((s) => s.payment_mode === 'CASH')
      .reduce((acc, s) => acc + s.amount, 0);
    const upi = todaySales
      .filter((s) => s.payment_mode === 'UPI')
      .reduce((acc, s) => acc + s.amount, 0);
    const card = todaySales
      .filter((s) => s.payment_mode === 'CARD')
      .reduce((acc, s) => acc + s.amount, 0);
    const todayCredit = ledgerEntries
      .filter((l) => l.type === 'CREDIT_GIVEN' && isToday(l.created_at))
      .reduce((acc, l) => acc + l.amount, 0);

    return {
      cash,
      upi,
      card,
      digital: upi + card,
      counterTotal: cash + upi + card,
      todayCredit,
      grandTotal: cash + upi + card + todayCredit,
      list: todaySales
    };
  }, [sales, ledgerEntries]);

  const analytics = useMemo(() => {
    const totalPendingCredit = creditors.reduce((acc, c) => acc + c.total_due, 0);
    const totalCashAllTime = sales
      .filter((s) => s.payment_mode === 'CASH')
      .reduce((acc, s) => acc + s.amount, 0);
    const totalDigitalAllTime = sales
      .filter((s) => s.payment_mode === 'UPI' || s.payment_mode === 'CARD')
      .reduce((acc, s) => acc + s.amount, 0);
    const totalCounterAllTime = totalCashAllTime + totalDigitalAllTime;

    const totalCreditIssued = ledgerEntries
      .filter((l) => l.type === 'CREDIT_GIVEN')
      .reduce((acc, l) => acc + l.amount, 0);
    const totalRecovered = ledgerEntries
      .filter((l) => l.type === 'PAYMENT_RECEIVED')
      .reduce((acc, l) => acc + l.amount, 0);

    const recoveryRate =
      totalCreditIssued > 0
        ? Math.round((totalRecovered / totalCreditIssued) * 100)
        : 100;

    // Daily Trend Series
    const days = [];
    for (let i = chartRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
      });

      const daySales = sales.filter((s) => s.created_at.slice(0, 10) === key);
      const dayCash = daySales
        .filter((s) => s.payment_mode === 'CASH')
        .reduce((a, b) => a + b.amount, 0);
      const dayDigital = daySales
        .filter((s) => s.payment_mode === 'UPI' || s.payment_mode === 'CARD')
        .reduce((a, b) => a + b.amount, 0);
      const dayCredit = ledgerEntries
        .filter(
          (l) => l.type === 'CREDIT_GIVEN' && l.created_at.slice(0, 10) === key
        )
        .reduce((a, b) => a + b.amount, 0);

      days.push({
        key,
        label,
        cash: dayCash,
        digital: dayDigital,
        credit: dayCredit,
        total: dayCash + dayDigital + dayCredit
      });
    }

    const maxDailyTotal = Math.max(...days.map((d) => d.total), 1);

    // Top Creditors & Automated Explanation
    const activeDebtors = [...creditors]
      .filter((c) => c.total_due > 0)
      .sort((a, b) => b.total_due - a.total_due);

    const top5Debtors = activeDebtors.slice(0, 5);
    const maxDebtorDue = top5Debtors.length > 0 ? top5Debtors[0].total_due : 1;

    let explanationSentences = [];
    if (activeDebtors.length === 0) {
      explanationSentences.push(
        'Zero pending customer credit right now. All apparel credit accounts are settled.'
      );
    } else {
      const top2Sum = activeDebtors
        .slice(0, 2)
        .reduce((sum, c) => sum + c.total_due, 0);
      const top2Share = Math.round((top2Sum / totalPendingCredit) * 100);
      if (activeDebtors.length === 1) {
        explanationSentences.push(
          `1 customer (${activeDebtors[0].name}) holds 100% of your pending credit (${formatINR(totalPendingCredit)}).`
        );
      } else {
        explanationSentences.push(
          `Your top 2 credit buyers (${activeDebtors[0].name} and ${activeDebtors[1].name}) account for ${formatINR(top2Sum)} (${top2Share}% of total market credit).`
        );
      }

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const overdueCount = activeDebtors.filter(
        (c) => new Date(c.updated_at).getTime() < thirtyDaysAgo
      ).length;

      if (overdueCount > 0) {
        explanationSentences.push(
          `${overdueCount} customer(s) have had no payment activity for over 30 days—consider sending a WhatsApp reminder.`
        );
      } else {
        explanationSentences.push(
          `All ${activeDebtors.length} active credit buyers have transacted within the last 30 days.`
        );
      }
    }

    return {
      totalPendingCredit,
      totalCashAllTime,
      totalDigitalAllTime,
      totalCounterAllTime,
      recoveryRate,
      days,
      maxDailyTotal,
      top5Debtors,
      maxDebtorDue,
      explanationSentences
    };
  }, [sales, creditors, ledgerEntries, chartRange]);

  // Filtered & Sorted Creditors Directory
  const filteredCreditors = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    let list = creditors.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
    if (ledgerSort === 'due_desc') {
      list.sort((a, b) => b.total_due - a.total_due);
    } else if (ledgerSort === 'recent') {
      list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [creditors, ledgerSearch, ledgerSort]);

  // PIN Lock Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">DukaanLedger Locked</h1>
        <p className="text-slate-400 text-sm mt-1 text-center">
          Enter your 4-digit shop PIN to access sales & customer records
        </p>

        <form onSubmit={handleUnlock} className="w-full max-w-xs mt-6 space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full text-center text-3xl tracking-[0.75em] py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          {pinError && (
            <p className="text-rose-400 text-xs text-center font-medium">
              {pinError}
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-base transition"
          >
            Unlock Register
          </button>
        </form>
      </div>
    );
  }

  const activeCreditor = creditors.find((c) => c.id === activeCreditorId);
  const activeCreditorEntries = ledgerEntries.filter(
    (l) => l.creditor_id === activeCreditorId
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 max-w-md mx-auto shadow-xl border-x border-slate-200 relative">
      {/* Top Security & App Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              DukaanLedger
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3" /> Offline Safe
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Apparel & Retail Counter • On-Device Storage
          </p>
        </div>

        <button
          onClick={() => setShowBackupModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          Backup
        </button>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transition ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* TAB 1: QUICK COUNTER SALE */}
      {activeTab === 'sale' && (
        <main className="p-4 space-y-4">
          {/* Today's Collection Summary Strip */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 font-medium">
                Today&apos;s Counter Collection
              </span>
              <span className="text-2xl font-extrabold text-emerald-400">
                {formatINR(todayStats.counterTotal)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Cash</span>
                <span className="font-bold">{formatINR(todayStats.cash)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">UPI</span>
                <span className="font-bold text-sky-400">
                  {formatINR(todayStats.upi)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Card</span>
                <span className="font-bold text-indigo-400">
                  {formatINR(todayStats.card)}
                </span>
              </div>
            </div>
          </div>

          {/* Amount Input Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Enter Bill Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-4 py-3.5 text-3xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Quick Apparel Category Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_GARMENT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSaleNote(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                    saleNote === tag
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={saleNote}
              onChange={(e) => setSaleNote(e.target.value)}
              placeholder="Optional garment note (e.g., Silk Saree, 2 Kurtis)"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
            />

            {/* 3 Payment Mode Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleRecordSale('CASH')}
                className="flex flex-col items-center justify-center py-3.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold shadow-sm transition"
              >
                <Banknote className="w-6 h-6 mb-1" />
                <span className="text-sm">CASH</span>
              </button>

              <button
                type="button"
                onClick={() => handleRecordSale('UPI')}
                className="flex flex-col items-center justify-center py-3.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold shadow-sm transition"
              >
                <Smartphone className="w-6 h-6 mb-1" />
                <span className="text-sm">UPI</span>
              </button>

              <button
                type="button"
                onClick={() => handleRecordSale('CARD')}
                className="flex flex-col items-center justify-center py-3.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold shadow-sm transition"
              >
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="text-sm">CARD</span>
              </button>
            </div>
          </div>

          {/* Today's Transactions List */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Today&apos;s Counter Bills ({todayStats.list.length})
            </h2>

            {todayStats.list.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-300">
                <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">
                  No counter sales recorded today
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter an amount above and tap Cash, UPI, or Card
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayStats.list.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {formatINR(s.amount)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.payment_mode === 'CASH'
                              ? 'bg-emerald-100 text-emerald-700'
                              : s.payment_mode === 'UPI'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {s.payment_mode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {s.note} • {formatDateTime(s.created_at)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteSale(s.id)}
                      className="p-2 text-slate-400 hover:text-rose-600"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* TAB 2: CREDIT ENTRY (UDHAAR) */}
      {activeTab === 'credit' && (
        <main className="p-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800">
                Total Market Credit Pending
              </p>
              <p className="text-xl font-extrabold text-amber-950">
                {formatINR(analytics.totalPendingCredit)}
              </p>
            </div>
            <span className="text-xs font-bold bg-amber-200/70 text-amber-900 px-2.5 py-1 rounded-lg">
              {creditors.filter((c) => c.total_due > 0).length} Active Buyers
            </span>
          </div>

          <form
            onSubmit={handleRecordCredit}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5"
          >
            <h2 className="text-sm font-extrabold text-slate-900">
              Record Credit Purchase (Udhaar)
            </h2>

            {/* Buyer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Buyer Name *
              </label>
              <input
                type="text"
                value={creditName}
                onChange={(e) => {
                  setCreditName(e.target.value);
                  setSelectedCreditorId(null);
                }}
                placeholder="Type buyer name..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* Smart Auto-Match Existing Creditor Dropdown */}
            {matchingCreditors.length > 0 && !selectedCreditorId && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 space-y-1.5">
                <p className="text-[11px] font-bold text-indigo-800">
                  Existing Credit Customer Found (Tap to select):
                </p>
                {matchingCreditors.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectExistingCreditor(c)}
                    className="w-full text-left bg-white hover:bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-500">{c.phone}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-700">
                      Due: {formatINR(c.total_due)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedCreditorId && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs">
                <span className="font-semibold text-emerald-800">
                  Adding to existing customer ledger
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCreditorId(null);
                    setCreditName('');
                    setCreditPhone('');
                  }}
                  className="text-emerald-700 underline font-bold"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mobile Number (10 Digits) *
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={creditPhone}
                onChange={(e) =>
                  setCreditPhone(e.target.value.replace(/\D/g, ''))
                }
                placeholder="98XXXXXXXX"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* Credit Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Credit Sale Amount (₹) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-3 text-2xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* Garment Details Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Garment / Bill Note
              </label>
              <input
                type="text"
                value={creditNote}
                onChange={(e) => setCreditNote(e.target.value)}
                placeholder="e.g., Bridal Suit + 2 Sarees"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm shadow-sm transition"
            >
              Save Credit & Update Customer Ledger
            </button>
          </form>
        </main>
      )}

      {/* TAB 3: CUSTOMER LEDGERS */}
      {activeTab === 'ledgers' && !activeCreditor && (
        <main className="p-4 space-y-3.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder="Search buyer name or phone..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
              />
            </div>
            <select
              value={ledgerSort}
              onChange={(e) => setLedgerSort(e.target.value)}
              className="px-2.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700"
            >
              <option value="due_desc">Highest Due</option>
              <option value="recent">Recent</option>
              <option value="name">A - Z</option>
            </select>
          </div>

          {filteredCreditors.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300">
              <Users className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                No customer ledgers yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                When you record a credit sale in the Credit tab, an individual ledger is created here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCreditors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCreditorId(c.id)}
                  className="w-full text-left bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between transition"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span
                        className={`font-extrabold text-sm block ${
                          c.total_due > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatINR(c.total_due)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.total_due > 0 ? 'Pending' : 'Settled'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      )}

      {/* INDIVIDUAL CUSTOMER PASSBOOK VIEW */}
      {activeTab === 'ledgers' && activeCreditor && (
        <main className="p-4 space-y-4">
          <button
            onClick={() => setActiveCreditorId(null)}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Ledgers
          </button>

          {/* Customer Summary Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {activeCreditor.name}
                </h2>
                <p className="text-xs text-slate-500">{activeCreditor.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">
                  Net Pending Balance
                </span>
                <span
                  className={`text-2xl font-extrabold ${
                    activeCreditor.total_due > 0
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {formatINR(activeCreditor.total_due)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <ArrowDownLeft className="w-4 h-4" /> Receive Payment
              </button>

              <a
                href={`https://wa.me/91${activeCreditor.phone}?text=${encodeURIComponent(
                  `Namaste ${activeCreditor.name}, gentle reminder from our clothing store regarding your pending balance of ${formatINR(activeCreditor.total_due)}. Thank you!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp Reminder
              </a>
            </div>
          </div>

          {/* Transaction History */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Passbook Entries ({activeCreditorEntries.length})
            </h3>
            {activeCreditorEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      entry.type === 'CREDIT_GIVEN'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {entry.type === 'CREDIT_GIVEN' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {entry.note}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatDateTime(entry.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-extrabold block ${
                      entry.type === 'CREDIT_GIVEN'
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {entry.type === 'CREDIT_GIVEN' ? '+' : '-'}
                    {formatINR(entry.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Bal: {formatINR(entry.balance_after)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* TAB 4: ANALYTICS DASHBOARD */}
      {activeTab === 'dashboard' && (
        <main className="p-4 space-y-4">
          {/* 2x2 KPI Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">
                Today&apos;s Total Business
              </span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {formatINR(todayStats.grandTotal)}
              </p>
              <span className="text-[10px] text-emerald-600 font-semibold">
                Cash + UPI/Card + Credit
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">
                Total Credit Pending
              </span>
              <p className="text-xl font-extrabold text-rose-600 mt-0.5">
                {formatINR(analytics.totalPendingCredit)}
              </p>
              <span className="text-[10px] text-slate-400">
                Across {creditors.filter((c) => c.total_due > 0).length} buyers
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">
                Cash vs Digital Split
              </span>
              <p className="text-sm font-extrabold text-slate-900 mt-1">
                {analytics.totalCounterAllTime > 0
                  ? `${Math.round(
                      (analytics.totalCashAllTime /
                        analytics.totalCounterAllTime) *
                        100
                    )}% Cash / ${Math.round(
                      (analytics.totalDigitalAllTime /
                        analytics.totalCounterAllTime) *
                        100
                    )}% Digital`
                  : 'No sales yet'}
              </p>
              <span className="text-[10px] text-slate-400">
                Counter: {formatINR(analytics.totalCounterAllTime)}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500">
                Credit Recovery Rate
              </span>
              <p className="text-xl font-extrabold text-indigo-600 mt-0.5">
                {analytics.recoveryRate}%
              </p>
              <span className="text-[10px] text-slate-400">
                Udhaar repaid ratio
              </span>
            </div>
          </div>

          {/* Sales Trend Bar Graph */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Sales Trend Analysis
                </h2>
                <p className="text-[11px] text-slate-400">
                  Tap any bar to inspect daily breakdown
                </p>
              </div>
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                <button
                  onClick={() => {
                    setChartRange(7);
                    setSelectedBarIndex(null);
                  }}
                  className={`px-2.5 py-1 rounded-md ${
                    chartRange === 7
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  7D
                </button>
                <button
                  onClick={() => {
                    setChartRange(14);
                    setSelectedBarIndex(null);
                  }}
                  className={`px-2.5 py-1 rounded-md ${
                    chartRange === 14
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  14D
                </button>
              </div>
            </div>

            <div className="h-36 flex items-end gap-1.5 pt-4 border-b border-slate-100">
              {analytics.days.map((d, idx) => {
                const heightPct = Math.max(
                  6,
                  Math.round((d.total / analytics.maxDailyTotal) * 100)
                );
                return (
                  <button
                    key={d.key}
                    onClick={() => setSelectedBarIndex(idx)}
                    className="flex-1 flex flex-col items-center gap-1 group focus:outline-none"
                  >
                    <div className="w-full h-28 flex items-end justify-center">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[22px] rounded-t-md transition-all ${
                          selectedBarIndex === idx
                            ? 'bg-indigo-600'
                            : d.total > 0
                            ? 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 truncate max-w-full">
                      {d.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedBarIndex !== null && analytics.days[selectedBarIndex] && (
              <div className="bg-slate-50 p-2.5 rounded-xl text-xs flex justify-between items-center">
                <span className="font-bold text-slate-700">
                  {analytics.days[selectedBarIndex].label}:
                </span>
                <span className="text-slate-600">
                  Cash {formatINR(analytics.days[selectedBarIndex].cash)} •
                  Digital {formatINR(analytics.days[selectedBarIndex].digital)} •
                  Credit {formatINR(analytics.days[selectedBarIndex].credit)}
                </span>
              </div>
            )}
          </div>

          {/* Creditors Graph & Plain-English Explanation */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900">
              Top Creditors Breakdown & Explanation
            </h2>

            {analytics.top5Debtors.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">
                No pending customer credit to graph yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {analytics.top5Debtors.map((c) => {
                  const widthPct = Math.max(
                    8,
                    Math.round((c.total_due / analytics.maxDebtorDue) * 100)
                  );
                  return (
                    <div key={c.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800">{c.name}</span>
                        <span className="font-extrabold text-rose-600">
                          {formatINR(c.total_due)}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${widthPct}%` }}
                          className="h-full bg-amber-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Plain-English Insight Box */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-800">
                Creditors Graph Explanation
              </p>
              {analytics.explanationSentences.map((sentence, i) => (
                <p key={i} className="text-xs text-indigo-950 leading-relaxed">
                  • {sentence}
                </p>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* PAYMENT RECEIVED (JAMA) MODAL */}
      {showPaymentModal && activeCreditor && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <form
            onSubmit={handleRecordRepayment}
            className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-extrabold text-slate-900">
              Record Payment from {activeCreditor.name}
            </h3>
            <p className="text-xs text-slate-500">
              Current Due: <strong>{formatINR(activeCreditor.total_due)}</strong>
            </p>
            <input
              type="number"
              inputMode="decimal"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Amount Received (₹)"
              className="w-full px-3.5 py-3 text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl"
              autoFocus
            />
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Mode / Note (e.g., Cash Jama, UPI)"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Save Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BACKUP, RESTORE & SECURITY PIN MODAL */}
      {showBackupModal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">
                Data Safety & App Lock
              </h3>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-xs font-bold text-slate-500 px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% On-Device Storage
              </p>
              <p>
                All customer phone numbers and garment sales stay strictly inside this phone. Zero internet permissions or cloud servers are used.
              </p>
            </div>

            {/* Backup & Restore Actions */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">
                Device Backup (Protects against phone damage/loss)
              </p>
              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Full Backup (.JSON)
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Customer Ledgers (.CSV)
              </button>

              <label className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50">
                <Upload className="w-4 h-4" /> Restore from Backup File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
              {lastBackup && (
                <p className="text-[11px] text-slate-400 text-center">
                  Last backup: {formatDateTime(lastBackup)}
                </p>
              )}
            </div>

            {/* 4-Digit PIN Setup */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> App Lock PIN Protection
              </p>
              {savedPin ? (
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-xs font-semibold text-emerald-700">
                    4-Digit PIN Active
                  </span>
                  <button
                    onClick={handleRemovePin}
                    className="text-xs font-bold text-rose-600"
                  >
                    Remove PIN
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPinInput}
                    onChange={(e) =>
                      setNewPinInput(e.target.value.replace(/\D/g, ''))
                    }
                    placeholder="Set 4-digit PIN"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <button
                    onClick={handleSavePin}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    Enable
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 grid grid-cols-4 py-2 px-1 z-30">
        <button
          onClick={() => setActiveTab('sale')}
          className={`flex flex-col items-center py-1 rounded-xl ${
            activeTab === 'sale' ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <IndianRupee className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Quick Sale</span>
        </button>

        <button
          onClick={() => setActiveTab('credit')}
          className={`flex flex-col items-center py-1 rounded-xl ${
            activeTab === 'credit' ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Credit</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ledgers');
            setActiveCreditorId(null);
          }}
          className={`flex flex-col items-center py-1 rounded-xl ${
            activeTab === 'ledgers' ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Ledgers</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 rounded-xl ${
            activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Dashboard</span>
        </button>
      </nav>
    </div>
  );
}
