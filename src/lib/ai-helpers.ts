// src/lib/ai-helpers.ts
// AI Helper functions for smart features - Updated for your exact Excel columns

import { Client, Worker, Task } from './types'; // Assuming you have a types.ts or similar for these interfaces

export interface ColumnMapping {
  original: string;
  suggested: string;
  confidence: number;
}

export interface AIValidationSuggestion {
  issue: string;
  suggestion: string;
  autoFixAvailable: boolean;
  confidence: number;
}

// Helper for fuzzy matching (from your original code)
function calculateSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) { matrix[0][i] = i; }
  for (let j = 0; j <= str2.length; j += 1) { matrix[j][0] = j; }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  const distance = matrix[str2.length][str1.length];
  return 1 - distance / Math.max(str1.length, str2.length);
}

// Suggest Column Mapping (Your existing logic, adapted for clarity)
export function suggestColumnMapping(userColumns: string[]): ColumnMapping[] {
  const expectedMappings = {
    'CLIENT_ID': ['CLIENT_ID', 'client_id', 'ClientID', 'id', 'client_identifier'],
    'CLIENT_NAME': ['CLIENT_NAME', 'client_name', 'ClientName', 'name', 'company_name'],
    'PRIORITY_LEVEL': ['PRIORITY_LEVEL', 'priority_level', 'Priority', 'PriorityLevel', 'importance'], // Changed to match your sample data more accurately
    'REQUESTED_TASK_IDS': ['REQUESTED_TASK_IDS', 'requested_task_ids', 'RequestedTasks', 'RequestedTaskIDs', 'task_ids', 'tasks'], // Changed to match your sample data
    'GROUP_TAG': ['GROUP_TAG', 'group_tag', 'Group', 'GroupTag', 'team_tag'], // Added for clients

    'WORKER_ID': ['WORKER_ID', 'worker_id', 'WorkerID', 'employee_id', 'id'],
    'WORKER_NAME': ['WORKER_NAME', 'worker_name', 'WorkerName', 'name', 'employee_name'],
    'SKILLS': ['SKILLS', 'skills', 'Skills', 'capabilities', 'expertise'],
    'AVAILABLE_SLOTS': ['AVAILABLE_SLOTS', 'available_slots', 'AvailableSlots', 'availability', 'slots'],
    'MAX_LOAD_PER_PHASE': ['MAX_LOAD_PER_PHASE', 'max_load_per_phase', 'MaxLoad', 'MaxLoadPerPhase', 'maximum_load', 'capacity'],
    'WORKER_GROUP': ['WORKER_GROUP', 'worker_group', 'Group', 'WorkerGroup', 'team', 'department'], // Changed to match your sample data
    'QUALIFICATION_LEVEL': ['QUALIFICATION_LEVEL', 'qualification_level', 'Qualification', 'QualificationLevel', 'qualifications', 'certifications'], // Changed to match your sample data

    'TASK_ID': ['TASK_ID', 'task_id', 'TaskID', 'id', 'task_identifier'],
    'TASK_NAME': ['TASK_NAME', 'task_name', 'TaskName', 'name', 'title'],
    'CATEGORY': ['CATEGORY', 'category', 'Category', 'type', 'task_type'],
    'DURATION': ['DURATION', 'duration', 'Duration', 'time', 'estimated_hours'],
    'REQUIRED_SKILLS': ['REQUIRED_SKILLS', 'required_skills', 'RequiredSkills', 'skills_needed'],
    'PREFERRED_PHASES': ['PREFERRED_PHASES', 'preferred_phases', 'PreferredPhases', 'phases'],
    'MAX_CONCURRENT': ['MAX_CONCURRENT', 'max_concurrent', 'MaxConcurrent', 'concurrent_limit']
  };

  const suggestions: ColumnMapping[] = [];

  userColumns.forEach(userCol => {
    const normalized = userCol.toLowerCase().replace(/[_\s-]/g, '');
    let bestMatch = '';
    let maxScore = 0;

    Object.entries(expectedMappings).forEach(([expected, variants]) => {
      variants.forEach(variant => {
        const score = calculateSimilarity(normalized, variant.toLowerCase().replace(/[_\s-]/g, ''));
        if (score > maxScore && score > 0.5) {
          maxScore = score;
          bestMatch = expected;
        }
      });
    });

    if (bestMatch) {
      suggestions.push({
        original: userCol,
        suggested: bestMatch,
        confidence: maxScore
      });
    }
  });

  return suggestions;
}

