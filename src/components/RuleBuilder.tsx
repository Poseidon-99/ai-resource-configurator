'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit3, Zap, BookOpen, Settings } from 'lucide-react';
import { Rule } from '@/lib/types';

interface RuleBuilderProps {
  rules: Rule[];
  onRulesUpdate: (rules: Rule[]) => void;
}

export function RuleBuilder({ rules = [], onRulesUpdate }: RuleBuilderProps) {
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');

  const ruleTemplates = [
    {
      category: 'Skills',
      templates: [
        'Workers must have required skills for assigned tasks',
        'Senior workers should handle complex tasks',
        'Match worker expertise level to task difficulty'
      ]
    },
    {
      category: 'Workload',
      templates: [
        'No worker should exceed 40 hours per week',
        'Distribute tasks evenly across team members',
        'High-priority clients get additional resources'
      ]
    },
    {
      category: 'Scheduling',
      templates: [
        'Urgent tasks must be completed within 24 hours',
        'Regular clients get consistent worker assignments',
        'Weekend work requires supervisor approval'
      ]
    }
  ];

  const [newRule, setNewRule] = useState<Partial<Rule>>({
    type: 'constraint',
    entity: 'worker',
    field: '',
    operator: 'equals',
    value: '',
    description: '',
    isActive: true
  });

  const handleAddRule = () => {
    if (newRule.description && newRule.description.trim()) {
      const rule: Rule = {
        id: `rule-${Date.now()}`,
        type: newRule.type as 'constraint' | 'preference' | 'requirement',
        entity: newRule.entity as 'client' | 'worker' | 'task',
        field: newRule.field || 'default_field',
        operator: newRule.operator as 'equals' | 'greater_than' | 'less_than' | 'contains',
        value: newRule.value || 'default_value',
        description: newRule.description,
        isActive: true
      };
      onRulesUpdate([...rules, rule]);
      setNewRule({
        type: 'constraint',
        entity: 'worker',
        field: '',
        operator: 'equals',
        value: '',
        description: '',
        isActive: true
      });
      setIsAddingRule(false);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    onRulesUpdate(rules.filter(rule => rule.id !== ruleId));
  };

  const handleToggleRule = (ruleId: string) => {
    onRulesUpdate(rules.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const generateRuleFromNL = async () => {
    if (!naturalLanguageInput.trim()) return;

    // Simple rule generation logic (in real app, use OpenAI API)
    const input = naturalLanguageInput.toLowerCase();
    let generatedRule: Partial<Rule> = {
      type: 'constraint',
      entity: 'worker',
      isActive: true,
      description: naturalLanguageInput
    };

    if (input.includes('skill')) {
      generatedRule = {
        ...generatedRule,
        field: 'skills',
        operator: 'contains',
        value: 'required_skill'
      };
    } else if (input.includes('hour') || input.includes('time')) {
      generatedRule = {
        ...generatedRule,
        field: 'working_hours',
        operator: 'less_than',
        value: '40'
      };
    } else if (input.includes('priority')) {
      generatedRule = {
        ...generatedRule,
        entity: 'client',
        field: 'priority_level',
        operator: 'greater_than',
        value: '3'
      };
    }

    setNewRule(generatedRule);
    setIsAddingRule(true);
    setNaturalLanguageInput('');
  };

  const applyTemplate = (template: string) => {
    setNaturalLanguageInput(template);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Rules</h2>
        <p className="text-gray-600">Define constraints and preferences for allocation</p>
      </div>

      {/* Natural Language Input */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">AI Rule Generator</h3>
        </div>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              placeholder="Describe your rule in plain English..."
              className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && generateRuleFromNL()}
            />
            <button
              type="button"
              onClick={generateRuleFromNL}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Rule Templates */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <BookOpen className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Common Templates</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {ruleTemplates.map((category) => (
            <div key={category.category}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{category.category}</h4>
              <div className="space-y-1">
                {category.templates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Rules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Active Rules ({rules.filter(r => r.isActive).length})</h3>
          <button
            type="button"
            onClick={() => setIsAddingRule(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No rules defined yet. Add your first rule above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  rule.isActive 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={() => handleToggleRule(rule.id)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        rule.type === 'requirement' ? 'bg-red-100 text-red-700' :
                        rule.type === 'constraint' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {rule.type}
                      </span>
                      <span className="text-xs text-gray-500 uppercase font-medium">
                        {rule.entity}
                      </span>
                    </div>
                    <p className={`text-sm ${rule.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {rule.description}
                    </p>
                    <div className="text-xs text-gray-400 mt-1">
                      {rule.field} {rule.operator} "{rule.value}"
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingRule(rule.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {isAddingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Rule</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({...newRule, type: e.target.value as any})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="constraint">Constraint</option>
                  <option value="preference">Preference</option>
                  <option value="requirement">Requirement</option>
                </select>
                <select
                  value={newRule.entity}
                  onChange={(e) => setNewRule({...newRule, entity: e.target.value as any})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="worker">Worker</option>
                  <option value="client">Client</option>
                  <option value="task">Task</option>
                </select>
              </div>
              
              <input
                type="text"
                value={newRule.field}
                onChange={(e) => setNewRule({...newRule, field: e.target.value})}
                placeholder="Field name (e.g., skills, priority_level)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newRule.operator}
                  onChange={(e) => setNewRule({...newRule, operator: e.target.value as any})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="equals">Equals</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                  <option value="contains">Contains</option>
                </select>
                <input
                  type="text"
                  value={newRule.value}
                  onChange={(e) => setNewRule({...newRule, value: e.target.value})}
                  placeholder="Value"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <textarea
                value={newRule.description}
                onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                placeholder="Describe this rule..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setIsAddingRule(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddRule}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}