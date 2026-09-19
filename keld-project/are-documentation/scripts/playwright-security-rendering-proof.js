async page => {
  const requests = [];
  const consoleIssues = [];
  const userText = '<svg onload="window.__userExecuted=1"><a href="https://evil.example/user">user link</a></svg>';
  const modelText = '<script>window.__modelExecuted=1</script><img src="https://evil.example/model" onerror="window.__modelExecuted=2"><a href="https://evil.example/answer">answer link</a>';
  page.on('request', request => requests.push({url: request.url(), method: request.method()}));
  page.on('console', message => {
    if (message.type() === 'error' || message.type() === 'warning') consoleIssues.push({type: message.type(), text: message.text()});
  });
  await page.route('**/api/are/status', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({configured: true, persistence: 'process-memory', idle_retention_seconds: 5400}),
  }));
  await page.route('**/api/are/chat', async route => {
    const submitted = route.request().postDataJSON();
    if (submitted.text !== userText || Object.hasOwn(submitted, 'conversation_id')) {
      return route.fulfill({status: 400, contentType: 'application/json', body: JSON.stringify({error: 'unexpected-request'})});
    }
    const state = {preferences: [], routes: [], learned_route_rules: 0, turns_remaining: 19, context_messages: 2};
    const lines = [
      {type: 'session', conversation_id: '11111111-1111-4111-8111-111111111111', session_token: 'fixture-session-token', state},
      {type: 'status', phase: 'replying'},
      {type: 'message', text: modelText},
      {type: 'done'},
    ];
    return route.fulfill({status: 200, contentType: 'application/x-ndjson', body: `${lines.map(line => JSON.stringify(line)).join('\n')}\n`});
  });
  await page.goto('http://127.0.0.1:14194/are/', {waitUntil: 'networkidle'});
  await page.locator('.live-session-panel > summary').click();
  const retentionText = await page.locator('.live-state-detail p').last().textContent();
  if (!retentionText?.includes('Temporary state expires after 90 minutes of inactivity.')) throw new Error('configured-retention-not-disclosed');
  await page.getByLabel('Message the agent').fill(userText);
  await page.getByRole('button', {name: 'Send ↑'}).click();
  await page.locator('.live-answer').filter({hasText: modelText}).waitFor();
  const rendering = await page.evaluate(({userText, modelText}) => {
    const answer = document.querySelector('.live-answer');
    const user = document.querySelector('.live-user p');
    return {
      modelExecuted: window.__modelExecuted ?? null,
      userExecuted: window.__userExecuted ?? null,
      answerScripts: answer?.querySelectorAll('script').length ?? -1,
      answerImages: answer?.querySelectorAll('img').length ?? -1,
      answerLinks: answer?.querySelectorAll('a').length ?? -1,
      userMarkup: user?.children.length ?? -1,
      answerExact: answer?.textContent === modelText,
      userExact: user?.textContent === userText,
    };
  }, {userText, modelText});
  const externalRequests = requests.filter(request => !request.url.startsWith('http://127.0.0.1:14194/'));
  return {rendering, retentionText, externalRequests, consoleIssues, requests};
}
