import React, { useState, useEffect } from "react";
import {
  FaFileInvoice,
  FaDownload,
  FaEye,
  FaSync,
  FaCheck,
  FaClock,
  FaSpinner,
} from "react-icons/fa";
import api from "../../utils/api";

const InvoiceStatusPanel = ({ orderId, orderNumber }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({ pending: 0, generated: 0 });

  useEffect(() => {
    if (orderId) {
      fetchInvoices();
    }
  }, [orderId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/timeline/${orderId}`);
      setInvoices(response.data.documents || []);

      // Calculate stats
      const generated = response.data.documents?.length || 0;
      const pending = response.data.pending || 0;
      setStats({ pending, generated });
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (window.confirm(`Generate invoice for order ${orderNumber}?`)) {
      try {
        setGenerating(true);
        // Trigger invoice generation through the automation service
        const response = await api.post(
          `/api/sales/orders/${orderId}/generate-invoice`,
          {
            orderNumber,
          }
        );
        alert("Invoice generated successfully!");
        fetchInvoices();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to generate invoice");
      } finally {
        setGenerating(false);
      }
    }
  };

  const handleDownloadInvoice = async (documentId, fileName) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert("Failed to download invoice");
    }
  };

  const handlePreviewInvoice = async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/preview`);
      // Open in new tab or modal
      window.open(response.data.previewUrl, "_blank");
    } catch (error) {
      alert("Failed to preview invoice");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaFileInvoice className="text-blue-600" />
          Invoice Status
        </h3>
        <button
          onClick={handleGenerateInvoice}
          disabled={generating || !orderId}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 text-sm transition-all"
        >
          {generating ? <FaSpinner className="animate-spin" /> : <FaSync />}
          Generate Invoice
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Pending Invoices</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.pending}
              </p>
            </div>
            <FaClock className="text-amber-400 text-xl" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Generated</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.generated}
              </p>
            </div>
            <FaCheck className="text-green-400 text-xl" />
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {invoices.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">
            Generated Documents:
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5 border border-gray-100 hover:bg-gray-100 transition-all"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {invoice.document_type}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handlePreviewInvoice(invoice.id)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Preview"
                  >
                    <FaEye size={14} />
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadInvoice(invoice.id, invoice.file_name)
                    }
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                    title="Download"
                  >
                    <FaDownload size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-100">
          <FaFileInvoice className="text-gray-300 text-3xl mx-auto mb-2" />
          <p className="text-sm text-gray-600">No invoices generated yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Click "Generate Invoice" to create one
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <FaSpinner className="animate-spin text-blue-600 mx-auto text-xl" />
        </div>
      )}
    </div>
  );
};

export default InvoiceStatusPanel;
