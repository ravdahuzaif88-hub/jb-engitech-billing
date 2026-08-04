import React, { useState, useEffect } from 'react';
import { Plus, Download, Eye, Settings, History, Users, Home, Save, X, Upload } from 'lucide-react';

export default function JBEngitechBilling() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [theme, setTheme] = useState('light');
  
  const [settings, setSettings] = useState({
    companyName: 'JB ENGITECH',
    companyAddress1: 'Shed no 4, Survey no 248, Plot no 18/19',
    companyAddress2: 'Rajan Tech Road, Shapur, Rajkot',
    companyGstin: '24GDRPS8977N1Z1',
    companyState: 'Gujarat',
    companyStateCode: '24',
    invoicePrefix: 'JB',
    defaultGstRate: 18,
    financialYear: '2026-27',
    theme: 'light',
    signatureImage: null,
    declaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    authorizedSignatory: 'Authorised Signatory',
  });

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    consigneeDetails: { name: '', address1: '', address2: '', address3: '', city: '', state: '', stateCode: '', gstin: '', pin: '' },
    buyerDetails: { name: '', address1: '', address2: '', address3: '', city: '', state: '', stateCode: '', gstin: '', pin: '' },
    sameAsConsignee: false,
    supplyType: 'intra-state',
    items: [{ id: 1, description: '', hsn: '', quantity: 1, unit: 'pcs', rate: 0, gstRate: 18 }],
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    const saved = localStorage.getItem('jbSettings');
    if (saved) setSettings(JSON.parse(saved));
    const invoices = localStorage.getItem('invoices');
    if (invoices) setInvoices(JSON.parse(invoices));
  }, []);

  const calculateTotals = () => {
    let totalTaxableValue = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0, totalGST = 0;
    formData.items.forEach(item => {
      if (item.description && item.hsn) {
        const taxableValue = item.quantity * item.rate;
        totalTaxableValue += taxableValue;
        if (formData.supplyType === 'intra-state') {
          const gstAmount = (taxableValue * item.gstRate) / 100;
          totalCGST += gstAmount / 2;
          totalSGST += gstAmount / 2;
          totalGST += gstAmount;
        } else {
          const igstAmount = (taxableValue * item.gstRate) / 100;
          totalIGST += igstAmount;
          totalGST += igstAmount;
        }
      }
    });
    return {
      totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
      totalCGST: Math.round(totalCGST * 100) / 100,
      totalSGST: Math.round(totalSGST * 100) / 100,
      totalIGST: Math.round(totalIGST * 100) / 100,
      totalGST: Math.round(totalGST * 100) / 100,
      grandTotal: Math.round((totalTaxableValue + totalGST) * 100) / 100,
    };
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const convertBelow1000 = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertBelow1000(n % 100) : '');
    };
    if (num === 0) return 'Zero';
    const crores = Math.floor(num / 10000000);
    const lakhs = Math.floor((num % 10000000) / 100000);
    const thousands = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;
    let result = '';
    if (crores) result += convertBelow1000(crores) + ' Crore ';
    if (lakhs) result += convertBelow1000(lakhs) + ' Lakh ';
    if (thousands) result += convertBelow1000(thousands) + ' Thousand ';
    if (remainder) result += convertBelow1000(remainder);
    return 'INR ' + result.trim() + ' Only';
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setTempSettings({ ...tempSettings, signatureImage: event.target.result });
      reader.readAsDataURL(file);
    }
  };

  const downloadPDF = () => {
    if (!formData.invoiceNumber) { alert('Please enter invoice number'); return; }
    if (!formData.consigneeDetails.name) { alert('Please enter customer name'); return; }
    if (formData.items.filter(i => i.description && i.hsn).length === 0) { alert('Please add at least one item'); return; }
    
    const totals = calculateTotals();
    const invoiceData = { ...formData, totals, settings, amountInWords: numberToWords(Math.floor(totals.grandTotal)), taxAmountInWords: numberToWords(Math.floor(totals.totalGST)) };
    const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    existingInvoices.push(invoiceData);
    localStorage.setItem('invoices', JSON.stringify(existingInvoices));
    setInvoices(existingInvoices);
    
    const htmlContent = generateInvoiceHTML(invoiceData);
    const element = document.createElement('a');
    const file = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice-${formData.invoiceNumber}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    alert('✅ Invoice downloaded!\n\nTo convert to PDF:\n1. Open HTML file in Chrome\n2. Press Ctrl+P\n3. Save as PDF');
  };

  const generateInvoiceHTML = (invoiceData) => {
    const t = invoiceData.totals;
    const s = invoiceData.settings;
    const f = invoiceData;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice</title><style>body{font-family:Arial;margin:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:8px}th{background:#f0f0f0}.amount{text-align:right}</style></head><body><div style="max-width:800px;margin:0 auto"><h1 style="text-align:center">TAX INVOICE</h1><p><b>${s.companyName}</b><br>${s.companyAddress1}<br>${s.companyAddress2}<br>GSTIN: ${s.companyGstin}</p><table><tr><td><b>CONSIGNEE</b><br>${f.consigneeDetails.name}<br>${f.consigneeDetails.address1}</td><td><b>BUYER</b><br>${f.buyerDetails.name}<br>${f.buyerDetails.address1}</td></tr></table><p><b>Invoice:</b> ${f.invoiceNumber}<br><b>Date:</b> ${new Date(f.invoiceDate).toLocaleDateString('en-IN')}</p><table><thead><tr><th>Description</th><th>HSN</th><th>Qty</th><th class="amount">Rate</th><th class="amount">Amount</th></tr></thead><tbody>${f.items.filter(i=>i.description).map(item=>`<tr><td>${item.description}</td><td>${item.hsn}</td><td>${item.quantity}</td><td class="amount">₹${item.rate.toLocaleString('en-IN')}</td><td class="amount">₹${(item.quantity*item.rate).toLocaleString('en-IN')}</td></tr>`).join('')}</tbody></table><p><b>Taxable:</b> ₹${t.totalTaxableValue.toLocaleString('en-IN')}<br>${f.supplyType==='intra-state'?`<b>CGST:</b> ₹${t.totalCGST.toLocaleString('en-IN')}<br><b>SGST:</b> ₹${t.totalSGST.toLocaleString('en-IN')}` : `<b>IGST:</b> ₹${t.totalIGST.toLocaleString('en-IN')}`}<br><b>TOTAL: ₹${t.grandTotal.toLocaleString('en-IN')}</b></p><p style="background:#f9f9f9;padding:10px"><b>Amount in Words:</b> ${invoiceData.amountInWords}</p><p><b>Declaration:</b> ${s.declaration}</p>${s.signatureImage?`<img src="${s.signatureImage}" style="max-height:60px">`:''}<p>for ${s.companyName}<br><br>_______<br>${s.authorizedSignatory}</p><p style="text-align:center;font-size:10px;margin-top:30px">This is a Computer Generated Invoice</p></div></body></html>`;
  };

  const updateFormData = (path, value) => {
    const newFormData = { ...formData };
    const keys = path.split('.');
    let current = newFormData;
    for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
    current[keys[keys.length - 1]] = value;
    setFormData(newFormData);
  };

  const addItem = () => updateFormData('items', [...formData.items, { id: Math.max(...formData.items.map(i => i.id), 0) + 1, description: '', hsn: '', quantity: 1, unit: 'pcs', rate: 0, gstRate: 18 }]);
  const removeItem = (id) => { if (formData.items.length > 1) updateFormData('items', formData.items.filter(item => item.id !== id)); };
  const updateItem = (id, field, value) => updateFormData('items', formData.items.map(item => item.id === id ? { ...item, [field]: value } : item));

  const saveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem('jbSettings', JSON.stringify(tempSettings));
    setTheme(tempSettings.theme);
    setShowSettings(false);
    alert('✅ Settings saved!');
  };

  const totals = calculateTotals();
  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 border-gray-300';

  if (currentPage === 'dashboard') {
    return (
      <div className={`min-h-screen ${bgColor}`}>
        <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-3xl font-bold">{settings.companyName}</h1>
            <p className="text-sm text-blue-100">GST Tax Invoice System</p>
          </div>
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-lg hover:bg-blue-50 font-semibold">
            <Settings size={20} />
            Settings
          </button>
        </nav>

        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${textColor}`}>⚙️ Settings</h2>
                <button onClick={() => setShowSettings(false)}><X size={24} className={textColor} /></button>
              </div>

              <div className="space-y-4">
                <div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>Company Name</label><input type="text" value={tempSettings.companyName} onChange={(e) => setTempSettings({ ...tempSettings, companyName: e.target.value })} className={`w-full border p-2 rounded ${inputBg}`} /></div>
                <div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>Address Line 1</label><input type="text" value={tempSettings.companyAddress1} onChange={(e) => setTempSettings({ ...tempSettings, companyAddress1: e.target.value })} className={`w-full border p-2 rounded ${inputBg}`} /></div>
                <div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>Address Line 2</label><input type="text" value={tempSettings.companyAddress2} onChange={(e) => setTempSettings({ ...tempSettings, companyAddress2: e.target.value })} className={`w-full border p-2 rounded ${inputBg}`} /></div>
                <div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>GSTIN</label><input type="text" value={tempSettings.companyGstin} onChange={(e) => setTempSettings({ ...tempSettings, companyGstin: e.target.value })} className={`w-full border p-2 rounded ${inputBg}`} /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>State</label><input type="text" value={tempSettings.companyState} onChange={(e) => setTempSettings({ ...tempSettings, companyState: e.target.value })} className={`w-full border p-2 rounded ${inputBg}`} /></div><div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>State Code</label><input type="text" value={tempSettings.companyStateCode} onChange={(e) => setTempSettings({ ...tempSettings, companyStateCode: e.target.value })} className={`w-full border p-2 rounded ${inputBg}`} /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>Invoice Prefix</label><input type="text" value={tempSettings.invoicePrefix} onChange={(e) => setTempSettings({ ...tempSettings, invoicePrefix: e.target.value })} className={`w-full border p-2 rounded ${inputBg}`} /></div><div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>Financial Year</label><input type="text" value={tempSettings.financialYear} onChange={(e) => setTempSettings({ ...tempSettings, financialYear: e.target.value })} className={`w-full border p-2 rounded ${inputBg}`} /></div></div>
                <div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>Default GST Rate (%)</label><input type="number" value={tempSettings.defaultGstRate} onChange={(e) => setTempSettings({ ...tempSettings, defaultGstRate: parseInt(e.target.value) })} className={`w-full border p-2 rounded ${inputBg}`} /></div>
                <div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>Declaration Text</label><textarea value={tempSettings.declaration} onChange={(e) => setTempSettings({ ...tempSettings, declaration: e.target.value })} rows="3" className={`w-full border p-2 rounded ${inputBg}`} /></div>
                <div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>Authorized Signatory</label><input type="text" value={tempSettings.authorizedSignatory} onChange={(e) => setTempSettings({ ...tempSettings, authorizedSignatory: e.target.value })} className={`w-full border p-2 rounded ${inputBg}`} /></div>
                <div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>Upload Signature</label><label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700"><Upload size={20} />Choose Image<input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" /></label>{tempSettings.signatureImage && <div className="text-sm mt-2">✅ Signature uploaded</div>}</div>
                <div><label className={`block text-sm font-semibold mb-2 ${textColor}`}>Theme</label><select value={tempSettings.theme} onChange={(e) => setTempSettings({ ...tempSettings, theme: e.target.value })} className={`w-full border p-2 rounded ${inputBg}`}><option value="light">Light</option><option value="dark">Dark</option></select></div>
                <button onClick={saveSettings} className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold"><Save size={20} />Save Settings</button>
              </div>
            </div>
          </div>
        )}

        <div className={`max-w-7xl mx-auto p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`${cardBg} border p-6 rounded-lg shadow-md`}><div className={`text-gray-600`}>📊 Total Invoices</div><div className={`text-4xl font-bold text-blue-900`}>{invoices.length}</div></div>
            <div className={`${cardBg} border p-6 rounded-lg shadow-md`}><div className={`text-gray-600`}>📅 Today</div><div className={`text-4xl font-bold text-green-900`}>0</div></div>
            <div className={`${cardBg} border p-6 rounded-lg shadow-md`}><div className={`text-gray-600`}>📈 This Month</div><div className={`text-4xl font-bold text-purple-900`}>0</div></div>
            <div className={`${cardBg} border p-6 rounded-lg shadow-md`}><div className={`text-gray-600`}>💰 Total Sales</div><div className={`text-4xl font-bold text-yellow-900`}>₹0</div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setCurrentPage('new-invoice')} className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white p-8 rounded-lg hover:shadow-lg"><Plus size={40} /><div><div className="text-2xl font-semibold">New Invoice</div><div className="text-blue-100">Create a new invoice</div></div></button>
            <button onClick={() => setCurrentPage('invoice-history')} className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-900 to-green-800 text-white p-8 rounded-lg hover:shadow-lg"><History size={40} /><div><div className="text-2xl font-semibold">Invoice History</div><div className="text-green-100">View all ({invoices.length})</div></div></button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'new-invoice') {
    return (
      <div className={`min-h-screen ${bgColor}`}>
        <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 flex justify-between items-center shadow-lg">
          <h1 className="text-2xl font-bold">📝 New Invoice</h1>
          <button onClick={() => setCurrentPage('dashboard')} className="bg-white text-blue-900 px-4 py-2 rounded-lg hover:bg-blue-50 font-semibold">← Back</button>
        </nav>

        <div className={`max-w-6xl mx-auto p-6`}>
          {!previewMode ? (
            <div className="space-y-6">
              <div className={`${cardBg} border p-6 rounded-lg shadow-md`}><h2 className={`text-xl font-bold mb-4 text-blue-900`}>📋 Invoice Details</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-sm font-semibold mb-2">Invoice Number *</label><input type="text" value={formData.invoiceNumber} onChange={(e) => updateFormData('invoiceNumber', e.target.value)} className={`w-full border p-2 rounded ${inputBg}`} placeholder="JB/001/2026-27" /></div><div><label className="block text-sm font-semibold mb-2">Invoice Date</label><input type="date" value={formData.invoiceDate} onChange={(e) => updateFormData('invoiceDate', e.target.value)} className={`w-full border p-2 rounded ${inputBg}`} /></div><div><label className="block text-sm font-semibold mb-2">Supply Type</label><select value={formData.supplyType} onChange={(e) => updateFormData('supplyType', e.target.value)} className={`w-full border p-2 rounded ${inputBg}`}><option value="intra-state">Intra-State (CGST+SGST)</option><option value="inter-state">Inter-State (IGST)</option></select></div></div></div>

              <div className={`${cardBg} border p-6 rounded-lg shadow-md`}><h2 className={`text-xl font-bold mb-4 text-blue-900`}>🏢 Consignee (Ship to) *</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" placeholder="Customer Name *" value={formData.consigneeDetails.name} onChange={(e) => updateFormData('consigneeDetails.name', e.target.value)} className={`col-span-2 border p-2 rounded ${inputBg}`} /><input type="text" placeholder="Address Line 1" value={formData.consigneeDetails.address1} onChange={(e) => updateFormData('consigneeDetails.address1', e.target.value)} className={`border p-2 rounded ${inputBg}`} /><input type="text" placeholder="Address Line 2" value={formData.consigneeDetails.address2} onChange={(e) => updateFormData('consigneeDetails.address2', e.target.value)} className={`border p-2 rounded ${inputBg}`} /><input type="text" placeholder="City" value={formData.consigneeDetails.city} onChange={(e) => updateFormData('consigneeDetails.city', e.target.value)} className={`border p-2 rounded ${inputBg}`} /><input type="text" placeholder="State" value={formData.consigneeDetails.state} onChange={(e) => updateFormData('consigneeDetails.state', e.target.value)} className={`border p-2 rounded ${inputBg}`} /><input type="text" placeholder="GSTIN" value={formData.consigneeDetails.gstin} onChange={(e) => updateFormData('consigneeDetails.gstin', e.target.value)} className={`col-span-2 border p-2 rounded ${inputBg}`} /></div></div>

              <div className={`${cardBg} border p-6 rounded-lg shadow-md`}><label className="flex items-center gap-2"><input type="checkbox" checked={formData.sameAsConsignee} onChange={(e) => { updateFormData('sameAsConsignee', e.target.checked); if (e.target.checked) updateFormData('buyerDetails', { ...formData.consigneeDetails }); }} className="w-4 h-4" /><span className="font-semibold">👤 Same as Consignee</span></label></div>

              {!formData.sameAsConsignee && (
                <div className={`${cardBg} border p-6 rounded-lg shadow-md`}><h2 className={`text-xl font-bold mb-4 text-blue-900`}>🏪 Buyer (Bill to)</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" placeholder="Customer Name" value={formData.buyerDetails.name} onChange={(e) => updateFormData('buyerDetails.name', e.target.value)} className={`col-span-2 border p-2 rounded ${inputBg}`} /><input type="text" placeholder="Address Line 1" value={formData.buyerDetails.address1} onChange={(e) => updateFormData('buyerDetails.address1', e.target.value)} className={`border p-2 rounded ${inputBg}`} /><input type="text" placeholder="Address Line 2" value={formData.buyerDetails.address2} onChange={(e) => updateFormData('buyerDetails.address2', e.target.value)} className={`border p-2 rounded ${inputBg}`} /><input type="text" placeholder="City" value={formData.buyerDetails.city} onChange={(e) => updateFormData('buyerDetails.city', e.target.value)} className={`border p-2 rounded ${inputBg}`} /><input type="text" placeholder="State" value={formData.buyerDetails.state} onChange={(e) => updateFormData('buyerDetails.state', e.target.value)} className={`border p-2 rounded ${inputBg}`} /><input type="text" placeholder="GSTIN" value={formData.buyerDetails.gstin} onChange={(e) => updateFormData('buyerDetails.gstin', e.target.value)} className={`col-span-2 border p-2 rounded ${inputBg}`} /></div></div>
              )}

              <div className={`${cardBg} border p-6 rounded-lg shadow-md`}><h2 className={`text-xl font-bold mb-4 text-blue-900`}>📦 Items *</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-200"><tr><th className="p-2 text-left">Description *</th><th className="p-2 text-left">HSN *</th><th className="p-2">Qty</th><th className="p-2">Unit</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Value</th><th className="p-2 text-right">GST %</th><th className="p-2 text-center">Action</th></tr></thead><tbody>{formData.items.map((item) => { const val = item.quantity * item.rate; return (<tr key={item.id}><td className="p-2"><input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className={`w-full border p-1 rounded text-xs ${inputBg}`} placeholder="Description" /></td><td className="p-2"><input type="text" value={item.hsn} onChange={(e) => updateItem(item.id, 'hsn', e.target.value)} className={`w-full border p-1 rounded text-xs ${inputBg}`} placeholder="HSN" /></td><td className="p-2"><input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value)||0)} className={`w-full border p-1 rounded text-xs ${inputBg}`} /></td><td className="p-2"><input type="text" value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className={`w-full border p-1 rounded text-xs ${inputBg}`} placeholder="pcs" /></td><td className="p-2 text-right"><input type="number" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value)||0)} className={`w-full border p-1 rounded text-xs text-right ${inputBg}`} /></td><td className="p-2 text-right text-sm font-semibold">₹{val.toLocaleString('en-IN')}</td><td className="p-2"><select value={item.gstRate} onChange={(e) => updateItem(item.id, 'gstRate', parseFloat(e.target.value))} className={`w-full border p-1 rounded text-xs ${inputBg}`}><option>0%</option><option>5%</option><option>12%</option><option value="18">18%</option><option>28%</option></select></td><td className="p-2 text-center"><button onClick={() => removeItem(item.id)} disabled={formData.items.length===1} className="text-red-600 hover:text-red-900 text-xs disabled:text-gray-400">✕</button></td></tr>); })}</tbody></table></div><button onClick={addItem} className="mt-4 bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 font-semibold">+ Add Item</button></div>

              <div className={`${cardBg} border p-6 rounded-lg shadow-md`}><h2 className={`text-xl font-bold mb-4 text-blue-900`}>💵 Summary</h2><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div><div className={`text-gray-600 text-sm`}>Taxable Value</div><div className="text-2xl font-bold">₹{totals.totalTaxableValue.toLocaleString('en-IN')}</div></div>{formData.supplyType==='intra-state'?<><div><div className={`text-gray-600 text-sm`}>CGST</div><div className="text-2xl font-bold">₹{totals.totalCGST.toLocaleString('en-IN')}</div></div><div><div className={`text-gray-600 text-sm`}>SGST</div><div className="text-2xl font-bold">₹{totals.totalSGST.toLocaleString('en-IN')}</div></div></>:<div><div className={`text-gray-600 text-sm`}>IGST</div><div className="text-2xl font-bold">₹{totals.totalIGST.toLocaleString('en-IN')}</div></div>}<div className="bg-yellow-50 p-2 rounded"><div className={`text-gray-600 text-sm`}>Total GST</div><div className="text-2xl font-bold">₹{totals.totalGST.toLocaleString('en-IN')}</div></div><div className="bg-green-50 p-2 rounded md:col-span-2"><div className={`text-gray-600 text-sm`}>Grand Total</div><div className="text-3xl font-bold text-green-900">₹{totals.grandTotal.toLocaleString('en-IN')}</div></div></div></div>

              <div className="flex gap-4 justify-center flex-wrap"><button onClick={() => setPreviewMode(true)} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"><Eye size={20} />Preview</button><button onClick={downloadPDF} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"><Download size={20} />Download</button></div>
            </div>
          ) : (
            <div className={`${cardBg} border p-8 rounded-lg shadow-md`}><div className="flex justify-between mb-6"><h2 className="text-2xl font-bold">📄 Preview</h2><button onClick={() => setPreviewMode(false)} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">← Back</button></div><div className="border-t-2 border-b-2 border-gray-800 py-6 space-y-4 text-xs"><h1 className="text-center text-3xl font-bold">TAX INVOICE</h1><div><b>{settings.companyName}</b><br/>{settings.companyAddress1}<br/>{settings.companyAddress2}<br/>GSTIN: {settings.companyGstin}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}><div style={{border:'1px solid #000',padding:'10px'}}><b>CONSIGNEE</b><br/>{formData.consigneeDetails.name}</div><div style={{border:'1px solid #000',padding:'10px'}}><b>BUYER</b><br/>{formData.buyerDetails.name}</div></div><div><b>Invoice:</b> {formData.invoiceNumber} | <b>Date:</b> {new Date(formData.invoiceDate).toLocaleDateString('en-IN')}</div><table style={{width:'100%',borderCollapse:'collapse'}}><thead style={{backgroundColor:'#f0f0f0'}}><tr><th style={{border:'1px solid #000',padding:'5px'}}>Description</th><th style={{border:'1px solid #000',padding:'5px'}}>HSN</th><th style={{border:'1px solid #000',padding:'5px'}}>Qty</th><th style={{border:'1px solid #000',padding:'5px',textAlign:'right'}}>Rate</th><th style={{border:'1px solid #000',padding:'5px',textAlign:'right'}}>Amount</th></tr></thead><tbody>{formData.items.filter(i=>i.description).map(item=><tr key={item.id}><td style={{border:'1px solid #000',padding:'5px'}}>{item.description}</td><td style={{border:'1px solid #000',padding:'5px'}}>{item.hsn}</td><td style={{border:'1px solid #000',padding:'5px'}}>{item.quantity}</td><td style={{border:'1px solid #000',padding:'5px',textAlign:'right'}}>₹{item.rate.toLocaleString('en-IN')}</td><td style={{border:'1px solid #000',padding:'5px',textAlign:'right'}}>₹{(item.quantity*item.rate).toLocaleString('en-IN')}</td></tr>)}</tbody></table><div><b>Taxable:</b> ₹{totals.totalTaxableValue.toLocaleString('en-IN')}<br/>{formData.supplyType==='intra-state'?<><b>CGST:</b> ₹{totals.totalCGST.toLocaleString('en-IN')}<br/><b>SGST:</b> ₹{totals.totalSGST.toLocaleString('en-IN')}</>:<><b>IGST:</b> ₹{totals.totalIGST.toLocaleString('en-IN')}</>}<br/><b style={{fontSize:'16px'}}>TOTAL: ₹{totals.grandTotal.toLocaleString('en-IN')}</b></div><div style={{backgroundColor:'#f9f9f9',padding:'10px'}}><b>Amount in Words:</b> {numberToWords(Math.floor(totals.grandTotal))}</div><div><b>Declaration:</b> {settings.declaration}</div>{settings.signatureImage&&<img src={settings.signatureImage} style={{maxHeight:'50px'}} alt="Signature"/>}<div>for {settings.companyName}<br/><br/>_______<br/>{settings.authorizedSignatory}</div><div style={{textAlign:'center',fontSize:'10px',marginTop:'20px',fontStyle:'italic'}}>This is a Computer Generated Invoice</div></div><div className="flex gap-4 justify-center mt-6"><button onClick={() => setPreviewMode(false)} className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">← Edit</button><button onClick={downloadPDF} className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"><Download size={20} />Download</button></div></div>
          )}
        </div>
      </div>
    );
  }

  if (currentPage === 'invoice-history') {
    return (
      <div className={`min-h-screen ${bgColor}`}>
        <nav className="bg-gradient-to-r from-green-900 to-green-800 text-white p-4 flex justify-between items-center shadow-lg">
          <h1 className="text-2xl font-bold">📚 Invoice History</h1>
          <button onClick={() => setCurrentPage('dashboard')} className="bg-white text-green-900 px-4 py-2 rounded-lg hover:bg-green-50 font-semibold">← Back</button>
        </nav>
        <div className={`max-w-6xl mx-auto p-6`}><div className={`${cardBg} border p-6 rounded-lg shadow-md`}>{invoices.length===0?<div className="text-center py-12"><div className="text-5xl mb-4">📄</div><p className={`text-lg font-semibold ${textColor}`}>No invoices yet</p></div>:<div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-200"><tr><th className="p-3 text-left">Invoice No.</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Customer</th><th className="p-3 text-right">Amount</th></tr></thead><tbody>{[...invoices].reverse().map((inv,idx)=><tr key={idx}><td className="p-3 font-semibold text-blue-600">{inv.invoiceNumber}</td><td className="p-3">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td><td className="p-3">{inv.consigneeDetails.name}</td><td className="p-3 text-right">₹{inv.totals.grandTotal.toLocaleString('en-IN')}</td></tr>)}</tbody></table></div>}</div></div>
      </div>
    );
  }
}
