type AuditExportEvent = {
  audit_id?: number;
  job_id?: number;
  action: string;
  actor?: string;
};

export async function exportAuditEvent(event: AuditExportEvent): Promise<void> {
  const webhook = process.env.AUDIT_EXPORT_WEBHOOK_URL;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...event,
        exported_at: new Date().toISOString(),
        source: "ripple-mcp",
      }),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "warn",
        msg: "audit export failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}
