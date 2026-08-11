const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walk(dirFile, filelist);
    } else if (dirFile.endsWith('.jsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walk('client/src');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const inner = match[1].trim();
    if (fullTag.includes('aria-label') || fullTag.includes('aria-labelledby')) continue;
    // If inner contains only tags and no text
    const textOnly = inner.replace(/<[^>]+>/g, '').trim();
    if (textOnly === '') {
      console.log(`Missing aria-label in ${file}: ${fullTag.split('\n')[0]}`);
    }
  }
});
