import unittest
import json
from app import app, generator

class TestMathsForKidApp(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_index_route(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Maths for Kid", response.data)

    def test_api_new_paper_default(self):
        response = self.client.get('/api/paper/new?count=200')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["paper"]["total_questions"], 200)
        self.assertEqual(len(data["paper"]["questions"]), 200)

        # Check levels and operations distribution
        questions = data["paper"]["questions"]
        levels = set(q["level"] for q in questions)
        operations = set(q["operation"] for q in questions)
        self.assertEqual(levels, {"basic", "medium", "advance"})
        self.assertEqual(operations, {"addition", "subtraction", "multiplication", "division"})

    def test_api_evaluate_paper(self):
        # 1. Generate a paper
        gen_res = self.client.get('/api/paper/new?count=10')
        paper_data = json.loads(gen_res.data)["paper"]
        paper_id = paper_data["paper_id"]
        questions = paper_data["questions"]

        # Simulate 7 correct and 3 wrong
        user_answers = {}
        for i, q in enumerate(questions):
            if i < 7:
                user_answers[str(q["id"])] = q["answer"]
            else:
                user_answers[str(q["id"])] = q["answer"] + 99 # deliberate mistake

        eval_res = self.client.post('/api/paper/evaluate', json={
            "paper_id": paper_id,
            "user_answers": user_answers,
            "time_spent_seconds": 45,
            "paper_data": paper_data
        })

        self.assertEqual(eval_res.status_code, 200)
        eval_data = json.loads(eval_res.data)
        self.assertEqual(eval_data["status"], "success")
        ev = eval_data["evaluation"]

        self.assertEqual(ev["rights"], 7)
        self.assertEqual(ev["wrongs"], 3)
        self.assertEqual(ev["accuracy"], 70.0)
        self.assertEqual(len(ev["wrong_details"]), 3)

        # Verify operation breakdown exists
        for op in ["addition", "subtraction", "multiplication", "division"]:
            self.assertIn(op, ev["operation_breakdown"])

        # Verify level breakdown exists
        for lvl in ["basic", "medium", "advance"]:
            self.assertIn(lvl, ev["level_breakdown"])

    def test_batch_generate_api(self):
        batch_res = self.client.post('/api/generator/batch', json={
            "n": 2,
            "questions": 20,
            "mode": "progressive"
        })
        self.assertEqual(batch_res.status_code, 200)
        data = json.loads(batch_res.data)
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["count_generated"], 2)

    def test_print_paper_route(self):
        res = self.client.get('/print-paper?count=50&show_answers=1')
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Answer Key", res.data)

if __name__ == "__main__":
    unittest.main()
