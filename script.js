let questions = [];
let currentQuestion = 0;
let userAnswers = {};
let flaggedQuestions = [];
let quizGraded = false;
let quizTitle = '';

function closeDialog() {
	const dialog = document.getElementById("dialog");
	dialog.close();
};

function openDialog() {
	const dialog = document.getElementById("dialog");
	dialog.showModal();
}

function loadSelectedJsonFile() {  // Get the user selection in the drop-down menu for selection of the group
    const dropdown = document.getElementById("quizDropdown");
    const selectedFile = dropdown.value;

    if (!selectedFile) return;
	flaggedQuestions = [];
	quizGraded = false;

    quizTitle = dropdown.options[dropdown.selectedIndex].text; // Get quiz title from dropdown
    document.getElementById("title").innerText = quizTitle; // Update quiz title in the <h1>

    selectSections(selectedFile);
}

function selectSections(file) {  //Load the file for selections and populate the "dropdown"
	fetch(file)
		.then(response => response.json())
        .then(data => {
            const files = data.files;
            const listItem = document.getElementById("list");
			listItem.innerHTML = "";
            files.forEach(file => {
				const div = document.createElement("div");
				div.id = file.title;
				listItem.appendChild(div);
				const dropdown = document.getElementById(file.title);
                const checkbox = document.createElement("input");
                checkbox.value = file.file;
				checkbox.id = file.file;
				checkbox.type = "checkbox";
                checkbox.innerText = file.title;
                dropdown.appendChild(checkbox);
				const text = document.createElement("label");
				text.for = file.file;
				text.innerText = file.title;
				dropdown.appendChild(text);
            });
        })
        .catch(error => {
            console.error("Error loading file.json:", error);
        });
}

function collectAndLoadQuestions() {
    const checkboxes = document.querySelectorAll("#list input[type='checkbox']:checked");
    const selectedFiles = Array.from(checkboxes).map(checkbox => checkbox.value);
	const selectedSection = document.getElementById("quizDropdown");

    if ((selectedFiles.length > 0) && (selectedSection.value !== "")) {
        loadQuestions(selectedFiles); // Call loadQuestions with selected files.
		closeDialog();
    } else {
        alert("Please select at least one question file.");
    };
}

function loadIndex() {  // Load index.json file then populate the dropdown 
    fetch("index.json")
        .then(response => response.json())
        .then(data => {
            const files = data.files;
            const dropdown = document.getElementById("quizDropdown");
            files.forEach(file => {
                const option = document.createElement("option");
                option.value = file.file;
                option.innerText = file.title;
                dropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error loading index.json:", error);
        });
		
	openDialog();
}

function toggleFlag() {
    const questionIndex = currentQuestion;
    if (flaggedQuestions.includes(questionIndex)) {
        flaggedQuestions = flaggedQuestions.filter(q => q !== questionIndex);
    } else {
        flaggedQuestions.push(questionIndex);
    }
    setCookie("flaggedQuestions", JSON.stringify(flaggedQuestions), 7);
    renderQuestionList();
}

/*function loadQuestions(file) {     //TODO add capability to handle multiple files.
	console.log (file);
    fetch(file)
        .then(response => response.json())
        .then(data => {
            questions = data;
            shuffleArray(questions);
			questions.forEach(question => {
                shuffleArray(question.options);
            });
            renderQuestionList();
            displayQuestion();
            document.getElementById("scoreDisplay").innerText = `Score: Not graded yet`;
        })
        .catch(error => {
            console.error("Error loading questions file:", error);
        });
}
*/

function loadQuestions(files) {
    console.log("Loading files:", files);
	questions = [];
    //let questions = []; // Initialize an array to hold all questions.

    // Fetch all files, process them, and combine their data.
    Promise.all(
        files.map(file =>
            fetch(file)
                .then(response => response.json())
                .catch(error => {
                    console.error(`Error loading file ${file}:`, error);
                    return []; // Return an empty array for failed files.
                })
        )
    )
    .then(results => {
        // Combine all questions from the loaded files.
        results.forEach(data => {
            questions = questions.concat(data);
        });

        // Shuffle the combined questions.
        shuffleArray(questions);

        // Shuffle options for each question.
        questions.forEach(question => {
            shuffleArray(question.options);
        });

        // reset everything;
		currentQuestion = 0;
		userAnswers = {};
		flaggedQuestions = [];
		quizGraded = false;
        renderQuestionList();
        displayQuestion();
		
        // Update the score display.
        document.getElementById("scoreDisplay").innerText = `Score: Not graded yet`;
    })
    .catch(error => {
        console.error("Error processing question files:", error);
    });
}

function renderQuestionList() {
    const questionList = document.getElementById("questionList");
    questionList.innerHTML = "";
    questions.forEach((question, index) => {
        const listItem = document.createElement("li");
        listItem.innerText = `Question ${index + 1}`;
        if (flaggedQuestions.includes(index)) {
            listItem.innerText += " 🚩"; // Add flag emoji if flagged
        }
        listItem.className = flaggedQuestions.includes(index) ? "flagged" : "";
        if (currentQuestion == index) {
            listItem.style.fontWeight =  "bold";
        }
        if (quizGraded) {
			console.log(quizGraded);
            const isCorrect = userAnswers[index] === question.answer;
            listItem.style.color = isCorrect ? "green" : "red";
            listItem.innerText += isCorrect ? " ✅" : " ❌";
        }
        listItem.onclick = () => {
            currentQuestion = index;
            displayQuestion();
            renderQuestionList();
        };
        questionList.appendChild(listItem);
    });
}

function displayQuestion() {
    const questionData = questions[currentQuestion];
    const questionElement = document.getElementById("question");
    const optionsForm = document.getElementById("optionsForm");

    questionElement.innerText = questionData.question;
    optionsForm.innerHTML = ""; // Clear previous options

    questionData.options.forEach(option => {
        const optionContainer = document.createElement("div");
        const optionInput = document.createElement("input");
        optionInput.type = "radio";
        optionInput.name = "option";
        optionInput.value = option;
        optionInput.checked = userAnswers[currentQuestion] === option;

        optionInput.onclick = () => selectOption(option);

        const optionLabel = document.createElement("label");
        optionLabel.innerText = option;
        optionContainer.appendChild(optionInput);
        optionContainer.appendChild(optionLabel);
        optionsForm.appendChild(optionContainer);
		
		        if (quizGraded && option === questions[currentQuestion].answer) {
            optionLabel.style.color = "green";
            optionLabel.style.fontWeight = "bold"; // Optional: Bold the correct answer
        }
    });
	
	
}

function selectOption(selected) {
    userAnswers[currentQuestion] = selected;
}

function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        displayQuestion();
        renderQuestionList();
    }
}

function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        displayQuestion();
        renderQuestionList();
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}

function gradeQuiz() {
    let score = 0;
    questions.forEach((question, index) => {
        const isCorrect = userAnswers[index] === question.answer;
        if (isCorrect) score++;
    });

    // Calculate the percentage
    const percentage = ((score / questions.length) * 100).toFixed(2); // rounded to 2 decimal places

    // Update the score display with raw score and percentage
    document.getElementById("scoreDisplay").innerText = `Score: ${score} / ${questions.length} (${percentage}%)`;
    quizGraded = true;
    renderQuestionList();
    displayQuestion();
}

// Load index.json and populate the dropdown when the page is ready
document.addEventListener("DOMContentLoaded", () => {
    loadIndex();
});