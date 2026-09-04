const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/app/dashboard/admin');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/bg-\[\#141414\]/g, 'bg-white dark:bg-[#141414]');
  content = content.replace(/bg-\[\#0a0a0a\]/g, 'bg-neutral-50 dark:bg-[#0a0a0a]');
  
  // Borders
  content = content.replace(/border-\[\#212327\]/g, 'border-neutral-200 dark:border-[#212327]');
  content = content.replace(/divide-\[\#212327\]/g, 'divide-neutral-200 dark:divide-[#212327]');
  
  // Text colors
  content = content.replace(/text-\[\#7d8187\]/g, 'text-neutral-500 dark:text-[#7d8187]');
  content = content.replace(/text-\[\#dadbdf\]/g, 'text-neutral-600 dark:text-[#dadbdf]');
  
  // Text white -> text-neutral-900 dark:text-white
  content = content.replace(/text-white/g, 'text-neutral-900 dark:text-white');
  
  // Revert buttons that should stay white text
  content = content.replace(/bg-rose-600 text-neutral-900 dark:text-white/g, 'bg-rose-600 text-white');
  content = content.replace(/bg-rose-500 text-neutral-900 dark:text-white/g, 'bg-rose-500 text-white');
  content = content.replace(/bg-emerald-600 text-neutral-900 dark:text-white/g, 'bg-emerald-600 text-white');
  
  // Revert previous double replacements
  content = content.replace(/text-neutral-900 dark:text-neutral-900 dark:text-white/g, 'text-neutral-900 dark:text-white');
  content = content.replace(/text-neutral-900 dark:text-neutral-900 dark:text-white/g, 'text-neutral-900 dark:text-white');
  content = content.replace(/bg-white dark:bg-white dark:bg-\[\#141414\]/g, 'bg-white dark:bg-[#141414]');
  content = content.replace(/bg-neutral-50 dark:bg-neutral-50 dark:bg-\[\#0a0a0a\]/g, 'bg-neutral-50 dark:bg-[#0a0a0a]');
  content = content.replace(/border-neutral-200 dark:border-neutral-200 dark:border-\[\#212327\]/g, 'border-neutral-200 dark:border-[#212327]');
  content = content.replace(/text-neutral-500 dark:text-neutral-500 dark:text-\[\#7d8187\]/g, 'text-neutral-500 dark:text-[#7d8187]');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
