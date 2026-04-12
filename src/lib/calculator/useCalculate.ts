import { useQuery } from '@tanstack/react-query';

export function useCalculate(params: { aggressor: string | null; target: string | null; scenario: string }) {
  return useQuery({
    queryKey: ['calculate', params],
    queryFn: async () => {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aggressorCode: params.aggressor, targetCode: params.target, scenario: params.scenario }),
      });
      if (!res.ok) throw new Error('calculate failed');
      return res.json();
    },
    enabled: !!params.aggressor && !!params.target,
  });
}
