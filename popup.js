document.getElementById('searchBtn').addEventListener('click', async () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) {
    document.getElementById('result').textContent = 'Please enter a name';
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: findAndSubmitSearch,
      args: [name]
    });

    const result = results[0].result;
    document.getElementById('result').textContent = result.message;
  } catch (err) {
    document.getElementById('result').textContent = 'Error: ' + err.message;
  }
});

document.getElementById('messageBtn').addEventListener('click', async () => {
  const messageText = document.getElementById('messageText').value.trim();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: clickMessageAndFill,
      args: [messageText]
    });

    const result = results[0].result;
    document.getElementById('result').textContent = result.message;
  } catch (err) {
    document.getElementById('result').textContent = 'Error: ' + err.message;
  }
});

function findAndSubmitSearch(name) {
  // Common search input selectors
  const searchSelectors = [
    'input[type="search"]',
    'input[name="q"]',
    'input[name="query"]',
    'input[name="search"]',
    'input[name="s"]',
    'input[placeholder*="search" i]',
    'input[placeholder*="find" i]',
    'input[aria-label*="search" i]',
    'input[id*="search" i]',
    'input[class*="search" i]',
    'header input[type="text"]',
    'nav input[type="text"]',
    '[role="search"] input'
  ];

  let searchInput = null;

  // Try each selector until we find a search box
  for (const selector of searchSelectors) {
    const input = document.querySelector(selector);
    if (input && input.offsetParent !== null) { // Check it's visible
      searchInput = input;
      break;
    }
  }

  if (!searchInput) {
    return { success: false, message: 'No search box found on this page' };
  }

  // Fill in the search box
  searchInput.value = name;
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));

  // Try to submit the search
  const form = searchInput.closest('form');
  if (form) {
    form.submit();
    return { success: true, message: 'Searching...' };
  }

  // If no form, try pressing Enter
  searchInput.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true
  }));

  return { success: true, message: 'Search submitted' };
}

async function clickMessageAndFill(messageText) {
  let clicked = false;

  // Method 1: Search artdeco button spans for "Message"
  const artdecoSpans = document.querySelectorAll('span.artdeco-button__text');
  for (const span of artdecoSpans) {
    if (span.textContent.trim() === 'Message') {
      const clickable = span.closest('button, a, [role="button"]') || span;
      clickable.click();
      clicked = true;
      break;
    }
  }

  // Method 2: Search ALL spans for "Message"
  if (!clicked) {
    const spans = document.querySelectorAll('span');
    for (const span of spans) {
      if (span.textContent.trim() === 'Message') {
        const clickable = span.closest('button, a, [role="button"]') || span;
        clickable.click();
        clicked = true;
        break;
      }
    }
  }

  // Method 3: Search buttons with aria-label containing "message"
  if (!clicked) {
    const buttons = document.querySelectorAll('button[aria-label*="message" i], button[aria-label*="Message"]');
    if (buttons.length > 0) {
      buttons[0].click();
      clicked = true;
    }
  }

  // Method 4: Search for any element containing just "Message" text
  if (!clicked) {
    const allElements = document.querySelectorAll('button, a, [role="button"]');
    for (const el of allElements) {
      if (el.textContent.trim() === 'Message') {
        el.click();
        clicked = true;
        break;
      }
    }
  }

  if (!clicked) {
    // Debug: find all spans and buttons to see what's on the page
    const allSpans = document.querySelectorAll('span');
    const messageSpans = Array.from(allSpans)
      .filter(s => s.textContent.toLowerCase().includes('message'))
      .map(s => s.textContent.trim().substring(0, 30))
      .slice(0, 5);

    return {
      success: false,
      message: 'No Message button found. Spans with "message": ' + (messageSpans.join(', ') || 'none')
    };
  }

  // If no message text provided, just return after clicking
  if (!messageText) {
    return { success: true, message: 'Clicked Message button' };
  }

  // Wait for the message dialog to open and fill in the message
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Try common message input selectors
  const messageSelectors = [
    'div[contenteditable="true"]',
    'textarea[name*="message"]',
    'textarea[placeholder*="message" i]',
    '.msg-form__contenteditable',
    '[role="textbox"]'
  ];

  let messageInput = null;
  for (const selector of messageSelectors) {
    const input = document.querySelector(selector);
    if (input) {
      messageInput = input;
      break;
    }
  }

  if (!messageInput) {
    return { success: true, message: 'Clicked Message but could not find message input' };
  }

  // Fill in the message
  if (messageInput.tagName === 'TEXTAREA' || messageInput.tagName === 'INPUT') {
    messageInput.value = messageText;
    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // For contenteditable divs (like LinkedIn)
    // Clear the placeholder content and insert message in a paragraph
    messageInput.focus();
    messageInput.innerHTML = '<p>' + messageText + '</p>';
    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  return { success: true, message: 'Message filled in!' };
}
