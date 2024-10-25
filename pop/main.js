function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.getElementById('mobile-menu');
    
    hamburger.classList.toggle('active');
    menu.classList.toggle('active');
  }
  