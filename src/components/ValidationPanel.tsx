'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Lightbulb, Zap, Eye, EyeOff } from 'lucide-react';
import { ValidationError } from '@/lib/types';

interface ValidationPanelProps {
  errors: ValidationError[];
}

export function ValidationPanel({ errors }: ValidationPanelProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

  const errorsByEntity = errors.reduce((acc, error) => {
    if (!acc[error.entity]) {
      acc[error.entity] = [];
    }
    acc[error.entity].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  const errorCounts = {
    total: errors.length,
    errors: errors.filter(e => e.type === 'error').length,
    warnings: errors.filter(e => e.type === 'warning').length
  };

  const toggleSection = (entity: string) => {
    setCollapsedSections(prev => 
      prev.includes(entity) 
        ? prev.filter(e => e !== entity)
        : [...prev, entity]
    );
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'client': return '👥';
      case 'worker': return '👷';
      case 'task': return '📋';
      default: return '📄';
    }
  };

  const getEntityColor = (entity: string) => {
    switch (entity) {
      case 'client': return 'blue';
      case 'worker': return 'green';
      case 'task': return 'purple';
      default: return 'gray';
    }
  };

  const getSuggestion = (error: ValidationError): string => {
    if (error.message.includes('Missing required column')) {
      return 'Check your CSV headers and ensure they match the expected format.';
    }
    if (error.message.includes('Duplicate IDs')) {
      return 'Review your data for duplicate entries and remove or rename them.';
    }
    if (error.message.includes('empty')) {
      return 'Upload a file with valid data rows.';
    }
    if (error.message.includes('PriorityLevel')) {
      return 'Priority levels should be between 1-5.';
    }
    if (error.message.includes('Duration')) {
      return 'Task duration should be a positive number.';
    }
    return 'Review the data format and ensure it matches the expected structure.';
  };

  if (errors.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="font-medium text-green-900">All Clear! 🎉</h3>
            <p className="text-green-700 text-sm">Your data has passed all validations.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            Validation Report
          </h3>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
          >
            {showSuggestions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showSuggestions ? 'Hide' : 'Show'} Suggestions</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{errorCounts.total}</div>
            <div className="text-sm text-gray-600">Total Issues</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{errorCounts.errors}</div>
            <div className="text-sm text-red-600">Errors</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{errorCounts.warnings}</div>
            <div className="text-sm text-yellow-600">Warnings</div>
          </div>
        </div>
      </div>

      {/* Issues by Entity */}
      <div className="space-y-3">
        {Object.entries(errorsByEntity).map(([entity, entityErrors]) => {
          const isCollapsed = collapsedSections.includes(entity);
          const color = getEntityColor(entity);
          
          return (
            <div key={entity} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <button
                onClick={() => toggleSection(entity)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 rounded-t-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getEntityIcon(entity)}</span>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {entity} Issues ({entityErrors.length})
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {entityErrors.some(e => e.type === 'error') && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    {entityErrors.some(e => e.type === 'warning') && (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <span className={`transform transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
                    ▶
                  </span>
                </div>
              </button>

              {!isCollapsed && (
                <div className="px-4 pb-4 space-y-3">
                  {entityErrors.map((error, index) => (
                    <div
                      key={error.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        error.type === 'error'
                          ? 'bg-red-50 border-red-400'
                          : 'bg-yellow-50 border-yellow-400'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {error.type === 'error' ? (
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${
                            error.type === 'error' ? 'text-red-800' : 'text-yellow-800'
                          }`}>
                            {error.message}
                          </p>
                          {error.row && (
                            <p className="text-sm text-gray-600 mt-1">
                              Row: {error.row} {error.column && `| Column: ${error.column}`}
                            </p>
                          )}
                          
                          {showSuggestions && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-300">
                              <div className="flex items-start space-x-2">
                                <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-blue-800">
                                  <strong>Suggestion:</strong> {getSuggestion(error)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Fix Suggestions */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="w-5 h-5 text-purple-600" />
          <h4 className="font-medium text-purple-900">AI-Powered Quick Fixes</h4>
        </div>
        <div className="space-y-2">
          <button className="w-full text-left p-2 bg-white rounded border hover:border-purple-300 transition-colors">
            <div className="text-sm font-medium text-purple-800">Auto-fix column headers</div>
            <div className="text-xs text-purple-600">Let AI map your columns to the correct format</div>
          </button>
          <button className="w-full text-left p-2 bg-white rounded border hover:border-purple-300 transition-colors">
            <div className="text-sm font-medium text-purple-800">Detect and merge duplicates</div>
            <div className="text-xs text-purple-600">AI will identify and suggest duplicate merging</div>
          </button>
          <button className="w-full text-left p-2 bg-white rounded border hover:border-purple-300 transition-colors">
            <div className="text-sm font-medium text-purple-800">Validate data relationships</div>
            <div className="text-xs text-purple-600">Check cross-references between entities</div>
          </button>
        </div>
      </div>
    </div>
  );
}