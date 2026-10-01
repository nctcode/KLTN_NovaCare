/** Validates an explicitly reviewed corpus and optionally precomputes model embeddings.
 * npx ts-node scripts/import-screening-knowledge.ts input.json output.json [--embed]
 * No implicit approval, scraping, patient indexing, or fake embedding fallback.
 */
import 'dotenv/config';
import { readFile, writeFile, rename } from 'fs/promises';
import { resolve } from 'path';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ScreeningLLMService } from '../src/modules/ai/services/screening-llm.service';
import { validateEvidenceChunk } from '../src/modules/ai/services/clinical-evidence.service';

async function main() {
  const [, , source, destination, flag] = process.argv;
  if (!source || !destination || (flag && flag !== '--embed'))
    throw new Error(
      'Usage: ts-node scripts/import-screening-knowledge.ts input.json output.json [--embed]'
    );
  if (resolve(source) === resolve(destination))
    throw new Error('Keep the reviewed source separate from the generated index.');
  const corpus = JSON.parse(await readFile(source, 'utf8'));
  if (typeof corpus.version !== 'string' || !Array.isArray(corpus.chunks) || !corpus.chunks.length)
    throw new Error('Corpus requires version and non-empty chunks.');
  const seen = new Set<string>();
  const llm = new ScreeningLLMService(new ConfigService());
  for (const chunk of corpus.chunks) {
    chunk.contentHash = createHash('sha256').update(String(chunk.text)).digest('hex');
    if (!validateEvidenceChunk(chunk) || seen.has(chunk.id))
      throw new Error(`Invalid or duplicate chunk: ${String(chunk.id)}`);
    if (chunk.reviewStatus !== 'APPROVED' || Date.parse(chunk.expiresAt) <= Date.now())
      throw new Error(`Needs clinical review or renewal: ${chunk.id}`);
    seen.add(chunk.id);
    delete chunk.embedding;
    delete chunk.embeddingModel;
    if (flag === '--embed') {
      chunk.embedding = await llm.embed(`${chunk.title}\n${chunk.section}\n${chunk.text}`);
      chunk.embeddingModel = llm.embeddingModel;
    }
  }
  const temporary = `${resolve(destination)}.tmp`;
  await writeFile(temporary, JSON.stringify(corpus, null, 2) + '\n');
  await rename(temporary, resolve(destination));
  console.log(
    `Published ${corpus.chunks.length} reviewed chunks (${corpus.version}), mode=${flag ? 'HYBRID' : 'LEXICAL'}`
  );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Import failed');
  process.exitCode = 1;
});
