import React, { useState, useEffect } from 'react';
import { Plus, Download, Eye, Settings, History, Users, Home, Moon, Sun, Save, X, Upload } from 'lucide-react';

export default function JBEngitechBilling() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [theme, setTheme] = useState('light');
  
  // Settings State
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
    deliveryNote: '',
    referenceNo: '',
    referenceDate: '',
    buyerOrderNo: '',
    dispatchDocNo: '',
    dispatchedThrough: '',
    modeOfPayment: '',
    otherReferences: '',
    deliveryNoteDate: '',
    destination: '',
    termsOfDelivery: '',
    supplyType: 'intra-state',
    
    consigneeDetails: {
      name: '',
      address1: '',
      address2: '',
      address3: '',
      city: '',
      state: '',
      stateCode: '',
      gstin: '',
      pin: '',
    },
    
    buyerDetails: {
      name: '',
      address1: '',
      address2: '',
      address3: '',
      city: '',
      state: '',
      stateCode: '',
      gstin: '',
      pin: '',
    },
    
    sameAsConsignee: false,
    items: [
      {
        id: 1,
        description: '',
        hsn: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        gstRate: 18,
      },
    ],
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('jbSettings');
    if (savedSettings) {
      const loaded = JSON.parse(savedSettings);
      setSettings(loaded);
      setTempSettings(loaded);
      setTheme(loaded.theme);
    }
    
    const savedInvoices = localStorage.getItem('invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }
  }, []);

  // Calculate invoice totals
  const calculateTotals = () => {
    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalGST = 0;

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

    const grandTotal = totalTaxableValue + totalGST;

    return {
      totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
      totalCGST: Math.round(totalCGST * 100) / 100,
      totalSGST: Math.round(totalSGST * 100) / 100,
      totalIGST: Math.round(totalIGST * 100) / 100,
      totalGST: Math.round(totalGST * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
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
    if (num < 0) return 'Minus ' + numberToWords(-num);

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

  // Handle signature upload
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempSettings({ ...tempSettings, signatureImage: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Download PDF as HTML
  const downloadPDF = () => {
    if (!formData.invoiceNumber) {
      alert('Please enter invoice number');
      return;
    }
    if (!formData.consigneeDetails.name) {
      alert('Please enter customer name');
      return;
    }
    if (formData.items.filter(i => i.description && i.hsn).length === 0) {
      alert('Please add at least one item');
      return;
    }

    const totals = calculateTotals();
    const invoiceData = {
      ...formData,
      totals,
      settings,
      timestamp: new Date().toISOString(),
      amountInWords: numberToWords(Math.floor(totals.grandTotal)),
      taxAmountInWords: numberToWords(Math.floor(totals.totalGST)),
    };

    // Create HTML content
    const htmlContent = generateInvoiceHTML(invoiceData);

    // Save to localStorage
    const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    existingInvoices.push(invoiceData);
    localStorage.setItem('invoices', JSON.stringify(existingInvoices));
    setInvoices(existingInvoices);

    // Download
    const element = document.createElement('a');
    const file = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice-${formData.invoiceNumber}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert('✅ Invoice downloaded successfully!\n\nTo convert to PDF:\n1. Open the HTML file in Chrome/Firefox\n2. Press Ctrl+P (or Cmd+P on Mac)\n3. Click "Save as PDF"');
  };

  // Generate Invoice HTML
  const generateInvoiceHTML = (invoiceData) => {
    const totals = invoiceData.totals;
    const s = invoiceData.settings;
    const f = invoiceData;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${f.invoiceNumber}</title>
    <style>
        * { margin: 0; padding: 0; }
        body {
            font-family: 'Arial', sans-serif;
            background: white;
            color: #333;
        }
        .page {
            width: 210mm;
            height: 297mm;
            padding: 15mm;
            margin: 10mm auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            page-break-after: always;
        }
        @media print {
            .page { box-shadow: none; margin: 0; }
            body { background: white; }
        }
        .header {
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 3px solid #000;
            padding-bottom: 10px;
        }
        .seller-section {
            margin-bottom: 15px;
            font-size: 12px;
            line-height: 1.4;
        }
        .seller-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 3px;
        }
        .customers-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 15px 0;
            font-size: 11px;
        }
        .customer-box {
            border: 2px solid #333;
            padding: 10px;
            line-height: 1.5;
        }
        .customer-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 5px;
            text-decoration: underline;
        }
        .customer-name {
            font-weight: bold;
            margin-bottom: 3px;
        }
        .invoice-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
            font-size: 11px;
            line-height: 1.6;
        }
        .meta-item {
            display: grid;
            grid-template-columns: 80px 1fr;
        }
        .meta-label {
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }
        th {
            background: #f0f0f0;
            font-weight: bold;
        }
        .amount {
            text-align: right;
        }
        .totals {
            width: 100%;
            margin: 10px 0;
            font-size: 11px;
        }
        .total-row {
            display: grid;
            grid-template-columns: 1fr 150px;
            gap: 10px;
            margin-bottom: 5px;
        }
        .total-label {
            text-align: right;
            font-weight: bold;
        }
        .total-value {
            text-align: right;
            border-bottom: 1px solid #333;
            padding-bottom: 2px;
        }
        .grand-total-row {
            display: grid;
            grid-template-columns: 1fr 150px;
            gap: 10px;
            margin: 10px 0;
            font-weight: bold;
            font-size: 12px;
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
            padding: 5px 0;
        }
        .amount-words {
            background: #f9f9f9;
            padding: 8px;
            margin: 10px 0;
            border-left: 3px solid #333;
            font-size: 11px;
            line-height: 1.4;
        }
        .declaration {
            margin: 20px 0;
            font-size: 11px;
            line-height: 1.6;
        }
        .declaration-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 30px;
            font-size: 11px;
        }
        .signature-box {
            text-align: right;
        }
        .signature-image {
            max-height: 60px;
            max-width: 150px;
            margin-bottom: 10px;
        }
        .signature-line {
            border-top: 1px solid #333;
            padding-top: 5px;
            margin-bottom: 5px;
        }
        .footer {
            text-align: center;
            font-size: 10px;
            font-style: italic;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">TAX INVOICE</div>

        <div class="seller-section">
            <div class="seller-name">${s.companyName}</div>
            <div>${s.companyAddress1}</div>
            <div>${s.companyAddress2}</div>
            <div>GSTIN/UIN: ${s.companyGstin}</div>
            <div>State Name: ${s.companyState}, Code: ${s.companyStateCode}</div>
        </div>

        <div class="customers-grid">
            <div class="customer-box">
                <div class="customer-title">CONSIGNEE (SHIP TO)</div>
                <div class="customer-name">${f.consigneeDetails.name}</div>
                <div>${f.consigneeDetails.address1}</div>
                <div>${f.consigneeDetails.address2}</div>
                <div>${f.consigneeDetails.address3}</div>
                <div>${f.consigneeDetails.city}</div>
                <div>GSTIN/UIN: ${f.consigneeDetails.gstin}</div>
            </div>
            <div class="customer-box">
                <div class="customer-title">BUYER (BILL TO)</div>
                <div class="customer-name">${f.buyerDetails.name}</div>
                <div>${f.buyerDetails.address1}</div>
                <div>${f.buyerDetails.address2}</div>
                <div>${f.buyerDetails.address3}</div>
                <div>${f.buyerDetails.city}</div>
                <div>GSTIN/UIN: ${f.buyerDetails.gstin}</div>
            </div>
        </div>

        <div class="invoice-meta">
            <div class="meta-item">
                <div class="meta-label">Invoice No:</div>
                <div>${f.invoiceNumber}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Dated:</div>
                <div>${new Date(f.invoiceDate).toLocaleDateString('en-IN')}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Delivery Note:</div>
                <div>${f.deliveryNote || '-'}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Mode/Terms:</div>
                <div>${f.modeOfPayment || '-'}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description of Goods</th>
                    <th>HSN/SAC</th>
                    <th>Quantity</th>
                    <th>Rate per Unit</th>
                    <th class="amount">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${f.items.filter(i => i.description && i.hsn).map(item => {
                  const amount = item.quantity * item.rate;
                  return `
                    <tr>
                        <td>${item.description}</td>
                        <td>${item.hsn}</td>
                        <td>${item.quantity} ${item.unit}</td>
                        <td class="amount">₹${item.rate.toLocaleString('en-IN')}</td>
                        <td class="amount">₹${amount.toLocaleString('en-IN')}</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <div class="total-label">Taxable Value</div>
                <div class="total-value">₹${totals.totalTaxableValue.toLocaleString('en-IN')}</div>
            </div>
            ${f.supplyType === 'intra-state' ? `
                <div class="total-row">
                    <div class="total-label">CGST @ 9%</div>
                    <div class="total-value">₹${totals.totalCGST.toLocaleString('en-IN')}</div>
                </div>
                <div class="total-row">
                    <div class="total-label">SGST @ 9%</div>
                    <div class="total-value">₹${totals.totalSGST.toLocaleString('en-IN')}</div>
                </div>
            ` : `
                <div class="total-row">
                    <div class="total-label">IGST @ ${f.items[0]?.gstRate}%</div>
                    <div class="total-value">₹${totals.totalIGST.toLocaleString('en-IN')}</div>
                </div>
            `}
            <div class="grand-total-row">
                <div>GRAND TOTAL</div>
                <div>₹${totals.grandTotal.toLocaleString('en-IN')}</div>
            </div>
        </div>

        <div class="amount-words">
            <strong>Amount in Words:</strong> ${invoiceData.amountInWords}
        </div>

        <div class="declaration">
            <div class="declaration-title">DECLARATION</div>
            <p>${s.declaration}</p>
        </div>

        <div class="signature-section">
            <div></div>
            <div class="signature-box">
                ${s.signatureImage ? `<img src="${s.signatureImage}" class="signature-image" alt="Signature">` : ''}
                <div class="signature-line"></div>
                <div>for ${s.companyName}</div>
                <div style="margin-top: 30px;"></div>
                <div class="signature-line" style="margin-bottom: 10px;"></div>
                <div>${s.authorizedSignatory}</div>
            </div>
        </div>

        <div class="footer">
            This is a Computer Generated Invoice
        </div>
    </div>
</body>
</html>
    `;
  };

  const updateFormData = (path, value) => {
    const newFormData = { ...formData };
    const keys = path.split('.');
    let current = newFormData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setFormData(newFormData);
  };

  const addItem = () => {
    const newItem = {
      id: Math.max(...formData.items.map(i => i.id), 0) + 1,
      description: '',
      hsn: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      gstRate: settings.defaultGstRate,
    };
    updateFormData('items', [...formData.items, newItem]);
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      updateFormData('items', formData.items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    updateFormData('items', formData.items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem('jbSettings', JSON.stringify(tempSettings));
    setTheme(tempSettings.theme);
    setShowSettings(false);
    alert('✅ Settings saved successfully!');
  };

  const totals = calculateTotals();

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const cardBg = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 border-gray-300';

  // Dashboard
  if (currentPage === 'dashboard') {
    return (
      <div className={`min-h-screen ${bgColor}`}>
        <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-3xl font-bold">{settings.companyName}</h1>
            <p className="text-sm text-blue-100">GST Tax Invoice Management System</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-lg hover:bg-blue-50 font-semibold"
          >
            <Settings size={20} />
            Settings
          </button>
        </nav>

        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${cardBg} rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${textColor}`}>⚙️ Settings</h2>
                <button onClick={() => setShowSettings(false)}>
                  <X size={24} className={textColor} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-b pb-4 mb-4">
                  <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Company Name</label>
                    <input
                      type="text"
                      value={tempSettings.companyName}
                      onChange={(e) => setTempSettings({ ...tempSettings, companyName: e.target.value })}
                      className={`w-full border p-2 rounded ${inputBg}`}
                    />
                  </div>

                  <div className="mt-3">
                    <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Address Line 1</label>
                    <input
                      type="text"
                      value={tempSettings.companyAddress1}
                      onChange={(e) => setTempSettings({ ...tempSettings, companyAddress1: e.target.value })}
                      className={`w-full border p-2 rounded ${inputBg}`}
                    />
                  </div>

                  <div className="mt-3">
                    <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Address Line 2</label>
                    <input
                      type="text"
                      value={tempSettings.companyAddress2}
                      onChange={(e) => setTempSettings({ ...tempSettings, companyAddress2: e.target.value })}
                      className={`w-full border p-2 rounded ${inputBg}`}
                    />
                  </div>

                  <div className="mt-3">
                    <label className={`block text-sm font-semibold mb-2 ${textColor}`}>GSTIN</label>
                    <input
                      type="text"
                      value={tempSettings.companyGstin}
                      onChange={(e) => setTempSettings({ ...tempSettings, companyGstin: e.target.value })}
                      className={`w-full border p-2 rounded ${inputBg}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${textColor}`}>State</label>
                      <input
                        type="text"
                        value={tempSettings.companyState}
                        onChange={(e) => setTempSettings({ ...tempSettings, companyState: e.target.value })}
                        className={`w-full border p-2 rounded ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${textColor}`}>State Code</label>
                      <input
                        type="text"
                        value={tempSettings.companyStateCode}
                        onChange={(e) => setTempSettings({ ...tempSettings, companyStateCode: e.target.value })}
                        className={`w-full border p-2 rounded ${inputBg}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4 mb-4">
                  <h3 className="text-lg font-semibold mb-4">Invoice Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Invoice Prefix</label>
                      <input
                        type="text"
                        value={tempSettings.invoicePrefix}
                        onChange={(e) => setTempSettings({ ...tempSettings, invoicePrefix: e.target.value })}
                        className={`w-full border p-2 rounded ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Financial Year</label>
                      <input
                        type="text"
                        value={tempSettings.financialYear}
                        onChange={(e) => setTempSettings({ ...tempSettings, financialYear: e.target.value })}
                        className={`w-full border p-2 rounded ${inputBg}`}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Default GST Rate (%)</label>
                    <input
                      type="number"
                      value={tempSettings.defaultGstRate}
                      onChange={(e) => setTempSettings({ ...tempSettings, defaultGstRate: parseInt(e.target.value) })}
                      className={`w-full border p-2 rounded ${inputBg}`}
                    />
                  </div>
                </div>

                <div className="border-b pb-4 mb-4">
                  <h3 className="text-lg font-semibold mb-4">Declaration & Signature</h3>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Declaration Text</label>
                    <textarea
                      value={tempSettings.declaration}
                      onChange={(e) => setTempSettings({ ...tempSettings, declaration: e.target.value })}
                      rows="4"
                      className={`w-full border p-2 rounded ${inputBg}`}
                    />
                  </div>

                  <div className="mt-3">
                    <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Authorized Signatory Name</label>
                    <input
                      type="text"
                      value={tempSettings.authorizedSignatory}
                      onChange={(e) => setTempSettings({ ...tempSettings, authorizedSignatory: e.target.value })}
                      className={`w-full border p-2 rounded ${inputBg}`}
                    />
                  </div>

                  <div className="mt-3">
                    <label className={`block text-sm font-semibold mb-2 ${textColor}`}>Upload Signature (Optional)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
                        <Upload size={20} />
                        Choose Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                        />
                      </label>
                      {tempSettings.signatureImage && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">✅ Signature uploaded</span>
                          <button
                            onClick={() => setTempSettings({ ...tempSettings, signatureImage: null })}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-b pb-4 mb-4">
                  <h3 className="text-lg font-semibold mb-4">Theme</h3>
                  <select
                    value={tempSettings.theme}
                    onChange={(e) => setTempSettings({ ...tempSettings, theme: e.target.value })}
                    className={`w-full border p-2 rounded ${inputBg}`}
                  >
                    <option value="light">☀️ Light</option>
                    <option value="dark">🌙 Dark</option>
                  </select>
                </div>

                <button
                  onClick={saveSettings}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold"
                >
                  <Save size={20} />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`max-w-7xl mx-auto p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`${cardBg} border p-6 rounded-lg shadow-md hover:shadow-lg transition`}>
              <div className={`text-gray-600 ${textColor}`}>📊 Total Invoices</div>
              <div className={`text-4xl font-bold text-blue-900`}>{invoices.length}</div>
            </div>
            <div className={`${cardBg} border p-6 rounded-lg shadow-md hover:shadow-lg transition`}>
              <div className={`text-gray-600 ${textColor}`}>📅 Today's Invoices</div>
              <div className={`text-4xl font-bold text-green-900`}>0</div>
            </div>
            <div className={`${cardBg} border p-6 rounded-lg shadow-md hover:shadow-lg transition`}>
              <div className={`text-gray-600 ${textColor}`}>📈 This Month</div>
              <div className={`text-4xl font-bold text-purple-900`}>0</div>
            </div>
            <div className={`${cardBg} border p-6 rounded-lg shadow-md hover:shadow-lg transition`}>
              <div className={`text-gray-600 ${textColor}`}>💰 Total Sales</div>
              <div className={`text-4xl font-bold text-yellow-900`}>₹0</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => { setFormData({ ...formData, items: [{ id: 1, description: '', hsn: '', quantity: 1, unit: 'pcs', rate: 0, gstRate: settings.defaultGstRate }] }); setCurrentPage('new-invoice'); }}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white p-8 rounded-lg hover:shadow-lg transition transform hover:scale-105"
            >
              <Plus size={40} />
              <div className="text-left">
                <div className="text-2xl font-semibold">New Invoice</div>
                <div className="text-blue-100">Create a new tax invoice</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentPage('invoice-history')}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-900 to-green-800 text-white p-8 rounded-lg hover:shadow-lg transition transform hover:scale-105"
            >
              <History size={40} />
              <div className="text-left">
                <div className="text-2xl font-semibold">Invoice History</div>
                <div className="text-green-100">View all invoices ({invoices.length})</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // New Invoice Form
  if (currentPage === 'new-invoice') {
    return (
      <div className={`min-h-screen ${bgColor}`}>
        <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 flex justify-between items-center shadow-lg">
          <h1 className="text-2xl font-bold">📝 New Invoice</h1>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="bg-white text-blue-900 px-4 py-2 rounded-lg hover:bg-blue-50 font-semibold"
          >
            ← Back to Dashboard
          </button>
        </nav>

        <div className={`max-w-6xl mx-auto p-6`}>
          {!previewMode ? (
            <div className="space-y-6">
              {/* Invoice Details */}
              <div className={`${cardBg} border p-6 rounded-lg shadow-md`}>
                <h2 className={`text-xl font-bold mb-4 text-blue-900`}>📋 Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Invoice Number *</label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => updateFormData('invoiceNumber', e.target.value)}
                      placeholder={`${settings.invoicePrefix}/001/${settings.financialYear}`}
                      className={`w-full border p-2 rounded ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Invoice Date</label>
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => updateFormData('invoiceDate', e.target.value)}
                      className={`w-full border p-2 rounded ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Supply Type</label>
                    <select
                      value={formData.supplyType}
                      onChange={(e) => updateFormData('supplyType', e.target.value)}
                      className={`w-full border p-2 rounded ${inputBg}`}
                    >
                      <option value="intra-state">Intra-State (CGST + SGST)</option>
                      <option value="inter-state">Inter-State (IGST)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Consignee Details */}
              <div className={`${cardBg} border p-6 rounded-lg shadow-md`}>
                <h2 className={`text-xl font-bold mb-4 text-blue-900`}>🏢 Consignee (Ship to) *</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={formData.consigneeDetails.name}
                    onChange={(e) => updateFormData('consigneeDetails.name', e.target.value)}
                    className={`col-span-2 border p-2 rounded ${inputBg}`}
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={formData.consigneeDetails.address1}
                    onChange={(e) => updateFormData('consigneeDetails.address1', e.target.value)}
                    className={`border p-2 rounded ${inputBg}`}
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2"
                    value={formData.consigneeDetails.address2}
                    onChange={(e) => updateFormData('consigneeDetails.address2', e.target.value)}
                    className={`border p-2 rounded ${inputBg}`}
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.consigneeDetails.city}
                    onChange={(e) => updateFormData('consigneeDetails.city', e.target.value)}
                    className={`border p-2 rounded ${inputBg}`}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.consigneeDetails.state}
                    onChange={(e) => updateFormData('consigneeDetails.state', e.target.value)}
                    className={`border p-2 rounded ${inputBg}`}
                  />
                  <input
                    type="text"
                    placeholder="GSTIN"
                    value={formData.consigneeDetails.gstin}
                    onChange={(e) => updateFormData('consigneeDetails.gstin', e.target.value)}
                    className={`col-span-2 border p-2 rounded ${inputBg}`}
                  />
                </div>
              </div>

              {/* Same as Consignee */}
              <div className={`${cardBg} border p-6 rounded-lg shadow-md`}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.sameAsConsignee}
                    onChange={(e) => {
                      updateFormData('sameAsConsignee', e.target.checked);
                      if (e.target.checked) {
                        updateFormData('buyerDetails', { ...formData.consigneeDetails });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="font-semibold">👤 Same as Consignee</span>
                </label>
              </div>

              {/* Buyer Details */}
              {!formData.sameAsConsignee && (
                <div className={`${cardBg} border p-6 rounded-lg shadow-md`}>
                  <h2 className={`text-xl font-bold mb-4 text-blue-900`}>🏪 Buyer (Bill to)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={formData.buyerDetails.name}
                      onChange={(e) => updateFormData('buyerDetails.name', e.target.value)}
                      className={`col-span-2 border p-2 rounded ${inputBg}`}
                    />
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={formData.buyerDetails.address1}
                      onChange={(e) => updateFormData('buyerDetails.address1', e.target.value)}
                      className={`border p-2 rounded ${inputBg}`}
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2"
                      value={formData.buyerDetails.address2}
                      onChange={(e) => updateFormData('buyerDetails.address2', e.target.value)}
                      className={`border p-2 rounded ${inputBg}`}
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.buyerDetails.city}
                      onChange={(e) => updateFormData('buyerDetails.city', e.target.value)}
                      className={`border p-2 rounded ${inputBg}`}
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.buyerDetails.state}
                      onChange={(e) => updateFormData('buyerDetails.state', e.target.value)}
                      className={`border p-2 rounded ${inputBg}`}
                    />
                    <input
                      type="text"
                      placeholder="GSTIN"
                      value={formData.buyerDetails.gstin}
                      onChange={(e) => updateFormData('buyerDetails.gstin', e.target.value)}
                      className={`col-span-2 border p-2 rounded ${inputBg}`}
                    />
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className={`${cardBg} border p-6 rounded-lg shadow-md`}>
                <h2 className={`text-xl font-bold mb-4 text-blue-900`}>📦 Items *</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200 dark:bg-gray-700">
                      <tr>
                        <th className="p-2 text-left">Description *</th>
                        <th className="p-2 text-left">HSN/SAC *</th>
                        <th className="p-2 text-left">Qty</th>
                        <th className="p-2 text-left">Unit</th>
                        <th className="p-2 text-right">Rate *</th>
                        <th className="p-2 text-right">Value</th>
                        <th className="p-2 text-right">GST %</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item) => {
                        const taxableValue = item.quantity * item.rate;
                        return (
                          <tr key={item.id} className={`border-b ${theme === 'dark' ? 'border-gray-700' : ''}`}>
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                className={`w-full border p-1 rounded text-xs ${inputBg}`}
                                placeholder="Description"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.hsn}
                                onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                                className={`w-full border p-1 rounded text-xs ${inputBg}`}
                                placeholder="HSN"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className={`w-full border p-1 rounded text-xs ${inputBg}`}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                className={`w-full border p-1 rounded text-xs ${inputBg}`}
                                placeholder="pcs"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                className={`w-full border p-1 rounded text-xs text-right ${inputBg}`}
                              />
                            </td>
                            <td className="p-2 text-right text-sm font-semibold">₹{taxableValue.toLocaleString('en-IN')}</td>
                            <td className="p-2">
                              <select
                                value={item.gstRate}
                                onChange={(e) => updateItem(item.id, 'gstRate', parseFloat(e.target.value))}
                                className={`w-full border p-1 rounded text-xs ${inputBg}`}
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => removeItem(item.id)}
                                disabled={formData.items.length === 1}
                                className="text-red-600 hover:text-red-900 text-xs disabled:text-gray-400"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={addItem}
                  className="mt-4 bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 font-semibold"
                >
                  + Add Item
                </button>
              </div>

              {/* Totals */}
              <div className={`${cardBg} border p-6 rounded-lg shadow-md`}>
                <h2 className={`text-xl font-bold mb-4 text-blue-900`}>💵 Invoice Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="border-b pb-2">
                    <div className={`text-gray-600 text-sm`}>Taxable Value</div>
                    <div className="text-2xl font-bold">₹{totals.totalTaxableValue.toLocaleString('en-IN')}</div>
                  </div>
                  {formData.supplyType === 'intra-state' ? (
                    <>
                      <div className="border-b pb-2">
                        <div className={`text-gray-600 text-sm`}>CGST</div>
                        <div className="text-2xl font-bold">₹{totals.totalCGST.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="border-b pb-2">
                        <div className={`text-gray-600 text-sm`}>SGST</div>
                        <div className="text-2xl font-bold">₹{totals.totalSGST.toLocaleString('en-IN')}</div>
                      </div>
                    </>
                  ) : (
                    <div className="border-b pb-2">
                      <div className={`text-gray-600 text-sm`}>IGST</div>
                      <div className="text-2xl font-bold">₹{totals.totalIGST.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  <div className="border-b pb-2 bg-yellow-50 dark:bg-yellow-900 p-2 rounded">
                    <div className={`text-gray-600 text-sm`}>Total GST</div>
                    <div className="text-2xl font-bold">₹{totals.totalGST.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="border-b pb-2 bg-green-50 dark:bg-green-900 p-2 rounded md:col-span-2">
                    <div className={`text-gray-600 text-sm`}>Grand Total</div>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100">₹{totals.grandTotal.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => setPreviewMode(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  <Eye size={20} />
                  Preview Invoice
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
                >
                  <Download size={20} />
                  Download Invoice
                </button>
              </div>
            </div>
          ) : (
            // Preview Mode
            <div className={`${cardBg} border p-8 rounded-lg shadow-md`}>
              <div className="flex justify-between mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold">📄 Invoice Preview</h2>
                <button
                  onClick={() => setPreviewMode(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-semibold"
                >
                  ← Back to Edit
                </button>
              </div>

              {/* Invoice Preview Content */}
              <div className="border-t-2 border-b-2 border-gray-800 py-6 space-y-6 text-xs leading-relaxed">
                <div className="text-center">
                  <h1 className="text-3xl font-bold">TAX INVOICE</h1>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-bold text-sm mb-1">{settings.companyName}</div>
                    <div>{settings.companyAddress1}</div>
                    <div>{settings.companyAddress2}</div>
                    <div>GSTIN/UIN: {settings.companyGstin}</div>
                    <div>State Name: {settings.companyState}, Code: {settings.companyStateCode}</div>
                  </div>
                  <div className="border p-2">
                    <div className="font-bold text-sm mb-1">Consignee (Ship to)</div>
                    <div className="font-semibold">{formData.consigneeDetails.name}</div>
                    <div>{formData.consigneeDetails.address1}</div>
                    <div>{formData.consigneeDetails.address2}</div>
                    <div>{formData.consigneeDetails.city}</div>
                    <div>GSTIN/UIN: {formData.consigneeDetails.gstin}</div>
                  </div>
                  <div className="border p-2">
                    <div className="font-bold text-sm mb-1">Buyer (Bill to)</div>
                    <div className="font-semibold">{formData.buyerDetails.name}</div>
                    <div>{formData.buyerDetails.address1}</div>
                    <div>{formData.buyerDetails.address2}</div>
                    <div>{formData.buyerDetails.city}</div>
                    <div>GSTIN/UIN: {formData.buyerDetails.gstin}</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="font-bold">Invoice No.</div>
                    <div>{formData.invoiceNumber}</div>
                  </div>
                  <div>
                    <div className="font-bold">Dated</div>
                    <div>{new Date(formData.invoiceDate).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>

                <table className="w-full text-xs border-collapse border border-gray-700">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border p-1 text-left">Description of Goods</th>
                      <th className="border p-1 text-center">HSN/SAC</th>
                      <th className="border p-1 text-center">Quantity</th>
                      <th className="border p-1 text-right">Rate per Unit</th>
                      <th className="border p-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.filter(i => i.description && i.hsn).map((item) => {
                      const amount = item.quantity * item.rate;
                      return (
                        <tr key={item.id}>
                          <td className="border p-1">{item.description}</td>
                          <td className="border p-1 text-center">{item.hsn}</td>
                          <td className="border p-1 text-center">{item.quantity} {item.unit}</td>
                          <td className="border p-1 text-right">₹{item.rate.toLocaleString('en-IN')}</td>
                          <td className="border p-1 text-right">₹{amount.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="space-y-1 text-xs">
                  {formData.supplyType === 'intra-state' ? (
                    <>
                      <div className="flex justify-between">
                        <span>OUTPUT CGST @9%</span>
                        <span>₹{totals.totalCGST.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OUTPUT SGST @9%</span>
                        <span>₹{totals.totalSGST.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>OUTPUT IGST @{formData.items.filter(i => i.description)[0]?.gstRate}%</span>
                      <span>₹{totals.totalIGST.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-b pt-2 pb-2 flex justify-between font-bold text-sm">
                  <span>Total</span>
                  <span>₹{totals.grandTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="text-xs bg-blue-50 p-2 rounded">
                  <div className="font-bold">Amount Chargeable (in words)</div>
                  <div>{numberToWords(Math.floor(totals.grandTotal))}</div>
                </div>

                <div className="text-xs space-y-2 border-t pt-4">
                  <div className="font-bold">Declaration</div>
                  <div>{settings.declaration}</div>
                  <div className="mt-4">for {settings.companyName}</div>
                  {settings.signatureImage && (
                    <img src={settings.signatureImage} alt="Signature" style={{ maxHeight: '50px', maxWidth: '150px' }} />
                  )}
                  <div className="mt-8">_____________________</div>
                  <div>{settings.authorizedSignatory}</div>
                  <div className="text-center text-xs mt-4 italic">This is a Computer Generated Invoice</div>
                </div>
              </div>

              {/* Preview Buttons */}
              <div className="flex gap-4 justify-center mt-6 flex-wrap">
                <button
                  onClick={() => setPreviewMode(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-semibold"
                >
                  ← Edit Invoice
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold"
                >
                  <Download size={20} />
                  Download Invoice
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Invoice History
  if (currentPage === 'invoice-history') {
    return (
      <div className={`min-h-screen ${bgColor}`}>
        <nav className="bg-gradient-to-r from-green-900 to-green-800 text-white p-4 flex justify-between items-center shadow-lg">
          <h1 className="text-2xl font-bold">📚 Invoice History</h1>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="bg-white text-green-900 px-4 py-2 rounded-lg hover:bg-green-50 font-semibold"
          >
            ← Back to Dashboard
          </button>
        </nav>

        <div className={`max-w-6xl mx-auto p-6`}>
          <div className={`${cardBg} border p-6 rounded-lg shadow-md`}>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📄</div>
                <p className={`text-lg font-semibold ${textColor}`}>No invoices yet</p>
                <p className={`text-gray-600 ${textColor}`}>Create your first invoice to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-200 dark:bg-gray-700">
                    <tr>
                      <th className="p-3 text-left font-semibold">Invoice No.</th>
                      <th className="p-3 text-left font-semibold">Date</th>
                      <th className="p-3 text-left font-semibold">Customer</th>
                      <th className="p-3 text-right font-semibold">Amount</th>
                      <th className="p-3 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...invoices].reverse().map((invoice, idx) => (
                      <tr key={idx} className={`border-b ${theme === 'dark' ? 'border-gray-700' : ''} hover:bg-gray-100 dark:hover:bg-gray-700 transition`}>
                        <td className="p-3 font-semibold text-blue-600">{invoice.invoiceNumber}</td>
                        <td className="p-3">{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</td>
                        <td className="p-3">{invoice.consigneeDetails.name}</td>
                        <td className="p-3 text-right font-semibold">₹{invoice.totals.grandTotal.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center">
                          <button className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 text-sm font-semibold">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
