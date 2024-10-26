  document.addEventListener('DOMContentLoaded', () => {
    fetchUsername();  // เรียกฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
});

function fetchUsername() {
    const token = localStorage.getItem('authToken'); // ดึง Token จาก LocalStorage
    console.log('Token:', token); // ตรวจสอบว่า Token ถูกต้อง

    if (!token) {
        console.error('No token found. Please login again.');
        window.location.href = 'login.html';
        return;
    }

    fetch('http://localhost:3000/api/username', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`  // ส่ง Token ผ่าน Header
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch username');
        }
        return response.json();
    })
    .then(data => {
        console.log('Fetched user:', data); // ตรวจสอบข้อมูลที่ได้จาก API
        const usernameElement = document.querySelector('.logo p');
        usernameElement.textContent = data.username || 'ไม่พบชื่อผู้ใช้';
    })
    .catch(error => {
        console.error('Error fetching username:', error);
    });
}



// On page load, initialize meals and probabilities
window.onload = loadMeals;


if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

function logout() {
    localStorage.removeItem('authToken');  // ลบ Token
    localStorage.removeItem('username');   // ลบชื่อผู้ใช้
    alert("You have logged out!");
    window.location.href = "login.html";   // ไปหน้า Login
}



const defaultMeals = [
    { "name": "ผัดไท", "image": "/outputs/padthai.jpg", "probability": 1 },
    { "name": "ตำไทย", "image": "/outputs/som_tum.jpg", "probability": 1 },
    { "name": "ต้มยำกุ้ง", "image": "/outputs/tom_yum_goong.jpg", "probability": 1 },
    { "name": "แกงเขียวหวาน", "image": "/outputs/gaeng_keow_wan.jpg", "probability": 1 },
    { "name": "หมูทอดกระเทียม", "image": "/outputs/moo_tod_garlic.jpg", "probability": 1 }
];

let meals = [];
let currentMeal = null;

// Load meals from MongoDB
async function loadMeals() {
    try {
        const response = await fetch('/api/meals');
        if (!response.ok) throw new Error('Failed to load meals from MongoDB');
        meals = await response.json();
        await ensureDefaultMeals();
    } catch (error) {
        console.error('Error loading meals:', error);
    }
}

// Ensure default meals exist
async function ensureDefaultMeals() {
    const existingMealNames = meals.map(meal => meal.name);
    const missingMeals = defaultMeals.filter(meal => !existingMealNames.includes(meal.name));

    for (const meal of missingMeals) {
        await fetch("/api/meals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(meal)
        });
    }

    const response = await fetch("/api/meals");
    meals = await response.json();
}

// Load meal history from MongoDB (Ordered by latest first)
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const history = await response.json();

        const historyList = document.getElementById('history-list');
        historyList.innerHTML = ''; // Clear the current list

        // Sort the history by timestamp (latest first)
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Populate the history list with sorted items
        history.forEach(item => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="meal-details">
                    <img src="${item.image}" alt="${item.name}" class="meal-image-history">
                    <span>${item.name} - ${new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <button onclick="deleteHistoryItem('${item._id}')">Delete</button>
            `;
            historyList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Delete a specific history item by ID
async function deleteHistoryItem(historyId) {
    if (confirm('Are you sure you want to delete this history item?')) {
        try {
            const response = await fetch(`/api/history/${historyId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('History item deleted successfully!');
                loadHistory(); // Reload the history list after deletion
            } else {
                alert('Failed to delete history item.');
            }
        } catch (error) {
            console.error('Error deleting history item:', error);
        }
    }
}

// Clear all history
async function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        try {
            const response = await fetch('/api/history/clear', {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('All history cleared!');
                loadHistory(); // Reload the history list after clearing
            } else {
                alert('Failed to clear history.');
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }
}

// Randomize a meal
function randomMeal() {
    if (meals.length === 0) return;
    const totalWeight = meals.reduce((sum, meal) => sum + meal.probability, 0);
    let random = Math.random() * totalWeight;

    for (const meal of meals) {
        if (random < meal.probability) {
            currentMeal = meal;
            document.getElementById("meal-name").textContent = meal.name;
            document.getElementById("meal-image").src = meal.image;
            document.getElementById("confirm-btn").style.display = "inline-block";
            hideAddMenuForm();
            return;
        }
        random -= meal.probability;
    }
}

// Add a custom meal
async function addCustomMeal() {
    const mealNameInput = document.getElementById("meal-name-input").value;
    const mealImageInput = document.getElementById("meal-image-input").files[0];

    if (mealNameInput && mealImageInput) {
        const reader = new FileReader();

        reader.onload = async function(e) {
            const newMeal = {
                name: mealNameInput,
                image: e.target.result,
                probability: 1
            };

            // Update the UI with the new meal details
            document.getElementById("meal-name").textContent = mealNameInput;
            document.getElementById("meal-image").src = e.target.result;

            // Add the meal to the list and set it as the current meal
            meals.push(newMeal);
            currentMeal = newMeal;

            // Display the confirm button
            document.getElementById("confirm-btn").style.display = "inline-block";

            try {
                const response = await fetch('/api/meals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMeal)
                });

                if (response.ok) {
                    alert("Meal added successfully!");
                    loadMeals();  // Reload meals after adding
                } else {
                    alert("Failed to add meal.");
                }
            } catch (error) {
                console.error("Error adding meal:", error);
            }

            // Reset the form inputs
            document.getElementById("meal-name-input").value = "";
            document.getElementById("meal-image-input").value = "";

            // Keep the add menu form open
            form.style.display = "flex";
        };

        reader.onerror = function() {
            alert("Error reading the image file.");
        };

        reader.readAsDataURL(mealImageInput);
    } else {
        alert("Please enter a meal name and upload an image.");
    }
}


// Confirm the selected meal
// Confirm the selected meal and hide the add menu form
async function confirmMeal() {
    if (currentMeal) {
        try {
            const historyItem = { 
                name: currentMeal.name, 
                image: currentMeal.image 
            };

            const response = await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(historyItem)
            });

            if (response.ok) {
                alert('Meal confirmed and saved to history!');
                loadHistory(); // Reload history

                // Scroll to the history section
                document.getElementById('history-list').scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('Failed to save history.');
            }
        } catch (error) {
            console.error('Error saving history:', error);
        }

        // Hide the add menu form after confirmation
        hideAddMenuForm();

        currentMeal = null;
        document.getElementById("confirm-btn").style.display = "none";
    }
}

// Randomize a meal and hide the add menu form
function randomMeal() {
    if (meals.length === 0) return; // Ensure meals are loaded
    const totalWeight = meals.reduce((sum, meal) => sum + meal.probability, 0);
    let random = Math.random() * totalWeight;

    for (const meal of meals) {
        if (random < meal.probability) {
            currentMeal = meal;
            document.getElementById("meal-name").textContent = meal.name;
            document.getElementById("meal-image").src = meal.image;
            document.getElementById("confirm-btn").style.display = "inline-block";

            // Hide the add menu form if it was open
            hideAddMenuForm();

            return;
        }
        random -= meal.probability;
    }
}

// Hide the add menu form
function hideAddMenuForm() {
    const form = document.getElementById("add-menu-form");
    form.style.display = "none"; // Hide the form
}

// Toggle the add menu form
function toggleAddMenuForm() {
    const form = document.getElementById("add-menu-form");
    form.style.display = form.style.display === "flex" ? "none" : "flex";

    // Ensure the form is reset whenever toggled open
    if (form.style.display === "flex") {
        document.getElementById("meal-name-input").value = "";
        document.getElementById("meal-image-input").value = "";
    }
}

// Add a custom meal
async function addCustomMeal() {
    const mealNameInput = document.getElementById("meal-name-input").value;
    const mealImageInput = document.getElementById("meal-image-input").files[0];

    if (mealNameInput && mealImageInput) {
        const reader = new FileReader();

        reader.onload = async function(e) {
            const newMeal = {
                name: mealNameInput,
                image: e.target.result,
                probability: 1
            };

            // Update the UI with the new meal details
            document.getElementById("meal-name").textContent = mealNameInput;
            document.getElementById("meal-image").src = e.target.result;

            // Add the meal to the list and set it as the current meal
            meals.push(newMeal);
            currentMeal = newMeal;

            // Display the confirm button
            document.getElementById("confirm-btn").style.display = "inline-block";

            try {
                const response = await fetch('/api/meals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMeal)
                });

                if (response.ok) {
                    alert("Meal added successfully!");
                    loadMeals();  // Reload meals after adding
                } else {
                    alert("Failed to add meal.");
                }
            } catch (error) {
                console.error("Error adding meal:", error);
            }

            // Reset the form inputs
            document.getElementById("meal-name-input").value = "";
            document.getElementById("meal-image-input").value = "";

            // Keep the add menu form minimized
            hideAddMenuForm();
        };

        reader.onerror = function() {
            alert("Error reading the image file.");
        };

        reader.readAsDataURL(mealImageInput);
    } else {
        alert("Please enter a meal name and upload an image.");
    }
}


function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    const hamburger = document.querySelector('.hamburger');

    menu.classList.toggle('active'); // เพิ่ม/ลบคลาส active
    hamburger.classList.toggle('active'); // เพิ่มแอนิเมชันให้กับ hamburger icon
}




// Initialize the page on load
window.onload = function() {
    loadMeals();
    loadHistory();
};