/**
 * Performs a local natural language search/filter on data.
 * This is a basic rule-based NLP, not an LLM.
 * @param query The natural language query.
 * @param data The array of data objects (clients, workers, or tasks).
 * @param dataType The type of data ('clients', 'workers', 'tasks').
 * @returns Filtered array of data objects.
 */
export function processNaturalLanguageQuery(query: string, data: (Client | Worker | Task)[], dataType: 'clients' | 'workers' | 'tasks'): (Client | Worker | Task)[] {
  const lowercaseQuery = query.toLowerCase();

  // Handle client-specific queries
  if (dataType === 'clients') {
    return (data as Client[]).filter(item => {
      // "high priority clients" or "priority X"
      if (lowercaseQuery.includes('high priority') || lowercaseQuery.includes('priority')) {
        const priorityMatch = lowercaseQuery.match(/priority\s*(?:level)?\s*(\d+)/);
        const minPriority = priorityMatch ? parseInt(priorityMatch[1]) : 4; // Default high priority threshold
        if (item.PriorityLevel && parseInt(item.PriorityLevel) >= minPriority) return true;
      }
      // "client name X"
      if (lowercaseQuery.includes('client name') || lowercaseQuery.includes('name')) {
        const nameMatch = lowercaseQuery.match(/name\s*['"]?([^'"]+)['"]?/);
        if (nameMatch && item.ClientName && item.ClientName.toLowerCase().includes(nameMatch[1].toLowerCase())) return true;
      }
      // "requested tasks X"
      if (lowercaseQuery.includes('requested tasks') || lowercaseQuery.includes('tasks')) {
        const tasksMatch = lowercaseQuery.match(/(?:requested\s*)?tasks\s*([a-z0-9, ]+)/);
        if (tasksMatch && item.RequestedTaskIDs && tasksMatch[1].split(',').some(t => item.RequestedTaskIDs.toLowerCase().includes(t.trim().toLowerCase()))) return true;
      }
      // "group X"
      if (lowercaseQuery.includes('group')) {
        const groupMatch = lowercaseQuery.match(/group\s*([a-z0-9]+)/);
        if (groupMatch && item.GroupTag && item.GroupTag.toLowerCase().includes(groupMatch[1].toLowerCase())) return true;
      }
      return false; // If no specific rule matched, don't include unless general search applies
    });
  }

  // Handle worker-specific queries
  if (dataType === 'workers') {
    return (data as Worker[]).filter(item => {
      // "workers with skill X"
      if (lowercaseQuery.includes('skill') || lowercaseQuery.includes('skills')) {
        const skillMatch = lowercaseQuery.match(/skill[s]?\s*[:\-]?\s*([a-z, ]+)/);
        if (skillMatch && item.Skills && skillMatch[1].split(',').some(s => item.Skills.toLowerCase().includes(s.trim().toLowerCase()))) return true;
      }
      // "available workers" or "available in phase X"
      if (lowercaseQuery.includes('available') || lowercaseQuery.includes('slots')) {
        const phaseMatch = lowercaseQuery.match(/phase\s*(\d+)/);
        if (phaseMatch && item.AvailableSlots && item.AvailableSlots.includes(phaseMatch[1])) return true; // Assuming AvailableSlots is string of numbers like "1,3,5" or actual array
        if (item.AvailableSlots && item.AvailableSlots.length > 0) return true; // Simply checks if slots exist
      }
      // "max load X"
      if (lowercaseQuery.includes('max load') || lowercaseQuery.includes('load limit')) {
        const loadMatch = lowercaseQuery.match(/(?:max load|load limit)\s*(?:of)?\s*(\d+)/);
        if (loadMatch && item.MaxLoadPerPhase && parseInt(item.MaxLoadPerPhase) <= parseInt(loadMatch[1])) return true;
      }
      // "worker group X"
      if (lowercaseQuery.includes('worker group')) {
        const groupMatch = lowercaseQuery.match(/worker group\s*([a-z0-9]+)/);
        if (groupMatch && item.WorkerGroup && item.WorkerGroup.toLowerCase().includes(groupMatch[1].toLowerCase())) return true;
      }
      return false;
    });
  }

  // Handle task-specific queries
  if (dataType === 'tasks') {
    return (data as Task[]).filter(item => {
      // "tasks with duration more than X"
      if (lowercaseQuery.includes('duration more than') || lowercaseQuery.includes('duration >')) {
        const match = lowercaseQuery.match(/duration\s*(?:more than|>)\s*(\d+)/);
        if (match && item.Duration && parseInt(item.Duration) > parseInt(match[1])) return true;
      }
      // "tasks in phase X" or "preferred phases"
      if (lowercaseQuery.includes('phase') || lowercaseQuery.includes('preferred phases')) {
        const phaseMatch = lowercaseQuery.match(/phase[s]?\s*(\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*)/);
        if (phaseMatch && item.PreferredPhases) {
          const phasesToMatch = phaseMatch[1].split(',').map(p => p.trim());
          // This parsing for PreferredPhases needs to be robust for "1-3" or "[2,4,5]"
          // For simplicity, let's assume it's an array or comma-separated string that can be checked for inclusion
          return phasesToMatch.some(p => String(item.PreferredPhases).includes(p));
        }
      }
      // "tasks requiring skill X"
      if (lowercaseQuery.includes('required skill') || lowercaseQuery.includes('skills needed')) {
        const skillMatch = lowercaseQuery.match(/(?:required skill[s]?|skills needed)\s*[:\-]?\s*([a-z, ]+)/);
        if (skillMatch && item.RequiredSkills && skillMatch[1].split(',').some(s => item.RequiredSkills.toLowerCase().includes(s.trim().toLowerCase()))) return true;
      }
      // "max concurrent X"
      if (lowercaseQuery.includes('max concurrent') || lowercaseQuery.includes('parallel')) {
        const concurrentMatch = lowercaseQuery.match(/(?:max concurrent|parallel)\s*(?:of)?\s*(\d+)/);
        if (concurrentMatch && item.MaxConcurrent && parseInt(item.MaxConcurrent) <= parseInt(concurrentMatch[1])) return true;
      }
      return false;
    });
  }

  // Fallback to simple text search across all fields for any data type if no specific rule matched
  return data.filter(item =>
    Object.values(item).some(value =>
      value && value.toString().toLowerCase().includes(lowercaseQuery)
    )
  );
}


