// This function will be injected and executed in the context of the web page.
const scrapeRecipeFromPage = () => {
        //Recipe Object
    const recipeObj = {
        title: "N/A",
        source: window.location.href,
        servings: "N/A",
        cooktime: "N/A",
        ingredients: [],
        instructions: [],
        savedAt: new Date().toISOString()
    };
    try {
        recipeObj.title = document.querySelector(".tasty-recipes-title")?.textContent?.trim() ?? "N/A";
        recipeObj.cooktime = document.querySelector(".tasty-recipes-total-time")?.textContent?.trim() ?? "N/A";
        //recipeObj.servings = document.querySelector(".label-header-detail servings").textContent.trim();
        const amountSpans = document.querySelectorAll('.tasty-recipes-yield span[data-amount]');
        const amounts = Array.from(amountSpans).map(span => span.dataset.amount);
        recipeObj.servings = amounts[0];

        const allListIngredients = document.querySelectorAll('li[data-tr-ingredient-checkbox]');
        recipeObj.ingredients = Array.from(allListIngredients).map(li => li.textContent.trim()).filter(Boolean);

        const allListInstructions = document.querySelectorAll('li[id^="instruction-step-"]');
        recipeObj.instructions = Array.from(allListInstructions).map(li => li.textContent.trim()).filter(Boolean);

        return { success: true, data: recipeObj };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const btnget = document.querySelector("#btnScrape");

// Event Listener for executing the scraping script in the active tab
btnget.addEventListener("click", async () => {
    const styleQ = document.querySelector("#recipe");
    document.getElementById("recipe").classList.add("active");
    // Get the active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Execute the scraping script in the active tab
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: scrapeRecipeFromPage,
    }, (injectionResults) => {
        // The result from the executed script is an array of InjectionResult objects.
        // We are interested in the first result, which contains the scraped data.
        if (chrome.runtime.lastError) {
            console.error("Script injection failed: ", chrome.runtime.lastError.message);
            return;
        }

        if (injectionResults && injectionResults[0]) {
            const result = injectionResults[0].result;
            if (result.success) {
                console.log("Recipe scraped:", result.data);
                DisplayRecipe(result.data);
            } else {
                console.error("Scraping failed:", result.error);
            }
        } else {
            console.error("Scraping failed: No result from content script.");
        }
    });

    
});

//Display recipe to the UI
const DisplayRecipe = (recipe) => {

    //Querying Container for the recipe info
    const outText = document.querySelector("#recipe");
    
    //Creating recipe title label
    const outTitle = document.createElement("h2");
    outTitle.classList = "recipeInfo";
    outTitle.textContent = recipe.title + " :";
    
    //Creating Total Time to cook label
    const Time = document.createElement("h2");
    Time.textContent = `Total Time: ${recipe.cooktime}`;
    outText.appendChild(outTitle);
    outText.appendChild(Time);

    //Creating ingredients Label
    const Label = document.createElement("h3");
    Label.textContent = "Ingredients :"
    outText.appendChild(Label);

    const ulEl = document.createElement("ul");
    ulEl.classList= "Ingredients";
    outText.appendChild(ulEl);

    //createing list of ingredients and displaying 
    for(let i = 0; i < recipe.ingredients.length; i++)
    {
        const outIngredients = document.createElement("li");
        outIngredients.textContent = recipe.ingredients[i];
        ulEl.appendChild(outIngredients);
    }

    //Conatiner for instructions list
    const div = document.createElement("div");
    div.classList = "InstructionsDiv";

    const InstLabel = document.createElement("h3");
    InstLabel.textContent = "Instructions :"

    //Creating the list for instructions
}
    

