import React, { useState, useMemo, useEffect } from "react";
import {
  FaArrowLeft,
  FaQrcode,
  FaDownload,
  FaPaperPlane,
  FaTruck,
  FaCheck,
  FaPlus,
  FaTrash,
  FaCheckCircle,
} from "react-icons/fa";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import api from "../../utils/api";
import QRCodeDisplay from "../../components/QRCodeDisplay";
import { generateOrderQRData } from "../../utils/qrCode";
import toast from "react-hot-toast";

const CreatePurchaseOrderPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: poId } = useParams(); // Get PO ID from URL for edit mode
  const linkedSalesOrderId = searchParams.get("from_sales_order");
  const isEditMode = !!poId;

  // State for order data
  const [orderData, setOrderData] = useState({
    // Vendor & Order Information
    vendor_id: "",
    project_name: "",
    customer_id: "",
    client_name: "",
    po_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    priority: "medium",

    // Items
    items: [
      {
        type: "fabric", // 'fabric' or 'accessories'
        fabric_name: "",
        color: "",
        hsn: "",
        gsm: "",
        width: "",
        item_name: "",
        description: "",
        uom: "Meters",
        quantity: "",
        rate: "",
        total: 0,
        supplier: "",
        remarks: "",
      },
    ],

    // Financial & Additional Details
    payment_terms: "",
    delivery_address: "",
    special_instructions: "",
    terms_conditions: "",
    internal_notes: "",
    discount_percentage: 0,
    tax_percentage: 12,
    freight: 0,
  });

  const [vendorOptions, setVendorOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [linkedSalesOrder, setLinkedSalesOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [showSpecialInstructions, setShowSpecialInstructions] = useState(false);
  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const [showPaymentTerms, setShowPaymentTerms] = useState(false);
  const [paymentTermsChecked, setPaymentTermsChecked] = useState({
    notReturnable: false,
    paymentSchedule: false,
    noLiabilityDelay: false,
    invoiceVerified: false,
  });

  const [specialInstructionsChecked, setSpecialInstructionsChecked] = useState({
    notReturnable: false,
    paymentSchedule: false,
    noLiabilityDelay: false,
    invoiceVerified: false,
  });

  const [termsConditionsChecked, setTermsConditionsChecked] = useState({
    returnPolicy: false,
    paymentAgreement: false,
    deliveryLiability: false,
    verificationConfirmation: false,
  });

  // Pre-defined payment term options
  const paymentTermOptions = [
    {
      key: "notReturnable",
      label: "Goods not returnable or exchangeable",
      emoji: "1️⃣",
    },
    {
      key: "paymentSchedule",
      label: "Payment per agreed terms and schedule",
      emoji: "2️⃣",
    },
    {
      key: "noLiabilityDelay",
      label:
        "Not liable for transport or delivery delays due to external factors",
      emoji: "3️⃣",
    },
    {
      key: "invoiceVerified",
      label: "Invoice details reviewed and correct",
      emoji: "4️⃣",
    },
  ];

  // Pre-defined special instructions options
  const specialInstructionsOptions = [
    {
      key: "notReturnable",
      label:
        "I agree that all goods once sold are not returnable or exchangeable.",
      emoji: "1️⃣",
    },
    {
      key: "paymentSchedule",
      label:
        "I understand that payment must be made as per agreed terms and schedule.",
      emoji: "2️⃣",
    },
    {
      key: "noLiabilityDelay",
      label:
        "I accept that the company is not liable for transport or delivery delays due to external factors.",
      emoji: "3️⃣",
    },
    {
      key: "invoiceVerified",
      label:
        "I confirm that I have reviewed the invoice details and found them correct.",
      emoji: "4️⃣",
    },
  ];

  // Pre-defined terms & conditions options
  const termsConditionsOptions = [
    {
      key: "returnPolicy",
      title: "Return Policy",
      label:
        "I agree that all goods once sold are not returnable or exchangeable.",
      emoji: "1️⃣",
    },
    {
      key: "paymentAgreement",
      title: "Payment Agreement",
      label:
        "I understand that payment must be made as per the agreed terms and schedule.",
      emoji: "2️⃣",
    },
    {
      key: "deliveryLiability",
      title: "Delivery Liability",
      label:
        "I accept that the company is not responsible for delays caused by transport, weather, or other external factors.",
      emoji: "3️⃣",
    },
    {
      key: "verificationConfirmation",
      title: "Verification Confirmation",
      label:
        "I confirm that I have verified the order and invoice details and found them accurate.",
      emoji: "4️⃣",
    },
  ];

  // Fetch vendors and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsRes, customersRes] = await Promise.all([
          api.get("/procurement/vendors"),
          api.get("/sales/customers"),
        ]);

        setVendorOptions(
          vendorsRes.data.vendors.map((v) => ({ value: v.id, label: v.name }))
        );
        setCustomerOptions(
          customersRes.data.customers.map((c) => ({
            value: c.id,
            label: c.name,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch vendors/customers:", error);
        toast.error("Failed to load vendors or customers");
      }
    };

    fetchData();
  }, []);

  // Fetch linked sales order if present
  useEffect(() => {
    if (linkedSalesOrderId) {
      const fetchSalesOrder = async () => {
        try {
          const response = await api.get(`/sales/orders/${linkedSalesOrderId}`);
          const so = response.data.order; // API returns { order: {...} }
          setLinkedSalesOrder(so);

          // Auto-fill from Sales Order
          const soItems = so.items || [];
          const mappedItems = soItems.map((item) => ({
            type: item.product_type === "Fabric" ? "fabric" : "accessories",
            fabric_name:
              item.product_type === "Fabric" ? item.description || "" : "",
            color: item.color || "",
            hsn: item.hsn || "",
            gsm: item.gsm || "",
            width: item.width || "",
            item_name:
              item.product_type !== "Fabric" ? item.description || "" : "",
            description: item.description || "",
            uom: item.uom || "Meters",
            quantity: item.quantity || "",
            rate: item.unit_price || "",
            total: (item.quantity || 0) * (item.unit_price || 0),
            supplier: "",
            remarks: item.remarks || "",
          }));

          // Debug: Check what we received
          console.log("Fetched Sales Order:", so);

          setOrderData((prev) => ({
            ...prev,
            project_name: so.buyer_reference || "",
            customer_id: so.customer_id || "",
            client_name: so.customer?.name || so.customer_name || "",
            expected_delivery_date: so.delivery_date
              ? new Date(so.delivery_date).toISOString().split("T")[0]
              : "",
            priority: so.priority || "medium",
            items: mappedItems.length > 0 ? mappedItems : prev.items,
            special_instructions: so.special_instructions || "",
            internal_notes: `Linked to Sales Order: ${
              so.order_number || so.id
            }`,
          }));

          toast.success(
            `Loaded data from Sales Order: ${
              so.order_number || so.id || "Successfully loaded"
            }`
          );
        } catch (error) {
          console.error("Failed to fetch sales order:", error);
          toast.error("Failed to load sales order data");
        }
      };

      fetchSalesOrder();
    }
  }, [linkedSalesOrderId]);

  // Load existing PO data when in edit mode
  useEffect(() => {
    if (isEditMode && poId) {
      const fetchExistingPO = async () => {
        try {
          setIsLoading(true);
          const response = await api.get(`/procurement/pos/${poId}`);
          const po = response.data.purchaseOrder || response.data;

          // Parse items array if it's a string
          const items =
            typeof po.items === "string"
              ? JSON.parse(po.items)
              : po.items || [];

          // Map PO data to form state
          setOrderData({
            vendor_id: po.vendor_id || "",
            project_name: po.project_name || "",
            customer_id: po.customer_id || "",
            client_name: po.client_name || "",
            po_date: po.po_date
              ? new Date(po.po_date).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            expected_delivery_date: po.expected_delivery_date
              ? new Date(po.expected_delivery_date).toISOString().split("T")[0]
              : "",
            priority: po.priority || "medium",
            items:
              items.length > 0
                ? items
                : [
                    {
                      type: "fabric",
                      fabric_name: "",
                      color: "",
                      hsn: "",
                      gsm: "",
                      width: "",
                      item_name: "",
                      description: "",
                      uom: "Meters",
                      quantity: "",
                      rate: "",
                      total: 0,
                      supplier: "",
                      remarks: "",
                    },
                  ],
            payment_terms: po.payment_terms || "",
            delivery_address: po.delivery_address || "",
            special_instructions: po.special_instructions || "",
            terms_conditions: po.terms_conditions || "",
            internal_notes: po.internal_notes || "",
            discount_percentage: po.discount_percentage || 0,
            tax_percentage: po.tax_percentage || 12,
            freight: po.freight || 0,
          });

          // Auto-check boxes if fields have content
          if (po.special_instructions) {
            setShowSpecialInstructions(true);
          }
          if (po.terms_conditions) {
            setShowTermsConditions(true);
          }

          // Parse and check payment terms if they exist
          if (po.payment_terms) {
            const termsArray = po.payment_terms.split(",").map((t) => t.trim());
            const newChecked = {
              notReturnable: termsArray.includes("notReturnable"),
              paymentSchedule: termsArray.includes("paymentSchedule"),
              noLiabilityDelay: termsArray.includes("noLiabilityDelay"),
              invoiceVerified: termsArray.includes("invoiceVerified"),
            };
            setPaymentTermsChecked(newChecked);
            // Check if any payment term checkbox is checked
            if (Object.values(newChecked).some((v) => v)) {
              setShowPaymentTerms(true);
            }
          }

          // Parse and check special instructions if they exist
          if (
            po.special_instructions &&
            po.special_instructions.includes(",")
          ) {
            const instructionsArray = po.special_instructions
              .split(",")
              .map((t) => t.trim());
            const newChecked = {
              notReturnable: instructionsArray.includes("notReturnable"),
              paymentSchedule: instructionsArray.includes("paymentSchedule"),
              noLiabilityDelay: instructionsArray.includes("noLiabilityDelay"),
              invoiceVerified: instructionsArray.includes("invoiceVerified"),
            };
            setSpecialInstructionsChecked(newChecked);
            // Check if any special instructions checkbox is checked
            if (Object.values(newChecked).some((v) => v)) {
              setShowSpecialInstructions(true);
            }
          }

          // Parse and check terms & conditions if they exist
          if (po.terms_conditions && po.terms_conditions.includes(",")) {
            const tcArray = po.terms_conditions.split(",").map((t) => t.trim());
            const newChecked = {
              returnPolicy: tcArray.includes("returnPolicy"),
              paymentAgreement: tcArray.includes("paymentAgreement"),
              deliveryLiability: tcArray.includes("deliveryLiability"),
              verificationConfirmation: tcArray.includes(
                "verificationConfirmation"
              ),
            };
            setTermsConditionsChecked(newChecked);
            // Check if any terms & conditions checkbox is checked
            if (Object.values(newChecked).some((v) => v)) {
              setShowTermsConditions(true);
            }
          }

          setIsLoading(false);
        } catch (error) {
          console.error("Failed to fetch PO for editing:", error);
          toast.error("Failed to load purchase order");
          setIsLoading(false);
          navigate("/procurement/purchase-orders");
        }
      };

      fetchExistingPO();
    }
  }, [isEditMode, poId]);

  // Auto-fill supplier when vendor changes
  useEffect(() => {
    if (orderData.vendor_id) {
      const selectedVendor = vendorOptions.find(
        (v) => v.value === parseInt(orderData.vendor_id)
      );
      if (selectedVendor) {
        setOrderData((prev) => ({
          ...prev,
          items: prev.items.map((item) => ({
            ...item,
            supplier: selectedVendor.label,
          })),
        }));
      }
    }
  }, [orderData.vendor_id, vendorOptions]);

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = orderData.items.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    );
    const discountAmount = subtotal * (orderData.discount_percentage / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (orderData.tax_percentage / 100);
    const freightAmount = parseFloat(orderData.freight) || 0;
    const grandTotal = afterDiscount + taxAmount + freightAmount;

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      afterDiscount: afterDiscount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      freightAmount: freightAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  }, [
    orderData.items,
    orderData.discount_percentage,
    orderData.tax_percentage,
    orderData.freight,
  ]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setOrderData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle payment terms checkbox changes
  const handlePaymentTermsChange = (key) => {
    const updatedChecked = {
      ...paymentTermsChecked,
      [key]: !paymentTermsChecked[key],
    };
    setPaymentTermsChecked(updatedChecked);

    // Serialize checked terms into comma-separated string
    const checkedTerms = Object.keys(updatedChecked)
      .filter((k) => updatedChecked[k])
      .join(",");

    handleInputChange("payment_terms", checkedTerms);
  };

  // Handle special instructions checkbox changes
  const handleSpecialInstructionsChange = (key) => {
    const updatedChecked = {
      ...specialInstructionsChecked,
      [key]: !specialInstructionsChecked[key],
    };
    setSpecialInstructionsChecked(updatedChecked);

    // Serialize checked instructions into comma-separated string
    const checkedInstructions = Object.keys(updatedChecked)
      .filter((k) => updatedChecked[k])
      .join(",");

    handleInputChange("special_instructions", checkedInstructions);
  };

  // Handle terms & conditions checkbox changes
  const handleTermsConditionsChange = (key) => {
    const updatedChecked = {
      ...termsConditionsChecked,
      [key]: !termsConditionsChecked[key],
    };
    setTermsConditionsChecked(updatedChecked);

    // Serialize checked terms into comma-separated string
    const checkedTerms = Object.keys(updatedChecked)
      .filter((k) => updatedChecked[k])
      .join(",");

    handleInputChange("terms_conditions", checkedTerms);
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderData.items];
    updatedItems[index][field] = value;

    // Auto-calculate total
    if (field === "quantity" || field === "rate") {
      const qty = parseFloat(updatedItems[index].quantity) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].total = qty * rate;
    }

    setOrderData((prev) => ({ ...prev, items: updatedItems }));
  };

  // Add new item
  const handleAddItem = () => {
    const selectedVendor = vendorOptions.find(
      (v) => v.value === parseInt(orderData.vendor_id)
    );
    setOrderData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          type: "fabric",
          fabric_name: "",
          color: "",
          hsn: "",
          gsm: "",
          width: "",
          item_name: "",
          description: "",
          uom: "Meters",
          quantity: "",
          rate: "",
          total: 0,
          supplier: selectedVendor ? selectedVendor.label : "",
          remarks: "",
        },
      ],
    }));
  };

  // Remove item
  const handleRemoveItem = (index) => {
    if (orderData.items.length > 1) {
      setOrderData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    } else {
      toast.error("At least one item is required");
    }
  };

  // Handle form submission
  const handleSubmit = async (e, actionType = "draft") => {
    e.preventDefault();
    setSubmitError("");

    // Validation
    if (!orderData.vendor_id) {
      setSubmitError("Please select a vendor");
      return;
    }
    if (!orderData.expected_delivery_date) {
      setSubmitError("Expected delivery date is required");
      return;
    }
    if (
      orderData.items.length === 0 ||
      !orderData.items.some(
        (item) =>
          (item.type === "fabric" && (item.fabric_name || item.color)) ||
          (item.type === "accessories" && (item.item_name || item.description))
      )
    ) {
      setSubmitError("At least one valid item is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...orderData,
        vendor_id: parseInt(orderData.vendor_id),
        customer_id: orderData.customer_id
          ? parseInt(orderData.customer_id)
          : null,
        items: orderData.items.filter((item) => {
          if (item.type === "fabric") {
            return item.fabric_name || item.color;
          } else {
            return item.item_name || item.description;
          }
        }),
        final_amount: parseFloat(calculations.grandTotal),
        status: actionType,
        action_type: actionType,
      };

      if (linkedSalesOrder) {
        payload.linked_sales_order_id = linkedSalesOrder.id;
      }

      let response;
      if (isEditMode) {
        // Update existing PO
        response = await api.put(`/procurement/pos/${poId}`, payload);
        const updatedOrder = response.data.purchaseOrder; // Backend returns { purchaseOrder: {...} }

        // Generate QR code data
        const qrCodeData = generateOrderQRData(updatedOrder, "purchase");
        setQrData(qrCodeData);
        setCreatedOrder(updatedOrder);
        setShowQRCode(false);

        toast.success(
          `✅ Purchase Order ${updatedOrder.po_number} updated successfully!`
        );

        // Navigate back to details page
        setTimeout(() => {
          navigate(`/procurement/purchase-orders/${updatedOrder.id}`);
        }, 1500);
      } else {
        // Create new PO
        response = await api.post("/procurement/pos", payload);
        const newOrder = response.data.purchaseOrder; // Backend returns { purchaseOrder: {...} }

        // Generate QR code data
        const qrCodeData = generateOrderQRData(newOrder, "purchase");
        setQrData(qrCodeData);
        setCreatedOrder(newOrder);
        setShowQRCode(false);

        toast.success(
          `✅ Purchase Order ${newOrder.po_number} created successfully!`
        );

        // If linked to a sales order, navigate back to dashboard to see the updated status
        if (linkedSalesOrder) {
          setTimeout(() => {
            navigate("/procurement/dashboard", {
              state: {
                message: `PO ${newOrder.po_number} created successfully for Sales Order ${linkedSalesOrder.order_number}`,
              },
            });
          }, 1500);
        }
      }
    } catch (err) {
      const response = err.response?.data;

      if (response?.message) {
        setSubmitError(response.message);
      } else if (Array.isArray(response?.errors)) {
        setSubmitError(response.errors.join(", "));
      } else {
        setSubmitError(
          isEditMode
            ? "Failed to update purchase order. Please try again."
            : "Failed to create purchase order. Please try again."
        );
      }
      console.error(
        isEditMode ? "PO update error:" : "PO creation error:",
        err
      );
      toast.error(
        isEditMode
          ? "Failed to update purchase order"
          : "Failed to create purchase order"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action handlers
  const handleSendToVendor = async () => {
    if (!createdOrder) {
      toast.error("Please save the order first");
      return;
    }

    try {
      await api.patch(`/procurement/pos/${createdOrder.id}`, {
        status: "sent",
      });
      toast.success("Purchase order sent to vendor");
      setCreatedOrder({ ...createdOrder, status: "sent" });
    } catch (error) {
      toast.error("Failed to send to vendor");
      console.error("Send to vendor error:", error);
    }
  };

  const handleMarkAsReceived = async () => {
    if (!createdOrder) {
      toast.error("Please save the order first");
      return;
    }

    if (
      !window.confirm(
        `Confirm that materials for PO ${createdOrder.po_number} have been received? This will automatically create a GRN request for the Inventory Department.`
      )
    ) {
      return;
    }

    try {
      await api.post(
        `/procurement/purchase-orders/${createdOrder.id}/material-received`
      );
      toast.success(
        `✅ Materials received for PO ${createdOrder.po_number}! GRN request sent to Inventory Department.`
      );
      setCreatedOrder({ ...createdOrder, status: "received" });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to mark materials as received"
      );
      console.error("Mark as received error:", error);
    }
  };

  const handleGenerateQR = () => {
    if (!createdOrder) {
      toast.error("Please save the order first");
      return;
    }

    const qrCodeData = generateOrderQRData(createdOrder, "purchase");
    setQrData(qrCodeData);
    setShowQRCode(true);
  };

  const handlePrintPO = () => {
    if (!createdOrder) {
      toast.error("Please save the order first");
      return;
    }
    window.print();
  };

  const handleViewOrders = () => {
    navigate("/procurement/purchase-orders");
  };

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const uomOptions = [
    "Meters",
    "Yards",
    "Kilograms",
    "Pieces",
    "Sets",
    "Dozens",
    "Boxes",
  ];

  // Loading state for edit mode
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  isEditMode
                    ? `/procurement/purchase-orders/${poId}`
                    : "/procurement/purchase-orders"
                )
              }
              className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <FaArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Purchase Order" : "Create Purchase Order"}
            </h1>
          </div>

          {createdOrder && (
            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
              <FaCheck className="mr-1 inline" /> Order Created:{" "}
              {createdOrder.po_number}
            </span>
          )}
        </div>

        {/* Linked Sales Order Info */}
        {linkedSalesOrder && (
          <div className="mb-4 rounded border border-blue-300 bg-blue-50 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-700 font-semibold">
                📋 Creating from Sales Order:
              </span>
              <span className="text-blue-900 font-bold">
                {linkedSalesOrder.order_number}
              </span>
              <span className="text-blue-600">
                • Customer:{" "}
                {linkedSalesOrder.customer?.name ||
                  linkedSalesOrder.customer_name}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
            {submitError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, "draft")} className="space-y-6">
          {/* Vendor & Order Information */}
          <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 border-b pb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                🔹 Vendor & Order Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Select vendor and configure order details
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="vendor_id"
                >
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  id="vendor_id"
                  value={orderData.vendor_id}
                  onChange={(e) =>
                    handleInputChange("vendor_id", e.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                  disabled={createdOrder}
                >
                  <option value="">Select vendor</option>
                  {vendorOptions.map((vendor) => (
                    <option key={vendor.value} value={vendor.value}>
                      {vendor.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="project_name"
                >
                  Project Name
                </label>
                <input
                  id="project_name"
                  type="text"
                  value={orderData.project_name}
                  onChange={(e) =>
                    handleInputChange("project_name", e.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter project name"
                  disabled={createdOrder}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="customer_id"
                >
                  Customer (Optional)
                </label>
                <select
                  id="customer_id"
                  value={orderData.customer_id}
                  onChange={(e) =>
                    handleInputChange("customer_id", e.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={createdOrder}
                >
                  <option value="">Select customer</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.value} value={customer.value}>
                      {customer.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="client_name"
                >
                  Client Name
                </label>
                <input
                  id="client_name"
                  type="text"
                  value={orderData.client_name}
                  onChange={(e) =>
                    handleInputChange("client_name", e.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter client name"
                  disabled={createdOrder}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="po_date"
                >
                  PO Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="po_date"
                  type="date"
                  value={orderData.po_date}
                  onChange={(e) => handleInputChange("po_date", e.target.value)}
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                  disabled={createdOrder}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="expected_delivery_date"
                >
                  Expected Delivery <span className="text-red-500">*</span>
                </label>
                <input
                  id="expected_delivery_date"
                  type="date"
                  value={orderData.expected_delivery_date}
                  onChange={(e) =>
                    handleInputChange("expected_delivery_date", e.target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                  disabled={createdOrder}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="priority"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  value={orderData.priority}
                  onChange={(e) =>
                    handleInputChange("priority", e.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={createdOrder}
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="delivery_address"
                >
                  Delivery Address
                </label>
                <input
                  id="delivery_address"
                  type="text"
                  value={orderData.delivery_address}
                  onChange={(e) =>
                    handleInputChange("delivery_address", e.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter delivery address"
                  disabled={createdOrder}
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  🔹 Order Items
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add fabric and accessories
                </p>
              </div>
              {!createdOrder && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600"
                >
                  <FaPlus className="h-4 w-4" />
                  Add Item
                </button>
              )}
            </div>

            <div className="space-y-4">
              {orderData.items.map((item, index) => (
                <div
                  key={index}
                  className="rounded border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Item #{index + 1}
                    </h3>
                    {!createdOrder && orderData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                    {/* Item Type */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Type
                      </label>
                      <select
                        value={item.type}
                        onChange={(e) =>
                          handleItemChange(index, "type", e.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        disabled={createdOrder}
                      >
                        <option value="fabric">Fabric</option>
                        <option value="accessories">Accessories</option>
                      </select>
                    </div>

                    {/* Conditional Fields based on Type */}
                    {item.type === "fabric" ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-600">
                            Fabric Name
                          </label>
                          <input
                            type="text"
                            value={item.fabric_name}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "fabric_name",
                                e.target.value
                              )
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Cotton, Polyester, etc."
                            disabled={createdOrder}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-600">
                            Color
                          </label>
                          <input
                            type="text"
                            value={item.color}
                            onChange={(e) =>
                              handleItemChange(index, "color", e.target.value)
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Red, Blue, etc."
                            disabled={createdOrder}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-600">
                            HSN Code
                          </label>
                          <input
                            type="text"
                            value={item.hsn}
                            onChange={(e) =>
                              handleItemChange(index, "hsn", e.target.value)
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            placeholder="HSN Code"
                            disabled={createdOrder}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-600">
                            GSM
                          </label>
                          <input
                            type="text"
                            value={item.gsm}
                            onChange={(e) =>
                              handleItemChange(index, "gsm", e.target.value)
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            placeholder="180, 200, etc."
                            disabled={createdOrder}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-600">
                            Width
                          </label>
                          <input
                            type="text"
                            value={item.width}
                            onChange={(e) =>
                              handleItemChange(index, "width", e.target.value)
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            placeholder="60 inch"
                            disabled={createdOrder}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-semibold text-gray-600">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "item_name",
                                e.target.value
                              )
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Button, Zipper, Thread, etc."
                            disabled={createdOrder}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-semibold text-gray-600">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Additional details"
                            disabled={createdOrder}
                          />
                        </div>
                      </>
                    )}

                    {/* Common Fields */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-600">
                        UOM
                      </label>
                      <select
                        value={item.uom}
                        onChange={(e) =>
                          handleItemChange(index, "uom", e.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        disabled={createdOrder}
                      >
                        {uomOptions.map((uom) => (
                          <option key={uom} value={uom}>
                            {uom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        placeholder="100"
                        min="0"
                        step="0.01"
                        disabled={createdOrder}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Rate (₹)
                      </label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(index, "rate", e.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        placeholder="50.00"
                        min="0"
                        step="0.01"
                        disabled={createdOrder}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Total (₹)
                      </label>
                      <input
                        type="text"
                        value={item.total.toFixed(2)}
                        readOnly
                        className="w-full rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Supplier
                      </label>
                      <input
                        type="text"
                        value={item.supplier}
                        readOnly
                        className="w-full rounded border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700"
                        placeholder="Auto-filled from vendor"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Remarks
                      </label>
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) =>
                          handleItemChange(index, "remarks", e.target.value)
                        }
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Additional remarks"
                        disabled={createdOrder}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Details */}
          <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 border-b pb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                🔹 Financial Details
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Payment terms and additional charges
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="discount_percentage"
                >
                  Discount (%)
                </label>
                <input
                  id="discount_percentage"
                  type="number"
                  value={orderData.discount_percentage}
                  onChange={(e) =>
                    handleInputChange("discount_percentage", e.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={createdOrder}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="tax_percentage"
                >
                  Tax/GST (%)
                </label>
                <select
                  id="tax_percentage"
                  value={orderData.tax_percentage}
                  onChange={(e) =>
                    handleInputChange("tax_percentage", e.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={createdOrder}
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="freight"
                >
                  Freight Charges (₹)
                </label>
                <input
                  id="freight"
                  type="number"
                  value={orderData.freight}
                  onChange={(e) => handleInputChange("freight", e.target.value)}
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={createdOrder}
                />
              </div>

              {/* Payment Terms - Checkbox Toggle */}
              <div className="md:col-span-3 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded bg-green-50 border border-green-200">
                  <input
                    id="enable_payment_terms"
                    type="checkbox"
                    checked={showPaymentTerms}
                    onChange={(e) => setShowPaymentTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 shadow-sm focus:ring-2 focus:ring-green-500 cursor-pointer"
                  />
                  <label
                    htmlFor="enable_payment_terms"
                    className="text-sm font-semibold text-gray-700 cursor-pointer flex-1"
                  >
                    ✅ Add Payment Terms & Conditions
                  </label>
                  <span className="text-xs text-green-600 font-medium">
                    Optional
                  </span>
                </div>

                {showPaymentTerms && (
                  <div className="space-y-3 pl-3 border-l-4 border-green-400">
                    <p className="text-xs text-gray-600 font-medium">
                      Select the terms that apply to this order:
                    </p>
                    <div className="space-y-2">
                      {paymentTermOptions.map((option) => (
                        <div
                          key={option.key}
                          className="flex items-start gap-3 p-2 rounded hover:bg-green-50 transition"
                        >
                          <input
                            id={`payment_term_${option.key}`}
                            type="checkbox"
                            checked={paymentTermsChecked[option.key] || false}
                            onChange={() =>
                              handlePaymentTermsChange(option.key)
                            }
                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-green-600 shadow-sm focus:ring-2 focus:ring-green-500 cursor-pointer"
                            disabled={createdOrder}
                          />
                          <label
                            htmlFor={`payment_term_${option.key}`}
                            className="text-sm text-gray-700 cursor-pointer flex-1"
                          >
                            <span className="mr-2">{option.emoji}</span>
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-3">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="payment_terms_custom"
                >
                  Custom Payment Terms (Optional)
                </label>
                <input
                  id="payment_terms_custom"
                  type="text"
                  value={orderData.payment_terms}
                  onChange={(e) =>
                    handleInputChange("payment_terms", e.target.value)
                  }
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="e.g., 50% advance, 50% on delivery (or use checkboxes above)"
                  disabled={createdOrder}
                />
              </div>

              {/* Special Instructions - Checkbox Toggle */}
              <div className="md:col-span-3 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded bg-blue-50 border border-blue-200">
                  <input
                    id="enable_special_instructions"
                    type="checkbox"
                    checked={showSpecialInstructions}
                    onChange={(e) =>
                      setShowSpecialInstructions(e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor="enable_special_instructions"
                    className="text-sm font-semibold text-gray-700 cursor-pointer flex-1"
                  >
                    ✏️ Add Special Instructions
                  </label>
                  <span className="text-xs text-blue-600 font-medium">
                    Optional
                  </span>
                </div>

                {showSpecialInstructions && (
                  <div className="space-y-3 pl-3 border-l-4 border-blue-400">
                    <p className="text-xs text-gray-600 font-medium">
                      Select the instructions that apply to this order:
                    </p>
                    <div className="space-y-2">
                      {specialInstructionsOptions.map((option) => (
                        <div
                          key={option.key}
                          className="flex items-start gap-3 p-2 rounded hover:bg-blue-50 transition"
                        >
                          <input
                            id={`special_instruction_${option.key}`}
                            type="checkbox"
                            checked={
                              specialInstructionsChecked[option.key] || false
                            }
                            onChange={() =>
                              handleSpecialInstructionsChange(option.key)
                            }
                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            disabled={createdOrder}
                          />
                          <label
                            htmlFor={`special_instruction_${option.key}`}
                            className="text-sm text-gray-700 cursor-pointer flex-1"
                          >
                            <span className="mr-2">{option.emoji}</span>
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Terms & Conditions - Checkbox Toggle */}
              <div className="md:col-span-3 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded bg-purple-50 border border-purple-200">
                  <input
                    id="enable_terms_conditions"
                    type="checkbox"
                    checked={showTermsConditions}
                    onChange={(e) => setShowTermsConditions(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 shadow-sm focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  />
                  <label
                    htmlFor="enable_terms_conditions"
                    className="text-sm font-semibold text-gray-700 cursor-pointer flex-1"
                  >
                    📋 Add Terms & Conditions
                  </label>
                  <span className="text-xs text-purple-600 font-medium">
                    Optional
                  </span>
                </div>

                {showTermsConditions && (
                  <div className="space-y-3 pl-3 border-l-4 border-purple-400">
                    <p className="text-xs text-gray-600 font-medium">
                      Please review and confirm before proceeding:
                    </p>
                    <div className="space-y-2">
                      {termsConditionsOptions.map((option) => (
                        <div
                          key={option.key}
                          className="flex items-start gap-3 p-2 rounded hover:bg-purple-50 transition"
                        >
                          <input
                            id={`terms_condition_${option.key}`}
                            type="checkbox"
                            checked={
                              termsConditionsChecked[option.key] || false
                            }
                            onChange={() =>
                              handleTermsConditionsChange(option.key)
                            }
                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-purple-600 shadow-sm focus:ring-2 focus:ring-purple-500 cursor-pointer"
                            disabled={createdOrder}
                          />
                          <label
                            htmlFor={`terms_condition_${option.key}`}
                            className="text-sm text-gray-700 cursor-pointer flex-1"
                          >
                            <span className="mr-2 font-semibold">
                              {option.emoji}
                            </span>
                            <span className="font-medium text-gray-800">
                              {option.title}
                            </span>
                            {" — "}
                            <span className="text-gray-700">
                              {option.label}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-3">
                <label
                  className="text-sm font-semibold text-gray-700"
                  htmlFor="internal_notes"
                >
                  Internal Notes
                </label>
                <textarea
                  id="internal_notes"
                  value={orderData.internal_notes}
                  onChange={(e) =>
                    handleInputChange("internal_notes", e.target.value)
                  }
                  rows={2}
                  className="w-full rounded border border-gray-300 px-4 py-2.5 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Internal notes (not visible to vendor)"
                  disabled={createdOrder}
                />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mt-6 border-t pt-6">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
                <div className="rounded bg-gray-50 p-4">
                  <div className="text-xs font-medium text-gray-500">
                    Subtotal
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    ₹ {calculations.subtotal}
                  </div>
                </div>
                <div className="rounded bg-orange-50 p-4">
                  <div className="text-xs font-medium text-orange-600">
                    Discount
                  </div>
                  <div className="mt-1 text-lg font-bold text-orange-900">
                    - ₹ {calculations.discountAmount}
                  </div>
                </div>
                <div className="rounded bg-purple-50 p-4">
                  <div className="text-xs font-medium text-purple-600">
                    Tax ({orderData.tax_percentage}%)
                  </div>
                  <div className="mt-1 text-lg font-bold text-purple-900">
                    ₹ {calculations.taxAmount}
                  </div>
                </div>
                <div className="rounded bg-yellow-50 p-4">
                  <div className="text-xs font-medium text-yellow-600">
                    Freight
                  </div>
                  <div className="mt-1 text-lg font-bold text-yellow-900">
                    ₹ {calculations.freightAmount}
                  </div>
                </div>
                <div className="rounded bg-green-50 p-4">
                  <div className="text-xs font-medium text-green-600">
                    Grand Total
                  </div>
                  <div className="mt-1 text-lg font-bold text-green-900">
                    ₹ {calculations.grandTotal}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="rounded border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                🔹 Actions
              </h2>
              {!createdOrder && (
                <div className="mt-2 rounded bg-blue-50 border border-blue-200 px-4 py-3">
                  <p className="text-sm text-blue-800">
                    <strong>📋 Automated Workflow:</strong> PO will be
                    automatically sent to admin for approval. After approval, it
                    will be sent to vendor automatically.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {/* Create/Update Purchase Order */}
              {(!createdOrder || isEditMode) && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                >
                  <FaCheck className="h-4 w-4" />
                  {isSubmitting
                    ? isEditMode
                      ? "Updating PO..."
                      : "Creating PO..."
                    : isEditMode
                    ? "Update PO"
                    : "Create PO & Send for Approval"}
                </button>
              )}

              {/* Send to Vendor - Only show for draft or approved status */}
              {createdOrder &&
                ["draft", "approved"].includes(createdOrder.status) && (
                  <button
                    type="button"
                    onClick={handleSendToVendor}
                    className="inline-flex items-center justify-center gap-2 rounded border border-purple-600 bg-purple-50 px-2 py-2 text-sm font-semibold text-purple-700 shadow-md transition hover:bg-purple-100"
                  >
                    <FaPaperPlane className="h-4 w-4" />
                    Send to Vendor
                  </button>
                )}

              {/* Material Received - Only show for sent or acknowledged status */}
              {createdOrder &&
                ["sent", "acknowledged"].includes(createdOrder.status) && (
                  <button
                    type="button"
                    onClick={handleMarkAsReceived}
                    className="inline-flex items-center justify-center gap-2 rounded border border-green-600 bg-green-50 px-2 py-2 text-sm font-semibold text-green-700 shadow-md transition hover:bg-green-100"
                  >
                    <FaCheckCircle className="h-4 w-4" />✅ Material Received
                  </button>
                )}

              {/* Generate QR Code */}
              <button
                type="button"
                onClick={handleGenerateQR}
                disabled={!createdOrder}
                className="inline-flex items-center justify-center gap-2 rounded border border-indigo-600 bg-indigo-50 px-2 py-2 text-sm font-semibold text-indigo-700 shadow-md transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaQrcode className="h-4 w-4" />
                Generate QR Code
              </button>

              {/* Print PO */}
              <button
                type="button"
                onClick={handlePrintPO}
                disabled={!createdOrder}
                className="inline-flex items-center justify-center gap-2 rounded border border-gray-600 bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 shadow-md transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaDownload className="h-4 w-4" />
                Print PO
              </button>

              {/* View All Orders */}
              <button
                type="button"
                onClick={handleViewOrders}
                className="inline-flex items-center justify-center gap-2 rounded border border-blue-600 bg-blue-50 px-2 py-2 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-blue-100"
              >
                <FaArrowLeft className="h-4 w-4" />
                View All Orders
              </button>
            </div>
          </div>
        </form>

        {/* QR Code Modal */}
        {showQRCode && qrData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="relative max-w-md rounded bg-white p-6 shadow-2xl">
              <button
                onClick={() => setShowQRCode(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Purchase Order QR Code
              </h3>
              <QRCodeDisplay data={qrData} />
              <p className="mt-4 text-center text-sm text-gray-600">
                Scan this QR code to view PO details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePurchaseOrderPage;
