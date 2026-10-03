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

    program
    .command('field')
    .description('показати значення поля за шляхом, наприклад questions.1.options')
    .argument('<path>', 'шлях до поля через крапку')
    .action((fieldPath) => {
    const data = loadData();
    let current = data;
    for (const key of fieldPath.split('.')) {
      if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key)) {
        fail(`поле "${fieldPath}" не знайдено (зупинились на "${key}")`);
      }
      current = current[key];
    }
    console.log(JSON.stringify(current, null, 2));
  });

  program
  .command('answers')
  .description('показати відповіді всіх респондентів на обране питання')
  .argument('<questionId>', 'номер (id) питання')
  .action((questionIdText) => {
    const data = loadData();
    const questionId = Number(questionIdText);
    if (!Number.isInteger(questionId)) {
      fail('id питання має бути цілим числом');
    }
    const question = data.questions.find((q) => q.id === questionId);
    if (!question) {
      fail(`питання з id ${questionId} не знайдено`);
    }
    console.log(`Питання ${question.id}: ${question.text}`);
    for (const r of data.responses) {
      const answer = r.answers.find((a) => a.questionId === questionId);
      let shown;
      if (!answer || answer.value === null) {
        shown = '(без відповіді)';
      } else if (Array.isArray(answer.value)) {
        shown = answer.value.join(', ');
      } else {
        shown = String(answer.value);
      }
      console.log(`  ${r.respondentID}: ${shown}`);
    }
  });

  program
  .command('respondent')
  .description('показати всі відповіді респондента разом з текстом питань')
  .argument('<respondentId>', 'ідентифікатор респондента')
  .action((respondentId) => {
    const data = loadData();
    const found = data.responses.find((r) => r.respondentID === respondentId);
    if (!found) {
      fail(`респондента "${respondentId}" не знайдено`);
    }
    console.log(`Респондент: ${found.respondentID} (${found.submittedAt})`);
    for (const a of found.answers) {
      const question = data.questions.find((q) => q.id === a.questionId);
      const text = question ? question.text : `(питання ${a.questionId} не знайдено)`;
      let shown;
      if (a.value === null) {
        shown = '(без відповіді)';
      } else if (Array.isArray(a.value)) {
        shown = a.value.join(', ');
      } else {
        shown = String(a.value);
      }
      console.log(`  ${a.questionId}. ${text}`);
      console.log(`     Відповідь: ${shown}`);
    }
  });

 program.parse();