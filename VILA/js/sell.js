// Sell page - Category selection and file handling
function selectCategory(el) {
  const tabs = document.querySelectorAll('.category-tab');
  tabs.forEach(t => {
    t.classList.remove('bg-primary', 'text-white', 'border-primary');
    t.classList.add('bg-slate-100', 'text-slate-700');
  });
  el.classList.add('bg-primary', 'text-white', 'border-primary');
  el.classList.remove('bg-slate-100', 'text-slate-700');
}

function handleSimpleFileDisplay(input) {
  const notice = document.getElementById('simpleFileNotice');
  if (input.files && input.files.length > 0) {
    notice.innerHTML = '<span class="text-primary font-bold">' + input.files.length + ' file(s) selected</span>';
  }
}

// Simple interactive tab styling for Department selector
document.addEventListener('DOMContentLoaded', function() {
  const deptButtons = document.querySelectorAll('.dept-btn');
  deptButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      deptButtons.forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary', 'shadow-sm');
        b.classList.add('bg-surface-container', 'text-on-surface');
      });
      btn.classList.add('bg-primary', 'text-on-primary', 'shadow-sm');
      btn.classList.remove('bg-surface-container', 'text-on-surface');
    });
  });
});

function handleFileDisplay(input) {
  const statusText = document.getElementById('uploadStatusText');
  if (input.files && input.files.length > 0) {
    statusText.innerHTML = '<span class="text-primary font-bold">' + input.files.length + ' file(s) attached</span>: ' + Array.from(input.files).map(f => f.name).slice(0, 2).join(', ') + (input.files.length > 2 ? '...' : '');
  }
}