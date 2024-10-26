document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent page reload

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();
        if (response.ok) {
            alert('Login successful!');
            localStorage.setItem('authToken', result.token);  // เก็บ Token ใน LocalStorage
            localStorage.setItem('username', username);       // เก็บชื่อผู้ใช้
            window.location.href = 'rndFood.html';            // ไปยังหน้า rndFood
        } else {
            alert(result.error || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }
});