import { Command } from 'commander';
import { readFileSync } from 'node:fs';

const program = new Command();

program
 .name('survey')
 .description('CLI для роботи з даними опитування з JSON-файлу')
 .version('1.0.0', '-V, --version', 'показати версію програми')
 .option('-f, --file <path>', 'шлях до JSON-файлу', 'data.json')
 .helpOption('-h, --help', 'показати довідку');

 function fail(message) {
    console.error(`Помилка: ${message}`)
    process.exit(1);
 }

 function loadData() {
    const path = program.opts().file;
    let text;
    try{
        text = readFileSync(path, 'utf8');
    } catch (err) {
        if (err.code === 'ENOENT') fail(`файл "${path}" не знайдено`);
    fail(`не вдалося прочитати файл "${path}"`);
    }
    try {
    return JSON.parse(text);
    } catch {
    fail(`файл "${path}" містить некоректний JSON`);
  }
 }

 program
 .command('list')
 .description('показати список респондентів')
 .option('-l, --limit <n>', 'максимальна кількість записів')
 .action((options)=>{
    const data = loadData();
    let items = data.responses;
     if (options.limit !== undefined) {
        const n = Number(options.limit);
         if(!Number.isInteger(n) || n < 1) {
            fail('значення --limit має бути додатним цілим числом');
         }
         items = items.slice(0,n);
     }
       for (const r of items) {
        console.log(`${r.respondentID}  ${r.submittedAt}  (відповідей: ${r.answers.length})`)
       }
 })
 
    program
    .command('show')
    .description('показати одного респондента цілком')
    .argument('<respondentId>', 'ідентифікатор респондента')
    .action((respondentID) => {
        const data = loadData();
        const found = data.responses.find((r) => r.respondentID == respondentID);
        if (!found) {
            fail(`респондента "${respondentID}" не знайдено`);
        }
        console.log(JSON.stringify(found, null, 2));
    }) 

 program.parse();