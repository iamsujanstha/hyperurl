import { AssertionRule, AssertionResult } from './types';

export function evaluateAssertions(result: any, rules: AssertionRule[] = []): AssertionResult[] {
  if (!result || !rules || rules.length === 0) return [];
  
  return rules.map(rule => {
    let passed = false;
    let actual = '';
    let expected = rule.value || '';
    let error = '';

    try {
      switch (rule.type) {
        case 'status': {
          actual = String(result.status);
          if (expected.toLowerCase().endsWith('xx')) {
            const prefix = expected.substring(0, 1);
            passed = String(result.status).startsWith(prefix);
          } else {
            passed = String(result.status) === expected;
          }
          break;
        }
        case 'latency': {
          actual = `${result.responseTime}ms`;
          const expectedMs = parseInt(expected, 10);
          if (!isNaN(expectedMs)) {
            passed = result.responseTime <= expectedMs;
          } else {
            passed = true;
          }
          break;
        }
        case 'body_contains': {
          const bodyText = result.body || '';
          actual = bodyText.length > 50 ? bodyText.substring(0, 50) + '...' : bodyText;
          passed = bodyText.includes(expected);
          break;
        }
        case 'json_path': {
          const jsonPath = rule.extra || '';
          const bodyText = result.body || '';
          actual = 'N/A';
          try {
            const parsed = JSON.parse(bodyText);
            const parts = jsonPath.split('.');
            let current = parsed;
            for (const part of parts) {
              if (current && typeof current === 'object' && part in current) {
                current = current[part];
              } else {
                current = undefined;
                break;
              }
            }
            actual = current === undefined ? 'undefined' : (typeof current === 'object' ? JSON.stringify(current) : String(current));
            if (current !== undefined) {
              if (expected === '*' || expected === '') {
                passed = true;
              } else {
                passed = String(current) === expected;
              }
            } else {
              passed = false;
              error = `Path '${jsonPath}' not found in JSON`;
            }
          } catch (e: any) {
            passed = false;
            error = `Invalid JSON response: ${e.message}`;
          }
          break;
        }
        case 'header_matches': {
          const headerName = (rule.extra || '').toLowerCase();
          const headers = result.headers || {};
          actual = headers[headerName] || '';
          passed = actual.toLowerCase().includes(expected.toLowerCase());
          break;
        }
        case 'graphql_no_errors': {
          const bodyText = result.body || '';
          actual = 'N/A';
          try {
            const parsed = JSON.parse(bodyText);
            if (parsed && typeof parsed === 'object') {
              const hasErrors = Array.isArray(parsed.errors) && parsed.errors.length > 0;
              passed = !hasErrors;
              actual = hasErrors ? `${parsed.errors.length} error(s)` : 'No errors';
              if (hasErrors) {
                error = JSON.stringify(parsed.errors);
              }
            } else {
              passed = false;
              error = 'Response is not a valid JSON object';
            }
          } catch (e: any) {
            passed = false;
            error = `Invalid GraphQL JSON body: ${e.message}`;
          }
          break;
        }
        default:
          passed = true;
          break;
      }
    } catch (e: any) {
      passed = false;
      error = e.message;
    }

    return {
      ruleId: rule.id,
      type: rule.type,
      passed,
      actual,
      expected,
      error
    };
  });
}
