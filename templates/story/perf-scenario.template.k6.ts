// Template for a k6 perf scenario. Replace the body and thresholds for the Story.
// Until executable, keep it minimal; the control plane reports it as scaffold.
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: { http_req_duration: ['p(95)<5000'] }, // e.g. G-X: P95 ≤ 5s
};

export default function () {
  const res = http.get('http://localhost:3000/'); // point at the system under test
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