// Updated rule suggestions for your data structure (Your existing logic)
export function suggestRules(clientData: Client[], workerData: Worker[], taskData: Task[]): string[] {
  const suggestions: string[] = [];

  if (clientData.length > 0) {
    const highPriorityClients = clientData.filter(c => c.PriorityLevel && parseInt(c.PriorityLevel) >= 4).length; // Adjusted threshold
    const totalClients = clientData.length;
    if (highPriorityClients / totalClients > 0.3) {
      suggestions.push("Consider adding priority-based allocation rules for high-priority clients (e.g., Client Priority Level >= 4).");
    }
  }

  if (workerData.length > 0) {
    const avgCapacity = workerData.reduce((sum, w) => sum + (parseInt(w.AvailableSlots) || 0), 0) / workerData.length;
    if (avgCapacity < 20 && avgCapacity > 0) { // Check if avgCapacity is meaningful
      suggestions.push("Workers have limited available slots - consider workload balancing rules based on AvailableSlots.");
    }

    const groups = [...new Set(workerData.map(w => w.WorkerGroup).filter(Boolean))];
    if (groups.length > 1) {
      suggestions.push("Multiple worker groups detected - consider group-based allocation rules (e.g., WorkerGroup 'Sales' can only do 'Sales' tasks).");
    }
  }

  if (taskData.length > 0) {
    const longTasks = taskData.filter(t => t.Duration && parseInt(t.Duration) > 3).length; // Adjusted duration threshold
    if (longTasks > 0) {
      suggestions.push("Long-duration tasks detected - consider phase-window constraints or sequential allocation.");
    }

    const concurrentTasks = taskData.filter(t => t.MaxConcurrent && parseInt(t.MaxConcurrent) > 1).length;
    if (concurrentTasks > 0) {
      suggestions.push("Tasks with concurrent execution limits detected - optimize parallel processing (e.g., MaxConcurrent for specific tasks).");
    }
  }

  return suggestions;
}

