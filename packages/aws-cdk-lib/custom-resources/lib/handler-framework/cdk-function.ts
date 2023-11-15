import * as semver from 'semver';
import { Construct } from 'constructs';
import { Function, FunctionOptions, Runtime } from '../../../aws-lambda';
import { CdkHandler } from './cdk-handler';
import { Lazy } from '../../../core';

/**
 *
 */
export interface CdkFunctionProps extends FunctionOptions {
  /**
   *
   */
  readonly cdkHandler: CdkHandler,
}

export class CdkFunction extends Function {
  private static readonly DEFAULT_RUNTIME = Runtime.NODEJS_LATEST;

  public constructor(scope: Construct, id: string, props: CdkFunctionProps) {
    super(scope, id, {
      runtime: Lazy.any(
        { produce: () => this.determineRuntime(props.cdkHandler.compatibleRuntimes) },
      ) as unknown as Runtime,
      code: props.cdkHandler.code,
      handler: props.cdkHandler.handler,
      ...props,
    });
  }

  private determineRuntime(compatibleRuntimes: Runtime[]) {
    const compatibleRuntimesLength = compatibleRuntimes.length;
    if (compatibleRuntimesLength < 1) {
      throw new Error('`cdkHandler` must specify at least 1 compatible runtime');
    }

    if (compatibleRuntimes.some(runtime => runtime.runtimeEquals(CdkFunction.DEFAULT_RUNTIME))) {
      return CdkFunction.DEFAULT_RUNTIME;
    }

    const sliceStart = 'nodejs'.length;
    let latestRuntime = compatibleRuntimes[0];
    for (let idx = 1; idx < compatibleRuntimesLength; idx++) {
      const runtime = compatibleRuntimes[idx];
      if (semver.gte(runtime.name.slice(sliceStart), latestRuntime.name.slice(sliceStart))) {
        latestRuntime = runtime;
      }
    }

    if (latestRuntime.isDeprecated) {
      throw new Error('Latest compatible runtime is deprecated');
    }

    return latestRuntime;
  }
}
