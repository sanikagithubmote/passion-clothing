import React, { useState, useEffect } from "react";
import {
  FaDownload,
  FaPrint,
  FaFile,
  FaExclamationTriangle,
} from "react-icons/fa";
import api from "../utils/api";

const InvoiceTemplate = ({ salesOrderId, onDownload }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchInvoiceData();
  }, [salesOrderId]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/invoices/preview/${salesOrderId}`);
      setInvoice(response.data);
      setError("");
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
      setError(err.response?.data?.message || "Failed to load invoice preview");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const response = await api.get(`/invoices/download-pdf/${salesOrderId}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Invoice-${invoice?.order_number || "SO"}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (onDownload) onDownload("pdf");
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadHTML = async () => {
    try {
      setDownloading(true);
      const response = await api.get(
        `/invoices/download-html/${salesOrderId}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Invoice-${invoice?.order_number || "SO"}.html`
      );
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (onDownload) onDownload("html");
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download HTML");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
    if (onDownload) onDownload("print");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600 text-sm">Loading invoice preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="text-red-500 mt-1" />
          <div>
            <h3 className="font-semibold text-red-900">
              Unable to Load Invoice
            </h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full print:p-0">
      {/* Action Buttons - Hidden on Print */}
      <div className="print:hidden flex gap-2 mb-4 pb-4 border-b border-gray-200">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-medium text-sm"
        >
          <FaDownload className="w-4 h-4" />
          {downloading ? "Downloading..." : "Download PDF"}
        </button>
        <button
          onClick={handleDownloadHTML}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all font-medium text-sm"
        >
          <FaFile className="w-4 h-4" />
          {downloading ? "Downloading..." : "Download HTML"}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium text-sm"
        >
          <FaPrint className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Invoice Preview Container */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {invoice?.html ? (
          <div
            className="invoice-preview p-8 bg-white"
            dangerouslySetInnerHTML={{ __html: invoice.html }}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            No invoice data available
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none;
          }
          .invoice-preview {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceTemplate;
