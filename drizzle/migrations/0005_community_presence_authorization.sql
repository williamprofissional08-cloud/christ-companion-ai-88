CREATE POLICY community_presence_members ON realtime.messages FOR SELECT TO authenticated USING (realtime.topic()='comunidade' AND auth.uid() IS NOT NULL);
CREATE POLICY community_presence_publish ON realtime.messages FOR INSERT TO authenticated WITH CHECK (realtime.topic()='comunidade' AND auth.uid() IS NOT NULL);
