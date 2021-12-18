# effective-loc

This is a small command line program to count the number of files and lines of code in a codebase. It is a demo application of [effective.ts](https://github.com/DavidTimms/effective.ts).

It currently only supports JavaScript, TypeScript and Python.

Call it with the path to a file or directory:

```
effective-loc ./src
```

And it will print a summary of the languages found, like so:

```
TypeScript
---------------------
Files:             1258
Lines of code:   138994
Comment lines:     1451
Blank lines:       7531

JavaScript
---------------------
Files:             4838
Lines of code:  1332347
Comment lines:    90037
Blank lines:      82924
```

Internally, the program uses 8 concurrent work fibers which read file system entries from a shared queue, then process them, potentially adding more file system entries to the back of the queue.
