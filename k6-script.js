import http from 'k6/http';                  // For making HTTP requests
import { group, check, sleep } from 'k6';     // For grouping, making checks, and adding sleep
import { Trend, Counter } from 'k6/metrics';  // For tracking custom metrics
import { exec } from 'k6/execution';          // For controlling virtual user execution
import { random } from 'k6';                  // For generating random values (if needed)
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { jUnit } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

// Global Variables and Options
export let options = { maxRedirects: '<maxredirects>', iterations: '<iterations>', vus: '<virtualusers>', duration: '<duration>' };

const baseUrl = 'https://<baseUrl>';
const authUrl = 'https://<authUrl>';;
const helperUrl = 'http://<helperUrl>';
const username = '<username>';
const password = '<password>';
const product = '<product>';
let sessionId, bearerToken;

// Authenticate and Generate SessionId
export function authenticate() {
  let res = http.post(`${authUrl}/auth/api/v1/sessions`, JSON.stringify({
    user: username,
    password: password,
    product: product
  }), { headers: { 'Content-Type': 'application/json' } });

  check(res, {
    'Session created': (r) => r.status === 201,
  });

  const responseData = JSON.parse(res.body);
  sessionId = responseData.sid;
  console.log('Session ID:', sessionId);
}

// Generate Bearer Token
export function generateToken() {
  let res = http.post(`${authUrl}/auth/api/v1/tokens`, null, {
    headers: {
      sid: sessionId
    }
  });

  check(res, {
    'Token generated': (r) => r.status === 200,
  });

  bearerToken = res.body;
  console.log('Bearer Token:', bearerToken);
}

// Perform the actual test execution
export default function() {
  group("Authentication", function() {
    authenticate();
    generateToken();
  });

  group("Product-Brokerstats", function() {
    let res = http.get(`${baseUrl}/rest/api/product/brokerstats/permissions`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'Brokerstats permissions retrieved': (r) => r.status === 200,
    });
  });

  group("Product-DNB", function() {
    let res = http.get(`${baseUrl}/rest/api/product/dnb/quicksearch?search=FIN&instrumentTypes=BON`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'DNB quicksearch with instrument types': (r) => r.status === 200,
    });

    res = http.get(`${baseUrl}/rest/api/product/dnb/quicksearch?search=BOEING&fids=ric,displayName,ticker`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'DNB quicksearch with FIDs': (r) => r.status === 200,
    });
  });

  group("Product-TRDL", function() {
    let res = http.get(`${baseUrl}/rest/api/product/trdl/fidmappings/serialids`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'TRDL fid mappings serial ids': (r) => r.status === 200,
    });

    res = http.get(`${baseUrl}/rest/api/product/trdl/fidmappings`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'TRDL fid mappings': (r) => r.status === 200,
    });
  });

  group("Product-UBS", function() {
    let res = http.get(`${baseUrl}/rest/api/product/ubs/symbols`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'UBS Symbols retrieved': (r) => r.status === 200,
    });

    res = http.get(`${baseUrl}/rest/api/product/ubs/watchlist`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'UBS Watchlist retrieved': (r) => r.status === 200,
    });
  });

  group("RET", function() {
    let res = http.get(`${baseUrl}/rest/api/ret/accounts`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'RET Accounts details': (r) => r.status === 200,
    });
  });

  group("CustomerApp", function() {
    let res = http.get(`${baseUrl}/rest/api/customer/permissions`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'Customer App permissions retrieved': (r) => r.status === 200,
    });
  });

  group("External", function() {
    let res = http.get(`${baseUrl}/rest/api/external/stocktwits`, {
      headers: {
        'jwt': `${bearerToken}`,
      }
    });
    check(res, {
      'External Stocktwits retrieved': (r) => r.status === 200,
    });
  });

  group("Documentation", function() {
    let res = http.get(`${baseUrl}/rest/api/documentation/fids/metadata`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'Documentation metadata retrieved': (r) => r.status === 200,
    });

    res = http.get(`${baseUrl}/rest/api/documentation/api`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'API documentation retrieved': (r) => r.status === 200,
    });

    res = http.get(`${baseUrl}/rest/api/documentation/endpoints`, {
      headers: { 'jwt': `${bearerToken}` }
    });
    check(res, {
      'Endpoints documentation retrieved': (r) => r.status === 200,
    });
  });

  sleep(1);  // Add a small sleep between requests for pacing
}

export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
  };
  return {
    'junit.xml': jUnit(data), // Transform summary and save it as a JUnit XML...
  };
}