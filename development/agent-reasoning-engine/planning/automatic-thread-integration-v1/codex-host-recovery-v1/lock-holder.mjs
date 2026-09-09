// flock owns the OS lock. Parent death closes stdin and releases it without stale-PID guesses.
process.stdout.write('locked\n');
process.stdin.resume();
