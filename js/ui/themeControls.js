// Initialize theme controls
function initThemeControls() {
  const themeToggle = document.getElementById('theme-toggle');
  const lightIcon = document.getElementById('light-icon');
  const darkIcon = document.getElementById('dark-icon');
  
  // Check for saved theme preference or use preferred color scheme
  const savedTheme = localStorage.getItem('theme');
  
  // Apply saved theme or detect system preference
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark-mode');
    lightIcon.style.display = 'none';
    darkIcon.style.display = 'block';
  }
  
  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    // Toggle icon visibility
    const isDarkMode = document.body.classList.contains('dark-mode');
    lightIcon.style.display = isDarkMode ? 'none' : 'block';
    darkIcon.style.display = isDarkMode ? 'block' : 'none';
    
    // Save preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  });
}
