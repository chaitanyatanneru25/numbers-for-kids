"""
Maths for Kid - Interactive Web App & Dashboard Backend
Flask server providing REST API for math practice, live papers, analytics,
and printable paper generation.
"""

import os
import json
import time
from datetime import datetime
from typing import Dict, Any, List
from flask import Flask, render_template, request, jsonify, send_from_directory

from generator import (
    MathProblemGenerator,
    LEVEL_BASIC, LEVEL_MEDIUM, LEVEL_ADVANCE, LEVELS,
    OP_ADD, OP_SUB, OP_MUL, OP_DIV, OPERATIONS, OP_SYMBOLS, LEVEL_LABELS
)

app = Flask(__name__)
app.config["SECRET_KEY"] = "maths-for-kid-super-secret-key-2026"

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
PAPERS_DIR = os.path.join(DATA_DIR, "papers")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")

os.makedirs(PAPERS_DIR, exist_ok=True)

# In-memory storage of recent generated papers: paper_id -> paper_dict
RECENT_PAPERS: Dict[str, Dict[str, Any]] = {}
generator = MathProblemGenerator()


def load_history() -> List[Dict[str, Any]]:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_history_entry(entry: Dict[str, Any]):
    history = load_history()
    history.insert(0, entry)  # newest first
    # Keep last 50 records
    history = history[:50]
    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        print(f"Error saving history: {e}")


@app.route("/")
def index():
    """Main application home page."""
    return render_template("index.html")


@app.route("/api/paper/new", methods=["GET"])
def api_new_paper():
    """
    Generate a new paper.
    Query parameters:
      - count: number of questions (default 200)
      - levels: comma-separated list of levels (default basic,medium,advance)
      - operations: comma-separated list of operations (default addition,subtraction,multiplication,division)
      - mode: progressive or shuffled (default progressive)
    """
    count = request.args.get("count", default=200, type=int)
    # Clamp count to reasonable range 5 to 500
    count = max(5, min(count, 500))

    levels_arg = request.args.get("levels", default="")
    if levels_arg:
        selected_levels = [lvl.strip() for lvl in levels_arg.split(",") if lvl.strip() in LEVELS]
    else:
        selected_levels = list(LEVELS)

    ops_arg = request.args.get("operations", default="")
    if ops_arg:
        selected_ops = [op.strip() for op in ops_arg.split(",") if op.strip() in OPERATIONS]
    else:
        selected_ops = list(OPERATIONS)

    mode = request.args.get("mode", default="progressive")
    if mode not in ["progressive", "shuffled"]:
        mode = "progressive"

    paper_id = f"P-{int(time.time() * 1000) % 1000000:06d}"
    paper = generator.generate_paper(
        paper_id=paper_id,
        paper_title="Maths for Kid Challenge",
        total_questions=count,
        selected_levels=selected_levels,
        selected_operations=selected_ops,
        order_mode=mode
    )

    # Save in memory cache
    RECENT_PAPERS[paper_id] = paper

    # Return paper with question details
    return jsonify({
        "status": "success",
        "paper": paper
    })


