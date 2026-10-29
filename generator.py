"""
Maths for Kid - Math Problem & Paper Generator
Generates randomized arithmetic questions across Addition, Subtraction,
Multiplication, and Division for Basic (single digit), Medium (double digit),
and Advance (triple digit) levels.
"""

import random
import json
import os
from typing import List, Dict, Any, Optional

# Difficulty Level Constants
LEVEL_BASIC = "basic"        # Single digit
LEVEL_MEDIUM = "medium"      # Double digit
LEVEL_ADVANCE = "advance"    # Triple digit

LEVELS = [LEVEL_BASIC, LEVEL_MEDIUM, LEVEL_ADVANCE]

# Operation Constants
OP_ADD = "addition"
OP_SUB = "subtraction"
OP_MUL = "multiplication"
OP_DIV = "division"

OPERATIONS = [OP_ADD, OP_SUB, OP_MUL, OP_DIV]

OP_SYMBOLS = {
    OP_ADD: "+",
    OP_SUB: "-",
    OP_MUL: "×",
    OP_DIV: "÷"
}

LEVEL_LABELS = {
    LEVEL_BASIC: "Basic (Single Digit)",
    LEVEL_MEDIUM: "Medium (Double Digit)",
    LEVEL_ADVANCE: "Advance (Triple Digit)"
}


