import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondary,
  IconButton,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Chip
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import { toast } from 'react-toastify';

import { useDriverStore } from '../../store/driverStore';
import { formatDate } from '../../utils/formatters';

const Documents = () => {
  const { documents, getDriverInfo, addDocument, removeDocument, loading, error } = useDriverStore();
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [documentToView, setDocumentToView] = useState(null);
  
  // Fetch driver info on component mount
  useEffect(() => {
    getDriverInfo();
  }, [getDriverInfo]);
  
  // Handle opening upload dialog
  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };
  
  // Handle closing upload dialog
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDocumentType('');
    setDocumentDescription('');
  };
  
  // Handle opening delete dialog
  const handleOpenDeleteDialog = (document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };
  
  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };
  
  // Handle opening view dialog
  const handleOpenViewDialog = (document) => {
    setDocumentToView(document);
    setViewDialogOpen(true);
  };
  
  // Handle closing view dialog
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setDocumentToView(null);
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Handle document type selection
  const handleDocumentTypeChange = (e) => {
    setDocumentType(e.target.value);
  };
  
  // Handle document description change
  const handleDocumentDescriptionChange = (e) => {
    setDocumentDescription(e.target.value);
  };
  
  // Handle document upload
  const handleUploadDocument = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!documentType) {
      toast.error('Please select a document type');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('type', documentType);
    formData.append('description', documentDescription);
    
    const success = await addDocument(formData);
    if (success) {
      handleCloseUploadDialog();
    }
  };
  
  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (documentToDelete?._id) {
      const success = await removeDocument(documentToDelete._id);
      if (success) {
        handleCloseDeleteDialog();
      }
    }
  };
  
  // Get status chip based on verification status
  const getStatusChip = (status) => {
    switch (status) {
      case 'verified':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Verified"
            size="small"
            color="success"
          />
        );
      case 'pending':
        return (
          <Chip
            icon={<PendingIcon />}
            label="Pending"
            size="small"
            color="warning"
          />
        );
      case 'rejected':
        return (
          <Chip
            icon={<ErrorIcon />}
            label="Rejected"
            size="small"
            color="error"
          />
        );
      default:
        return (
          <Chip
            label="Unknown"
            size="small"
            color="default"
          />
        );
    }
  };
  
  // If loading, show loading spinner
  if (loading && !documents) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Driver Documents
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<FileUploadIcon />}
            onClick={handleOpenUploadDialog}
          >
            Upload Document
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your driver documents and see their verification status
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {documents && documents.length > 0 ? (
          <List>
            {documents.map((document) => (
              <ListItem
                key={document._id}
                disablePadding
                sx={{ 
                  mb: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  p: 2
                }}
                secondaryAction={
                  <Box>
                    <IconButton 
                      edge="end" 
                      aria-label="view"
                      onClick={() => handleOpenViewDialog(document)}
                      sx={{ mr: 1 }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleOpenDeleteDialog(document)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemIcon>
                  <DescriptionIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={document.type}
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {document.description || 'No description'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Uploaded: {formatDate(document.uploadDate)}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {getStatusChip(document.verificationStatus)}
                      </Box>
                      {document.verificationStatus === 'rejected' && document.rejectionReason && (
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                          Reason: {document.rejectionReason}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Documents Uploaded
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                To become a verified driver, please upload required documents
              </Typography>
              <Button
                variant="contained"
                startIcon={<FileUploadIcon />}
                onClick={handleOpenUploadDialog}
              >
                Upload Document
              </Button>
            </CardContent>
          </Card>
        )}
      </Paper>
      
      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog}>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please select a document type and file to upload. Supported file types: PDF, JPG, PNG.
          </DialogContentText>
          
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Document Type"
              value={documentType}
              onChange={handleDocumentTypeChange}
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              <option value="" disabled>Select document type</option>
              <option value="driver_license">Driver's License</option>
              <option value="vehicle_registration">Vehicle Registration</option>
              <option value="insurance">Insurance</option>
              <option value="profile_photo">Profile Photo</option>
              <option value="background_check">Background Check</option>
              <option value="other">Other</option>
            </TextField>
            
            <TextField
              fullWidth
              label="Description (Optional)"
              value={documentDescription}
              onChange={handleDocumentDescriptionChange}
              margin="normal"
            />
            
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mt: 2, mb: 2, py: 1.5 }}
            >
              {selectedFile ? selectedFile.name : 'Select File'}
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button 
            onClick={handleUploadDocument} 
            variant="contained"
            disabled={loading || !selectedFile || !documentType}
          >
            {loading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Document Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this document? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button 
            onClick={handleDeleteDocument} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Document Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {documentToView?.type}
          <IconButton
            aria-label="close"
            onClick={handleCloseViewDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {documentToView?.fileUrl ? (
            documentToView.fileUrl.endsWith('.pdf') ? (
              <iframe
                src={documentToView.fileUrl}
                width="100%"
                height="500px"
                title="Document Viewer"
              />
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={documentToView.fileUrl}
                  alt="Document"
                  style={{ maxWidth: '100%', maxHeight: '500px' }}
                />
              </Box>
            )
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Unable to display document
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Status: {getStatusChip(documentToView?.verificationStatus)}
            </Typography>
            {documentToView?.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Description: {documentToView.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Uploaded: {documentToView ? formatDate(documentToView.uploadDate) : ''}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documents; 