import { expect, test } from 'vitest';
import { LoggerImpl } from '.';

test('DEBUG', () => {
  const logger = new LoggerImpl({ logLevel: 'DEBUG' });

  expect(logger.debug({})).toBe(true);
  expect(logger.info({})).toBe(true);
  expect(logger.warn({})).toBe(true);
  expect(logger.error({})).toBe(true);
});

test('INFO', () => {
  const logger = new LoggerImpl({ logLevel: 'INFO' });

  expect(logger.debug({})).toBe(false);
  expect(logger.info({})).toBe(true);
  expect(logger.warn({})).toBe(true);
  expect(logger.error({})).toBe(true);
});

test('WARN', () => {
  const logger = new LoggerImpl({ logLevel: 'WARN' });

  expect(logger.debug({})).toBe(false);
  expect(logger.info({})).toBe(false);
  expect(logger.warn({})).toBe(true);
  expect(logger.error({})).toBe(true);
});

test('ERROR', () => {
  const logger = new LoggerImpl({ logLevel: 'ERROR' });

  expect(logger.debug({})).toBe(false);
  expect(logger.info({})).toBe(false);
  expect(logger.warn({})).toBe(false);
  expect(logger.error({})).toBe(true);
});
