import unittest
import os
import shutil
from generator import (
    MathProblemGenerator,
    LEVEL_BASIC, LEVEL_MEDIUM, LEVEL_ADVANCE,
    OP_ADD, OP_SUB, OP_MUL, OP_DIV
)

class TestMathProblemGenerator(unittest.TestCase):
    def setUp(self):
        self.gen = MathProblemGenerator(seed=42)

    def test_basic_level_constraints(self):
        for op in [OP_ADD, OP_SUB, OP_MUL, OP_DIV]:
            for _ in range(30):
                p = self.gen.generate_single_problem(LEVEL_BASIC, op)
                self.assertEqual(p["level"], LEVEL_BASIC)
                self.assertIsInstance(p["answer"], int)
                if op == OP_ADD:
                    self.assertTrue(1 <= p["num1"] <= 9)
                    self.assertTrue(1 <= p["num2"] <= 9)
                    self.assertEqual(p["num1"] + p["num2"], p["answer"])
                elif op == OP_SUB:
                    self.assertTrue(p["num1"] >= p["num2"])
                    self.assertTrue(p["answer"] >= 0)
                    self.assertEqual(p["num1"] - p["num2"], p["answer"])
                elif op == OP_MUL:
                    self.assertTrue(1 <= p["num1"] <= 9)
                    self.assertTrue(1 <= p["num2"] <= 9)
                    self.assertEqual(p["num1"] * p["num2"], p["answer"])
                elif op == OP_DIV:
                    self.assertEqual(p["num1"] % p["num2"], 0, "Division must be clean integer with 0 remainder")
                    self.assertEqual(p["num1"] // p["num2"], p["answer"])

    def test_medium_level_constraints(self):
        for op in [OP_ADD, OP_SUB, OP_MUL, OP_DIV]:
            for _ in range(30):
                p = self.gen.generate_single_problem(LEVEL_MEDIUM, op)
                self.assertEqual(p["level"], LEVEL_MEDIUM)
                self.assertIsInstance(p["answer"], int)
                if op == OP_ADD:
                    self.assertTrue(10 <= p["num1"] <= 99)
                    self.assertTrue(10 <= p["num2"] <= 99)
                    self.assertEqual(p["num1"] + p["num2"], p["answer"])
                elif op == OP_SUB:
                    self.assertTrue(p["num1"] >= p["num2"])
                    self.assertTrue(p["answer"] >= 0)
                    self.assertEqual(p["num1"] - p["num2"], p["answer"])
                elif op == OP_MUL:
                    self.assertEqual(p["num1"] * p["num2"], p["answer"])
                elif op == OP_DIV:
                    self.assertEqual(p["num1"] % p["num2"], 0)
                    self.assertEqual(p["num1"] // p["num2"], p["answer"])

    def test_advance_level_constraints(self):
        for op in [OP_ADD, OP_SUB, OP_MUL, OP_DIV]:
            for _ in range(30):
                p = self.gen.generate_single_problem(LEVEL_ADVANCE, op)
                self.assertEqual(p["level"], LEVEL_ADVANCE)
                self.assertIsInstance(p["answer"], int)
                if op == OP_ADD:
                    self.assertTrue(100 <= p["num1"] <= 999)
                    self.assertTrue(100 <= p["num2"] <= 999)
                    self.assertEqual(p["num1"] + p["num2"], p["answer"])
                elif op == OP_SUB:
                    self.assertTrue(p["num1"] >= p["num2"])
                    self.assertTrue(p["answer"] >= 0)
                    self.assertEqual(p["num1"] - p["num2"], p["answer"])
                elif op == OP_MUL:
                    self.assertEqual(p["num1"] * p["num2"], p["answer"])
                elif op == OP_DIV:
                    self.assertEqual(p["num1"] % p["num2"], 0)
                    self.assertEqual(p["num1"] // p["num2"], p["answer"])

    def test_paper_generation_200_questions(self):
        paper = self.gen.generate_paper(total_questions=200)
        self.assertEqual(paper["total_questions"], 200)
        self.assertEqual(len(paper["questions"]), 200)

        # Check distribution
        levels = [q["level"] for q in paper["questions"]]
        ops = [q["operation"] for q in paper["questions"]]

        # All 3 levels present
        self.assertTrue(levels.count(LEVEL_BASIC) > 50)
        self.assertTrue(levels.count(LEVEL_MEDIUM) > 50)
        self.assertTrue(levels.count(LEVEL_ADVANCE) > 50)

        # All 4 operations present
        self.assertTrue(ops.count(OP_ADD) > 40)
        self.assertTrue(ops.count(OP_SUB) > 40)
        self.assertTrue(ops.count(OP_MUL) > 40)
        self.assertTrue(ops.count(OP_DIV) > 40)

    def test_batch_paper_generation(self):
        test_dir = "test_output_papers"
        try:
            papers = self.gen.generate_n_papers(n=3, total_questions=50, output_dir=test_dir)
            self.assertEqual(len(papers), 3)
            self.assertTrue(os.path.exists(os.path.join(test_dir, "paper_001.json")))
            self.assertTrue(os.path.exists(os.path.join(test_dir, "paper_002.json")))
            self.assertTrue(os.path.exists(os.path.join(test_dir, "paper_003.json")))
        finally:
            if os.path.exists(test_dir):
                shutil.rmtree(test_dir)

if __name__ == "__main__":
    unittest.main()