@app.route("/api/paper/evaluate", methods=["POST"])
def api_evaluate_paper():
    """
    Evaluate user's submitted paper.
    Expected payload:
    {
      "paper_id": "P-123456",
      "user_answers": { "1": 12, "2": 45, ... },  (key is question id as string or int)
      "time_spent_seconds": 340,
      "paper_data": Optional full paper dict if generated client-side or offline
    }
    """
    data = request.get_json(force=True)
    paper_id = str(data.get("paper_id", ""))
    user_answers = data.get("user_answers", {})
    time_spent = int(data.get("time_spent_seconds", 0))

    paper = RECENT_PAPERS.get(paper_id)
    if not paper and "paper_data" in data:
        paper = data["paper_data"]

    if not paper:
        return jsonify({"status": "error", "message": "Paper not found or expired. Please generate a new paper."}), 404

    questions = paper.get("questions", [])
    total_q = len(questions)

    rights_count = 0
    wrongs_count = 0
    unanswered_count = 0

    # Analytics by Operation
    op_stats = {
        op: {"total": 0, "rights": 0, "wrongs": 0, "unanswered": 0, "symbol": OP_SYMBOLS[op]}
        for op in OPERATIONS
    }

    # Analytics by Level
    level_stats = {
        lvl: {"total": 0, "rights": 0, "wrongs": 0, "unanswered": 0, "label": LEVEL_LABELS[lvl]}
        for lvl in LEVELS
    }

    wrong_details = []
    question_results = []

    for q in questions:
        qid_str = str(q["id"])
        level = q["level"]
        op = q["operation"]
        correct_ans = int(q["answer"])

        if op in op_stats:
            op_stats[op]["total"] += 1
        if level in level_stats:
            level_stats[level]["total"] += 1

        raw_user_ans = user_answers.get(qid_str)
        is_answered = raw_user_ans is not None and str(raw_user_ans).strip() != ""

        user_ans_int = None
        is_correct = False

        if is_answered:
            try:
                user_ans_int = int(str(raw_user_ans).strip())
                is_correct = (user_ans_int == correct_ans)
            except ValueError:
                is_correct = False

            if is_correct:
                rights_count += 1
                if op in op_stats:
                    op_stats[op]["rights"] += 1
                if level in level_stats:
                    level_stats[level]["rights"] += 1
            else:
                wrongs_count += 1
                if op in op_stats:
                    op_stats[op]["wrongs"] += 1
                if level in level_stats:
                    level_stats[level]["wrongs"] += 1

                wrong_details.append({
                    "id": q["id"],
                    "level": level,
                    "level_label": LEVEL_LABELS.get(level, level),
                    "operation": op,
                    "symbol": q["symbol"],
                    "question_text": q["question_text"],
                    "kid_answer": user_ans_int if user_ans_int is not None else str(raw_user_ans),
                    "correct_answer": correct_ans,
                    "hint": q.get("hint", "")
                })
        else:
            unanswered_count += 1
            if op in op_stats:
                op_stats[op]["unanswered"] += 1
            if level in level_stats:
                level_stats[level]["unanswered"] += 1

        question_results.append({
            "id": q["id"],
            "operation": op,
            "level": level,
            "question_text": q["question_text"],
            "user_answer": raw_user_ans,
            "correct_answer": correct_ans,
            "is_correct": is_correct,
            "is_answered": is_answered
        })

    accuracy = round((rights_count / total_q) * 100, 1) if total_q > 0 else 0.0

    # Calculate accuracy percentages for operations and levels
    for op, stats in op_stats.items():
        stats["accuracy"] = round((stats["rights"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0

    for lvl, stats in level_stats.items():
        stats["accuracy"] = round((stats["rights"] / stats["total"]) * 100, 1) if stats["total"] > 0 else 0

    # Generate personalized recommendations & encouragement
    focus_areas = []
    for op, stats in op_stats.items():
        if stats["wrongs"] > 0:
            focus_areas.append(f"{op.capitalize()} ({stats['wrongs']} mistakes)")

    if accuracy >= 95:
        badge = "🏆 Math Grandmaster"
        feedback = "Phenomenal score! Your math reflexes are lightning fast!"
    elif accuracy >= 80:
        badge = "🌟 Math Champion"
        feedback = "Awesome work! Super strong calculation skills!"
    elif accuracy >= 60:
        badge = "🚀 Rising Star"
        feedback = "Great effort! A little targeted practice on the tricky ones and you'll hit 90%+!"
    else:
        badge = "🌱 Math Explorer"
        feedback = "Good practice! Review the step-by-step hints below to level up your score!"

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    evaluation = {
        "paper_id": paper_id,
        "timestamp": now_str,
        "total_questions": total_q,
        "rights": rights_count,
        "wrongs": wrongs_count,
        "unanswered": unanswered_count,
        "accuracy": accuracy,
        "time_spent_seconds": time_spent,
        "badge": badge,
        "feedback": feedback,
        "focus_areas": focus_areas,
        "operation_breakdown": op_stats,
        "level_breakdown": level_stats,
        "wrong_details": wrong_details,
        "question_results": question_results
    }

    # Save to history
    history_entry = {
        "paper_id": paper_id,
        "timestamp": now_str,
        "total_questions": total_q,
        "rights": rights_count,
        "wrongs": wrongs_count,
        "accuracy": accuracy,
        "time_spent_seconds": time_spent,
        "badge": badge,
        "op_summary": {op: {"rights": s["rights"], "wrongs": s["wrongs"]} for op, s in op_stats.items()}
    }
    save_history_entry(history_entry)

    return jsonify({
        "status": "success",
        "evaluation": evaluation
    })


@app.route("/api/history", methods=["GET"])
def api_get_history():
    """Retrieve practice history."""
    return jsonify({
        "status": "success",
        "history": load_history()
    })


@app.route("/api/history/clear", methods=["POST"])
def api_clear_history():
    """Clear practice history."""
    try:
        if os.path.exists(HISTORY_FILE):
            os.remove(HISTORY_FILE)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/generator/batch", methods=["POST"])
def api_batch_generator():
    """
    Batch generate N papers and save them as JSON files in papers/ folder.
    """
    data = request.get_json(force=True)
    n = max(1, min(int(data.get("n", 1)), 50))
    count = max(5, min(int(data.get("questions", 200)), 500))
    mode = data.get("mode", "progressive")

    generated_papers = generator.generate_n_papers(
        n=n,
        total_questions=count,
        order_mode=mode,
        output_dir=PAPERS_DIR
    )

    file_names = [f"paper_{i:03d}.json" for i in range(1, n + 1)]

    return jsonify({
        "status": "success",
        "count_generated": len(generated_papers),
        "files": file_names,
        "papers_folder": PAPERS_DIR
    })


@app.route("/print-paper")
def print_paper():
    """
    Render a clean, high-resolution printable worksheet.
    Query params:
      - count: total questions (default 200)
      - show_answers: 0 or 1
      - paper_id: optional
    """
    count = request.args.get("count", default=200, type=int)
    show_answers = request.args.get("show_answers", default="0") == "1"
    paper_id = request.args.get("paper_id")

    if paper_id and paper_id in RECENT_PAPERS:
        paper = RECENT_PAPERS[paper_id]
    else:
        paper = generator.generate_paper(
            paper_id=f"P-{int(time.time()) % 100000}",
            paper_title="Maths for Kid - Practice Worksheet",
            total_questions=count
        )

    return render_template(
        "print_paper.html",
        paper=paper,
        show_answers=show_answers
    )


if __name__ == "__main__":
    # Launch on localhost:5000
    print("==================================================")
    print(" ⭐ Maths for Kid - Server Starting! ⭐")
    print(" Open your browser at: http://127.0.0.1:5000")
    print("==================================================")
    app.run(host="127.0.0.1", port=5000, debug=True)
