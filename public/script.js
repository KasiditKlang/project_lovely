let meals = [];
let currentMeal = null;

// Function to fetch meal data from data.json
async function loadMeals() {
    try {
        const response = await fetch('/data.json'); // Ensure the path is correct
        if (!response.ok) throw new Error('Failed to load data.json');
        meals = await response.json();
        loadProbabilities(); // Load stored probabilities after fetching meals
    } catch (error) {
        console.error('Error loading meals:', error);
    }
}

// Function to randomize meal
function randomMeal() {
    if (meals.length === 0) return; // Ensure meals are loaded
    const totalWeight = meals.reduce((sum, meal) => sum + meal.probability, 0);
    let random = Math.random() * totalWeight;
    for (const meal of meals) {
        if (random < meal.probability) {
            currentMeal = meal;
            document.getElementById("meal-name").textContent = meal.name;
            document.getElementById("meal-image").src = meal.image;
            document.getElementById("confirm-btn").style.display = "inline-block"; // Show Confirm button
            return;
        }
        random -= meal.probability;
    }
}

function toggleAddMenuForm() {
    const form = document.getElementById("add-menu-form");
    form.style.display = form.style.display === "flex" ? "none" : "flex";
}

function addCustomMeal() {
    const mealNameInput = document.getElementById("meal-name-input").value;
    const mealImageInput = document.getElementById("meal-image-input").files[0];

    if (mealNameInput && mealImageInput) {
        const reader = new FileReader();
        reader.onload = function(e) {
            meals.push({
                name: mealNameInput,
                image: e.target.result,
                probability: 1 // New meal starts with normal probability
            });
            alert("Meal added successfully!");
            document.getElementById("meal-name-input").value = "";
            document.getElementById("meal-image-input").value = "";
            toggleAddMenuForm();
        };
        reader.onerror = function() {
            alert("Error reading file.");
        };
        reader.readAsDataURL(mealImageInput);
    } else {
        alert("Please enter a meal name and upload an image.");
    }
}

function confirmMeal() {
    if (currentMeal) {
        addToHistory(currentMeal);
        decreaseProbability(currentMeal);

        document.getElementById("confirm-btn").style.display = "none"; // Hide Confirm button after confirming
        currentMeal = null;
    }
}

function addToHistory(meal) {
    const historyList = document.getElementById("history-list");
    const newItem = document.createElement("li");
    newItem.textContent = meal.name;
    historyList.appendChild(newItem);
}

function decreaseProbability(meal) {
    meal.probability *= 0.5; // Decrease by 50%
    saveProbabilities();
}

function saveProbabilities() {
    const mealsData = meals.map(meal => ({
        name: meal.name,
        probability: meal.probability,
        lastConfirmed: Date.now()
    }));
    localStorage.setItem('meals', JSON.stringify(mealsData));
}

function loadProbabilities() {
    const storedMeals = JSON.parse(localStorage.getItem('meals'));
    if (storedMeals) {
        storedMeals.forEach(storedMeal => {
            const meal = meals.find(m => m.name === storedMeal.name);
            if (meal) {
                meal.probability = storedMeal.probability;
                const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds
                const timeSinceLastConfirmed = Date.now() - storedMeal.lastConfirmed;
                if (timeSinceLastConfirmed > oneWeek) {
                    meal.probability = 1; // Reset probability after one week
                }
            }
        });
    }
}

// On page load, initialize meals and probabilities
window.onload = loadMeals;
