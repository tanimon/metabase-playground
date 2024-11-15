/* eslint-disable class-methods-use-this */
/* eslint-disable lines-between-class-members */
/* eslint-disable unused-imports/no-unused-vars */
import { Logger, Outputted } from '.';

export class LoggerDummy implements Logger {
  debug(_obj: object): Outputted {
    return true;
  }

  info(_obj: object): Outputted {
    return true;
  }

  warn(_obj: object): Outputted {
    return true;
  }

  error(_obj: object): Outputted {
    return true;
  }
}
