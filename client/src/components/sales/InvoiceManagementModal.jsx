import React, { useState, useEffect } from "react";
import {
  FaFileInvoice,
  FaDownload,
  FaEye,
  FaSync,
  FaTimes,
  FaCheck,
  FaClock,
  FaSpinner,
  FaPrint,
} from "react-icons/fa";
import api from "../../utils/api";

const InvoiceManagementModal = ({ order, onClose, isOpen }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({ pending: 0, generated: 0 });

  useEffect(() => {
    if (isOpen && order?.id) {
      fetchInvoices();
    }
  }, [isOpen, order?.id]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/timeline/${order.id}`);
      setInvoices(response.data.documents || []);

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
    if (window.confirm(`Generate invoice for order ${order?.order_number}?`)) {
      try {
        setGenerating(true);
        await api.post(`/sales/orders/${order.id}/generate-invoice`, {
          orderNumber: order.order_number,
        });
        alert("Invoice generation initiated!");
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

  const handlePrintInvoice = async (documentId) => {
    try {
      window.open(`/documents/${documentId}/preview`, "_blank");
    } catch (error) {
      alert("Failed to open invoice for printing");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaFileInvoice className="text-xl" />
            <div>
              <h2 className="text-lg font-semibold">Invoice Management</h2>
              <p className="text-blue-100 text-xs">
                Order: {order?.order_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
            title="Close"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Pending</p>
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

          {/* Generate/Regenerate Button */}
          <button
            onClick={handleGenerateInvoice}
            disabled={generating}
            className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 transition-all font-medium"
            title={
              stats.generated > 0
                ? "Create a new version of the invoice"
                : "Generate the first invoice"
            }
          >
            {generating ? (
              <>
                <FaSpinner className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FaSync size={14} />
                {stats.generated > 0
                  ? "Generate New Version"
                  : "Generate Invoice"}
              </>
            )}
          </button>

          {/* Invoices List */}
          {loading ? (
            <div className="text-center py-6">
              <FaSpinner className="animate-spin text-blue-600 mx-auto text-2xl" />
            </div>
          ) : invoices.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Generated Documents:
              </p>
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100 hover:bg-gray-100 transition-all group"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {invoice.document_type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(invoice.created_at).toLocaleDateString()} •{" "}
                      {invoice.file_size} bytes
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePrintInvoice(invoice.id)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Print"
                    >
                      <FaPrint size={14} />
                    </button>
                    <button
                      onClick={() =>
                        handleDownloadInvoice(
                          invoice.id,
                          invoice.file_name || `${invoice.document_type}.pdf`
                        )
                      }
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Download"
                    >
                      <FaDownload size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
              <FaFileInvoice className="text-gray-300 text-4xl mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">
                No invoices generated yet
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Click the button above to create an invoice
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagementModal;
