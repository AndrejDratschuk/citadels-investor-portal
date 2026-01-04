import type { DealRollup, DealDbRow } from './reports.types';

/**
 * Pure function to calculate aggregated deal metrics
 * No side effects, no DB access - just computation
 */
export function calculateDealRollup(deals: DealDbRow[]): DealRollup {
  if (deals.length === 0) {
    return createEmptyRollup();
  }

  const aggregated = aggregateDeals(deals);
  const avgOccupancy = calculateWeightedAverage(
    aggregated.totalOccupancyWeighted,
    aggregated.unitsWithOccupancy
  );
  const weightedCapRate = calculateWeightedAverage(
    aggregated.totalCapRateWeighted,
    aggregated.valueWithCapRate
  );
  const { totalAppreciation, appreciationPercent } = calculateAppreciation(
    aggregated.totalCurrentValue,
    aggregated.totalAcquisitionCost
  );

  return {
    dealCount: deals.length,
    totalNoi: aggregated.totalNoi,
    avgOccupancy,
    totalUnits: aggregated.totalUnits,
    totalSqFt: aggregated.totalSqFt,
    totalAcquisitionCost: aggregated.totalAcquisitionCost,
    totalCurrentValue: aggregated.totalCurrentValue,
    weightedCapRate,
    totalAppreciation,
    appreciationPercent,
  };
}

interface AggregatedMetrics {
  totalNoi: number;
  totalOccupancyWeighted: number;
  unitsWithOccupancy: number;
  totalUnits: number;
  totalSqFt: number;
  totalAcquisitionCost: number;
  totalCurrentValue: number;
  totalCapRateWeighted: number;
  valueWithCapRate: number;
}

function aggregateDeals(deals: DealDbRow[]): AggregatedMetrics {
  const initial: AggregatedMetrics = {
    totalNoi: 0,
    totalOccupancyWeighted: 0,
    unitsWithOccupancy: 0,
    totalUnits: 0,
    totalSqFt: 0,
    totalAcquisitionCost: 0,
    totalCurrentValue: 0,
    totalCapRateWeighted: 0,
    valueWithCapRate: 0,
  };

  return deals.reduce((acc, deal) => {
    const currentValue = parseFloat(deal.current_value ?? '0') || 0;
    const acquisitionPrice = parseFloat(deal.acquisition_price ?? '0') || 0;
    const units = deal.unit_count ?? 0;
    const sqft = deal.square_footage ?? 0;
    const kpis = deal.kpis ?? {};

    acc.totalCurrentValue += currentValue;
    acc.totalAcquisitionCost += acquisitionPrice;
    acc.totalUnits += units;
    acc.totalSqFt += sqft;

    if (kpis.noi) {
      acc.totalNoi += kpis.noi;
    }

    if (kpis.occupancyRate && units > 0) {
      acc.totalOccupancyWeighted += kpis.occupancyRate * units;
      acc.unitsWithOccupancy += units;
    }

    if (kpis.capRate && currentValue > 0) {
      acc.totalCapRateWeighted += kpis.capRate * currentValue;
      acc.valueWithCapRate += currentValue;
    }

    return acc;
  }, initial);
}

function createEmptyRollup(): DealRollup {
  return {
    dealCount: 0,
    totalNoi: 0,
    avgOccupancy: 0,
    totalUnits: 0,
    totalSqFt: 0,
    totalAcquisitionCost: 0,
    totalCurrentValue: 0,
    weightedCapRate: 0,
    totalAppreciation: 0,
    appreciationPercent: 0,
  };
}

function calculateWeightedAverage(weightedSum: number, totalWeight: number): number {
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function calculateAppreciation(
  currentValue: number,
  acquisitionCost: number
): { totalAppreciation: number; appreciationPercent: number } {
  const totalAppreciation = currentValue - acquisitionCost;
  const appreciationPercent = acquisitionCost > 0
    ? (totalAppreciation / acquisitionCost) * 100
    : 0;

  return { totalAppreciation, appreciationPercent };
}

