'use client';

import { useMemo } from 'react';
import { formatCurrency, formatNumber } from '@/lib/utils/formatting';
import { DollarSign, GraduationCap, Car, Calendar } from 'lucide-react';

interface CostPerTaxpayerProps {
  totalCost: number;
  aggressorPopulation: number;
  aggressorGdp: number;
  aggressorName: string;
  durationYears: number;
}

const TAXPAYER_RATIO = 0.45;
const MEDIAN_SALARY_RATIO = 0.6;
const AVG_TUITION = 10_000;
const AVG_CAR_PRICE = 35_000;

interface Equivalent {
  icon: React.ElementType;
  value: string;
  label: string;
}

export function CostPerTaxpayer({
  totalCost,
  aggressorPopulation,
  aggressorGdp,
  aggressorName,
  durationYears,
}: CostPerTaxpayerProps) {
  const stats = useMemo(() => {
    const taxpayers = aggressorPopulation * TAXPAYER_RATIO;
    const costPerTaxpayer = totalCost / taxpayers;
    const gdpPerCapita = aggressorGdp / aggressorPopulation;
    const medianSalary = gdpPerCapita * MEDIAN_SALARY_RATIO;
    const monthsOfSalary = (costPerTaxpayer / medianSalary) * 12;
    const yearsOfTuition = costPerTaxpayer / AVG_TUITION;
    const cars = costPerTaxpayer / AVG_CAR_PRICE;
    const annualBurden = costPerTaxpayer / Math.max(durationYears, 0.1);

    return {
      taxpayers,
      costPerTaxpayer,
      medianSalary,
      monthsOfSalary,
      yearsOfTuition,
      cars,
      annualBurden,
    };
  }, [totalCost, aggressorPopulation, aggressorGdp, durationYears]);

  const equivalents: Equivalent[] = [
    {
      icon: DollarSign,
      value:
        stats.monthsOfSalary >= 24
          ? `${(stats.monthsOfSalary / 12).toFixed(1)} years`
          : `${Math.round(stats.monthsOfSalary)} months`,
      label: 'of median salary',
    },
    {
      icon: GraduationCap,
      value: `${stats.yearsOfTuition.toFixed(1)} years`,
      label: 'of university tuition',
    },
    {
      icon: Car,
      value: `${stats.cars.toFixed(1)} cars`,
      label: 'at avg. $35K each',
    },
  ];

  return (
    <div
      className="rounded-xl p-5 space-y-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <h3
        className="text-xs font-bold tracking-widest uppercase"
        style={{ color: 'var(--text-secondary)' }}
      >
        Cost per taxpayer
      </h3>

      {/* Big number */}
      <div className="text-center space-y-2">
        <p
          className="text-4xl sm:text-5xl font-mono font-bold tracking-tight"
          style={{ color: 'var(--accent-cyan)' }}
        >
          {formatCurrency(stats.costPerTaxpayer)}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Every taxpayer in{' '}
          <span className="font-semibold" style={{ color: 'var(--text)' }}>
            {aggressorName}
          </span>{' '}
          would owe this amount
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Based on ~{formatNumber(Math.round(stats.taxpayers))} estimated taxpayers (45% of
          population)
        </p>
      </div>

      {/* Equivalents grid */}
      <div className="grid grid-cols-3 gap-3">
        {equivalents.map((eq) => (
          <div
            key={eq.label}
            className="rounded-lg p-3 text-center space-y-1.5"
            style={{
              background: 'var(--surface-bright)',
              border: '1px solid var(--border)',
            }}
          >
            <eq.icon size={18} className="mx-auto" style={{ color: 'var(--accent-cyan)' }} />
            <p
              className="text-base font-mono font-semibold"
              style={{ color: 'var(--text)' }}
            >
              {eq.value}
            </p>
            <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
              {eq.label}
            </p>
          </div>
        ))}
      </div>

      {/* Annual burden */}
      <div
        className="flex items-center justify-between rounded-lg px-4 py-3"
        style={{
          background: 'rgba(6, 182, 212, 0.06)',
          border: '1px solid rgba(6, 182, 212, 0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Annual burden per taxpayer
          </span>
        </div>
        <span
          className="text-sm font-mono font-semibold"
          style={{ color: 'var(--accent-cyan)' }}
        >
          {formatCurrency(stats.annualBurden)}/yr
        </span>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Estimated median salary: {formatCurrency(stats.medianSalary)}/yr (GDP per capita x 0.6).
        Tuition benchmark: $10K/yr global avg. All figures are approximations.
      </p>
    </div>
  );
}
