'use strict'

const core = require('@actions/core');
const github = require('@actions/github');
const { promises: fs } = require('fs')
const xml2js = require('xml2js');

const parseXml = async (input) => {
  const promise = await new Promise((resolve, reject) => {
    const parser = new xml2js.Parser({ explicitArray: false });

    parser.parseString(input, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
  return promise;
}

const main = async () => {
  const coverageThreshold = parseFloat(core.getInput('coverage-required')) || 0;
  const coverageType = core.getInput('coverage-type').toLowerCase() || 'line'.toLowerCase();
  const path = core.getInput('path');
  if (null == path) {
    core.setFailed(`Not path was found`);
  }
  console.log(`Desired coverage: ${coverageThreshold}`);
  console.log(`Path: ${path}`);
  console.log(`Coverage type: ${coverageType}`);

  const content = await fs.readFile(path, 'utf8');
  const jsobj = await parseXml(content);

  const coverageReport = jsobj.report.counter;
  var achievedCoverage = 0;
  var message = "Coverage Report: \n";
  message = message + "| Type | Covered | Missed | Total | Percentage(%) |\n";
  message = message + "| --- | --- | --- | --- | :---: |\n";
  for (var i = 0; i < coverageReport.length; i++) {
  	var el = coverageReport[i].$;
  	var type = el.type.toLowerCase();
  	
  	const covered = parseInt(el.covered);
  	const missed = parseInt(el.missed);
  	const total = covered + missed;
    var coverage = covered * 1.0 / total;

  	// core.setOutput(type, coverage);
    message = message + `| ${type} | ${covered} | ${missed} | ${total} | ${(coverage * 100).toFixed(2)} |\n`; 
  	if (coverageType.toLowerCase() === type) {
  		core.setOutput("coverage", coverage);
      achievedCoverage = coverage;
  	}
  }

  const github_token = core.getInput('token');
  if (github_token) {
    console.log(`has token - posting comment`);
    const context = github.context;

    if (context.payload.pull_request != null) {
      if (achievedCoverage < coverageThreshold) {
        message = message + `\n\nCoverage is lower than ${(coverageThreshold * 100).toFixed(2)} (was ${(achievedCoverage * 100).toFixed(2)})`;
      } else {
        message = message + `\n\n${coverageType.charAt(0).toUpperCase() + 
           coverageType.slice(1)} coverage achieved! was ${(achievedCoverage * 100).toFixed(2)}% (desired was ${(coverageThreshold * 100).toFixed(2)}%)`;
      }

      const pull_request_number = context.payload.pull_request.number;

      const octokit = github.getOctokit(github_token);
      octokit.issues.createComment({
        ...context.repo,
        issue_number: pull_request_number,
        body: message
      });
    }
  }

  if (achievedCoverage < coverageThreshold) {
    core.setFailed(`coverage is lower than ${coverageThreshold} (was ${achievedCoverage})`);
  }
}

main().catch(err => core.setFailed(err.message))