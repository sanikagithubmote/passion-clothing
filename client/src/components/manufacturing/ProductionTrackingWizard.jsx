import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const ProductionTrackingWizard = ({ orderId, onClose, onUpdate }) => {
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

  useEffect(() => {
    fetchProductionOrder();
    fetchVendors();
  }, [orderId]);

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
      const response = await api.get(`/manufacturing/orders/${orderId}`);
      const order = response.data.productionOrder;
      setProductionOrder(order);
      setStages(order.stages || []);
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
      return (
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
    const baseClass =
      "p-4 rounded-lg border-2 mb-3 cursor-pointer transition-all";
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
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start stage");
    }
  };

  const handlePauseStage = async () => {
    try {
      const stage = stages[selectedStageIndex];
      await api.post(`/manufacturing/stages/${stage.id}/pause`);
      toast.success("Stage paused successfully");
      fetchProductionOrder();
      if (onUpdate) onUpdate();
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
      if (onUpdate) onUpdate();
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
      if (onUpdate) onUpdate();
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
      if (onUpdate) onUpdate();
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
        `/manufacturing/orders/${orderId}/materials/reconciliation`
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
      await api.post(`/manufacturing/orders/${orderId}/materials/reconcile`, {
        materials: reconciliationData,
        notes: "Final stage material reconciliation",
      });

      toast.success(
        "Material reconciliation completed! Leftover materials returned to inventory."
      );
      setReconciliationDialog(false);
      fetchProductionOrder();
      if (onUpdate) onUpdate();
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
      if (onUpdate) onUpdate();
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
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to create inward challan");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div
          className="bg-white rounded-lg p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading production order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!productionOrder) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Production order not found</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStage = stages[selectedStageIndex];
  const overallProgress = calculateOverallProgress();

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Container */}
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky Header with Gradient */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-t-lg shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-base font-bold">
                    {productionOrder.production_number}
                  </h1>
                  <p className="text-xs font-medium opacity-90">
                    {productionOrder.product?.name ||
                      productionOrder.productName ||
                      productionOrder.specifications?.product_name ||
                      "Unknown Product"}{" "}
                    - {productionOrder.quantity} units
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-white bg-opacity-20">
                  {overallProgress}% Complete
                </span>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-blue-500 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Summary Bar */}
          <div className="sticky top-9 z-10 bg-gray-50 border-b border-gray-200 px-3 py-2 shadow-sm">
            <div className="grid grid-cols-6 gap-2 text-center">
              <div className="p-1">
                <p className="text-xs text-gray-600">Qty</p>
                <p className="text-sm font-bold text-gray-900">
                  {productionOrder.quantity}
                </p>
              </div>
              <div className="p-1">
                <p className="text-xs text-gray-600">Stages</p>
                <p className="text-sm font-bold text-blue-600">
                  {stages.length}
                </p>
              </div>
              <div className="p-1">
                <p className="text-xs text-gray-600">Completed</p>
                <p className="text-sm font-bold text-green-600">
                  {stages.filter((s) => s.status === "completed").length}
                </p>
              </div>
              <div className="p-1">
                <p className="text-xs text-gray-600">In Progress</p>
                <p className="text-sm font-bold text-blue-600">
                  {stages.filter((s) => s.status === "in_progress").length}
                </p>
              </div>
              <div className="p-1">
                <p className="text-xs text-gray-600">On Hold</p>
                <p className="text-sm font-bold text-yellow-600">
                  {stages.filter((s) => s.status === "on_hold").length}
                </p>
              </div>
              <div className="p-1">
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-sm font-bold text-gray-600">
                  {stages.filter((s) => s.status === "pending").length}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Production Stages */}
            <div className="w-72 bg-gray-50 border-r border-gray-200 p-2.5 overflow-y-auto">
              <h2 className="text-sm font-semibold text-gray-900 mb-2 px-1">
                Production Stages
              </h2>
              <div className="space-y-1">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={`p-2 rounded border-l-4 cursor-pointer transition-all text-xs ${
                      index === selectedStageIndex
                        ? "border-l-red-500 bg-red-50"
                        : stage.status === "completed"
                        ? "border-l-green-400 bg-white hover:bg-green-50"
                        : stage.status === "in_progress"
                        ? "border-l-blue-400 bg-white hover:bg-blue-50"
                        : stage.status === "on_hold"
                        ? "border-l-yellow-400 bg-white hover:bg-yellow-50"
                        : "border-l-gray-300 bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedStageIndex(index);
                      setEditMode(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {getStageIcon(stage.status)}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          Step {index + 1}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {stage.stage_name
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Stage Details */}
            <div className="flex-1 p-2.5 overflow-y-auto">
              {currentStage && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
                  {/* Stage Title and Actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {currentStage.stage_name
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </h2>
                      <span
                        className={`text-xs font-semibold inline-block mt-0.5 px-2 py-0.5 rounded-full ${
                          currentStage.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : currentStage.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : currentStage.status === "on_hold"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {currentStage.status
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </div>
                    {editMode ? (
                      <div className="flex gap-1">
                        <button
                          onClick={handleSaveChanges}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          <Save
                            style={{ fontSize: "10px" }}
                            className="w-3 h-3"
                          />
                          Save
                        </button>
                        <button
                          onClick={() => setEditMode(false)}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                        >
                          <X style={{ fontSize: "10px" }} className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        <Edit
                          style={{ fontSize: "10px" }}
                          className="w-3 h-3"
                        />
                        Edit
                      </button>
                    )}
                  </div>

                  {/* Stage Information - Compact Grid */}
                  <div className="grid grid-cols-4 gap-2 mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                    {/* Start Date & Time */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start
                      </label>
                      {editMode ? (
                        <div className="flex gap-1">
                          <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                start_date: e.target.value,
                              })
                            }
                            className="flex-1 px-1.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-900 font-semibold">
                          {formData.start_date
                            ? new Date(formData.start_date).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )
                            : "—"}
                        </p>
                      )}
                      {editMode && formData.start_date && (
                        <input
                          type="time"
                          value={formData.start_time}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              start_time: e.target.value,
                            })
                          }
                          className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mt-0.5"
                        />
                      )}
                      {!editMode && formData.start_time && (
                        <p className="text-xs text-gray-600">
                          {formData.start_time}
                        </p>
                      )}
                    </div>

                    {/* End Date & Time */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End
                      </label>
                      {editMode ? (
                        <div className="flex gap-1">
                          <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                end_date: e.target.value,
                              })
                            }
                            className="flex-1 px-1.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-900 font-semibold">
                          {formData.end_date
                            ? new Date(formData.end_date).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )
                            : "—"}
                        </p>
                      )}
                      {editMode && formData.end_date && (
                        <input
                          type="time"
                          value={formData.end_time}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              end_time: e.target.value,
                            })
                          }
                          className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mt-0.5"
                        />
                      )}
                      {!editMode && formData.end_time && (
                        <p className="text-xs text-gray-600">
                          {formData.end_time}
                        </p>
                      )}
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Duration
                      </label>
                      <p className="text-xs text-gray-900 font-semibold">
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

                    {/* Notes Preview */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <p
                        className="text-xs text-gray-600 italic truncate"
                        title={formData.notes}
                      >
                        {formData.notes
                          ? formData.notes.substring(0, 40) +
                            (formData.notes.length > 40 ? "..." : "")
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Full Notes Editor */}
                  {editMode && (
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Full Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={2}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Add notes about this stage..."
                      />
                    </div>
                  )}

                  {/* Outsourcing Options (for specific stages) */}
                  {isOutsourcingStage(currentStage) && (
                    <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                        <Building2
                          style={{ fontSize: "12px" }}
                          className="w-3 h-3 text-purple-600"
                        />
                        Outsourcing
                      </h3>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                          onClick={() => {
                            setWorkType("in_house");
                            toast.success("In-House");
                          }}
                          className={`p-1.5 rounded border transition-all text-xs font-semibold ${
                            workType === "in_house"
                              ? "border-green-500 bg-green-100 text-green-700"
                              : "border-gray-300 bg-white text-gray-600 hover:bg-green-50"
                          }`}
                        >
                          <Home
                            style={{ fontSize: "12px" }}
                            className="w-3 h-3 mx-auto mb-0.5"
                          />
                          In-House
                        </button>

                        <button
                          onClick={() => {
                            setWorkType("outsourced");
                            toast.success("Outsourced");
                          }}
                          className={`p-1.5 rounded border transition-all text-xs font-semibold ${
                            workType === "outsourced"
                              ? "border-purple-500 bg-purple-100 text-purple-700"
                              : "border-gray-300 bg-white text-gray-600 hover:bg-purple-50"
                          }`}
                        >
                          <Building2
                            style={{ fontSize: "12px" }}
                            className="w-3 h-3 mx-auto mb-0.5"
                          />
                          Outsourced
                        </button>
                      </div>

                      {workType === "outsourced" && (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setOutwardChallanDialog(true)}
                            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-600 text-white rounded text-xs font-semibold hover:bg-orange-700"
                          >
                            <Send
                              style={{ fontSize: "10px" }}
                              className="w-3 h-3"
                            />
                            Outward
                          </button>

                          <button
                            onClick={() => setInwardChallanDialog(true)}
                            className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                          >
                            <Download
                              style={{ fontSize: "10px" }}
                              className="w-3 h-3"
                            />
                            Inward
                          </button>

                          {/* Display existing challans */}
                          {challans.length > 0 && (
                            <div className="mt-2 p-1.5 bg-white rounded border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-900 mb-1">
                                Challans ({challans.length})
                              </h4>
                              <div className="space-y-1">
                                {challans.map((challan) => (
                                  <div
                                    key={challan.id}
                                    className="p-1 bg-gray-50 rounded border border-gray-200 text-xs"
                                  >
                                    <p className="font-semibold text-gray-900">
                                      {challan.challan_number}
                                    </p>
                                    <p className="text-gray-600">
                                      {challan.type === "outward" ? "↗" : "↙"}{" "}
                                      {challan.status}
                                    </p>
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
                    <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                        <Calculator
                          style={{ fontSize: "12px" }}
                          className="w-3 h-3 text-amber-600"
                        />
                        Material Reconciliation
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">
                        Final stage: Calculate material usage and return
                        leftovers to inventory.
                      </p>
                      <button
                        onClick={openMaterialReconciliation}
                        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700"
                      >
                        <Package
                          style={{ fontSize: "10px" }}
                          className="w-3 h-3"
                        />
                        Open Reconciliation
                      </button>
                    </div>
                  )}

                  {/* Quick Actions - Sticky Footer */}
                  <div className="sticky bottom-0 flex items-center justify-between gap-1.5 pt-2 mt-2 border-t border-gray-200 bg-white rounded-b">
                    <button
                      onClick={handlePreviousStage}
                      disabled={selectedStageIndex === 0}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft
                        style={{ fontSize: "10px" }}
                        className="w-3 h-3"
                      />
                      Prev
                    </button>

                    <div className="flex gap-1">
                      {currentStage.status === "pending" && (
                        <button
                          onClick={handleStartStage}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                        >
                          <Play
                            style={{ fontSize: "10px" }}
                            className="w-3 h-3"
                          />
                          Start
                        </button>
                      )}

                      {currentStage.status === "in_progress" && (
                        <>
                          <button
                            onClick={handlePauseStage}
                            className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded text-xs font-semibold hover:bg-yellow-600"
                          >
                            <Pause
                              style={{ fontSize: "10px" }}
                              className="w-3 h-3"
                            />
                            Pause
                          </button>
                          <button
                            onClick={handleCompleteStage}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                          >
                            <CheckCircle
                              style={{ fontSize: "10px" }}
                              className="w-3 h-3"
                            />
                            Done
                          </button>
                        </>
                      )}

                      {currentStage.status === "on_hold" && (
                        <button
                          onClick={handleStartStage}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
                        >
                          <Play
                            style={{ fontSize: "10px" }}
                            className="w-3 h-3"
                          />
                          Resume
                        </button>
                      )}
                    </div>

                    <button
                      onClick={handleNextStage}
                      disabled={selectedStageIndex === stages.length - 1}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight
                        style={{ fontSize: "10px" }}
                        className="w-3 h-3"
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Material Reconciliation Dialog */}
      {reconciliationDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
          onClick={() => setReconciliationDialog(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[88vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2">
              <h2 className="text-base font-bold">Material Reconciliation</h2>
              <p className="text-xs font-medium opacity-90">
                Review material usage and return leftovers to inventory
              </p>
            </div>

            <div className="p-2.5">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold text-gray-700">
                        Material
                      </th>
                      <th className="px-2 py-1.5 text-center font-semibold text-gray-700">
                        Allocated
                      </th>
                      <th className="px-2 py-1.5 text-center font-semibold text-gray-700">
                        Consumed
                      </th>
                      <th className="px-2 py-1.5 text-center font-semibold text-gray-700">
                        Wasted
                      </th>
                      <th className="px-2 py-1.5 text-center font-semibold text-gray-700">
                        Leftover
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reconciliationData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 font-medium text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-2 py-1.5 text-center text-gray-600">
                          {item.allocated}
                        </td>
                        <td className="px-2 py-1.5 text-center">
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
                            className="w-20 px-1.5 py-0.5 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
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
                            className="w-20 px-1.5 py-0.5 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span
                            className={`font-bold text-xs ${
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

              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <strong>Note:</strong> Leftovers are automatically returned to
                inventory after submission.
              </div>
            </div>

            <div className="sticky bottom-0 z-10 p-2 border-t border-gray-200 bg-white flex justify-end gap-2">
              <button
                onClick={() => setReconciliationDialog(false)}
                className="px-2.5 py-1.5 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleReconciliationSubmit}
                className="px-2.5 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700"
              >
                Complete
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
    </>
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-3 py-2">
          <h2 className="text-base font-bold">Create Outward Challan</h2>
          <p className="text-xs font-medium opacity-90">
            Send materials to vendor for outsourced work
          </p>
        </div>

        <div className="p-2.5 space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Vendor *
            </label>
            <select
              value={formData.vendor_id}
              onChange={(e) =>
                setFormData({ ...formData, vendor_id: e.target.value })
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Select Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.company_name || vendor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Qty
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Return Date
              </label>
              <input
                type="date"
                value={formData.expected_date}
                onChange={(e) =>
                  setFormData({ ...formData, expected_date: e.target.value })
                }
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Transport
              </label>
              <input
                type="text"
                value={formData.transport_mode}
                onChange={(e) =>
                  setFormData({ ...formData, transport_mode: e.target.value })
                }
                placeholder="Truck, Courier..."
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Vehicle #
              </label>
              <input
                type="text"
                value={formData.vehicle_number}
                onChange={(e) =>
                  setFormData({ ...formData, vehicle_number: e.target.value })
                }
                placeholder="e.g., MH01AB1234"
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              placeholder="Special instructions..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="sticky bottom-0 z-10 p-2 border-t border-gray-200 bg-white flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-2.5 py-1.5 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-2.5 py-1.5 bg-orange-600 text-white rounded text-xs font-semibold hover:bg-orange-700"
          >
            Create
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2">
          <h2 className="text-base font-bold">Create Inward Challan</h2>
          <p className="text-xs font-medium opacity-90">
            Receive completed work from vendor
          </p>
        </div>

        <div className="p-2.5 space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Outward Challan *
            </label>
            <select
              value={formData.outward_challan_id}
              onChange={(e) =>
                setFormData({ ...formData, outward_challan_id: e.target.value })
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Received Qty
            </label>
            <input
              type="number"
              value={formData.received_quantity}
              onChange={(e) =>
                setFormData({ ...formData, received_quantity: e.target.value })
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Quality Notes
            </label>
            <textarea
              value={formData.quality_notes}
              onChange={(e) =>
                setFormData({ ...formData, quality_notes: e.target.value })
              }
              rows={2}
              placeholder="Quality inspection notes..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Discrepancies
            </label>
            <textarea
              value={formData.discrepancies}
              onChange={(e) =>
                setFormData({ ...formData, discrepancies: e.target.value })
              }
              rows={2}
              placeholder="Any issues or discrepancies..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="sticky bottom-0 z-10 p-2 border-t border-gray-200 bg-white flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-2.5 py-1.5 bg-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-2.5 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionTrackingWizard;
