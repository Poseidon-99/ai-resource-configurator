// src/components/DataGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Edit3, Save, X, Sparkles, Download, Info } from 'lucide-react';
import { Client, Worker, Task, ValidationError } from '@/lib/types'; // Assuming you have this
import { processNaturalLanguageQuery, callOpenAI } from '@/lib/ai-helpers'; // Import both functions

interface DataGridProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onDataUpdate: (type: 'clients' | 'workers' | 'tasks', data: any[]) => void;
  onValidationUpdate: (errors: ValidationError[]) => void;
}

export function DataGrid({ clients, workers, tasks, onDataUpdate, onValidationUpdate }: DataGridProps) {
  const [activeTab, setActiveTab] = useState<'clients' | 'workers' | 'tasks'>('clients');
  const [searchQuery, setSearchQuery] = useState(''); // For standard text search
  const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // States for Natural Language Features
  const [naturalQueryForFilter, setNaturalQueryForFilter] = useState(''); // For local filtering
  const [naturalQueryForInsight, setNaturalQueryForInsight] = useState(''); // For sending to OpenAI
  const [aiFilteredData, setAiFilteredData] = useState<(Client | Worker | Task)[]>([]); // Data filtered by local NLP
  const [isAiFilterActive, setIsAiFilterActive] = useState(false); // Flag for local NLP filter
  const [localAiLoading, setLocalAiLoading] = useState(false); // Loading for local NLP
  const [aiInsightLoading, setAiInsightLoading] = useState(false); // Loading for OpenAI API call
  const [aiInsightResponse, setAiInsightResponse] = useState<string>(''); // Response from OpenAI

  const getCurrentData = () => {
    switch (activeTab) {
      case 'clients': return clients;
      case 'workers': return workers;
      case 'tasks': return tasks;
      default: return [];
    }
  };

  // Helper to get the correct column key names matching your data structure
  const getColumns = (type: string) => {
    switch (type) {
      case 'clients':
        return [
          { key: 'ClientID', label: 'Client ID' },
          { key: 'ClientName', label: 'Client Name' },
          { key: 'PriorityLevel', label: 'Priority' },
          { key: 'RequestedTaskIDs', label: 'Requested Tasks' },
          { key: 'GroupTag', label: 'Group' },
          { key: 'AttributesJSON', label: 'Attributes' }
        ];
      case 'workers':
        return [
          { key: 'WorkerID', label: 'Worker ID' },
          { key: 'WorkerName', label: 'Worker Name' },
          { key: 'Skills', label: 'Skills' },
          { key: 'AvailableSlots', label: 'Available Slots' },
          { key: 'MaxLoadPerPhase', label: 'Max Load' },
          { key: 'WorkerGroup', label: 'Group' },
          { key: 'QualificationLevel', label: 'Qualification' }
        ];
      case 'tasks':
        return [
          { key: 'TaskID', label: 'Task ID' },
          { key: 'TaskName', label: 'Task Name' },
          { key: 'Category', label: 'Category' },
          { key: 'Duration', label: 'Duration' },
          { key: 'RequiredSkills', label: 'Required Skills' },
          { key: 'PreferredPhases', label: 'Preferred Phases' },
          { key: 'MaxConcurrent', label: 'Max Concurrent' }
        ];
      default:
        return [];
    }
  };

  const handleCellEdit = (rowIndex: number, column: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, column });
    setEditValue(String(currentValue || ''));
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;

    const currentData = [...getCurrentData()];
    const { row, column } = editingCell;

    let newValue: any = editValue;
    // Type conversion based on column key
    if (['PriorityLevel', 'Duration', 'MaxLoadPerPhase', 'QualificationLevel', 'MaxConcurrent'].includes(column)) {
      newValue = parseInt(editValue) || 0;
    } else if (['AvailableSlots', 'RequestedTaskIDs', 'Skills', 'RequiredSkills', 'PreferredPhases'].includes(column)) {
        // For comma-separated strings or JSON arrays, handle appropriately.
        // For simplicity, keep as string or try to parse if it's supposed to be an array.
        // E.g., if Expected as array: newValue = editValue.split(',').map(s => s.trim()).filter(Boolean);
        // For now, keep as string as per your provided column types (except if it's already an array in data)
    }


    currentData[row] = { ...currentData[row], [column]: newValue };
    onDataUpdate(activeTab, currentData); // Propagate update to parent (Home.tsx)

    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Filtered data for display in the grid
  const displayedData = getCurrentData().filter(item => {
    // If local AI filter is active, use its results
    if (isAiFilterActive) {
      return aiFilteredData.includes(item); // Filter by direct object reference
    }

    // Otherwise, apply standard text search
    if (!searchQuery) return true;
    return Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handler for local Natural Language Data Retrieval (filtering the grid)
  const handleLocalNaturalSearch = () => {
    if (!naturalQueryForFilter.trim()) {
      clearAiFilter(); // If query is empty, clear filter
      return;
    }

    setLocalAiLoading(true);
    setAiFilteredData([]); // Clear previous results
    setIsAiFilterActive(false); // Assume not active until results are found

    const currentData = getCurrentData();
    const results = processNaturalLanguageQuery(naturalQueryForFilter, currentData, activeTab);

    setAiFilteredData(results);
    setIsAiFilterActive(true); // Activate filter if we have results
    setLocalAiLoading(false);
    setAiInsightResponse(`Local filter applied: Found ${results.length} matches.`);
  };

  const clearAiFilter = () => {
    setIsAiFilterActive(false);
    setAiFilteredData([]);
    setNaturalQueryForFilter('');
    setAiInsightResponse(''); // Clear AI message when clearing filter
  };


  // Handler for AI Insights (calling OpenAI via backend API)
  const handleAIInsightRequest = async () => {
    if (!naturalQueryForInsight.trim()) {
      setAiInsightResponse('Please enter a query for AI insights.');
      return;
    }

    setAiInsightLoading(true);
    setAiInsightResponse('Getting AI insights...');

    try {
      const response = await callOpenAI(
        naturalQueryForInsight,
        clients, // Pass all data for broad AI context
        workers,
        tasks
      );
      setAiInsightResponse(response);
    } catch (error) {
      console.error('Error fetching AI insight:', error);
      setAiInsightResponse(`Failed to get AI insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAiInsightLoading(false);
    }
  };


  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'clients': return '👥';
      case 'workers': return '👷';
      case 'tasks': return '📋';
      default: return '📄';
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'clients': return 'blue';
      case 'workers': return 'green';
      case 'tasks': return 'purple';
      default: return 'gray';
    }
  };

  if (getCurrentData().length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Data Uploaded</h3>
        <p className="text-gray-600">Upload your CSV or Excel files in the Upload tab to view and edit data here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {displayedData.length} of {getCurrentData().length} records
            {isAiFilterActive && <span className="text-purple-600 ml-1">(AI filtered)</span>}
          </span>
          <button className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Entity Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'clients', label: 'Clients', count: clients.length },
          { key: 'workers', label: 'Workers', count: workers.length },
          { key: 'tasks', label: 'Tasks', count: tasks.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as any);
              clearAiFilter(); // Clear local AI filter when switching tabs
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{getEntityIcon(tab.key)}</span>
            <span>{tab.label}</span>
            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Controls */}
      <div className="space-y-3">
        {/* Regular Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search data..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (isAiFilterActive) clearAiFilter(); // Clear AI filter when using regular search
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Local Natural Language Filter */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter with phrases: 'clients with priority 4', 'tasks duration > 2', 'workers with skill A'"
              value={naturalQueryForFilter}
              onChange={(e) => setNaturalQueryForFilter(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                isAiFilterActive
                  ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-200'
                  : 'border-blue-300 bg-blue-50 focus:ring-blue-500'
              }`}
              onKeyPress={(e) => e.key === 'Enter' && !localAiLoading && handleLocalNaturalSearch()}
              disabled={localAiLoading}
            />
          </div>
          <button
            onClick={handleLocalNaturalSearch}
            disabled={localAiLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {localAiLoading ? 'Filtering...' : 'Apply Filter'}
          </button>
          {isAiFilterActive && (
            <button
              onClick={clearAiFilter}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* AI Insight Query (uses OpenAI via your API) */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Ask AI for insights: 'Are sales workers overloaded?', 'Suggest rules for task allocation'"
              value={naturalQueryForInsight}
              onChange={(e) => setNaturalQueryForInsight(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50"
              onKeyPress={(e) => e.key === 'Enter' && !aiInsightLoading && handleAIInsightRequest()}
              disabled={aiInsightLoading}
            />
          </div>
          <button
            onClick={handleAIInsightRequest}
            disabled={aiInsightLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiInsightLoading ? 'Thinking...' : 'Get AI Insight'}
          </button>
        </div>
      </div>

      {/* AI Insight Response Display */}
      {aiInsightResponse && (
        <div className="bg-purple-50 border border-purple-200 text-purple-800 p-3 rounded-lg flex items-start space-x-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-1" />
          <p className="text-sm">{aiInsightResponse}</p>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {getColumns(activeTab).map(column => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {getColumns(activeTab).map(column => (
                    <td key={column.key} className="px-4 py-3 whitespace-nowrap">
                      {editingCell?.row === rowIndex && editingCell?.column === column.key ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-2 py-1 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 text-green-600 hover:text-green-800"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded group"
                          onClick={() => handleCellEdit(rowIndex, column.key, (row as any)[column.key])}
                        >
                          <span className="text-sm text-gray-900">
                            {String((row as any)[column.key] || '')}
                          </span>
                          <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 inline ml-2" />
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => handleCellEdit(rowIndex, getColumns(activeTab)[0].key, (row as any)[getColumns(activeTab)[0].key])}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Data Summary/Insights (from your original) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-blue-900">AI Data Insights Summary</h4>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="text-blue-700">
            • {getCurrentData().length} total records in {activeTab}
          </div>
          <div className="text-blue-700">
            • {displayedData.length} records currently displayed
            {isAiFilterActive && <span className="font-medium"> (AI filtered)</span>}
          </div>
        </div>
      </div>
    </div>
  );
}