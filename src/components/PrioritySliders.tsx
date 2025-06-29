'use client';

import { useState } from 'react';
import { Sliders, RotateCcw, Target, TrendingUp } from 'lucide-react';
import { Priority } from '@/lib/types';

interface PrioritySliderProps {
  priorities: Priority[];
  onPriorityUpdate: (priorities: Priority[]) => void;
}

export function PrioritySliders({ priorities, onPriorityUpdate }: PrioritySliderProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const defaultPriorities: Priority[] = [
    { id: 'client-priority', name: 'Client Priority Level', weight: 25, description: 'Higher priority clients get preferential allocation' },
    { id: 'worker-skills', name: 'Worker Skill Match', weight: 30, description: 'Match tasks to workers with relevant skills' },
    { id: 'task-duration', name: 'Task Duration', weight: 20, description: 'Consider task completion time in allocation' },
    { id: 'workload-balance', name: 'Workload Balance', weight: 15, description: 'Distribute work evenly across workers' },
    { id: 'deadline-urgency', name: 'Deadline Urgency', weight: 10, description: 'Prioritize tasks with tight deadlines' }
  ];

  const presets = {
    balanced: { name: '⚖️ Balanced', weights: [25, 30, 20, 15, 10] },
    efficiency: { name: '🚀 Efficiency', weights: [15, 40, 25, 10, 10] },
    fairness: { name: '🤝 Fairness', weights: [20, 25, 15, 30, 10] },
    urgent: { name: '⚡ Urgent', weights: [30, 25, 15, 10, 20] }
  };

  const currentPriorities = priorities.length > 0 ? priorities : defaultPriorities;

  const handleSliderChange = (id: string, newWeight: number) => {
    const updated = currentPriorities.map(p => 
      p.id === id ? { ...p, weight: newWeight } : p
    );
    onPriorityUpdate(updated);
    setActivePreset(null);
  };

  const applyPreset = (presetKey: string) => {
    const preset = presets[presetKey as keyof typeof presets];
    const updated = currentPriorities.map((p, index) => ({
      ...p,
      weight: preset.weights[index] || p.weight
    }));
    onPriorityUpdate(updated);
    setActivePreset(presetKey);
  };

  const resetToDefaults = () => {
    onPriorityUpdate(defaultPriorities);
    setActivePreset(null);
  };

  const totalWeight = currentPriorities.reduce((sum, p) => sum + p.weight, 0);
  const isBalanced = totalWeight === 100;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Priority Configuration</h2>
        <p className="text-gray-600">Adjust weights to optimize resource allocation</p>
      </div>

      {/* Presets */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center space-x-2 mb-3">
          <Target className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Quick Presets</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`px-3 py-2 rounded-md text-sm transition-all ${
                activePreset === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-300'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Weight Status */}
      <div className={`p-4 rounded-lg border-2 ${
        isBalanced 
          ? 'bg-green-50 border-green-300' 
          : 'bg-yellow-50 border-yellow-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className={`w-5 h-5 ${isBalanced ? 'text-green-600' : 'text-yellow-600'}`} />
            <span className={`font-medium ${isBalanced ? 'text-green-900' : 'text-yellow-900'}`}>
              Total Weight: {totalWeight}%
            </span>
          </div>
          <button
            onClick={resetToDefaults}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
        {!isBalanced && (
          <p className="text-sm text-yellow-700 mt-1">
            Weights should total 100% for optimal allocation
          </p>
        )}
      </div>

      {/* Priority Sliders */}
      <div className="space-y-6">
        {currentPriorities.map((priority) => (
          <div key={priority.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{priority.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{priority.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-blue-600">{priority.weight}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="50"
                value={priority.weight}
                onChange={(e) => handleSliderChange(priority.id, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${priority.weight * 2}%, #e5e7eb ${priority.weight * 2}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">🤖</span>
          <h3 className="font-medium text-purple-900">AI Recommendations</h3>
        </div>
        <div className="text-sm text-purple-700 space-y-1">
          {totalWeight < 100 && (
            <p>• Consider increasing weights to reach 100% for optimal allocation</p>
          )}
          {currentPriorities.find(p => p.weight > 40) && (
            <p>• High single priority (>40%) may create allocation bottlenecks</p>
          )}
          <p>• Skill matching weight of 25-35% typically yields best results</p>
        </div>
      </div>
    </div>
  );
}