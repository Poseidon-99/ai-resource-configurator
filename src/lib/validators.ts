export interface ValidationError {
  row: number;
  column: string;
  error: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalRows: number;
    errorCount: number;
    warningCount: number;
  };
}

// Core validation functions
export const validators = {
  // Check for required fields
  required: (value: any, fieldName: string, rowIndex: number): ValidationError | null => {
    if (!value || value.toString().trim() === '') {
      return {
        row: rowIndex,
        column: fieldName,
        error: `${fieldName} is required`,
        severity: 'error',
        suggestion: `Add a value for ${fieldName}`
      };
    }
    return null;
  },

  // Check for duplicates
  duplicates: (values: any[], fieldName: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    const seen = new Map();
    
    values.forEach((value, index) => {
      if (value && value.toString().trim() !== '') {
        const key = value.toString().toLowerCase();
        if (seen.has(key)) {
          errors.push({
            row: index,
            column: fieldName,
            error: `Duplicate ${fieldName}: ${value}`,
            severity: 'error',
            suggestion: `Make ${fieldName} unique or remove duplicate`
          });
        } else {
          seen.set(key, index);
        }
      }
    });
    
    return errors;
  },

  // Validate data types
  dataType: (value: any, expectedType: string, fieldName: string, rowIndex: number): ValidationError | null => {
    if (!value) return null;

    switch (expectedType) {
      case 'number':
        if (isNaN(Number(value))) {
          return {
            row: rowIndex,
            column: fieldName,
            error: `${fieldName} must be a number`,
            severity: 'error',
            suggestion: `Enter a valid number for ${fieldName}`
          };
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.toString())) {
          return {
            row: rowIndex,
            column: fieldName,
            error: `${fieldName} must be a valid email`,
            severity: 'error',
            suggestion: `Enter a valid email format (e.g., user@domain.com)`
          };
        }
        break;
      case 'date':
        if (isNaN(Date.parse(value.toString()))) {
          return {
            row: rowIndex,
            column: fieldName,
            error: `${fieldName} must be a valid date`,
            severity: 'error',
            suggestion: `Enter a valid date format (YYYY-MM-DD)`
          };
        }
        break;
    }
    return null;
  },

  // Validate ranges
  range: (value: any, min: number, max: number, fieldName: string, rowIndex: number): ValidationError | null => {
    const numValue = Number(value);
    if (isNaN(numValue)) return null;

    if (numValue < min || numValue > max) {
      return {
        row: rowIndex,
        column: fieldName,
        error: `${fieldName} must be between ${min} and ${max}`,
        severity: 'warning',
        suggestion: `Adjust ${fieldName} to be within range ${min}-${max}`
      };
    }
    return null;
  },

  // Validate references (foreign keys)
  reference: (value: any, validValues: any[], fieldName: string, rowIndex: number): ValidationError | null => {
    if (!value) return null;
    
    if (!validValues.includes(value.toString())) {
      return {
        row: rowIndex,
        column: fieldName,
        error: `${fieldName} references invalid value: ${value}`,
        severity: 'error',
        suggestion: `Use one of: ${validValues.slice(0, 3).join(', ')}${validValues.length > 3 ? '...' : ''}`
      };
    }
    return null;
  }
};

// Main validation function for different data types
export function validateClientData(data: any[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    // Required field validation
    const requiredFields = ['ClientID', 'ClientName', 'PriorityLevel'];
    requiredFields.forEach(field => {
      const error = validators.required(row[field], field, index);
      if (error) errors.push(error);
    });

    // Data type validation
    const numberError = validators.dataType(row.PriorityLevel, 'number', 'PriorityLevel', index);
    if (numberError) errors.push(numberError);

    // Range validation
    const rangeError = validators.range(row.PriorityLevel, 1, 10, 'PriorityLevel', index);
    if (rangeError) errors.push(rangeError);
  });

  // Check for duplicate ClientIDs
  const duplicateErrors = validators.duplicates(
    data.map(row => row.ClientID), 
    'ClientID'
  );
  errors.push(...duplicateErrors);

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning'),
    summary: {
      totalRows: data.length,
      errorCount: errors.filter(e => e.severity === 'error').length,
      warningCount: errors.filter(e => e.severity === 'warning').length
    }
  };
}

export function validateWorkerData(data: any[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    // Required fields
    const requiredFields = ['WorkerID', 'WorkerName', 'Skills'];
    requiredFields.forEach(field => {
      const error = validators.required(row[field], field, index);
      if (error) errors.push(error);
    });

    // Numeric validations
    const numericFields = ['AvailableSlots', 'MaxLoadPerPhase', 'QualificationLevel'];
    numericFields.forEach(field => {
      if (row[field]) {
        const error = validators.dataType(row[field], 'number', field, index);
        if (error) errors.push(error);
      }
    });

    // Range validations
    if (row.QualificationLevel) {
      const rangeError = validators.range(row.QualificationLevel, 1, 10, 'QualificationLevel', index);
      if (rangeError) errors.push(rangeError);
    }
  });

  // Check duplicates
  const duplicateErrors = validators.duplicates(
    data.map(row => row.WorkerID), 
    'WorkerID'
  );
  errors.push(...duplicateErrors);

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning'),
    summary: {
      totalRows: data.length,
      errorCount: errors.filter(e => e.severity === 'error').length,
      warningCount: errors.filter(e => e.severity === 'warning').length
    }
  };
}

export function validateTaskData(data: any[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    // Required fields
    const requiredFields = ['TaskID', 'TaskName', 'Category'];
    requiredFields.forEach(field => {
      const error = validators.required(row[field], field, index);
      if (error) errors.push(error);
    });

    // Numeric validations
    const numericFields = ['Duration', 'MaxConcurrent'];
    numericFields.forEach(field => {
      if (row[field]) {
        const error = validators.dataType(row[field], 'number', field, index);
        if (error) errors.push(error);
      }
    });
  });

  // Check duplicates
  const duplicateErrors = validators.duplicates(
    data.map(row => row.TaskID), 
    'TaskID'
  );
  errors.push(...duplicateErrors);

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors: errors.filter(e => e.severity === 'error'),
    warnings: errors.filter(e => e.severity === 'warning'),
    summary: {
      totalRows: data.length,
      errorCount: errors.filter(e => e.severity === 'error').length,
      warningCount: errors.filter(e => e.severity === 'warning').length
    }
  };
}