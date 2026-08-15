const { createAccountingService, createAccountingApp } = require('./index');

describe('COBOL accounting migration behavior', () => {
  test('TC-01: displays the main menu with the original business options', () => {
    const menu = require('./index').displayMenu();

    expect(menu).toEqual([
      '--------------------------------',
      'Account Management System',
      '1. View Balance',
      '2. Credit Account',
      '3. Debit Account',
      '4. Exit',
      '--------------------------------',
    ]);
  });

  test('TC-02: returns the current balance without changing the stored value', () => {
    const service = createAccountingService(1000);

    expect(service.viewBalance()).toBe('Current balance: 1000.00');
    expect(service.readBalance()).toBe(1000);
  });

  test('TC-03: handles invalid menu selections by returning the validation message', async () => {
    const app = createAccountingApp({
      input: ['0'],
      output: { log: jest.fn(), write: jest.fn() },
    });

    const result = await app.executeChoice('0');

    expect(result).toBe('Invalid choice, please select 1-4.');
  });

  test('TC-04: credits the account and updates the stored balance', () => {
    const service = createAccountingService(1000);

    const result = service.credit(250);

    expect(result).toBe('Amount credited. New balance: 1250.00');
    expect(service.readBalance()).toBe(1250);
  });

  test('TC-05: debits the account when sufficient funds are available', () => {
    const service = createAccountingService(1000);

    const result = service.debit(300);

    expect(result).toBe('Amount debited. New balance: 700.00');
    expect(service.readBalance()).toBe(700);
  });

  test('TC-06: rejects a debit when the account has insufficient funds', () => {
    const service = createAccountingService(100);

    const result = service.debit(200);

    expect(result).toBe('Insufficient funds for this debit.');
    expect(service.readBalance()).toBe(100);
  });

  test('TC-07: preserves balance across multiple transactions in the same session', () => {
    const service = createAccountingService(1000);

    service.credit(250);
    expect(service.viewBalance()).toBe('Current balance: 1250.00');

    service.debit(100);
    expect(service.viewBalance()).toBe('Current balance: 1150.00');
    expect(service.readBalance()).toBe(1150);
  });

  test('TC-08: exits the application when the user selects the exit option', async () => {
    const output = { log: jest.fn(), write: jest.fn() };
    const app = createAccountingApp({
      input: ['4'],
      output,
    });

    const result = await app.run();

    expect(result).toBe('EXIT');
    expect(output.log).toHaveBeenCalledWith('Exiting the program. Goodbye!');
  });

  test('TC-09: data reads return the current stored value and writes persist it for later reads', () => {
    const service = createAccountingService(1000);

    expect(service.readBalance()).toBe(1000);

    service.writeBalance(1500);
    expect(service.readBalance()).toBe(1500);
    expect(service.viewBalance()).toBe('Current balance: 1500.00');
  });

  test('TC-10: the menu loop supports repeated transaction cycles until exit is selected', async () => {
    const output = { log: jest.fn(), write: jest.fn() };
    const app = createAccountingApp({
      input: ['2', '250', '3', '100', '4'],
      output,
    });

    const result = await app.run();

    expect(result).toBe('EXIT');
    expect(app.service.readBalance()).toBe(1150);
    expect(output.log).toHaveBeenCalledWith('Amount credited. New balance: 1250.00');
    expect(output.log).toHaveBeenCalledWith('Amount debited. New balance: 1150.00');
  });
});
