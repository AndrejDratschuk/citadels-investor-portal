/**
 * Column Mapping Suggestions
 * Pure functions for auto-detecting and suggesting column-to-KPI mappings
 * OPERATOR: No side effects, no try/catch, bubbles errors up
 */

import type { KpiDefinition, KpiDataType } from '../types/kpi.types';
import type { 
  SuggestedMapping, 
  MappingConfidence,
  ColumnInfo,
} from '../types/dataImportOnboarding.types';

// ============================================
// Known Column Name Aliases
// ============================================

/** Maps common column name variations to KPI codes */
const KPI_ALIASES: Record<string, string[]> = {
  // Rent/Revenue
  gpr: ['gpr', 'gross potential rent', 'potential rent', 'gross rent'],
  egi: ['egi', 'effective gross income', 'effective income'],
  total_revenue: ['total revenue', 'revenue', 'total income', 'income'],
  revenue_per_unit: ['revenue per unit', 'rev/unit', 'income per unit'],
  revenue_per_sqft: ['revenue per sqft', 'revenue per sf', 'rev/sf', 'revenue psf'],
  rent_growth: ['rent growth', 'rental growth', 'rent increase'],
  loss_to_lease: ['loss to lease', 'ltl', 'lease loss'],
  concessions: ['concessions', 'rent concessions', 'discounts'],
  
  // Occupancy
  physical_occupancy: ['physical occupancy', 'occupancy', 'occupancy rate', 'occ rate', 'occ'],
  economic_occupancy: ['economic occupancy', 'econ occupancy', 'econ occ'],
  vacancy_rate: ['vacancy rate', 'vacancy', 'vac rate'],
  lease_renewal_rate: ['lease renewal rate', 'renewal rate', 'renewals'],
  avg_days_vacant: ['avg days vacant', 'days vacant', 'average vacancy days'],
  move_ins: ['move ins', 'move-ins', 'moveins', 'new leases'],
  move_outs: ['move outs', 'move-outs', 'moveouts'],
  
  // Property Performance
  noi: ['noi', 'net operating income', 'net income'],
  noi_margin: ['noi margin', 'operating margin', 'noi %'],
  operating_expense_ratio: ['operating expense ratio', 'opex ratio', 'expense ratio', 'oer'],
  cap_rate: ['cap rate', 'capitalization rate', 'cap'],
  cash_on_cash: ['cash on cash', 'coc', 'cash on cash return', 'coc return'],
  total_expenses: ['total expenses', 'expenses', 'operating expenses', 'opex'],
  expense_per_unit: ['expense per unit', 'exp/unit', 'cost per unit'],
  
  // Financial
  ebitda: ['ebitda', 'earnings before interest'],
  free_cash_flow: ['free cash flow', 'fcf', 'cash flow'],
  roi: ['roi', 'return on investment', 'return'],
  irr: ['irr', 'internal rate of return'],
  equity_multiple: ['equity multiple', 'em', 'moic', 'multiple on invested capital'],
  property_value: ['property value', 'value', 'current value', 'market value'],
  appreciation: ['appreciation', 'value appreciation', 'price appreciation'],
  
  // Debt Service
  dscr: ['dscr', 'debt service coverage ratio', 'debt coverage'],
  ltv: ['ltv', 'loan to value', 'loan-to-value'],
  interest_coverage: ['interest coverage', 'interest coverage ratio', 'icr'],
  principal_balance: ['principal balance', 'loan balance', 'principal', 'outstanding loan'],
  monthly_debt_service: ['monthly debt service', 'monthly payment', 'debt payment'],
  annual_debt_service: ['annual debt service', 'yearly debt service', 'annual payment'],
  interest_rate: ['interest rate', 'rate', 'loan rate'],
};

// ============================================
// Pure Functions
// ============================================

/**
 * Normalizes a string for comparison by lowercasing and removing special characters
 */
