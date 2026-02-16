const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const zipFile = path.join(__dirname, 'function.zip');
const sourceDir = __dirname;

if (fs.existsSync(zipFile)) {
  console.log('Removing existing function.zip...');
  try {
    fs.unlinkSync(zipFile);
  } catch (err) {
    console.log('Could not remove existing zip, will overwrite...');
  }
}

console.log('Creating function.zip using archiver...');

const output = fs.createWriteStream(zipFile);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  const stats = fs.statSync(zipFile);
  console.log(`✓ function.zip created successfully (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  Total bytes: ${archive.pointer()}`);
});

archive.on('error', (err) => {
  console.error('Error creating zip:', err);
  process.exit(1);
});

archive.pipe(output);

archive.file(path.join(sourceDir, 'index.js'), { name: 'index.js' });

const nodeModulesPath = path.join(sourceDir, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('Adding node_modules...');
  archive.directory(nodeModulesPath, 'node_modules');
} else {
  console.warn('⚠ node_modules not found, creating zip with index.js only');
  console.warn('⚠ Note: You may need to add @aws-sdk/client-s3 as a Lambda layer');
}

archive.finalize();
