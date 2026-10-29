# 🚀 Maths for Kid

An interactive, gamified math practice application and analytical dashboard designed specifically for 11-year-olds. It challenges students with customizable papers up to **200 questions** spanning **Addition, Subtraction, Multiplication, and Division** across **Basic**, **Medium**, and **Advance** difficulty levels.

---

## 🌟 Key Features

### 1. Three Progressive Difficulty Levels
- **🟢 Basic (Single Digit)**: Operands from $1$ to $9$ (e.g., $7 + 8$, $9 - 4$, $6 \times 7$, $45 \div 5$).
- **🟡 Medium (Double Digit)**: Operands from $10$ to $99$ (e.g., $48 + 37$, $92 - 45$, $24 \times 6$, $96 \div 4$).
- **🔴 Advance (Triple Digit)**: Operands from $100$ to $999$ (e.g., $342 + 589$, $814 - 367$, $125 \times 8$, $720 \div 15$).
*All division questions are engineered to yield clean, exact whole integer quotients (no awkward fractions or infinite decimals), and subtractions ensure positive/non-negative results.*

### 2. Four Core Arithmetic Operations
- ➕ **Addition**
- ➖ **Subtraction**
- ✖️ **Multiplication**
- ➗ **Division**

### 3. Comprehensive Performance & Mistake Dashboard
The analytics engine records every practice run and pinpoints **where mistakes occur**:
- **Overall Statistics**: Total Questions, Rights (✅), Wrongs (❌), Accuracy Score (%), Time Spent.
- **Mistake Breakdown by Operation**:
  - Addition: Rights, Wrongs, Accuracy %
  - Subtraction: Rights, Wrongs, Accuracy %
  - Multiplication: Rights, Wrongs, Accuracy %
  - Division: Rights, Wrongs, Accuracy %
- **Performance by Level**:
  - Basic (Single Digit) vs. Medium (Double Digit) vs. Advance (Triple Digit).
- **"Where Wrongs Happened" Deep Dive**:
  - Lists every question missed with the student's answer vs. the correct answer.
  - Includes a step-by-step hint explaining how to solve it correctly.
  - **"🔄 Practice Wrongs Only" Button**: Instantly generates a targeted mini-drill focusing exclusively on the missed questions until mastery!

### 4. Interactive & Engaging UI for an 11-Year-Old
- **Avatar Selector**: Choose your math hero (🐱 Astro Cat, 🤖 Robo-Math, 🥷 Number Ninja, 🐲 Flame Dragon, 🦊 Cyber Fox, 🧙‍♂️ Math Wizard).
- **Streak Multiplier 🔥**: Real-time combo streak counter that celebrates continuous correct answers.
- **Audio Synthesizer Engine**: 100% offline Web Audio API sound effects (melodic chimes for correct answers, gentle encouraging tones for mistakes, victory fanfares on completion).
- **Confetti Celebrations**: Smooth canvas particle showers for high streaks and paper completions.
- **Integrated Virtual Scratchpad ✏️**: Collapsible on-screen drawing whiteboard with pen, highlighter, and eraser tools so students can do rough work and column carrying right on the screen.
- **200-Question Grid Navigator**: Live map of questions 1 through 200 with instant color coding (answered, unanswered, flagged for review).

### 5. Python Random Paper Generator (`generator.py`)
Powered by Python's standard `random` library to generate any $N$ number of papers with answer keys:
- **CLI generation**: Generate 1, 5, 10, or 50 papers straight from the command line.
- **Exportable / Printable Worksheets**: Print-ready 4-column test papers with student name, date, score boxes, and separate answer key sheets.

---

## 💻 Easy Setup & Running on Laptop

### Quick 1-Click Launch (Windows)
Double-click **`run.bat`** in the project folder:
```
C:\Users\admin\.gemini\antigravity\scratch\Maths-for-Kid\run.bat
```
It will automatically start the server and open your default browser at `http://127.0.0.1:5000`.

### Manual Launch via Terminal
1. Navigate to the project folder:
   ```powershell
   cd "C:\Users\admin\.gemini\antigravity\scratch\Maths-for-Kid"
   ```
2. Run the application:
   ```powershell
   python app.py
   ```
3. Open your browser to:
   ```
   http://127.0.0.1:5000
   ```

---

## 🖨️ Generating $N$ Papers from Python CLI

You can generate any number of papers directly using Python's `random` engine:

```powershell
# Generate 5 complete 200-question papers into the "papers" folder
python generator.py --papers 5 --questions 200 --output papers

# Generate 3 fast 50-question papers in shuffled order
python generator.py --papers 3 --questions 50 --mode shuffled --output papers
```

Each generated paper includes full question metadata, display strings, and answers saved cleanly in JSON format.

---

## 📁 Project Structure

```
Maths-for-Kid/
├── app.py                 # Flask server with REST APIs for evaluation & history
├── generator.py           # Core math problem generator using Python's random module
├── test_generator.py      # Unit tests for generator logic and difficulty constraints
├── test_app.py            # Integration tests for API routes and evaluation engine
├── run.bat                # 1-click Windows launcher (opens browser automatically)
├── requirements.txt       # Dependencies (flask>=3.0.0)
├── README.md              # Project documentation
├── templates/
│   ├── index.html         # Main interactive web app, quest card & dashboard
│   └── print_paper.html   # Clean printable 4-column worksheet & answer key
├── static/
│   ├── css/
│   │   └── style.css      # Vibrant, gamified stylesheet
│   └── js/
│       ├── audio.js       # Offline Web Audio API sound synthesizer
│       └── app.js         # Frontend app logic, scratchpad, timer, confetti, state
└── papers/                # Directory storing batch generated JSON papers
```

---

## 🧪 Testing

Run automated tests to verify arithmetic rules, whole number divisions, and evaluation accuracy:
```powershell
python test_generator.py
python test_app.py
```
Both test suites verify 100% correctness of problem generation, level constraints, non-negative results, and clean zero-remainder integer divisions.
