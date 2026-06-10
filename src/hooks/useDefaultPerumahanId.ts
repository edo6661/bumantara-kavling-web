import { useMemo } from 'react';
import { useGetPerumahan } from './queries/usePerumahan';
import { resolveDefaultPerumahanId } from '../constants/perumahan';

export function useDefaultPerumahanId() {
  const { data: perumahanList = [], isLoading } = useGetPerumahan();
  const perumahanId = useMemo(
    () => resolveDefaultPerumahanId(perumahanList),
    [perumahanList],
  );
  return { perumahanId, isLoading: isLoading && perumahanList.length === 0 };
}
