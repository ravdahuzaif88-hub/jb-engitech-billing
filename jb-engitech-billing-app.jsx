import React, { useState, useEffect } from 'react';
import { Plus, Download, Eye, Settings, History, Save, X, Upload } from 'lucide-react';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [preview, setPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [settings, setSettings] = useState({
    companyName: 'JB ENGITECH',
    address1: 'Shed no 4, Survey no 248, Plot no 18/19',
    address2: 'Rajan Tech Road, Shapur, Rajkot',
    gstin: '24GDRPS8977N1Z1',
    state: 'Gujarat',
    stateCode: '24',
    prefix: 'JB',
    gstRate: 18,
    year: '2026-27',
    theme: 'light',
    signature: null,
    declaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    signatory: 'Authorised Signatory',
  });

  const [tempSettings, setTempSettings] = useState(settings);

  const [form, setForm] = useState({
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    customer: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
    items: [{ id: 1, desc: '', hsn: '', qty: 1, unit: 'pcs', rate: 0, gst: 18 }],
    supplyType: 'intra-state',
  });

  // Load from localStorage
  useEffect(() => {
    const s = localStorage.getItem('billingSettings');
    if (s) {
      const loaded = JSON.parse(s);
      setSettings(loaded);
      setTempSettings(loaded);
    }
    const i = localStorage.getItem('billingInvoices');
    if (i) setInvoices(JSON.parse(i));
  }, []);

  const numToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const convert = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    };

    if (num === 0) return 'Zero';
    const cr = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thou = Math.floor((num % 100000) / 1000);
    const rem = num % 1000;
    let result = '';
    if (cr) result += convert(cr) + ' Crore ';
    if (lakh) result += convert(lakh) + ' Lakh ';
    if (thou) result += convert(thou) + ' Thousand ';
    if (rem) result += convert(rem);
    return 'INR ' + result.trim() + ' Only';
  };

  const getTotals = () => {
    let taxable = 0, cgst = 0, sgst = 0, igst = 0;
    form.items.forEach(item => {
      if (item.desc && item.hsn) {
        const val = item.qty * item.rate;
        taxable += val;
        if (form.supplyType === 'intra-state') {
          const g = (val * item.gst) / 100;
          cgst += g / 2;
          sgst += g / 2;
        } else {
          igst += (val * item.gst) / 100;
        }
      }
    });
    const total = taxable + cgst + sgst + igst;
    return { taxable, cgst, sgst, igst, total };
  };

  const downloadInvoice = () => {
    if (!form.invoiceNo) { alert('Enter invoice number'); return; }
    if (!form.customer) { alert('Enter customer name'); return; }
    if (!form.items.some(i => i.desc && i.hsn)) { alert('Add at least one item'); return; }

    const totals = getTotals();
    const data = { ...form, totals, settings, amountWords: numToWords(Math.floor(totals.total)) };
    
    const invoicesList = JSON.parse(localStorage.getItem('billingInvoices') || '[]');
    invoicesList.push(data);
    localStorage.setItem('billingInvoices', JSON.stringify(invoicesList));
    setInvoices(invoicesList);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Invoice ${form.invoiceNo}</title>
<style>
body { font-family: Arial; margin: 20px; }
.container { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
h1 { text-align: center; font-size: 28px; margin: 0 0 15px 0; }
.company { margin: 10px 0; font-size: 12px; line-height: 1.5; }
.company-name { font-weight: bold; font-size: 14px; }
.header { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0; }
.box { border: 1px solid #000; padding: 10px; font-size: 11px; line-height: 1.5; }
.box-title { font-weight: bold; margin-bottom: 5px; }
.meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; font-size: 11px; }
table { width: 100%; border-collapse: collapse; margin: 15px 0; }
th, td { border: 1px solid #000; padding: 8px; font-size: 11px; }
th { background: #f0f0f0; font-weight: bold; }
.amt { text-align: right; }
.totals { margin: 15px 0; font-size: 11px; }
.total-row { display: grid; grid-template-columns: 1fr 150px; gap: 10px; margin: 5px 0; }
.total-val { text-align: right; border-bottom: 1px solid #000; padding: 2px 0; }
.grand { display: grid; grid-template-columns: 1fr 150px; gap: 10px; font-weight: bold; font-size: 12px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0; }
.words { background: #f9f9f9; padding: 10px; margin: 10px 0; border-left: 3px solid #000; font-size: 11px; }
.decl { margin: 15px 0; font-size: 11px; line-height: 1.5; }
.sig { margin-top: 30px; text-align: right; }
.sig-img { max-height: 50px; margin-bottom: 10px; }
.sig-line { border-top: 1px solid #000; width: 150px; margin: 30px auto 5px auto; }
.footer { text-align: center; font-size: 10px; margin-top: 20px; font-style: italic; }
</style>
</head>
<body>
<div class="container">
<h1>TAX INVOICE</h1>

<div class="company">
<div class="company-name">${settings.companyName}</div>
<div>${settings.address1}</div>
<div>${settings.address2}</div>
<div>GSTIN/UIN: ${settings.gstin}</div>
<div>State: ${settings.state}, Code: ${settings.stateCode}</div>
</div>

<div class="header">
<div class="box">
<div class="box-title">CONSIGNEE (SHIP TO)</div>
<div style="font-weight:bold;margin:5px 0">${form.customer}</div>
<div>${form.address}</div>
<div>${form.city}, ${form.state}</div>
<div>GSTIN: ${form.gstin}</div>
</div>
<div class="box">
<div class="box-title">BUYER (BILL TO)</div>
<div style="font-weight:bold;margin:5px 0">${form.customer}</div>
<div>${form.address}</div>
<div>${form.city}, ${form.state}</div>
<div>GSTIN: ${form.gstin}</div>
</div>
</div>

<div class="meta">
<div><b>Invoice No:</b> ${form.invoiceNo}</div>
<div><b>Date:</b> ${new Date(form.date).toLocaleDateString('en-IN')}</div>
</div>

<table>
<thead>
<tr><th>Description</th><th>HSN/SAC</th><th>Qty</th><th class="amt">Rate</th><th class="amt">Amount</th></tr>
</thead>
<tbody>
${form.items.filter(i => i.desc && i.hsn).map(item => {
  const amt = item.qty * item.rate;
  return `<tr><td>${item.desc}</td><td>${item.hsn}</td><td>${item.qty} ${item.unit}</td><td class="amt">₹${item.rate.toLocaleString('en-IN')}</td><td class="amt">₹${amt.toLocaleString('en-IN')}</td></tr>`;
}).join('')}
</tbody>
</table>

<div class="totals">
<div class="total-row">
<span>Taxable Value</span>
<span class="total-val">₹${totals.taxable.toLocaleString('en-IN')}</span>
</div>
${form.supplyType === 'intra-state' ? `
<div class="total-row">
<span>CGST @ 9%</span>
<span class="total-val">₹${totals.cgst.toLocaleString('en-IN')}</span>
</div>
<div class="total-row">
<span>SGST @ 9%</span>
<span class="total-val">₹${totals.sgst.toLocaleString('en-IN')}</span>
</div>
` : `
<div class="total-row">
<span>IGST</span>
<span class="total-val">₹${totals.igst.toLocaleString('en-IN')}</span>
</div>
`}
<div class="grand">
<span>GRAND TOTAL</span>
<span>₹${totals.total.toLocaleString('en-IN')}</span>
</div>
</div>

<div class="words">
<b>Amount in Words:</b> ${data.amountWords}
</div>

<div class="decl">
<b>Declaration:</b><br/>
${settings.declaration}
</div>

<div class="sig">
${settings.signature ? `<img src="${settings.signature}" class="sig-img" alt="Signature">` : ''}
<div>for ${settings.companyName}</div>
<div class="sig-line"></div>
<div>${settings.signatory}</div>
</div>

<div class="footer">This is a Computer Generated Invoice</div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${form.invoiceNo}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    alert('✅ Invoice downloaded!\n\nTo convert to PDF:\n1. Open the HTML file\n2. Press Ctrl+P (Cmd+P on Mac)\n3. Save as PDF');
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem('billingSettings', JSON.stringify(tempSettings));
    setShowSettings(false);
    alert('✅ Settings saved!');
  };

  const handleSigUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => setTempSettings({ ...tempSettings, signature: evt.target.result });
      reader.readAsDataURL(file);
    }
  };

  const totals = getTotals();
  const bg = settings.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const card = settings.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const input = settings.theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300';

  // Dashboard
  if (page === 'dashboard') {
    return (
      <div className={`min-h-screen ${bg}`}>
        <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{settings.companyName}</h1>
            <p className="text-sm text-blue-100">GST Invoice System</p>
          </div>
          <button onClick={() => { setTempSettings(settings); setShowSettings(true); }} className="flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded font-semibold hover:bg-gray-100">
            <Settings size={20} />
            Settings
          </button>
        </nav>

        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`${card} border rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">⚙️ Settings</h2>
                <button onClick={() => setShowSettings(false)}><X size={24} /></button>
              </div>

              <div className="space-y-4">
                <div><label className="block text-sm font-semibold mb-2">Company Name</label><input type="text" value={tempSettings.companyName} onChange={(e) => setTempSettings({ ...tempSettings, companyName: e.target.value })} className={`w-full border p-2 rounded ${input}`} /></div>
                <div><label className="block text-sm font-semibold mb-2">Address Line 1</label><input type="text" value={tempSettings.address1} onChange={(e) => setTempSettings({ ...tempSettings, address1: e.target.value })} className={`w-full border p-2 rounded ${input}`} /></div>
                <div><label className="block text-sm font-semibold mb-2">Address Line 2</label><input type="text" value={tempSettings.address2} onChange={(e) => setTempSettings({ ...tempSettings, address2: e.target.value })} className={`w-full border p-2 rounded ${input}`} /></div>
                <div><label className="block text-sm font-semibold mb-2">GSTIN</label><input type="text" value={tempSettings.gstin} onChange={(e) => setTempSettings({ ...tempSettings, gstin: e.target.value })} className={`w-full border p-2 rounded ${input}`} /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold mb-2">State</label><input type="text" value={tempSettings.state} onChange={(e) => setTempSettings({ ...tempSettings, state: e.target.value })} className={`w-full border p-2 rounded ${input}`} /></div><div><label className="block text-sm font-semibold mb-2">State Code</label><input type="text" value={tempSettings.stateCode} onChange={(e) => setTempSettings({ ...tempSettings, stateCode: e.target.value })} className={`w-full border p-2 rounded ${input}`} /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold mb-2">Invoice Prefix</label><input type="text" value={tempSettings.prefix} onChange={(e) => setTempSettings({ ...tempSettings, prefix: e.target.value })} className={`w-full border p-2 rounded ${input}`} /></div><div><label className="block text-sm font-semibold mb-2">Financial Year</label><input type="text" value={tempSettings.year} onChange={(e) => setTempSettings({ ...tempSettings, year: e.target.value })} className={`w-full border p-2 rounded ${input}`} /></div></div>
                <div><label className="block text-sm font-semibold mb-2">Default GST Rate</label><input type="number" value={tempSettings.gstRate} onChange={(e) => setTempSettings({ ...tempSettings, gstRate: parseInt(e.target.value) })} className={`w-full border p-2 rounded ${input}`} /></div>
                <div><label className="block text-sm font-semibold mb-2">Declaration Text</label><textarea value={tempSettings.declaration} onChange={(e) => setTempSettings({ ...tempSettings, declaration: e.target.value })} rows="3" className={`w-full border p-2 rounded ${input}`} /></div>
                <div><label className="block text-sm font-semibold mb-2">Authorized Signatory</label><input type="text" value={tempSettings.signatory} onChange={(e) => setTempSettings({ ...tempSettings, signatory: e.target.value })} className={`w-full border p-2 rounded ${input}`} /></div>
                <div><label className="block text-sm font-semibold mb-2">Upload Signature (Optional)</label><label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700"><Upload size={20} />Choose Image<input type="file" accept="image/*" onChange={handleSigUpload} className="hidden" /></label>{tempSettings.signature && <div className="text-sm mt-2">✅ Signature uploaded</div>}</div>
                <div><label className="block text-sm font-semibold mb-2">Theme</label><select value={tempSettings.theme} onChange={(e) => setTempSettings({ ...tempSettings, theme: e.target.value })} className={`w-full border p-2 rounded ${input}`}><option value="light">Light ☀️</option><option value="dark">Dark 🌙</option></select></div>
                <button onClick={saveSettings} className="w-full bg-green-600 text-white px-4 py-3 rounded font-semibold hover:bg-green-700 flex items-center justify-center gap-2"><Save size={20} />Save Settings</button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className={`${card} border p-6 rounded-lg shadow`}><div className="text-gray-600">📊 Total</div><div className="text-3xl font-bold text-blue-900">{invoices.length}</div></div>
            <div className={`${card} border p-6 rounded-lg shadow`}><div className="text-gray-600">📅 Today</div><div className="text-3xl font-bold">0</div></div>
            <div className={`${card} border p-6 rounded-lg shadow`}><div className="text-gray-600">📈 Month</div><div className="text-3xl font-bold">0</div></div>
            <div className={`${card} border p-6 rounded-lg shadow`}><div className="text-gray-600">💰 Total</div><div className="text-3xl font-bold">₹0</div></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <button onClick={() => { setForm({ invoiceNo: '', date: new Date().toISOString().split('T')[0], customer: '', address: '', city: '', state: '', gstin: '', items: [{ id: 1, desc: '', hsn: '', qty: 1, unit: 'pcs', rate: 0, gst: 18 }], supplyType: 'intra-state' }); setPage('invoice'); }} className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-8 rounded-lg hover:shadow-lg flex items-center justify-center gap-3"><Plus size={40} /><div><div className="text-2xl font-bold">New Invoice</div><div className="text-blue-100">Create invoice</div></div></button>
            <button onClick={() => setPage('history')} className="bg-gradient-to-r from-green-900 to-green-800 text-white p-8 rounded-lg hover:shadow-lg flex items-center justify-center gap-3"><History size={40} /><div><div className="text-2xl font-bold">History</div><div className="text-green-100">View all ({invoices.length})</div></div></button>
          </div>
        </div>
      </div>
    );
  }

  // Invoice Form
  if (page === 'invoice') {
    return (
      <div className={`min-h-screen ${bg}`}>
        <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">📝 New Invoice</h1>
          <button onClick={() => setPage('dashboard')} className="bg-white text-blue-900 px-4 py-2 rounded font-semibold hover:bg-gray-100">← Back</button>
        </nav>

        <div className="max-w-6xl mx-auto p-6">
          {!preview ? (
            <div className="space-y-6">
              <div className={`${card} border p-6 rounded-lg`}><h2 className="text-xl font-bold mb-4 text-blue-900">Invoice Details</h2><div className="grid grid-cols-3 gap-4"><div><label className="block text-sm font-semibold mb-2">Invoice Number *</label><input type="text" value={form.invoiceNo} onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })} placeholder="JB/001/2026-27" className={`w-full border p-2 rounded ${input}`} /></div><div><label className="block text-sm font-semibold mb-2">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={`w-full border p-2 rounded ${input}`} /></div><div><label className="block text-sm font-semibold mb-2">Supply Type</label><select value={form.supplyType} onChange={(e) => setForm({ ...form, supplyType: e.target.value })} className={`w-full border p-2 rounded ${input}`}><option value="intra-state">Intra-State</option><option value="inter-state">Inter-State</option></select></div></div></div>

              <div className={`${card} border p-6 rounded-lg`}><h2 className="text-xl font-bold mb-4 text-blue-900">Customer Details *</h2><div className="grid grid-cols-2 gap-4"><input type="text" placeholder="Customer Name *" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className={`col-span-2 border p-2 rounded ${input}`} /><input type="text" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`border p-2 rounded ${input}`} /><input type="text" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={`border p-2 rounded ${input}`} /><input type="text" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={`border p-2 rounded ${input}`} /><input type="text" placeholder="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className={`col-span-2 border p-2 rounded ${input}`} /></div></div>

              <div className={`${card} border p-6 rounded-lg`}><h2 className="text-xl font-bold mb-4 text-blue-900">Items *</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-200"><tr><th className="p-2 text-left">Description *</th><th className="p-2">HSN *</th><th className="p-2">Qty</th><th className="p-2">Unit</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Value</th><th className="p-2">GST %</th><th className="p-2">Action</th></tr></thead><tbody>{form.items.map((item) => (<tr key={item.id}><td className="p-2"><input type="text" value={item.desc} onChange={(e) => setForm({ ...form, items: form.items.map(i => i.id === item.id ? { ...i, desc: e.target.value } : i) })} className={`w-full border p-1 rounded text-xs ${input}`} placeholder="Description" /></td><td className="p-2"><input type="text" value={item.hsn} onChange={(e) => setForm({ ...form, items: form.items.map(i => i.id === item.id ? { ...i, hsn: e.target.value } : i) })} className={`w-full border p-1 rounded text-xs ${input}`} placeholder="HSN" /></td><td className="p-2"><input type="number" value={item.qty} onChange={(e) => setForm({ ...form, items: form.items.map(i => i.id === item.id ? { ...i, qty: parseFloat(e.target.value) || 0 } : i) })} className={`w-full border p-1 rounded text-xs ${input}`} /></td><td className="p-2"><input type="text" value={item.unit} onChange={(e) => setForm({ ...form, items: form.items.map(i => i.id === item.id ? { ...i, unit: e.target.value } : i) })} className={`w-full border p-1 rounded text-xs ${input}`} placeholder="pcs" /></td><td className="p-2"><input type="number" value={item.rate} onChange={(e) => setForm({ ...form, items: form.items.map(i => i.id === item.id ? { ...i, rate: parseFloat(e.target.value) || 0 } : i) })} className={`w-full border p-1 rounded text-xs text-right ${input}`} /></td><td className="p-2 text-right font-semibold">₹{(item.qty * item.rate).toLocaleString('en-IN')}</td><td className="p-2"><select value={item.gst} onChange={(e) => setForm({ ...form, items: form.items.map(i => i.id === item.id ? { ...i, gst: parseFloat(e.target.value) } : i) })} className={`w-full border p-1 rounded text-xs ${input}`}><option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option></select></td><td className="p-2"><button onClick={() => { if (form.items.length > 1) setForm({ ...form, items: form.items.filter(i => i.id !== item.id) }); }} className="text-red-600 hover:text-red-900 text-xs">Remove</button></td></tr>))}</tbody></table></div><button onClick={() => setForm({ ...form, items: [...form.items, { id: Math.max(...form.items.map(i => i.id), 0) + 1, desc: '', hsn: '', qty: 1, unit: 'pcs', rate: 0, gst: 18 }] })} className="mt-4 bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 font-semibold">+ Add Item</button></div>

              <div className={`${card} border p-6 rounded-lg`}><h2 className="text-xl font-bold mb-4">Summary</h2><div className="grid grid-cols-3 gap-4"><div><div className="text-gray-600 text-sm">Taxable</div><div className="text-2xl font-bold">₹{totals.taxable.toLocaleString('en-IN')}</div></div><div><div className="text-gray-600 text-sm">{form.supplyType === 'intra-state' ? 'CGST' : 'IGST'}</div><div className="text-2xl font-bold">₹{form.supplyType === 'intra-state' ? totals.cgst.toLocaleString('en-IN') : totals.igst.toLocaleString('en-IN')}</div></div><div className="bg-green-50 p-2 rounded"><div className="text-gray-600 text-sm">Total</div><div className="text-2xl font-bold text-green-900">₹{totals.total.toLocaleString('en-IN')}</div></div></div></div>

              <div className="flex gap-4 justify-center"><button onClick={() => setPreview(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-semibold"><Eye size={20} />Preview</button><button onClick={downloadInvoice} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-semibold"><Download size={20} />Download PDF</button></div>
            </div>
          ) : (
            <div className={`${card} border p-8 rounded-lg`}><div className="flex justify-between mb-6"><h2 className="text-2xl font-bold">Preview</h2><button onClick={() => setPreview(false)} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">← Back</button></div><div className="border-t-2 border-b-2 border-gray-800 py-6 text-xs space-y-3"><h1 className="text-center text-3xl font-bold">TAX INVOICE</h1><div><b>{settings.companyName}</b><br/>{settings.address1}<br/>{settings.address2}<br/>GSTIN: {settings.gstin}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}><div style={{border:'1px solid #000',padding:'10px'}}><b>CONSIGNEE</b><br/>{form.customer}</div><div style={{border:'1px solid #000',padding:'10px'}}><b>BUYER</b><br/>{form.customer}</div></div><div><b>Invoice:</b> {form.invoiceNo} | <b>Date:</b> {new Date(form.date).toLocaleDateString('en-IN')}</div><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr style={{background:'#f0f0f0'}}><th style={{border:'1px solid #000',padding:'5px'}}>Description</th><th style={{border:'1px solid #000',padding:'5px'}}>HSN</th><th style={{border:'1px solid #000',padding:'5px'}}>Qty</th><th style={{border:'1px solid #000',padding:'5px',textAlign:'right'}}>Rate</th><th style={{border:'1px solid #000',padding:'5px',textAlign:'right'}}>Amount</th></tr></thead><tbody>{form.items.filter(i => i.desc && i.hsn).map(item => <tr key={item.id}><td style={{border:'1px solid #000',padding:'5px'}}>{item.desc}</td><td style={{border:'1px solid #000',padding:'5px'}}>{item.hsn}</td><td style={{border:'1px solid #000',padding:'5px'}}>{item.qty}</td><td style={{border:'1px solid #000',padding:'5px',textAlign:'right'}}>₹{item.rate.toLocaleString('en-IN')}</td><td style={{border:'1px solid #000',padding:'5px',textAlign:'right'}}>₹{(item.qty*item.rate).toLocaleString('en-IN')}</td></tr>)}</tbody></table><div><b>Taxable:</b> ₹{totals.taxable.toLocaleString('en-IN')}<br/>{form.supplyType === 'intra-state' ? `<b>CGST:</b> ₹${totals.cgst.toLocaleString('en-IN')}<br/><b>SGST:</b> ₹${totals.sgst.toLocaleString('en-IN')}` : `<b>IGST:</b> ₹${totals.igst.toLocaleString('en-IN')}`}<br/><b style={{fontSize:'14px'}}>TOTAL: ₹{totals.total.toLocaleString('en-IN')}</b></div><div style={{background:'#f9f9f9',padding:'10px'}}><b>Amount in Words:</b> {numToWords(Math.floor(totals.total))}</div><div><b>Declaration:</b> {settings.declaration}</div>{settings.signature && <img src={settings.signature} style={{maxHeight:'50px',marginTop:'10px'}} alt="Sig" />}<div style={{marginTop:'20px'}}>for {settings.companyName}<br/><br/>_______<br/>{settings.signatory}</div></div><div className="flex gap-4 justify-center mt-6"><button onClick={() => setPreview(false)} className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">← Edit</button><button onClick={downloadInvoice} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"><Download size={20} />Download</button></div></div>
          )}
        </div>
      </div>
    );
  }

  // History
  if (page === 'history') {
    return (
      <div className={`min-h-screen ${bg}`}>
        <nav className="bg-gradient-to-r from-green-900 to-green-800 text-white p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">📚 History</h1>
          <button onClick={() => setPage('dashboard')} className="bg-white text-green-900 px-4 py-2 rounded font-semibold hover:bg-gray-100">← Back</button>
        </nav>
        <div className="max-w-6xl mx-auto p-6">
          <div className={`${card} border p-6 rounded-lg`}>
            {invoices.length === 0 ? (
              <div className="text-center py-12"><div className="text-5xl mb-4">📄</div><p>No invoices</p></div>
            ) : (
              <table className="w-full"><thead className="bg-gray-200"><tr><th className="p-3 text-left">Invoice</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Customer</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{invoices.map((inv, i) => <tr key={i}><td className="p-3 font-semibold text-blue-600">{inv.invoiceNo}</td><td className="p-3">{new Date(inv.date).toLocaleDateString('en-IN')}</td><td className="p-3">{inv.customer}</td><td className="p-3 text-right font-semibold">₹{inv.totals.total.toLocaleString('en-IN')}</td></tr>)}</tbody></table>
            )}
          </div>
        </div>
      </div>
    );
  }
}
