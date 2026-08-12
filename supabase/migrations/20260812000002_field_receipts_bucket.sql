-- Incident photo/video storage. Private: incident photos are only ever read via
-- a 1-year signed URL generated server-side (crew-report-incident /
-- admin-board), never via a public bucket URL. Deliberately not porting the
-- source app's anon SELECT policy — that existed only for its wall-board
-- feature, which this standalone app doesn't have.
INSERT INTO storage.buckets (id, name, public)
VALUES ('field-receipts', 'field-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Service role can manage field-receipts"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'field-receipts')
WITH CHECK (bucket_id = 'field-receipts');
