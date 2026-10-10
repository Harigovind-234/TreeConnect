import re

with open(r'd:\Projects\TreeConnect\frontend\src\pages\landowner\PaymentsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "{/* Receipt Modal */}"
end_marker = "{/* Details Modal */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

new_receipt = """{/* Receipt Modal */}
      {receiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm print:bg-white print:p-0">
          <div className="bg-[#0A100D] border border-[#172D21] rounded-[24px] w-full max-w-[520px] overflow-hidden flex flex-col shadow-2xl max-h-[calc(100dvh-24px)] print:border-none print:shadow-none print:bg-white print:text-black print:max-h-none print:w-full print:max-w-none">
            
            {/* Header (hidden on print) */}
            <div className="flex items-center justify-between p-6 lg:p-7 border-b border-[#172D21] print:hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#091F14] border border-[#133E26] flex items-center justify-center text-[#43C58A]">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#F5F7F5] leading-tight tracking-tight">Payment Receipt</h3>
                </div>
              </div>
              <button 
                onClick={() => setReceiptPayment(null)}
                className="w-10 h-10 rounded-full bg-[#121C17] flex items-center justify-center text-[#9CAAA1] hover:text-[#F5F7F5] hover:bg-[#1A2620] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Area */}
            <div className="p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[#43C58A] mb-5 print:border-green-600 bg-transparent">
                  <CheckCircle2 size={28} className="text-[#43C58A] print:text-green-600" />
                </div>
                <h2 className="text-3xl font-black text-[#F5F7F5] print:text-black mb-2 tracking-tight">Payment Successful</h2>
                <p className="text-[#43C58A]/80 print:text-gray-600 text-sm">Confirmation for your records</p>
              </div>

              {/* Amount Box */}
              <div className="bg-[#0C1611] border border-[#172D21] print:bg-white print:border-gray-200 rounded-[20px] p-6 lg:p-7 mb-8 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-4">
                    <span className="text-[#9CAAA1] print:text-gray-500 font-bold uppercase tracking-[0.1em] text-xs">Amount Paid</span>
                    <div className="flex items-center gap-2 mt-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#43C58A]"></div>
                      <span className="text-xs text-[#43C58A] font-semibold">Paid via UPI • Auto Reconciled</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[34px] leading-none font-black text-[#43C58A] print:text-black tracking-tighter">{formatINR(receiptPayment.amount)}</span>
                    <span className="text-[11px] text-[#9CAAA1] mt-1">INR (Taxes Included)</span>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="flex flex-col border border-[#172D21] rounded-[20px] print:border-gray-200 divide-y divide-[#172D21]">
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Transaction Date</span>
                  <span className="text-[#F5F7F5] print:text-black text-sm font-bold font-mono text-right">
                    {new Date(receiptPayment.date).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }).replace(',', '')}
                  </span>
                </div>
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Ref Number</span>
                  <div className="flex items-center gap-3 justify-end min-w-0">
                    <span className="text-[#F5F7F5] print:text-black text-[13px] font-bold font-mono text-right truncate">{receiptPayment.ref}</span>
                    <button className="text-[#43C58A] hover:text-[#F5F7F5] print:hidden shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Payment Type</span>
                  <div className="px-3 py-1.5 rounded-full border border-[#133E26] bg-[#0A1A12] text-[#43C58A] text-xs font-bold text-right">
                    {receiptPayment.type}
                  </div>
                </div>
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Contractor</span>
                  <div className="flex items-center gap-2 justify-end min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#0A1A12] border border-[#133E26] flex items-center justify-center text-[#43C58A] text-[10px] font-bold shrink-0">
                      {receiptPayment.contractorName ? receiptPayment.contractorName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <span className="text-[#F5F7F5] print:text-black text-sm font-bold truncate">{receiptPayment.contractorName}</span>
                    <span className="flex items-center text-[#43C58A] text-[11px] ml-1 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Verified
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Project Name</span>
                  <div className="flex items-center gap-2 text-[#F5F7F5] font-bold text-sm justify-end min-w-0">
                    <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#43C58A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span className="truncate">{receiptPayment.jobName}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Payment Gateway</span>
                  <div className="flex items-center gap-2 text-[#F5F7F5] text-sm justify-end">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#43C58A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Razorpay Secure
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-[#0A1610] border border-[#172D21] rounded-2xl p-5 flex gap-4 print:hidden">
                <div className="text-[#43C58A] shrink-0 mt-0.5">
                  <AlertCircle size={18} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[#F5F7F5] text-[13px] font-bold tracking-wide">Timber Harvest Mobilization</span>
                  <span className="text-[#9CAAA1] text-xs leading-relaxed">
                    Disbursed against Feasible for Harvesting Certificate (ID: TC-HARV-101026). Timber parcel boundaries verified by Field Assessor {receiptPayment.contractorName}.
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-2 bg-[#0A100D] print:hidden">
              <div className="border-t border-dashed border-[#172D21] w-full mb-6 lg:mb-8"></div>
              <div className="flex gap-4">
                <button
                  onClick={() => setReceiptPayment(null)}
                  className="select-none flex-1 py-4 rounded-[14px] font-bold text-sm bg-transparent border border-[#172D21] text-[#F5F7F5] hover:bg-[#121C17] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintReceipt}
                  className="select-none flex-[1.5] py-4 rounded-[14px] font-bold text-sm bg-[#6BFFB2] text-[#051A10] hover:bg-[#5AE59D] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#6BFFB2]/10"
                >
                  <Download size={18} /> Download / Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      """

new_content = content[:start_idx] + new_receipt + content[end_idx:]

with open(r'd:\Projects\TreeConnect\frontend\src\pages\landowner\PaymentsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated receipt modal successfully.")
