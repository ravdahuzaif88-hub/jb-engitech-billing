import React, { useState, useEffect } from 'react';
import { Plus, Download, Eye, Settings, History, Users, Home } from 'lucide-react';

export default function JBEngitechBilling() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [formData, setFormData] = useState({
    invoiceNumber: 'JB/001/2026-27',
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
    supplyType: 'intra-state', // intra-state or inter-state
    
    consigneeDetails: {
      name: 'Radhe Industrial Corporation',
      address1: 'Plot No.122-123',
      address2: 'Vavdi Survey No.43',
      address3: '150 Feet Ring Road',
      city: 'Rajkot',
      state: 'Gujarat',
      stateCode: '24',
      gstin: '24AACPU9597N1ZO',
      pin: '',
    },
    
    buyerDetails: {
      name: 'Radhe Industrial Corporation',
      address1: 'Plot No.122-123',
      address2: 'Vavdi Survey No.43',
      address3: '150 Feet Ring Road',
      city: 'Rajkot',
      state: 'Gujarat',
      stateCode: '24',
      gstin: '24AACPU9597N1ZO',
      pin: '',
    },
    
    sameAsConsignee: false,
    items: [
      {
        id: 1,
        description: 'Hammer Machine',
        hsn: '8467',
        quantity: 1,
        unit: 'pcs',
        rate: 670000,
        gstRate: 18,
      },
    ],
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Seller details (fixed)
  const sellerDetails = {
    name: 'JB ENGITECH',
    address1: 'Shed no 4, Survey no 248, Plot no 18/19',
    address2: 'Rajan Tech Road, Shapur, Rajkot',
    gstin: '24GDRPS8977N1Z1',
    state: 'Gujarat',
    stateCode: '24',
  };

  // Calculate invoice totals
  const calculateTotals = () => {
    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalGST = 0;

    formData.items.forEach(item => {
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

  const generatePDF = async () => {
    const totals = calculateTotals();
    
    // Create invoice data object
    const invoiceData = {
      ...formData,
      totals,
      sellerDetails,
      timestamp: new Date().toISOString(),
      amountInWords: numberToWords(Math.floor(totals.grandTotal)),
      taxAmountInWords: numberToWords(Math.floor(totals.totalGST)),
    };

    // Save to localStorage (for demo)
    const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    existingInvoices.push(invoiceData);
    localStorage.setItem('invoices', JSON.stringify(existingInvoices));

    // In production, this would call your backend API to generate PDF
    alert('Invoice saved! In production, this would generate and download a PDF.');
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
      gstRate: 18,
    };
    updateFormData('items', [...formData.items, newItem]);
  };

  const removeItem = (id) => {
    updateFormData('items', formData.items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    updateFormData('items', formData.items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const totals = calculateTotals();

  // Dashboard
  if (currentPage === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-900 text-white p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold">JB ENGITECH BILLING</h1>
            <p className="text-sm text-gray-300">GST Tax Invoice Management System</p>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-600">Total Invoices</div>
              <div className="text-3xl font-bold text-blue-900">{invoices.length}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-600">Today's Invoices</div>
              <div className="text-3xl font-bold text-green-900">0</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-600">This Month</div>
              <div className="text-3xl font-bold text-purple-900">0</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-gray-600">Total Sales</div>
              <div className="text-3xl font-bold text-yellow-900">₹0</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentPage('new-invoice')}
              className="flex items-center justify-center gap-2 bg-blue-900 text-white p-8 rounded-lg hover:bg-blue-800 transition"
            >
              <Plus size={32} />
              <span className="text-xl font-semibold">New Invoice</span>
            </button>

            <button
              onClick={() => setCurrentPage('invoice-history')}
              className="flex items-center justify-center gap-2 bg-green-900 text-white p-8 rounded-lg hover:bg-green-800 transition"
            >
              <History size={32} />
              <span className="text-xl font-semibold">Invoice History</span>
            </button>

            <button
              onClick={() => setCurrentPage('customers')}
              className="flex items-center justify-center gap-2 bg-purple-900 text-white p-8 rounded-lg hover:bg-purple-800 transition"
            >
              <Users size={32} />
              <span className="text-xl font-semibold">Customers</span>
            </button>

            <button
              onClick={() => setCurrentPage('settings')}
              className="flex items-center justify-center gap-2 bg-gray-900 text-white p-8 rounded-lg hover:bg-gray-800 transition"
            >
              <Settings size={32} />
              <span className="text-xl font-semibold">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // New Invoice Form
  if (currentPage === 'new-invoice') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-blue-900 text-white p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">New Invoice</h1>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="bg-white text-blue-900 px-4 py-2 rounded hover:bg-gray-100"
          >
            Back to Dashboard
          </button>
        </nav>

        <div className="max-w-6xl mx-auto p-6">
          {!previewMode ? (
            <div className="space-y-6">
              {/* Invoice Details */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Invoice Number</label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => updateFormData('invoiceNumber', e.target.value)}
                      className="w-full border p-2 rounded"
                      placeholder="JB/001/2026-27"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Invoice Date</label>
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => updateFormData('invoiceDate', e.target.value)}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Supply Type</label>
                    <select
                      value={formData.supplyType}
                      onChange={(e) => updateFormData('supplyType', e.target.value)}
                      className="w-full border p-2 rounded"
                    >
                      <option value="intra-state">Intra-State (CGST + SGST)</option>
                      <option value="inter-state">Inter-State (IGST)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Consignee Details */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Consignee (Ship to)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={formData.consigneeDetails.name}
                    onChange={(e) => updateFormData('consigneeDetails.name', e.target.value)}
                    className="col-span-2 border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={formData.consigneeDetails.address1}
                    onChange={(e) => updateFormData('consigneeDetails.address1', e.target.value)}
                    className="border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2"
                    value={formData.consigneeDetails.address2}
                    onChange={(e) => updateFormData('consigneeDetails.address2', e.target.value)}
                    className="border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 3"
                    value={formData.consigneeDetails.address3}
                    onChange={(e) => updateFormData('consigneeDetails.address3', e.target.value)}
                    className="col-span-2 border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.consigneeDetails.city}
                    onChange={(e) => updateFormData('consigneeDetails.city', e.target.value)}
                    className="border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={formData.consigneeDetails.state}
                    onChange={(e) => updateFormData('consigneeDetails.state', e.target.value)}
                    className="border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="GSTIN"
                    value={formData.consigneeDetails.gstin}
                    onChange={(e) => updateFormData('consigneeDetails.gstin', e.target.value)}
                    className="col-span-2 border p-2 rounded"
                  />
                </div>
              </div>

              {/* Same as Consignee Checkbox */}
              <div className="bg-white p-6 rounded-lg shadow">
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
                  <span className="font-semibold">Same as Consignee</span>
                </label>
              </div>

              {/* Buyer Details (if not same as consignee) */}
              {!formData.sameAsConsignee && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold mb-4 text-blue-900">Buyer (Bill to)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={formData.buyerDetails.name}
                      onChange={(e) => updateFormData('buyerDetails.name', e.target.value)}
                      className="col-span-2 border p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={formData.buyerDetails.address1}
                      onChange={(e) => updateFormData('buyerDetails.address1', e.target.value)}
                      className="border p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2"
                      value={formData.buyerDetails.address2}
                      onChange={(e) => updateFormData('buyerDetails.address2', e.target.value)}
                      className="border p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 3"
                      value={formData.buyerDetails.address3}
                      onChange={(e) => updateFormData('buyerDetails.address3', e.target.value)}
                      className="col-span-2 border p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.buyerDetails.city}
                      onChange={(e) => updateFormData('buyerDetails.city', e.target.value)}
                      className="border p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.buyerDetails.state}
                      onChange={(e) => updateFormData('buyerDetails.state', e.target.value)}
                      className="border p-2 rounded"
                    />
                    <input
                      type="text"
                      placeholder="GSTIN"
                      value={formData.buyerDetails.gstin}
                      onChange={(e) => updateFormData('buyerDetails.gstin', e.target.value)}
                      className="col-span-2 border p-2 rounded"
                    />
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Items</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-left">HSN/SAC</th>
                        <th className="p-2 text-left">Qty</th>
                        <th className="p-2 text-left">Unit</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-right">Taxable Value</th>
                        <th className="p-2 text-right">GST %</th>
                        <th className="p-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item) => {
                        const taxableValue = item.quantity * item.rate;
                        return (
                          <tr key={item.id} className="border-b">
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                className="w-full border p-1 rounded text-xs"
                                placeholder="Description"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.hsn}
                                onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                                className="w-full border p-1 rounded text-xs"
                                placeholder="HSN"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                className="w-full border p-1 rounded text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                className="w-full border p-1 rounded text-xs"
                                placeholder="Unit"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value))}
                                className="w-full border p-1 rounded text-xs text-right"
                              />
                            </td>
                            <td className="p-2 text-right">₹{taxableValue.toLocaleString('en-IN')}</td>
                            <td className="p-2">
                              <select
                                value={item.gstRate}
                                onChange={(e) => updateItem(item.id, 'gstRate', parseFloat(e.target.value))}
                                className="w-full border p-1 rounded text-xs"
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
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Remove
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
                  className="mt-4 bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  + Add Item
                </button>
              </div>

              {/* Totals Summary */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-blue-900">Invoice Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="border-b pb-2">
                    <div className="text-gray-600 text-sm">Taxable Value</div>
                    <div className="text-xl font-bold">₹{totals.totalTaxableValue.toLocaleString('en-IN')}</div>
                  </div>
                  {formData.supplyType === 'intra-state' ? (
                    <>
                      <div className="border-b pb-2">
                        <div className="text-gray-600 text-sm">CGST</div>
                        <div className="text-xl font-bold">₹{totals.totalCGST.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="border-b pb-2">
                        <div className="text-gray-600 text-sm">SGST</div>
                        <div className="text-xl font-bold">₹{totals.totalSGST.toLocaleString('en-IN')}</div>
                      </div>
                    </>
                  ) : (
                    <div className="border-b pb-2">
                      <div className="text-gray-600 text-sm">IGST</div>
                      <div className="text-xl font-bold">₹{totals.totalIGST.toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  <div className="border-b pb-2 bg-yellow-50">
                    <div className="text-gray-600 text-sm">Total GST</div>
                    <div className="text-xl font-bold">₹{totals.totalGST.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="border-b pb-2 bg-green-50 md:col-span-2">
                    <div className="text-gray-600 text-sm">Grand Total</div>
                    <div className="text-2xl font-bold text-green-900">₹{totals.grandTotal.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded">
                  <div className="text-sm text-gray-600">Amount in Words</div>
                  <div className="font-semibold">{numberToWords(Math.floor(totals.grandTotal))}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setPreviewMode(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
                >
                  <Eye size={20} />
                  Preview Invoice
                </button>
                <button
                  onClick={generatePDF}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
                >
                  <Download size={20} />
                  Generate PDF
                </button>
              </div>
            </div>
          ) : (
            // Preview Mode
            <div className="bg-white p-8 rounded-lg shadow">
              <div className="flex justify-between mb-6">
                <h2 className="text-2xl font-bold">Invoice Preview</h2>
                <button
                  onClick={() => setPreviewMode(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Back to Edit
                </button>
              </div>

              {/* Invoice Preview Content */}
              <div className="border-t-2 border-b-2 border-gray-800 py-6 space-y-6 text-xs leading-relaxed">
                {/* Header */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Tax Invoice</h1>
                </div>

                {/* Seller & Customer Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-bold text-sm mb-1">{sellerDetails.name}</div>
                    <div>{sellerDetails.address1}</div>
                    <div>{sellerDetails.address2}</div>
                    <div>GSTIN/UIN: {sellerDetails.gstin}</div>
                    <div>State Name: {sellerDetails.state}, Code: {sellerDetails.stateCode}</div>
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-1">Consignee (Ship to)</div>
                    <div className="font-semibold">{formData.consigneeDetails.name}</div>
                    <div>{formData.consigneeDetails.address1}</div>
                    <div>{formData.consigneeDetails.address2}</div>
                    <div>{formData.consigneeDetails.address3}</div>
                    <div>{formData.consigneeDetails.city}</div>
                    <div>GSTIN/UIN: {formData.consigneeDetails.gstin}</div>
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-1">Buyer (Bill to)</div>
                    <div className="font-semibold">{formData.buyerDetails.name}</div>
                    <div>{formData.buyerDetails.address1}</div>
                    <div>{formData.buyerDetails.address2}</div>
                    <div>{formData.buyerDetails.address3}</div>
                    <div>{formData.buyerDetails.city}</div>
                    <div>GSTIN/UIN: {formData.buyerDetails.gstin}</div>
                  </div>
                </div>

                {/* Invoice Metadata */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="font-bold">Invoice No.</div>
                    <div>{formData.invoiceNumber}</div>
                  </div>
                  <div>
                    <div className="font-bold">Dated</div>
                    <div>{new Date(formData.invoiceDate).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="font-bold">Delivery Note</div>
                    <div>{formData.deliveryNote || '-'}</div>
                  </div>
                  <div>
                    <div className="font-bold">Mode/Terms</div>
                    <div>{formData.modeOfPayment || '-'}</div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-xs border-collapse border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-1 text-left">Description of Goods</th>
                      <th className="border p-1 text-center">HSN/SAC</th>
                      <th className="border p-1 text-center">Quantity</th>
                      <th className="border p-1 text-right">Rate per Unit</th>
                      <th className="border p-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item) => {
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

                {/* Tax Rows */}
                <div className="space-y-1">
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
                      <span>OUTPUT IGST @{formData.items[0]?.gstRate}%</span>
                      <span>₹{totals.totalIGST.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-b pt-2 pb-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{totals.grandTotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Amount in Words */}
                <div className="text-xs">
                  <div className="font-bold">Amount Chargeable (in words)</div>
                  <div>{numberToWords(Math.floor(totals.grandTotal))}</div>
                </div>

                {/* Declaration */}
                <div className="text-xs space-y-2 border-t pt-4">
                  <div className="font-bold">Declaration</div>
                  <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
                  <div className="mt-4">for {sellerDetails.name}</div>
                  <div className="mt-8">_____________________</div>
                  <div>Authorised Signatory</div>
                  <div className="text-center text-xs mt-4 italic">This is a Computer Generated Invoice</div>
                </div>
              </div>

              {/* Preview Action Buttons */}
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={() => setPreviewMode(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
                >
                  Edit Invoice
                </button>
                <button
                  onClick={generatePDF}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  <Download size={20} />
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Other pages (placeholder)
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">JB ENGITECH BILLING</h1>
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="bg-white text-blue-900 px-4 py-2 rounded hover:bg-gray-100"
        >
          Back to Dashboard
        </button>
      </nav>
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold mb-4">{currentPage.replace('-', ' ').toUpperCase()}</h2>
          <p className="text-gray-600">This section is being developed...</p>
        </div>
      </div>
    </div>
  );
}
