import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Building2,
  FileText,
  Send,
  Download,
  Package,
  Calculator,
  Truck,
} from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import ReadyForShipmentDialog from "../../components/shipment/ReadyForShipmentDialog";

const ProductionOperationsViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [productionOrder, setProductionOrder] = useState(null);
  const [stages, setStages] = useState([]);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    notes: "",
  });

  // Outsourcing dialogs
  const [outsourcingDialogOpen, setOutsourcingDialogOpen] = useState(false);
  const [workType, setWorkType] = useState("in_house"); // 'in_house' or 'outsourced'
  const [vendors, setVendors] = useState([]);
  const [outwardChallanDialog, setOutwardChallanDialog] = useState(false);
  const [inwardChallanDialog, setInwardChallanDialog] = useState(false);
  const [challans, setChallans] = useState([]);

  // Material reconciliation
  const [reconciliationDialog, setReconciliationDialog] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [reconciliationData, setReconciliationData] = useState([]);

  // Shipment workflow
  const [readyForShipmentDialog, setReadyForShipmentDialog] = useState(false);

  useEffect(() => {
    fetchProductionOrder();
    fetchVendors();
  }, [id]);

  useEffect(() => {
    if (stages.length > 0 && !selectedStageIndex) {
      const inProgressIndex = stages.findIndex(
        (s) => s.status === "in_progress"
      );
      const pendingIndex = stages.findIndex((s) => s.status === "pending");
      const defaultIndex =
        inProgressIndex !== -1
          ? inProgressIndex
          : pendingIndex !== -1
          ? pendingIndex
          : 0;
      setSelectedStageIndex(defaultIndex);
    }
  }, [stages]);

  useEffect(() => {
    if (stages.length > 0 && stages[selectedStageIndex]) {
      const stage = stages[selectedStageIndex];
      setFormData({
        status: stage.status || "pending",
        start_date: stage.actual_start_time
          ? new Date(stage.actual_start_time).toISOString().split("T")[0]
          : "",
        start_time: stage.actual_start_time
          ? new Date(stage.actual_start_time).toTimeString().slice(0, 5)
          : "",
        end_date: stage.actual_end_time
          ? new Date(stage.actual_end_time).toISOString().split("T")[0]
          : "",
        end_time: stage.actual_end_time
          ? new Date(stage.actual_end_time).toTimeString().slice(0, 5)
          : "",
        notes: stage.notes || "",
      });

      // Fetch challans for this stage if it supports outsourcing
      if (isOutsourcingStage(stage)) {
        fetchStageChallans(stage.id);
      }
    }
  }, [selectedStageIndex, stages]);

  const fetchProductionOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/manufacturing/orders/${id}`);
      const order = response.data.productionOrder;
      setProductionOrder(order);
      setStages(order.stages || []);

      // Debug: Log stages with outsourcing fields
      console.log("🔍 Production Order Stages:");
      (order.stages || []).forEach((stage, idx) => {
        console.log(`  Stage ${idx + 1}: ${stage.stage_name}`);
        console.log(`    - is_embroidery: ${stage.is_embroidery}`);
        console.log(`    - is_printing: ${stage.is_printing}`);
        console.log(`    - customization_type: ${stage.customization_type}`);
        console.log(`    - outsource_type: ${stage.outsource_type}`);
        console.log(`    - Shows outsourcing: ${isOutsourcingStage(stage)}`);
      });
    } catch (error) {
      console.error("Error fetching production order:", error);
      toast.error("Failed to load production order");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await api.get("/procurement/vendors");
      setVendors(response.data.vendors || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchStageChallans = async (stageId) => {
    try {
      const response = await api.get(
        `/manufacturing/stages/${stageId}/challans`
      );
      setChallans(response.data.challans || []);
    } catch (error) {
      console.error("Error fetching challans:", error);
    }
  };

  const isOutsourcingStage = (stage) => {
    // Check if stage name includes outsourcing keywords
    const stageName = typeof stage === "string" ? stage : stage.stage_name;
    if (!stageName) return false;

    const stageNameLower = stageName.toLowerCase();

    // List of stages that support outsourcing
    const outsourcingStages = [
      "embroidery",
      "printing",
      "screen_printing",
      "screen printing",
      "washing",
      "embroidery/printing",
      "embroidery or printing",
    ];

    const nameMatch = outsourcingStages.some((s) => stageNameLower.includes(s));

    // If stage is an object, also check the specific fields
    if (typeof stage === "object") {
      return Boolean(
        nameMatch ||
          stage.is_embroidery === true ||
          stage.is_printing === true ||
          (stage.customization_type && stage.customization_type !== "none") ||
          (stage.outsource_type && stage.outsource_type !== "none")
      );
    }

    return nameMatch;
  };

  const isLastStage = () => {
    return selectedStageIndex === stages.length - 1;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "Not calculated";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m`;
  };

  const calculateOverallProgress = () => {
    if (stages.length === 0) return 0;
    const completedStages = stages.filter(
      (s) => s.status === "completed"
    ).length;
    return Math.round((completedStages / stages.length) * 100);
  };

  const getStageIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "on_hold":
        return <Pause className="w-5 h-5 text-orange-600" />;
      case "pending":
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStageStatusClass = (status, isSelected) => {
    const baseClass = "p-4 rounded border-2 mb-3 cursor-pointer transition-all";
    if (isSelected) {
      return `${baseClass} border-red-500 bg-red-50`;
    }
    switch (status) {
      case "completed":
        return `${baseClass} border-green-300 bg-white hover:bg-green-50`;
      case "in_progress":
        return `${baseClass} border-blue-300 bg-white hover:bg-blue-50`;
      case "on_hold":
        return `${baseClass} border-orange-300 bg-white hover:bg-orange-50`;
      case "pending":
      default:
        return `${baseClass} border-gray-200 bg-white hover:bg-gray-50`;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
        return "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800";
      case "in_progress":
        return "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800";
      case "on_hold":
        return "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800";
      case "pending":
      default:
        return "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600";
    }
  };

  const handleStartStage = async () => {
    try {
      const stage = stages[selectedStageIndex];
      await api.post(`/manufacturing/stages/${stage.id}/start`);
      toast.success("Stage started successfully");
      fetchProductionOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start stage");
    }
  };

  const handlePauseStage = async () => {
    try {
      const stage = stages[selectedStageIndex];
      await api.post(`/manufacturing/stages/${stage.id}/pause`, {
        status: "on_hold",
      });
      toast.success("Stage paused successfully");
      fetchProductionOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pause stage");
    }
  };

  const handleCompleteStage = async () => {
    try {
      const stage = stages[selectedStageIndex];
      await api.post(`/manufacturing/stages/${stage.id}/complete`, {
        notes: formData.notes,
      });
      toast.success("Stage completed successfully");
      setEditMode(false);
      fetchProductionOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete stage");
    }
  };

  const handleSaveChanges = async () => {
    try {
      const stage = stages[selectedStageIndex];

      const startDateTime =
        formData.start_date && formData.start_time
          ? `${formData.start_date}T${formData.start_time}:00`
          : null;
      const endDateTime =
        formData.end_date && formData.end_time
          ? `${formData.end_date}T${formData.end_time}:00`
          : null;

      await api.put(`/manufacturing/stages/${stage.id}`, {
        status: formData.status,
        actual_start_time: startDateTime,
        actual_end_time: endDateTime,
        notes: formData.notes,
      });

      toast.success("Changes saved successfully");
      setEditMode(false);
      fetchProductionOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save changes");
    }
  };

  const handleHoldStage = async () => {
    try {
      const stage = stages[selectedStageIndex];
      await api.post(`/manufacturing/stages/${stage.id}/hold`);
      toast.success("Stage put on hold");
      fetchProductionOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to hold stage");
    }
  };

  const handlePreviousStage = () => {
    if (selectedStageIndex > 0) {
      setSelectedStageIndex(selectedStageIndex - 1);
      setEditMode(false);
    }
  };

  const handleNextStage = () => {
    if (selectedStageIndex < stages.length - 1) {
      setSelectedStageIndex(selectedStageIndex + 1);
      setEditMode(false);
    }
  };

  // Material Reconciliation Functions
  const openMaterialReconciliation = async () => {
    try {
      const response = await api.get(
        `/manufacturing/orders/${id}/materials/reconciliation`
      );
      const materialsData = response.data.materials || [];
      setMaterials(materialsData);

      // Initialize reconciliation data
      const initialData = materialsData.map((m) => ({
        allocation_id: m.id,
        item_name: m.item_name,
        allocated: m.quantity_allocated,
        consumed: m.quantity_consumed,
        wasted: m.quantity_wasted,
        actual_consumed: m.quantity_consumed,
        actual_wasted: m.quantity_wasted,
        leftover_quantity: m.quantity_remaining,
        notes: "",
      }));
      setReconciliationData(initialData);
      setReconciliationDialog(true);
    } catch (error) {
      toast.error("Failed to load material data");
      console.error(error);
    }
  };

  const handleReconciliationSubmit = async () => {
    try {
      await api.post(`/manufacturing/orders/${id}/materials/reconcile`, {
        materials: reconciliationData,
        notes: "Final stage material reconciliation",
      });

      toast.success(
        "Material reconciliation completed! Leftover materials returned to inventory."
      );
      setReconciliationDialog(false);
      fetchProductionOrder();
    } catch (error) {
      toast.error("Failed to complete reconciliation");
      console.error(error);
    }
  };

  const updateReconciliationItem = (index, field, value) => {
    const updated = [...reconciliationData];
    updated[index][field] = parseFloat(value) || 0;

    // Recalculate leftover
    const item = updated[index];
    item.leftover_quantity =
      item.allocated - item.actual_consumed - item.actual_wasted;

    setReconciliationData(updated);
  };

  // Outsourcing Functions
  const handleCreateOutwardChallan = async (
    vendorId,
    items,
    expectedDate,
    notes,
    transportDetails
  ) => {
    try {
      const stage = stages[selectedStageIndex];
      await api.post(`/manufacturing/stages/${stage.id}/outsource/outward`, {
        vendor_id: vendorId,
        items,
        expected_return_date: expectedDate,
        notes,
        transport_details: transportDetails,
      });

      toast.success("Outward challan created successfully");
      setOutwardChallanDialog(false);
      fetchStageChallans(stage.id);
      fetchProductionOrder();
    } catch (error) {
      toast.error("Failed to create outward challan");
      console.error(error);
    }
  };

  const handleCreateInwardChallan = async (
    outwardChallanId,
    items,
    receivedQty,
    qualityNotes,
    discrepancies
  ) => {
    try {
      const stage = stages[selectedStageIndex];
      await api.post(`/manufacturing/stages/${stage.id}/outsource/inward`, {
        outward_challan_id: outwardChallanId,
        items,
        received_quantity: receivedQty,
        quality_notes: qualityNotes,
        discrepancies,
      });

      toast.success("Inward challan created successfully");
      setInwardChallanDialog(false);
      fetchStageChallans(stage.id);
      fetchProductionOrder();
    } catch (error) {
      toast.error("Failed to create inward challan");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading production order...</p>
        </div>
      </div>
    );
  }

  if (!productionOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Production order not found</p>
          <button
            onClick={() => navigate("/manufacturing")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentStage = stages[selectedStageIndex];
  const overallProgress = calculateOverallProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/manufacturing")}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {productionOrder.production_number}
              </h1>
              <p className="text-sm text-gray-600">
                {productionOrder.product?.name ||
                  productionOrder.productName ||
                  productionOrder.specifications?.product_name ||
                  "Unknown Product"}{" "}
                - {productionOrder.quantity} units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-gray-900">
            {overallProgress}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar - Production Stages */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 h-[calc(100vh-180px)] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Production Stages
          </h2>
          <div>
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className={getStageStatusClass(
                  stage.status,
                  index === selectedStageIndex
                )}
                onClick={() => {
                  setSelectedStageIndex(index);
                  setEditMode(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStageIcon(stage.status)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        Step {index + 1}:{" "}
                        {stage.stage_name
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                        {/* Embroidery/Printing indicators */}
                        {stage.is_embroidery && (
                          <span
                            className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full"
                            title="Embroidery Stage"
                          >
                            🧵
                          </span>
                        )}
                        {stage.is_printing && (
                          <span
                            className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full"
                            title="Printing Stage"
                          >
                            🖨️
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={getStatusBadgeClass(stage.status)}>
                          {stage.status
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </div>
                        {/* Outsourcing indicator */}
                        {stage.outsourced === true && (
                          <span
                            className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1"
                            title="Outsourced to Vendor"
                          >
                            <Building2 className="w-3 h-3" />
                            Outsourced
                          </span>
                        )}
                        {stage.outsourced === false &&
                          isOutsourcingStage(stage) && (
                            <span
                              className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1"
                              title="In-House Production"
                            >
                              <Home className="w-3 h-3" />
                              In-House
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Stage Details */}
        <div className="flex-1 p-6 h-[calc(100vh-180px)] overflow-y-auto">
          {currentStage && (
            <div className="bg-white rounded shadow-sm border border-gray-200 p-6">
              {/* Stage Title and Actions */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentStage.stage_name
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </h2>
                  <span className={getStatusBadgeClass(currentStage.status)}>
                    {currentStage.status
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
                {editMode ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveChanges}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {/* Stage Customization Info */}
              {(currentStage.is_embroidery ||
                currentStage.is_printing ||
                currentStage.outsourced !== undefined) && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    Stage Customization Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentStage.is_embroidery && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full font-medium flex items-center gap-1">
                          🧵 Embroidery Stage
                        </span>
                      </div>
                    )}
                    {currentStage.is_printing && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-full font-medium flex items-center gap-1">
                          🖨️ Printing Stage
                        </span>
                      </div>
                    )}
                    {currentStage.outsourced === true && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full font-medium flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          Outsourced
                          {currentStage.vendor_id &&
                            ` (Vendor #${currentStage.vendor_id})`}
                        </span>
                      </div>
                    )}
                    {currentStage.outsourced === false &&
                      isOutsourcingStage(currentStage) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            In-House Production
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Stage Information */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Start Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  {editMode ? (
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {formData.start_date || "Not started"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  {editMode ? (
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {formData.start_time || "Not started"}
                    </p>
                  )}
                </div>

                {/* End Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  {editMode ? (
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {formData.end_date || "Not completed"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  {editMode ? (
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {formData.end_time || "Not completed"}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <p className="text-gray-900">
                    {calculateDuration(
                      formData.start_date && formData.start_time
                        ? `${formData.start_date}T${formData.start_time}`
                        : null,
                      formData.end_date && formData.end_time
                        ? `${formData.end_date}T${formData.end_time}`
                        : null
                    )}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                {editMode ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                    placeholder="Add notes about this stage..."
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {formData.notes || "No notes added"}
                  </p>
                )}
              </div>

              {/* Outsourcing Options (for specific stages) */}
              {isOutsourcingStage(currentStage) && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    Outsourcing Options
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => {
                        setWorkType("in_house");
                        toast.success("Set to In-House Production");
                      }}
                      className={`p-4 rounded border-2 transition-all ${
                        workType === "in_house"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <Home className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="font-medium text-center">In-House</p>
                    </button>

                    <button
                      onClick={() => {
                        setWorkType("outsourced");
                        toast.success("Set to Outsourced");
                      }}
                      className={`p-4 rounded border-2 transition-all ${
                        workType === "outsourced"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-300 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <Building2 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="font-medium text-center">Outsourced</p>
                    </button>
                  </div>

                  {workType === "outsourced" && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setOutwardChallanDialog(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        <Send className="w-5 h-5" />
                        Create Outward Challan
                      </button>

                      <button
                        onClick={() => setInwardChallanDialog(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        <Download className="w-5 h-5" />
                        Create Inward Challan
                      </button>

                      {/* Display existing challans */}
                      {challans.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Challans
                          </h4>
                          <div className="space-y-2">
                            {challans.map((challan) => (
                              <div
                                key={challan.id}
                                className="p-3 bg-white border border-gray-200 rounded"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {challan.challan_number}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {challan.type === "outward"
                                        ? "Outward"
                                        : "Inward"}{" "}
                                      - {challan.status}
                                    </p>
                                  </div>
                                  <FileText className="w-5 h-5 text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Material Reconciliation (for last stage) */}
              {isLastStage() && currentStage.status === "in_progress" && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-amber-600" />
                    Material Reconciliation
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This is the final stage. Calculate material usage and return
                    any leftover materials to inventory.
                  </p>
                  <button
                    onClick={openMaterialReconciliation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded hover:bg-amber-700"
                  >
                    <Package className="w-5 h-5" />
                    Open Material Reconciliation
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={handlePreviousStage}
                  disabled={selectedStageIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous Stage
                </button>

                <div className="flex gap-2">
                  {currentStage.status === "pending" && (
                    <button
                      onClick={handleStartStage}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      <Play className="w-4 h-4" />
                      Start Stage
                    </button>
                  )}

                  {currentStage.status === "in_progress" && (
                    <>
                      <button
                        onClick={handlePauseStage}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                      <button
                        onClick={handleCompleteStage}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete Stage
                      </button>
                    </>
                  )}

                  {currentStage.status === "on_hold" && (
                    <button
                      onClick={handleStartStage}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      <Play className="w-4 h-4" />
                      Resume Stage
                    </button>
                  )}
                </div>

                <button
                  onClick={handleNextStage}
                  disabled={selectedStageIndex === stages.length - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Stage
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Ready for Shipment Button - Shows when all stages are complete */}
              {productionOrder?.status === "completed" &&
                overallProgress === 100 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Production Complete! 🎉
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          All production stages have been completed. The order
                          is ready for shipment.
                        </p>
                      </div>
                      <button
                        onClick={() => setReadyForShipmentDialog(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg font-semibold"
                      >
                        <Truck className="w-5 h-5" />
                        Mark as Ready for Shipment
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Material Reconciliation Dialog */}
      {reconciliationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Material Reconciliation
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Review material usage and specify any leftover quantities to
                return to inventory
              </p>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Material
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Allocated
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Consumed
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Wasted
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Leftover
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reconciliationData.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {item.allocated}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={item.actual_consumed}
                            onChange={(e) =>
                              updateReconciliationItem(
                                index,
                                "actual_consumed",
                                e.target.value
                              )
                            }
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={item.actual_wasted}
                            onChange={(e) =>
                              updateReconciliationItem(
                                index,
                                "actual_wasted",
                                e.target.value
                              )
                            }
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-bold ${
                              item.leftover_quantity > 0
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          >
                            {item.leftover_quantity.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Leftover materials will be
                  automatically returned to inventory after submission.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setReconciliationDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReconciliationSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Complete Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outward Challan Dialog */}
      {outwardChallanDialog && (
        <OutwardChallanDialog
          onClose={() => setOutwardChallanDialog(false)}
          onSubmit={handleCreateOutwardChallan}
          vendors={vendors}
          productionOrder={productionOrder}
        />
      )}

      {/* Inward Challan Dialog */}
      {inwardChallanDialog && (
        <InwardChallanDialog
          onClose={() => setInwardChallanDialog(false)}
          onSubmit={handleCreateInwardChallan}
          challans={challans.filter(
            (c) => c.type === "outward" && c.status === "pending"
          )}
        />
      )}

      {/* Ready for Shipment Dialog */}
      <ReadyForShipmentDialog
        open={readyForShipmentDialog}
        onClose={() => setReadyForShipmentDialog(false)}
        productionOrder={productionOrder}
        onSuccess={(data) => {
          toast.success("Order marked ready for shipment!");
          // Navigate to shipment management page
          navigate("/manufacturing/shipments");
        }}
      />
    </div>
  );
};

// Outward Challan Dialog Component
const OutwardChallanDialog = ({
  onClose,
  onSubmit,
  vendors,
  productionOrder,
}) => {
  const [formData, setFormData] = useState({
    vendor_id: "",
    quantity: productionOrder?.quantity || 0,
    expected_date: "",
    notes: "",
    transport_mode: "",
    vehicle_number: "",
  });

  const handleSubmit = () => {
    if (!formData.vendor_id) {
      toast.error("Please select a vendor");
      return;
    }

    const items = [
      {
        product_name: productionOrder.product?.name || "Production Item",
        quantity: formData.quantity,
        rate: 0,
        description: formData.notes,
      },
    ];

    const transportDetails = {
      mode: formData.transport_mode,
      vehicle_number: formData.vehicle_number,
    };

    onSubmit(
      formData.vendor_id,
      items,
      formData.expected_date,
      formData.notes,
      transportDetails
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Create Outward Challan
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Send materials to vendor for outsourced work
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor *
            </label>
            <select
              value={formData.vendor_id}
              onChange={(e) =>
                setFormData({ ...formData, vendor_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            >
              <option value="">Select Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.company_name || vendor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Return Date
            </label>
            <input
              type="date"
              value={formData.expected_date}
              onChange={(e) =>
                setFormData({ ...formData, expected_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transport Mode
            </label>
            <input
              type="text"
              value={formData.transport_mode}
              onChange={(e) =>
                setFormData({ ...formData, transport_mode: e.target.value })
              }
              placeholder="e.g., Truck, Courier"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Number
            </label>
            <input
              type="text"
              value={formData.vehicle_number}
              onChange={(e) =>
                setFormData({ ...formData, vehicle_number: e.target.value })
              }
              placeholder="e.g., MH01AB1234"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="Special instructions for vendor..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Create Outward Challan
          </button>
        </div>
      </div>
    </div>
  );
};

// Inward Challan Dialog Component
const InwardChallanDialog = ({ onClose, onSubmit, challans }) => {
  const [formData, setFormData] = useState({
    outward_challan_id: "",
    received_quantity: 0,
    quality_notes: "",
    discrepancies: "",
  });

  const handleSubmit = () => {
    if (!formData.outward_challan_id) {
      toast.error("Please select an outward challan");
      return;
    }

    const selectedChallan = challans.find(
      (c) => c.id === parseInt(formData.outward_challan_id)
    );
    const items = selectedChallan?.items || [];

    onSubmit(
      formData.outward_challan_id,
      items,
      formData.received_quantity,
      formData.quality_notes,
      formData.discrepancies
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Create Inward Challan
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Receive completed work from vendor
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Outward Challan *
            </label>
            <select
              value={formData.outward_challan_id}
              onChange={(e) =>
                setFormData({ ...formData, outward_challan_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            >
              <option value="">Select Outward Challan</option>
              {challans.map((challan) => (
                <option key={challan.id} value={challan.id}>
                  {challan.challan_number} - {challan.vendor?.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Received Quantity
            </label>
            <input
              type="number"
              value={formData.received_quantity}
              onChange={(e) =>
                setFormData({ ...formData, received_quantity: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Notes
            </label>
            <textarea
              value={formData.quality_notes}
              onChange={(e) =>
                setFormData({ ...formData, quality_notes: e.target.value })
              }
              rows={3}
              placeholder="Quality inspection notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discrepancies (if any)
            </label>
            <textarea
              value={formData.discrepancies}
              onChange={(e) =>
                setFormData({ ...formData, discrepancies: e.target.value })
              }
              rows={3}
              placeholder="Any discrepancies or issues..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Inward Challan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionOperationsViewPage;
