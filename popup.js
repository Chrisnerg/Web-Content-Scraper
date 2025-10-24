 let recipeObj2 = {
    title: "N/A",
    source: window.location.href,
    servings: "N/A",
    cooktime: "N/A",
    ingredients: [],
    instructions: [],
    savedAt: new Date().toISOString()
};

    let Recipes = [];
    let recipeString = localStorage.getItem("recipes");

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
                recipeObj2 = result.data;
                Recipes.push(recipeObj2);
                localStorage.setItem("recipes",JSON.stringify(Recipes));
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

    // If we received an array of recipes, loop through each
    const recipes = Array.isArray(recipe) ? recipe : [recipe];

     recipes.forEach((recipe) => {
        // --- Recipe Container ---
        const recipeDiv = document.createElement("div");
        recipeDiv.classList.add("recipe-container");

        // --- Recipe Title ---
        const outTitle = document.createElement("h2");
        outTitle.classList = "recipeInfo";
        outTitle.textContent = recipe.title !== "N/A" ? recipe.title : "Untitled Recipe";
        recipeDiv.appendChild(outTitle);

        // --- Total Time ---
        const Time = document.createElement("h3");
        Time.textContent = `Total Time: ${recipe.cooktime || "N/A"}`;
        recipeDiv.appendChild(Time);

        // --- Ingredients ---
        const Label = document.createElement("h3");
        Label.textContent = "Ingredients:";
        recipeDiv.appendChild(Label);

        const ulEl = document.createElement("ul");
        ulEl.classList = "Ingredients";
        recipe.ingredients?.forEach((ingredient) => {
            const li = document.createElement("li");
            li.textContent = ingredient;
            ulEl.appendChild(li);
        });
        recipeDiv.appendChild(ulEl);

        // --- Instructions ---
        const div = document.createElement("div");
        div.classList = "InstructionsDiv";

        const InstLabel = document.createElement("h3");
        InstLabel.textContent = "Instructions:";
        div.appendChild(InstLabel);

        const InstUl = document.createElement("ul");
        InstUl.classList = "Instructions";
        recipe.instructions?.forEach((instruction, i) => {
            const li = document.createElement("li");
            li.innerHTML = `<b>Step ${i + 1}:</b> ${instruction}`;
            InstUl.appendChild(li);
        });
        div.appendChild(InstUl);

        recipeDiv.appendChild(div);

        // --- Append the recipe container to the main output ---
        outText.appendChild(recipeDiv);
    });
}
    
//Loading saved recipes in local storage to the extension UI
    if(recipeString)
    {
        try{
            Recipes = JSON.parse(recipeString);
        }catch (e)
        {
            Recipes = [];
            console.error("Failed to load saved leads:", e);
        }
        DisplayRecipe(Recipes);
    }

//Clearing contents in the popup extension
const btnClear = document.querySelector("#btnDelete");
const outText = document.querySelector("#recipe");
const InstText = document.querySelector("InstructionsDiv");
btnClear.addEventListener("click", (e) => {
    localStorage.removeItem("recipes");
    Recipes = [];
    if (outText) outText.innerHTML = "";
    if (InstText) InstText.innerHTML = "";
})

//Creating File for the recipes saved
btnExport.addEventListener('click', async () => {
    const jsPDFCtor = window.jspdf?.jsPDF;
    if (!jsPDFCtor) {
        console.error("jsPDF not loaded.");
        return;
    }
    const pdf = new jsPDFCtor();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20; // vertical starting position

    // helper to print wrapped lines and add pages when necessary
    function printWrapped(text, x) {
        if (!text) return;
        const lines = pdf.splitTextToSize(text, maxWidth);
        const fontSize = pdf.internal.getFontSize ? pdf.internal.getFontSize() : 12;
        const lineHeight = fontSize * 1.15; // tuning factor
        for (const line of lines) {
            if (y + lineHeight > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }
            pdf.text(line, x, y);
            y += lineHeight;
        }
    }

    // Title
    pdf.setFontSize(20);
    pdf.text("My Recipes", pageWidth / 2, y, { align: "center" });
    y += 15;
    pdf.setFontSize(12);

    (Recipes || []).forEach((recipe, i) => {
        // Header
        const header = `Recipe ${i + 1}: ${recipe.title || "Untitled Recipe"}`;
        pdf.setFontSize(16);
        printWrapped(header, margin);
        y += 6; // small gap after header
        pdf.setFontSize(12);

        printWrapped(`Source: ${recipe.source || "N/A"}`, margin);
        // no extra y += here
        printWrapped(`Cook Time: ${recipe.cooktime || "N/A"}`, margin);
        // no extra y += here
        printWrapped(`Servings: ${recipe.servings || "N/A"}`, margin);
        // no extra y += here

        // Ingredients
        pdf.setFontSize(12);
        printWrapped("Ingredients:", margin);
        // do not add manual spacing here
        if (recipe.ingredients && recipe.ingredients.length) {
            recipe.ingredients.forEach(ing => {
                // printWrapped will advance y; no additional y +=
                printWrapped(`• ${ing}`, margin + 5);
            });
        } else {
            printWrapped("No ingredients listed.", margin + 5);
        }

        // Instructions (directly after ingredients, no extra spacing)
        pdf.setFontSize(12);
        printWrapped("Instructions:", margin);
        if (recipe.instructions && recipe.instructions.length) {
            recipe.instructions.forEach((step, idx) => {
                printWrapped(`${idx + 1}. ${step}`, margin + 5);
            });
        } else {
            printWrapped("No instructions provided.", margin + 5);
        }

        // Footer
        printWrapped(`Saved on: ${new Date(recipe.savedAt).toLocaleString()}`, margin);

        // Ensure spacing before next recipe (if needed)
        if (y > pageHeight - margin && i !== Recipes.length - 1) {
            pdf.addPage();
            y = margin;
        } else {
            // small separator between recipes
            y += 8;
        }
    });

    pdf.save("recipes.pdf");
});

