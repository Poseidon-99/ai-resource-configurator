'use client';

import { useState } from 'react';
import { Download, FileText, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { Client, Worker, Task, Rule, Priority } from '@/lib/types';

interface ExportButtonProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  rules: Rule[];
  priorities: Priority[];
}

export function ExportButton({ clients, workers, tasks, rules, priorities }: ExportButtonProps) {
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [exportOptions, setExportOptions] = useState({
    includeCleanedData: true,
    includeRules: true,
    includePriorities: true,
    includeMetadata: true,
    format: 'zip' as 'zip' | 'separate'
  });

  const hasData = clients.length > 0 || workers.length > 0 || tasks.length > 0;
  const hasRules = rules.length > 0;
  const activeRules = rules.filter(r => r.isActive);

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) return null;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  };

  const generateRulesJSON = () => {
    const rulesConfig = {
      rules: activeRules.map(rule => ({
        id: rule.id,
        type: rule.type,
        entity: rule.entity,
        condition: {
          field: rule.field,
          operator: rule.operator,
          value: rule.value
        },
        description: rule.description,
        isActive: rule.isActive
      })),
      priorities: priorities.map(p => ({
        id: p.id,
        name: p.name,
        weight: p.weight / 100, // Convert to decimal
        description: p.description
      })),
      metadata: {
        exportDate: new Date().toISOString(),
        totalRules: activeRules.length,
        totalPriorities: priorities.length,
        version: '1.0'
      }
    };

    return new Blob([JSON.stringify(rulesConfig, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!hasData && !hasRules) return;

    setExportStatus('exporting');

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

      if (exportOptions.format === 'separate') {
        // Export individual files
        if (exportOptions.includeCleanedData) {
          if (clients.length > 0) {
            const clientsCSV = generateCSV(clients, 'clients.csv');
            if (clientsCSV) downloadFile(clientsCSV, `clients_cleaned_${timestamp}.csv`);
          }
          if (workers.length > 0) {
            const workersCSV = generateCSV(workers, 'workers.csv');
            if (workersCSV) downloadFile(workersCSV, `workers_cleaned_${timestamp}.csv`);
          }
          if (tasks.length > 0) {
            const tasksCSV = generateCSV(tasks, 'tasks.csv');
            if (tasksCSV) downloadFile(tasksCSV, `tasks_cleaned_${timestamp}.csv`);
          }
        }

        if (exportOptions.includeRules && (hasRules || priorities.length > 0)) {
          const rulesJSON = generateRulesJSON();
          downloadFile(rulesJSON, `allocation_config_${timestamp}.json`);
        }
      } else {
        // Create ZIP-like structure (simplified for demo)
        const rulesJSON = generateRulesJSON();
        downloadFile(rulesJSON, `allocation_package_${timestamp}.json`);
      }

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const getExportSummary = () => {
    const items = [];
    if (clients.length > 0) items.push(`${clients.length} clients`);
    if (workers.length > 0) items.push(`${workers.length} workers`);
    if (tasks.length > 0) items.push(`${tasks.length} tasks`);
    if (activeRules.length > 0) items.push(`${activeRules.length} rules`);
    if (priorities.length > 0) items.push(`${priorities.length} priorities`);
    
    return items.length > 0 ? items.join(', ') : 'No data to export';
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Configuration</h2>
        <p className="text-gray-600">Download your cleaned data and allocation rules</p>
      </div>

      {/* Export Summary */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center space-x-2 mb-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Export Summary</h3>
        </div>
        <p className="text-sm text-blue-700">{getExportSummary()}</p>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-4">Export Options</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={exportOptions.includeCleanedData}
              onChange={(e) => setExportOptions({...exportOptions, includeCleanedData: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include cleaned CSV data files</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={exportOptions.includeRules}
              onChange={(e) => setExportOptions({...exportOptions, includeRules: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include business rules configuration</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={exportOptions.includePriorities}
              onChange={(e) => setExportOptions({...exportOptions, includePriorities: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include priority weights</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={exportOptions.includeMetadata}
              onChange={(e) => setExportOptions({...exportOptions, includeMetadata: e.target.checked})}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include metadata and timestamps</span>
          </label>
        </div>
      </div>

      {/* Export Format */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-4">Export Format</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              value="separate"
              checked={exportOptions.format === 'separate'}
              onChange={(e) => setExportOptions({...exportOptions, format: e.target.value as 'separate'})}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Separate files (CSV + JSON)</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              value="zip"
              checked={exportOptions.format === 'zip'}
              onChange={(e) => setExportOptions({...exportOptions, format: e.target.value as 'zip'})}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Single configuration file (JSON)</span>
          </label>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={handleExport}
          disabled={(!hasData && !hasRules) || exportStatus === 'exporting'}
          className={`flex items-center space-x-3 px-8 py-4 rounded-lg font-medium transition-all ${
            !hasData && !hasRules
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : exportStatus === 'exporting'
              ? 'bg-blue-400 text-white cursor-wait'
              : exportStatus === 'success'
              ? 'bg-green-600 text-white'
              : exportStatus === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {exportStatus === 'exporting' ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Exporting...</span>
            </>
          ) : exportStatus === 'success' ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Export Complete!</span>
            </>
          ) : exportStatus === 'error' ? (
            <>
              <AlertCircle className="w-5 h-5" />
              <span>Export Failed</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Export Data & Rules</span>
            </>
          )}
        </button>
      </div>

      {/* Ready for Production */}
      {hasData && hasRules && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">🚀</span>
            <h3 className="font-medium text-green-900">Ready for Production</h3>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p>• Data validated and cleaned ({clients.length + workers.length + tasks.length} records)</p>
            <p>• {activeRules.length} business rules configured</p>
            <p>• Priority weights optimized</p>
            <p>• Ready to integrate with your allocation system</p>
          </div>
        </div>
      )}
    </div>
  );
}