// Updated natural language to rule conversion (Your existing logic)
export function naturalLanguageToRule(description: string): any {
  const lowercaseDesc = description.toLowerCase();

  if (lowercaseDesc.includes('high priority') && lowercaseDesc.includes('first')) {
    return {
      type: 'priority',
      condition: 'Client.PriorityLevel >= 4', // Use actual column name
      action: 'allocate_first',
      description: 'Allocate high priority clients first'
    };
  }

  if (lowercaseDesc.includes('balance') && lowercaseDesc.includes('load')) {
    return {
      type: 'load_balance',
      condition: 'Worker.AvailableSlots > 0', // Use actual column name
      action: 'distribute_evenly',
      description: 'Balance workload across available workers'
    };
  }

  if (lowercaseDesc.includes('skill') && lowercaseDesc.includes('match')) {
    return {
      type: 'skill_match',
      condition: 'Task.RequiredSkills IN Worker.Skills', // Use actual column names
      action: 'assign_qualified_worker',
      description: 'Match tasks to workers with required skills'
    };
  }

  if (lowercaseDesc.includes('group') || lowercaseDesc.includes('team')) {
    // This is generic; would need more context from user for specific group
    return {
      type: 'group_allocation',
      condition: 'Worker.WorkerGroup = "SpecificGroup"', // Example placeholder
      action: 'assign_within_group',
      description: 'Allocate tasks within specific worker groups'
    };
  }

  return {
    type: 'custom',
    condition: 'true',
    action: 'manual_review',
    description: description
  };
}