class MathProblemGenerator:
    """Core generator class for generating single math problems and complete papers."""

    def __init__(self, seed: Optional[int] = None):
        self.rng = random.Random(seed)

    def generate_single_problem(self, level: str, operation: str, q_id: int = 1) -> Dict[str, Any]:
        """
        Generate a single math problem based on level and operation.
        Guarantees clean, non-negative, whole integer answers suitable for 11-year-olds.
        """
        if level not in LEVELS:
            level = LEVEL_BASIC
        if operation not in OPERATIONS:
            operation = OP_ADD

        num1 = 0
        num2 = 0
        answer = 0
        hint = ""

        if level == LEVEL_BASIC:
            # Single digit (1-9)
            if operation == OP_ADD:
                num1 = self.rng.randint(1, 9)
                num2 = self.rng.randint(1, 9)
                answer = num1 + num2
                hint = f"Count up from {max(num1, num2)} by {min(num1, num2)}. {num1} + {num2} = {answer}."

            elif operation == OP_SUB:
                num1 = self.rng.randint(1, 9)
                num2 = self.rng.randint(1, 9)
                if num1 < num2:
                    num1, num2 = num2, num1  # Ensure non-negative answer
                answer = num1 - num2
                hint = f"Start at {num1} and take away {num2}. {num1} - {num2} = {answer}."

            elif operation == OP_MUL:
                num1 = self.rng.randint(1, 9)
                num2 = self.rng.randint(1, 9)
                answer = num1 * num2
                hint = f"Think of {num1} groups of {num2}. {num1} × {num2} = {answer}."

            elif operation == OP_DIV:
                divisor = self.rng.randint(1, 9)
                quotient = self.rng.randint(1, 9)
                dividend = divisor * quotient
                num1, num2 = dividend, divisor
                answer = quotient
                hint = f"How many times does {num2} go into {num1}? Since {num2} × {answer} = {num1}, {num1} ÷ {num2} = {answer}."

        elif level == LEVEL_MEDIUM:
            # Double digit (10-99)
            if operation == OP_ADD:
                num1 = self.rng.randint(10, 99)
                num2 = self.rng.randint(10, 99)
                answer = num1 + num2
                hint = f"Add ones first ({num1%10} + {num2%10} = {(num1%10)+(num2%10)}), then add tens ({num1//10}0 + {num2//10}0 = {(num1//10 + num2//10)*10}). Total = {answer}."

            elif operation == OP_SUB:
                num1 = self.rng.randint(10, 99)
                num2 = self.rng.randint(10, 99)
                if num1 < num2:
                    num1, num2 = num2, num1
                answer = num1 - num2
                hint = f"Subtract ones, regroup from tens if needed. {num1} - {num2} = {answer}."

            elif operation == OP_MUL:
                # Double digit × single/small double digit
                num1 = self.rng.randint(10, 99)
                num2 = self.rng.randint(2, 15)
                # 50% chance swap to vary presentation
                if self.rng.random() < 0.3:
                    num1, num2 = num2, num1
                    answer = num1 * num2
                else:
                    answer = num1 * num2
                hint = f"Multiply step by step: break it into parts or use column multiplication. {num1} × {num2} = {answer}."

            elif operation == OP_DIV:
                divisor = self.rng.randint(2, 12)
                quotient = self.rng.randint(10, 50)
                dividend = divisor * quotient
                num1, num2 = dividend, divisor
                answer = quotient
                hint = f"Divide {num1} by {num2}. Since {num2} × {answer} = {num1}, the answer is {answer}."

        elif level == LEVEL_ADVANCE:
            # Triple digit (100-999)
            if operation == OP_ADD:
                num1 = self.rng.randint(100, 999)
                num2 = self.rng.randint(100, 999)
                answer = num1 + num2
                hint = f"Line up the hundreds, tens, and ones columns. Carry over where sum ≥ 10. {num1} + {num2} = {answer}."

            elif operation == OP_SUB:
                num1 = self.rng.randint(100, 999)
                num2 = self.rng.randint(100, 999)
                if num1 < num2:
                    num1, num2 = num2, num1
                answer = num1 - num2
                hint = f"Line up columns and borrow from adjacent columns when needed. {num1} - {num2} = {answer}."

            elif operation == OP_MUL:
                num1 = self.rng.randint(100, 999)
                num2 = self.rng.randint(2, 20)
                if self.rng.random() < 0.2:
                    num1, num2 = num2, num1
                answer = num1 * num2
                hint = f"Multiply {num1} by {num2}. Break down into {num2} × (hundreds + tens + ones). Total = {answer}."

            elif operation == OP_DIV:
                divisor = self.rng.randint(2, 25)
                # Keep dividend in triple digits (100-999)
                max_quotient = 999 // divisor
                min_quotient = max(10, 100 // divisor)
                if min_quotient > max_quotient:
                    divisor = self.rng.randint(2, 10)
                    min_quotient = 100 // divisor
                    max_quotient = 999 // divisor

                quotient = self.rng.randint(min_quotient, max_quotient)
                dividend = divisor * quotient
                num1, num2 = dividend, divisor
                answer = quotient
                hint = f"Use long division: divide {num1} by {num2} to find how many equal parts. Answer: {answer}."

        return {
            "id": q_id,
            "level": level,
            "level_label": LEVEL_LABELS[level],
            "operation": operation,
            "symbol": OP_SYMBOLS[operation],
            "num1": num1,
            "num2": num2,
            "display": f"{num1} {OP_SYMBOLS[operation]} {num2}",
            "question_text": f"{num1} {OP_SYMBOLS[operation]} {num2} = ?",
            "answer": answer,
            "hint": hint
        }

    def generate_paper(
        self,
        paper_id: int = 1,
        paper_title: str = "Maths for Kid - Practice Paper",
        total_questions: int = 200,
        selected_levels: Optional[List[str]] = None,
        selected_operations: Optional[List[str]] = None,
        order_mode: str = "progressive"  # "progressive" (Basic -> Medium -> Advance) or "shuffled"
    ) -> Dict[str, Any]:
        """
        Generate a complete exam/practice paper with specified questions, distributed across
        levels and operations.
        """
        if selected_levels is None or len(selected_levels) == 0:
            selected_levels = list(LEVELS)
        if selected_operations is None or len(selected_operations) == 0:
            selected_operations = list(OPERATIONS)

        questions = []
        num_levels = len(selected_levels)
        num_ops = len(selected_operations)

        # Distribute count evenly across levels
        base_per_level = total_questions // num_levels
        remainder = total_questions % num_levels

        q_id = 1
        for idx, lvl in enumerate(selected_levels):
            level_count = base_per_level + (1 if idx < remainder else 0)
            
            # Distribute level_count across operations
            base_per_op = level_count // num_ops
            op_rem = level_count % num_ops

            level_questions = []
            for op_idx, op in enumerate(selected_operations):
                op_count = base_per_op + (1 if op_idx < op_rem else 0)
                for _ in range(op_count):
                    problem = self.generate_single_problem(level=lvl, operation=op, q_id=q_id)
                    level_questions.append(problem)
                    q_id += 1

            # Shuffle inside the level so operations are mixed
            self.rng.shuffle(level_questions)
            questions.extend(level_questions)

        if order_mode == "shuffled":
            self.rng.shuffle(questions)

        # Re-number IDs sequentially from 1 to total_questions
        for i, q in enumerate(questions, 1):
            q["id"] = i

        return {
            "paper_id": paper_id,
            "title": f"{paper_title} #{paper_id}",
            "total_questions": len(questions),
            "levels_included": selected_levels,
            "operations_included": selected_operations,
            "order_mode": order_mode,
            "questions": questions
        }

    def generate_n_papers(
        self,
        n: int,
        total_questions: int = 200,
        selected_levels: Optional[List[str]] = None,
        selected_operations: Optional[List[str]] = None,
        order_mode: str = "progressive",
        output_dir: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generates N full papers. Optionally saves them to JSON files in output_dir.
        """
        papers = []
        for i in range(1, n + 1):
            paper = self.generate_paper(
                paper_id=i,
                paper_title="Maths for Kid - Practice Paper",
                total_questions=total_questions,
                selected_levels=selected_levels,
                selected_operations=selected_operations,
                order_mode=order_mode
            )
            papers.append(paper)

            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
                file_path = os.path.join(output_dir, f"paper_{i:03d}.json")
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(paper, f, indent=2)

        return papers


# CLI entry point for generating arbitrary N papers from terminal
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate N practice papers for Maths for Kid")
    parser.add_argument("-n", "--papers", type=int, default=1, help="Number of papers to generate (default: 1)")
    parser.add_argument("-q", "--questions", type=int, default=200, help="Number of questions per paper (default: 200)")
    parser.add_argument("-o", "--output", type=str, default="papers", help="Output directory to save generated papers")
    parser.add_argument("-m", "--mode", type=str, default="progressive", choices=["progressive", "shuffled"], help="Ordering mode")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducibility")

    args = parser.parse_args()

    gen = MathProblemGenerator(seed=args.seed)
    output_folder = os.path.abspath(args.output)
    print(f"Generating {args.papers} paper(s) with {args.questions} questions each...")
    generated = gen.generate_n_papers(
        n=args.papers,
        total_questions=args.questions,
        order_mode=args.mode,
        output_dir=output_folder
    )
    print(f"Successfully generated {len(generated)} papers into '{output_folder}'!")
    for p in generated:
        print(f" - {p['title']}: {p['total_questions']} questions ready.")
