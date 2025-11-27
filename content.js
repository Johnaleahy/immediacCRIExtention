// Create and inject the side panel into LinkedIn pages
(function() {
  // Avoid injecting multiple times
  if (document.getElementById('name-finder-panel')) return;

  // Get the icon URL
  const iconUrl = chrome.runtime.getURL('icons/icon48.png');

  // Create the panel container
  const panel = document.createElement('div');
  panel.id = 'name-finder-panel';
  panel.innerHTML = `
    <div class="nf-header">
      <img src="${iconUrl}" alt="Name Finder" class="nf-icon">
      <h2>Name Finder</h2>
      <button id="nf-toggle" class="nf-toggle-btn">−</button>
    </div>
    <div class="nf-content">
      <input type="text" id="nf-nameInput" placeholder="Enter name to search">
      <button id="nf-searchBtn">Search Site</button>
      <textarea id="nf-messageText" placeholder="Enter your message here..."></textarea>
      <button id="nf-messageBtn">Message</button>
      <div id="nf-result"></div>
    </div>
  `;

  document.body.appendChild(panel);

  // Toggle panel collapse
  let collapsed = false;
  document.getElementById('nf-toggle').addEventListener('click', () => {
    collapsed = !collapsed;
    const content = panel.querySelector('.nf-content');
    const toggleBtn = document.getElementById('nf-toggle');
    if (collapsed) {
      content.style.display = 'none';
      toggleBtn.textContent = '+';
      panel.style.height = 'auto';
    } else {
      content.style.display = 'flex';
      toggleBtn.textContent = '−';
    }
  });

  // Search button handler
  document.getElementById('nf-searchBtn').addEventListener('click', () => {
    const name = document.getElementById('nf-nameInput').value.trim();
    if (!name) {
      document.getElementById('nf-result').textContent = 'Please enter a name';
      return;
    }

    const result = findAndSubmitSearch(name);
    document.getElementById('nf-result').textContent = result.message;
  });

  // Message button handler
  document.getElementById('nf-messageBtn').addEventListener('click', async () => {
    const messageText = document.getElementById('nf-messageText').value.trim();
    const result = await clickMessageAndFill(messageText);
    document.getElementById('nf-result').textContent = result.message;
  });

  // Search function
  function findAndSubmitSearch(name) {
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
    for (const selector of searchSelectors) {
      const input = document.querySelector(selector);
      if (input && input.offsetParent !== null) {
        searchInput = input;
        break;
      }
    }

    if (!searchInput) {
      return { success: false, message: 'No search box found on this page' };
    }

    searchInput.value = name;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));

    const form = searchInput.closest('form');
    if (form) {
      form.submit();
      return { success: true, message: 'Searching...' };
    }

    searchInput.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true
    }));

    return { success: true, message: 'Search submitted' };
  }

  // Message function
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

    if (!messageText) {
      return { success: true, message: 'Clicked Message button' };
    }

    // Wait for the message dialog to open
    await new Promise(resolve => setTimeout(resolve, 1000));

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

    if (messageInput.tagName === 'TEXTAREA' || messageInput.tagName === 'INPUT') {
      messageInput.value = messageText;
      messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      messageInput.focus();
      messageInput.innerHTML = '<p>' + messageText + '</p>';
      messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    return { success: true, message: 'Message filled in!' };
  }
})();
