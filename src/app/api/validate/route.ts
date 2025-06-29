import { NextRequest, NextResponse } from 'next/server';
import { validateClientData, validateWorkerData, validateTaskData } from '../../../lib/validators';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, dataType } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of objects.' },
        { status: 400 }
      );
    }

    if (!dataType) {
      return NextResponse.json(
        { error: 'Data type is required (client, worker, or task)' },
        { status: 400 }
      );
    }

    let validationResult;

    // Run appropriate validation based on data type
    switch (dataType.toLowerCase()) {
      case 'client':
        validationResult = validateClientData(data);
        break;
      case 'worker':
        validationResult = validateWorkerData(data);
        break;
      case 'task':
        validationResult = validateTaskData(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid data type. Must be client, worker, or task.' },
          { status: 400 }
        );
    }

    // Add suggestions for common fixes
    const enhancedErrors = validationResult.errors.map(error => ({
      ...error,
      quickFixes: generateQuickFixes(error, dataType)
    }));

    const enhancedWarnings = validationResult.warnings.map(warning => ({
      ...warning,
      quickFixes: generateQuickFixes(warning, dataType)
    }));

    return NextResponse.json({
      success: true,
      validation: {
        ...validationResult,
        errors: enhancedErrors,
        warnings: enhancedWarnings
      },
      recommendations: generateRecommendations(validationResult, dataType)
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during validation' },
      { status: 500 }
    );
  }
}

// Generate quick fix suggestions for validation errors
function generateQuickFixes(error: any, dataType: string): string[] {
  const fixes: string[] = [];

  if (error.error.includes('required')) {
    fixes.push('Fill in the missing value');
    fixes.push('Remove this row if data is not available');
  }

  if (error.error.includes('Duplicate')) {
    fixes.push('Make the value unique');
    fixes.push('Remove duplicate row');
    fixes.push('Merge duplicate entries');
  }

  if (error.error.includes('must be a number')) {
    fixes.push('Convert to numeric format');
    fixes.push('Remove non-numeric characters');
  }

  if (error.error.includes('must be between')) {
    fixes.push('Adjust value to be within valid range');
    fixes.push('Check if different scale is intended');
  }

  if (error.error.includes('references invalid')) {
    fixes.push('Use a valid reference value');
    fixes.push('Add the referenced item to the system');
  }

  return fixes;
}

// Generate overall recommendations based on validation results
function generateRecommendations(validationResult: any, dataType: string): string[] {
  const recommendations: string[] = [];
  const { errors, warnings, summary } = validationResult;

  // High error rate
  if (summary.errorCount > summary.totalRows * 0.1) {
    recommendations.push('Consider reviewing data quality - high error rate detected');
  }

  // Missing required fields
  const missingFieldErrors = errors.filter((e: any) => e.error.includes('required'));
  if (missingFieldErrors.length > 0) {
    recommendations.push('Focus on completing required fields first');
  }

  // Duplicate issues
  const duplicateErrors = errors.filter((e: any) => e.error.includes('Duplicate'));
  if (duplicateErrors.length > 0) {
    recommendations.push('Resolve duplicate entries to ensure data integrity');
  }

  // Data type specific recommendations
  switch (dataType.toLowerCase()) {
    case 'client':
      if (errors.some((e: any) => e.column === 'PriorityLevel')) {
        recommendations.push('Standardize priority levels to 1-10 scale');
      }
      break;
    case 'worker':
      if (errors.some((e: any) => e.column === 'Skills')) {
        recommendations.push('Use consistent skill naming and comma separation');
      }
      break;
    case 'task':
      if (errors.some((e: any) => e.column === 'Duration')) {
        recommendations.push('Ensure duration is in consistent units (hours/days)');
      }
      break;
  }

  // Overall data health
  if (summary.errorCount === 0 && summary.warningCount === 0) {
    recommendations.push('Data quality looks good! Ready for processing.');
  } else if (summary.errorCount === 0) {
    recommendations.push('No critical errors found. Address warnings for optimal results.');
  }

  return recommendations;
}