function normalizeString(input: string): string {
  return input
    .toLowerCase()
    .replace(/[_\-\s]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Calculates Levenshtein distance between two strings
 * Used for fuzzy matching when exact matches fail
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Calculates similarity score between two strings (0-1)
 */
function calculateSimilarity(a: string, b: string): number {
  const normalizedA = normalizeString(a);
  const normalizedB = normalizeString(b);
  
  if (normalizedA === normalizedB) {
    return 1.0;
  }
  
  // Check if one contains the other
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return 0.9;
  }
  
  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  if (maxLength === 0) return 0;
  
  const distance = levenshteinDistance(normalizedA, normalizedB);
  return 1 - distance / maxLength;
}

/**
 * Finds the best matching KPI for a given column name
 * Returns null if no suitable match is found
 */
function findBestKpiMatch(
  columnName: string,
  definitions: ReadonlyArray<KpiDefinition>
): { code: string; name: string; score: number } | null {
  const normalizedColumn = normalizeString(columnName);
  
  // Skip date-like columns
  if (isDateColumn(columnName)) {
    return null;
  }
  
  let bestMatch: { code: string; name: string; score: number } | null = null;
  
  // First, check against known aliases
  for (const [kpiCode, aliases] of Object.entries(KPI_ALIASES)) {
    for (const alias of aliases) {
      const similarity = calculateSimilarity(normalizedColumn, alias);
      if (similarity >= 0.8 && (!bestMatch || similarity > bestMatch.score)) {
        const def = definitions.find(d => d.code === kpiCode);
        if (def) {
          bestMatch = { code: kpiCode, name: def.name, score: similarity };
        }
      }
    }
  }
  
  // Then check against KPI names and codes directly
  for (const def of definitions) {
    const codeScore = calculateSimilarity(normalizedColumn, def.code);
    const nameScore = calculateSimilarity(normalizedColumn, def.name);
    const maxScore = Math.max(codeScore, nameScore);
    
    if (maxScore >= 0.7 && (!bestMatch || maxScore > bestMatch.score)) {
      bestMatch = { code: def.code, name: def.name, score: maxScore };
    }
  }
  
  return bestMatch;
}

/**
 * Determines confidence level based on similarity score
 */
function scoreToConfidence(score: number): MappingConfidence {
  if (score >= 0.95) return 'high';
  if (score >= 0.8) return 'medium';
  if (score >= 0.6) return 'low';
  return 'none';
}

/**
 * Checks if a column name appears to be a date column
 */
function isDateColumn(columnName: string): boolean {
  const normalized = normalizeString(columnName);
  const dateKeywords = ['date', 'period', 'month', 'year', 'quarter', 'time', 'timestamp'];
  return dateKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Detects the data type of values in a column
 */
function detectColumnDataType(
  values: ReadonlyArray<unknown>
): 'date' | 'number' | 'currency' | 'percentage' | 'text' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'text';
  
  const firstValues = nonNullValues.slice(0, 10);
  
  // Check for dates
  const datePattern = /^\d{4}[-/]\d{2}[-/]\d{2}|^\d{2}[-/]\d{2}[-/]\d{4}/;
  if (firstValues.every(v => typeof v === 'string' && datePattern.test(v))) {
    return 'date';
  }
  
  // Check for currency (starts with $ or ends with currency code)
  const currencyPattern = /^\$|^\£|^\€|USD|EUR|GBP/;
  if (firstValues.some(v => typeof v === 'string' && currencyPattern.test(v))) {
    return 'currency';
  }
  
  // Check for percentages
  const percentPattern = /%$/;
  if (firstValues.some(v => typeof v === 'string' && percentPattern.test(v))) {
    return 'percentage';
  }
  
  // Check for numbers
  if (firstValues.every(v => typeof v === 'number' || !isNaN(parseFloat(String(v).replace(/[$,%,]/g, ''))))) {
    return 'number';
  }
  
  return 'text';
}

// ============================================
// Main Export Functions
// ============================================

/**
 * Suggests column mappings for all columns based on KPI definitions
 * Pure function - no side effects
 */
export function suggestColumnMappings(
  columnNames: ReadonlyArray<string>,
  kpiDefinitions: ReadonlyArray<KpiDefinition>,
  sampleValues?: Record<string, ReadonlyArray<unknown>>
): SuggestedMapping[] {
  return columnNames.map((colName): SuggestedMapping => {
    const match = findBestKpiMatch(colName, kpiDefinitions);
    const values = sampleValues?.[colName] ?? [];
    const detectedType = detectColumnDataType(values);
    
    // Skip date columns - they're used for period, not KPI values
    if (isDateColumn(colName) || detectedType === 'date') {
      return {
        columnName: colName,
        suggestedKpiCode: null,
        suggestedKpiName: null,
        confidence: 'none',
        confidenceScore: 0,
        include: false,
        dataType: 'actual',
      };
    }
    
    if (match) {
      return {
        columnName: colName,
        suggestedKpiCode: match.code,
        suggestedKpiName: match.name,
        confidence: scoreToConfidence(match.score),
        confidenceScore: match.score,
        include: match.score >= 0.7,
        dataType: 'actual',
      };
    }
    
    return {
      columnName: colName,
      suggestedKpiCode: null,
      suggestedKpiName: null,
      confidence: 'none',
      confidenceScore: 0,
      include: false,
      dataType: 'actual',
    };
  });
}

/**
 * Analyzes columns and returns detailed info about each
 * Pure function - no side effects
 */
export function analyzeColumns(
  columnNames: ReadonlyArray<string>,
  rows: ReadonlyArray<Record<string, unknown>>
): ColumnInfo[] {
  return columnNames.map((name): ColumnInfo => {
    const values = rows.map(row => row[name]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    return {
      name,
      detectedType: detectColumnDataType(values),
      sampleValues: nonNullValues.slice(0, 5),
      nullCount: values.length - nonNullValues.length,
    };
  });
}

/**
 * Finds the date column in a set of columns
 * Returns the column name or null if not found
 */
export function findDateColumn(
  columnNames: ReadonlyArray<string>,
  rows: ReadonlyArray<Record<string, unknown>>
): string | null {
  // First check by column name
  for (const name of columnNames) {
    if (isDateColumn(name)) {
      return name;
    }
  }
  
  // Then check by data type
  for (const name of columnNames) {
    const values = rows.map(row => row[name]);
    if (detectColumnDataType(values) === 'date') {
      return name;
    }
  }
  
  return null;
}

/**
 * Validates that mappings include a date column
 * Returns error message or null if valid
 */
export function validateMappingsHaveDate(
  columnNames: ReadonlyArray<string>,
  rows: ReadonlyArray<Record<string, unknown>>
): string | null {
  const dateColumn = findDateColumn(columnNames, rows);
  if (!dateColumn) {
    return 'No date column detected. Please ensure your data includes a Date or Period column.';
  }
  return null;
}

/**
 * Parses a numeric value from various formats
 * Returns null if parsing fails
 */
export function parseNumericValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and percentage signs
    const cleaned = value.replace(/[$€£,\s%]/g, '').trim();
    if (cleaned === '' || cleaned === '-') return null;
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  return null;
}

/**
 * Parses a date value to ISO date string
 * Returns null if parsing fails
 */
export function parseDateValue(value: unknown): string | null {
  if (!value) return null;
  
  if (typeof value === 'string') {
    // Try ISO format first
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    
    // Try MM/DD/YYYY
    const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usMatch) {
      const month = usMatch[1].padStart(2, '0');
      const day = usMatch[2].padStart(2, '0');
      return `${usMatch[3]}-${month}-${day}`;
    }
    
    // Try DD/MM/YYYY (European)
    const euMatch = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (euMatch) {
      const day = euMatch[1].padStart(2, '0');
      const month = euMatch[2].padStart(2, '0');
      return `${euMatch[3]}-${month}-${day}`;
    }
    
    // Try parsing as date string
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split('T')[0];
  }
  
  return null;
}




