// ============================================================================
// Reference Data API — danh muc kenh, COA segments
// ============================================================================

import httpClient from './http-client';
import type { RefDataItem, CoaSegmentsResponse } from '@/types';

/** Lay danh muc kenh thanh toan */
export async function getChannels(): Promise<RefDataItem[]> {
  const response = await httpClient.get<RefDataItem[]>('/dm/channels');
  return response.data;
}

/** Lay danh muc COA segments */
export async function getCoaSegments(
  segmentType?: string,
  keyword?: string
): Promise<CoaSegmentsResponse[]> {
  const params: Record<string, string> = {};
  if (segmentType) params.segmentType = segmentType;
  if (keyword) params.keyword = keyword;

  const response = await httpClient.get<CoaSegmentsResponse[]>('/dm/coa-segments', {
    params,
  });
  return response.data;
}

/** Lay danh muc theo loai (helper) */
export async function getRefDataByType(
  segmentType: string
): Promise<RefDataItem[]> {
  const segments = await getCoaSegments(segmentType);
  if (segments.length > 0) {
    return segments[0].items.map((item) => ({
      code: item.code,
      name: item.name,
      description: item.description,
      status: item.status,
    }));
  }
  return [];
}

/** Cache don gian cho danh muc */
const cache = new Map<string, { data: RefDataItem[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 phut

export async function getCachedRefData(segmentType: string): Promise<RefDataItem[]> {
  const cached = cache.get(segmentType);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = await getRefDataByType(segmentType);
  cache.set(segmentType, { data, timestamp: Date.now() });
  return data;
}

export function clearRefDataCache(): void {
  cache.clear();
}
