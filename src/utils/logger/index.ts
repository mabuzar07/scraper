import chalk from "chalk";
import { objectifyErrorObject } from "utils/error-formatter";
import { v4 } from "uuid";
import winston from "winston";

const stripAnsi = (() => {
  const pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
  ].join("|");
  const regex = new RegExp(pattern, "g");
  return (str: string) => {
    return str.replace(regex, "");
  };
})();

const errorObjectFormat = winston.format((info) => {
  if (info.error instanceof Error) {
    info.error = objectifyErrorObject(info.error);
  }
  return info;
});

/*
 * Simple helper for stringifying all remaining
 * properties.
 */
function rest(info: Record<string, unknown>): string {
  if (Object.keys(info).length === 0) {
    return "";
  }

  info.level = stripAnsi(info.level as string);
  info.logDate = new Date();

  delete info.message;
  delete info.level;

  return chalk.grey(`\n${JSON.stringify(info)}`);
}

export const logger: winston.Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "silly",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        errorObjectFormat(),
        winston.format.colorize(),
        winston.format.printf((info) => `[${info.level}] ${info.message}${rest(info)}`)
      ),
      silent: process.env.NODE_ENV === "test",
    }),
  ],
  defaultMeta: {
    executionId: v4(),
  },
});
