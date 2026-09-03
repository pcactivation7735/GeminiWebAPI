export interface ChromeConfig {
  name: string;
  runtime: string;
  use_system_chrome: boolean;
  chrome_channel: string;
  chrome_path: string;
  headless: boolean;
}

export interface FileDiff {
  filename: string;
  path: string;
  description: string;
  diff: string;
}
