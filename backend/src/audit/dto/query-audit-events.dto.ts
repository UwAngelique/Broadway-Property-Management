export class QueryAuditEventsDto {
  userId?: number;
  action?: string;
  resourceType?: string;
  from?: string;
  to?: string;
  limit?: number;
}
