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
  
  const pitScoutingInputRef = useRef<HTMLInputElement>(null);
  const scoutingDataInputRef = useRef<HTMLInputElement>(null);
  const scoutingDataPreInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const checkExistingFiles = () => {
      const files: Record<string, boolean> = {
        'pit-scouting-data.json': false,
        'scouting-data.json': false,
        'scouting-data-pre.json': false
      };
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
      localStorage.setItem(fileName, JSON.stringify(data));
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
      console.log('Starting CSV conversion...');
      
      const text = await file.text();
      console.log('File read successfully');
      const lines = text.split('\n').filter(line => line.trim() !== '');
      console.log('Number of lines:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }
      const headers = lines[0].split(',').map(header => header.trim());
      console.log('Headers found:', headers);
      const requiredHeaders = [
        'Scouter', 'Event', 'Match-Level', 'Match-Number', 'Team-Number',
        'Auton-Position', 'Auton-Leave-Start', 'Auton-Coral-L4', 'Auton-Coral-L3',
        'Auton-Coral-L2', 'Auton-Coral-L1', 'Algae-Removed- from-Reef',
        'Auton-Algae-Processor', 'Auton-Algae-Net', 'Teleop-Coral-L4',
        'Teleop-Coral-L3', 'Teleop-Coral-L2', 'Teleop-Coral-L1',
        'TeleOp-Removed- from-Reef', 'Teleop-Algae-Processor', 'Teleop-Algae-Net',
        'Defense-Played-on-Robot', 'Climb Score', 'Driver Skill', 'Defense Rating',
        'Died', 'Tippy', 'Comments'
      ];

      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        console.error('Missing headers:', missingHeaders);
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }
      const matches = lines.slice(1).map((line, index) => {
        try {
          const row: string[] = [];
          let currentField = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              row.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          row.push(currentField.trim());
          const match: Record<string, any> = {};
          headers.forEach((header, index) => {
            let value = row[index] || '';
            value = value.replace(/^["']|["']$/g, '').trim();
            const numericFields = [
              'Auton-Leave-Start', 'Auton-Coral-L4', 'Auton-Coral-L3', 'Auton-Coral-L2',
              'Auton-Coral-L1', 'Algae-Removed- from-Reef', 'Auton-Algae-Processor',
              'Auton-Algae-Net', 'Teleop-Coral-L4', 'Teleop-Coral-L3', 'Teleop-Coral-L2',
              'Teleop-Coral-L1', 'TeleOp-Removed- from-Reef', 'Teleop-Algae-Processor',
              'Teleop-Algae-Net', 'Defense-Played-on-Robot', 'Climb Score', 'Driver Skill',
              'Defense Rating', 'Died', 'Tippy'
            ];

            if (numericFields.includes(header)) {
              match[header] = value === '' ? '0' : parseFloat(value).toString();
            } else {
              match[header] = value;
            }
          });
          const teamNumber = parseInt(match['Team-Number']);
          if (isNaN(teamNumber) || teamNumber < 1 || teamNumber > 99999) {
            console.error('Invalid team number in row:', index + 2, 'Value:', match['Team-Number']);
            throw new Error(`Invalid team number in row ${index + 2}: ${match['Team-Number']}`);
          }

          return match;
        } catch (error) {
          console.error(`Error processing row ${index + 2}:`, error);
          throw error;
        }
      });

      console.log('Successfully processed matches:', matches.length);

      const formattedData = {
        matches: matches
      };

      const fileName = type === 'pit' ? 'pit-scouting-data.json' : 
                      type === 'scouting' ? 'scouting-data.json' : 
                      'scouting-data-pre.json';
      
      console.log('Saving data to file:', fileName);
      const saved = await saveJsonToFile(formattedData, fileName);
      
      if (!saved) {
        throw new Error('Failed to save file');
      }

      console.log('File saved successfully');
      return true;
    } catch (error) {
      console.error('Error in convertCsvToJson:', error);
      throw error;
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
      setState({ 
        file, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    }
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
      <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 8 }}>
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