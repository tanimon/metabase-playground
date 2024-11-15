export type Outputted = boolean;

/**
 * ロガー
 * 各ログレベルは『システム運用アンチパターン』の「3.5.2 何を記録すべきか？」を参考
 *
 * @interface Logger
 */
export interface Logger {
  /**
   * プログラム内で起こっていることに関連するあらゆる情報。デバッグのためのメッセージなど
   *
   * @param {object} obj
   * @memberof Logger
   */
  debug(obj: object): Outputted;
  /**
   * ユーザが開始したアクションや、スケジュールされたタスクの実行、システムのスタートアップやシャットダウンなどのシステム操作
   *
   * @param {object} obj
   * @memberof Logger
   */
  info(obj: object): Outputted;
  /**
   * 将来的にエラーになる可能性の状態。ライブラリ廃止警告、使用可能リソースの不足、パフォーマンス低下など
   *
   * @param {object} obj
   * @memberof Logger
   */
  warn(obj: object): Outputted;
  /**
   * すべてのエラー状態
   *
   * @param {object} obj
   * @memberof Logger
   */
  error(obj: object): Outputted;
}
