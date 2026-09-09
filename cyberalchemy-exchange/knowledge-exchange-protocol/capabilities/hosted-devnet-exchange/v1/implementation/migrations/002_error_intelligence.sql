ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS reporter TEXT NOT NULL DEFAULT 'client';

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS registry_version TEXT NOT NULL DEFAULT 'kep-error-registry/v0';

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS source_layer TEXT NOT NULL DEFAULT 'unknown';

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS retry_disposition TEXT NOT NULL DEFAULT 'inspect_before_retry';

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS http_status INTEGER CHECK (http_status BETWEEN 100 AND 599);

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS rpc_code BIGINT;

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS transaction_error TEXT;

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS instruction_index INTEGER CHECK (instruction_index >= 0);

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS instruction_error TEXT;

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS program_id TEXT;

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS custom_program_code BIGINT CHECK (custom_program_code >= 0);

-- statement
ALTER TABLE kep_hosted.client_error_journal ADD COLUMN IF NOT EXISTS correlation_id TEXT;

-- statement
CREATE INDEX IF NOT EXISTS client_error_journal_classification_idx ON kep_hosted.client_error_journal (source_layer, error_code, created_at DESC);

-- statement
CREATE INDEX IF NOT EXISTS client_error_journal_correlation_idx ON kep_hosted.client_error_journal (correlation_id) WHERE correlation_id IS NOT NULL;
