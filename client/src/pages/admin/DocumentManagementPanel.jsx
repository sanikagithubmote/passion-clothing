/**
 * ADMIN PANEL - DOCUMENT MANAGEMENT
 * Complete ERP Automation Workflow Dashboard
 * View all documents, timelines, and download PDFs
 */

import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Dashboard as DashboardIcon,
  GetApp as GetAppIcon,
} from "@mui/icons-material";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

function DocumentManagementPanel() {
  const [activeTab, setActiveTab] = useState(0);
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [documentFilter, setDocumentFilter] = useState("all");

  // Load sales orders with documents
  useEffect(() => {
    loadSalesOrdersWithDocs();
    loadStatistics();
  }, []);

  const loadSalesOrdersWithDocs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/documents/admin/sales-orders-with-docs");
      setSalesOrders(response.data.salesOrders);
    } catch (error) {
      console.error("Error loading sales orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get("/documents/admin/statistics");
      setStats(response.data);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const loadOrderDocuments = async (orderId) => {
    try {
      setLoading(true);
      const response = await api.get(`/documents/timeline/${orderId}`);
      setDocuments(response.data.documents);
      setSelectedOrder(salesOrders.find((o) => o.id === orderId));
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (docId, fileName) => {
    window.location.href = `http://localhost:5000/api/documents/${docId}/download`;
  };

  const handlePreview = (docId) => {
    window.open(
      `http://localhost:5000/api/documents/${docId}/preview`,
      "_blank"
    );
  };

  const getDocumentIcon = (type) => {
    const icons = {
      invoice: "💰",
      certificate: "📜",
      specification: "📋",
      design: "🎨",
      proforma: "📄",
      quotation: "💬",
    };
    return icons[type] || "📎";
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: "default",
      Confirmed: "info",
      "Sent to Procurement": "warning",
      "In Production": "secondary",
      "Ready for Shipment": "primary",
      Dispatched: "info",
      "In Transit": "warning",
      Delivered: "success",
    };
    return colors[status] || "default";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // TAB 0: DASHBOARD STATISTICS
  const renderDashboard = () => (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Sales Orders
            </Typography>
            <Typography variant="h4" sx={{ color: "#1976d2" }}>
              {salesOrders.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Documents Generated
            </Typography>
            <Typography variant="h4" sx={{ color: "#388e3c" }}>
              {stats?.totalDocuments || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Complete Workflows
            </Typography>
            <Typography variant="h4" sx={{ color: "#7cb342" }}>
              {salesOrders.filter((o) => o.completionPercentage === 100).length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Generated Today
            </Typography>
            <Typography variant="h4" sx={{ color: "#f57c00" }}>
              {stats?.generatedToday || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Document Types Chart */}
      {stats?.documentsByType && (
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Documents by Type
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(stats.documentsByType).map(([type, count]) => (
                  <Box key={type} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">{type}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        (count / (stats.totalDocuments / 10)) * 100,
                        100
                      )}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Workflow Completion */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔄 Workflow Completion Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    Fully Completed (100%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {
                      salesOrders.filter((o) => o.completionPercentage === 100)
                        .length
                    }
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    (salesOrders.filter((o) => o.completionPercentage === 100)
                      .length /
                      salesOrders.length) *
                      100 || 0
                  }
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#e0e0e0",
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    Partially Completed (50-99%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {
                      salesOrders.filter(
                        (o) =>
                          o.completionPercentage > 50 &&
                          o.completionPercentage < 100
                      ).length
                    }
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    (salesOrders.filter(
                      (o) =>
                        o.completionPercentage > 50 &&
                        o.completionPercentage < 100
                    ).length /
                      salesOrders.length) *
                      100 || 0
                  }
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#e0e0e0",
                  }}
                />
              </Box>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">In Progress (0-49%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {
                      salesOrders.filter((o) => o.completionPercentage <= 50)
                        .length
                    }
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    (salesOrders.filter((o) => o.completionPercentage <= 50)
                      .length /
                      salesOrders.length) *
                      100 || 0
                  }
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#e0e0e0",
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // TAB 1: SALES ORDERS LIST
  const renderSalesOrders = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Order #</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Documents</TableCell>
            <TableCell>Completion %</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {salesOrders
            .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
            .map((order) => (
              <TableRow key={order.id} hover>
                <TableCell sx={{ fontWeight: "bold" }}>
                  {order.orderNumber}
                </TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>${order.finalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {order.documentCount > 0 && (
                      <>
                        <span style={{ fontSize: "18px" }}>📄</span>
                        <span sx={{ fontWeight: "bold" }}>
                          {order.documentCount}
                        </span>
                      </>
                    )}
                    {order.documentCount === 0 && (
                      <span style={{ color: "#999" }}>-</span>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={order.completionPercentage}
                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: "bold", minWidth: "30px" }}
                    >
                      {order.completionPercentage}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title="View Documents Timeline">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        loadOrderDocuments(order.id);
                        setActiveTab(2);
                      }}
                    >
                      <TimelineIcon sx={{ fontSize: "16px" }} />
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={salesOrders.length}
        rowsPerPage={pageSize}
        page={currentPage}
        onPageChange={(e, newPage) => setCurrentPage(newPage)}
        onRowsPerPageChange={(e) => setPageSize(parseInt(e.target.value, 10))}
      />
    </TableContainer>
  );

  // TAB 2: DOCUMENT TIMELINE
  const renderTimeline = () => (
    <>
      {selectedOrder ? (
        <Box>
          <Card sx={{ mb: 3, backgroundColor: "#f0f7ff" }}>
            <CardContent>
              <Typography variant="h6">
                📋 Document Timeline for Order:{" "}
                <strong>{selectedOrder.orderNumber}</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Customer: {selectedOrder.customerName} | Amount: $
                {selectedOrder.finalAmount.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : documents.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>File Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Generated Date/Time
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} hover>
                      <TableCell>
                        <span style={{ fontSize: "20px" }}>
                          {getDocumentIcon(doc.documentType)}
                        </span>
                      </TableCell>
                      <TableCell sx={{ fontSize: "12px" }}>
                        {doc.fileName}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doc.documentCategory}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: "12px" }}>
                        <Box>
                          <div>{formatDate(doc.uploadedAt)}</div>
                          <div style={{ color: "#999", fontSize: "11px" }}>
                            {formatTime(doc.uploadedAt)}
                          </div>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={doc.status} size="small" color="success" />
                      </TableCell>
                      <TableCell sx={{ fontSize: "12px" }}>
                        {doc.fileSize}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Preview PDF">
                          <IconButton
                            size="small"
                            onClick={() => handlePreview(doc.id)}
                          >
                            <PreviewIcon sx={{ fontSize: "18px" }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(doc.id, doc.fileName)}
                          >
                            <DownloadIcon sx={{ fontSize: "18px" }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No documents found for this order yet.
            </Alert>
          )}

          <Button
            variant="outlined"
            sx={{ mt: 3 }}
            onClick={() => {
              setSelectedOrder(null);
              setDocuments([]);
              setActiveTab(1);
            }}
          >
            ← Back to Orders
          </Button>
        </Box>
      ) : (
        <Alert severity="warning">
          Please select a sales order from the "Sales Orders" tab to view its
          document timeline.
        </Alert>
      )}
    </>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
        <DashboardIcon sx={{ fontSize: 40, mr: 2, color: "#1976d2" }} />
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          📦 ERP AUTOMATION - DOCUMENT MANAGEMENT PANEL
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: "1px solid #e0e0e0",
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 500,
            },
          }}
        >
          <Tab label="📊 Dashboard & Statistics" />
          <Tab label="📋 All Sales Orders" />
          <Tab label="⏱️ Document Timeline" />
        </Tabs>

        <CardContent>
          {loading && activeTab !== 2 ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && renderDashboard()}
              {activeTab === 1 && renderSalesOrders()}
              {activeTab === 2 && renderTimeline()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card sx={{ backgroundColor: "#f0f7ff", border: "1px solid #1976d2" }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: "#1976d2" }}>
            ℹ️ COMPLETE ERP AUTOMATION WORKFLOW
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Phase 1:</strong> Sales Order Confirmed → Auto-generates
            Sales Invoice PDF
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Phase 2:</strong> GRN Completed → Auto-generates GRN PDF
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Phase 3:</strong> Inventory Stock Added → Auto-generates
            Stock Slip PDF
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Phase 4:</strong> Manufacturing Stages Complete →
            Auto-generates Stage Slips (7 PDFs)
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Phase 5:</strong> Shipment Created → Auto-generates Shipment
            Slip PDF
          </Typography>
          <Typography variant="body2">
            <strong>Phase 6:</strong> Delivery Confirmed → Auto-generates
            Delivery Invoice PDF & Notifies Customer
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

export default DocumentManagementPanel;
