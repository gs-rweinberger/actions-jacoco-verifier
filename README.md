# Jacoco verifier action

This action reads the Jacoco report on the given path and checks it the coverage passed the desired threshold. If not, it will fail the check.

## Inputs

### `path`

**Required** The path to the Jacoco xml report.

### `coverage-required`

The coverage needs to pass in order to approve pr. Default is 0.

### `coverage-type`

The type of coverage needs to be checked. Default is `line`.

### `token`

GitHub token to be used when posting a summary of the Jacoco report as a comment on PR.

## Outputs

### `coverage`

The coverage acheived.

## Example usage

uses: gs-rweinberger/actions-jacoco-verifier@v1
with:
  path: 'path-to-jacoco'
  coverage-required: '0.5'
  coverage-type: 'line'
  token: '${{ secrets.GITHUB_TOKEN }}'