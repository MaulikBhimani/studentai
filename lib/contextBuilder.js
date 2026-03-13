export function buildContextString(portalSession) {
  if (!portalSession || !portalSession.subjects.length) {
    return 'No portal data available.';
  }

  let context = `Portal URL: ${portalSession.portalUrl}\n\n`;

  portalSession.subjects.forEach(subject => {
    context += `Subject: ${subject.name}\n`;
    
    if (subject.files.length > 0) {
      context += `  Files:\n`;
      subject.files.forEach(f => {
        context += `    - ${f.title} (Uploaded: ${f.date || 'unknown'})\n`;
      });
    }

    if (subject.assignments.length > 0) {
      context += `  Assignments:\n`;
      subject.assignments.forEach(a => {
        context += `    - ${a.title} (Due: ${a.dueDate || 'unknown'})\n`;
      });
    }
    context += `\n`;
  });

  return context.trim();
}
