function handleLogin(idToken) {
  if (!idToken) throw new Error('Missing ID token');

  const resp = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (resp.getResponseCode() !== 200) throw new Error('Invalid Google sign-in token');
  const payload = JSON.parse(resp.getContentText());

  const email = String(payload.email || '').toLowerCase();
  const hd = payload.hd || (email.endsWith('@' + ALLOWED_DOMAIN) ? ALLOWED_DOMAIN : '');
  if (hd !== ALLOWED_DOMAIN) throw new Error('Please sign in with your @' + ALLOWED_DOMAIN + ' account.');

  const employee = findRowById('Employees', 'Email', email);
  if (!employee) {
    throw new Error('This account isn’t registered yet. Ask a practice admin to add you to the Employees sheet.');
  }

  return {
    email: employee.Email,
    name: employee.Name,
    role: employee.Role || 'employee',
    title: employee.Title || '',
    leaveBalance: employee.LeaveBalance,
    initials: initials(employee.Name),
  };
}

// Every current admin's email — used for approval/notification emails so
// nobody with Role "admin" gets left out. Add or remove admins by editing
// the Employees sheet, not this function.
function adminEmails() {
  return sheetToObjects('Employees').filter((e) => e.Role === 'admin').map((e) => e.Email);
}

function initials(name) {
  const parts = String(name || '').replace(/\(.*?\)/g, '').trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
