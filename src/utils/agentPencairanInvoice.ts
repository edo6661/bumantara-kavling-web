import type { AgentPencairanData } from '../services/agentPencairan.service';

export const MAX_AGENT_PENCAIRAN_INVOICE_FILES = 10;

export function getAgentPencairanInvoiceUrls(
  row: Pick<AgentPencairanData, 'fileInvoice' | 'fileInvoiceList'>,
): string[] {
  if (row.fileInvoiceList?.length) {
    return row.fileInvoiceList.filter((url) => url.trim() !== '');
  }
  return row.fileInvoice?.trim() ? [row.fileInvoice] : [];
}

export function hasAgentPencairanInvoice(
  row: Pick<AgentPencairanData, 'fileInvoice' | 'fileInvoiceList'>,
): boolean {
  return getAgentPencairanInvoiceUrls(row).length > 0;
}
