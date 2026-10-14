import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadEnvironment } from '../../config/env';

describe('业务环境变量', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'umi-env-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  test.each([
    ['dev', 'dev'],
    ['uat', 'uat'],
    ['pre', 'pre'],
    ['production', 'prod'],
  ])('读取 %s 环境，隔离其他环境文件', (name, appEnv) => {
    writeFileSync(
      join(directory, `.env.${name}`),
      `APP_ENV=${appEnv}\nAPI_BASE_URL="/${name}/" # 注释\n`,
    );
    writeFileSync(join(directory, '.env.other'), 'API_BASE_URL=/other/\n');

    expect(loadEnvironment(name, directory, {})).toMatchObject({
      name,
      appEnv,
      variables: { APP_ENV: appEnv, API_BASE_URL: `/${name}/` },
    });
  });

  test('环境个人覆盖优先于环境默认值，进程变量具有最高优先级', () => {
    writeFileSync(
      join(directory, '.env.uat'),
      'APP_ENV=uat\nAPI_BASE_URL=/default/\nAPI_PROXY_TARGET=https://default.example.com\n',
    );
    writeFileSync(join(directory, '.env.uat.local'), 'API_BASE_URL=/local/\n');

    expect(loadEnvironment('uat', directory, {}).variables).toMatchObject({
      API_BASE_URL: '/local/',
      API_PROXY_TARGET: 'https://default.example.com',
    });
    expect(loadEnvironment('uat', directory, { API_BASE_URL: '/ci/' }).variables.API_BASE_URL).toBe(
      '/ci/',
    );
  });

  test('拒绝未知环境，避免误用默认接口', () => {
    expect(() => loadEnvironment('unknown', directory, {})).toThrow('不支持的 UMI_ENV');
  });

  test('缺少环境文件时明确报错', () => {
    expect(() => loadEnvironment('uat', directory, {})).toThrow(/\.env\.uat/);
  });

  test.each(['', 'APP_ENV=prod\n'])('环境文件缺少或填写错误标识时拒绝加载：%s', (contents) => {
    writeFileSync(join(directory, '.env.uat'), contents);

    expect(() => loadEnvironment('uat', directory, {})).toThrow('.env.uat 的 APP_ENV 必须为 uat');
  });

  test('进程变量中的错误环境标识不能覆盖当前环境', () => {
    writeFileSync(join(directory, '.env.uat'), 'APP_ENV=uat\n');

    expect(() => loadEnvironment('uat', directory, { APP_ENV: 'prod' })).toThrow('环境标识不匹配');
  });

  test('本地覆盖文件中的错误环境标识不能覆盖当前环境', () => {
    writeFileSync(join(directory, '.env.uat'), 'APP_ENV=uat\n');
    writeFileSync(join(directory, '.env.uat.local'), 'APP_ENV=prod\n');

    expect(() => loadEnvironment('uat', directory, {})).toThrow('环境标识不匹配');
  });
});
