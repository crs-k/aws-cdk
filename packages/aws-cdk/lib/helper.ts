// This code is similar to what is present here: tools/@aws-cdk/cdk-build-tools/lib/os.ts
// Please make updates in both files if you are changing the code

/**
 * Renders the command to include escape characters for each platform.
 *
 * @param cmd command
 * @returns rendered command
 */
export function renderCommandLine(cmd: string[]) {
  return renderArguments(cmd).join(' ');
}

/**
 * Render the arguments to include escape characters for each platform.
 *
 * @param cmd command arguments
 * @returns rendered command arguments
 */
export function renderArguments(cmd: string[]) {
  if (process.platform !== 'win32') {
    return doRender(cmd, hasAnyChars(' ', '\\', '!', '"', "'", '&', '$'), posixEscape);
  } else {
    return doRender(cmd, hasAnyChars(' ', '"', '&', '^', '%'), windowsEscape);
  }
}

/**
 * Render a UNIX command line
 */
function doRender(cmd: string[], needsEscaping: (x: string) => boolean, doEscape: (x: string) => string): string[] {
  return cmd.map(x => needsEscaping(x) ? doEscape(x) : x);
}

/**
 * Return a predicate that checks if a string has any of the indicated chars in it
 */
function hasAnyChars(...chars: string[]): (x: string) => boolean {
  return (str: string) => {
    return chars.some(c => str.indexOf(c) !== -1);
  };
}

/**
 * Escape a shell argument for POSIX shells
 *
 * Wrapping in single quotes and escaping single quotes inside will do it for us.
 */
function posixEscape(x: string) {
  // Turn ' -> '"'"'
  x = x.replace(/'/g, "'\"'\"'");
  return `'${x}'`;
}

/**
 * Escape a shell argument for cmd.exe
 *
 * This is how to do it right, but I'm not following everything:
 *
 * https://blogs.msdn.microsoft.com/twistylittlepassagesallalike/2011/04/23/everyone-quotes-command-line-arguments-the-wrong-way/
 */
function windowsEscape(x: string): string {
  // First surround by double quotes, ignore the part about backslashes
  x = `"${x}"`;
  // Now escape all special characters
  const shellMeta = new Set<string>(['"', '&', '^', '%']);
  return x.split('').map(c => shellMeta.has(x) ? '^' + c : c).join('');
}