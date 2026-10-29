# Private enquiry capture

## Architecture and activation status

The site remains on GitHub Pages and bridgeproperties.ae. No domain migration or paid CRM
is needed. The new client calls an owner-run Google Apps Script web app, which writes to
a restricted Google Sheet. WhatsApp remains a separate contact option. There are no
Google credentials, Sheet IDs or contact records in public website code.

**Shipped disabled until a production write is verified.** `lead-config.js` has
`enabled: false`. Existing WhatsApp behavior is preserved in that state. A PR or a merge
alone does not activate storage. Local tests use simulated Google services; they do not
prove that a deployed endpoint, Google permissions or browser CORS works.

## One-time owner setup

1. Open https://script.google.com/home/start using the Google account that should own leads.
2. Create a standalone project named “Bridge Properties Lead Capture”.
3. Replace Code.gs with backend/Code.gs. In Project Settings enable the manifest view;
   replace appsscript.json with backend/appsscript.json.
4. Run `setup` in the editor and authorize the spreadsheet permission. This creates
   “Bridge Properties — Private Enquiries”. Run setup again to return the same Sheet URL.
   The script property SHEET_ID identifies it; SIGNING_KEY is generated server-side.
   Never copy either into GitHub. Do not deploy any function that reads leads publicly.
5. Open the Sheet and confirm Share → General access is **Restricted**, owner correct,
   no public/domain/link permissions. Grant only named advisors who need access.
   Never publish the Sheet to the web. Enable Google account two-step verification.
6. Deploy → New deployment → Web app → Execute as **Me** → Who has access **Anyone**.
   This exposes only the submission service, not the Sheet. If the Google Workspace
   administrator disallows anonymous web apps, stop and choose a different backend.
   Copy the production URL ending /exec, not the /dev editor test URL.
7. In a local preview set lead-config.js endpoint to that URL and enabled to true.
   Use the real website origin for the final test; localhost is deliberately not allowed.
   For a temporary preview, add its exact HTTPS origin to ORIGINS and remove it afterward.
   Deploy a new Apps Script version after code changes.
8. Complete every live check below. Only then commit the verified endpoint and
   enabled=true to the website branch, merge and verify GitHub Pages deployment.
   The endpoint is public, so it is not a credential. Do not put OAuth tokens in config.

## Mandatory live checks (owner account)

- Submit a clearly marked synthetic TEST enquiry with consent checked and campaign tags
  `?utm_source=smoke-test&utm_medium=qa&utm_campaign=lead-capture`.
- Confirm one row actually appears: both timestamps, name/phone, project/interest/budget,
  source/medium/campaign, consent version and status New. Then confirm receipt appears
  on the website. Test on a phone and in an incognito browser without Google sign-in.
- Do not send the WhatsApp message: the row must still remain in the Sheet.
- Click WhatsApp and verify the reference and entered details are in the draft.
- Test the homepage, a project page and /az/. Switch EN/RU/AZ on the homepage.
- Retry the identical request with the same UUID: one row, not two. A timeout after a
  write must also be safe to retry. Changed details receive a new UUID.
- Uncheck consent: browser blocks submission; a crafted request without consent is
  rejected by the server. Fill the honeypot: server rejects without creating a row.
- Disconnect network: no success claim, entries remain available for retry and the
  separate WhatsApp link still works. Do not use fetch mode no-cors: it hides failures.
- Log out/open the Sheet URL in incognito: no lead rows should be readable.
- Change follow-up status in the Sheet. This is an owner/advisor edit, never public API.
- Delete only your synthetic test rows when finished.

If CORS, redirects or an account policy prevent the browser from reading a JSON
acknowledgment, leave capture disabled. Do not replace confirmation with a blind
request or hidden iframe load event. Google deployments must be tested in-browser.

## Operations, privacy and limitations

- Follow-up statuses: New, Contacted, Qualified, Viewing booked, Won, Lost,
  Do not contact. Assigned to, Next follow-up and Notes are editable privately.
- Use whole-row filters/filter views. Keep the header names/ordering intact. The
  server fails closed on a schema mismatch. Do not sort only one column.
- Consent is specific to responding to the enquiry; no marketing subscription is
  inferred. The privacy notice explains Google processing and optional WhatsApp.
- Review closed leads monthly and delete those older than 12 months unless a
  transaction or other applicable requirement justifies keeping them. This review
  is an owner task; no automatic deletion or recurring task has been enabled.
- No contact details in localStorage, URLs, analytics or server logs. Session storage
  contains only marketing attribution. Only referral host and page paths are retained,
  not full referrer URLs. Do not place personal data in UTM tags.
- Public input validation, body/field limits, honeypot, signed 30-minute challenge,
  minimum two-second challenge age, UUID deduplication, write lock, formula-injection
  protection, three submissions per phone/hour and 200 total/rolling day.
- Origin allowlisting is a browser guard, not proof of human identity. Bots can
  imitate browser requests and request challenges. Apps Script does not expose a
  trusted client IP here. These controls limit storage abuse but cannot prevent
  execution-quota exhaustion or determined bot traffic. Add a server-verified
  CAPTCHA or move to an edge backend with IP throttling if abuse occurs.
- Google quotas and availability apply; no always-on SLA. No subscription is added
  by this code. Review Apps Script executions and Sheet activity if leads stop saving.
  There are no notification emails or paid integrations.

## Rollout and rollback

Run `npm test` with the declared jsdom dependency installed. Merge the feature branch
only when reviewed. It is safe to deploy the disabled version to GitHub Pages.
Activation is a separate config change after the mandatory live checks. After merging,
check the repository's Pages deployment and the form on bridgeproperties.ae.

To roll back, set enabled=false and redeploy the website. Existing lead rows remain
private and intact; forms return to their original WhatsApp behavior. If abused,
archive the Apps Script web-app deployment too. Do not delete the Sheet to disable capture.

Official references:
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/guides/content
- https://developers.google.com/apps-script/guides/services/quotas
- https://developers.google.com/apps-script/reference/lock/lock-service
