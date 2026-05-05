ALTER TABLE tracking_events
ADD COLUMN IF NOT EXISTS extra JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS tracking_events_extra_gin_idx
ON tracking_events
USING GIN (extra);
