import {
  ClinicalEvidenceService,
  cosine,
  validateEvidenceChunk,
  evidenceSupportsFacts,
} from '../../ai/services/clinical-evidence.service';
import { ConfigService } from '@nestjs/config';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createHash } from 'crypto';

describe('Reviewed clinical evidence retrieval', () => {
  test('evidence requires matching reviewed criteria, source quote and positive facts', () => {
    const chunk: any = {
      text: 'Đánh giá đau đầu theo diễn tiến.',
      routingCriteria: [
        {
          specialtyCode: 'neurology',
          anySymptoms: ['đau đầu'],
          evidenceQuote: 'Đánh giá đau đầu theo diễn tiến.',
        },
      ],
    };
    const facts: any[] = [{ polarity: 'PRESENT', specialtyCodes: ['neurology'], text: 'đau đầu' }];
    expect(evidenceSupportsFacts(chunk, facts, ['neurology'])).toBe(true);
    expect(evidenceSupportsFacts(chunk, [{ ...facts[0], polarity: 'ABSENT' }], ['neurology'])).toBe(
      false
    );
    expect(
      evidenceSupportsFacts(chunk, [{ ...facts[0], text: 'không đau đầu' }], ['neurology'])
    ).toBe(false);
    expect(evidenceSupportsFacts(chunk, [{ ...facts[0], text: 'chóng mặt' }], ['neurology'])).toBe(
      false
    );
    expect(evidenceSupportsFacts(chunk, facts, ['ent'])).toBe(false);
    expect(evidenceSupportsFacts({ ...chunk, text: 'Thông tin khác.' }, facts, ['neurology'])).toBe(
      false
    );
  });
  let directory: string, file: string;
  const makeChunk = (overrides = {}) => ({
    id: 'head-1',
    title: 'Migraine assessment',
    section: '1',
    sourceUrl: 'https://example.org/guidance',
    version: 'v1',
    text: 'Migraine đau đầu một bên kèm sợ ánh sáng.',
    regionIds: ['head'],
    specialtyCodes: ['neurology'],
    minAge: 18,
    maxAge: 120,
    reviewStatus: 'APPROVED',
    reviewedBy: 'test-reviewer',
    reviewedAt: '2026-01-01',
    expiresAt: '2099-01-01',
    contentHash: createHash('sha256')
      .update('Migraine đau đầu một bên kèm sợ ánh sáng.')
      .digest('hex'),
    ...overrides,
  });
  const publish = (chunks: any[]) =>
    writeFileSync(file, JSON.stringify({ version: 'test-v1', chunks }));
  const setup = () => {
    const llm = { embeddingModel: 'model-1', embed: jest.fn().mockResolvedValue([1, 0]) };
    return {
      llm,
      service: new ClinicalEvidenceService(
        new ConfigService({ SCREENING_KNOWLEDGE_PATH: file }),
        llm as any
      ),
    };
  };
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'novacare-screening-'));
    file = join(directory, 'corpus.json');
    publish([]);
  });
  afterEach(() => {
    unlinkSync(file);
    rmdirSync(directory);
  });
  test('only reviewed and applicable evidence is retrieved', async () => {
    publish([
      makeChunk(),
      makeChunk({ id: 'draft', reviewStatus: 'DRAFT' }),
      makeChunk({ id: 'expired', expiresAt: '2000-01-01' }),
      makeChunk({ id: 'child', minAge: 0, maxAge: 12 }),
    ]);
    const { service } = setup();
    const result = await service.retrieve('Migraine ánh sáng', ['head'], 30, ['neurology']);
    expect(result.chunks.map((c) => c.id)).toEqual(['head-1']);
    expect(result.mode).toBe('LEXICAL');
    expect((await service.retrieve('Migraine', ['head'], null, ['neurology'])).chunks).toEqual([]);
    expect((await service.retrieve('Migraine', ['left_knee'], 30, ['neurology'])).chunks).toEqual(
      []
    );
  });
  test('missing approval or content tampering invalidates corpus', async () => {
    expect(validateEvidenceChunk(makeChunk({ reviewedBy: null }))).toBe(false);
    publish([makeChunk({ text: 'tampered text' })]);
    expect((await setup().service.retrieve('Migraine', ['head'], 30, ['neurology'])).status).toBe(
      'UNAVAILABLE'
    );
  });
  test('duplicate IDs cannot create ambiguous evidence citations', async () => {
    publish([makeChunk(), makeChunk()]);
    expect((await setup().service.retrieve('Migraine', ['head'], 30, ['neurology'])).status).toBe(
      'UNAVAILABLE'
    );
  });
  test('embedding failure degrades to explicitly labeled lexical retrieval', async () => {
    publish([makeChunk({ embeddingModel: 'model-1', embedding: [1, 0] })]);
    const { service, llm } = setup();
    llm.embed.mockRejectedValue(new Error('timeout'));
    const result = await service.retrieve('Migraine', ['head'], 30, ['neurology']);
    expect(result.mode).toBe('LEXICAL');
    expect(result.chunks).toHaveLength(1);
  });
  test('different embedding models are never compared', async () => {
    publish([makeChunk({ embeddingModel: 'different-model', embedding: [1, 0] })]);
    const { service, llm } = setup();
    const result = await service.retrieve('Migraine', ['head'], 30, ['neurology']);
    expect(llm.embed).not.toHaveBeenCalled();
    expect(result.mode).toBe('LEXICAL');
    expect(cosine([1], [1, 0])).toBe(0);
    expect(cosine([0, 0], [1, 0])).toBe(0);
  });
  test('hybrid retrieval returns versioned sources', async () => {
    publish([makeChunk({ embeddingModel: 'model-1', embedding: [1, 0] })]);
    const result = await setup().service.retrieve('Migraine', ['head'], 30, ['neurology']);
    expect(result.mode).toBe('HYBRID');
    expect(result.version).toBe('test-v1');
    expect(result.chunks[0].sourceUrl).toBe('https://example.org/guidance');
  });
});
