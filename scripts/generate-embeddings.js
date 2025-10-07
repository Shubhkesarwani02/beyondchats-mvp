#!/usr/bin/env node

/**
 * Script to generate embeddings for existing chunks
 */

// Use dynamic import to handle ES modules
async function main() {
  try {
    // Import the required modules
    const { PrismaClient } = await import('@prisma/client');
    const { generateBatchEmbeddings } = await import('../lib/embeddings.js');
    
    const prisma = new PrismaClient();
    
    console.log('🚀 Generating embeddings for existing chunks...\n');
    
    // Get all chunks without embeddings
    const chunksWithoutEmbeddings = await prisma.chunk.findMany({
      where: {
        embedding: null
      },
      select: {
        id: true,
        content: true,
        pdfId: true,
        pageNum: true
      }
    });
    
    console.log(`Found ${chunksWithoutEmbeddings.length} chunks without embeddings`);
    
    if (chunksWithoutEmbeddings.length === 0) {
      console.log('✅ All chunks already have embeddings!');
      await prisma.$disconnect();
      return;
    }
    
    // Process chunks in batches
    const batchSize = 10;
    let processed = 0;
    
    for (let i = 0; i < chunksWithoutEmbeddings.length; i += batchSize) {
      const batch = chunksWithoutEmbeddings.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunksWithoutEmbeddings.length / batchSize)}`);
      
      try {
        // Generate embeddings for the batch
        const texts = batch.map(chunk => chunk.content);
        const embeddings = await generateBatchEmbeddings(texts);
        
        // Update chunks with embeddings
        for (let j = 0; j < batch.length; j++) {
          const chunk = batch[j];
          const embedding = embeddings[j];
          
          // Format embedding as vector string for PostgreSQL
          const embeddingVector = `[${embedding.join(',')}]`;
          
          await prisma.$executeRaw`
            UPDATE "Chunk" 
            SET embedding = ${embeddingVector}::vector 
            WHERE id = ${chunk.id}
          `;
          
          console.log(`  ✅ Updated chunk ${chunk.id} (page ${chunk.pageNum})`);
          processed++;
        }
        
        console.log(`  Batch complete: ${processed}/${chunksWithoutEmbeddings.length} chunks processed`);
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < chunksWithoutEmbeddings.length) {
          console.log('  Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing batch: ${error.message}`);
        // Continue with next batch
      }
    }
    
    console.log(`\n🎉 Embedding generation complete!`);
    console.log(`   Processed: ${processed}/${chunksWithoutEmbeddings.length} chunks`);
    
    // Verify the results
    const chunksWithEmbeddings = await prisma.chunk.count({
      where: {
        embedding: { not: null }
      }
    });
    
    console.log(`   Total chunks with embeddings: ${chunksWithEmbeddings}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);