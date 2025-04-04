import React, { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Button } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface FileUploadState {
  file: File | null;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

const DataImport: React.FC = () => {
  const [pitScouting, setPitScouting] = useState<FileUploadState>({ file: null, status: 'idle' });
  const [scoutingData, setScoutingData] = useState<FileUploadState>({ file: null, status: 'idle' });
  const [scoutingDataPre, setScoutingDataPre] = useState<FileUploadState>({ file: null, status: 'idle' });
  const [existingFiles, setExistingFiles] = useState<Record<string, boolean>>({});

  // Check for existing files on component mount
  useEffect(() => {
    const checkExistingFiles = () => {
      const files: Record<string, boolean> = {
        'pitScoutingData.json': false,
        'scoutingData.json': false,
        'scoutingDataPre.json': false
      };
      
      // Check localStorage
      Object.keys(files).forEach(fileName => {
        if (localStorage.getItem(fileName)) {
          files[fileName] = true;
        }
      });
      
      setExistingFiles(files);
    };
    
    checkExistingFiles();
  }, []);

  const saveJsonToFile = async (data: any, fileName: string) => {
    try {
      // Save to localStorage for persistence
      localStorage.setItem(fileName, JSON.stringify(data));
      
      // Create a downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, fileName);
      
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  };

  const convertExcelToJson = async (file: File, type: 'pit' | 'scouting' | 'pre') => {
    try {
      // Read the file as an ArrayBuffer
      const data = await file.arrayBuffer();
      
      // Parse the Excel file
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get the first worksheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Convert to the appropriate format based on type
      let formattedData;
      switch (type) {
        case 'pit':
          formattedData = jsonData.map((row: any) => ({
            teamNumber: row.teamNumber || row.TeamNumber || row['Team Number'] || '',
            // Add other pit scouting fields as needed
          }));
          break;
        case 'scouting':
          formattedData = jsonData.map((row: any) => ({
            matchNumber: row.matchNumber || row.MatchNumber || row['Match Number'] || '',
            teamNumber: row.teamNumber || row.TeamNumber || row['Team Number'] || '',
            // Add other scouting fields as needed
          }));
          break;
        case 'pre':
          formattedData = jsonData.map((row: any) => ({
            matchNumber: row.matchNumber || row.MatchNumber || row['Match Number'] || '',
            teamNumber: row.teamNumber || row.TeamNumber || row['Team Number'] || '',
            // Add other pre-scouting fields as needed
          }));
          break;
        default:
          throw new Error('Invalid file type');
      }

      // Save the JSON file
      const fileName = type === 'pit' ? 'pitScoutingData.json' : 
                      type === 'scouting' ? 'scoutingData.json' : 
                      'scoutingDataPre.json';
      
      const saved = await saveJsonToFile(formattedData, fileName);
      
      if (!saved) {
        throw new Error('Failed to save file');
      }

      return true;
    } catch (error) {
      console.error('Error converting file:', error);
      return false;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[], type: 'pit' | 'scouting' | 'pre') => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const setState = type === 'pit' ? setPitScouting : 
                    type === 'scouting' ? setScoutingData : 
                    setScoutingDataPre;

    setState({ file, status: 'uploading' });

    try {
      const success = await convertExcelToJson(file, type);
      
      if (success) {
        setState({ file, status: 'success' });
        
        // Update existingFiles state
        const fileName = type === 'pit' ? 'pitScoutingData.json' : 
                        type === 'scouting' ? 'scoutingData.json' : 
                        'scoutingDataPre.json';
        
        setExistingFiles(prev => ({
          ...prev,
          [fileName]: true
        }));
      } else {
        setState({ file, status: 'error', error: 'Failed to convert file' });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setState({ file, status: 'error', error: 'An unexpected error occurred' });
    }
  }, []);

  const { getRootProps: getPitRootProps, getInputProps: getPitInputProps } = useDropzone({
    onDrop: (files: File[]) => onDrop(files, 'pit'),
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: false
  });

  const { getRootProps: getScoutingRootProps, getInputProps: getScoutingInputProps } = useDropzone({
    onDrop: (files: File[]) => onDrop(files, 'scouting'),
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: false
  });

  const { getRootProps: getPreRootProps, getInputProps: getPreInputProps } = useDropzone({
    onDrop: (files: File[]) => onDrop(files, 'pre'),
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: false
  });

  const UploadArea: React.FC<{
    title: string;
    getRootProps: any;
    getInputProps: any;
    state: FileUploadState;
    fileName: string;
  }> = ({ title, getRootProps, getInputProps, state, fileName }) => (
    <Paper
      {...getRootProps()}
      sx={{
        p: 3,
        mb: 2,
        border: '2px dashed',
        borderColor: state.status === 'success' ? 'success.main' : 
                    state.status === 'error' ? 'error.main' : 
                    existingFiles[fileName] ? 'info.main' : 'grey.300',
        cursor: 'pointer',
        '&:hover': {
          borderColor: 'primary.main',
        },
        transition: 'all 0.3s ease',
      }}
    >
      <input {...getInputProps()} />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {title}
          {existingFiles[fileName] && state.status === 'idle' && (
            <Typography component="span" variant="caption" color="info.main" sx={{ ml: 1 }}>
              (File exists)
            </Typography>
          )}
        </Typography>
        
        {state.status === 'uploading' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography>Converting file...</Typography>
          </Box>
        )}
        
        {state.status === 'success' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Alert severity="success" sx={{ width: '100%' }}>
              File uploaded and converted successfully!
            </Alert>
            {state.file && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                File: {state.file.name}
              </Typography>
            )}
          </Box>
        )}
        
        {state.status === 'error' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            <ErrorIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Alert severity="error" sx={{ width: '100%' }}>
              {state.error || 'Failed to process file'}
            </Alert>
          </Box>
        )}
        
        {state.status === 'idle' && existingFiles[fileName] && (
          <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
            Click to replace existing file
          </Typography>
        )}
        
        {state.status === 'idle' && !existingFiles[fileName] && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography color="textSecondary">
              Drag and drop an Excel file here, or click to select
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              Only .xlsx files are accepted
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Data Import
      </Typography>
      
      <UploadArea
        title="Pit Scouting Data "
        getRootProps={getPitRootProps}
        getInputProps={getPitInputProps}
        state={pitScouting}
        fileName="pitScoutingData.json"
      />

      <UploadArea
        title="Scouting Data"
        getRootProps={getScoutingRootProps}
        getInputProps={getScoutingInputProps}
        state={scoutingData}
        fileName="scoutingData.json"
      />

      <UploadArea
        title="Pre-Scouting Data"
        getRootProps={getPreRootProps}
        getInputProps={getPreInputProps}
        state={scoutingDataPre}
        fileName="scoutingDataPre.json"
      />
    </Box>
  );
};

export default DataImport; 