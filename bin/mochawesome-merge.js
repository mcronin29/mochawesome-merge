#!/usr/bin/env node

const { merge } = require('../lib/index')
const yargs = require('yargs')
const path = require('path')
const fs = require('fs')

yargs
  .command('$0 [files..]', 'Merge report files', yargs => {
    yargs.positional('files', {
      description: 'input files',
      type: 'array',
      alias: ['f'],
    })
  })
  .option('o', {
    alias: 'output',
    demandOption: false,
    describe: 'Output file path',
    type: 'string',
  })
  .option('s', {
    alias: 'stats',
    demandOption: false,
    describe: 'Stats file path',
    type: 'string',
  })
  .option('f', {
    alias: 'files',
    demandOption: false,
    describe: 'Input files',
    type: 'array',
  })
  .help()

const { files, output, stats } = yargs.argv

function formatDuration(duration) {
  const seconds = duration / 1000;
  return seconds.toString();
}

merge({ files }).then(
  report => {
    const content = JSON.stringify(report, null, 2)
    const rawStats = report.stats;
    rawStats.status = "FAILED";
    rawStats.status = report.stats.passPercent > 0 && report.stats.passPercent < 100 ? "PARTIAL FAILURE" : rawStats.status;
    rawStats.status = report.stats.passPercent === 100 ? "SUCCESS" : rawStats.status;
    rawStats.testsRegistered = rawStats.testsRegistered.toString();
    rawStats.passes = rawStats.passes.toString();
    rawStats.failures = rawStats.failures.toString();
    rawStats.passPercent = Math.round(rawStats.passPercent,0).toString();
    rawStats.skipped = rawStats.skipped.toString();
    rawStats.prettyDuration = formatDuration(rawStats.duration);
    rawStats.reportUrl = "test url";
    const statsContent = JSON.stringify(rawStats, null, 2);
  
    if (stats) {
      const statsFilePath = path.resolve(process.cwd(), stats)
      fs.mkdirSync(path.dirname(statsFilePath), { recursive: true })
      fs.writeFileSync(statsFilePath, statsContent, { flag: 'w' })
    }

    if (output) {
      const outputFilePath = path.resolve(process.cwd(), output)
      fs.mkdirSync(path.dirname(outputFilePath), { recursive: true })
      fs.writeFileSync(outputFilePath, content, { flag: 'w' })
      console.info(`Reports merged to ${outputFilePath}`)
    } else {
      process.stdout.write(content)
    }
  },
  error => {
    console.error('ERROR: Failed to merge reports\n')
    console.error(error)
    process.exit(1)
  }
)
