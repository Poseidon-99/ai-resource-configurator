'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataGrid } from '@/components/DataGrid';
import { ValidationPanel } from '@/components/ValidationPanel';
import { RuleBuilder } from '@/components/RuleBuilder';
import { PrioritySliders } from '@/components/PrioritySliders';
import { ExportButton } from '@/components/ExportButton';
import AIInsight from '@/components/AIInsight';
import {
  Client,
  Worker,
  Task,
  ValidationError,
  Rule,
  Priority
} from '@/lib/types';

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([
    {
      id: 'client-priority',
      name: 'Client Priority Level',
      weight: 25,
      description: 'Higher priority clients get preferential allocation'
    },
    {
      id: 'worker-skills',
      name: 'Worker Skill Match',
      weight: 30,
      description: 'Match tasks to workers with relevant skills'
    },
    {
      id: 'task-duration',
      name: 'Task Duration',
      weight: 20,
      description: 'Consider task completion time in allocation'
    },
    {
      id: 'workload-balance',
      name: 'Workload Balance',
      weight: 15,
      description: 'Distribute work evenly across workers'
    },
    {
      id: 'deadline-urgency',
      name: 'Deadline Urgency',
      weight: 10,
      description: 'Prioritize tasks with tight deadlines'
    }
  ]);
  const [activeTab, setActiveTab] = useState<'upload' | 'data' | 'rules' | 'export' | 'insight'>('upload');

  const handleDataUpload = (type: 'clients' | 'workers' | 'tasks', data: any[]) => {
    switch (type) {
      case 'clients':
        setClients(data);
        break;
      case 'workers':
        setWorkers(data);
        break;
      case 'tasks':
        setTasks(data);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 AI Resource Allocation Configurator
          </h1>
          <p className="text-gray-600">Transform your spreadsheet chaos into organized data</p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            {[
              { key: 'upload', label: '📁 Upload' },
              { key: 'data', label: '📊 Data' },
              { key: 'rules', label: '⚙️ Rules' },
              { key: 'export', label: '💾 Export' },
              { key: 'insight', label: '💡 AI Insight' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <FileUpload
                onDataUpload={handleDataUpload}
                onValidationUpdate={setValidationErrors}
              />
              {validationErrors.length > 0 && (
                <ValidationPanel errors={validationErrors} />
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <DataGrid
                clients={clients}
                workers={workers}
                tasks={tasks}
                onDataUpdate={handleDataUpload}
                onValidationUpdate={setValidationErrors}
              />
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <RuleBuilder
                clients={clients}
                workers={workers}
                tasks={tasks}
                rules={rules}
                onRulesUpdate={setRules}
              />
              <PrioritySliders
                priorities={priorities}
                onPriorityUpdate={setPriorities}
              />
            </div>
          )}

          {activeTab === 'export' && (
            <ExportButton
              clients={clients}
              workers={workers}
              tasks={tasks}
              rules={rules}
              priorities={priorities}
            />
          )}

          {activeTab === 'insight' && (
            <div className="space-y-6">
              <AIInsight />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