// Updated data quality suggestions for your columns (Your existing logic)
export function generateDataQualitySuggestions(data: any[], dataType: string): AIValidationSuggestion[] {
  const suggestions: AIValidationSuggestion[] = [];

  const criticalFields = {
    clients: ['ClientID', 'ClientName', 'PriorityLevel'], // Updated to match sample data
    workers: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase'], // Updated
    tasks: ['TaskID', 'TaskName', 'Duration', 'RequiredSkills'] // Updated
  };

  const fields = criticalFields[dataType as keyof typeof criticalFields] || [];

  fields.forEach(field => {
    const missingCount = data.filter(row => !row[field] || String(row[field]).trim() === '').length;
    if (missingCount > 0) {
      suggestions.push({
        issue: `${missingCount} rows missing ${field}`,
        suggestion: `Add ${field} values or remove incomplete rows`,
        autoFixAvailable: false,
        confidence: 0.9
      });
    }
  });

  if (dataType === 'clients') {
    const priorityValues = data.map(row => row.PriorityLevel).filter(Boolean);
    const hasNonNumeric = priorityValues.some(val => isNaN(Number(val)));
    if (hasNonNumeric) {
      suggestions.push({
        issue: 'PriorityLevel column contains non-numeric values',
        suggestion: 'Convert priority levels to numbers (1-5 scale)',
        autoFixAvailable: true,
        confidence: 0.8
      });
    }
  }

  if (dataType === 'workers') {
    const slotValues = data.map(row => row.AvailableSlots).filter(Boolean);
    const hasNonNumeric = slotValues.some(val => !Array.isArray(val) && isNaN(Number(val))); // Check if it's not an array or is NaN
    if (hasNonNumeric) {
      suggestions.push({
        issue: 'AvailableSlots column contains non-numeric values or invalid format',
        suggestion: 'Ensure available slots are numbers or a comma-separated list of phase numbers (e.g., "1,3,5")',
        autoFixAvailable: true,
        confidence: 0.8
      });
    }
    const maxLoadValues = data.map(row => row.MaxLoadPerPhase).filter(Boolean);
    const hasNonNumericMaxLoad = maxLoadValues.some(val => isNaN(Number(val)));
    if (hasNonNumericMaxLoad) {
        suggestions.push({
            issue: 'MaxLoadPerPhase column contains non-numeric values',
            suggestion: 'Convert max load per phase to numbers',
            autoFixAvailable: true,
            confidence: 0.7
        });
    }
  }

  if (dataType === 'tasks') {
    const durationValues = data.map(row => row.Duration).filter(Boolean);
    const hasNonNumeric = durationValues.some(val => isNaN(Number(val)));
    if (hasNonNumeric) {
      suggestions.push({
        issue: 'Duration column contains non-numeric values',
        suggestion: 'Convert duration to numbers (e.g., number of phases)',
        autoFixAvailable: true,
        confidence: 0.8
      });
    }
    const maxConcurrentValues = data.map(row => row.MaxConcurrent).filter(Boolean);
    const hasNonNumericMaxConcurrent = maxConcurrentValues.some(val => isNaN(Number(val)));
    if (hasNonNumericMaxConcurrent) {
        suggestions.push({
            issue: 'MaxConcurrent column contains non-numeric values',
            suggestion: 'Convert max concurrent to numbers',
            autoFixAvailable: true,
            confidence: 0.7
        });
    }
  }

  return suggestions;
}


/**
 * Function to call your OpenAI backend API.
 * This function is for general AI insights, rule recommendations, etc.,
 * not for direct data filtering of the grid.
 * @param prompt The user's query for AI analysis.
 * @param clients Client data.
 * @param workers Worker data.
 * @param tasks Task data.
 * @returns A promise that resolves to the AI's response string.
 */
export async function callOpenAI(prompt: string, clients: any[], workers: any[], tasks: any[]): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt, // Send the prompt directly
        clients, workers, tasks // Send all data for AI context
      }),
    });

    if (!response.ok) {
      // Attempt to parse error message from API if available
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.response || errorData.details || `AI API request failed with status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.response || 'No response received from AI.';
  } catch (error) {
    console.error('OpenAI call failed in ai-helpers:', error);

    // Fallback responses based on prompt analysis
    if (error instanceof Error) {
        if (error.message.includes('API key')) {
            return `API Configuration Issue: Please check your OpenAI API key in .env.local file. Original error: ${error.message}`;
        }
        if (error.message.includes('quota') || error.message.includes('billing')) {
            return `OpenAI API quota exceeded or billing issue. Please check your OpenAI account. Original error: ${error.message}`;
        }
        if (error.message.includes('rate limit')) {
            return `Rate limit exceeded. Please wait a moment and try again. Original error: ${error.message}`;
        }
        return `AI service encountered an issue: ${error.message}. Please check your internet connection or try again later.`;
    }

    return "I'm currently unable to connect to the AI service. Please check your configuration and try again.";
  }
}