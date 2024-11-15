import { checkCurrentAwsAccount } from '@classmethod/aws-util';
import { config } from 'dotenv';
import inquirer from 'inquirer';
import { helloWorldTask } from './task/hello-world-task';

const tasks = ['Hello world task'] as const;
type Task = (typeof tasks)[number];

const main = async (): Promise<void> => {
  const {
    currentAwsAccount: { stageName, accountId },
  } = await checkCurrentAwsAccount();
  process.env.STAGE_NAME = stageName;

  const name = `タスクを選択。stageName=${stageName},accountId=${accountId}`;
  const taskAnswers = await inquirer.prompt([
    {
      type: 'list',
      name,
      choices: tasks,
    },
  ]);
  const task: Task = taskAnswers[name];

  await inquirer.prompt([
    {
      type: 'confirm',
      name: `実行しますか？stageName=${stageName},accountId=${accountId},task=${task}`,
    },
  ]);

  switch (task) {
    case 'Hello world task': {
      await helloWorldTask();
      break;
    }

    default: {
      throw new Error(`Invalid task. task=${task}`);
    }
  }
};

config({ path: '.env.cli' });
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
