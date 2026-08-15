const readline = require('readline');

const initialBalance = 1000.0;

function displayMenu() {
  return [
    '--------------------------------',
    'Account Management System',
    '1. View Balance',
    '2. Credit Account',
    '3. Debit Account',
    '4. Exit',
    '--------------------------------',
  ];
}

function createAccountingService(initialState = initialBalance) {
  let storageBalance = Number(initialState);

  return {
    readBalance() {
      return storageBalance;
    },
    writeBalance(newBalance) {
      storageBalance = Number(newBalance);
      return storageBalance;
    },
    viewBalance() {
      return `Current balance: ${storageBalance.toFixed(2)}`;
    },
    credit(amount) {
      const numericAmount = Number(amount);
      const updatedBalance = storageBalance + numericAmount;
      storageBalance = updatedBalance;
      return `Amount credited. New balance: ${updatedBalance.toFixed(2)}`;
    },
    debit(amount) {
      const numericAmount = Number(amount);
      if (storageBalance >= numericAmount) {
        const updatedBalance = storageBalance - numericAmount;
        storageBalance = updatedBalance;
        return `Amount debited. New balance: ${updatedBalance.toFixed(2)}`;
      }
      return 'Insufficient funds for this debit.';
    },
  };
}

function createAccountingApp({ input = [], output = console, initialState = initialBalance } = {}) {
  const service = createAccountingService(initialState);
  const inputQueue = Array.isArray(input) ? [...input] : [input];

  const prompt = async (message) => {
    if (typeof output.write === 'function') {
      output.write(message);
    }

    if (inputQueue.length > 0) {
      return inputQueue.shift();
    }

    return '';
  };

  async function executeChoice(choice, providedAmount) {
    const userChoice = Number(choice);

    switch (userChoice) {
      case 1:
        return service.viewBalance();
      case 2: {
        const rawAmount = providedAmount ?? (await prompt('Enter credit amount: '));
        return service.credit(rawAmount);
      }
      case 3: {
        const rawAmount = providedAmount ?? (await prompt('Enter debit amount: '));
        return service.debit(rawAmount);
      }
      case 4:
        return 'EXIT';
      default:
        return 'Invalid choice, please select 1-4.';
    }
  }

  async function run() {
    let continueFlag = true;

    while (continueFlag) {
      const menu = displayMenu();
      menu.forEach((line) => output.log(line));

      const rawChoice = await prompt('Enter your choice (1-4): ');
      const actionResult = await executeChoice(rawChoice);

      if (actionResult === 'EXIT') {
        continueFlag = false;
        output.log('Exiting the program. Goodbye!');
        return 'EXIT';
      }

      if (actionResult) {
        output.log(actionResult);
      }
    }

    return 'EXIT';
  }

  return { service, executeChoice, run, displayMenu };
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const app = createAccountingApp({
    input: [],
    output: {
      log: (message) => console.log(message),
      write: (message) => process.stdout.write(message),
    },
  });

  const question = (promptText) =>
    new Promise((resolve) => {
      rl.question(promptText, (answer) => resolve(answer));
    });

  let continueFlag = true;

  while (continueFlag) {
    displayMenu().forEach((line) => console.log(line));
    const rawChoice = await question('Enter your choice (1-4): ');
    const value = await app.executeChoice(rawChoice);

    if (value === 'EXIT') {
      continueFlag = false;
      console.log('Exiting the program. Goodbye!');
      break;
    }

    console.log(value);
  }

  rl.close();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected application error:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  initialBalance,
  displayMenu,
  createAccountingService,
  createAccountingApp,
};
