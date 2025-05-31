-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE claim_status AS ENUM ('PENDING', 'VERIFYING', 'VERIFIED', 'FAILED');
CREATE TYPE verdict_type AS ENUM ('TRUE', 'FALSE', 'PARTIALLY_TRUE', 'MISLEADING', 'UNVERIFIABLE');

-- Create debates table
CREATE TABLE debate (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create speakers table
CREATE TABLE speaker (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    debate_id UUID NOT NULL REFERENCES debate(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create claims table
CREATE TABLE claim (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    status claim_status DEFAULT 'PENDING' NOT NULL,
    debate_id UUID NOT NULL REFERENCES debate(id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES speaker(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create verdicts table
CREATE TABLE verdict (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    verdict verdict_type NOT NULL,
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    sources TEXT[] DEFAULT '{}' NOT NULL,
    reasoning TEXT,
    evidence TEXT,
    claim_id UUID NOT NULL REFERENCES claim(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_speaker_debate_id ON speaker(debate_id);
CREATE INDEX idx_claim_debate_id ON claim(debate_id);
CREATE INDEX idx_claim_speaker_id ON claim(speaker_id);
CREATE INDEX idx_claim_timestamp ON claim(timestamp);
CREATE INDEX idx_claim_status ON claim(status);
CREATE INDEX idx_verdict_claim_id ON verdict(claim_id);
CREATE INDEX idx_verdict_created_at ON verdict(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_debate_updated_at BEFORE UPDATE ON debate
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_speaker_updated_at BEFORE UPDATE ON speaker
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claim_updated_at BEFORE UPDATE ON claim
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verdict_updated_at BEFORE UPDATE ON verdict
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE debate ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaker ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim ENABLE ROW LEVEL SECURITY;
ALTER TABLE verdict ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now, can be restricted later)
CREATE POLICY "Enable all operations for debates" ON debate
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for speakers" ON speaker
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for claims" ON claim
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for verdicts" ON verdict
    FOR ALL USING (true) WITH CHECK (true);

-- Insert some example data
INSERT INTO debate (title, description, start_time) VALUES 
    ('Presidential Debate 2024', 'First presidential debate of the 2024 election season', NOW()),
    ('Climate Change Discussion', 'Panel discussion on climate policies', NOW() - INTERVAL '1 day');

-- Get the debate IDs for speakers
DO $$
DECLARE
    debate1_id UUID;
    debate2_id UUID;
    speaker1_id UUID;
    speaker2_id UUID;
BEGIN
    -- Get debate IDs
    SELECT id INTO debate1_id FROM debate WHERE title = 'Presidential Debate 2024';
    SELECT id INTO debate2_id FROM debate WHERE title = 'Climate Change Discussion';
    
    -- Insert speakers
    INSERT INTO speaker (name, role, debate_id) VALUES 
        ('John Candidate', 'Democratic Nominee', debate1_id),
        ('Jane Opponent', 'Republican Nominee', debate1_id),
        ('Dr. Climate Expert', 'Climate Scientist', debate2_id),
        ('Policy Maker', 'Government Official', debate2_id);
    
    -- Get speaker IDs for sample claims
    SELECT id INTO speaker1_id FROM speaker WHERE name = 'John Candidate';
    SELECT id INTO speaker2_id FROM speaker WHERE name = 'Jane Opponent';
    
    -- Insert sample claims
    INSERT INTO claim (text, timestamp, debate_id, speaker_id) VALUES 
        ('Unemployment rate has decreased by 2% in the last year', NOW() - INTERVAL '30 minutes', debate1_id, speaker1_id),
        ('Crime rates in major cities have increased by 15%', NOW() - INTERVAL '25 minutes', debate1_id, speaker2_id);
END $$;
