'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Button } from '@mui/material';
import * as XLSX from 'xlsx';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import fs from 'fs';
import path from 'path';

interface FileUploadState {
  file: File | null;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function DataImport() {
  const [pitScouting, setPitScouting] = useState<FileUploadState>({ file: null, status: 'idle' });
  const [scoutingData, setScoutingData] = useState<FileUploadState>({ file: null, status: 'idle' });
  const [scoutingDataPre, setScoutingDataPre] = useState<FileUploadState>({ file: null, status: 'idle' });
  const [existingFiles, setExistingFiles] = useState<Record<string, boolean>>({});
  
  // File input refs
  const pitScoutingInputRef = useRef<HTMLInputElement>(null);
  const scoutingDataInputRef = useRef<HTMLInputElement>(null);
  const scoutingDataPreInputRef = useRef<HTMLInputElement>(null);

  // Check for existing files on component mount
  useEffect(() => {
    const checkExistingFiles = () => {
      const files: Record<string, boolean> = {
        'pit-scouting-data.json': false,
        'scouting-data.json': false,
        'scouting-data-pre.json': false
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
      
      // Save to the data folder using the API
      const response = await fetch('/api/save-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName, data }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save file');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  };

  const convertCsvToJson = async (file: File, type: 'pit' | 'scouting' | 'pre') => {
    try {
      // Read the file as text
      const text = await file.text();
      
      // Parse CSV
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      
      if (rows.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }
      
      // Extract headers from the first row
      const headers = rows[0];
      
      // Convert the rest of the rows to objects using the headers as keys
      const matches = rows.slice(1).map(row => {
        const rowData: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          // Handle empty or undefined values
          const value = row[index] !== undefined ? row[index] : '';
          rowData[header] = value;
        });
        
        return rowData;
      });

      // Create the proper structure with a 'matches' array
      const formattedData = {
        matches: matches
      };

      // Save the JSON file with the correct naming convention
      const fileName = type === 'pit' ? 'pit-scouting-data.json' : 
                      type === 'scouting' ? 'scouting-data.json' : 
                      'scouting-data-pre.json';
      
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pit' | 'scouting' | 'pre') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const setState = type === 'pit' ? setPitScouting : 
                    type === 'scouting' ? setScoutingData : 
                    setScoutingDataPre;

    setState({ file, status: 'uploading' });

    try {
      const success = await convertCsvToJson(file, type);
      
      if (success) {
        setState({ file, status: 'success' });
        
        // Update existingFiles state
        const fileName = type === 'pit' ? 'pit-scouting-data.json' : 
                        type === 'scouting' ? 'scouting-data.json' : 
                        'scouting-data-pre.json';
        
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
    
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleButtonClick = (type: 'pit' | 'scouting' | 'pre') => {
    const inputRef = type === 'pit' ? pitScoutingInputRef : 
                    type === 'scouting' ? scoutingDataInputRef : 
                    scoutingDataPreInputRef;
    
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const UploadArea: React.FC<{
    title: string;
    state: FileUploadState;
    fileName: string;
    inputRef: React.RefObject<HTMLInputElement>;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onButtonClick: () => void;
  }> = ({ title, state, fileName, inputRef, onFileChange, onButtonClick }) => (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid',
        borderColor: state.status === 'success' ? 'success.main' : 
                    state.status === 'error' ? 'error.main' : 
                    existingFiles[fileName] ? 'info.main' : 'rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <input 
        type="file" 
        ref={inputRef}
        onChange={onFileChange}
        accept=".csv"
        style={{ display: 'none' }}
      />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 500 }}>
          {title}
          {existingFiles[fileName] && state.status === 'idle' && (
            <Typography component="span" variant="caption" color="info.main" sx={{ ml: 1 }}>
              (File exists)
            </Typography>
          )}
        </Typography>
        
        {state.status === 'uploading' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
            <CircularProgress size={40} sx={{ mb: 2, color: 'primary.main' }} />
            <Typography sx={{ color: 'white' }}>Converting file...</Typography>
          </Box>
        )}
        
        {state.status === 'success' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              File uploaded and converted successfully!
            </Alert>
            {state.file && (
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                File: {state.file.name}
              </Typography>
            )}
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<FolderOpenIcon />}
              onClick={onButtonClick}
              sx={{ mt: 2 }}
            >
              Upload New File
            </Button>
          </Box>
        )}
        
        {state.status === 'error' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
            <ErrorIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {state.error || 'Failed to process file'}
            </Alert>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<FolderOpenIcon />}
              onClick={onButtonClick}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Box>
        )}
        
        {state.status === 'idle' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
            <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography sx={{ color: 'white', mb: 2 }}>
              {existingFiles[fileName] ? 'Replace existing file' : 'Upload a CSV file'}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<FolderOpenIcon />}
              onClick={onButtonClick}
              sx={{ 
                py: 1.5, 
                px: 3, 
                borderRadius: '8px',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)',
                }
              }}
            >
              Select File
            </Button>
            <Typography variant="caption" sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.5)' }}>
              Only .csv files are accepted
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ p: 6, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 4 }}>
        Data Import
      </Typography>
      
      <UploadArea
        title="Pit Scouting Data"
        state={pitScouting}
        fileName="pit-scouting-data.json"
        inputRef={pitScoutingInputRef}
        onFileChange={(e) => handleFileChange(e, 'pit')}
        onButtonClick={() => handleButtonClick('pit')}
      />

      <UploadArea
        title="Scouting Data"
        state={scoutingData}
        fileName="scouting-data.json"
        inputRef={scoutingDataInputRef}
        onFileChange={(e) => handleFileChange(e, 'scouting')}
        onButtonClick={() => handleButtonClick('scouting')}
      />

      <UploadArea
        title="Pre-Scouting Data"
        state={scoutingDataPre}
        fileName="scouting-data-pre.json"
        inputRef={scoutingDataPreInputRef}
        onFileChange={(e) => handleFileChange(e, 'pre')}
        onButtonClick={() => handleButtonClick('pre')}
      />
    </Box>
  );
} 