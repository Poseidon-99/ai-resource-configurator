'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Client, Worker, Task, ValidationError } from '@/lib/types';

interface FileUploadProps {
  onDataUpload: (type: 'clients' | 'workers' | 'tasks', data: any[]) => void;
  onValidationUpdate: (errors: ValidationError[]) => void;
}

export function FileUpload({ onDataUpload, onValidationUpdate }: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<{
    clients: 'pending' | 'success' | 'error';
    workers: 'pending' | 'success' | 'error';
    tasks: 'pending' | 'success' | 'error';
  }>({
    clients: 'pending',
    workers: 'pending',
    tasks: 'pending'
  });

  const [dragOver, setDragOver] = useState<string | null>(null);

  const validateData = (type: string, data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!data || data.length === 0) {
      errors.push({
        id: `${type}-empty`,
        type: 'error',
        message: `${type} file is empty`,
        entity: type as any
      });
      return errors;
    }

    // Basic validation - check required columns
    const requiredFields: Record<string, string[]> = {
      clients: ['ClientID', 'ClientName', 'PriorityLevel'],
      workers: ['WorkerID', 'WorkerName', 'Skills'],
      tasks: ['TaskID', 'TaskName', 'Duration']
    };

    const fields = requiredFields[type];
    const firstRow = data[0];
    
    fields.forEach(field => {
      if (!(field in firstRow)) {
        errors.push({
          id: `${type}-missing-${field}`,
          type: 'error',
          message: `Missing required column: ${field}`,
          entity: type as any
        });
      }
    });

    // Check for duplicate IDs
    const idField = type === 'clients' ? 'ClientID' : type === 'workers' ? 'WorkerID' : 'TaskID';
    const ids = data.map(row => row[idField]).filter(Boolean);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    if (duplicates.length > 0) {
      errors.push({
        id: `${type}-duplicates`,
        type: 'error',
        message: `Duplicate IDs found: ${duplicates.join(', ')}`,
        entity: type as any
      });
    }

    return errors;
  };

  const processFile = async (file: File, type: 'clients' | 'workers' | 'tasks') => {
    try {
      let data: any[] = [];

      if (file.name.endsWith('.csv')) {
        // Parse CSV
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            data = results.data as any[];
            handleProcessedData(data, type);
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
          }
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
        handleProcessedData(data, type);
      }
    } catch (error) {
      console.error('File processing error:', error);
      setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
    }
  };

  const handleProcessedData = (data: any[], type: 'clients' | 'workers' | 'tasks') => {
    const errors = validateData(type, data);
    
    if (errors.length === 0) {
      setUploadStatus(prev => ({ ...prev, [type]: 'success' }));
      onDataUpload(type, data);
    } else {
      setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
      onValidationUpdate(errors);
    }
  };

  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'clients' | 'workers' | 'tasks') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file, type);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'clients' | 'workers' | 'tasks') => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, type);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Data Files</h2>
        <p className="text-gray-600">Drop your CSV or Excel files below to get started</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { type: 'clients', label: 'Clients Data', icon: '👥' },
          { type: 'workers', label: 'Workers Data', icon: '👷' },
          { type: 'tasks', label: 'Tasks Data', icon: '📋' }
        ].map(({ type, label, icon }) => (
          <div key={type} className="relative">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all hover:border-blue-400 ${
                dragOver === type ? 'border-blue-400 bg-blue-50' : getStatusColor(uploadStatus[type as keyof typeof uploadStatus])
              }`}
              onDragOver={(e) => handleDragOver(e, type)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, type as any)}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="text-3xl">{icon}</div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(uploadStatus[type as keyof typeof uploadStatus])}
                  <h3 className="font-medium text-gray-900">{label}</h3>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports CSV, XLSX, XLS files
                  </p>
                </div>

                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileSelect(e, type as any)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Choose File
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Features Preview */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">🤖</span>
          <h3 className="font-medium text-purple-900">AI-Powered Features</h3>
        </div>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• Smart column mapping for misnamed headers</li>
          <li>• Automatic data validation and error detection</li>
          <li>• Natural language search capabilities</li>
        </ul>
      </div>
    </div>
  );
}